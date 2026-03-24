import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const BULK_ROOT = path.join(__dirname, '../tools/fec-bulk');
const DEFAULT_OUTPUT = path.join(BULK_ROOT, 'reports/people-bulk-compare.json');
const DEFAULT_CYCLES = [2024];
const DEFAULT_TOP = 5;
const DEFAULT_RAW_LIMIT = 20;
const RG_PATTERN_CHUNK_SIZE = 100;
const COMMITTEE_MASTER_PATTERN = /^cm(?: \d+)?\.txt$/i;

const FIELD = {
  committeeId: 0,
  transactionType: 5,
  entityType: 6,
  contributorName: 7,
  contributorState: 9,
  contributorEmployer: 11,
  contributorOccupation: 12,
  contributionDate: 13,
  contributionAmount: 14,
  memoCode: 18,
  memoText: 19,
};

const COMMITTEE_FIELD = {
  committeeId: 0,
  name: 1,
  designation: 8,
  committeeType: 9,
  party: 10,
  filingFrequency: 11,
  organizationType: 12,
  connectedOrganizationName: 13,
  candidateId: 14,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    cycles: DEFAULT_CYCLES,
    top: DEFAULT_TOP,
    ids: [],
    output: DEFAULT_OUTPUT,
    rawLimit: DEFAULT_RAW_LIMIT,
  };

  for (const arg of argv) {
    if (arg.startsWith('--cycles=')) {
      const cycles = arg
        .slice('--cycles='.length)
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value >= 2000);
      if (cycles.length > 0) args.cycles = Array.from(new Set(cycles));
    } else if (arg.startsWith('--top=')) {
      const value = Number.parseInt(arg.slice('--top='.length), 10);
      if (Number.isFinite(value) && value > 0) args.top = value;
    } else if (arg.startsWith('--ids=')) {
      args.ids = arg
        .slice('--ids='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) args.output = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--raw-limit=')) {
      const value = Number.parseInt(arg.slice('--raw-limit='.length), 10);
      if (Number.isFinite(value) && value > 0) args.rawLimit = value;
    }
  }

  return args;
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function cleanNameToken(value) {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/[.'"]/g, '')
    .replace(/\s+/g, ' ');
}

function parseAmount(value) {
  const parsed = Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value) {
  return Number.parseFloat(parseAmount(value).toFixed(2));
}

function normalizeNullableText(value) {
  const normalized = normalizeWhitespace(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeCommitteeParty(value) {
  const normalized = normalizeWhitespace(value);
  return normalized && normalized !== 'UNK' ? normalized : null;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function chunk(values, size) {
  const groups = [];
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }
  return groups;
}

function bulkDateToIso(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return '';
  const month = raw.slice(0, 2);
  const day = raw.slice(2, 4);
  const year = raw.slice(4, 8);
  return `${year}-${month}-${day}`;
}

function committeeCycleKey(committeeId, cycle) {
  return `${committeeId}:${cycle}`;
}

function bumpCounter(map, key, amount) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function chooseTopKey(map) {
  let bestKey = '';
  let bestValue = -1;
  for (const [key, value] of map) {
    if (value > bestValue) {
      bestKey = key;
      bestValue = value;
    }
  }
  return bestKey;
}

function createAggregate() {
  return {
    matchedSearchNames: new Set(),
    matchedRows: 0,
    includedRows: 0,
    excludedMemoRows: 0,
    totalAmount: 0,
    activeCycles: new Set(),
    states: new Map(),
    employers: new Map(),
    occupations: new Map(),
    byCommitteeCycle: new Map(),
  };
}

function enrichCommitteeRecord(entry, committeeLookup) {
  const committee = committeeLookup.get(entry.committeeId);

  return {
    ...entry,
    committeeName: committee?.name ?? entry.committeeId,
    committeeParty: committee?.party ?? null,
    committeeType: committee?.committeeType ?? null,
    committeeDesignation: committee?.designation ?? null,
    connectedOrganizationName: committee?.connectedOrganizationName ?? null,
  };
}

function buildApiSummary(person, cycles) {
  const cycleSet = new Set(cycles);
  const raw = Array.isArray(person.donationSummary?.raw)
    ? person.donationSummary.raw.filter((entry) => cycleSet.has(entry.cycle))
    : [];
  const totalAmount = roundCurrency(raw.reduce((sum, entry) => sum + parseAmount(entry.amount), 0));
  const activeCycles = Array.from(new Set(raw.map((entry) => entry.cycle))).sort((a, b) => a - b);

  return {
    available:
      typeof person.donationSummary?.lastUpdated === 'string' &&
      person.donationSummary.lastUpdated.length > 0 &&
      raw.length > 0,
    lastUpdated: person.donationSummary?.lastUpdated ?? '',
    totalAmount,
    rawEntries: raw.length,
    activeCycles,
    raw,
  };
}

function buildSearchIndex(people) {
  const searchIndex = new Map();
  const rawSearchNames = new Set();

  for (const person of people) {
    const searchNames = unique([person.canonicalName, ...(person.fecSearchNames ?? [])]).map(normalizeWhitespace);
    for (const rawName of searchNames) {
      rawSearchNames.add(rawName);
      const normalizedName = cleanNameToken(rawName);
      const matches = searchIndex.get(normalizedName) ?? new Set();
      matches.add(person.id);
      searchIndex.set(normalizedName, matches);
    }
  }

  return { searchIndex, rawSearchNames: Array.from(rawSearchNames) };
}

function includeBulkRow(fields) {
  if (fields.length < 20) return false;
  if (fields[FIELD.entityType] !== 'IND') return false;
  if (fields[FIELD.memoCode] === 'X') return false;
  if (!fields[FIELD.contributorName]?.includes(',')) return false;
  return parseAmount(fields[FIELD.contributionAmount]) > 0;
}

function updateAggregate(aggregate, fields, cycle, matchedSearchName) {
  aggregate.matchedRows += 1;
  aggregate.matchedSearchNames.add(matchedSearchName);

  if (fields[FIELD.memoCode] === 'X') {
    aggregate.excludedMemoRows += 1;
    return;
  }
  if (!includeBulkRow(fields)) return;

  aggregate.includedRows += 1;

  const committeeId = normalizeWhitespace(fields[FIELD.committeeId]);
  const amount = parseAmount(fields[FIELD.contributionAmount]);
  const contributionDate = bulkDateToIso(fields[FIELD.contributionDate]);
  const transactionType = normalizeWhitespace(fields[FIELD.transactionType]);
  const memoText = normalizeWhitespace(fields[FIELD.memoText]);
  const key = committeeCycleKey(committeeId, cycle);

  aggregate.totalAmount = roundCurrency(aggregate.totalAmount + amount);
  aggregate.activeCycles.add(cycle);
  bumpCounter(aggregate.states, normalizeWhitespace(fields[FIELD.contributorState]), amount);
  bumpCounter(aggregate.employers, normalizeWhitespace(fields[FIELD.contributorEmployer]), amount);
  bumpCounter(aggregate.occupations, normalizeWhitespace(fields[FIELD.contributorOccupation]), amount);

  const existing = aggregate.byCommitteeCycle.get(key);
  if (existing) {
    existing.amount = roundCurrency(existing.amount + amount);
    existing.sourceRows += 1;
    if (contributionDate > existing.contributionDate) existing.contributionDate = contributionDate;
    if (transactionType) existing.transactionTypes.add(transactionType);
    if (memoText && existing.memoTexts.length < 3 && !existing.memoTexts.includes(memoText)) {
      existing.memoTexts.push(memoText);
    }
  } else {
    aggregate.byCommitteeCycle.set(key, {
      committeeId,
      cycle,
      amount: roundCurrency(amount),
      contributionDate,
      sourceRows: 1,
      transactionTypes: new Set(transactionType ? [transactionType] : []),
      memoTexts: memoText ? [memoText] : [],
    });
  }
}

async function listFilesForCycle(cycle) {
  const suffix = String(cycle).slice(2);
  const byDateDir = path.join(BULK_ROOT, `indiv${suffix}`, 'by_date');
  const entries = await readdir(byDateDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))
    .map((entry) => path.join(byDateDir, entry.name))
    .sort();
}

async function listCommitteeMasterFiles() {
  const entries = await readdir(BULK_ROOT, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && COMMITTEE_MASTER_PATTERN.test(entry.name))
      .map(async (entry) => {
        const filePath = path.join(BULK_ROOT, entry.name);
        const fileStat = await stat(filePath);
        return {
          filePath,
          name: entry.name,
          mtimeMs: fileStat.mtimeMs,
        };
      })
  );

  return files.sort((a, b) => a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name));
}

