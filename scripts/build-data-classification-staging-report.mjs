import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { normalizeWhitespace, today } from './lib/data-classification/common.mjs';
import {
  buildEntitiesReport,
  buildPeopleReport,
} from './lib/data-classification/staging-baseline-report.mjs';
import { buildStagingBaselineMarkdown } from './lib/data-classification/staging-baseline-markdown.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const BULK_ROOT = path.join(__dirname, '../tools/fec-bulk');
const REPORTS_DIR = path.join(BULK_ROOT, 'reports');
const VERIFICATION_REPORT_PATH = path.join(
  REPORTS_DIR,
  'committee-party-verification-2026-04-03.md'
);
const COMMITTEE_MASTER_PATTERN = /^cm(?: \d+)?\.txt$/i;

function normalizeCommitteeParty(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  return normalized && normalized !== 'UNK' ? normalized : null;
}

async function listCommitteeMasterFiles() {
  const entries = await readdir(BULK_ROOT, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && COMMITTEE_MASTER_PATTERN.test(entry.name))
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
  const lookup = new Map();

  for (const file of files) {
    const content = await readFile(file.filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      if (!line) continue;
      const fields = line.split('|');
      const committeeId = normalizeWhitespace(fields[0]);
      if (!committeeId) continue;

      lookup.set(committeeId, {
        committeeId,
        name: normalizeWhitespace(fields[1]) || committeeId,
        committeeType: normalizeWhitespace(fields[9]) || null,
        party: normalizeCommitteeParty(fields[10]),
      });
    }
  }

  return {
    lookup,
    files: files.map((file) => file.name),
  };
}

async function loadVerificationRecommendations() {
  const recommendations = new Map();
  const content = await readFile(VERIFICATION_REPORT_PATH, 'utf8');
  const blocks = content.split(/^###\s+/m).slice(1);

  for (const block of blocks) {
    const headerMatch = block.match(/^(C\d{8})\s+-\s+(.+)$/m);
    const recommendationMatch = block.match(/Recommendation:\s+`([^`]+)`/);
    const confidenceMatch = block.match(/Confidence:\s+`([^`]+)`/);
    if (!headerMatch || !recommendationMatch) continue;

    recommendations.set(headerMatch[1], {
      committeeId: headerMatch[1],
      committeeName: headerMatch[2],
      recommendation: recommendationMatch[1],
      confidence: confidenceMatch?.[1] ?? null,
    });
  }

  return recommendations;
}

async function writeReportFiles(report, basename) {
  await mkdir(REPORTS_DIR, { recursive: true });
  const jsonPath = path.join(REPORTS_DIR, `${basename}.json`);
  const mdPath = path.join(REPORTS_DIR, `${basename}.md`);

  await writeFile(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  await writeFile(mdPath, buildStagingBaselineMarkdown(report), 'utf8');

  return { jsonPath, mdPath };
}

async function main() {
  const basenameArg = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--basename='))
    ?.slice('--basename='.length)
    .trim();
  const basename = basenameArg || `data-classification-staging-${today()}`;

  const rawPeople = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const rawEntities = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  const people = Array.isArray(rawPeople) ? rawPeople : rawPeople.people ?? [];
  const entities = Array.isArray(rawEntities) ? rawEntities : rawEntities.entities ?? [];
  const { lookup: committeeLookup, files: committeeMasterFiles } = await loadCommitteeLookup();
  const recommendations = await loadVerificationRecommendations();

  const report = {
    generatedAt: today(),
    sourceFiles: {
      people: PEOPLE_PATH,
      entities: ENTITIES_PATH,
      verificationReport: VERIFICATION_REPORT_PATH,
      committeeMasterFiles,
    },
    people: buildPeopleReport(people, committeeLookup, recommendations),
    entities: buildEntitiesReport(entities),
  };

  const paths = await writeReportFiles(report, basename);

  console.log(`Wrote ${paths.jsonPath}`);
  console.log(`Wrote ${paths.mdPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
