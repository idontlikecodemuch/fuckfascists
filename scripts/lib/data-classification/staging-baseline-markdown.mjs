import { formatCurrency, formatPct } from './common.mjs';

export function buildStagingBaselineMarkdown(report) {
  const lines = [];
  const peopleTotals = report.people.totals;
  const peopleUnresolved = report.people.unresolved;
  const entityTotals = report.entities.totals;
  const jeffBezos = report.people.spotlights.jeffBezos;

  lines.push(`# Data Classification Staging Report - ${report.generatedAt}`);
  lines.push('');
  lines.push('This report is staging-only. It does not modify `assets/data/*.json`.');
  lines.push('');
  lines.push('## Guardrails');
  lines.push('');
  lines.push('- No UI or TypeScript model changes.');
  lines.push('- No PAC/people data rewrite yet.');
  lines.push('- No new FEC API calls were made to build this report.');
  lines.push('');
  lines.push('## People');
  lines.push('');
  lines.push(`- Total tracked dollars: ${formatCurrency(peopleTotals.totalTracked)}`);
  lines.push(`- Classified R+D dollars: ${formatCurrency(peopleTotals.totalClassified)}`);
  lines.push(`- Current totalO: ${formatCurrency(peopleTotals.totalO)} (${formatPct(peopleTotals.unresolvedShare)})`);
  lines.push(`- Null committee party portion: ${formatCurrency(peopleUnresolved.nullPartyAmount)}`);
  lines.push(`- Non-major-party coded portion: ${formatCurrency(peopleUnresolved.nonMajorPartyAmount)}`);
  lines.push(
    `- Committee-master recoverable from current unresolved rows: ${formatCurrency(peopleUnresolved.committeeMasterRecoverableAmount)} across ${peopleUnresolved.committeeMasterRecoverableRows} rows`
  );
  lines.push(
    `- Unresolved overlap with existing manual report: R ${formatCurrency(peopleUnresolved.reportRecommendedRAmount)}, D ${formatCurrency(peopleUnresolved.reportRecommendedDAmount)}, leave unclassified ${formatCurrency(peopleUnresolved.reportRecommendedLeaveAmount)}`
  );
  lines.push('');
  lines.push('### Top Unresolved Committee Types');
  lines.push('');
  for (const bucket of peopleUnresolved.typeBuckets.slice(0, 10)) {
    lines.push(`- ${bucket.committeeType}: ${formatCurrency(bucket.amount)}`);
  }
  lines.push('');
  lines.push('### Top Unresolved Committees');
  lines.push('');
  for (const committee of peopleUnresolved.topCommittees.slice(0, 15)) {
    const recommendation = committee.recommendation ? ` | report: ${committee.recommendation}` : '';
    lines.push(
      `- ${committee.committeeId} | ${committee.committeeName} | type ${committee.committeeType ?? 'null'} | ${formatCurrency(committee.amount)}${recommendation}`
    );
  }
  lines.push('');
  lines.push('### Jeff Bezos Spotlight');
  lines.push('');
  if (jeffBezos) {
    lines.push(`- Total R: ${formatCurrency(jeffBezos.totalR)}`);
    lines.push(`- Total D: ${formatCurrency(jeffBezos.totalD)}`);
    lines.push(`- Total O: ${formatCurrency(jeffBezos.totalO)}`);
    for (const row of jeffBezos.unresolvedRows.slice(0, 5)) {
      lines.push(
        `- ${row.committeeId} | ${row.committeeName} | type ${row.committeeType ?? 'null'} | ${formatCurrency(row.amount)}`
      );
    }
  } else {
    lines.push('- Jeff Bezos not found in current people dataset.');
  }
  lines.push('');
  lines.push('## PAC Entities');
  lines.push('');
  lines.push(`- Current raw PAC amount: ${formatCurrency(entityTotals.rawAmount)}`);
  lines.push(`- Line 23 amount: ${formatCurrency(entityTotals.line23Amount)}`);
  lines.push(`- Line 29 amount: ${formatCurrency(entityTotals.line29Amount)}`);
  lines.push(`- Excluded non-donation amount (21B + 28A): ${formatCurrency(entityTotals.excludedAmount)}`);
  lines.push(`- Line 21B amount: ${formatCurrency(entityTotals.excluded21BAmount)}`);
  lines.push(`- Line 28A amount: ${formatCurrency(entityTotals.excluded28AAmount)}`);
  lines.push(
    `- Entities with stored totalO: ${report.entities.storage.entitiesWithStoredTotalOther} of ${report.entities.storage.entitiesWithDonationSummary}`
  );
  lines.push(
    `- Recipient committee IDs preserved in PAC raw: ${report.entities.storage.recipientCommitteeIdsPreservedInRaw ? 'yes' : 'no'}`
  );
  lines.push('');
  lines.push('### Top PAC Raw Lines');
  lines.push('');
  for (const row of report.entities.lines.byLine.slice(0, 10)) {
    lines.push(`- ${row.lineNumber}: ${formatCurrency(row.amount)}`);
  }
  lines.push('');
  lines.push('## Read Before Final Rewrite');
  lines.push('');
  lines.push('- People-side gains now depend mostly on curated committee alignment, not on the committee master files alone.');
  lines.push('- PAC-side line 23 reclassification requires source-level rehydration because recipient committee IDs were not retained in stored raw rows.');
  lines.push('- Line 21B and 28A should be excluded from displayed totals even if they remain in raw audit output.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}