async function loadCommitteeLookup() {
  const files = await listCommitteeMasterFiles();
  const committeeLookup = new Map();

  for (const file of files) {
    const content = await readFile(file.filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      if (!line) continue;
      const fields = line.split('|');
      const committeeId = normalizeWhitespace(fields[COMMITTEE_FIELD.committeeId]);
      if (!committeeId) continue;

      committeeLookup.set(committeeId, {
        committeeId,
        name: normalizeWhitespace(fields[COMMITTEE_FIELD.name]) || committeeId,
        designation: normalizeNullableText(fields[COMMITTEE_FIELD.designation]),
        committeeType: normalizeNullableText(fields[COMMITTEE_FIELD.committeeType]),
        party: normalizeCommitteeParty(fields[COMMITTEE_FIELD.party]),
        filingFrequency: normalizeNullableText(fields[COMMITTEE_FIELD.filingFrequency]),
        organizationType: normalizeNullableText(fields[COMMITTEE_FIELD.organizationType]),
        connectedOrganizationName: normalizeNullableText(fields[COMMITTEE_FIELD.connectedOrganizationName]),
        candidateId: normalizeNullableText(fields[COMMITTEE_FIELD.candidateId]),
        sourceFile: path.basename(file.filePath),
      });
    }
  }

  return {
    committeeLookup,
    committeeMasterFiles: files.map((file) => path.basename(file.filePath)),
  };
}

