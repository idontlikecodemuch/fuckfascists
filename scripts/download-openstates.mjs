/**
 * download-openstates.mjs — download state legislator data from OpenStates
 *
 * Fetches 52 CSVs (50 states + DC + PR) from data.openstates.org, adds a state
 * column derived from the filename, and consolidates into a single CSV at
 * data/openstates/all-legislators.csv.
 *
 * The individual CSVs don't include a state column — it's derived from the source.
 * Only columns needed for party classification are retained: state, name,
 * current_party, current_chamber, given_name, family_name.
 *
 * Usage:
 *   node scripts/download-openstates.mjs
 *
 * Idempotent — re-running overwrites the output file.
 * Does not require any API keys.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../data/openstates');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'all-legislators.csv');

const BASE_URL = 'https://data.openstates.org/people/current';

const STATE_ABBRS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR',
];

// Column indices in the OpenStates CSV (0-indexed)
const COL = {
  name: 1,
  current_party: 2,
  current_chamber: 4,
  given_name: 5,
  family_name: 6,
};

function escapeCSV(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

async function main() {
  console.log('Downloading OpenStates legislator data...\n');

  await mkdir(OUTPUT_DIR, { recursive: true });

  const outputRows = ['state,name,current_party,current_chamber,given_name,family_name'];
  let totalLegislators = 0;
  let successCount = 0;
  let failCount = 0;

  for (const abbr of STATE_ABBRS) {
    const url = `${BASE_URL}/${abbr.toLowerCase()}.csv`;
    process.stdout.write(`  ${abbr}... `);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`HTTP ${res.status} — skipped`);
        failCount++;
        continue;
      }

      const text = await res.text();
      const lines = text.split('\n');

      // Skip header line (first line)
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = parseCsvLine(line);
        const name = (fields[COL.name] ?? '').trim();
        const currentParty = (fields[COL.current_party] ?? '').trim();
        const currentChamber = (fields[COL.current_chamber] ?? '').trim();
        const givenName = (fields[COL.given_name] ?? '').trim();
        const familyName = (fields[COL.family_name] ?? '').trim();

        if (!name) continue;

        outputRows.push([
          abbr,
          escapeCSV(name),
          escapeCSV(currentParty),
          escapeCSV(currentChamber),
          escapeCSV(givenName),
          escapeCSV(familyName),
        ].join(','));
        count++;
      }

      console.log(`${count} legislators`);
      totalLegislators += count;
      successCount++;
    } catch (err) {
      console.log(`error: ${err.message} — skipped`);
      failCount++;
    }
  }

  if (successCount === 0) {
    throw new Error('No OpenStates CSVs downloaded; refusing to overwrite with an empty dataset.');
  }

  await writeFile(OUTPUT_PATH, outputRows.join('\n') + '\n', 'utf8');

  console.log('\n' + '─'.repeat(45));
  console.log(`States: ${successCount} succeeded, ${failCount} failed`);
  console.log(`Total legislators: ${totalLegislators}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log('─'.repeat(45));
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
