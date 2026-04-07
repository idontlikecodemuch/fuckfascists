import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  committeeCycleKey,
  dateToCycle,
  formatCurrency,
  listMatchingEntries as listEntriesFromRoot,
  normalizeCommitteeId,
  normalizeMajorParty,
  normalizeWhitespace,
  parseAmount,
  readLines,
  roundCurrency,
  today,
} from './lib/data-classification/common.mjs';
import { findLatestReport } from './lib/data-classification/report-files.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BULK_ROOT = path.join(__dirname, '../tools/fec-bulk');
const REPORTS_DIR = path.join(BULK_ROOT, 'reports');
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const COMMITTEE_REPORT_PREFIX = 'committee-beneficiary-classification-';

const CCL_FILE_PATTERN = /^ccl(?: \d+)?\.txt$/i;
const CM_FILE_PATTERN = /^cm(?: \d+)?\.txt$/i;
const CN_DIR_PATTERN = /^cn\d{2}$/i;
const OTH_DIR_PATTERN = /^oth\d{2}$/i;

const CM_FIELD = {
  committeeId: 0,
  committeeName: 1,
  party: 10,
};

const CN_FIELD = {
  candidateId: 0,
  party: 2,
};

const CCL_FIELD = {
  candidateId: 0,
  committeeId: 3,
};

const OTH_FIELD = {
  committeeId: 0,
  reportType: 2,
  transactionPgi: 3,
  transactionType: 5,
  entityType: 6,
  recipientName: 7,
  transactionDate: 13,
  amount: 14,
  otherId: 15,
  memoCode: 18,
};

function formatDelta(value) {
  const rounded = roundCurrency(value);
  return `${rounded > 0 ? '+' : ''}${formatCurrency(rounded)}`;
}

function listTopValues(map, limit = 25, mapper = null) {
  const values = Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
  return mapper ? values.map(mapper) : values;
}

async function listMatchingEntries(pattern, type = 'file') {
  return listEntriesFromRoot(BULK_ROOT, pattern, type);
}

async function loadCandidateParties() {
  const candidateParties = new Map();
  const cnDirs = await listMatchingEntries(CN_DIR_PATTERN, 'dir');

  for (const dirPath of cnDirs) {
    const filePath = path.join(dirPath, 'cn.txt');
    await readLines(filePath, (line) => {
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
  const files = await listMatchingEntries(CCL_FILE_PATTERN, 'file');

  for (const filePath of files) {
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const candidateId = normalizeWhitespace(fields[CCL_FIELD.candidateId]);
      const committeeId = normalizeCommitteeId(fields[CCL_FIELD.committeeId]);
      const party = candidateParties.get(candidateId) ?? null;
      if (!committeeId || !party) return;

      if (!partySetsByCommittee.has(committeeId)) {
        partySetsByCommittee.set(committeeId, new Set());
      }
      partySetsByCommittee.get(committeeId).add(party);
    });
  }

  return new Map(
    Array.from(partySetsByCommittee.entries(), ([committeeId, parties]) => [
      committeeId,
      parties.size === 1 ? Array.from(parties)[0] : null,
    ])
  );
}

async function loadCommitteeMasterMetadata() {
  const partySetsByCommittee = new Map();
  const committeeNames = new Map();
  const files = await listMatchingEntries(CM_FILE_PATTERN, 'file');

  for (const filePath of files) {
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const committeeId = normalizeCommitteeId(fields[CM_FIELD.committeeId]);
      const committeeName = normalizeWhitespace(fields[CM_FIELD.committeeName]) || null;
      const party = normalizeMajorParty(fields[CM_FIELD.party]);
      if (!committeeId) return;

      if (committeeName && !committeeNames.has(committeeId)) {
        committeeNames.set(committeeId, committeeName);
      }
      if (!party) return;

      if (!partySetsByCommittee.has(committeeId)) {
        partySetsByCommittee.set(committeeId, new Set());
      }
      partySetsByCommittee.get(committeeId).add(party);
    });
  }

  return {
    committeeNames,
    committeeParties: new Map(
      Array.from(partySetsByCommittee.entries(), ([committeeId, parties]) => [
        committeeId,
        parties.size === 1 ? Array.from(parties)[0] : null,
      ])
    ),
  };
}