function getJsonText(node) {
  if (typeof node?.text === 'string') return node.text;
  if (Array.isArray(node?.bytes)) return Buffer.from(node.bytes).toString('utf8');
  return '';
}

async function runRipgrep(patterns, files, onMatch) {
  const args = ['--json', '--fixed-strings', '--no-messages'];
  for (const pattern of patterns) args.push('-e', pattern);
  args.push(...files);

  const command = spawn('rg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const stdout = readline.createInterface({ input: command.stdout });

  let stderr = '';
  command.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  for await (const line of stdout) {
    if (!line) continue;

    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.type !== 'match') continue;

    const filePath = getJsonText(event.data.path);
    const rawLine = getJsonText(event.data.lines).replace(/\r?\n$/, '');
    await onMatch(filePath, rawLine);
  }

  await new Promise((resolve, reject) => {
    command.on('error', reject);
    command.on('close', (code) => {
      if (code === 0 || code === 1) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `rg exited with code ${code}`));
    });
  });
}

async function scanBulkFiles({ cycles, filesByCycle, searchIndex, rawSearchNames, aggregates, meta }) {
  const patternChunks = chunk(
    rawSearchNames.map((name) => `|${name}|`),
    RG_PATTERN_CHUNK_SIZE
  );

  for (const cycle of cycles) {
    const files = filesByCycle.get(cycle) ?? [];
    console.log(`Scanning bulk cycle ${cycle} (${files.length} files, ${rawSearchNames.length} search names)...`);

    for (let index = 0; index < patternChunks.length; index += 1) {
      const patterns = patternChunks[index];
      console.log(`  pattern chunk ${index + 1}/${patternChunks.length}`);

      await runRipgrep(patterns, files, async (_filePath, rawLine) => {
        meta.matchedLines += 1;

        const fields = rawLine.split('|');
        const matchedName = cleanNameToken(fields[FIELD.contributorName] ?? '');
        const personIds = Array.from(searchIndex.get(matchedName) ?? []);

        if (personIds.length !== 1) {
          meta.ambiguousOrMissingMatches += 1;
          return;
        }

        const aggregate = aggregates.get(personIds[0]);
        if (!aggregate) return;

        updateAggregate(aggregate, fields, cycle, matchedName);
        meta.includedRows += includeBulkRow(fields) ? 1 : 0;
        if (fields[FIELD.memoCode] === 'X') meta.excludedMemoRows += 1;
      });
    }
  }
}

