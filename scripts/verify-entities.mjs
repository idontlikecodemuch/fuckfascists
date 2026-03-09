import 'dotenv/config';
/**
 * verify-entities.mjs — three-phase FEC committee verification
 *
 * Phase 1: Auto-verify (>= 0.78), near-miss queue (>= 0.65), unverified log.
 * Phase 2: Interactive near-miss review (y/n/o/q).
 * Phase 3: Save entities.json, optional git commit + push.
 *
 * Usage: npm run verify:entities
 * Never run in CI. Never hardcode the API key.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname       = path.dirname(fileURLToPath(import.meta.url));
const ENTITIES_PATH   = path.join(__dirname, '../assets/data/entities.json');
const UNVERIFIED_PATH = path.join(__dirname, 'unverified-entities.txt');
const NEAR_MISS_PATH  = path.join(__dirname, 'near-miss-entities.txt');
const FEC_API_BASE    = 'https://api.open.fec.gov/v1';
const THRESHOLD_AUTO  = 0.78;   // auto-populate fecCommitteeId
const THRESHOLD_NEAR  = 0.65;   // queue for interactive review
const REQUEST_DELAY_MS = 3600;  // ~1,000 req/hr — FEC free-tier limit
const DIV = '─'.repeat(45);

function jaro(a, b) {
  if (a === b) return 1;
  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  if (maxDist < 0) return 0;
  const aM = new Array(a.length).fill(false);
  const bM = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const s = Math.max(0, i - maxDist), e = Math.min(i + maxDist + 1, b.length);
    for (let j = s; j < e; j++) {
      if (!bM[j] && a[i] === b[j]) { aM[i] = true; bM[j] = true; matches++; break; }
    }
  }
  if (matches === 0) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aM[i]) continue;
    while (!bM[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  return (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
}

function jaroWinkler(a, b, p = 0.1) {
  const j = jaro(a, b);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++; else break;
  }
  return j + prefix * p * (1 - j);
}

function normalize(s) {
  return s.toLowerCase().replace(/[']/g, '').replace(/[&\-]/g, '')
    .replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const CORP_SUFFIXES = /\s+(inc|llc|corp|corporation|ltd|co|company|group|holdings|enterprises|international|usa|america|americas)\.?$/i;
function stripSuffix(s) { return s.replace(CORP_SUFFIXES, '').trim(); }

function sanitizeForFEC(name) {
  return name
    .replace(/\./g, ' ').replace(/,/g, ' ').replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
}

async function searchCommittees(name, apiKey) {
  const params = new URLSearchParams({ q: name, api_key: apiKey, per_page: '10' });
  const res = await fetch(`${FEC_API_BASE}/committees/?${params}`);
  if (res.status === 422) return null;  // invalid query — caller warns and skips
  if (!res.ok) throw new Error(`FEC API ${res.status}: ${res.statusText}`);
  return (await res.json()).results ?? [];
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

function pickBest(results, normalizedQuery) {
  let bestScore = 0, bestId = null, bestName = null;
  for (const r of results) {
    const score = jaroWinkler(normalizedQuery, normalize(r.name));
    if (score > bestScore) { bestScore = score; bestId = r.committee_id; bestName = r.name; }
  }
  return { bestScore, bestId, bestName };
}

async function phase1(entities, apiKey, force) {
  const nearMisses = [], unverified = [];
  let autoVerified = 0, skipped = 0;

  for (const entity of entities) {
    // Always skip manual entries (human-verified) unless --force.
    // Also skip entities that already have a committee ID set by the pipeline.
    if (!force && (entity.verificationStatus === 'manual' || entity.fecCommitteeId)) {
      skipped++;
      continue;
    }

    const normCanonical = normalize(entity.canonicalName);
    const stripped = stripSuffix(entity.canonicalName);
    const queries = [entity.canonicalName,
      stripped !== entity.canonicalName ? stripped : null,
      ...(entity.aliases ?? []).slice(0, 2),
    ].filter(Boolean);

    const seen = new Set();
    let best = { bestScore: 0, bestId: null, bestName: null };

    for (const q of queries) {
      const sanitized = sanitizeForFEC(q);
      if (!sanitized || seen.has(sanitized)) continue;
      seen.add(sanitized);
      try {
        const results = await searchCommittees(sanitized, apiKey);
        await delay(REQUEST_DELAY_MS);
        if (results === null) {
          console.warn(`  ⚠ 422 on query "${sanitized}" — skipping this attempt`);
          continue;
        }
        const m = pickBest(results, normCanonical);
        if (m.bestScore > best.bestScore) best = m;
      } catch (err) {
        console.error(`  ERROR querying FEC for "${sanitized}": ${err.message}`);
        await delay(REQUEST_DELAY_MS);
      }
      if (best.bestScore >= THRESHOLD_AUTO) break;
    }

    if (best.bestScore >= THRESHOLD_AUTO && best.bestId) {
      entity.fecCommitteeId = best.bestId;
      entity.verificationStatus = 'pipeline';
      autoVerified++;
      console.log(`  ✓ ${entity.canonicalName} → ${best.bestId} (${best.bestScore.toFixed(3)})`);
    } else if (best.bestScore >= THRESHOLD_NEAR && best.bestId) {
      nearMisses.push({ entity, bestId: best.bestId, bestName: best.bestName, bestScore: best.bestScore });
      console.log(`  ~ ${entity.canonicalName} — near-miss (${best.bestScore.toFixed(3)})`);
    } else {
      unverified.push(entity.canonicalName);
      console.log(`  ✗ ${entity.canonicalName} — no match (best: ${best.bestScore.toFixed(3)})`);
    }
  }

  return { nearMisses, unverified, autoVerified, skipped };
}

async function phase2(nearMisses, autoVerified) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  console.log(`\n${DIV}`);
  console.log(`Phase 1 complete. ${autoVerified} verified automatically.`);
  console.log(`${nearMisses.length} near-misses need your review.`);
  console.log(`Press enter to start review, or Ctrl+C to skip.`);
  await ask('');

  let manualVerified = 0;
  const deferred = [];

  for (let i = 0; i < nearMisses.length; i++) {
    const { entity, bestId, bestName, bestScore } = nearMisses[i];
    const fecUrl = `https://www.fec.gov/data/committee/${bestId}/`;
    let done = false;

    while (!done) {
      console.log(`\n${DIV}`);
      console.log(`[${i + 1} of ${nearMisses.length}] ${entity.canonicalName}`);
      console.log(`Candidate: ${bestName}`);
      console.log(`Committee ID: ${bestId}`);
      console.log(`Score: ${bestScore.toFixed(2)}`);
      console.log(`FEC page: ${fecUrl}`);
      console.log(`\n(y) Accept   (n) Skip   (o) Open in browser   (q) Quit review`);
      const ans = (await ask('→ ')).trim().toLowerCase();

      if (ans === 'y') {
        entity.fecCommitteeId = bestId;
        entity.verificationStatus = 'pipeline';
        manualVerified++;
        console.log(`  ✓ Accepted.`);
        done = true;
      } else if (ans === 'n') {
        deferred.push(entity.canonicalName);
        done = true;
      } else if (ans === 'o') {
        try { execSync(`open "${fecUrl}"`); } catch { /* non-mac: ignore */ }
      } else if (ans === 'q') {
        for (let j = i; j < nearMisses.length; j++) deferred.push(nearMisses[j].entity.canonicalName);
        rl.close();
        return { manualVerified, deferred };
      }
    }
  }

  rl.close();
  return { manualVerified, deferred };
}