async function findLatestCommitteeReport() {
  return findLatestReport(REPORTS_DIR, COMMITTEE_REPORT_PREFIX, {
    excludeSuffixes: [],
  });
}

function normalizeEntities(raw) {
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw?.entities) ? raw.entities : [];
}

function buildCommitteeCycleMap(report) {
  return new Map(
    (report.committeeCycles ?? []).map((record) => [
      committeeCycleKey(record.committeeId, record.cycle),
      record,
    ])
  );
}

function createEntitySummary(entity) {
  const currentSummary = entity.donationSummary ?? {};
  const currentRaw = Array.isArray(currentSummary.raw) ? currentSummary.raw : [];

  let currentLine23 = 0;
  let currentLine29 = 0;
  let currentExcluded = 0;
  let current21B = 0;
  let current28A = 0;
  let currentRawTotal = 0;

  for (const row of currentRaw) {
    const amount = Number(row.amount || 0);
    const lineNumber = normalizeWhitespace(row.lineNumber);
    currentRawTotal += amount;
    if (lineNumber === '23') currentLine23 += amount;
    if (lineNumber === '29') currentLine29 += amount;
    if (lineNumber === '21B') {
      current21B += amount;
      currentExcluded += amount;
    }
    if (lineNumber === '28A') {
      current28A += amount;
      currentExcluded += amount;
    }
  }

  return {
    entityId: entity.id,
    entityName: entity.name ?? entity.canonicalName ?? entity.id,
    committeeId: currentSummary.committeeId ?? entity.fecCommitteeId ?? '',
    committeeName: currentSummary.committeeName ?? null,
    current: {
      totalRepubs: roundCurrency(currentSummary.totalRepubs ?? 0),
      totalDems: roundCurrency(currentSummary.totalDems ?? 0),
      rawAmount: roundCurrency(currentRawTotal),
      line23RawAmount: roundCurrency(currentLine23),
      line29RawAmount: roundCurrency(currentLine29),
      excludedAmount: roundCurrency(currentExcluded),
      excluded21BAmount: roundCurrency(current21B),
      excluded28AAmount: roundCurrency(current28A),
    },
    source: {
      line23TotalAmount: 0,
      line23AlreadyAttributedAmount: 0,
      line23RawEquivalentAmount: 0,
      non24KAmount: 0,
      non24KRows: 0,
    },
    preview: {
      moveToR: 0,
      moveToD: 0,
      stayO: 0,
    },
  };
}

function ensureAmountBucket(map, key, seed) {
  if (!map.has(key)) {
    map.set(key, seed);
  }
  return map.get(key);
}

