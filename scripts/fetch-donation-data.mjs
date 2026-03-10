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

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname      = path.dirname(fileURLToPath(import.meta.url));
const ENTITIES_PATH  = path.join(__dirname, '../assets/data/entities.json');
const OUTPUT_DIR     = path.join(__dirname, 'output');
const PAC_REVIEW_PATH = path.join(OUTPUT_DIR, 'pac-review.json');
const FEC_API_BASE   = 'https://api.open.fec.gov/v1';
const CACHE_TTL_DAYS = 60;
const FETCH_DELAY_MS = 500;      // mirrors config/constants.ts FETCH_DELAY_MS
const RETRY_DELAY_MS = 2_000;    // wait before a single 429 retry
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

/**
 * Wraps fetch with a single 429 retry.
 * On a 429 response, waits RETRY_DELAY_MS then retries once.
 * Returns the final Response (which may still be 429 if the retry also failed).
 */
async function fetchWithRetry(url) {
  const res = await fetch(url);
  if (res.status !== 429) return res;
  console.warn(`  ⚠ Rate limited (429) on ${url.split('?')[0]} — waiting ${RETRY_DELAY_MS}ms and retrying`);
  await delay(RETRY_DELAY_MS);
  return fetch(url);
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

  const res = await fetchWithRetry(`${FEC_API_BASE}/committees/?${params}`);
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
    await delay(FETCH_DELAY_MS);
    if (hasTotals) {
      console.log(`    → Found better ID for "${term}": ${id} (${candidate.name})`);
      return id;
    }
  }

  console.warn(`    ⚠ No candidate with totals found for "${term}" — keeping existing ID`);
  return null;
}

/**
 * Paginates through /schedules/schedule_b/ and returns all candidate-contribution
 * disbursement records for the given committee since 2016.
 * Uses cursor-based pagination (last_index + last_disbursement_date).
 */
async function fetchScheduleBContributions(committeeId, apiKey) {
  const id            = encodeURIComponent(committeeId);
  const keyParam      = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const sbCycleParams = CYCLES_SINCE_2016.map((c) => `two_year_transaction_period=${c}`).join('&');

  const records = [];
  let cursor = '';

  while (true) {
    const url = `${FEC_API_BASE}/schedules/schedule_b/?committee_id=${id}&recipient_type=P&per_page=100&sort=-disbursement_date&${sbCycleParams}${keyParam}${cursor}`;
    const res = await fetchWithRetry(url);

    if (res.status === 429) {
      // Retry also hit 429 — skip Schedule B for this entity.
      console.warn(`  ⚠ Schedule B for ${committeeId} still rate-limited after retry — skipping`);
      return null;
    }

    if (!res.ok) {
      if (res.status === 404) break; // no records — not an error
      console.warn(`  ⚠ Schedule B for ${committeeId} returned HTTP ${res.status}`);
      break;
    }

    const data = await res.json();
    const batch = data.results ?? [];
    records.push(...batch);

    const lastIndexes = data.pagination?.last_indexes;
    if (!lastIndexes?.last_index || batch.length < 100) break;

    const li = encodeURIComponent(lastIndexes.last_index);
    const ld = encodeURIComponent(lastIndexes.last_disbursement_date ?? '');
    cursor = `&last_index=${li}&last_disbursement_date=${ld}`;

    await delay(FETCH_DELAY_MS);
  }

  return records;
}

/** Returns true if the committee has at least one cycle of totals data. */
async function committeeHasTotals(committeeId, apiKey) {
  const id = encodeURIComponent(committeeId);
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');
  const res = await fetchWithRetry(
    `${FEC_API_BASE}/committee/${id}/totals/?per_page=1&sort=-cycle&${cycleParams}${keyParam}`
  );
  if (!res.ok) return false;
  const data = await res.json();
  return (data.results ?? []).length > 0;
}

/**
 * Fetches donation data for a single FEC committee ID.
 *
 * - committee details → committeeName
 * - /committee/{id}/totals/ → activeCycles, recentCycle (aggregate activity only)
 * - /schedules/schedule_b/ (candidate recipients) → party-attributed totals:
 *     candidate_party_affiliation REP → repubs, DEM → dems, other → raw[]
 *
 * Graceful handling for dissolved / new-with-no-history committees:
 *   - If totals results[] is empty → zeroed summary (committee has no recorded activity).
 */
