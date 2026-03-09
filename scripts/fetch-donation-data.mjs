import 'dotenv/config';
/**
 * fetch-donation-data.mjs — pre-fetch FEC donation data and bundle into entities.json
 *
 * For each entity with a populated fecCommitteeId, calls the FEC API and writes
 * the result to entity.donationSummary. Entities with a fresh donationSummary
 * (within ENTITY_CACHE_TTL_DAYS of lastVerifiedDate) are skipped unless --force
 * is passed.
 *
 * Usage:
 *   npm run fetch:donations            # skip fresh entities
 *   npm run fetch:donations -- --force # re-fetch everything
 *
 * Requires FEC_API_KEY in environment (or .env file).
 * Never run in CI. Never hardcode the API key.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname      = path.dirname(fileURLToPath(import.meta.url));
const ENTITIES_PATH  = path.join(__dirname, '../assets/data/entities.json');
const FEC_API_BASE   = 'https://api.open.fec.gov/v1';
const CACHE_TTL_DAYS = 60;
const REQUEST_DELAY_MS = 500;
const CYCLES_SINCE_2016 = [2016, 2018, 2020, 2022, 2024];

/**
 * Entities whose stored fecCommitteeId is suspect (wrong type, no activity,
 * recently created). The script will search by name, pick the best active
 * corporate PAC result, and update entities.json if a better match is found.
 *
 * key   = entity.id
 * value = search term to send to /committees/?q=...&committee_type=Q
 */
