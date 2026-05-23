#!/usr/bin/env node
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pullAppleFeedback, hasAppleConfig } from './lib/storeFeedback/apple.mjs';
import { pullGooglePlayFeedback, hasGoogleConfig } from './lib/storeFeedback/google.mjs';
import {
  ensureDir,
  parseArgs,
  recordsToMarkdown,
  timestampForPath,
  writeJson,
  writeJsonl,
} from './lib/storeFeedback/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_OUT = path.join(REPO_ROOT, 'tools/review/store-feedback');

function usage() {
  console.log(`
Usage:
  node scripts/pull-store-feedback.mjs --provider=apple
  node scripts/pull-store-feedback.mjs --provider=google
  node scripts/pull-store-feedback.mjs --provider=all

Common flags:
  --since=YYYY-MM-DD              Keep records created on/after this date
  --limit=200                     API page size (Apple max 200, Google max 100)
  --out=PATH                      Output root (default tools/review/store-feedback)
  --no-raw                        Exclude raw API payload from normalized JSON

Apple flags:
  --apple-app-id=ID               Overrides APP_STORE_CONNECT_APP_ID
  --no-apple-screenshots          Skip TestFlight screenshot feedback
  --no-apple-crashes              Skip TestFlight crash feedback
  --download-screenshots          Download TestFlight screenshot assets
  --download-crash-logs           Download TestFlight crash logs
  --apple-filter-build=ID         Filter by App Store Connect build resource ID

Google flags:
  --google-package=NAME           Overrides GOOGLE_PLAY_PACKAGE_NAME
  --all-pages                     Fetch every Google reviews page
  --translation=en                Request translated Google review text

Notes:
  Apple TestFlight screenshot/crash feedback is API-accessible.
  Google Play production reviews are API-accessible.
  Google Play open/closed/internal testing feedback is Play Console-only in the official API.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    usage();
    return;
  }

  const provider = String(args.provider || 'all').toLowerCase();
  if (!['all', 'apple', 'google'].includes(provider)) {
    throw new Error(`Unknown --provider=${provider}. Use all, apple, or google.`);
  }

  const runId = timestampForPath();
  const outRoot = path.resolve(args.out || DEFAULT_OUT);
  const outDir = path.join(outRoot, runId);
  await ensureDir(outDir);

  const records = [];
  const skipped = [];

  if (provider === 'all' || provider === 'apple') {
    if (hasAppleConfig(process.env)) {
      records.push(...await pullAppleFeedback({ env: process.env, args, outDir }));
    } else if (provider === 'apple') {
      throw new Error('Apple provider requested, but App Store Connect credentials are missing.');
    } else {
      skipped.push('apple: missing App Store Connect credentials');
    }
  }

  if (provider === 'all' || provider === 'google') {
    if (hasGoogleConfig(process.env)) {
      records.push(...await pullGooglePlayFeedback({ env: process.env, args, outDir }));
    } else if (provider === 'google') {
      throw new Error('Google provider requested, but Google Play credentials are missing.');
    } else {
      skipped.push('google: missing Google Play credentials');
    }
  }

  records.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  await writeJson(path.join(outDir, 'feedback.json'), records);
  await writeJsonl(path.join(outDir, 'feedback.jsonl'), records);
  await writeFile(path.join(outDir, 'feedback.md'), recordsToMarkdown(records, { skipped }));
  await writeJson(path.join(outDir, 'metadata.json'), {
    generatedAt: new Date().toISOString(),
    provider,
    count: records.length,
    skipped,
    outputDir: path.relative(REPO_ROOT, outDir),
  });

  console.log(`Pulled ${records.length} feedback record(s).`);
  if (skipped.length) console.log(`Skipped: ${skipped.join('; ')}`);
  console.log(`Output: ${path.relative(REPO_ROOT, outDir)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
