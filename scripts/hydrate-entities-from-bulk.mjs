import { createReadStream } from 'node:fs';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLine29Classifier } from './lib/line29Classifier.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENTITIES_PATH = path.join(ROOT, 'assets/data/entities.json');
const BULK_ROOT = path.join(ROOT, 'tools/fec-bulk');
const DEFAULT_CYCLES = [2016, 2018, 2020, 2022, 2024, 2026];
const PATTERN_CHUNK_SIZE = 100;

const PAS2_FILE_PATTERN = /^itpas2(?: \d+)?\.txt$/i;
const OTH_DIR_PATTERN = /^oth\d{2}$/i;
const CM_FILE_PATTERN = /^cm(?: \d+)?\.txt$/i;
const CN_DIR_PATTERN = /^cn\d{2}$/i;
const CCL_FILE_PATTERN = /^ccl(?: \d+)?\.txt$/i;

const PAS2_FIELD = {
  committeeId: 0,
  transactionType: 5,
  recipientName: 7,
  recipientState: 9,
  transactionDate: 13,
  amount: 14,
  otherId: 15,
  candidateId: 16,
  memoCode: 19,
  memoText: 20,
  subId: 21,
};

const OTH_FIELD = {
  committeeId: 0,
  transactionType: 5,
  recipientName: 7,
  recipientState: 9,
  transactionDate: 13,
  amount: 14,
  otherId: 15,
  memoCode: 18,
  memoText: 19,
  subId: 20,
};

const CM_FIELD = {
  committeeId: 0,
  committeeName: 1,
  committeeType: 9,
  party: 10,
  connectedOrganizationName: 13,
};

const CN_FIELD = {
  candidateId: 0,
  party: 2,
};

const CCL_FIELD = {
  candidateId: 0,
  committeeId: 3,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeCommitteeId(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  return /^C\d{8}$/.test(normalized) ? normalized : '';
}

function normalizeMajorParty(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  if (normalized === 'REP' || normalized === 'R') return 'R';
  if (normalized === 'DEM' || normalized === 'DFL' || normalized === 'D') return 'D';
  return null;
}

function parseAmount(value) {
  const parsed = Number.parseFloat(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value) {
  return Number.parseFloat(Number(value || 0).toFixed(2));
}

function bulkDateToIso(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return '';
  return `${raw.slice(4, 8)}-${raw.slice(0, 2)}-${raw.slice(2, 4)}`;
}

function dateToCycle(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return 0;
  const year = Number.parseInt(raw.slice(4, 8), 10);
  if (!Number.isFinite(year) || year < 2000) return 0;
  return year % 2 === 0 ? year : year + 1;
}

function parseArgs(argv) {
  const args = {
    cycles: DEFAULT_CYCLES,
    input: ENTITIES_PATH,
    output: ENTITIES_PATH,
    dryRun: false,
    noClassify: false,
    scanOth: true,
    ids: [],
  };

  for (const arg of argv) {
    if (arg.startsWith('--cycles=')) {
      const cycles = arg
        .slice('--cycles='.length)
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value >= 2000);
      if (cycles.length > 0) args.cycles = Array.from(new Set(cycles));
    } else if (arg.startsWith('--input=')) {
      const value = arg.slice('--input='.length).trim();
      if (value) args.input = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) args.output = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--ids=')) {
      args.ids = arg
        .slice('--ids='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--no-classify') {
      args.noClassify = true;
    } else if (arg === '--pas2-only') {
      args.scanOth = false;
    }
  }

  return args;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function chunk(values, size) {
  const groups = [];
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }
  return groups;
}

function getJsonText(node) {
  if (typeof node?.text === 'string') return node.text;
  if (Array.isArray(node?.bytes)) return Buffer.from(node.bytes).toString('utf8');
  return '';
}

async function readLines(filePath, onLine) {
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line) continue;
    await onLine(line);
  }
}

async function listMatchingEntries(root, pattern, type = 'file') {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => (type === 'dir' ? entry.isDirectory() : entry.isFile()) && pattern.test(entry.name))
    .map((entry) => path.join(root, entry.name))
    .sort();
}

async function listPas2Files() {
  return listMatchingEntries(BULK_ROOT, PAS2_FILE_PATTERN, 'file');
}