async function phase3(parsed, entities, { autoVerified, manualVerified, deferred, unverified, skipped }) {
  const output = Array.isArray(parsed)
    ? entities
    : { ...parsed, _meta: { ...parsed._meta, totalEntities: entities.length, updatedAt: new Date().toISOString().slice(0, 10) }, entities };
  await writeFile(ENTITIES_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  if (unverified.length > 0) await writeFile(UNVERIFIED_PATH, unverified.join('\n') + '\n', 'utf8');
  if (deferred.length > 0)   await writeFile(NEAR_MISS_PATH,  deferred.join('\n')   + '\n', 'utf8');

  console.log(`\n${DIV}`);
  console.log(`✓ Auto-verified:     ${autoVerified}`);
  console.log(`✓ Manually verified: ${manualVerified}`);
  console.log(`~ Skipped/deferred:  ${deferred.length}${deferred.length > 0 ? ' (scripts/near-miss-entities.txt)' : ''}`);
  console.log(`✗ Unverified:        ${unverified.length}${unverified.length > 0 ? ' (scripts/unverified-entities.txt)' : ''}`);
  console.log(`- Already had ID:    ${skipped}`);
  console.log(DIV);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise((resolve) => rl.question('Commit results? (y/n) → ', resolve));
  rl.close();

  if (ans.trim().toLowerCase() === 'y') {
    execSync('git add assets/data/entities.json', { stdio: 'inherit' });
    execSync('git commit -m "feat(entities): populate fecCommitteeId via FEC API verification"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('Done. Pushed to main.');
  } else {
    console.log('entities.json saved locally. Commit manually when ready.');
  }
}

async function main() {
  const apiKey = process.env['FEC_API_KEY'];
  if (!apiKey) { console.error('ERROR: FEC_API_KEY environment variable is not set.'); process.exit(1); }

  const force = process.argv.includes('--force');
  if (force) console.log('--force flag set: re-verifying all entities including manual.\n');

  const raw      = await readFile(ENTITIES_PATH, 'utf8');
  const parsed   = JSON.parse(raw);
  const entities = Array.isArray(parsed) ? parsed : parsed.entities;
  console.log(`Loaded ${entities.length} entities. Starting Phase 1...\n`);

  const { nearMisses, unverified, autoVerified, skipped } = await phase1(entities, apiKey, force);
  let manualVerified = 0, deferred = [];

  if (nearMisses.length > 0) {
    ({ manualVerified, deferred } = await phase2(nearMisses, autoVerified));
  } else {
    console.log('\nNo near-misses. Skipping Phase 2.');
  }

  await phase3(parsed, entities, { autoVerified, manualVerified, deferred, unverified, skipped });
}

main().catch((err) => { console.error(err); process.exit(1); });
