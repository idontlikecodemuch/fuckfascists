/**
 * verify-entities.mjs
 *
 * For each entity in assets/data/entities.json where fecCommitteeId is empty,
 * queries the FEC API to find the best-matching committee by canonicalName.
 * If a match with Jaro-Winkler similarity > 0.85 is found, writes the
 * committee_id back to the entity. Otherwise, logs the entity name to
 * scripts/unverified-entities.txt.
 *
 * Usage:
 *   FEC_API_KEY=your_key node scripts/verify-entities.mjs
 *
 * Never run in CI — this is a manual data-pipeline tool.
 * Never hardcode the API key.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTITIES_PATH   = path.join(__dirname, '../assets/data/entities.json');
const UNVERIFIED_PATH = path.join(__dirname, 'unverified-entities.txt');
const FEC_API_BASE    = 'https://api.open.fec.gov/v1';
const SIMILARITY_THRESHOLD = 0.85;
const REQUEST_DELAY_MS     = 200;

// ── Jaro-Winkler (inline — script is standalone, cannot import TypeScript) ──────

function jaro(a, b) {
  if (a === b) return 1;
  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  if (maxDist < 0) return 0;

  const aMatched = new Array(a.length).fill(false);
  const bMatched = new Array(b.length).fill(false);
  let matches = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - maxDist);
    const end   = Math.min(i + maxDist + 1, b.length);
    for (let j = start; j < end; j++) {
      if (!bMatched[j] && a[i] === b[j]) {
        aMatched[i] = true;
        bMatched[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatched[i]) continue;
    while (!bMatched[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
}

function jaroWinkler(a, b, p = 0.1) {
  const j = jaro(a, b);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return j + prefix * p * (1 - j);
}

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[']/g, '')
    .replace(/[&\-]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── FEC API ──────────────────────────────────────────────────────────────────

async function searchCommittees(name, apiKey) {
  const params = new URLSearchParams({
    q: name,
    api_key: apiKey,
    per_page: '3',
  });
  const res = await fetch(`${FEC_API_BASE}/committees/?${params}`);
  if (!res.ok) throw new Error(`FEC API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return data.results ?? [];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env['FEC_API_KEY'];
  if (!apiKey) {
    console.error('ERROR: FEC_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const raw = await readFile(ENTITIES_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  // Support both flat array and { _meta, entities } wrapped format
  const entities = Array.isArray(parsed) ? parsed : parsed.entities;

  const unverified = [];
  let verified = 0;
  let skipped  = 0;

  for (const entity of entities) {
    if (entity.fecCommitteeId) {
      skipped++;
      continue;
    }

    const normalizedCanonical = normalize(entity.canonicalName);

    let results;
    try {
      results = await searchCommittees(entity.canonicalName, apiKey);
    } catch (err) {
      console.error(`  ERROR querying FEC for "${entity.canonicalName}": ${err.message}`);
      unverified.push(entity.canonicalName);
      await delay(REQUEST_DELAY_MS);
      continue;
    }

    // Find best match by Jaro-Winkler similarity
    let bestScore = 0;
    let bestId    = null;

    for (const result of results) {
      const score = jaroWinkler(normalizedCanonical, normalize(result.name));
      if (score > bestScore) {
        bestScore = score;
        bestId    = result.committee_id;
      }
    }

    if (bestScore >= SIMILARITY_THRESHOLD && bestId) {
      entity.fecCommitteeId = bestId;
      verified++;
      console.log(`  ✓ ${entity.canonicalName} → ${bestId} (score: ${bestScore.toFixed(3)})`);
    } else {
      unverified.push(entity.canonicalName);
      console.log(`  ✗ ${entity.canonicalName} — no confident match (best score: ${bestScore.toFixed(3)})`);
    }

    await delay(REQUEST_DELAY_MS);
  }

  // Write updated entities.json — preserve _meta wrapper if present
  const output = Array.isArray(parsed)
    ? entities
    : { ...parsed, _meta: { ...parsed._meta, totalEntities: entities.length, updatedAt: new Date().toISOString().slice(0, 10) }, entities };
  await writeFile(ENTITIES_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  // Write unverified list
  if (unverified.length > 0) {
    const lines = unverified.join('\n') + '\n';
    await writeFile(UNVERIFIED_PATH, lines, 'utf8');
    console.log(`\nUnverified list written to scripts/unverified-entities.txt`);
  }

  console.log(`\nSummary: ${verified} verified, ${unverified.length} unverified, ${skipped} skipped (already had fecCommitteeId)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