async function listOthFiles() {
  const dirs = await listMatchingEntries(BULK_ROOT, OTH_DIR_PATTERN, 'dir');
  return dirs.map((dir) => path.join(dir, 'itoth.txt'));
}

async function loadCommitteeLookup() {
  const files = await listMatchingEntries(BULK_ROOT, CM_FILE_PATTERN, 'file');
  const lookup = new Map();

  for (const filePath of files) {
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const committeeId = normalizeCommitteeId(fields[CM_FIELD.committeeId]);
      if (!committeeId) return;
      lookup.set(committeeId, {
        committeeId,
        committeeName: normalizeWhitespace(fields[CM_FIELD.committeeName]) || committeeId,
        committeeType: normalizeWhitespace(fields[CM_FIELD.committeeType]) || null,
        party: normalizeMajorParty(fields[CM_FIELD.party]),
        connectedOrganizationName: normalizeWhitespace(fields[CM_FIELD.connectedOrganizationName]) || null,
      });
    });
  }

  return lookup;
}

async function loadCandidateParties() {
  const candidateParties = new Map();
  const dirs = await listMatchingEntries(BULK_ROOT, CN_DIR_PATTERN, 'dir');

  for (const dirPath of dirs) {
    await readLines(path.join(dirPath, 'cn.txt'), (line) => {
      const fields = line.split('|');
      const candidateId = normalizeWhitespace(fields[CN_FIELD.candidateId]);
      const party = normalizeMajorParty(fields[CN_FIELD.party]);
      if (candidateId && party) candidateParties.set(candidateId, party);
    });
  }

  return candidateParties;
}

async function loadCandidateCommitteeParties(candidateParties) {
  const partySetsByCommittee = new Map();
  const files = await listMatchingEntries(BULK_ROOT, CCL_FILE_PATTERN, 'file');

  for (const filePath of files) {
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const candidateId = normalizeWhitespace(fields[CCL_FIELD.candidateId]);
      const committeeId = normalizeCommitteeId(fields[CCL_FIELD.committeeId]);
      const party = candidateParties.get(candidateId) ?? null;
      if (!committeeId || !party) return;

      if (!partySetsByCommittee.has(committeeId)) partySetsByCommittee.set(committeeId, new Set());
      partySetsByCommittee.get(committeeId).add(party);
    });
  }

  const committeeParties = new Map();
  for (const [committeeId, parties] of partySetsByCommittee) {
    committeeParties.set(committeeId, parties.size === 1 ? Array.from(parties)[0] : null);
  }

  return committeeParties;
}

function createAggregate(entityId, committeeId) {
  return {
    entityId,
    committeeId,
    rows: 0,
    pas2Rows: 0,
    othRows: 0,
    memoRows: 0,
    activeCycles: new Set(),
    totalR: 0,
    totalD: 0,
    totalO: 0,
    recentByCycle: new Map(),
    rawByKey: new Map(),
  };
}

function addRaw(aggregate, { transactionType, description, amount, cycle, source }) {
  const key = `${source}:${transactionType}:${cycle}`;
  const existing = aggregate.rawByKey.get(key);
  if (existing) {
    existing.amount = roundCurrency(existing.amount + amount);
    return;
  }

  aggregate.rawByKey.set(key, {
    lineNumber: transactionType,
    description,
    amount: roundCurrency(amount),
    cycle,
    isReceipt: false,
  });
}

function addClassifiedAmount(aggregate, party, amount, cycle, rawContext) {
  aggregate.activeCycles.add(cycle);
  const existing = aggregate.recentByCycle.get(cycle) ?? { R: 0, D: 0, O: 0 };

  if (party === 'R') {
    aggregate.totalR += amount;
    existing.R += amount;
  } else if (party === 'D') {
    aggregate.totalD += amount;
    existing.D += amount;
  } else {
    aggregate.totalO += amount;
    existing.O += amount;
    addRaw(aggregate, rawContext);
  }

  aggregate.recentByCycle.set(cycle, existing);
}

function isScheduleBLikeTransaction(transactionType) {
  return /^[23]/.test(normalizeWhitespace(transactionType));
}