function buildMarkdownReport(report) {
  const lines = [];

  lines.push(`# PAC Line 23 Rehydration Preview - ${report.generatedAt}`);
  lines.push('');
  lines.push('This output is staging-only. It does not rewrite `entities.json`.');
  lines.push('The companion row file is a compact aggregated preview candidate for eventual shipped `raw[]` data, not a transaction-by-transaction dump.');
  lines.push('');
  lines.push('## Current Bundled Baseline');
  lines.push('');
  lines.push(`- PAC raw amount: ${formatCurrency(report.currentBundled.rawAmount)}`);
  lines.push(`- Current bundled line 23 raw: ${formatCurrency(report.currentBundled.line23RawAmount)}`);
  lines.push(`- Current bundled line 29 raw: ${formatCurrency(report.currentBundled.line29RawAmount)}`);
  lines.push(`- Current bundled excluded 21B + 28A: ${formatCurrency(report.currentBundled.excludedAmount)}`);
  lines.push('');
  lines.push('## OTH 24K Source Rehydration');
  lines.push('');
  lines.push(`- OTH 24K line 23 total: ${formatCurrency(report.source24K.line23TotalAmount)}`);
  lines.push(`- OTH 24K already-attributed amount: ${formatCurrency(report.source24K.line23AlreadyAttributedAmount)}`);
  lines.push(`- OTH 24K raw-equivalent amount: ${formatCurrency(report.source24K.line23RawEquivalentAmount)}`);
  lines.push(
    `- Raw-equivalent vs current bundled line 23 delta: ${formatDelta(report.source24K.rawEquivalentDeltaVsCurrentLine23)}`
  );
  lines.push('');
  lines.push('## Preview Movement From Raw-Equivalent Line 23');
  lines.push('');
  lines.push(`- Move to R: ${formatCurrency(report.previewMovement.moveToR)}`);
  lines.push(`- Move to D: ${formatCurrency(report.previewMovement.moveToD)}`);
  lines.push(`- Stay O: ${formatCurrency(report.previewMovement.stayO)}`);
  lines.push('');
  lines.push('### Movement By Method');
  lines.push('');
  for (const row of report.previewMovement.movedByMethod) {
    lines.push(`- ${row.method}: ${formatCurrency(row.amount)}`);
  }
  lines.push('');
  lines.push('### Top Entities By Reclassified Amount');
  lines.push('');
  for (const row of report.previewMovement.topEntitiesByMovedAmount.slice(0, 20)) {
    lines.push(
      `- ${row.entityId} | ${row.entityName} | move R ${formatCurrency(row.moveToR)} | move D ${formatCurrency(row.moveToD)} | stay O ${formatCurrency(row.stayO)} | current raw 23 ${formatCurrency(row.currentLine23RawAmount)} | source delta ${formatDelta(row.rawEquivalentDeltaVsCurrentLine23)}`
    );
  }
  lines.push('');
  lines.push('### Top Unresolved Line 23 Recipients');
  lines.push('');
  for (const row of report.previewMovement.topUnresolvedRecipients.slice(0, 20)) {
    lines.push(
      `- ${row.recipientCommitteeId} | ${row.recipientCommitteeName} | ${formatCurrency(row.amount)} | entities ${row.entityCount}`
    );
  }
  lines.push('');
  lines.push('### Biggest Validation Deltas');
  lines.push('');
  for (const row of report.validation.topEntityDeltas.slice(0, 20)) {
    lines.push(
      `- ${row.entityId} | ${row.entityName} | current raw 23 ${formatCurrency(row.currentLine23RawAmount)} | source raw-equivalent ${formatCurrency(row.line23RawEquivalentAmount)} | delta ${formatDelta(row.rawEquivalentDeltaVsCurrentLine23)}`
    );
  }
  lines.push('');
  lines.push('### Non-24K OTH Activity For Tracked PACs');
  lines.push('');
  if (report.source24K.non24KTransactionTypes.length === 0) {
    lines.push('- None.');
  } else {
    for (const row of report.source24K.non24KTransactionTypes.slice(0, 20)) {
      lines.push(
        `- ${row.transactionType} | ${row.entityType} | ${formatCurrency(row.amount)} | rows ${row.rows}`
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function parseArgs(argv) {
  const args = {
    basename: `pac-line23-rehydration-preview-${today()}`,
    committeeReport: null,
  };

  for (const arg of argv) {
    if (arg.startsWith('--basename=')) {
      const value = arg.slice('--basename='.length).trim();
      if (value) args.basename = value;
    } else if (arg.startsWith('--committee-report=')) {
      const value = arg.slice('--committee-report='.length).trim();
      if (value) args.committeeReport = path.resolve(process.cwd(), value);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = today();
  const committeeReportPath = args.committeeReport ?? (await findLatestCommitteeReport());
  const summaryJsonPath = path.join(REPORTS_DIR, `${args.basename}.json`);
  const summaryMdPath = path.join(REPORTS_DIR, `${args.basename}.md`);
  const rowsJsonPath = path.join(REPORTS_DIR, `${args.basename}.rows.json`);

  const rawEntities = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  const committeeReport = JSON.parse(await readFile(committeeReportPath, 'utf8'));
  const entities = normalizeEntities(rawEntities).filter(
    (entity) =>
      typeof entity?.donationSummary?.committeeId === 'string' &&
      entity.donationSummary.committeeId.length > 0
  );

  const committeeCycleMap = buildCommitteeCycleMap(committeeReport);
  const candidateParties = await loadCandidateParties();
  const candidateCommitteeParties = await loadCandidateCommitteeParties(candidateParties);
  const committeeMasterMetadata = await loadCommitteeMasterMetadata();

  const entitySummaries = new Map();
  const entityByCommitteeId = new Map();

  let currentRawAmount = 0;
  let currentLine23Amount = 0;
  let currentLine29Amount = 0;
  let currentExcludedAmount = 0;
  let currentExcluded21BAmount = 0;
  let currentExcluded28AAmount = 0;

  for (const entity of entities) {
    const summary = createEntitySummary(entity);
    entitySummaries.set(entity.id, summary);
    entityByCommitteeId.set(summary.committeeId, entity.id);
    currentRawAmount += summary.current.rawAmount;
    currentLine23Amount += summary.current.line23RawAmount;
    currentLine29Amount += summary.current.line29RawAmount;
    currentExcludedAmount += summary.current.excludedAmount;
    currentExcluded21BAmount += summary.current.excluded21BAmount;
    currentExcluded28AAmount += summary.current.excluded28AAmount;
  }

  const movedByMethod = new Map();
  const unresolvedRecipients = new Map();
  const non24KTransactionTypes = new Map();
  const rawEquivalentRows = new Map();

  let line23TotalAmount = 0;
  let line23AlreadyAttributedAmount = 0;
  let line23RawEquivalentAmount = 0;
  let previewMoveToR = 0;
  let previewMoveToD = 0;
  let previewStayO = 0;

  const othDirs = await listMatchingEntries(OTH_DIR_PATTERN, 'dir');
  for (const dirPath of othDirs) {
    const filePath = path.join(dirPath, 'itoth.txt');
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const filerCommitteeId = normalizeCommitteeId(fields[OTH_FIELD.committeeId]);
      const entityId = entityByCommitteeId.get(filerCommitteeId) ?? null;
      if (!entityId) return;

      const entitySummary = entitySummaries.get(entityId);
      const transactionType = normalizeWhitespace(fields[OTH_FIELD.transactionType]).toUpperCase();
      const entityType = normalizeWhitespace(fields[OTH_FIELD.entityType]).toUpperCase() || null;
      const amount = parseAmount(fields[OTH_FIELD.amount]);
      const cycle = dateToCycle(fields[OTH_FIELD.transactionDate]);
      const recipientCommitteeId = normalizeCommitteeId(fields[OTH_FIELD.otherId]);
      const recipientCommitteeName =
        normalizeWhitespace(fields[OTH_FIELD.recipientName]) ||
        committeeMasterMetadata.committeeNames.get(recipientCommitteeId) ||
        recipientCommitteeId ||
        '(blank)';
      const isMemo = normalizeWhitespace(fields[OTH_FIELD.memoCode]).toUpperCase() === 'X';

      if (!entitySummary || !cycle || amount === 0) return;

      if (transactionType !== '24K') {
        entitySummary.source.non24KAmount += amount;
        entitySummary.source.non24KRows += 1;
        const key = `${transactionType}:${entityType ?? 'null'}`;
        const bucket = ensureAmountBucket(non24KTransactionTypes, key, {
          transactionType,
          entityType,
          amount: 0,
          rows: 0,
        });
        bucket.amount += amount;
        bucket.rows += 1;
        return;
      }

      line23TotalAmount += amount;
      entitySummary.source.line23TotalAmount += amount;

      const formalParty = committeeMasterMetadata.committeeParties.get(recipientCommitteeId) ?? null;
      const candidateCommitteeParty = candidateCommitteeParties.get(recipientCommitteeId) ?? null;
      const currentApiParty = formalParty ?? candidateCommitteeParty ?? 'O';
      const committeeRecord =
        recipientCommitteeId && committeeCycleMap.has(committeeCycleKey(recipientCommitteeId, cycle))
          ? committeeCycleMap.get(committeeCycleKey(recipientCommitteeId, cycle))
          : null;
      const resolvedParty = committeeRecord?.resolvedParty ?? currentApiParty;
      const classificationMethod =
        committeeRecord?.classificationMethod ??
        (formalParty ? 'formal_cm_party' : candidateCommitteeParty ? 'candidate_committee_link' : 'unclassified');

      if (currentApiParty === 'O') {
        line23RawEquivalentAmount += amount;
        entitySummary.source.line23RawEquivalentAmount += amount;

        const rowKey = [
          entityId,
          filerCommitteeId,
          recipientCommitteeId || recipientCommitteeName,
          cycle,
          resolvedParty,
          classificationMethod,
        ].join(':');
        const row = ensureAmountBucket(rawEquivalentRows, rowKey, {
          entityId,
          entityName: entitySummary.entityName,
          filerCommitteeId,
          filerCommitteeName: entitySummary.committeeName ?? filerCommitteeId,
          lineNumber: '23',
          recipientCommitteeId: recipientCommitteeId || null,
          recipientCommitteeName,
          cycle,
          amount: 0,
          currentApiParty,
          resolvedParty,
          classificationMethod,
        });
        row.amount += amount;

        if (resolvedParty === 'R') {
          previewMoveToR += amount;
          entitySummary.preview.moveToR += amount;
          movedByMethod.set(
            classificationMethod,
            (movedByMethod.get(classificationMethod) ?? 0) + amount
          );
        } else if (resolvedParty === 'D') {
          previewMoveToD += amount;
          entitySummary.preview.moveToD += amount;
          movedByMethod.set(
            classificationMethod,
            (movedByMethod.get(classificationMethod) ?? 0) + amount
          );
        } else {
          previewStayO += amount;
          entitySummary.preview.stayO += amount;
          const unresolvedKey = recipientCommitteeId || recipientCommitteeName;
          const unresolvedBucket = ensureAmountBucket(unresolvedRecipients, unresolvedKey, {
            recipientCommitteeId: recipientCommitteeId || null,
            recipientCommitteeName,
            amount: 0,
            entityIds: new Set(),
          });
          unresolvedBucket.amount += amount;
          unresolvedBucket.entityIds.add(entityId);
        }
      } else {
        line23AlreadyAttributedAmount += amount;
        entitySummary.source.line23AlreadyAttributedAmount += amount;
      }
    });
  }

  const entitySummariesList = Array.from(entitySummaries.values()).map((summary) => {
    const rawEquivalentDeltaVsCurrentLine23 =
      summary.source.line23RawEquivalentAmount - summary.current.line23RawAmount;

    return {
      ...summary,
      source: {
        line23TotalAmount: roundCurrency(summary.source.line23TotalAmount),
        line23AlreadyAttributedAmount: roundCurrency(summary.source.line23AlreadyAttributedAmount),
        line23RawEquivalentAmount: roundCurrency(summary.source.line23RawEquivalentAmount),
        non24KAmount: roundCurrency(summary.source.non24KAmount),
        non24KRows: summary.source.non24KRows,
        rawEquivalentDeltaVsCurrentLine23: roundCurrency(rawEquivalentDeltaVsCurrentLine23),
      },
      preview: {
        moveToR: roundCurrency(summary.preview.moveToR),
        moveToD: roundCurrency(summary.preview.moveToD),
        stayO: roundCurrency(summary.preview.stayO),
      },
    };
  });

  const summary = {
    generatedAt,
    sourceFiles: {
      entities: ENTITIES_PATH,
      committeeReport: committeeReportPath,
      rawEquivalentRows: rowsJsonPath,
    },
    currentBundled: {
      rawAmount: roundCurrency(currentRawAmount),
      line23RawAmount: roundCurrency(currentLine23Amount),
      line29RawAmount: roundCurrency(currentLine29Amount),
      excludedAmount: roundCurrency(currentExcludedAmount),
      excluded21BAmount: roundCurrency(currentExcluded21BAmount),
      excluded28AAmount: roundCurrency(currentExcluded28AAmount),
    },
    source24K: {
      line23TotalAmount: roundCurrency(line23TotalAmount),
      line23AlreadyAttributedAmount: roundCurrency(line23AlreadyAttributedAmount),
      line23RawEquivalentAmount: roundCurrency(line23RawEquivalentAmount),
      rawEquivalentDeltaVsCurrentLine23: roundCurrency(
        line23RawEquivalentAmount - currentLine23Amount
      ),
      non24KTransactionTypes: Array.from(non24KTransactionTypes.values())
        .map((row) => ({
          ...row,
          amount: roundCurrency(row.amount),
        }))
        .sort((a, b) => b.amount - a.amount || a.transactionType.localeCompare(b.transactionType)),
    },
    previewMovement: {
      moveToR: roundCurrency(previewMoveToR),
      moveToD: roundCurrency(previewMoveToD),
      stayO: roundCurrency(previewStayO),
      movedByMethod: Array.from(movedByMethod.entries())
        .map(([method, amount]) => ({
          method,
          amount: roundCurrency(amount),
        }))
        .sort((a, b) => b.amount - a.amount || a.method.localeCompare(b.method)),
      topEntitiesByMovedAmount: entitySummariesList
        .filter((row) => row.preview.moveToR > 0 || row.preview.moveToD > 0 || row.preview.stayO > 0)
        .map((row) => ({
          entityId: row.entityId,
          entityName: row.entityName,
          currentLine23RawAmount: row.current.line23RawAmount,
          line23RawEquivalentAmount: row.source.line23RawEquivalentAmount,
          rawEquivalentDeltaVsCurrentLine23: row.source.rawEquivalentDeltaVsCurrentLine23,
          moveToR: row.preview.moveToR,
          moveToD: row.preview.moveToD,
          stayO: row.preview.stayO,
          amount: roundCurrency(row.preview.moveToR + row.preview.moveToD + row.preview.stayO),
        }))
        .sort((a, b) => b.amount - a.amount || a.entityId.localeCompare(b.entityId))
        .slice(0, 50),
      topUnresolvedRecipients: listTopValues(unresolvedRecipients, 50, (row) => ({
        recipientCommitteeId: row.recipientCommitteeId,
        recipientCommitteeName: row.recipientCommitteeName,
        amount: roundCurrency(row.amount),
        entityCount: row.entityIds.size,
      })),
    },
    validation: {
      topEntityDeltas: entitySummariesList
        .map((row) => ({
          entityId: row.entityId,
          entityName: row.entityName,
          currentLine23RawAmount: row.current.line23RawAmount,
          line23RawEquivalentAmount: row.source.line23RawEquivalentAmount,
          rawEquivalentDeltaVsCurrentLine23: row.source.rawEquivalentDeltaVsCurrentLine23,
          amount: Math.abs(row.source.rawEquivalentDeltaVsCurrentLine23),
        }))
        .sort((a, b) => b.amount - a.amount || a.entityId.localeCompare(b.entityId))
        .slice(0, 50),
    },
    entities: entitySummariesList,
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  const compactRawEquivalentRows = Array.from(rawEquivalentRows.values())
    .map((row) => ({
      ...row,
      amount: roundCurrency(row.amount),
    }))
    .sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount;
      if (a.entityId !== b.entityId) return a.entityId.localeCompare(b.entityId);
      if (a.recipientCommitteeId !== b.recipientCommitteeId) {
        return String(a.recipientCommitteeId).localeCompare(String(b.recipientCommitteeId));
      }
      return a.cycle - b.cycle;
    });

  await writeFile(summaryJsonPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
  await writeFile(summaryMdPath, buildMarkdownReport(summary), 'utf8');
  await writeFile(rowsJsonPath, JSON.stringify(compactRawEquivalentRows, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${summaryJsonPath}`);
  console.log(`Wrote ${summaryMdPath}`);
  console.log(`Wrote ${rowsJsonPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
