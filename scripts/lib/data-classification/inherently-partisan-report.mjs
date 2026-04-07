import { formatCurrency, formatPct, roundCurrency } from './common.mjs';

export function normalizePeopleDocument(raw) {
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw?.people) ? raw.people : [];
}

export function normalizeEntitiesDocument(raw) {
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw?.entities) ? raw.entities : [];
}

export function listTop(rows, limit = 25) {
  return rows.slice().sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export function sumAmounts(rows) {
  return roundCurrency(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0));
}

export function buildInherentlyPartisanMarkdown(report) {
  const lines = [];

  lines.push(`# Inherently Partisan Staging Report - ${report.generatedAt}`);
  lines.push('');
  lines.push('This output is staging-only. It does not rewrite `assets/data/people.json` or `assets/data/entities.json`.');
  lines.push('It builds compact additive row files for inaugural F13 receipts and entity-side national party special-account contributions.');
  lines.push('');
  lines.push('## Files');
  lines.push('');
  lines.push(`- People rows: ${report.sourceFiles.peopleRows}`);
  lines.push(`- Entity rows: ${report.sourceFiles.entityRows}`);
  lines.push('');
  lines.push('## Inaugural F13 Discovery');
  lines.push('');
  for (const committee of report.inaugural.committees) {
    const filingsLabel = committee.filings
      .map((filing) => `${filing.reportType}${filing.csvUrl ? '' : ' (api fallback needed)'}`)
      .join(', ');
    lines.push(
      `- cycle ${committee.cycle} | ${committee.committeeId} | ${committee.committeeName} | ${committee.resolvedParty} | ${committee.sourceMode} | ${filingsLabel}`
    );
  }
  lines.push('');
  lines.push('## Inaugural Matches');
  lines.push('');
  lines.push(`- People matched rows: ${report.inaugural.people.rowCount}`);
  lines.push(`- People matched amount: ${formatCurrency(report.inaugural.people.totalAmount)}`);
  lines.push(`- People matched donors: ${report.inaugural.people.peopleAffected}`);
  lines.push(`- Entities matched rows: ${report.inaugural.entities.rowCount}`);
  lines.push(`- Entities matched amount: ${formatCurrency(report.inaugural.entities.totalAmount)}`);
  lines.push(`- Entities matched companies: ${report.inaugural.entities.entitiesAffected}`);
  lines.push('');
  lines.push('### Top Inaugural People Matches');
  lines.push('');
  if (report.inaugural.people.topRows.length === 0) {
    lines.push('- None.');
  } else {
    for (const row of report.inaugural.people.topRows) {
      lines.push(
        `- ${row.personId} | ${row.displayName} | ${row.committeeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)} | ${row.committeeParty}`
      );
    }
  }
  lines.push('');
  lines.push('### Top Inaugural Entity Matches');
  lines.push('');
  if (report.inaugural.entities.topRows.length === 0) {
    lines.push('- None.');
  } else {
    for (const row of report.inaugural.entities.topRows) {
      lines.push(
        `- ${row.entityId} | ${row.entityName} | ${row.recipientCommitteeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)} | ${row.resolvedParty}`
      );
    }
  }
  lines.push('');
  lines.push('### Top Unmatched Inaugural Entity Contributors');
  lines.push('');
  if (report.inaugural.entities.topUnmatchedContributors.length === 0) {
    lines.push('- None.');
  } else {
    for (const row of report.inaugural.entities.topUnmatchedContributors.slice(0, 20)) {
      lines.push(
        `- ${row.contributorName} | cycle ${row.cycle} | ${row.entityType} | ${formatCurrency(row.amount)}`
      );
    }
  }
  lines.push('');
  lines.push('## National Party Accounts');
  lines.push('');
  lines.push(`- Recipient committees discovered: ${report.partyAccounts.committeeCount}`);
  lines.push(`- Entity matched rows: ${report.partyAccounts.entities.rowCount}`);
  lines.push(`- Entity matched amount: ${formatCurrency(report.partyAccounts.entities.totalAmount)}`);
  lines.push(`- Entity companies affected: ${report.partyAccounts.entities.entitiesAffected}`);
  lines.push('');
  lines.push('### Party Account Recipient Committees');
  lines.push('');
  for (const committee of report.partyAccounts.topCommittees) {
    lines.push(
      `- ${committee.committeeId} | ${committee.committeeName} | ${committee.resolvedParty} | ${committee.accountTypes.join(', ')} | ${formatCurrency(committee.totalAmount)}`
    );
  }
  lines.push('');
  lines.push('### Party Account Entity Matches');
  lines.push('');
  if (report.partyAccounts.entities.topRows.length === 0) {
    lines.push('- None.');
  } else {
    for (const row of report.partyAccounts.entities.topRows) {
      lines.push(
        `- ${row.entityId} | ${row.entityName} | ${row.recipientCommitteeName} | cycle ${row.cycle} | ${formatCurrency(row.amount)} | ${row.resolvedParty} | ${row.accountTypes.join(', ')}`
      );
    }
  }
  lines.push('');
  lines.push('### Account Type Totals');
  lines.push('');
  for (const row of report.partyAccounts.entities.accountTypeTotals) {
    lines.push(`- ${row.accountType}: ${formatCurrency(row.amount)}`);
  }
  lines.push('');
  lines.push('## QA');
  lines.push('');
  lines.push(`- Inaugural QA issues: ${report.qa.inauguralIssueCount}`);
  lines.push(`- Party-account QA issues: ${report.qa.partyAccountIssueCount}`);
  lines.push(`- Total QA issues: ${report.qa.issueCount}`);
  lines.push('');

  return `${lines.join('\n')}\n`;
}
