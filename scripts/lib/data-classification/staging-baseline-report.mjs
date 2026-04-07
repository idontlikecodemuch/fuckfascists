import { normalizeWhitespace, roundCurrency } from './common.mjs';

const EXCLUDED_PAC_LINES = new Set(['21B', '28A']);
const R_PARTIES = new Set(['REP']);
const D_PARTIES = new Set(['DEM', 'DFL']);

function normalizeCommitteeParty(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  return normalized && normalized !== 'UNK' ? normalized : null;
}

function classifyParty(value) {
  const party = normalizeCommitteeParty(value);
  if (!party) return 'O';
  if (R_PARTIES.has(party)) return 'R';
  if (D_PARTIES.has(party)) return 'D';
  return 'O';
}

function toTopEntries(map, limit = 25, mapper = null) {
  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  return mapper ? sorted.map(mapper) : sorted;
}

export function buildPeopleSpotlight(peopleById, personId) {
  const person = peopleById.get(personId);
  if (!person || !person.donationSummary) return null;

  const unresolvedRows = (person.donationSummary.raw ?? [])
    .filter((row) => classifyParty(row.committeeParty) === 'O')
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 10)
    .map((row) => ({
      committeeId: row.committeeId,
      committeeName: row.committeeName,
      committeeType: row.committeeType ?? null,
      committeeParty: row.committeeParty ?? null,
      amount: roundCurrency(row.amount),
      cycle: row.cycle,
      contributionDate: row.contributionDate,
    }));

  return {
    personId,
    displayName: person.displayName,
    totalR: roundCurrency(person.donationSummary.totalR ?? 0),
    totalD: roundCurrency(person.donationSummary.totalD ?? 0),
    totalO: roundCurrency(person.donationSummary.totalO ?? 0),
    unresolvedRows,
  };
}

export function buildPeopleReport(people, committeeLookup, recommendations) {
  const peopleWithSummaries = people.filter((person) => person.donationSummary);
  const peopleById = new Map(people.map((person) => [person.id, person]));

  let totalR = 0;
  let totalD = 0;
  let totalO = 0;
  let unresolvedNullParty = 0;
  let unresolvedMinorParty = 0;
  let unresolvedRows = 0;
  let unresolvedRowsWithCommitteeMasterParty = 0;
  let unresolvedDollarsWithCommitteeMasterParty = 0;
  let unresolvedRecommendedR = 0;
  let unresolvedRecommendedD = 0;
  let unresolvedRecommendedLeave = 0;

  const unresolvedPartyBuckets = new Map();
  const unresolvedTypeBuckets = new Map();
  const unresolvedCommitteeBuckets = new Map();

  for (const person of peopleWithSummaries) {
    const summary = person.donationSummary;
    totalR += Number(summary.totalR || 0);
    totalD += Number(summary.totalD || 0);
    totalO += Number(summary.totalO || 0);

    for (const row of summary.raw ?? []) {
      if (classifyParty(row.committeeParty) !== 'O') continue;

      unresolvedRows += 1;
      const amount = Number(row.amount || 0);
      const storedParty = row.committeeParty ?? null;
      const type = row.committeeType ?? 'null';
      const committeeMasterParty = committeeLookup.get(row.committeeId)?.party ?? null;
      const recommendation = recommendations.get(row.committeeId)?.recommendation ?? null;

      if (storedParty === null) {
        unresolvedNullParty += amount;
      } else {
        unresolvedMinorParty += amount;
      }

      if (classifyParty(committeeMasterParty) !== 'O') {
        unresolvedRowsWithCommitteeMasterParty += 1;
        unresolvedDollarsWithCommitteeMasterParty += amount;
      }

      if (recommendation === 'R') unresolvedRecommendedR += amount;
      if (recommendation === 'D') unresolvedRecommendedD += amount;
      if (recommendation === 'leave unclassified') unresolvedRecommendedLeave += amount;

      unresolvedPartyBuckets.set(
        String(storedParty),
        (unresolvedPartyBuckets.get(String(storedParty)) ?? 0) + amount
      );
      unresolvedTypeBuckets.set(type, (unresolvedTypeBuckets.get(type) ?? 0) + amount);

      const committeeKey = row.committeeId;
      const existing = unresolvedCommitteeBuckets.get(committeeKey);
      if (existing) {
        existing.amount += amount;
        existing.rowCount += 1;
      } else {
        unresolvedCommitteeBuckets.set(committeeKey, {
          committeeId: row.committeeId,
          committeeName: row.committeeName,
          committeeType: row.committeeType ?? null,
          committeeParty: storedParty,
          committeeMasterParty,
          recommendation,
          amount,
          rowCount: 1,
        });
      }
    }
  }

  const topUnresolvedCommittees = Array.from(unresolvedCommitteeBuckets.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 50)
    .map((entry) => ({
      ...entry,
      amount: roundCurrency(entry.amount),
    }));

  return {
    totals: {
      totalR: roundCurrency(totalR),
      totalD: roundCurrency(totalD),
      totalO: roundCurrency(totalO),
      totalClassified: roundCurrency(totalR + totalD),
      totalTracked: roundCurrency(totalR + totalD + totalO),
      unresolvedShare: totalR + totalD + totalO > 0 ? totalO / (totalR + totalD + totalO) : 0,
    },
    unresolved: {
      rowCount: unresolvedRows,
      nullPartyAmount: roundCurrency(unresolvedNullParty),
      nonMajorPartyAmount: roundCurrency(unresolvedMinorParty),
      committeeMasterRecoverableRows: unresolvedRowsWithCommitteeMasterParty,
      committeeMasterRecoverableAmount: roundCurrency(unresolvedDollarsWithCommitteeMasterParty),
      reportRecommendedRAmount: roundCurrency(unresolvedRecommendedR),
      reportRecommendedDAmount: roundCurrency(unresolvedRecommendedD),
      reportRecommendedLeaveAmount: roundCurrency(unresolvedRecommendedLeave),
      partyBuckets: toTopEntries(unresolvedPartyBuckets, 20, ([party, amount]) => ({
        committeeParty: party === 'null' ? null : party,
        amount: roundCurrency(amount),
      })),
      typeBuckets: toTopEntries(unresolvedTypeBuckets, 20, ([committeeType, amount]) => ({
        committeeType,
        amount: roundCurrency(amount),
      })),
      topCommittees: topUnresolvedCommittees,
    },
    spotlights: {
      jeffBezos: buildPeopleSpotlight(peopleById, 'jeff-bezos'),
      richardEUihlein: buildPeopleSpotlight(peopleById, 'richard-e-uihlein'),
      michaelRBloomberg: buildPeopleSpotlight(peopleById, 'michael-r-bloomberg'),
      miriamAdelson: buildPeopleSpotlight(peopleById, 'miriam-adelson'),
      reidHoffman: buildPeopleSpotlight(peopleById, 'reid-hoffman'),
    },
  };
}