const SEARCH_BY_NAME = {
  'google-alphabet': 'Google',
  'uber':            'Uber Technologies',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns true when entity.donationSummary exists and lastVerifiedDate
 * is within CACHE_TTL_DAYS of today.
 */
function isFresh(entity) {
  if (!entity.donationSummary || !entity.lastVerifiedDate) return false;
  const verifiedMs = new Date(entity.lastVerifiedDate).getTime();
  const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - verifiedMs <= ttlMs;
}

/**
 * Searches FEC for corporate PACs (committee_type=Q) matching `term`.
 * Returns the committee_id of the first result that has recorded totals,
 * or null if none found.
 */
async function findBestCommitteeId(term, currentId, apiKey) {
  const params = new URLSearchParams({ q: term, committee_type: 'Q', per_page: '10' });
  if (apiKey) params.set('api_key', apiKey);

  const res = await fetch(`${FEC_API_BASE}/committees/?${params}`);
  if (!res.ok) {
    console.warn(`    ⚠ Name search for "${term}" returned HTTP ${res.status} — keeping existing ID`);
    return null;
  }

  const data = await res.json();
  const candidates = data.results ?? [];

  if (candidates.length === 0) {
    console.warn(`    ⚠ No PAC results for "${term}" — keeping existing ID`);
    return null;
  }

  // Pick the first candidate that has totals data (at least one cycle).
  for (const candidate of candidates) {
    const id = candidate.committee_id;
    if (id === currentId) continue; // already know this one fails
    const hasTotals = await committeeHasTotals(id, apiKey);
    await delay(REQUEST_DELAY_MS);
    if (hasTotals) {
      console.log(`    → Found better ID for "${term}": ${id} (${candidate.name})`);
      return id;
    }
  }

  console.warn(`    ⚠ No candidate with totals found for "${term}" — keeping existing ID`);
  return null;
}

/** Returns true if the committee has at least one cycle of totals data. */
async function committeeHasTotals(committeeId, apiKey) {
  const id = encodeURIComponent(committeeId);
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');
  const res = await fetch(
    `${FEC_API_BASE}/committee/${id}/totals/?per_page=1&sort=-cycle&${cycleParams}${keyParam}`
  );
  if (!res.ok) return false;
  const data = await res.json();
  return (data.results ?? []).length > 0;
}

/**
 * Fetches donation totals for a single FEC committee ID.
 * Makes two parallel requests: committee details (name + party) + multi-cycle totals.
 * Returns a DonationSummary-shaped object.
 *
 * Graceful handling for dissolved / new-with-no-history committees:
 *   - If details results[] is empty → use committeeId as committeeName fallback,
 *     treat party as unknown (all donation amounts 0).
 *   - If totals endpoint returns 404 or empty results[] → build a zeroed summary
 *     with activeCycles: [] (committee exists but has no recorded activity).
 */
async function fetchCommitteeTotals(committeeId, apiKey) {
  const id = encodeURIComponent(committeeId);
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');

  // Note: FEC single-entity endpoints use singular /committee/{id}/ (not plural /committees/).
  const [detailsRes, totalsRes] = await Promise.all([
    fetch(`${FEC_API_BASE}/committee/${id}/?per_page=1${keyParam}`),
    fetch(`${FEC_API_BASE}/committee/${id}/totals/?per_page=10&sort=-cycle&${cycleParams}${keyParam}`),
  ]);

  if (!detailsRes.ok) {
    throw new Error(`FEC details API ${detailsRes.status}: ${detailsRes.statusText}`);
  }

  const detailsData = await detailsRes.json();
  const detailsRow = (detailsData.results ?? [])[0] ?? null;

  // Graceful fallback when details are missing (shouldn't happen for valid IDs,
  // but covers edge cases with newly registered or data-sparse committees).
  const committeeName = detailsRow?.name ?? committeeId;
  const party = (detailsRow?.party_full ?? '').toUpperCase();
  const isRepublican = party.includes('REPUBLICAN');
  const isDemocrat   = party.includes('DEMOCRAT');

  // Totals: 404 or empty results both mean "no recorded activity" — not an error.
  let results = [];
  if (totalsRes.ok) {
    const totalsData = await totalsRes.json();
    results = totalsData.results ?? [];
  }

  // Zero summary for dissolved / pre-activity committees.
  if (results.length === 0) {
    return {
      committeeId,
      committeeName,
      recentCycle:     0,
      recentRepubs:    0,
      recentDems:      0,
      totalRepubs:     0,
      totalDems:       0,
      activeCycles:    [],
      lastUpdated:     today(),
      fecCommitteeUrl: `https://www.fec.gov/data/committee/${committeeId}/`,
    };
  }

  const recent = results[0];
  const recentReceipts = recent.receipts ?? 0;
  const recentCycle    = recent.cycle ?? 0;

  let totalRepubs = 0;
  let totalDems   = 0;
  const activeCycles = [];

  for (const row of results) {
    const receipts = row.receipts ?? 0;
    if (isRepublican) totalRepubs += receipts;
    if (isDemocrat)   totalDems   += receipts;
    if (row.cycle != null) activeCycles.push(row.cycle);
  }

  activeCycles.sort((a, b) => a - b);

  return {
    committeeId,
    committeeName,
    recentCycle,
    recentRepubs:    isRepublican ? recentReceipts : 0,
    recentDems:      isDemocrat   ? recentReceipts : 0,
    totalRepubs,
    totalDems,
    activeCycles,
    lastUpdated:     today(),
    fecCommitteeUrl: `https://www.fec.gov/data/committee/${committeeId}/`,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env['FEC_API_KEY'];
  if (!apiKey) {
    console.error('ERROR: FEC_API_KEY is not set. Add it to your .env file (see .env.example).');
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  if (force) console.log('--force flag set: re-fetching all entities regardless of freshness.\n');

  const raw    = await readFile(ENTITIES_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const entities = Array.isArray(parsed) ? parsed : parsed.entities;

  console.log(`Loaded ${entities.length} entities from entities.json.\n`);

  // ── Pre-pass: name-based ID refresh for known-suspect committee IDs ──────────

  const searchCandidates = entities.filter((e) => SEARCH_BY_NAME[e.id]);
  if (searchCandidates.length > 0) {
    console.log(`Running name-based ID refresh for ${searchCandidates.length} entities...\n`);
    for (const entity of searchCandidates) {
      const term = SEARCH_BY_NAME[entity.id];
      console.log(`  Searching for better committee ID for ${entity.id} (current: ${entity.fecCommitteeId})...`);
      const betterId = await findBestCommitteeId(term, entity.fecCommitteeId, apiKey);
      if (betterId && betterId !== entity.fecCommitteeId) {
        console.log(`  ✓ Updated ${entity.id}: ${entity.fecCommitteeId} → ${betterId}`);
        entity.fecCommitteeId = betterId;
      } else if (!betterId) {
        console.log(`  – ${entity.id}: no better match found, keeping ${entity.fecCommitteeId}`);
      } else {
        console.log(`  – ${entity.id}: current ID is already the best match`);
      }
      await delay(REQUEST_DELAY_MS);
    }
    console.log('');
  }

  // ── Main fetch loop ──────────────────────────────────────────────────────────

  const candidates = entities.filter(
    (e) => typeof e.fecCommitteeId === 'string' && e.fecCommitteeId !== ''
  );

  console.log(`${candidates.length} entities have a verified fecCommitteeId.\n`);

  let fetched  = 0;
  let skipped  = 0;
  let failed   = 0;
  const failedIds = [];

  for (const entity of candidates) {
    // If fecCommitteeRecords is present, use the active record's id for fetching.
    // Log dissolved records and skip them — do not fetch their data.
    let committeIdToFetch = entity.fecCommitteeId;
    if (Array.isArray(entity.fecCommitteeRecords) && entity.fecCommitteeRecords.length > 0) {
      const dissolved = entity.fecCommitteeRecords.filter((r) => r.status === 'dissolved');
      const active    = entity.fecCommitteeRecords.filter((r) => r.status === 'active');
      if (dissolved.length > 0) {
        console.log(`  ↷ ${entity.id}: skipping ${dissolved.length} dissolved record(s): ${dissolved.map((r) => r.id).join(', ')}`);
      }
      if (active.length > 0) {
        committeIdToFetch = active[0].id;
        if (committeIdToFetch !== entity.fecCommitteeId) {
          console.log(`  → ${entity.id}: using active fecCommitteeRecords id ${committeIdToFetch} (primary fecCommitteeId was ${entity.fecCommitteeId})`);
          entity.fecCommitteeId = committeIdToFetch;
        }
      }
    }

    if (!force && isFresh(entity)) {
      skipped++;
      continue;
    }

    try {
      const summary = await fetchCommitteeTotals(committeIdToFetch, apiKey);
      entity.donationSummary  = summary;
      entity.lastVerifiedDate = today();
      fetched++;
      const activityNote = summary.activeCycles.length === 0 ? ' (no activity on record)' : '';
      console.log(`  ✓ ${entity.id} (${committeIdToFetch}) — ${summary.committeeName}${activityNote}`);
    } catch (err) {
      failed++;
      failedIds.push(entity.id);
      console.error(`  ✗ ${entity.id} (${committeIdToFetch}) — ${err.message}`);
    }

    await delay(REQUEST_DELAY_MS);
  }

  // Write back — preserve { _meta, entities } wrapper if present.
  const output = Array.isArray(parsed)
    ? entities
    : {
        ...parsed,
        _meta: {
          ...parsed._meta,
          totalEntities: entities.length,
          updatedAt: today(),
        },
        entities,
      };

  await writeFile(ENTITIES_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log('\n' + '─'.repeat(45));
  console.log(`Fetched: ${fetched} / Skipped (fresh): ${skipped} / Failed: ${failed}`);
  if (failedIds.length > 0) {
    console.log(`Failed entities: [${failedIds.join(', ')}]`);
  }
  console.log('─'.repeat(45));
  console.log('entities.json updated. Commit manually when ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