function finalizeBulkSummary(person, aggregate, rawLimit, committeeLookup) {
  const allRaw = Array.from(aggregate.byCommitteeCycle.values())
    .map((entry) =>
      enrichCommitteeRecord(
        {
          committeeId: entry.committeeId,
          cycle: entry.cycle,
          amount: roundCurrency(entry.amount),
          contributionDate: entry.contributionDate,
          sourceRows: entry.sourceRows,
          transactionTypes: Array.from(entry.transactionTypes).sort(),
          memoTexts: entry.memoTexts,
        },
        committeeLookup
      )
    )
    .sort((a, b) => {
      if (b.cycle !== a.cycle) return b.cycle - a.cycle;
      if (b.amount !== a.amount) return b.amount - a.amount;
      return b.contributionDate.localeCompare(a.contributionDate);
    });

  return {
    totalAmount: roundCurrency(aggregate.totalAmount),
    rawEntries: allRaw.length,
    activeCycles: Array.from(aggregate.activeCycles).sort((a, b) => a - b),
    matchedRows: aggregate.matchedRows,
    includedRows: aggregate.includedRows,
    excludedMemoRows: aggregate.excludedMemoRows,
    matchedSearchNames: Array.from(aggregate.matchedSearchNames).sort(),
    primaryState: chooseTopKey(aggregate.states) || person.primaryState || '',
    primaryEmployer: chooseTopKey(aggregate.employers) || person.primaryEmployer || '',
    primaryOccupation: chooseTopKey(aggregate.occupations) || person.primaryOccupation || '',
    raw: allRaw.slice(0, rawLimit),
  };
}

