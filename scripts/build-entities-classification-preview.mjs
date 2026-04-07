import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  formatCurrency,
  formatPct,
  normalizeWhitespace,
  roundCurrency,
  today,
} from './lib/data-classification/common.mjs';
import { findLatestReport, replaceJsonSuffix } from './lib/data-classification/report-files.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const REPORTS_DIR = path.join(__dirname, '../tools/fec-bulk/reports');
const PAC_PREVIEW_PREFIX = 'pac-line23-rehydration-preview-';
const INHERENTLY_PARTISAN_REPORT_PREFIX = 'inherently-partisan-staging-';
const EXCLUDED_DISPLAY_LINES = new Set(['21B', '28A']);

function toCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function fromCents(value) {
  return roundCurrency(value / 100);
}

function normalizeLineNumber(value) {
  return normalizeWhitespace(value).toUpperCase();
}

function isExcludedDisplayLine(lineNumber) {
  return EXCLUDED_DISPLAY_LINES.has(normalizeLineNumber(lineNumber));
}

function listTopRows(values, limit = 25) {
  return Array.from(values)
    .sort((a, b) => b.amount - a.amount || a.entityId.localeCompare(b.entityId))
    .slice(0, limit);
}

async function findLatestPacPreviewSummary() {
  return findLatestReport(REPORTS_DIR, PAC_PREVIEW_PREFIX);
}

async function findLatestInherentlyPartisanSummary() {
  return findLatestReport(REPORTS_DIR, INHERENTLY_PARTISAN_REPORT_PREFIX);
}

function rowsPathForSummary(summaryPath) {
  return replaceJsonSuffix(summaryPath, '.rows.json');
}

function entityRowsPathForSummary(summaryPath) {
  return replaceJsonSuffix(summaryPath, '.entities.rows.json');
}

function normalizeEntitiesDocument(raw) {
  if (Array.isArray(raw)) {
    return {
      isWrapped: false,
      meta: null,
      entities: raw,
    };
  }

  return {
    isWrapped: true,
    meta: raw?._meta ?? null,
    entities: Array.isArray(raw?.entities) ? raw.entities : [],
  };
}

function detectBundleMaxCycle(entities) {
  let maxCycle = 0;

  for (const entity of entities) {
    const summary = entity?.donationSummary;
    if (!summary) continue;

    const recentCycle = Number(summary.recentCycle || 0);
    if (Number.isFinite(recentCycle) && recentCycle > maxCycle) {
      maxCycle = recentCycle;
    }

    const activeCycles = Array.isArray(summary.activeCycles) ? summary.activeCycles : [];
    for (const cycle of activeCycles) {
      const numericCycle = Number(cycle || 0);
      if (Number.isFinite(numericCycle) && numericCycle > maxCycle) {
        maxCycle = numericCycle;
      }
    }

    const rawRows = Array.isArray(summary.raw) ? summary.raw : [];
    for (const row of rawRows) {
      const cycle = Number(row?.cycle || 0);
      if (Number.isFinite(cycle) && cycle > maxCycle) {
        maxCycle = cycle;
      }
    }
  }

  return maxCycle || 2024;
}

function addCycleCents(map, cycle, cents) {
  if (!Number.isFinite(cycle) || cycle <= 0 || cents === 0) return;
  map.set(cycle, (map.get(cycle) ?? 0) + cents);
}

function buildSourceRowsByEntity(pacRows, currentBundleMaxCycle) {
  const rowsByEntity = new Map();
  const ongoingCycleAmounts = new Map();

  for (const row of pacRows) {
    const cycle = Number(row?.cycle || 0);
    if (!Number.isFinite(cycle) || cycle <= 0) continue;

    if (cycle > currentBundleMaxCycle) {
      ongoingCycleAmounts.set(cycle, (ongoingCycleAmounts.get(cycle) ?? 0) + Number(row.amount || 0));
    }

    const entityId = normalizeWhitespace(row?.entityId);
    if (!entityId) continue;

    if (!rowsByEntity.has(entityId)) {
      rowsByEntity.set(entityId, new Map());
    }
    const byCycle = rowsByEntity.get(entityId);
    if (!byCycle.has(cycle)) {
      byCycle.set(cycle, []);
    }
    byCycle.get(cycle).push({
      recipientCommitteeId: normalizeWhitespace(row?.recipientCommitteeId) || null,
      recipientCommitteeName: normalizeWhitespace(row?.recipientCommitteeName) || null,
      resolvedParty: normalizeWhitespace(row?.resolvedParty) || 'O',
      classificationMethod: normalizeWhitespace(row?.classificationMethod) || 'unclassified',
      amountCents: toCents(row.amount),
    });
  }

  return {
    rowsByEntity,
    ongoingCycles: Array.from(ongoingCycleAmounts.entries())
      .map(([cycle, amount]) => ({ cycle, amount: roundCurrency(amount) }))
      .sort((a, b) => a.cycle - b.cycle),
  };
}

