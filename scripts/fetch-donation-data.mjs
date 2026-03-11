import 'dotenv/config';
/**
 * fetch-donation-data.mjs — pre-fetch FEC donation data and bundle into entities.json
 *
 * For each entity with a populated fecCommitteeId, calls the FEC API and writes
 * the result to entity.donationSummary. Entities with a fresh donationSummary
 * (within CACHE_TTL_DAYS of lastVerifiedDate) are skipped unless --force is passed.
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

const __dirname       = path.dirname(fileURLToPath(import.meta.url));
const ENTITIES_PATH   = path.join(__dirname, '../assets/data/entities.json');
const OUTPUT_DIR      = path.join(__dirname, 'output');
const PAC_REVIEW_PATH = path.join(OUTPUT_DIR, 'pac-review.json');
const FEC_API_BASE    = 'https://api.open.fec.gov/v1';
const CACHE_TTL_DAYS  = 60;

// Per-minute request caps — separate limits per endpoint family.
// /committee/* endpoints: 30/min (generous; FEC allows ~100/min authenticated).
// /schedules/schedule_b/: 8/min (stricter per-minute cap, empirically ~10–15/min).
const COMMITTEE_RPM      = 30;
const SCHEDULE_B_RPM     = 8;
// Exponential backoff on 429 (60 s → 120 s → 240 s, capped at 300 s).
const BACKOFF_INITIAL_MS = 60_000;
const BACKOFF_MAX_MS     = 300_000;
const BACKOFF_MAX_RETRIES = 3;
// Write entities.json every N successful fetches to preserve progress on interruption.
const WRITE_INTERVAL     = 10;

const CYCLES_SINCE_2016 = [2016, 2018, 2020, 2022, 2024];

/**
 * Entities whose stored fecCommitteeId is suspect (wrong type, no activity, etc.).
 * The script searches by name, picks the best active corporate PAC, and updates
 * entities.json when a better match is found.
 * key = entity.id, value = search term sent to /committees/?q=...
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

function isFresh(entity) {
  if (!entity.donationSummary || !entity.lastVerifiedDate) return false;
  const verifiedMs = new Date(entity.lastVerifiedDate).getTime();
  return Date.now() - verifiedMs <= CACHE_TTL_DAYS * 24 * 60 * 60 * 1_000;
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

/**
 * Sliding-window rate limiter. Tracks request timestamps within a 60 s window.
 * Call throttle() before every API request — it waits automatically when at capacity.
 * This is the correct way to enforce a per-minute count limit: rather than adding
 * fixed delays after requests, we check capacity before each request and wait only
 * as long as needed for the oldest in-window timestamp to expire.
 */
class RateLimiter {
  #maxPerMinute;
  #windowMs = 60_000;
  #timestamps = [];

  constructor(maxPerMinute) {
    this.#maxPerMinute = maxPerMinute;
  }

  async throttle() {
    const now = Date.now();
    this.#timestamps = this.#timestamps.filter((t) => now - t < this.#windowMs);
    if (this.#timestamps.length >= this.#maxPerMinute) {
      // Wait until the oldest in-window timestamp exits the window (+200 ms margin).
      const waitMs = this.#windowMs - (now - this.#timestamps[0]) + 200;
      if (waitMs > 0) {
        console.log(`  ⏸  Rate limit (${this.#maxPerMinute}/min) — waiting ${Math.ceil(waitMs / 1000)}s`);
        await delay(waitMs);
        const after = Date.now();
        this.#timestamps = this.#timestamps.filter((t) => after - t < this.#windowMs);
      }
    }
    this.#timestamps.push(Date.now());
  }
}

// Module-level singletons — one limiter per endpoint family, shared across all calls.
const committeeLimiter = new RateLimiter(COMMITTEE_RPM);
const sbLimiter        = new RateLimiter(SCHEDULE_B_RPM);

/**
 * Rate-limited fetch with exponential backoff on 429.
 * Calls limiter.throttle() before each attempt to stay within per-minute caps.
 * On 429: respects the Retry-After header when present; otherwise uses exponential
 * backoff (BACKOFF_INITIAL_MS → ×2 each retry, capped at BACKOFF_MAX_MS).
 * After BACKOFF_MAX_RETRIES consecutive 429s, returns the last 429 response —
 * callers must treat this as a fetch failure.
 */
