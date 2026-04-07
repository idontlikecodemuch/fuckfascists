import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  committeeCycleKey,
  dateToCycle,
  formatCurrency,
  formatPct,
  listMatchingEntries as listEntriesFromRoot,
  normalizeCommitteeId,
  normalizeMajorParty,
  normalizeWhitespace,
  parseAmount,
  readLines,
  roundCurrency,
  today,
} from './lib/data-classification/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BULK_ROOT = path.join(__dirname, '../tools/fec-bulk');
const REPORTS_DIR = path.join(BULK_ROOT, 'reports');
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const BENEFICIARY_SPEC_PATH = path.join(
  __dirname,
  '../docs/BENEFICIARY_CLASSIFICATION_SPEC.md'
);
const VERIFICATION_REPORT_PATH = path.join(
  REPORTS_DIR,
  'committee-party-verification-2026-04-03.md'
);

const CCL_FILE_PATTERN = /^ccl(?: \d+)?\.txt$/i;
const CM_FILE_PATTERN = /^cm(?: \d+)?\.txt$/i;
const PAS2_FILE_PATTERN = /^itpas2(?: \d+)?\.txt$/i;
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

const PAS2_FIELD = {
  committeeId: 0,
  transactionType: 5,
  transactionDate: 13,
  amount: 14,
  otherId: 15,
  candidateId: 16,
  memoCode: 18,
};

const OTH_FIELD = {
  committeeId: 0,
  transactionType: 5,
  transactionDate: 13,
  amount: 14,
  otherId: 15,
  memoCode: 18,
};

const PAS2_OPPOSITION_CODES = new Set(['24A', '24N']);
const PAS2_SUPPORT_CODES = new Set(['24C', '24E', '24F', '24H', '24K', '24P', '24R', '24Z']);
const OTH_OPPOSITION_CODES = new Set(['24A', '24N']);
const OTH_SUPPORT_CODES = new Set(['22H', '24G', '24H', '24K', '24P', '24R', '24T', '24Z']);

function oppositeParty(value) {
  if (value === 'R') return 'D';
  if (value === 'D') return 'R';
  return null;
}

function createCodeStatsEntry(code) {
  return {
    code,
    rows: 0,
    amount: 0,
    memoRows: 0,
    memoAmount: 0,
  };
}

function createSourceStats() {
  return {
    rNet: 0,
    dNet: 0,
    scoreableRows: 0,
    scoreableAmount: 0,
    unscoredRows: 0,
    unscoredAmount: 0,
    memoRows: 0,
    memoAmount: 0,
    byCode: new Map(),
  };
}

function createCommitteeCycleRecord(committeeId, cycle) {
  return {
    committeeId,
    cycle,
    sources: {
      pas2: createSourceStats(),
      othCandidateCommittee: createSourceStats(),
    },
  };
}

function getCodeStats(map, code) {
  if (!map.has(code)) {
    map.set(code, createCodeStatsEntry(code));
  }
  return map.get(code);
}

function addToSourceStats(stats, bucket, amount, code, isMemo) {
  const codeStats = getCodeStats(stats.byCode, code);
  codeStats.rows += 1;
  codeStats.amount += amount;

  if (isMemo) {
    stats.memoRows += 1;
    stats.memoAmount += amount;
    codeStats.memoRows += 1;
    codeStats.memoAmount += amount;
  }

  if (bucket === 'R') {
    stats.rNet += amount;
    stats.scoreableRows += 1;
    stats.scoreableAmount += amount;
  } else if (bucket === 'D') {
    stats.dNet += amount;
    stats.scoreableRows += 1;
    stats.scoreableAmount += amount;
  } else {
    stats.unscoredRows += 1;
    stats.unscoredAmount += amount;
  }
}

