import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  classifyMajorPartyBucket as classifyParty,
  committeeCycleKey,
  formatCurrency,
  formatPct,
  normalizeCommitteeId,
  normalizeWhitespace,
  roundCurrency,
  today,
} from './lib/data-classification/common.mjs';
import { findLatestReport, replaceJsonSuffix } from './lib/data-classification/report-files.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const REPORTS_DIR = path.join(__dirname, '../tools/fec-bulk/reports');
const COMMITTEE_REPORT_PREFIX = 'committee-beneficiary-classification-';
const INHERENTLY_PARTISAN_REPORT_PREFIX = 'inherently-partisan-staging-';

const SPOTLIGHT_IDS = [
  'jeff-bezos',
  'richard-uihlein',
  'reid-hoffman',
  'miriam-adelson',
  'michael-r-bloomberg',
];

function partyCodeForBucket(value) {
  if (value === 'R') return 'REP';
  if (value === 'D') return 'DEM';
  return null;
}

function cycleLabel(cycle) {
  if (!Number.isFinite(cycle) || cycle < 2000) return '';
  return `${cycle - 1}-${String(cycle).slice(2)}`;
}

function listTopEntries(values, limit = 25, mapper = null) {
  const entries = Array.from(values.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
  return mapper ? entries.map(mapper) : entries;
}

async function findLatestCommitteeReport() {
  return findLatestReport(REPORTS_DIR, COMMITTEE_REPORT_PREFIX);
}

async function findLatestInherentlyPartisanReport() {
  return findLatestReport(REPORTS_DIR, INHERENTLY_PARTISAN_REPORT_PREFIX);
}

function peopleRowsPathForSummary(summaryPath) {
  return replaceJsonSuffix(summaryPath, '.people.rows.json');
}

function normalizePeopleDocument(raw) {
  if (Array.isArray(raw)) {
    return {
      isWrapped: false,
      meta: null,
      people: raw,
    };
  }

  return {
    isWrapped: true,
    meta: raw?._meta ?? null,
    people: Array.isArray(raw?.people) ? raw.people : [],
  };
}

function buildCommitteeCycleMap(report) {
  return new Map(
    (report.committeeCycles ?? []).map((record) => [
      committeeCycleKey(record.committeeId, record.cycle),
      record,
    ])
  );
}

function summarizePeopleTotals(people) {
  let totalR = 0;
  let totalD = 0;
  let totalO = 0;

  for (const person of people) {
    const summary = person.donationSummary;
    if (!summary) continue;
    totalR += Number(summary.totalR || 0);
    totalD += Number(summary.totalD || 0);
    totalO += Number(summary.totalO || 0);
  }

  const trackedTotal = totalR + totalD + totalO;
  return {
    totalR: roundCurrency(totalR),
    totalD: roundCurrency(totalD),
    totalO: roundCurrency(totalO),
    trackedTotal: roundCurrency(trackedTotal),
    oShare: trackedTotal > 0 ? totalO / trackedTotal : 0,
  };
}

function summarizeRawRows(rows) {
  let totalR = 0;
  let totalD = 0;
  let totalO = 0;

  for (const row of rows) {
    const amount = Number(row?.amount || 0);
    if (amount <= 0) continue;

    const bucket = classifyParty(row?.committeeParty);
    if (bucket === 'R') totalR += amount;
    else if (bucket === 'D') totalD += amount;
    else totalO += amount;
  }

  return {
    totalR: roundCurrency(totalR),
    totalD: roundCurrency(totalD),
    totalO: roundCurrency(totalO),
    trackedTotal: roundCurrency(totalR + totalD + totalO),
  };
}

function summarizePeopleRawTotals(people) {
  let totalR = 0;
  let totalD = 0;
  let totalO = 0;
  let rawRows = 0;

  for (const person of people) {
    const summary = person?.donationSummary;
    if (!summary) continue;

    const raw = Array.isArray(summary.raw) ? summary.raw : [];
    rawRows += raw.length;
    const rowTotals = summarizeRawRows(raw);
    totalR += rowTotals.totalR;
    totalD += rowTotals.totalD;
    totalO += rowTotals.totalO;
  }

  const trackedTotal = totalR + totalD + totalO;
  return {
    totalR: roundCurrency(totalR),
    totalD: roundCurrency(totalD),
    totalO: roundCurrency(totalO),
    trackedTotal: roundCurrency(trackedTotal),
    oShare: trackedTotal > 0 ? totalO / trackedTotal : 0,
    rawRows,
  };
}

function measureSummaryDrift(people) {
  let totalR = 0;
  let totalD = 0;
  let totalO = 0;
  const topPeople = [];

  for (const person of people) {
    const summary = person?.donationSummary;
    if (!summary) continue;

    const rawTotals = summarizeRawRows(summary.raw ?? []);
    const driftR = roundCurrency(Number(summary.totalR || 0) - rawTotals.totalR);
    const driftD = roundCurrency(Number(summary.totalD || 0) - rawTotals.totalD);
    const driftO = roundCurrency(Number(summary.totalO || 0) - rawTotals.totalO);
    const trackedDrift = roundCurrency(driftR + driftD + driftO);

    totalR += driftR;
    totalD += driftD;
    totalO += driftO;

    if (trackedDrift === 0) continue;
    topPeople.push({
      personId: person.id,
      displayName: person.displayName,
      driftR,
      driftD,
      driftO,
      trackedDrift,
    });
  }

  topPeople.sort(
    (a, b) => Math.abs(b.trackedDrift) - Math.abs(a.trackedDrift) || a.personId.localeCompare(b.personId)
  );

  return {
    totalR: roundCurrency(totalR),
    totalD: roundCurrency(totalD),
    totalO: roundCurrency(totalO),
    trackedTotal: roundCurrency(totalR + totalD + totalO),
    peopleAffected: topPeople.length,
    topPeople: topPeople.slice(0, 20),
  };
}

function getRecentCycle(rawRows) {
  const rawCycles = rawRows
    .map((row) => Number(row?.cycle))
    .filter((cycle) => Number.isFinite(cycle) && cycle > 0);

  return rawCycles.length > 0 ? Math.max(...rawCycles) : 0;
}

function sortPeopleRawRows(rows) {
  return rows.slice().sort((a, b) => {
    const cycleDiff = Number(b.cycle || 0) - Number(a.cycle || 0);
    if (cycleDiff !== 0) return cycleDiff;

    const dateDiff = String(b.contributionDate || '').localeCompare(String(a.contributionDate || ''));
    if (dateDiff !== 0) return dateDiff;

    const amountDiff = Number(b.amount || 0) - Number(a.amount || 0);
    if (amountDiff !== 0) return amountDiff;

    return normalizeWhitespace(a.committeeName).localeCompare(normalizeWhitespace(b.committeeName));
  });
}

function rebuildSummaryFromRaw(summary, rawRows, generatedAt) {
  let totalR = 0;
  let totalD = 0;
  let totalO = 0;
  const activeCycles = new Set();
  const cycleTotals = new Map();

  for (const row of rawRows) {
    const amount = Number(row?.amount || 0);
    if (amount <= 0) continue;

    const cycle = Number(row?.cycle || 0);
    if (Number.isFinite(cycle) && cycle > 0) {
      activeCycles.add(cycle);
      if (!cycleTotals.has(cycle)) {
        cycleTotals.set(cycle, { totalR: 0, totalD: 0, totalO: 0 });
      }
    }

    const bucket = classifyParty(row?.committeeParty);
    if (bucket === 'R') totalR += amount;
    else if (bucket === 'D') totalD += amount;
    else totalO += amount;

    if (cycleTotals.has(cycle)) {
      const cycleBucket = cycleTotals.get(cycle);
      if (bucket === 'R') cycleBucket.totalR += amount;
      else if (bucket === 'D') cycleBucket.totalD += amount;
      else cycleBucket.totalO += amount;
    }
  }

  const nextRaw = sortPeopleRawRows(rawRows);
  const nextActiveCycles = Array.from(activeCycles).sort((a, b) => a - b);
  const recentCycleNumber = getRecentCycle(nextRaw);
  const recentCycleTotals = cycleTotals.get(recentCycleNumber) ?? { totalR: 0, totalD: 0, totalO: 0 };

  return {
    ...summary,
    totalR: roundCurrency(totalR),
    totalD: roundCurrency(totalD),
    totalO: roundCurrency(totalO),
    recentCycleR: roundCurrency(recentCycleTotals.totalR),
    recentCycleD: roundCurrency(recentCycleTotals.totalD),
    recentCycleO: roundCurrency(recentCycleTotals.totalO),
    recentCycle: cycleLabel(recentCycleNumber),
    activeCycles: nextActiveCycles,
    raw: nextRaw,
    lastUpdated: generatedAt,
  };
}

function buildAdditiveRowsByPerson(rows) {
  const byPersonId = new Map();

  for (const row of rows) {
    const personId = normalizeWhitespace(row?.personId);
    if (!personId) continue;
    if (!byPersonId.has(personId)) byPersonId.set(personId, []);
    byPersonId.get(personId).push({
      committeeName: normalizeWhitespace(row?.committeeName) || normalizeWhitespace(row?.committeeId),
      committeeId: normalizeCommitteeId(row?.committeeId),
      committeeParty: normalizeWhitespace(row?.committeeParty) || null,
      committeeType: normalizeWhitespace(row?.committeeType) || null,
      amount: roundCurrency(Number(row?.amount || 0)),
      cycle: Number(row?.cycle || 0),
      contributionDate: normalizeWhitespace(row?.contributionDate) || '',
      sourceKind: normalizeWhitespace(row?.sourceKind) || 'inherently_partisan',
    });
  }

  return byPersonId;
}

function buildSpotlight(beforePerson, afterPerson, committeeCycleMap) {
  if (!beforePerson?.donationSummary || !afterPerson?.donationSummary) return null;

  const beforeRaw = beforePerson.donationSummary.raw ?? [];
  const afterRaw = afterPerson.donationSummary.raw ?? [];
  const beforeRowsByIdentity = new Map(
    beforeRaw.map((row) => [
      [
        normalizeCommitteeId(row.committeeId),
        row.cycle,
        roundCurrency(row.amount),
        normalizeWhitespace(row.contributionDate),
      ].join(':'),
      row,
    ])
  );
  const beforeKeys = new Set(
    beforeRaw.map((row) =>
      [
        normalizeCommitteeId(row.committeeId),
        row.cycle,
        roundCurrency(row.amount),
        normalizeWhitespace(row.contributionDate),
      ].join(':')
    )
  );
  const reclassifiedRows = [];
  const addedRows = [];
  const remainingORows = [];

  for (let index = 0; index < afterRaw.length; index += 1) {
    const afterRow = afterRaw[index];
    const key = committeeCycleKey(normalizeCommitteeId(afterRow.committeeId), afterRow.cycle);
    const committeeRecord = committeeCycleMap.get(key);
    const rowIdentity = [
      normalizeCommitteeId(afterRow.committeeId),
      afterRow.cycle,
      roundCurrency(afterRow.amount),
      normalizeWhitespace(afterRow.contributionDate),
    ].join(':');
    const beforeRow = beforeRowsByIdentity.get(rowIdentity) ?? afterRow;
    const isNewRow = !beforeKeys.has(rowIdentity);

    if (isNewRow && classifyParty(afterRow.committeeParty) !== 'O') {
      addedRows.push({
        committeeId: afterRow.committeeId,
        committeeName: afterRow.committeeName,
        cycle: afterRow.cycle,
        amount: roundCurrency(afterRow.amount),
        toParty: afterRow.committeeParty,
        classificationMethod: normalizeWhitespace(afterRow.sourceKind) || 'added',
      });
    } else if (
      classifyParty(beforeRow.committeeParty) === 'O' &&
      classifyParty(afterRow.committeeParty) !== 'O'
    ) {
      reclassifiedRows.push({
        committeeId: afterRow.committeeId,
        committeeName: afterRow.committeeName,
        cycle: afterRow.cycle,
        amount: roundCurrency(afterRow.amount),
        toParty: afterRow.committeeParty,
        classificationMethod: committeeRecord?.classificationMethod ?? 'unclassified',
      });
    }

    if (classifyParty(afterRow.committeeParty) === 'O') {
      remainingORows.push({
        committeeId: afterRow.committeeId,
        committeeName: afterRow.committeeName,
        cycle: afterRow.cycle,
        amount: roundCurrency(afterRow.amount),
        committeeParty: afterRow.committeeParty ?? null,
      });
    }
  }

  reclassifiedRows.sort((a, b) => b.amount - a.amount);
  addedRows.sort((a, b) => b.amount - a.amount);
  remainingORows.sort((a, b) => b.amount - a.amount);

  return {
    personId: beforePerson.id,
    displayName: beforePerson.displayName,
    before: {
      totalR: roundCurrency(beforePerson.donationSummary.totalR ?? 0),
      totalD: roundCurrency(beforePerson.donationSummary.totalD ?? 0),
      totalO: roundCurrency(beforePerson.donationSummary.totalO ?? 0),
    },
    after: {
      totalR: roundCurrency(afterPerson.donationSummary.totalR ?? 0),
      totalD: roundCurrency(afterPerson.donationSummary.totalD ?? 0),
      totalO: roundCurrency(afterPerson.donationSummary.totalO ?? 0),
    },
    reclassifiedRows: reclassifiedRows.slice(0, 10),
    addedRows: addedRows.slice(0, 10),
    remainingORows: remainingORows.slice(0, 10),
  };
}

function buildMarkdownReport(report) {
  const lines = [];

  lines.push(`# People Classification Preview - ${report.generatedAt}`);
  lines.push('');
  lines.push('This output is staging-only. It does not modify `assets/data/people.json`.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Current totalO: ${formatCurrency(report.before.totalO)} (${formatPct(report.before.oShare)})`);
  lines.push(`- Reclassified move to R: ${formatCurrency(report.movement.reclassifiedToR)}`);
  lines.push(`- Reclassified move to D: ${formatCurrency(report.movement.reclassifiedToD)}`);
  lines.push(`- Inherently partisan add to R: ${formatCurrency(report.movement.addedToR)}`);
  lines.push(`- Inherently partisan add to D: ${formatCurrency(report.movement.addedToD)}`);
  lines.push(`- Preview totalO: ${formatCurrency(report.after.totalO)} (${formatPct(report.after.oShare)})`);
  lines.push(`- People reclassified: ${report.movement.peopleReclassified}`);
  lines.push(`- People with inherently partisan additions: ${report.movement.peopleWithAdditions}`);
  lines.push(`- Rows reclassified: ${report.movement.rowsReclassified}`);
  lines.push(`- Rows added: ${report.movement.rowsAdded}`);
  lines.push('');
  lines.push('## Summary Drift');
  lines.push('');
  lines.push(
    `- Current summary-vs-raw O drift: ${formatCurrency(report.summaryDrift.before.totalO)} across ${report.summaryDrift.before.peopleAffected} people`
  );
  lines.push(
    `- Current summary-vs-raw tracked drift: ${formatCurrency(report.summaryDrift.before.trackedTotal)}`
  );
  lines.push(
    `- Preview summary-vs-raw O drift: ${formatCurrency(report.summaryDrift.after.totalO)} across ${report.summaryDrift.after.peopleAffected} people`
  );
  lines.push(
    `- Preview summary-vs-raw tracked drift: ${formatCurrency(report.summaryDrift.after.trackedTotal)}`
  );
  lines.push('');
  lines.push('## Raw Shape');
  lines.push('');
  lines.push(`- Current raw rows: ${report.rawShape.currentRawRows}`);
  lines.push(`- Preview raw rows: ${report.rawShape.previewRawRows}`);
  lines.push(`- Added raw rows: ${report.rawShape.addedRawRows}`);
  lines.push(
    `- Current compact/minified bytes: ${report.rawShape.currentCompactBytes.toLocaleString()}`
  );
  lines.push(
    `- Preview compact/minified bytes: ${report.rawShape.previewCompactBytes.toLocaleString()}`
  );
  lines.push('');
  lines.push('### Movement By Method');
  lines.push('');
  for (const row of report.movement.movedByMethod) {
    lines.push(`- ${row.method}: ${formatCurrency(row.amount)}`);
  }
  lines.push('');
  lines.push('### Top Reclassified Committee Cycles');
  lines.push('');
  for (const row of report.movement.topReclassifiedCommitteeCycles.slice(0, 20)) {
    lines.push(
      `- ${row.committeeId} | ${row.committeeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)} | ${row.resolvedParty} | ${row.classificationMethod}`
    );
  }
  lines.push('');
  lines.push('### Top Added Committee Cycles');
  lines.push('');
  for (const row of report.movement.topAddedCommitteeCycles.slice(0, 20)) {
    lines.push(
      `- ${row.committeeId} | ${row.committeeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)} | ${row.resolvedParty} | ${row.classificationMethod}`
    );
  }
  lines.push('');
  lines.push('### Top Remaining O Committees');
  lines.push('');
  for (const row of report.movement.topStillOCommittees.slice(0, 20)) {
    lines.push(`- ${row.committeeId} | ${row.committeeName} | ${formatCurrency(row.amount)}`);
  }
  lines.push('');
  lines.push('## Donor Spot-Checks');
  lines.push('');

  for (const spotlight of Object.values(report.spotlights)) {
    if (!spotlight) continue;
    lines.push(`### ${spotlight.displayName}`);
    lines.push('');
    lines.push(`- Before O: ${formatCurrency(spotlight.before.totalO)}`);
    lines.push(`- After O: ${formatCurrency(spotlight.after.totalO)}`);
    if (spotlight.reclassifiedRows.length === 0) {
      lines.push('- Reclassified rows: none');
    } else {
      for (const row of spotlight.reclassifiedRows.slice(0, 5)) {
        lines.push(
          `- Reclassified: ${row.committeeId} | ${row.committeeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)} | ${row.toParty} | ${row.classificationMethod}`
        );
      }
    }
    if (spotlight.addedRows.length === 0) {
      lines.push('- Added rows: none');
    } else {
      for (const row of spotlight.addedRows.slice(0, 5)) {
        lines.push(
          `- Added: ${row.committeeId} | ${row.committeeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)} | ${row.toParty} | ${row.classificationMethod}`
        );
      }
    }
    for (const row of spotlight.remainingORows.slice(0, 5)) {
      lines.push(
        `- Remaining O: ${row.committeeId} | ${row.committeeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)}`
      );
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function parseArgs(argv) {
  const args = {
    basename: `people-classification-preview-${today()}`,
    people: PEOPLE_PATH,
    committeeReport: null,
    inherentlyPartisanReport: null,
    previewOutput: null,
  };

  for (const arg of argv) {
    if (arg.startsWith('--basename=')) {
      const value = arg.slice('--basename='.length).trim();
      if (value) args.basename = value;
    } else if (arg.startsWith('--people=')) {
      const value = arg.slice('--people='.length).trim();
      if (value) args.people = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--committee-report=')) {
      const value = arg.slice('--committee-report='.length).trim();
      if (value) args.committeeReport = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--inherently-partisan-report=')) {
      const value = arg.slice('--inherently-partisan-report='.length).trim();
      if (value) args.inherentlyPartisanReport = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--preview-output=')) {
      const value = arg.slice('--preview-output='.length).trim();
      if (value) args.previewOutput = path.resolve(process.cwd(), value);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = today();
  const committeeReportPath = args.committeeReport ?? (await findLatestCommitteeReport());
  const inherentlyPartisanReportPath =
    args.inherentlyPartisanReport ?? (await findLatestInherentlyPartisanReport());
  const inherentlyPartisanPeopleRowsPath = peopleRowsPathForSummary(inherentlyPartisanReportPath);
  const previewOutputPath =
    args.previewOutput ?? path.join(REPORTS_DIR, `${args.basename}.people.json`);
  const summaryJsonPath = path.join(REPORTS_DIR, `${args.basename}.json`);
  const summaryMdPath = path.join(REPORTS_DIR, `${args.basename}.md`);

  const rawPeopleDocument = JSON.parse(await readFile(args.people, 'utf8'));
  const rawCommitteeReport = JSON.parse(await readFile(committeeReportPath, 'utf8'));
  const inherentlyPartisanPeopleRows = JSON.parse(
    await readFile(inherentlyPartisanPeopleRowsPath, 'utf8')
  );
  const peopleDocument = normalizePeopleDocument(rawPeopleDocument);
  const committeeCycleMap = buildCommitteeCycleMap(rawCommitteeReport);
  const additiveRowsByPerson = buildAdditiveRowsByPerson(inherentlyPartisanPeopleRows);
  const beforeTotals = summarizePeopleTotals(peopleDocument.people);
  const beforeRawTotals = summarizePeopleRawTotals(peopleDocument.people);
  const beforeSummaryDrift = measureSummaryDrift(peopleDocument.people);

  let reclassifiedToR = 0;
  let reclassifiedToD = 0;
  let addedToR = 0;
  let addedToD = 0;
  let rowsReclassified = 0;
  let rowsAdded = 0;
  const reclassifiedPeopleIds = new Set();
  const addedPeopleIds = new Set();
  const movedByMethod = new Map();
  const topReclassifiedCommitteeCycles = new Map();
  const topAddedCommitteeCycles = new Map();
  const topStillOCommittees = new Map();

  const nextPeople = peopleDocument.people.map((person) => {
    if (!person?.donationSummary) return person;

    const nextRaw = (person.donationSummary.raw ?? []).map((row) => {
      const key = committeeCycleKey(normalizeCommitteeId(row.committeeId), row.cycle);
      const record = committeeCycleMap.get(key);
      const resolvedParty = record?.resolvedParty ?? 'O';
      const currentBucket = classifyParty(row.committeeParty);
      const nextParty = partyCodeForBucket(resolvedParty);

      if (currentBucket === 'O' && nextParty) {
        const amount = Number(row.amount || 0);
        const classificationMethod = record?.classificationMethod ?? 'unclassified';
        const committeeName = record?.committeeName ?? row.committeeName ?? row.committeeId;

        rowsReclassified += 1;
        reclassifiedPeopleIds.add(person.id);
        if (resolvedParty === 'R') reclassifiedToR += amount;
        if (resolvedParty === 'D') reclassifiedToD += amount;
        movedByMethod.set(
          classificationMethod,
          (movedByMethod.get(classificationMethod) ?? 0) + amount
        );

        if (!topReclassifiedCommitteeCycles.has(key)) {
          topReclassifiedCommitteeCycles.set(key, {
            committeeId: row.committeeId,
            committeeName,
            cycle: row.cycle,
            resolvedParty,
            classificationMethod,
            amount: 0,
          });
        }
        topReclassifiedCommitteeCycles.get(key).amount += amount;

        return {
          ...row,
          committeeParty: nextParty,
        };
      }

      return row;
    });

    for (const addedRow of additiveRowsByPerson.get(person.id) ?? []) {
      const amount = Number(addedRow.amount || 0);
      if (amount <= 0) continue;
      rowsAdded += 1;
      addedPeopleIds.add(person.id);
      if (classifyParty(addedRow.committeeParty) === 'R') addedToR += amount;
      if (classifyParty(addedRow.committeeParty) === 'D') addedToD += amount;

      const key = committeeCycleKey(normalizeCommitteeId(addedRow.committeeId), addedRow.cycle);
      if (!topAddedCommitteeCycles.has(key)) {
        topAddedCommitteeCycles.set(key, {
          committeeId: addedRow.committeeId,
          committeeName: addedRow.committeeName,
          cycle: addedRow.cycle,
          resolvedParty: classifyParty(addedRow.committeeParty),
          classificationMethod: addedRow.sourceKind,
          amount: 0,
        });
      }
      topAddedCommitteeCycles.get(key).amount += amount;
      nextRaw.push(addedRow);
    }

    const nextSummary = rebuildSummaryFromRaw(person.donationSummary, nextRaw, generatedAt);

    for (const row of nextRaw) {
      if (classifyParty(row.committeeParty) !== 'O') continue;
      const committeeId = row.committeeId;
      const committeeName = row.committeeName ?? committeeId;
      if (!topStillOCommittees.has(committeeId)) {
        topStillOCommittees.set(committeeId, {
          committeeId,
          committeeName,
          amount: 0,
        });
      }
      topStillOCommittees.get(committeeId).amount += Number(row.amount || 0);
    }

    return {
      ...person,
      donationSummary: nextSummary,
    };
  });

  const afterTotals = summarizePeopleTotals(nextPeople);
  const afterRawTotals = summarizePeopleRawTotals(nextPeople);
  const afterSummaryDrift = measureSummaryDrift(nextPeople);
  const nextPeopleById = new Map(nextPeople.map((person) => [person.id, person]));
  const spotlights = Object.fromEntries(
    SPOTLIGHT_IDS.map((personId) => {
      const beforePerson = peopleDocument.people.find((person) => person.id === personId) ?? null;
      const afterPerson = nextPeopleById.get(personId) ?? null;
      return [personId, buildSpotlight(beforePerson, afterPerson, committeeCycleMap)];
    })
  );

  const summary = {
    generatedAt,
    sourceFiles: {
      people: args.people,
      committeeReport: committeeReportPath,
      inherentlyPartisanReport: inherentlyPartisanReportPath,
      inherentlyPartisanPeopleRows: inherentlyPartisanPeopleRowsPath,
      previewPeople: previewOutputPath,
    },
    before: beforeTotals,
    after: afterTotals,
    movement: {
      reclassifiedToR: roundCurrency(reclassifiedToR),
      reclassifiedToD: roundCurrency(reclassifiedToD),
      addedToR: roundCurrency(addedToR),
      addedToD: roundCurrency(addedToD),
      peopleReclassified: reclassifiedPeopleIds.size,
      peopleWithAdditions: addedPeopleIds.size,
      rowsReclassified,
      rowsAdded,
      movedByMethod: Array.from(movedByMethod.entries())
        .map(([method, amount]) => ({
          method,
          amount: roundCurrency(amount),
        }))
        .sort((a, b) => b.amount - a.amount || a.method.localeCompare(b.method)),
      topReclassifiedCommitteeCycles: listTopEntries(topReclassifiedCommitteeCycles, 50, (entry) => ({
        ...entry,
        amount: roundCurrency(entry.amount),
      })),
      topAddedCommitteeCycles: listTopEntries(topAddedCommitteeCycles, 50, (entry) => ({
        ...entry,
        amount: roundCurrency(entry.amount),
      })),
      topStillOCommittees: listTopEntries(topStillOCommittees, 50, (entry) => ({
        ...entry,
        amount: roundCurrency(entry.amount),
      })),
    },
    spotlights,
  };

  const previewMeta = {
    ...(peopleDocument.meta ?? {}),
    updatedAt: generatedAt,
    classificationPreviewGeneratedAt: generatedAt,
    classificationPreviewSourcePeople: args.people,
    classificationPreviewSourceCommitteeReport: committeeReportPath,
    classificationPreviewSourceInherentlyPartisanReport: inherentlyPartisanReportPath,
    classificationPreviewPeopleAffected: new Set([
      ...reclassifiedPeopleIds,
      ...addedPeopleIds,
    ]).size,
    classificationPreviewRowsReclassified: rowsReclassified,
    classificationPreviewRowsAdded: rowsAdded,
  };

  const previewValue = peopleDocument.isWrapped
    ? {
        ...rawPeopleDocument,
        _meta: previewMeta,
        people: nextPeople,
      }
    : nextPeople;
  const currentCompactBytes = Buffer.byteLength(JSON.stringify(rawPeopleDocument));
  const previewCompactBytes = Buffer.byteLength(JSON.stringify(previewValue));

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(previewOutputPath, JSON.stringify(previewValue, null, 2) + '\n', 'utf8');
  const fullSummary = {
    ...summary,
    rawBackedTotals: {
      before: beforeRawTotals,
      after: afterRawTotals,
    },
    summaryDrift: {
      before: beforeSummaryDrift,
      after: afterSummaryDrift,
    },
    rawShape: {
      currentRawRows: beforeRawTotals.rawRows,
      previewRawRows: afterRawTotals.rawRows,
      addedRawRows: afterRawTotals.rawRows - beforeRawTotals.rawRows,
      currentCompactBytes,
      previewCompactBytes,
    },
  };
  await writeFile(summaryJsonPath, JSON.stringify(fullSummary, null, 2) + '\n', 'utf8');
  await writeFile(summaryMdPath, buildMarkdownReport(fullSummary), 'utf8');

  console.log(`Wrote ${summaryJsonPath}`);
  console.log(`Wrote ${summaryMdPath}`);
  console.log(`Wrote ${previewOutputPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