async function apiFetch(url, limiter) {
  await limiter.throttle();
  let response = await fetch(url);
  let backoffMs = BACKOFF_INITIAL_MS;

  for (let retry = 0; response.status === 429 && retry < BACKOFF_MAX_RETRIES; retry++) {
    const retryAfter = response.headers?.get?.('Retry-After');
    const waitMs     = retryAfter ? parseInt(retryAfter, 10) * 1_000 + 1_000 : backoffMs;
    console.warn(`  ⚠ 429 on ${url.split('?')[0]} — waiting ${Math.ceil(waitMs / 1000)}s (retry ${retry + 1}/${BACKOFF_MAX_RETRIES})`);
    await delay(waitMs);
    backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
    await limiter.throttle();
    response = await fetch(url);
  }

  return response;
}

// ── FEC API functions ─────────────────────────────────────────────────────────

/** Returns true if the committee has at least one cycle of totals data since 2016. */
async function committeeHasTotals(committeeId, apiKey) {
  const id          = encodeURIComponent(committeeId);
  const keyParam    = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');
  const res = await apiFetch(
    `${FEC_API_BASE}/committee/${id}/totals/?per_page=1&sort=-cycle&${cycleParams}${keyParam}`,
    committeeLimiter,
  );
  if (!res.ok) return false;
  const data = await res.json();
  return (data.results ?? []).length > 0;
}

/**
 * Searches FEC for corporate PACs (committee_type=Q) matching `term`.
 * Returns the committee_id of the first result that has recorded totals, or null.
 */
async function findBestCommitteeId(term, currentId, apiKey) {
  const params = new URLSearchParams({ q: term, committee_type: 'Q', per_page: '10' });
  if (apiKey) params.set('api_key', apiKey);

  const res = await apiFetch(`${FEC_API_BASE}/committees/?${params}`, committeeLimiter);
  if (!res.ok) {
    console.warn(`    ⚠ Name search for "${term}" returned HTTP ${res.status} — keeping existing ID`);
    return null;
  }

  const data       = await res.json();
  const candidates = data.results ?? [];
  if (candidates.length === 0) {
    console.warn(`    ⚠ No PAC results for "${term}" — keeping existing ID`);
    return null;
  }

  for (const candidate of candidates) {
    const id = candidate.committee_id;
    if (id === currentId) continue;
    if (await committeeHasTotals(id, apiKey)) {
      console.log(`    → Found better ID for "${term}": ${id} (${candidate.name})`);
      return id;
    }
  }

  console.warn(`    ⚠ No candidate with totals found for "${term}" — keeping existing ID`);
  return null;
}

/**
 * Paginates /schedules/schedule_b/ for all candidate-committee disbursements since 2016.
 * Returns all records on success, or null if still rate-limited after max retries.
 */
async function fetchScheduleBContributions(committeeId, apiKey) {
  const id            = encodeURIComponent(committeeId);
  const keyParam      = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const sbCycleParams = CYCLES_SINCE_2016.map((c) => `two_year_transaction_period=${c}`).join('&');
  // H=House, S=Senate, P=Presidential candidate committees only.
  // Replaces recipient_type=P which was returning all disbursements unfiltered.
  const sbTypeParams  = ['H', 'S', 'P'].map((t) => `recipient_committee_type=${t}`).join('&');

  const records = [];
  let cursor = '';

  while (true) {
    const url = `${FEC_API_BASE}/schedules/schedule_b/?committee_id=${id}&${sbTypeParams}&per_page=100&sort=-disbursement_date&${sbCycleParams}${keyParam}${cursor}`;
    const res = await apiFetch(url, sbLimiter);

    if (res.status === 429) {
      // All retries exhausted — caller will preserve existing donation data.
      console.warn(`  ⚠ Schedule B for ${committeeId} rate-limited after all retries — skipping`);
      return null;
    }
    if (!res.ok) {
      if (res.status !== 404) console.warn(`  ⚠ Schedule B for ${committeeId} returned HTTP ${res.status}`);
      break;
    }

    const data  = await res.json();
    const batch = data.results ?? [];
    records.push(...batch);

    const lastIndexes = data.pagination?.last_indexes;
    if (!lastIndexes?.last_index || batch.length < 100) break;

    const li = encodeURIComponent(lastIndexes.last_index);
    const ld = encodeURIComponent(lastIndexes.last_disbursement_date ?? '');
    cursor = `&last_index=${li}&last_disbursement_date=${ld}`;
  }

  return records;
}