function finalizeSourceStats(stats) {
  return {
    rNet: roundCurrency(stats.rNet),
    dNet: roundCurrency(stats.dNet),
    scoreableRows: stats.scoreableRows,
    scoreableAmount: roundCurrency(stats.scoreableAmount),
    unscoredRows: stats.unscoredRows,
    unscoredAmount: roundCurrency(stats.unscoredAmount),
    memoRows: stats.memoRows,
    memoAmount: roundCurrency(stats.memoAmount),
    byCode: Array.from(stats.byCode.values())
      .map((entry) => ({
        code: entry.code,
        rows: entry.rows,
        amount: roundCurrency(entry.amount),
        memoRows: entry.memoRows,
        memoAmount: roundCurrency(entry.memoAmount),
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount) || a.code.localeCompare(b.code)),
  };
}

function createGlobalSummary() {
  return {
    pas2: createSourceStats(),
    othCandidateCommittee: createSourceStats(),
    othNonCandidateCommitteeEdges: createSourceStats(),
  };
}

function listTopEntries(map, limit = 20, mapper = null) {
  const entries = Array.from(map.entries())
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit);
  return mapper ? entries.map(mapper) : entries;
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
      if (!candidateId || !party) return;
      candidateParties.set(candidateId, party);
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

  const committeeParties = new Map();
  for (const [committeeId, parties] of partySetsByCommittee) {
    committeeParties.set(committeeId, parties.size === 1 ? Array.from(parties)[0] : null);
  }

  return committeeParties;
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

  const committeeParties = new Map();
  for (const [committeeId, parties] of partySetsByCommittee) {
    committeeParties.set(committeeId, parties.size === 1 ? Array.from(parties)[0] : null);
  }

  return {
    committeeNames,
    committeeParties,
  };
}