function buildInherentlyPartisanRowsByEntity(rows, currentBundleMaxCycle) {
  const rowsByEntity = new Map();
  const ongoingCycleAmounts = new Map();
  const sourceKindTotals = new Map();

  for (const row of rows) {
    const entityId = normalizeWhitespace(row?.entityId);
    const cycle = Number(row?.cycle || 0);
    const resolvedParty = normalizeWhitespace(row?.resolvedParty) || 'O';
    const sourceKind = normalizeWhitespace(row?.sourceKind) || 'inherently_partisan';
    const amountCents = toCents(row?.amount);

    if (!entityId || !Number.isFinite(cycle) || cycle <= 0 || amountCents <= 0) continue;
    if (resolvedParty !== 'R' && resolvedParty !== 'D') continue;

    if (cycle > currentBundleMaxCycle) {
      ongoingCycleAmounts.set(cycle, (ongoingCycleAmounts.get(cycle) ?? 0) + amountCents / 100);
    }
    sourceKindTotals.set(sourceKind, (sourceKindTotals.get(sourceKind) ?? 0) + amountCents / 100);

    if (!rowsByEntity.has(entityId)) rowsByEntity.set(entityId, []);
    rowsByEntity.get(entityId).push({
      cycle,
      amountCents,
      resolvedParty,
      sourceKind,
      recipientCommitteeId: normalizeWhitespace(row?.recipientCommitteeId) || null,
      recipientCommitteeName: normalizeWhitespace(row?.recipientCommitteeName) || null,
    });
  }

  return {
    rowsByEntity,
    ongoingCycles: Array.from(ongoingCycleAmounts.entries())
      .map(([cycle, amount]) => ({ cycle, amount: roundCurrency(amount) }))
      .sort((a, b) => a.cycle - b.cycle),
    sourceKindTotals: Array.from(sourceKindTotals.entries())
      .map(([sourceKind, amount]) => ({ sourceKind, amount: roundCurrency(amount) }))
      .sort((a, b) => b.amount - a.amount || a.sourceKind.localeCompare(b.sourceKind)),
  };
}