export function buildEntitiesReport(entities) {
  let rawAmount = 0;
  let excludedAmount = 0;
  let line23Amount = 0;
  let line29Amount = 0;
  let line21BAmount = 0;
  let line28AAmount = 0;
  let withDonationSummary = 0;
  let withStoredTotalOther = 0;

  const lineBuckets = new Map();
  const descriptionBuckets = new Map();
  const topLine29Descriptions = new Map();

  for (const entity of entities) {
    const summary = entity.donationSummary;
    if (!summary) continue;
    withDonationSummary += 1;
    if (Object.prototype.hasOwnProperty.call(summary, 'totalO')) withStoredTotalOther += 1;

    for (const row of summary.raw ?? []) {
      const amount = Number(row.amount || 0);
      const lineNumber = normalizeWhitespace(row.lineNumber);
      const description = normalizeWhitespace(row.description);

      rawAmount += amount;
      lineBuckets.set(lineNumber, (lineBuckets.get(lineNumber) ?? 0) + amount);

      const descriptionKey = `${lineNumber}\t${description}`;
      descriptionBuckets.set(
        descriptionKey,
        (descriptionBuckets.get(descriptionKey) ?? 0) + amount
      );

      if (lineNumber === '23') line23Amount += amount;
      if (lineNumber === '29') {
        line29Amount += amount;
        topLine29Descriptions.set(
          description || '(blank description)',
          (topLine29Descriptions.get(description || '(blank description)') ?? 0) + amount
        );
      }
      if (lineNumber === '21B') line21BAmount += amount;
      if (lineNumber === '28A') line28AAmount += amount;
      if (EXCLUDED_PAC_LINES.has(lineNumber)) excludedAmount += amount;
    }
  }

  return {
    totals: {
      rawAmount: roundCurrency(rawAmount),
      line23Amount: roundCurrency(line23Amount),
      line29Amount: roundCurrency(line29Amount),
      excludedAmount: roundCurrency(excludedAmount),
      excluded21BAmount: roundCurrency(line21BAmount),
      excluded28AAmount: roundCurrency(line28AAmount),
    },
    storage: {
      entitiesWithDonationSummary: withDonationSummary,
      entitiesWithStoredTotalOther: withStoredTotalOther,
      recipientCommitteeIdsPreservedInRaw: false,
      note:
        'Current PAC raw rows are collapsed to line/description/cycle/amount, so line 23 reclassification requires rehydration from source disbursement records.',
    },
    lines: {
      byLine: toTopEntries(lineBuckets, 25, ([lineNumber, amount]) => ({
        lineNumber,
        amount: roundCurrency(amount),
      })),
      byLineAndDescription: toTopEntries(descriptionBuckets, 40, ([key, amount]) => {
        const [lineNumber, description] = key.split('\t');
        return {
          lineNumber,
          description,
          amount: roundCurrency(amount),
        };
      }),
      topLine29Descriptions: toTopEntries(topLine29Descriptions, 25, ([description, amount]) => ({
        description,
        amount: roundCurrency(amount),
      })),
    },
  };
}