async function loadVerificationRecommendations() {
  const content = await readFile(VERIFICATION_REPORT_PATH, 'utf8');
  const recommendations = new Map();

  for (const block of content.split(/^###\s+/m).slice(1)) {
    const headerMatch = block.match(/^(C\d{8})\s+-\s+(.+)$/m);
    const recommendationMatch = block.match(/Recommendation:\s+`([^`]+)`/);
    if (!headerMatch || !recommendationMatch) continue;

    recommendations.set(headerMatch[1], {
      committeeId: headerMatch[1],
      committeeName: headerMatch[2],
      recommendation: recommendationMatch[1],
    });
  }

  return recommendations;
}

function classifyPas2Bucket(transactionType, candidateParty) {
  if (!candidateParty) return null;
  if (PAS2_OPPOSITION_CODES.has(transactionType)) return oppositeParty(candidateParty);
  if (PAS2_SUPPORT_CODES.has(transactionType)) return candidateParty;
  return null;
}

function classifyOthCandidateCommitteeBucket(transactionType, recipientParty) {
  if (!recipientParty) return null;
  if (OTH_OPPOSITION_CODES.has(transactionType)) return oppositeParty(recipientParty);
  if (OTH_SUPPORT_CODES.has(transactionType)) return recipientParty;
  return null;
}

function getVerificationMismatchType(verificationRecommendation, resolvedParty) {
  if (!verificationRecommendation) return null;

  if (verificationRecommendation === 'leave unclassified') {
    if (resolvedParty === 'R' || resolvedParty === 'D') {
      return `leave_unclassified_to_${resolvedParty}`;
    }
    return null;
  }

  if (verificationRecommendation === 'R' || verificationRecommendation === 'D') {
    return resolvedParty === verificationRecommendation
      ? null
      : `${verificationRecommendation}_to_${resolvedParty}`;
  }

  return null;
}

function formatVerificationMismatchType(value) {
  if (!value) return 'none';
  return value.replaceAll('_', ' ');
}

async function buildCommitteeCycleRecords(candidateParties, candidateCommitteeParties) {
  const records = new Map();
  const globalSummary = createGlobalSummary();

  const pas2Files = await listMatchingEntries(PAS2_FILE_PATTERN, 'file');
  for (const filePath of pas2Files) {
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const committeeId = normalizeCommitteeId(fields[PAS2_FIELD.committeeId]);
      const candidateId = normalizeWhitespace(fields[PAS2_FIELD.candidateId]);
      const transactionType = normalizeWhitespace(fields[PAS2_FIELD.transactionType]).toUpperCase();
      const amount = parseAmount(fields[PAS2_FIELD.amount]);
      const cycle = dateToCycle(fields[PAS2_FIELD.transactionDate]);
      const candidateParty = candidateParties.get(candidateId) ?? null;
      const bucket = classifyPas2Bucket(transactionType, candidateParty);
      const isMemo = normalizeWhitespace(fields[PAS2_FIELD.memoCode]).toUpperCase() === 'X';

      if (!committeeId || !cycle || amount === 0) return;

      const key = committeeCycleKey(committeeId, cycle);
      if (!records.has(key)) records.set(key, createCommitteeCycleRecord(committeeId, cycle));

      addToSourceStats(records.get(key).sources.pas2, bucket, amount, transactionType, isMemo);
      addToSourceStats(globalSummary.pas2, bucket, amount, transactionType, isMemo);
    });
  }

  const othDirs = await listMatchingEntries(OTH_DIR_PATTERN, 'dir');
  for (const dirPath of othDirs) {
    const filePath = path.join(dirPath, 'itoth.txt');
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const committeeId = normalizeCommitteeId(fields[OTH_FIELD.committeeId]);
      const otherId = normalizeCommitteeId(fields[OTH_FIELD.otherId]);
      const transactionType = normalizeWhitespace(fields[OTH_FIELD.transactionType]).toUpperCase();
      const amount = parseAmount(fields[OTH_FIELD.amount]);
      const cycle = dateToCycle(fields[OTH_FIELD.transactionDate]);
      const isMemo = normalizeWhitespace(fields[OTH_FIELD.memoCode]).toUpperCase() === 'X';

      if (!committeeId || !cycle || amount === 0 || !otherId) return;

      const recipientParty = candidateCommitteeParties.get(otherId) ?? null;
      const bucket = classifyOthCandidateCommitteeBucket(transactionType, recipientParty);

      const key = committeeCycleKey(committeeId, cycle);
      if (!records.has(key)) records.set(key, createCommitteeCycleRecord(committeeId, cycle));

      if (recipientParty) {
        addToSourceStats(records.get(key).sources.othCandidateCommittee, bucket, amount, transactionType, isMemo);
        addToSourceStats(globalSummary.othCandidateCommittee, bucket, amount, transactionType, isMemo);
      } else {
        addToSourceStats(globalSummary.othNonCandidateCommitteeEdges, null, amount, transactionType, isMemo);
      }
    });
  }

  return {
    records,
    globalSummary,
  };
}

function finalizeCommitteeRecords(
  records,
  formalCommitteeParties,
  candidateCommitteeParties,
  committeeNames,
  recommendations,
  observedCommitteeCycles
) {
  const finalized = [];
  const classificationCounts = new Map();
  const classificationMethodCounts = new Map();
  const qaConflictCounts = new Map();
  const qaConflicts = [];
  const knownCommitteeNames = new Map(committeeNames);
  const recordsToFinalize = new Map(records);

  for (const [committeeId, recommendation] of recommendations) {
    if (recommendation.committeeName) {
      knownCommitteeNames.set(committeeId, recommendation.committeeName);
    }
  }

  for (const observed of observedCommitteeCycles.values()) {
    if (observed.committeeName) {
      knownCommitteeNames.set(observed.committeeId, observed.committeeName);
    }

    const key = committeeCycleKey(observed.committeeId, observed.cycle);
    if (recordsToFinalize.has(key)) continue;

    const formalParty = formalCommitteeParties.get(observed.committeeId) ?? null;
    const candidateCommitteeParty = candidateCommitteeParties.get(observed.committeeId) ?? null;
    if (!formalParty && !candidateCommitteeParty) continue;

    recordsToFinalize.set(key, createCommitteeCycleRecord(observed.committeeId, observed.cycle));
  }

  for (const record of recordsToFinalize.values()) {
    const pas2 = finalizeSourceStats(record.sources.pas2);
    const othCandidateCommittee = finalizeSourceStats(record.sources.othCandidateCommittee);
    const formalParty = formalCommitteeParties.get(record.committeeId) ?? null;
    const candidateCommitteeParty = candidateCommitteeParties.get(record.committeeId) ?? null;
    const verificationRecommendation = recommendations.get(record.committeeId)?.recommendation ?? null;

    const beneficiaryRNet = roundCurrency(pas2.rNet + othCandidateCommittee.rNet);
    const beneficiaryDNet = roundCurrency(pas2.dNet + othCandidateCommittee.dNet);
    const beneficiaryRForShare = Math.max(0, beneficiaryRNet);
    const beneficiaryDForShare = Math.max(0, beneficiaryDNet);
    const beneficiaryScoreable = roundCurrency(beneficiaryRForShare + beneficiaryDForShare);
    const beneficiaryRShare = beneficiaryScoreable > 0 ? beneficiaryRForShare / beneficiaryScoreable : 0;
    const beneficiaryDShare = beneficiaryScoreable > 0 ? beneficiaryDForShare / beneficiaryScoreable : 0;

    let beneficiaryClassification = 'O';
    if (beneficiaryScoreable > 0 && beneficiaryRShare >= 0.8) beneficiaryClassification = 'R';
    if (beneficiaryScoreable > 0 && beneficiaryDShare >= 0.8) beneficiaryClassification = 'D';

    let resolvedParty = 'O';
    let classificationMethod = 'no_scoreable_beneficiary_data';
    if (formalParty) {
      resolvedParty = formalParty;
      classificationMethod = 'formal_cm_party';
    } else if (candidateCommitteeParty) {
      resolvedParty = candidateCommitteeParty;
      classificationMethod = 'candidate_committee_link';
    } else if (beneficiaryClassification === 'R' || beneficiaryClassification === 'D') {
      resolvedParty = beneficiaryClassification;
      classificationMethod = 'beneficiary_80pct';
    } else if (beneficiaryScoreable > 0) {
      resolvedParty = 'O';
      classificationMethod = 'beneficiary_mixed';
    }

    classificationCounts.set(resolvedParty, (classificationCounts.get(resolvedParty) ?? 0) + 1);
    classificationMethodCounts.set(
      classificationMethod,
      (classificationMethodCounts.get(classificationMethod) ?? 0) + 1
    );

    const committeeName = knownCommitteeNames.get(record.committeeId) ?? record.committeeId;
    const verificationMismatchType = getVerificationMismatchType(
      verificationRecommendation,
      resolvedParty
    );
    const qaConflict = verificationMismatchType !== null;

    const finalizedRecord = {
      committeeId: record.committeeId,
      committeeName,
      cycle: record.cycle,
      resolvedParty,
      classificationMethod,
      formalParty,
      candidateCommitteeParty,
      beneficiaryClassification,
      beneficiaryRNet,
      beneficiaryDNet,
      beneficiaryScoreable,
      beneficiaryRShare: Number(beneficiaryRShare.toFixed(6)),
      beneficiaryDShare: Number(beneficiaryDShare.toFixed(6)),
      verificationRecommendation,
      verificationMismatchType,
      qaConflict,
      sources: {
        pas2,
        othCandidateCommittee,
      },
    };

    if (qaConflict) {
      qaConflictCounts.set(
        verificationMismatchType,
        (qaConflictCounts.get(verificationMismatchType) ?? 0) + 1
      );
      qaConflicts.push(finalizedRecord);
    }
    finalized.push(finalizedRecord);
  }

  finalized.sort((a, b) => {
    if (b.beneficiaryScoreable !== a.beneficiaryScoreable) {
      return b.beneficiaryScoreable - a.beneficiaryScoreable;
    }
    if (a.committeeId !== b.committeeId) return a.committeeId.localeCompare(b.committeeId);
    return a.cycle - b.cycle;
  });

  return {
    finalized,
    classificationCounts: Array.from(classificationCounts.entries()).map(([party, count]) => ({
      party,
      count,
    })),
    classificationMethodCounts: Array.from(classificationMethodCounts.entries()).map(
      ([method, count]) => ({
        method,
        count,
      })
    ),
    qaConflictCounts: Array.from(qaConflictCounts.entries())
      .map(([type, count]) => ({
        type,
        label: formatVerificationMismatchType(type),
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    qaConflicts: qaConflicts
      .sort((a, b) => b.beneficiaryScoreable - a.beneficiaryScoreable)
      .slice(0, 50),
  };
}

function classifyExistingPeopleBucket(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  if (normalized === 'REP') return 'R';
  if (normalized === 'DEM' || normalized === 'DFL') return 'D';
  return 'O';
}

function collectObservedCommitteeCyclesFromPeople(people) {
  const observed = new Map();

  for (const person of people) {
    const summary = person?.donationSummary;
    if (!summary) continue;

    for (const row of summary.raw ?? []) {
      const committeeId = normalizeCommitteeId(row?.committeeId);
      const cycle = Number(row?.cycle || 0);
      const amount = Number(row?.amount || 0);
      if (!committeeId || !Number.isFinite(cycle) || cycle <= 0 || amount === 0) continue;

      const key = committeeCycleKey(committeeId, cycle);
      const committeeName = normalizeWhitespace(row?.committeeName) || null;

      if (!observed.has(key)) {
        observed.set(key, {
          committeeId,
          cycle,
          committeeName,
        });
        continue;
      }

      if (committeeName && !observed.get(key).committeeName) {
        observed.get(key).committeeName = committeeName;
      }
    }
  }

  return observed;
}

function projectPeopleReclassification(people, committeeCycleMap) {
  let currentTotalR = 0;
  let currentTotalD = 0;
  let currentTotalO = 0;
  let movedToR = 0;
  let movedToD = 0;
  let stayedO = 0;

  const movedByMethod = new Map();
  const topProjectedCommittees = new Map();
  const topStillOCommittees = new Map();
  const topProjectedCommitteeCycles = new Map();
  const topStillOCommitteeCycles = new Map();

  let bezosCurrentO = 0;
  let bezosProjectedR = 0;
  let bezosProjectedD = 0;
  let bezosProjectedO = 0;

  for (const person of people) {
    const summary = person.donationSummary;
    if (!summary) continue;

    currentTotalR += Number(summary.totalR || 0);
    currentTotalD += Number(summary.totalD || 0);
    currentTotalO += Number(summary.totalO || 0);

    for (const row of summary.raw ?? []) {
      const amount = Number(row.amount || 0);
      if (amount === 0) continue;
      if (classifyExistingPeopleBucket(row.committeeParty) !== 'O') continue;

      const key = committeeCycleKey(normalizeCommitteeId(row.committeeId), row.cycle);
      const classification = committeeCycleMap.get(key);
      const predictedParty = classification?.resolvedParty ?? 'O';
      const method = classification?.classificationMethod ?? 'unclassified';

      if (predictedParty === 'R') {
        movedToR += amount;
        movedByMethod.set(method, (movedByMethod.get(method) ?? 0) + amount);
        topProjectedCommittees.set(
          row.committeeId,
          (topProjectedCommittees.get(row.committeeId) ?? 0) + amount
        );
        topProjectedCommitteeCycles.set(
          key,
          (topProjectedCommitteeCycles.get(key) ?? 0) + amount
        );
      } else if (predictedParty === 'D') {
        movedToD += amount;
        movedByMethod.set(method, (movedByMethod.get(method) ?? 0) + amount);
        topProjectedCommittees.set(
          row.committeeId,
          (topProjectedCommittees.get(row.committeeId) ?? 0) + amount
        );
        topProjectedCommitteeCycles.set(
          key,
          (topProjectedCommitteeCycles.get(key) ?? 0) + amount
        );
      } else {
        stayedO += amount;
        topStillOCommittees.set(row.committeeId, (topStillOCommittees.get(row.committeeId) ?? 0) + amount);
        topStillOCommitteeCycles.set(
          key,
          (topStillOCommitteeCycles.get(key) ?? 0) + amount
        );
      }

      if (person.id === 'jeff-bezos') {
        bezosCurrentO += amount;
        if (predictedParty === 'R') bezosProjectedR += amount;
        else if (predictedParty === 'D') bezosProjectedD += amount;
        else bezosProjectedO += amount;
      }
    }
  }

  const projectedTotalR = currentTotalR + movedToR;
  const projectedTotalD = currentTotalD + movedToD;
  const projectedTotalO = currentTotalO - movedToR - movedToD;
  const trackedTotal = projectedTotalR + projectedTotalD + projectedTotalO;

  return {
    current: {
      totalR: roundCurrency(currentTotalR),
      totalD: roundCurrency(currentTotalD),
      totalO: roundCurrency(currentTotalO),
    },
    projection: {
      movedToR: roundCurrency(movedToR),
      movedToD: roundCurrency(movedToD),
      stayedO: roundCurrency(stayedO),
      projectedTotalR: roundCurrency(projectedTotalR),
      projectedTotalD: roundCurrency(projectedTotalD),
      projectedTotalO: roundCurrency(projectedTotalO),
      projectedOShare: trackedTotal > 0 ? projectedTotalO / trackedTotal : 0,
      movedByMethod: listTopEntries(movedByMethod, 10, ([method, amount]) => ({
        method,
        amount: roundCurrency(amount),
      })),
      topProjectedCommittees: listTopEntries(topProjectedCommittees, 25, ([committeeId, amount]) => ({
        committeeId,
        amount: roundCurrency(amount),
      })),
      topProjectedCommitteeCycles: listTopEntries(
        topProjectedCommitteeCycles,
        50,
        ([key, amount]) => {
          const [committeeId, cycle] = key.split(':');
          return {
            committeeId,
            cycle: Number.parseInt(cycle, 10),
            amount: roundCurrency(amount),
          };
        }
      ),
      topStillOCommittees: listTopEntries(topStillOCommittees, 25, ([committeeId, amount]) => ({
        committeeId,
        amount: roundCurrency(amount),
      })),
      topStillOCommitteeCycles: listTopEntries(
        topStillOCommitteeCycles,
        50,
        ([key, amount]) => {
          const [committeeId, cycle] = key.split(':');
          return {
            committeeId,
            cycle: Number.parseInt(cycle, 10),
            amount: roundCurrency(amount),
          };
        }
      ),
    },
    bezos: {
      currentO: roundCurrency(bezosCurrentO),
      projectedR: roundCurrency(bezosProjectedR),
      projectedD: roundCurrency(bezosProjectedD),
      projectedO: roundCurrency(bezosProjectedO),
    },
  };
}

function buildThinEvidenceReview(committeeCycleMap, peopleProjection) {
  return (peopleProjection.projection.topProjectedCommitteeCycles ?? [])
    .map((entry) => {
      const record = committeeCycleMap.get(committeeCycleKey(entry.committeeId, entry.cycle));
      if (!record) return null;
      if (record.classificationMethod !== 'beneficiary_80pct') return null;
      if (!(record.resolvedParty === 'R' || record.resolvedParty === 'D')) return null;
      const evidence = Number(record.beneficiaryScoreable || 0);
      const projected = Number(entry.amount || 0);
      if (evidence <= 0) return null;

      const ratio = projected / evidence;
      const reviewFlag = ratio >= 10 || (evidence < 100_000 && projected >= 1_000_000);
      if (!reviewFlag) return null;

      return {
        committeeId: entry.committeeId,
        committeeName: record.committeeName,
        cycle: entry.cycle,
        projectedAmount: roundCurrency(projected),
        beneficiaryScoreable: roundCurrency(evidence),
        ratio: Number(ratio.toFixed(2)),
        resolvedParty: record.resolvedParty,
        verificationRecommendation: record.verificationRecommendation,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.projectedAmount - a.projectedAmount)
    .slice(0, 50);
}

function buildMarkdownReport(report) {
  const lines = [];
  const projection = report.peopleProjection.projection;

  lines.push(`# Committee Beneficiary Classification - ${report.generatedAt}`);
  lines.push('');
  lines.push('This output is staging-only. It does not rewrite `people.json` or `entities.json`.');
  lines.push('');
  lines.push('## Method');
  lines.push('');
  lines.push('- No minimum floor.');
  lines.push('- 80% beneficiary threshold by `committeeId + cycle`.');
  lines.push('- Formal committee major-party codes remain a fallback for already-coded committees.');
  lines.push('- Candidate committee links remain a fallback for authorized candidate committees.');
  lines.push('- April 3, 2026 manual verification stays QA-only, not decision-making.');
  lines.push('');
  lines.push('## Committee-Cycle Summary');
  lines.push('');
  for (const row of report.summary.classificationCounts) {
    lines.push(`- ${row.party}: ${row.count}`);
  }
  lines.push('');
  lines.push('### Classification Methods');
  lines.push('');
  for (const row of report.summary.classificationMethodCounts) {
    lines.push(`- ${row.method}: ${row.count}`);
  }
  lines.push('');
  lines.push('### Input Totals');
  lines.push('');
  lines.push(
    `- PAS2 scoreable amount: ${formatCurrency(report.summary.globalSources.pas2.scoreableAmount)}`
  );
  lines.push(
    `- OTH candidate-committee proxy scoreable amount: ${formatCurrency(report.summary.globalSources.othCandidateCommittee.scoreableAmount)}`
  );
  lines.push(
    `- OTH non-candidate committee edge amount (unscored): ${formatCurrency(report.summary.globalSources.othNonCandidateCommitteeEdges.unscoredAmount)}`
  );
  lines.push('');
  lines.push('## People Projection');
  lines.push('');
  lines.push(`- Current totalO: ${formatCurrency(report.peopleProjection.current.totalO)}`);
  lines.push(`- Projected move to R: ${formatCurrency(projection.movedToR)}`);
  lines.push(`- Projected move to D: ${formatCurrency(projection.movedToD)}`);
  lines.push(`- Projected totalO: ${formatCurrency(projection.projectedTotalO)} (${formatPct(projection.projectedOShare)})`);
  lines.push('');
  lines.push('### Jeff Bezos');
  lines.push('');
  lines.push(`- Current O: ${formatCurrency(report.peopleProjection.bezos.currentO)}`);
  lines.push(`- Projected R: ${formatCurrency(report.peopleProjection.bezos.projectedR)}`);
  lines.push(`- Projected D: ${formatCurrency(report.peopleProjection.bezos.projectedD)}`);
  lines.push(`- Projected O: ${formatCurrency(report.peopleProjection.bezos.projectedO)}`);
  lines.push('');
  lines.push('### Top Projected Reclassified Committees');
  lines.push('');
  for (const row of projection.topProjectedCommittees.slice(0, 15)) {
    const match = report.committeeCycles.find((entry) => entry.committeeId === row.committeeId);
    lines.push(
      `- ${row.committeeId} | ${match?.committeeName ?? row.committeeId} | ${formatCurrency(row.amount)} | ${match?.resolvedParty ?? 'O'} | ${match?.classificationMethod ?? 'unclassified'}`
    );
  }
  lines.push('');
  lines.push('### QA Conflicts With April 3 Report');
  lines.push('');
  for (const row of report.summary.qaConflictCounts ?? []) {
    lines.push(`- ${row.label}: ${row.count}`);
  }
  if ((report.summary.qaConflictCounts ?? []).length > 0) {
    lines.push('');
  }
  if (report.summary.qaConflicts.length === 0) {
    lines.push('- None.');
  } else {
    for (const row of report.summary.qaConflicts.slice(0, 15)) {
      lines.push(
        `- ${row.committeeId} | ${row.committeeName} | cycle ${row.cycle} | report ${row.verificationRecommendation ?? 'n/a'} -> resolved ${row.resolvedParty} | ${formatVerificationMismatchType(row.verificationMismatchType)} | beneficiary scoreable ${formatCurrency(row.beneficiaryScoreable)}`
      );
    }
  }
  lines.push('');
  lines.push('### Thin Evidence Review');
  lines.push('');
  if ((report.summary.thinEvidenceReview ?? []).length === 0) {
    lines.push('- None.');
  } else {
    for (const row of report.summary.thinEvidenceReview.slice(0, 15)) {
      lines.push(
        `- ${row.committeeId} | ${row.committeeName ?? row.committeeId} | cycle ${row.cycle} | projected ${formatCurrency(row.projectedAmount)} | evidence ${formatCurrency(row.beneficiaryScoreable)} | ratio ${row.ratio}x | resolved ${row.resolvedParty}${row.verificationRecommendation ? ` | report ${row.verificationRecommendation}` : ''}`
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(report, basename) {
  await mkdir(REPORTS_DIR, { recursive: true });
  const jsonPath = path.join(REPORTS_DIR, `${basename}.json`);
  const mdPath = path.join(REPORTS_DIR, `${basename}.md`);

  await writeFile(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  await writeFile(mdPath, buildMarkdownReport(report), 'utf8');

  return { jsonPath, mdPath };
}

async function main() {
  const basenameArg = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--basename='))
    ?.slice('--basename='.length)
    .trim();
  const basename = basenameArg || `committee-beneficiary-classification-${today()}`;

  const candidateParties = await loadCandidateParties();
  const candidateCommitteeParties = await loadCandidateCommitteeParties(candidateParties);
  const committeeMasterMetadata = await loadCommitteeMasterMetadata();
  const formalCommitteeParties = committeeMasterMetadata.committeeParties;
  const verificationRecommendations = await loadVerificationRecommendations();
  const rawPeople = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const people = Array.isArray(rawPeople) ? rawPeople : rawPeople.people ?? [];
  const observedCommitteeCycles = collectObservedCommitteeCyclesFromPeople(people);

  const { records, globalSummary } = await buildCommitteeCycleRecords(
    candidateParties,
    candidateCommitteeParties
  );
  const finalized = finalizeCommitteeRecords(
    records,
    formalCommitteeParties,
    candidateCommitteeParties,
    committeeMasterMetadata.committeeNames,
    verificationRecommendations,
    observedCommitteeCycles
  );
  const committeeCycleMap = new Map(
    finalized.finalized.map((record) => [committeeCycleKey(record.committeeId, record.cycle), record])
  );
  const peopleProjection = projectPeopleReclassification(people, committeeCycleMap);
  const thinEvidenceReview = buildThinEvidenceReview(committeeCycleMap, peopleProjection);

  const report = {
    generatedAt: today(),
    sourceFiles: {
      beneficiarySpec: BENEFICIARY_SPEC_PATH,
      people: PEOPLE_PATH,
      verificationReport: VERIFICATION_REPORT_PATH,
    },
    summary: {
      classificationCounts: finalized.classificationCounts,
      classificationMethodCounts: finalized.classificationMethodCounts,
      qaConflictCounts: finalized.qaConflictCounts,
      qaConflicts: finalized.qaConflicts,
      thinEvidenceReview,
      globalSources: {
        pas2: finalizeSourceStats(globalSummary.pas2),
        othCandidateCommittee: finalizeSourceStats(globalSummary.othCandidateCommittee),
        othNonCandidateCommitteeEdges: finalizeSourceStats(globalSummary.othNonCandidateCommitteeEdges),
      },
    },
    peopleProjection,
    committeeCycles: finalized.finalized,
  };

  const paths = await writeOutputs(report, basename);
  console.log(`Wrote ${paths.jsonPath}`);
  console.log(`Wrote ${paths.mdPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
