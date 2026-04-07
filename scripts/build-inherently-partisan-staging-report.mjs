import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  BULK_ROOT,
  collectInauguralRows,
  collectPartyAccountEntityRows,
  discoverPartyAccountCommittees,
  formatCurrency,
  normalizeWhitespace,
} from './lib/inherentlyPartisanSources.mjs';
import { formatPct, today } from './lib/data-classification/common.mjs';
import {
  buildInherentlyPartisanMarkdown,
  listTop,
  normalizeEntitiesDocument,
  normalizePeopleDocument,
  sumAmounts,
} from './lib/data-classification/inherently-partisan-report.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const REPORTS_DIR = path.join(BULK_ROOT, 'reports');

async function main() {
  const generatedAt = today();
  const basename = `inherently-partisan-staging-${generatedAt}`;
  const summaryJsonPath = path.join(REPORTS_DIR, `${basename}.json`);
  const summaryMdPath = path.join(REPORTS_DIR, `${basename}.md`);
  const peopleRowsPath = path.join(REPORTS_DIR, `${basename}.people.rows.json`);
  const entityRowsPath = path.join(REPORTS_DIR, `${basename}.entities.rows.json`);

  const rawPeople = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const rawEntities = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  const people = normalizePeopleDocument(rawPeople);
  const entities = normalizeEntitiesDocument(rawEntities);

  const partyAccountCommittees = await discoverPartyAccountCommittees();
  const partyAccountEntityRows = await collectPartyAccountEntityRows(
    entities,
    partyAccountCommittees.committees
  );
  const inaugural = await collectInauguralRows(people, entities);

  const combinedEntityRows = [
    ...partyAccountEntityRows.rows,
    ...inaugural.entityRows,
  ].sort((a, b) => b.amount - a.amount || a.entityId.localeCompare(b.entityId));

  const report = {
    generatedAt,
    sourceFiles: {
      people: PEOPLE_PATH,
      entities: ENTITIES_PATH,
      peopleRows: peopleRowsPath,
      entityRows: entityRowsPath,
    },
    inaugural: {
      committees: inaugural.committees,
      people: {
        rowCount: inaugural.peopleRows.length,
        peopleAffected: new Set(inaugural.peopleRows.map((row) => row.personId)).size,
        totalAmount: sumAmounts(inaugural.peopleRows),
        topRows: listTop(inaugural.peopleRows, 25),
      },
      entities: {
        rowCount: inaugural.entityRows.length,
        entitiesAffected: new Set(inaugural.entityRows.map((row) => row.entityId)).size,
        totalAmount: sumAmounts(inaugural.entityRows),
        topRows: listTop(inaugural.entityRows, 25),
        topUnmatchedContributors: inaugural.topUnmatchedEntityContributors,
      },
    },
    partyAccounts: {
      committeeCount: partyAccountCommittees.committees.length,
      topCommittees: partyAccountCommittees.committees.slice(0, 25),
      entities: {
        rowCount: partyAccountEntityRows.rows.length,
        entitiesAffected: new Set(partyAccountEntityRows.rows.map((row) => row.entityId)).size,
        totalAmount: sumAmounts(partyAccountEntityRows.rows),
        topRows: listTop(partyAccountEntityRows.rows, 25),
        accountTypeTotals: partyAccountEntityRows.accountTypeTotals,
      },
    },
    combinedEntityRows: {
      rowCount: combinedEntityRows.length,
      totalAmount: sumAmounts(combinedEntityRows),
      inauguralShare:
        combinedEntityRows.length > 0
          ? inaugural.entityRows.reduce((sum, row) => sum + row.amount, 0) /
            combinedEntityRows.reduce((sum, row) => sum + row.amount, 0)
          : 0,
      topRows: listTop(combinedEntityRows, 50),
    },
    qa: {
      inauguralIssueCount: inaugural.qaIssues.length,
      partyAccountIssueCount:
        partyAccountCommittees.qaIssues.length + partyAccountEntityRows.qaIssues.length,
      issueCount:
        inaugural.qaIssues.length +
        partyAccountCommittees.qaIssues.length +
        partyAccountEntityRows.qaIssues.length,
      inauguralIssues: inaugural.qaIssues,
      partyAccountIssues: [
        ...partyAccountCommittees.qaIssues,
        ...partyAccountEntityRows.qaIssues,
      ],
    },
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(summaryJsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  await writeFile(summaryMdPath, buildInherentlyPartisanMarkdown(report), 'utf8');
  await writeFile(peopleRowsPath, JSON.stringify(inaugural.peopleRows, null, 2) + '\n', 'utf8');
  await writeFile(entityRowsPath, JSON.stringify(combinedEntityRows, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${summaryJsonPath}`);
  console.log(`Wrote ${summaryMdPath}`);
  console.log(`Wrote ${peopleRowsPath}`);
  console.log(`Wrote ${entityRowsPath}`);
  console.log(
    `Inaugural people ${formatCurrency(report.inaugural.people.totalAmount)} across ${report.inaugural.people.rowCount} rows`
  );
  console.log(
    `Combined entity additions ${formatCurrency(report.combinedEntityRows.totalAmount)} (${formatPct(
      report.combinedEntityRows.inauguralShare
    )} inaugural)`
  );
}

try {
  await main();
} catch (error) {
  console.error(normalizeWhitespace(error instanceof Error ? error.stack ?? error.message : String(error)));
  process.exit(1);
}