function buildComparison(person, bulkSummary, aggregate, cycles, committeeLookup) {
  const apiSummary = buildApiSummary(person, cycles);
  const apiRaw = apiSummary.raw;
  const apiEntries = new Map(
    apiRaw.map((entry) => [
      committeeCycleKey(entry.committeeId, entry.cycle),
      enrichCommitteeRecord(
        {
          key: committeeCycleKey(entry.committeeId, entry.cycle),
          committeeId: entry.committeeId,
          cycle: entry.cycle,
          amount: roundCurrency(entry.amount),
        },
        committeeLookup
      ),
    ])
  );
  const bulkEntries = new Map(
    Array.from(aggregate.byCommitteeCycle.values()).map((entry) => [
      committeeCycleKey(entry.committeeId, entry.cycle),
      enrichCommitteeRecord(
        {
          key: committeeCycleKey(entry.committeeId, entry.cycle),
          committeeId: entry.committeeId,
          cycle: entry.cycle,
          amount: roundCurrency(entry.amount),
        },
        committeeLookup
      ),
    ])
  );

  const overlapKeys = Array.from(bulkEntries.keys()).filter((key) => apiEntries.has(key));
  const bulkOnlyEntries = Array.from(bulkEntries.values())
    .filter((entry) => !apiEntries.has(entry.key))
    .sort((a, b) => b.amount - a.amount || b.cycle - a.cycle);
  const apiOnlyEntries = Array.from(apiEntries.values())
    .filter((entry) => !bulkEntries.has(entry.key))
    .sort((a, b) => b.amount - a.amount || b.cycle - a.cycle);

  return {
    apiAvailable: apiSummary.available,
    apiLastUpdated: apiSummary.lastUpdated,
    apiTotalAmount: apiSummary.totalAmount,
    apiRawEntries: apiSummary.rawEntries,
    apiActiveCycles: apiSummary.activeCycles,
    totalAmountDelta: apiSummary.available ? roundCurrency(bulkSummary.totalAmount - apiSummary.totalAmount) : null,
    rawEntryDelta: apiSummary.available ? bulkSummary.rawEntries - apiSummary.rawEntries : null,
    overlappingCommitteeCycles: overlapKeys.length,
    bulkOnlyTotalAmount: roundCurrency(bulkOnlyEntries.reduce((sum, entry) => sum + entry.amount, 0)),
    apiOnlyTotalAmount: roundCurrency(apiOnlyEntries.reduce((sum, entry) => sum + entry.amount, 0)),
    bulkOnlyCommitteeCycles: bulkOnlyEntries.slice(0, 15),
    apiOnlyCommitteeCycles: apiOnlyEntries.slice(0, 15),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const parsed = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const people = Array.isArray(parsed.people) ? parsed.people : Array.isArray(parsed) ? parsed : [];

  const selectedPeople =
    args.ids.length > 0
      ? args.ids
          .map((id) => people.find((person) => person.id === id))
          .filter(Boolean)
      : [...people]
          .sort((a, b) => (a.donorRank ?? Number.MAX_SAFE_INTEGER) - (b.donorRank ?? Number.MAX_SAFE_INTEGER))
          .slice(0, args.top);

  if (selectedPeople.length === 0) {
    throw new Error('No people were selected. Check --ids or the people.json contents.');
  }

  const filesByCycle = new Map();
  for (const cycle of args.cycles) {
    filesByCycle.set(cycle, await listFilesForCycle(cycle));
  }
  const { committeeLookup, committeeMasterFiles } = await loadCommitteeLookup();

  const { searchIndex, rawSearchNames } = buildSearchIndex(selectedPeople);
  const aggregates = new Map(selectedPeople.map((person) => [person.id, createAggregate()]));

  const meta = {
    matchedLines: 0,
    includedRows: 0,
    excludedMemoRows: 0,
    ambiguousOrMissingMatches: 0,
  };

  await scanBulkFiles({
    cycles: args.cycles,
    filesByCycle,
    searchIndex,
    rawSearchNames,
    aggregates,
    meta,
  });

  const results = selectedPeople.map((person) => {
    const aggregate = aggregates.get(person.id) ?? createAggregate();
    const bulkSummary = finalizeBulkSummary(person, aggregate, args.rawLimit, committeeLookup);

    return {
      id: person.id,
      canonicalName: person.canonicalName,
      displayName: person.displayName,
      donorRank: person.donorRank ?? null,
      bulkSummary,
      comparison: buildComparison(person, bulkSummary, aggregate, args.cycles, committeeLookup),
    };
  });

  const output = {
    _meta: {
      generatedAt: today(),
      source:
        'FEC individual bulk by_date files matched against assets/data/people.json exact-name search keys, enriched with committee metadata from local cm master files.',
      cycles: args.cycles,
      comparedPeople: results.length,
      filesScanned: Array.from(filesByCycle.values()).reduce((sum, files) => sum + files.length, 0),
      committeeMasterFiles,
      committeesLoaded: committeeLookup.size,
      searchNames: rawSearchNames.length,
      matchedLines: meta.matchedLines,
      includedRows: meta.includedRows,
      excludedMemoRows: meta.excludedMemoRows,
      ambiguousOrMissingMatches: meta.ambiguousOrMissingMatches,
      rawLimit: args.rawLimit,
    },
    people: results,
  };

  await mkdir(path.dirname(args.output), { recursive: true });
  await writeFile(args.output, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`\nBulk comparison saved to ${args.output}`);
  for (const person of results) {
    console.log(
      `- ${person.displayName}: bulk=$${person.bulkSummary.totalAmount.toLocaleString()} raw=${person.bulkSummary.rawEntries} api=$${person.comparison.apiTotalAmount.toLocaleString()}`
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