async function fetchCommitteeTotals(committeeId, apiKey, existingSummary = null) {
  const id       = encodeURIComponent(committeeId);
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');

  // Details + totals in parallel — totals used for activeCycles/recentCycle only.
  const [detailsRes, totalsRes] = await Promise.all([
    fetchWithRetry(`${FEC_API_BASE}/committee/${id}/?per_page=1${keyParam}`),
    fetchWithRetry(`${FEC_API_BASE}/committee/${id}/totals/?per_page=10&sort=-cycle&${cycleParams}${keyParam}`),
  ]);

  if (!detailsRes.ok) {
    throw new Error(`FEC details API ${detailsRes.status}: ${detailsRes.statusText}`);
  }

  if (totalsRes.status === 429) {
    throw new Error(`FEC totals API rate limited (429)`);
  }

  const detailsData = await detailsRes.json();
  const detailsRow  = (detailsData.results ?? [])[0] ?? null;
  const committeeName = detailsRow?.name ?? committeeId;

  // Totals: 404 or empty results both mean "no recorded activity" — not an error.
  let totalsResults = [];
  if (totalsRes.ok) {
    const totalsData = await totalsRes.json();
    totalsResults = totalsData.results ?? [];
  }

  // Zero summary for dissolved / pre-activity committees — skip Schedule B fetch.
  if (totalsResults.length === 0) {
    return {
      committeeId,
      committeeName,
      recentCycle:  0,
      recentRepubs: 0,
      recentDems:   0,
      totalRepubs:  0,
      totalDems:    0,
      activeCycles: [],
      raw:          [],
      lastUpdated:  today(),
      fecCommitteeUrl: `https://www.fec.gov/data/committee/${committeeId}/`,
    };
  }

  // activeCycles and recentCycle from totals (sorted -cycle by API).
  const recentCycle = totalsResults[0].cycle ?? 0;
  const activeCycles = totalsResults
    .filter((r) => r.cycle != null)
    .map((r) => r.cycle)
    .sort((a, b) => a - b);

  // Schedule B: actual candidate contributions — source of party attribution.
  await delay(FETCH_DELAY_MS);
  const sbRecords = await fetchScheduleBContributions(committeeId, apiKey);

  // Schedule B rate-limited — preserve existing donation amounts and skip recalculation.
  if (sbRecords === null) {
    console.warn(`  ⚠ ${committeeId}: Schedule B skipped — preserving previous donation amounts`);
    return {
      committeeId,
      committeeName,
      recentCycle,
      recentRepubs:  existingSummary?.recentRepubs  ?? 0,
      recentDems:    existingSummary?.recentDems    ?? 0,
      totalRepubs:   existingSummary?.totalRepubs   ?? 0,
      totalDems:     existingSummary?.totalDems     ?? 0,
      activeCycles,
      raw:           existingSummary?.raw           ?? [],
      lastUpdated:   today(),
      fecCommitteeUrl: `https://www.fec.gov/data/committee/${committeeId}/`,
    };
  }

  let totalRepubs  = 0;
  let totalDems    = 0;
  let recentRepubs = 0;
  let recentDems   = 0;
  const rawMap = new Map();

  for (const rec of sbRecords) {
    const amount     = rec.disbursement_amount ?? 0;
    const cycle      = rec.two_year_transaction_period ?? 0;
    const party      = (rec.candidate_party_affiliation ?? '').toUpperCase();
    const lineNumber = rec.line_number ?? '';

    if (party === 'REP') {
      totalRepubs += amount;
      if (cycle === recentCycle) recentRepubs += amount;
    } else if (party === 'DEM') {
      totalDems += amount;
      if (cycle === recentCycle) recentDems += amount;
    } else if (amount > 0) {
      const key      = `${lineNumber}:${cycle}`;
      const existing = rawMap.get(key);
      if (existing) {
        existing.amount += amount;
      } else {
        rawMap.set(key, {
          lineNumber,
          description: rec.disbursement_description ?? '',
          amount,
          cycle,
          isReceipt:   false,
        });
      }
    }
  }

  const raw = Array.from(rawMap.values());

  return {
    committeeId,
    committeeName,
    recentCycle,
    recentRepubs,
    recentDems,
    totalRepubs,
    totalDems,
    activeCycles,
    raw,
    lastUpdated:  today(),
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
      await delay(FETCH_DELAY_MS);
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
      const summary = await fetchCommitteeTotals(committeIdToFetch, apiKey, entity.donationSummary ?? null);
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

    await delay(FETCH_DELAY_MS);
  }

  // ── Post-pass: write dissolved/inactive PAC watchlist ───────────────────────
  // Entities that have a committee ID (non-manual) but returned no activity.
  const pacReview = entities
    .filter(
      (e) =>
        e.verificationStatus !== 'manual' &&
        typeof e.fecCommitteeId === 'string' &&
        e.fecCommitteeId !== '' &&
        Array.isArray(e.donationSummary?.activeCycles) &&
        e.donationSummary.activeCycles.length === 0
    )
    .map((e) => ({ id: e.id, fecCommitteeId: e.fecCommitteeId }));

  if (pacReview.length > 0) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(PAC_REVIEW_PATH, JSON.stringify(pacReview, null, 2) + '\n', 'utf8');
    console.log(`\n⚠ ${pacReview.length} entities have no recorded PAC activity → scripts/output/pac-review.json`);
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