function classifyRow({ candidateId, otherId, recipientName, recipientState, cycle, candidateParties, candidateCommitteeParties, committeeLookup, classifier }) {
  const candidateParty = candidateParties.get(normalizeWhitespace(candidateId));
  if (candidateParty === 'R' || candidateParty === 'D') return { party: candidateParty, method: 'candidate_master' };

  const recipientCommitteeId = normalizeCommitteeId(otherId);
  const linkedParty = candidateCommitteeParties.get(recipientCommitteeId);
  if (linkedParty === 'R' || linkedParty === 'D') return { party: linkedParty, method: 'candidate_committee_link' };

  const formalParty = committeeLookup.get(recipientCommitteeId)?.party ?? null;
  if (formalParty === 'R' || formalParty === 'D') return { party: formalParty, method: 'committee_master' };

  if (classifier) {
    const result = classifier.classify(recipientCommitteeId, recipientName, recipientState, cycle);
    if (result.party === 'REP') return { party: 'R', method: result.method };
    if (result.party === 'DEM') return { party: 'D', method: result.method };
  }

  return { party: 'O', method: 'unclassified' };
}

async function runRipgrep(patterns, files, onMatch) {
  if (patterns.length === 0 || files.length === 0) return;

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

async function scanBulkFiles({ files, label, committeeIds, handleLine }) {
  const patternChunks = chunk(
    committeeIds.map((committeeId) => `${committeeId}|`),
    PATTERN_CHUNK_SIZE
  );

  console.log(`Scanning ${label} (${files.length} files, ${committeeIds.length} committees)...`);
  for (let index = 0; index < patternChunks.length; index += 1) {
    console.log(`  ${label} pattern chunk ${index + 1}/${patternChunks.length}`);
    await runRipgrep(patternChunks[index], files, handleLine);
  }
}

function buildEntityCommitteeMap(entities, ids) {
  const selectedIds = new Set(ids);
  const committeeToEntityIds = new Map();

  for (const entity of entities) {
    if (selectedIds.size > 0 && !selectedIds.has(entity.id)) continue;
    let committeeId = normalizeCommitteeId(entity.fecCommitteeId);

    const activeRecord = asArray(entity.fecCommitteeRecords).find((record) => record?.status === 'active');
    if (activeRecord?.id) committeeId = normalizeCommitteeId(activeRecord.id);
    if (!committeeId) continue;

    const bucket = committeeToEntityIds.get(committeeId) ?? [];
    bucket.push(entity.id);
    committeeToEntityIds.set(committeeId, bucket);
  }

  return committeeToEntityIds;
}

function formatCycleRange(cycles) {
  if (cycles.length === 0) return 'none';
  if (cycles.length === 1) return String(cycles[0]);
  return `${cycles[0]}-${cycles[cycles.length - 1]}`;
}

function resolveCommitteeName(committeeLookup, committeeId, fallbackName) {
  const fromLookup = committeeLookup.get(committeeId)?.committeeName;
  if (fromLookup && fromLookup !== committeeId) return fromLookup;

  const normalizedFallback = normalizeWhitespace(fallbackName);
  if (normalizedFallback && normalizedFallback !== committeeId) return normalizedFallback;

  return committeeId;
}

function finalizeSummary(aggregate, committeeLookup, fallbackCommitteeName = '') {
  const activeCycles = Array.from(aggregate.activeCycles).sort((a, b) => a - b);
  const recentCycle = activeCycles[activeCycles.length - 1] ?? 0;
  const recent = aggregate.recentByCycle.get(recentCycle) ?? { R: 0, D: 0, O: 0 };

  return {
    committeeId: aggregate.committeeId,
    committeeName: resolveCommitteeName(committeeLookup, aggregate.committeeId, fallbackCommitteeName),
    lastUpdated: today(),
    fecCommitteeUrl: `https://www.fec.gov/data/committee/${aggregate.committeeId}/`,
    recentCycle,
    recentRepubs: roundCurrency(recent.R),
    recentDems: roundCurrency(recent.D),
    totalRepubs: roundCurrency(aggregate.totalR),
    totalDems: roundCurrency(aggregate.totalD),
    totalO: roundCurrency(aggregate.totalO),
    recentO: roundCurrency(recent.O),
    activeCycles,
    raw: Array.from(aggregate.rawByKey.values()).sort((a, b) => {
      if (b.cycle !== a.cycle) return b.cycle - a.cycle;
      return a.lineNumber.localeCompare(b.lineNumber);
    }),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cycleSet = new Set(args.cycles);
  const raw = JSON.parse(await readFile(args.input, 'utf8'));
  const entities = Array.isArray(raw.entities) ? raw.entities : Array.isArray(raw) ? raw : [];
  const committeeToEntityIds = buildEntityCommitteeMap(entities, args.ids);
  const committeeIds = Array.from(committeeToEntityIds.keys()).sort();

  if (committeeIds.length === 0) {
    throw new Error('No entities with fecCommitteeId were selected.');
  }

  console.log(`Selected ${committeeIds.length} committees across cycles ${args.cycles.join(', ')}.`);
  const [committeeLookup, candidateParties] = await Promise.all([
    loadCommitteeLookup(),
    loadCandidateParties(),
  ]);
  const candidateCommitteeParties = await loadCandidateCommitteeParties(candidateParties);
  const classifier = args.noClassify ? null : await loadLine29Classifier();

  const aggregates = new Map();
  for (const [committeeId, entityIds] of committeeToEntityIds) {
    for (const entityId of entityIds) {
      aggregates.set(entityId, createAggregate(entityId, committeeId));
    }
  }

  const meta = {
    pas2MatchedRows: 0,
    othMatchedRows: 0,
    othRowsSkippedAsPas2Duplicates: 0,
    skippedRows: 0,
  };
  const pas2SubIds = new Set();

  const processPas2Line = (line) => {
    const fields = line.split('|');
    const committeeId = normalizeCommitteeId(fields[PAS2_FIELD.committeeId]);
    const entityIds = committeeToEntityIds.get(committeeId);
    if (!entityIds) return;

    const cycle = dateToCycle(fields[PAS2_FIELD.transactionDate]);
    const amount = parseAmount(fields[PAS2_FIELD.amount]);
    if (!cycleSet.has(cycle) || amount <= 0) {
      meta.skippedRows += 1;
      return;
    }

    const transactionType = normalizeWhitespace(fields[PAS2_FIELD.transactionType]).toUpperCase();
    const subId = normalizeWhitespace(fields[PAS2_FIELD.subId]);
    if (subId) pas2SubIds.add(`${committeeId}:${subId}`);
    const classification = classifyRow({
      candidateId: fields[PAS2_FIELD.candidateId],
      otherId: fields[PAS2_FIELD.otherId],
      recipientName: fields[PAS2_FIELD.recipientName],
      recipientState: fields[PAS2_FIELD.recipientState],
      cycle,
      candidateParties,
      candidateCommitteeParties,
      committeeLookup,
      classifier,
    });

    for (const entityId of entityIds) {
      const aggregate = aggregates.get(entityId);
      aggregate.rows += 1;
      aggregate.pas2Rows += 1;
      if (normalizeWhitespace(fields[PAS2_FIELD.memoCode]).toUpperCase() === 'X') aggregate.memoRows += 1;
      addClassifiedAmount(aggregate, classification.party, amount, cycle, {
        transactionType,
        description: `Bulk PAS2 ${transactionType}: ${normalizeWhitespace(fields[PAS2_FIELD.recipientName]) || classification.method}`,
        amount,
        cycle,
        source: 'pas2',
      });
    }
    meta.pas2MatchedRows += 1;
  };

  const processOthLine = (line) => {
    const fields = line.split('|');
    const committeeId = normalizeCommitteeId(fields[OTH_FIELD.committeeId]);
    const entityIds = committeeToEntityIds.get(committeeId);
    if (!entityIds) return;

    const transactionType = normalizeWhitespace(fields[OTH_FIELD.transactionType]).toUpperCase();
    const subId = normalizeWhitespace(fields[OTH_FIELD.subId]);
    if (subId && pas2SubIds.has(`${committeeId}:${subId}`)) {
      meta.othRowsSkippedAsPas2Duplicates += 1;
      return;
    }
    const cycle = dateToCycle(fields[OTH_FIELD.transactionDate]);
    const amount = parseAmount(fields[OTH_FIELD.amount]);
    if (!cycleSet.has(cycle) || amount <= 0 || !isScheduleBLikeTransaction(transactionType)) {
      meta.skippedRows += 1;
      return;
    }

    const classification = classifyRow({
      candidateId: '',
      otherId: fields[OTH_FIELD.otherId],
      recipientName: fields[OTH_FIELD.recipientName],
      recipientState: fields[OTH_FIELD.recipientState],
      cycle,
      candidateParties,
      candidateCommitteeParties,
      committeeLookup,
      classifier,
    });

    for (const entityId of entityIds) {
      const aggregate = aggregates.get(entityId);
      aggregate.rows += 1;
      aggregate.othRows += 1;
      if (normalizeWhitespace(fields[OTH_FIELD.memoCode]).toUpperCase() === 'X') aggregate.memoRows += 1;
      addClassifiedAmount(aggregate, classification.party, amount, cycle, {
        transactionType,
        description: `Bulk OTH ${transactionType}: ${normalizeWhitespace(fields[OTH_FIELD.recipientName]) || classification.method}`,
        amount,
        cycle,
        source: 'oth',
      });
    }
    meta.othMatchedRows += 1;
  };

  await scanBulkFiles({
    files: await listPas2Files(),
    label: 'PAS2',
    committeeIds,
    handleLine: processPas2Line,
  });

  if (args.scanOth) {
    await scanBulkFiles({
      files: await listOthFiles(),
      label: 'OTH',
      committeeIds,
      handleLine: processOthLine,
    });
  }

  let hydrated = 0;
  let noRows = 0;
  const nextEntities = entities.map((entity) => {
    const aggregate = aggregates.get(entity.id);
    if (!aggregate) return entity;

    if (aggregate.rows === 0) {
      noRows += 1;
      const fallbackCommitteeName = entity.donationSummary?.committeeName;
      return {
        ...entity,
        donationSummary: {
          committeeId: aggregate.committeeId,
          committeeName: resolveCommitteeName(committeeLookup, aggregate.committeeId, fallbackCommitteeName),
          lastUpdated: today(),
          fecCommitteeUrl: `https://www.fec.gov/data/committee/${aggregate.committeeId}/`,
          recentCycle: 0,
          recentRepubs: 0,
          recentDems: 0,
          totalRepubs: 0,
          totalDems: 0,
          totalO: 0,
          recentO: 0,
          activeCycles: [],
          raw: [],
        },
        lastVerifiedDate: today(),
      };
    }

    hydrated += 1;
    return {
      ...entity,
      donationSummary: finalizeSummary(aggregate, committeeLookup, entity.donationSummary?.committeeName),
      lastVerifiedDate: today(),
    };
  });

  const output = Array.isArray(raw)
    ? nextEntities
    : {
        ...raw,
        _meta: {
          ...(raw._meta ?? {}),
          totalEntities: nextEntities.length,
          updatedAt: today(),
          entityDonationHydrationSource: 'FEC bulk PAS2/OTH files',
          entityDonationHydrationCycles: args.cycles,
        },
        entities: nextEntities,
      };

  console.log('\n' + '-'.repeat(48));
  console.log(`Hydrated with rows: ${hydrated}`);
  console.log(`Zero-row summaries: ${noRows}`);
  console.log(`PAS2 matched rows: ${meta.pas2MatchedRows}`);
  console.log(`OTH matched rows: ${meta.othMatchedRows}`);
  console.log(`OTH rows skipped as PAS2 duplicates: ${meta.othRowsSkippedAsPas2Duplicates}`);
  console.log(`Cycles: ${formatCycleRange(args.cycles)}`);

  if (args.dryRun) {
    console.log('DRY RUN - entities.json was NOT modified.');
    return;
  }

  if (args.output === ENTITIES_PATH) {
    const backupPath = path.join(ROOT, 'assets/data/entities.pre-bulk-hydration.json');
    await copyFile(args.input, backupPath);
    console.log(`Backup: ${path.relative(ROOT, backupPath)}`);
  }

  await writeFile(args.output, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${path.relative(ROOT, args.output)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