/**
 * Fetches donation data for a single FEC committee.
 *   1. /committee/{id}/        → committeeName
 *   2. /committee/{id}/totals/ → activeCycles, recentCycle
 *   3. /schedules/schedule_b/  → party-attributed totals (REP/DEM) + raw[] for others
 */
async function fetchCommitteeTotals(committeeId, apiKey, existingSummary = null) {
  const id          = encodeURIComponent(committeeId);
  const keyParam    = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';
  const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');

  const detailsRes = await apiFetch(
    `${FEC_API_BASE}/committee/${id}/?per_page=1${keyParam}`,
    committeeLimiter,
  );
  if (!detailsRes.ok) throw new Error(`FEC details API ${detailsRes.status}: ${detailsRes.statusText}`);
  const detailsData   = await detailsRes.json();
  const committeeName = (detailsData.results ?? [])[0]?.name ?? committeeId;

  const totalsRes = await apiFetch(
    `${FEC_API_BASE}/committee/${id}/totals/?per_page=10&sort=-cycle&${cycleParams}${keyParam}`,
    committeeLimiter,
  );
  if (!totalsRes.ok) throw new Error(`FEC totals API ${totalsRes.status}: ${totalsRes.statusText}`);

  const totalsResults = (await totalsRes.json()).results ?? [];
  const baseResult    = { committeeId, committeeName, lastUpdated: today(), fecCommitteeUrl: `https://www.fec.gov/data/committee/${committeeId}/` };

  // Zero summary for dissolved / pre-activity committees.
  if (totalsResults.length === 0) {
    return { ...baseResult, recentCycle: 0, recentRepubs: 0, recentDems: 0, totalRepubs: 0, totalDems: 0, activeCycles: [], raw: [] };
  }

  const recentCycle  = totalsResults[0].cycle ?? 0;
  const activeCycles = totalsResults.filter((r) => r.cycle != null).map((r) => r.cycle).sort((a, b) => a - b);

  const sbRecords = await fetchScheduleBContributions(committeeId, apiKey);

  // Schedule B rate-limited after all retries — preserve previous donation amounts.
  if (sbRecords === null) {
    console.warn(`  ⚠ ${committeeId}: preserving previous donation amounts`);
    return {
      ...baseResult,
      recentCycle,
      activeCycles,
      recentRepubs: existingSummary?.recentRepubs ?? 0,
      recentDems:   existingSummary?.recentDems   ?? 0,
      totalRepubs:  existingSummary?.totalRepubs  ?? 0,
      totalDems:    existingSummary?.totalDems    ?? 0,
      raw:          existingSummary?.raw          ?? [],
    };
  }

  let totalRepubs = 0, totalDems = 0, recentRepubs = 0, recentDems = 0;
  const rawMap = new Map();

  for (const rec of sbRecords) {
    const amount     = rec.disbursement_amount ?? 0;
    const cycle      = rec.two_year_transaction_period ?? 0;
    // candidate_party_affiliation is blank on many FEC records — fall back to recipient_committee.party.
    const party      = (rec.candidate_party_affiliation || rec.recipient_committee?.party || '').toUpperCase();
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
        rawMap.set(key, { lineNumber, description: rec.disbursement_description ?? '', amount, cycle, isReceipt: false });
      }
    }
  }

  return { ...baseResult, recentCycle, recentRepubs, recentDems, totalRepubs, totalDems, activeCycles, raw: Array.from(rawMap.values()) };
}

// ── Persistence ───────────────────────────────────────────────────────────────