function sumAmounts(rows) {
  return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function buildRecipientKey(entityId, cycle, row) {
  return (
    normalizeWhitespace(row.recipientCommitteeId) ||
    normalizeWhitespace(row.recipientCommitteeName) ||
    `${entityId}:${cycle}:unknown`
  );
}

function recordRemainingRecipient(map, entityId, cycle, row) {
  const recipientKey = buildRecipientKey(entityId, cycle, row);
  if (!map.has(recipientKey)) {
    map.set(recipientKey, {
      recipientCommitteeId: row.recipientCommitteeId,
      recipientCommitteeName: row.recipientCommitteeName,
      amount: 0,
      entityIds: new Set(),
    });
  }
  const bucket = map.get(recipientKey);
  bucket.amount += row.appliedCents / 100;
  bucket.entityIds.add(entityId);
}

function findMaxCycleInRows(rows) {
  let maxCycle = 0;
  for (const row of rows) {
    const cycle = Number(row?.cycle || 0);
    if (Number.isFinite(cycle) && cycle > maxCycle) maxCycle = cycle;
  }
  return maxCycle;
}

function buildActiveCycles(summary, rawRows, movedByCycleR, movedByCycleD) {
  const cycles = new Set();

  for (const cycle of Array.isArray(summary.activeCycles) ? summary.activeCycles : []) {
    const numericCycle = Number(cycle || 0);
    if (Number.isFinite(numericCycle) && numericCycle > 0) cycles.add(numericCycle);
  }

  for (const row of rawRows) {
    const cycle = Number(row?.cycle || 0);
    if (Number.isFinite(cycle) && cycle > 0) cycles.add(cycle);
  }

  for (const cycle of movedByCycleR.keys()) cycles.add(cycle);
  for (const cycle of movedByCycleD.keys()) cycles.add(cycle);

  return Array.from(cycles).sort((a, b) => a - b);
}

function sumDisplayOtherCents(rows, cycle = null) {
  return rows.reduce((sum, row) => {
    if (isExcludedDisplayLine(row?.lineNumber)) return sum;
    if (cycle !== null && Number(row?.cycle || 0) !== cycle) return sum;
    return sum + toCents(row?.amount);
  }, 0);
}

function buildMarkdownReport(report) {
  const lines = [];

  lines.push(`# Entities Classification Preview - ${report.generatedAt}`);
  lines.push('');
  lines.push('This output is staging-only. It does not rewrite `assets/data/entities.json`.');
  lines.push('The preview keeps the current runtime-compatible `raw[]` meaning: unresolved / excluded remainder only, while moving reclassified line 23 dollars into `R/D` totals.');
  lines.push('');
  lines.push('## Scope');
  lines.push('');
  lines.push(`- Current bundle max cycle: ${report.scope.currentBundleMaxCycle}`);
  lines.push(`- Ongoing-cycle line 23 source added in preview: ${formatCurrency(report.scope.ongoingCycleSourceAmount)}`);
  for (const row of report.scope.ongoingCycles) {
    lines.push(`- Ongoing cycle ${row.cycle}: ${formatCurrency(row.amount)}`);
  }
  lines.push(`- Ongoing inherently partisan source added in preview: ${formatCurrency(report.scope.ongoingInherentlyPartisanAmount)}`);
  for (const row of report.scope.ongoingInherentlyPartisanCycles) {
    lines.push(`- Inherently partisan cycle ${row.cycle}: ${formatCurrency(row.amount)}`);
  }
  lines.push('');
  lines.push('## Totals');
  lines.push('');
  lines.push(`- Current totalRepubs: ${formatCurrency(report.before.totalRepubs)}`);
  lines.push(`- Current totalDems: ${formatCurrency(report.before.totalDems)}`);
  lines.push(`- Current totalO: ${formatCurrency(report.before.totalO)} (${formatPct(report.before.otherShare)})`);
  lines.push(`- Preview totalRepubs: ${formatCurrency(report.after.totalRepubs)}`);
  lines.push(`- Preview totalDems: ${formatCurrency(report.after.totalDems)}`);
  lines.push(`- Preview totalO: ${formatCurrency(report.after.totalO)} (${formatPct(report.after.otherShare)})`);
  lines.push('');
  lines.push('## Line 23 Movement');
  lines.push('');
  lines.push(`- Move to R: ${formatCurrency(report.movement.moveToR)}`);
  lines.push(`- Move to D: ${formatCurrency(report.movement.moveToD)}`);
  lines.push(`- Retained as unresolved line 23: ${formatCurrency(report.movement.retainedLine23O)}`);
  lines.push(`- Ongoing-cycle line 23 added with no current control row: ${formatCurrency(report.movement.ongoingAddedLine23)}`);
  lines.push(`- Legacy residual line 23 kept without recipient mapping: ${formatCurrency(report.movement.legacyResidualLine23)}`);
  lines.push(`- Historic source line 23 ignored because current bundle had no matching control row: ${formatCurrency(report.movement.historicSourceOnlyNoCurrentLine23)}`);
  lines.push(`- Source line 23 scaled down to fit current bundle control totals: ${formatCurrency(report.movement.scaledDownFromSource)}`);
  lines.push('');
  lines.push('## Inherently Partisan Additions');
  lines.push('');
  lines.push(`- Add to R: ${formatCurrency(report.inherentlyPartisan.addToR)}`);
  lines.push(`- Add to D: ${formatCurrency(report.inherentlyPartisan.addToD)}`);
  lines.push(`- Entities affected: ${report.inherentlyPartisan.entitiesAffected}`);
  for (const row of report.inherentlyPartisan.sourceKindTotals) {
    lines.push(`- ${row.sourceKind}: ${formatCurrency(row.amount)}`);
  }
  lines.push('');
  lines.push('## Raw Shape');
  lines.push('');
  lines.push(`- Current raw rows: ${report.rawShape.currentRawRows}`);
  lines.push(`- Preview raw rows: ${report.rawShape.previewRawRows}`);
  lines.push(`- Current line 23 rows: ${report.rawShape.currentLine23Rows}`);
  lines.push(`- Preview unresolved recipient-level line 23 rows: ${report.rawShape.previewRecipientLine23Rows}`);
  lines.push(`- Preview residual legacy line 23 rows: ${report.rawShape.previewResidualLine23Rows}`);
  lines.push(`- Current entities.json bytes: ${report.rawShape.currentEntitiesBytes.toLocaleString()}`);
  lines.push(`- Preview entities file bytes: ${report.rawShape.previewEntitiesBytes.toLocaleString()}`);
  lines.push('');
  lines.push('## Top Entities By Moved Amount');
  lines.push('');
  for (const row of report.movement.topEntitiesByMovedAmount) {
    lines.push(
      `- ${row.entityId} | ${row.entityName} | move R ${formatCurrency(row.moveToR)} | move D ${formatCurrency(row.moveToD)} | preview other ${formatCurrency(row.previewTotalOther)} | current raw 23 ${formatCurrency(row.currentLine23)}`
    );
  }
  lines.push('');
  lines.push('## Top Entities By Inherently Partisan Added Amount');
  lines.push('');
  for (const row of report.inherentlyPartisan.topEntitiesByAddedAmount) {
    lines.push(
      `- ${row.entityId} | ${row.entityName} | add R ${formatCurrency(row.addToR)} | add D ${formatCurrency(row.addToD)} | sources ${row.sourceKinds.join(', ')}`
    );
  }
  lines.push('');
  lines.push('## Top Remaining Line 23 Recipients');
  lines.push('');
  for (const row of report.movement.topRemainingRecipients) {
    lines.push(
      `- ${row.recipientCommitteeId ?? '(no id)'} | ${row.recipientCommitteeName ?? '(unnamed)'} | ${formatCurrency(row.amount)} | entities ${row.entityCount}`
    );
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function scaleRowsToControl(sourceRows, controlCents) {
  const sourceTotalCents = sourceRows.reduce((sum, row) => sum + row.amountCents, 0);
  if (sourceTotalCents <= controlCents) {
    return {
      appliedRows: sourceRows.map((row) => ({ ...row, appliedCents: row.amountCents })),
      appliedTotalCents: sourceTotalCents,
      scaledDownCents: 0,
    };
  }

  const scaledRows = sourceRows.map((row) => {
    const exact = (row.amountCents * controlCents) / sourceTotalCents;
    const floor = Math.floor(exact);
    return {
      ...row,
      appliedCents: floor,
      remainder: exact - floor,
    };
  });

  let assigned = scaledRows.reduce((sum, row) => sum + row.appliedCents, 0);
  let remaining = controlCents - assigned;
  scaledRows.sort((a, b) => b.remainder - a.remainder || b.amountCents - a.amountCents);

  for (let index = 0; index < scaledRows.length && remaining > 0; index += 1) {
    scaledRows[index].appliedCents += 1;
    remaining -= 1;
  }

  assigned = scaledRows.reduce((sum, row) => sum + row.appliedCents, 0);

  return {
    appliedRows: scaledRows,
    appliedTotalCents: assigned,
    scaledDownCents: sourceTotalCents - assigned,
  };
}

function cloneRow(row) {
  return {
    ...row,
    amount: roundCurrency(row.amount),
  };
}

function makeUnresolvedLine23Row(sourceRow, cycle) {
  const row = {
    lineNumber: '23',
    description: '',
    amount: fromCents(sourceRow.appliedCents),
    cycle,
    isReceipt: false,
  };

  if (sourceRow.recipientCommitteeId) {
    row.recipientCommitteeId = sourceRow.recipientCommitteeId;
  } else if (sourceRow.recipientCommitteeName) {
    row.recipientCommitteeName = sourceRow.recipientCommitteeName;
  }

  return row;
}

function sortRawRows(rows) {
  const lineOrder = new Map([
    ['29', 10],
    ['23', 20],
    ['22', 30],
    ['26', 40],
    ['21B', 50],
    ['28A', 60],
  ]);

  return rows.slice().sort((a, b) => {
    const cycleDiff = Number(b.cycle || 0) - Number(a.cycle || 0);
    if (cycleDiff !== 0) return cycleDiff;

    const lineDiff =
      (lineOrder.get(normalizeLineNumber(a.lineNumber)) ?? 999) -
      (lineOrder.get(normalizeLineNumber(b.lineNumber)) ?? 999);
    if (lineDiff !== 0) return lineDiff;

    const recipientA = normalizeWhitespace(a.recipientCommitteeId ?? a.recipientCommitteeName ?? '');
    const recipientB = normalizeWhitespace(b.recipientCommitteeId ?? b.recipientCommitteeName ?? '');
    if (recipientA !== recipientB) return recipientA.localeCompare(recipientB);

    return normalizeWhitespace(a.description).localeCompare(normalizeWhitespace(b.description));
  });
}


function parseArgs(argv) {
  const args = {
    basename: `entities-classification-preview-${today()}`,
    pacPreview: null,
    inherentlyPartisanReport: null,
  };

  for (const arg of argv) {
    if (arg.startsWith('--basename=')) {
      const value = arg.slice('--basename='.length).trim();
      if (value) args.basename = value;
    } else if (arg.startsWith('--pac-preview=')) {
      const value = arg.slice('--pac-preview='.length).trim();
      if (value) args.pacPreview = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--inherently-partisan-report=')) {
      const value = arg.slice('--inherently-partisan-report='.length).trim();
      if (value) args.inherentlyPartisanReport = path.resolve(process.cwd(), value);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = today();
  const pacPreviewSummaryPath = args.pacPreview ?? (await findLatestPacPreviewSummary());
  const pacPreviewRowsPath = rowsPathForSummary(pacPreviewSummaryPath);
  const inherentlyPartisanSummaryPath =
    args.inherentlyPartisanReport ?? (await findLatestInherentlyPartisanSummary());
  const inherentlyPartisanRowsPath = entityRowsPathForSummary(inherentlyPartisanSummaryPath);

  const summaryJsonPath = path.join(REPORTS_DIR, `${args.basename}.json`);
  const summaryMdPath = path.join(REPORTS_DIR, `${args.basename}.md`);
  const previewEntitiesPath = path.join(REPORTS_DIR, `${args.basename}.entities.json`);

  const rawEntitiesDocument = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  const pacRows = JSON.parse(await readFile(pacPreviewRowsPath, 'utf8'));
  const inherentlyPartisanRows = JSON.parse(await readFile(inherentlyPartisanRowsPath, 'utf8'));
  const entitiesDocument = normalizeEntitiesDocument(rawEntitiesDocument);
  const entities = entitiesDocument.entities;
  const currentBundleMaxCycle = detectBundleMaxCycle(entities);

  const { rowsByEntity, ongoingCycles } = buildSourceRowsByEntity(pacRows, currentBundleMaxCycle);
  const {
    rowsByEntity: inherentlyRowsByEntity,
    ongoingCycles: ongoingInherentlyPartisanCycles,
    sourceKindTotals,
  } = buildInherentlyPartisanRowsByEntity(inherentlyPartisanRows, currentBundleMaxCycle);

  let beforeTotalRepubs = 0;
  let beforeTotalDems = 0;
  let beforeTotalOther = 0;

  let afterTotalRepubs = 0;
  let afterTotalDems = 0;
  let afterTotalOther = 0;

  let currentRawRows = 0;
  let previewRawRows = 0;
  let currentLine23Rows = 0;
  let previewRecipientLine23Rows = 0;
  let previewResidualLine23Rows = 0;

  let moveToR = 0;
  let moveToD = 0;
  let retainedLine23O = 0;
  let ongoingAddedLine23 = 0;
  let legacyResidualLine23 = 0;
  let historicSourceOnlyNoCurrentLine23 = 0;
  let scaledDownFromSource = 0;
  let inherentlyPartisanToR = 0;
  let inherentlyPartisanToD = 0;

  const topEntities = [];
  const topInherentlyPartisanEntities = [];
  const remainingRecipients = new Map();

  const previewEntities = entities.map((entity) => {
    const summary = entity?.donationSummary;
    if (!summary) return entity;

    const rawRows = Array.isArray(summary.raw) ? summary.raw.map(cloneRow) : [];
    const otherRows = rawRows.filter((row) => normalizeWhitespace(row.lineNumber) !== '23');
    const currentLine23 = rawRows.filter((row) => normalizeWhitespace(row.lineNumber) === '23');
    const recentCycle = Number(summary.recentCycle || 0);

    currentRawRows += rawRows.length;
    currentLine23Rows += currentLine23.length;

    const currentDisplayOtherCents = sumDisplayOtherCents(rawRows);
    beforeTotalRepubs += Number(summary.totalRepubs || 0);
    beforeTotalDems += Number(summary.totalDems || 0);
    beforeTotalOther += currentDisplayOtherCents / 100;

    const sourceByCycle = rowsByEntity.get(entity.id) ?? new Map();
    const inherentlyEntityRows = inherentlyRowsByEntity.get(entity.id) ?? [];
    const currentCycles = new Set(currentLine23.map((row) => Number(row.cycle || 0)));
    const movedRCentsByCycle = new Map();
    const movedDCentsByCycle = new Map();

    let movedRCents = 0;
    let movedDCents = 0;
    let retainedOCents = 0;
    let ongoingAddedCents = 0;
    let residualCents = 0;
    let historicIgnoredSourceCents = 0;
    let scaledDownCents = 0;
    let inherentlyAddedRCents = 0;
    let inherentlyAddedDCents = 0;
    const inherentlyRCentsByCycle = new Map();
    const inherentlyDCentsByCycle = new Map();
    const inherentSourceKinds = new Set();

    const nextRawRows = otherRows.slice();

    const applyResolvedRows = (appliedRows, cycle) => {
      for (const appliedRow of appliedRows) {
        if (appliedRow.appliedCents <= 0) continue;

        if (appliedRow.resolvedParty === 'R') {
          movedRCents += appliedRow.appliedCents;
          addCycleCents(movedRCentsByCycle, cycle, appliedRow.appliedCents);
          continue;
        }

        if (appliedRow.resolvedParty === 'D') {
          movedDCents += appliedRow.appliedCents;
          addCycleCents(movedDCentsByCycle, cycle, appliedRow.appliedCents);
          continue;
        }

        retainedOCents += appliedRow.appliedCents;
        nextRawRows.push(makeUnresolvedLine23Row(appliedRow, cycle));
        recordRemainingRecipient(remainingRecipients, entity.id, cycle, appliedRow);
      }
    };

    for (const row of currentLine23) {
      const cycle = Number(row.cycle || 0);
      const controlCents = toCents(row.amount);
      const sourceRows = sourceByCycle.get(cycle) ?? [];

      if (sourceRows.length === 0) {
        nextRawRows.push(cloneRow(row));
        residualCents += controlCents;
        continue;
      }

      const { appliedRows, appliedTotalCents, scaledDownCents: cycleScaledDown } = scaleRowsToControl(
        sourceRows,
        controlCents
      );
      scaledDownCents += cycleScaledDown;
      applyResolvedRows(appliedRows, cycle);

      const cycleResidualCents = controlCents - appliedTotalCents;
      if (cycleResidualCents > 0) {
        residualCents += cycleResidualCents;
        nextRawRows.push({
          ...row,
          amount: fromCents(cycleResidualCents),
        });
      }
    }

    for (const [cycle, rows] of sourceByCycle.entries()) {
      if (currentCycles.has(cycle)) continue;

      if (cycle > currentBundleMaxCycle) {
        ongoingAddedCents += rows.reduce((sum, row) => sum + row.amountCents, 0);
        const appliedRows = rows.map((row) => ({ ...row, appliedCents: row.amountCents }));
        applyResolvedRows(appliedRows, cycle);
        continue;
      }

      historicIgnoredSourceCents += rows.reduce((sum, row) => sum + row.amountCents, 0);
    }

    const nextRaw = sortRawRows(nextRawRows);
    const nextDisplayOtherCents = sumDisplayOtherCents(nextRaw);
    const nextActiveCycles = buildActiveCycles(summary, nextRaw, movedRCentsByCycle, movedDCentsByCycle);
    const previewRecentCycle =
      nextActiveCycles.length > 0 ? Math.max(...nextActiveCycles) : Math.max(recentCycle, findMaxCycleInRows(nextRaw));
    const previewRecentOtherCents = sumDisplayOtherCents(nextRaw, previewRecentCycle);

    let nextRecentRepubs = 0;
    let nextRecentDems = 0;
    if (previewRecentCycle > recentCycle) {
      nextRecentRepubs = fromCents(movedRCentsByCycle.get(previewRecentCycle) ?? 0);
      nextRecentDems = fromCents(movedDCentsByCycle.get(previewRecentCycle) ?? 0);
    } else {
      nextRecentRepubs = roundCurrency(
        Number(summary.recentRepubs || 0) + (movedRCentsByCycle.get(previewRecentCycle) ?? 0) / 100
      );
      nextRecentDems = roundCurrency(
        Number(summary.recentDems || 0) + (movedDCentsByCycle.get(previewRecentCycle) ?? 0) / 100
      );
    }

    let previewSummary = {
      ...summary,
      recentCycle: previewRecentCycle,
      totalRepubs: roundCurrency(Number(summary.totalRepubs || 0) + movedRCents / 100),
      totalDems: roundCurrency(Number(summary.totalDems || 0) + movedDCents / 100),
      recentRepubs: nextRecentRepubs,
      recentDems: nextRecentDems,
      totalO: fromCents(nextDisplayOtherCents),
      recentO: fromCents(previewRecentOtherCents),
      activeCycles: nextActiveCycles,
      raw: nextRaw,
      lastUpdated: generatedAt,
    };

    for (const row of inherentlyEntityRows) {
      inherentSourceKinds.add(row.sourceKind);
      if (row.resolvedParty === 'R') {
        inherentlyAddedRCents += row.amountCents;
        addCycleCents(inherentlyRCentsByCycle, row.cycle, row.amountCents);
      } else if (row.resolvedParty === 'D') {
        inherentlyAddedDCents += row.amountCents;
        addCycleCents(inherentlyDCentsByCycle, row.cycle, row.amountCents);
      }
    }

    const finalActiveCycleSet = new Set(previewSummary.activeCycles);
    for (const row of inherentlyEntityRows) finalActiveCycleSet.add(row.cycle);
    const finalActiveCycles = Array.from(finalActiveCycleSet).sort((a, b) => a - b);
    const finalRecentCycle =
      finalActiveCycles.length > 0 ? Math.max(...finalActiveCycles) : previewSummary.recentCycle;
    const finalRecentOtherCents = sumDisplayOtherCents(nextRaw, finalRecentCycle);
    const finalRecentRepubs =
      finalRecentCycle === previewSummary.recentCycle
        ? roundCurrency(
            Number(previewSummary.recentRepubs || 0) +
              (inherentlyRCentsByCycle.get(finalRecentCycle) ?? 0) / 100
          )
        : fromCents(inherentlyRCentsByCycle.get(finalRecentCycle) ?? 0);
    const finalRecentDems =
      finalRecentCycle === previewSummary.recentCycle
        ? roundCurrency(
            Number(previewSummary.recentDems || 0) +
              (inherentlyDCentsByCycle.get(finalRecentCycle) ?? 0) / 100
          )
        : fromCents(inherentlyDCentsByCycle.get(finalRecentCycle) ?? 0);

    previewSummary = {
      ...previewSummary,
      recentCycle: finalRecentCycle,
      totalRepubs: roundCurrency(Number(previewSummary.totalRepubs || 0) + inherentlyAddedRCents / 100),
      totalDems: roundCurrency(Number(previewSummary.totalDems || 0) + inherentlyAddedDCents / 100),
      recentRepubs: finalRecentRepubs,
      recentDems: finalRecentDems,
      recentO: fromCents(finalRecentOtherCents),
      activeCycles: finalActiveCycles,
    };

    const currentLine23Amount = currentLine23.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    moveToR += movedRCents / 100;
    moveToD += movedDCents / 100;
    retainedLine23O += retainedOCents / 100;
    ongoingAddedLine23 += ongoingAddedCents / 100;
    legacyResidualLine23 += residualCents / 100;
    historicSourceOnlyNoCurrentLine23 += historicIgnoredSourceCents / 100;
    scaledDownFromSource += scaledDownCents / 100;
    inherentlyPartisanToR += inherentlyAddedRCents / 100;
    inherentlyPartisanToD += inherentlyAddedDCents / 100;

    afterTotalRepubs += previewSummary.totalRepubs;
    afterTotalDems += previewSummary.totalDems;
    afterTotalOther += nextDisplayOtherCents / 100;

    previewRawRows += nextRaw.length;
    previewRecipientLine23Rows += nextRaw.filter(
      (row) =>
        normalizeWhitespace(row.lineNumber) === '23' &&
        (normalizeWhitespace(row.recipientCommitteeId) || normalizeWhitespace(row.recipientCommitteeName))
    ).length;
    previewResidualLine23Rows += nextRaw.filter(
      (row) =>
        normalizeWhitespace(row.lineNumber) === '23' &&
        !normalizeWhitespace(row.recipientCommitteeId) &&
        !normalizeWhitespace(row.recipientCommitteeName)
    ).length;

    topEntities.push({
      entityId: entity.id,
      entityName: entity.name ?? entity.canonicalName ?? entity.id,
      moveToR: roundCurrency(movedRCents / 100),
      moveToD: roundCurrency(movedDCents / 100),
      currentLine23: roundCurrency(currentLine23Amount),
      previewTotalOther: fromCents(nextDisplayOtherCents),
      amount: roundCurrency((movedRCents + movedDCents) / 100),
    });
    topInherentlyPartisanEntities.push({
      entityId: entity.id,
      entityName: entity.name ?? entity.canonicalName ?? entity.id,
      addToR: roundCurrency(inherentlyAddedRCents / 100),
      addToD: roundCurrency(inherentlyAddedDCents / 100),
      amount: roundCurrency((inherentlyAddedRCents + inherentlyAddedDCents) / 100),
      sourceKinds: Array.from(inherentSourceKinds).sort(),
    });

    return {
      ...entity,
      donationSummary: previewSummary,
    };
  });

  const previewDocument = entitiesDocument.isWrapped
    ? {
        ...rawEntitiesDocument,
        _meta: entitiesDocument.meta,
        entities: previewEntities,
      }
    : previewEntities;

  const previewEntitiesJson = JSON.stringify(previewDocument, null, 2) + '\n';
  const currentEntitiesJson = await readFile(ENTITIES_PATH, 'utf8');

  const report = {
    generatedAt,
    sourceFiles: {
      entities: ENTITIES_PATH,
      pacPreviewSummary: pacPreviewSummaryPath,
      pacPreviewRows: pacPreviewRowsPath,
      inherentlyPartisanSummary: inherentlyPartisanSummaryPath,
      inherentlyPartisanRows: inherentlyPartisanRowsPath,
    },
    scope: {
      currentBundleMaxCycle,
      ongoingCycleSourceAmount: roundCurrency(sumAmounts(ongoingCycles)),
      ongoingCycles,
      ongoingInherentlyPartisanAmount: roundCurrency(sumAmounts(ongoingInherentlyPartisanCycles)),
      ongoingInherentlyPartisanCycles,
    },
    before: {
      totalRepubs: roundCurrency(beforeTotalRepubs),
      totalDems: roundCurrency(beforeTotalDems),
      totalO: roundCurrency(beforeTotalOther),
      trackedTotal: roundCurrency(beforeTotalRepubs + beforeTotalDems + beforeTotalOther),
      otherShare:
        beforeTotalRepubs + beforeTotalDems + beforeTotalOther > 0
          ? beforeTotalOther / (beforeTotalRepubs + beforeTotalDems + beforeTotalOther)
          : 0,
    },
    after: {
      totalRepubs: roundCurrency(afterTotalRepubs),
      totalDems: roundCurrency(afterTotalDems),
      totalO: roundCurrency(afterTotalOther),
      trackedTotal: roundCurrency(afterTotalRepubs + afterTotalDems + afterTotalOther),
      otherShare:
        afterTotalRepubs + afterTotalDems + afterTotalOther > 0
          ? afterTotalOther / (afterTotalRepubs + afterTotalDems + afterTotalOther)
          : 0,
    },
    movement: {
      moveToR: roundCurrency(moveToR),
      moveToD: roundCurrency(moveToD),
      retainedLine23O: roundCurrency(retainedLine23O),
      ongoingAddedLine23: roundCurrency(ongoingAddedLine23),
      legacyResidualLine23: roundCurrency(legacyResidualLine23),
      historicSourceOnlyNoCurrentLine23: roundCurrency(historicSourceOnlyNoCurrentLine23),
      scaledDownFromSource: roundCurrency(scaledDownFromSource),
      topEntitiesByMovedAmount: listTopRows(topEntities.filter((row) => row.amount > 0), 40),
      topRemainingRecipients: Array.from(remainingRecipients.values())
        .map((row) => ({
          recipientCommitteeId: row.recipientCommitteeId,
          recipientCommitteeName: row.recipientCommitteeName,
          amount: roundCurrency(row.amount),
          entityCount: row.entityIds.size,
        }))
        .sort((a, b) => b.amount - a.amount || String(a.recipientCommitteeId).localeCompare(String(b.recipientCommitteeId)))
        .slice(0, 40),
    },
    inherentlyPartisan: {
      addToR: roundCurrency(inherentlyPartisanToR),
      addToD: roundCurrency(inherentlyPartisanToD),
      entitiesAffected: topInherentlyPartisanEntities.filter((row) => row.amount > 0).length,
      sourceKindTotals,
      topEntitiesByAddedAmount: listTopRows(
        topInherentlyPartisanEntities.filter((row) => row.amount > 0),
        40
      ),
    },
    rawShape: {
      currentRawRows,
      previewRawRows,
      currentLine23Rows,
      previewRecipientLine23Rows,
      previewResidualLine23Rows,
      currentEntitiesBytes: Buffer.byteLength(currentEntitiesJson, 'utf8'),
      previewEntitiesBytes: Buffer.byteLength(previewEntitiesJson, 'utf8'),
    },
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(summaryJsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  await writeFile(summaryMdPath, buildMarkdownReport(report), 'utf8');
  await writeFile(previewEntitiesPath, previewEntitiesJson, 'utf8');

  console.log(`Wrote ${summaryJsonPath}`);
  console.log(`Wrote ${summaryMdPath}`);
  console.log(`Wrote ${previewEntitiesPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
