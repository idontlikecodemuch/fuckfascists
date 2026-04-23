import { spawn } from 'node:child_process';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { COMMITTEE_PARTY_OVERRIDES } from './lib/committeePartyOverrides.mjs';
import { buildQuery, matchesQueryAgainst, tokenize } from './lib/fecNameFuzz.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const BULK_ROOT = path.join(__dirname, '../tools/fec-bulk');
const DEFAULT_CYCLES = [2016, 2018, 2020, 2022, 2024, 2026];
const PERSON_SCHEMA_VERSION = '1.3';
const RG_PATTERN_CHUNK_SIZE = 100;
const COMMITTEE_MASTER_PATTERN = /^cm(?: \d+)?\.txt$/i;
const R_PARTIES = new Set(['REP']);
const D_PARTIES = new Set(['DEM', 'DFL']);

const FIELD = {
  committeeId: 0,
  entityType: 6,
  contributorName: 7,
  contributorState: 9,
  contributorEmployer: 11,
  contributorOccupation: 12,
  contributionDate: 13,
  contributionAmount: 14,
  memoCode: 18,
};

const COMMITTEE_FIELD = {
  committeeId: 0,
  name: 1,
  designation: 8,
  committeeType: 9,
  party: 10,
  connectedOrganizationName: 13,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function cycleLabel(cycle) {
  if (!cycle) return '';
  return `${cycle - 1}-${String(cycle).slice(2)}`;
}

function parseArgs(argv) {
  const args = {
    cycles: DEFAULT_CYCLES,
    ids: [],
    output: PEOPLE_PATH,
    top: null,
    startRank: 1,
    endRank: null,
  };

  for (const arg of argv) {
    if (arg.startsWith('--cycles=')) {
      const cycles = arg
        .slice('--cycles='.length)
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value >= 2000);
      if (cycles.length > 0) args.cycles = Array.from(new Set(cycles));
    } else if (arg.startsWith('--ids=')) {
      args.ids = arg
        .slice('--ids='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) args.output = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--top=')) {
      const value = Number.parseInt(arg.slice('--top='.length), 10);
      if (Number.isFinite(value) && value > 0) args.top = value;
    } else if (arg.startsWith('--start-rank=')) {
      const value = Number.parseInt(arg.slice('--start-rank='.length), 10);
      if (Number.isFinite(value) && value > 0) args.startRank = value;
    } else if (arg.startsWith('--end-rank=')) {
      const value = Number.parseInt(arg.slice('--end-rank='.length), 10);
      if (Number.isFinite(value) && value > 0) args.endRank = value;
    }
  }

  return args;
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseAmount(value) {
  const parsed = Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value) {
  return Number.parseFloat(parseAmount(value).toFixed(2));
}

function bulkDateToIso(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return '';
  return `${raw.slice(4, 8)}-${raw.slice(0, 2)}-${raw.slice(2, 4)}`;
}

function committeeCycleKey(committeeId, cycle) {
  return `${committeeId}:${cycle}`;
}

function normalizeNullableText(value) {
  const normalized = normalizeWhitespace(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeCommitteeParty(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
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

function classifyParty(value) {
  const party = normalizeCommitteeParty(value);
  if (!party) return null;
  if (R_PARTIES.has(party)) return 'R';
  if (D_PARTIES.has(party)) return 'D';
  return null;
}

function resolveCommitteeParty(committeeId, committeeName, committeeParty) {
  const explicitParty = normalizeCommitteeParty(committeeParty);
  if (explicitParty) return explicitParty;

  const overrideParty = COMMITTEE_PARTY_OVERRIDES[normalizeWhitespace(committeeId)];
  if (overrideParty) return overrideParty;

  const normalizedName = normalizeWhitespace(committeeName).toUpperCase();
  if (normalizedName === 'ACTBLUE' || normalizedName === 'WINRED') {
    return normalizedName === 'ACTBLUE' ? 'DEM' : 'REP';
  }

  return null;
}

function createAggregate() {
  return {
    matchedSearchNames: new Set(),
    matchedRows: 0,
    includedRows: 0,
    excludedMemoRows: 0,
    states: new Map(),
    employers: new Map(),
    occupations: new Map(),
    activeCycles: new Set(),
    byCommitteeCycle: new Map(),
  };
}

// Build the person-lookup structures used during bulk scan.
//
// For every (person, searchName) pair we tokenize the search name using the
// FEC fuzz tokenizer and group by the distinctive (first) token — effectively
// the last name for canonical "LAST, FIRST" FEC filings. The distinctive
// token becomes the ripgrep prefilter pattern; each candidate group carries
// the full query token set for the in-JS FEC tsquery match downstream.
//
// See scripts/lib/fecNameFuzz.mjs for the matching semantics; they mirror
// openFEC's parse_fulltext verbatim so coverage matches the FEC web UI.
function buildSearchIndex(people) {
  const personsByDistinctive = new Map();
  const distinctiveTokens = new Set();

  for (const person of people) {
    const searchNames = unique([person.canonicalName, ...(person.fecSearchNames ?? [])])
      .map(normalizeWhitespace)
      .filter(Boolean);
    for (const searchName of searchNames) {
      const queryTokens = buildQuery(searchName);
      if (queryTokens.length === 0) continue;
      const distinctive = queryTokens[0];
      distinctiveTokens.add(distinctive);
      if (!personsByDistinctive.has(distinctive)) {
        personsByDistinctive.set(distinctive, []);
      }
      personsByDistinctive.get(distinctive).push({
        personId: person.id,
        queryTokens,
        searchName,
      });
    }
  }

  return {
    personsByDistinctive,
    distinctiveTokens: Array.from(distinctiveTokens),
  };
}

// Resolve the set of person candidates for a given first field token. The
// common case is exact-match (person "BEZOS, JEFF" → field "BEZOS, ..."); we
// also cover the rare prefix case (person "JACKS, ..." → field "JACKSON, ...")
// because FEC tsquery's `JACKS:*` lexeme prefix does match `JACKSON` — it
// would be a correctness regression to silently drop those. Results cached
// per firstFieldToken so the full-scan pass is amortized over hot keys.
function buildCandidateResolver(personsByDistinctive) {
  const distinctiveTokens = Array.from(personsByDistinctive.keys());
  const cache = new Map();

  return function resolveCandidates(firstFieldToken) {
    const cached = cache.get(firstFieldToken);
    if (cached !== undefined) return cached;

    const candidates = [];
    const exact = personsByDistinctive.get(firstFieldToken);
    if (exact) candidates.push(...exact);
    for (const token of distinctiveTokens) {
      if (token === firstFieldToken) continue;
      if (firstFieldToken.startsWith(token)) {
        const extra = personsByDistinctive.get(token);
        if (extra) candidates.push(...extra);
      }
    }

    cache.set(firstFieldToken, candidates);
    return candidates;
  };
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
  const key = committeeCycleKey(committeeId, cycle);

  aggregate.activeCycles.add(cycle);
  bumpCounter(aggregate.states, normalizeWhitespace(fields[FIELD.contributorState]), amount);
  bumpCounter(aggregate.employers, normalizeWhitespace(fields[FIELD.contributorEmployer]), amount);
  bumpCounter(aggregate.occupations, normalizeWhitespace(fields[FIELD.contributorOccupation]), amount);

  const existing = aggregate.byCommitteeCycle.get(key);
  if (existing) {
    existing.amount = roundCurrency(existing.amount + amount);
    existing.sourceRows += 1;
    if (contributionDate > existing.contributionDate) existing.contributionDate = contributionDate;
  } else {
    aggregate.byCommitteeCycle.set(key, {
      committeeId,
      cycle,
      amount: roundCurrency(amount),
      contributionDate,
      sourceRows: 1,
    });
  }
}

function enrichCommitteeRecord(entry, committeeLookup) {
  const committee = committeeLookup.get(entry.committeeId);
  const committeeName = committee?.name ?? entry.committeeId;
  const committeeParty = resolveCommitteeParty(entry.committeeId, committeeName, committee?.party ?? null);

  return {
    ...entry,
    committeeName,
    committeeParty,
    committeeType: committee?.committeeType ?? null,
    committeeDesignation: committee?.designation ?? null,
    connectedOrganizationName: committee?.connectedOrganizationName ?? null,
  };
}

function finalizeAggregate(person, aggregate, committeeLookup) {
  const raw = Array.from(aggregate.byCommitteeCycle.values())
    .map((entry) =>
      enrichCommitteeRecord(
        {
          committeeName: entry.committeeId,
          committeeId: entry.committeeId,
          cycle: entry.cycle,
          amount: roundCurrency(entry.amount),
          contributionDate: entry.contributionDate,
        },
        committeeLookup
      )
    )
    .sort((a, b) => {
      if (b.cycle !== a.cycle) return b.cycle - a.cycle;
      if (b.amount !== a.amount) return b.amount - a.amount;
      return b.contributionDate.localeCompare(a.contributionDate);
    })
    .map((entry) => ({
      committeeName: entry.committeeName,
      committeeId: entry.committeeId,
      committeeParty: entry.committeeParty,
      committeeType: entry.committeeType,
      amount: entry.amount,
      cycle: entry.cycle,
      contributionDate: entry.contributionDate,
    }));

  const activeCycles = Array.from(aggregate.activeCycles).sort((a, b) => a - b);
  const recentCycle = activeCycles.length > 0 ? activeCycles[activeCycles.length - 1] : 0;

  let totalR = 0;
  let totalD = 0;
  let totalO = 0;
  let recentCycleR = 0;
  let recentCycleD = 0;
  let recentCycleO = 0;

  for (const entry of raw) {
    const bucket = classifyParty(entry.committeeParty);
    if (bucket === 'R') {
      totalR += entry.amount;
      if (entry.cycle === recentCycle) recentCycleR += entry.amount;
    } else if (bucket === 'D') {
      totalD += entry.amount;
      if (entry.cycle === recentCycle) recentCycleD += entry.amount;
    } else {
      totalO += entry.amount;
      if (entry.cycle === recentCycle) recentCycleO += entry.amount;
    }
  }

  return {
    primaryState: chooseTopKey(aggregate.states) || person.primaryState || undefined,
    primaryEmployer: chooseTopKey(aggregate.employers) || person.primaryEmployer || undefined,
    primaryOccupation: chooseTopKey(aggregate.occupations) || person.primaryOccupation || undefined,
    donationSummary: {
      totalR: roundCurrency(totalR),
      totalD: roundCurrency(totalD),
      totalO: roundCurrency(totalO),
      recentCycleR: roundCurrency(recentCycleR),
      recentCycleD: roundCurrency(recentCycleD),
      recentCycleO: roundCurrency(recentCycleO),
      recentCycle: cycleLabel(recentCycle),
      activeCycles,
      raw,
      lastUpdated: today(),
    },
  };
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
  // Follow symlinks — Dirent.isFile() returns false for them. Matters when
  // tools/fec-bulk/ is staged via symlink from another worktree.
  const candidates = [];
  for (const entry of entries) {
    if (!COMMITTEE_MASTER_PATTERN.test(entry.name)) continue;
    const full = path.join(BULK_ROOT, entry.name);
    let ok = entry.isFile();
    if (!ok && entry.isSymbolicLink()) {
      try { ok = (await stat(full)).isFile(); } catch { ok = false; }
    }
    if (ok) candidates.push(entry);
  }
  const files = await Promise.all(
    candidates
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
        connectedOrganizationName: normalizeNullableText(fields[COMMITTEE_FIELD.connectedOrganizationName]),
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
    const rawLine = getJsonText(event.data.lines).replace(/\r?\n$/, '');
    await onMatch(rawLine);
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

async function scanBulkFiles({ cycles, filesByCycle, personsByDistinctive, distinctiveTokens, aggregates, meta }) {
  // Ripgrep prefilter: one literal pattern per distinctive token, anchored by
  // the left `|` delimiter so the match falls at the start of some FEC bulk
  // field. Without a right delimiter we get FEC-flavored prefix behavior for
  // free (e.g. `|BEZOS` matches `|BEZOS,` and `|BEZOS-SMITH,`). Downstream,
  // matchesQueryAgainst against the parsed contributor-name field rejects any
  // false positives that matched in a non-name field (employer, memo, etc).
  const patternChunks = chunk(
    distinctiveTokens.map((token) => `|${token}`),
    RG_PATTERN_CHUNK_SIZE
  );
  const resolveCandidates = buildCandidateResolver(personsByDistinctive);

  for (const cycle of cycles) {
    const files = filesByCycle.get(cycle) ?? [];
    console.log(`Scanning cycle ${cycle} (${files.length} files, ${distinctiveTokens.length} distinctive tokens)...`);

    for (let index = 0; index < patternChunks.length; index += 1) {
      const patterns = patternChunks[index];
      console.log(`  pattern chunk ${index + 1}/${patternChunks.length}`);

      await runRipgrep(patterns, files, async (rawLine) => {
        meta.matchedLines += 1;

        const fields = rawLine.split('|');
        const contributorName = fields[FIELD.contributorName] ?? '';
        const fieldTokens = tokenize(contributorName);
        if (fieldTokens.length === 0) {
          meta.missingMatches += 1;
          return;
        }

        const candidates = resolveCandidates(fieldTokens[0]);
        if (candidates.length === 0) {
          meta.missingMatches += 1;
          return;
        }

        let attributed = false;
        for (const candidate of candidates) {
          if (!matchesQueryAgainst(fieldTokens, candidate.queryTokens)) continue;
          const aggregate = aggregates.get(candidate.personId);
          if (!aggregate) continue;
          updateAggregate(aggregate, fields, cycle, contributorName);
          attributed = true;
        }

        if (!attributed) {
          meta.missingMatches += 1;
          return;
        }
        meta.includedRows += includeBulkRow(fields) ? 1 : 0;
        if (fields[FIELD.memoCode] === 'X') meta.excludedMemoRows += 1;
      });
    }
  }
}

function selectPeople(people, args) {
  if (args.ids.length > 0) {
    return args.ids
      .map((id) => people.find((person) => person.id === id))
      .filter(Boolean);
  }

  const ranked = [...people].sort(
    (a, b) => (a.donorRank ?? Number.MAX_SAFE_INTEGER) - (b.donorRank ?? Number.MAX_SAFE_INTEGER)
  );
  const startIndex = Math.max(args.startRank - 1, 0);
  const endIndex = args.endRank ? Math.min(args.endRank, ranked.length) : ranked.length;
  const sliced = ranked.slice(startIndex, endIndex);
  return args.top ? sliced.slice(0, args.top) : sliced;
}

async function writePeople(parsed, people, metaExtras = {}, outputPath = PEOPLE_PATH) {
  const previousMeta = Array.isArray(parsed) ? {} : parsed._meta ?? {};
  const output = Array.isArray(parsed)
    ? people
    : {
        ...parsed,
        _meta: {
          ...previousMeta,
          totalPeople: people.length,
          updatedAt: today(),
          formatVersion: PERSON_SCHEMA_VERSION,
          description: 'Individual executive and donor records for personal FEC contribution tracking. Separate from corporate PAC data in entities.json.',
          source:
            'FEC bulk individual contributions (by_date files) for donor ranking and hydration, with committee metadata joined from local cm master files.',
          partyResolutionMethod:
            'committee.party when present, then curated committee-id overrides for obvious partisan PACs, then limited committee-name overrides for ACTBLUE/WINRED.',
          summaryCycles: metaExtras.summaryCycles ?? previousMeta.summaryCycles ?? DEFAULT_CYCLES,
          ...metaExtras,
        },
        people,
      };

  await writeFile(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const parsed = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const people = Array.isArray(parsed.people) ? parsed.people : Array.isArray(parsed) ? parsed : [];
  const selectedPeople = selectPeople(people, args);

  if (selectedPeople.length === 0) {
    throw new Error('No people were selected. Check --ids, --top, or the people.json contents.');
  }

  const filesByCycle = new Map();
  for (const cycle of args.cycles) {
    filesByCycle.set(cycle, await listFilesForCycle(cycle));
  }

  const { committeeLookup, committeeMasterFiles } = await loadCommitteeLookup();
  const { personsByDistinctive, distinctiveTokens } = buildSearchIndex(selectedPeople);
  const aggregates = new Map(selectedPeople.map((person) => [person.id, createAggregate()]));
  const meta = {
    matchedLines: 0,
    includedRows: 0,
    excludedMemoRows: 0,
    missingMatches: 0,
  };

  await scanBulkFiles({
    cycles: args.cycles,
    filesByCycle,
    personsByDistinctive,
    distinctiveTokens,
    aggregates,
    meta,
  });

  const selectedIds = new Set(selectedPeople.map((person) => person.id));
  let hydratedCount = 0;
  let missingCount = 0;

  const nextPeople = people.map((person) => {
    if (!selectedIds.has(person.id)) return person;

    const aggregate = aggregates.get(person.id) ?? createAggregate();
    const finalized = finalizeAggregate(person, aggregate, committeeLookup);
    const hasRaw = finalized.donationSummary.raw.length > 0;

    if (!hasRaw) {
      missingCount += 1;
      return person;
    }

    hydratedCount += 1;
    return {
      ...person,
      primaryState: finalized.primaryState,
      primaryEmployer: finalized.primaryEmployer,
      primaryOccupation: finalized.primaryOccupation,
      donationSummary: finalized.donationSummary,
      lastVerifiedDate: today(),
      verificationStatus: person.verificationStatus === 'manual' ? 'manual' : 'pipeline',
    };
  });

  const totalHydratedPeople = nextPeople.filter((person) => person.donationSummary?.lastUpdated).length;

  await writePeople(
    parsed,
    nextPeople,
    {
      hydrationStatus: totalHydratedPeople === nextPeople.length ? 'complete' : 'partial',
      hydratedPeople: totalHydratedPeople,
      summaryCycles: args.cycles,
      bulkHydrationCycles: args.cycles,
      bulkHydrationDate: today(),
      bulkHydrationSelectedPeople: selectedPeople.length,
      bulkHydrationHydratedPeople: hydratedCount,
      bulkHydrationMissingPeople: missingCount,
      bulkHydrationDistinctiveTokens: distinctiveTokens.length,
      bulkHydrationMatchedLines: meta.matchedLines,
      bulkHydrationIncludedRows: meta.includedRows,
      bulkHydrationExcludedMemoRows: meta.excludedMemoRows,
      committeeMasterFiles,
    },
    args.output
  );

  console.log('\n' + '─'.repeat(48));
  console.log(`Selected: ${selectedPeople.length}`);
  console.log(`Hydrated from bulk: ${hydratedCount}`);
  console.log(`Missing bulk matches: ${missingCount}`);
  console.log(`Total hydrated people in file: ${totalHydratedPeople}/${nextPeople.length}`);
  console.log('─'.repeat(48));
  console.log(`people.json saved to ${args.output}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