async function writeEntities(parsed, entities) {
  const output = Array.isArray(parsed)
    ? entities
    : { ...parsed, _meta: { ...parsed._meta, totalEntities: entities.length, updatedAt: today() }, entities };
  await writeFile(ENTITIES_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env['FEC_API_KEY'];
  if (!apiKey) {
    console.error('ERROR: FEC_API_KEY is not set. Add it to your .env file (see .env.example).');
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  if (force) console.log('--force flag set: re-fetching all entities regardless of freshness.\n');

  const raw      = await readFile(ENTITIES_PATH, 'utf8');
  const parsed   = JSON.parse(raw);
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
    }
    console.log('');
    // No explicit cooldown needed — the rate limiter handles all throttling automatically.
  }

  // ── Main fetch loop ──────────────────────────────────────────────────────────

  const candidates = entities.filter(
    (e) => typeof e.fecCommitteeId === 'string' && e.fecCommitteeId !== '',
  );
  console.log(`${candidates.length} entities have a verified fecCommitteeId.\n`);

  let fetched = 0, skipped = 0, failed = 0;
  const failedIds = [];

  for (const entity of candidates) {
    // When fecCommitteeRecords is present, use the active record's id.
    // Log dissolved records — do not fetch their historical data.
    let committeeIdToFetch = entity.fecCommitteeId;
    if (Array.isArray(entity.fecCommitteeRecords) && entity.fecCommitteeRecords.length > 0) {
      const dissolved = entity.fecCommitteeRecords.filter((r) => r.status === 'dissolved');
      const active    = entity.fecCommitteeRecords.filter((r) => r.status === 'active');
      if (dissolved.length > 0) {
        console.log(`  ↷ ${entity.id}: skipping ${dissolved.length} dissolved record(s): ${dissolved.map((r) => r.id).join(', ')}`);
      }
      if (active.length > 0) {
        committeeIdToFetch = active[0].id;
        if (committeeIdToFetch !== entity.fecCommitteeId) {
          console.log(`  → ${entity.id}: using active fecCommitteeRecords id ${committeeIdToFetch} (primary was ${entity.fecCommitteeId})`);
          entity.fecCommitteeId = committeeIdToFetch;
        }
      }
    }

    if (!force && isFresh(entity)) {
      skipped++;
      continue;
    }

    try {
      const summary = await fetchCommitteeTotals(committeeIdToFetch, apiKey, entity.donationSummary ?? null);
      entity.donationSummary  = summary;
      entity.lastVerifiedDate = today();
      fetched++;
      const activityNote = summary.activeCycles.length === 0 ? ' (no activity on record)' : '';
      console.log(`  ✓ ${entity.id} (${committeeIdToFetch}) — ${summary.committeeName}${activityNote}`);

      // Incremental save every WRITE_INTERVAL successes — preserves progress on interruption.
      if (fetched % WRITE_INTERVAL === 0) {
        await writeEntities(parsed, entities);
        console.log(`  💾 Progress saved (${fetched} fetched so far)\n`);
      }
    } catch (err) {
      failed++;
      failedIds.push(entity.id);
      // Clear lastVerifiedDate so this entity is not skipped as fresh on the next run.
      entity.lastVerifiedDate = '';
      console.error(`  ✗ ${entity.id} (${committeeIdToFetch}) — ${err.message}`);
    }
  }

  // ── Post-pass: PAC watchlist ─────────────────────────────────────────────────

  const pacReview = entities
    .filter(
      (e) =>
        e.verificationStatus !== 'manual' &&
        typeof e.fecCommitteeId === 'string' &&
        e.fecCommitteeId !== '' &&
        Array.isArray(e.donationSummary?.activeCycles) &&
        e.donationSummary.activeCycles.length === 0,
    )
    .map((e) => ({ id: e.id, fecCommitteeId: e.fecCommitteeId }));

  if (pacReview.length > 0) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(PAC_REVIEW_PATH, JSON.stringify(pacReview, null, 2) + '\n', 'utf8');
    console.log(`\n⚠ ${pacReview.length} entities have no recorded PAC activity → scripts/output/pac-review.json`);
  }

  // Final write.
  await writeEntities(parsed, entities);

  console.log('\n' + '─'.repeat(45));
  console.log(`Fetched: ${fetched} / Skipped (fresh): ${skipped} / Failed: ${failed}`);
  if (failedIds.length > 0) console.log(`Failed entities: [${failedIds.join(', ')}]`);
  console.log('─'.repeat(45));
  console.log('entities.json updated. Commit manually when ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
