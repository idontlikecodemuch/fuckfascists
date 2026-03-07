import 'dotenv/config';
/**
 * audit-committee-ids.mjs — verify every populated fecCommitteeId against the FEC API.
 *
 * For each entity where fecCommitteeId matches /^C\d{8}$/:
 *   - 404              → clear ID, add "INVALID ID: 404 from FEC API" note
 *   - Terminated/dissolved → keep ID, append "PAC dissolved, historical data still accessible via FEC" note
 *   - Name mismatch    → clear ID, add "MISMATCH: FEC returned [name] — needs re-verification" note
 *   - Good match       → leave as-is
 *
 * Works in batches of 20 with a 200ms inter-request delay.
 * Usage: node scripts/audit-committee-ids.mjs
 * Never hardcode the API key — reads from FEC_API_KEY env var.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath }       from 'node:url';
import path                    from 'node:path';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const FEC_API_BASE  = 'https://api.open.fec.gov/v1';
const DELAY_MS      = 1100; // FEC rate limit: 60 req/min — stay safely under at ~54/min
const BATCH_SIZE    = 20;
// A Jaro-Winkler score >= this threshold means the name "reasonably matches".
const MATCH_THRESHOLD = 0.60;
const COMMITTEE_ID_RE = /^C\d{8}$/;

// ── String utils ───────────────────────────────────────────────────────────────

function jaro(a, b) {
  if (a === b) return 1;
  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  if (maxDist < 0) return 0;
  const aM = new Array(a.length).fill(false);
  const bM = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const s = Math.max(0, i - maxDist);
    const e = Math.min(i + maxDist + 1, b.length);
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
  return s.toLowerCase()
    .replace(/[']/g, '')
    .replace(/[&\-]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Best JW score between fecName and any of (canonicalName, ...aliases). */
function bestMatchScore(fecName, canonicalName, aliases = []) {
  const normFec = normalize(fecName);
  const candidates = [canonicalName, ...aliases].map(normalize);
  return Math.max(...candidates.map((c) => jaroWinkler(normFec, c)));
}

// ── FEC API ────────────────────────────────────────────────────────────────────

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

/**
 * Fetches /committee/{id}/ (singular) and returns:
 *   { status: 'ok', name, terminated }
 *   { status: '404' }
 *   { status: 'error', message }
 *
 * FEC API notes:
 * - Correct endpoint is /committee/{id}/ (singular), not /committees/{id}/
 * - Response is always paginated: { results: [...], pagination: {...} }
 * - No explicit is_active or status field — dissolution is inferred from
 *   last_file_date: if null or before 2016, the PAC is treated as dissolved.
 */
async function fetchCommittee(committeeId, apiKey) {
  const url = `${FEC_API_BASE}/committee/${encodeURIComponent(committeeId)}/?api_key=${apiKey}`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    return { status: 'error', message: `fetch failed` };
  }

  if (res.status === 404) return { status: '404' };
  if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` };

  let body;
  try {
    body = await res.json();
  } catch {
    return { status: 'error', message: 'Invalid JSON' };
  }

  const data = Array.isArray(body?.results) ? body.results[0] : null;
  if (!data) return { status: '404' };

  const name          = data.name ?? '';
  const lastFileDate  = data.last_file_date ?? null;
  // If the PAC has never filed after 2015, treat it as dissolved.
  const terminated    = !lastFileDate || lastFileDate < '2016-01-01';

  return { status: 'ok', name, terminated };
}

// ── Note helpers ───────────────────────────────────────────────────────────────

function appendNote(entity, message) {
  entity.notes = entity.notes ? `${entity.notes} | ${message}` : message;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env['FEC_API_KEY'];
  if (!apiKey) {
    console.error('ERROR: FEC_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const raw      = await readFile(ENTITIES_PATH, 'utf8');
  const parsed   = JSON.parse(raw);
  const entities = Array.isArray(parsed) ? parsed : parsed.entities;

  // Collect only entities with a valid-format committee ID
  const targets = entities.filter((e) => COMMITTEE_ID_RE.test(e.fecCommitteeId ?? ''));
  console.log(`Loaded ${entities.length} entities. ${targets.length} have populated fecCommitteeIds to verify.\n`);

  // Batch processing
  const totalBatches = Math.ceil(targets.length / BATCH_SIZE);
  let totalClean = 0, totalFlagged = 0, totalDissolved = 0, totalInvalid = 0;
  const flaggedIds = [], dissolvedIds = [], invalidIds = [];

  for (let b = 0; b < totalBatches; b++) {
    const batch      = targets.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    let batchClean = 0, batchFlagged = 0, batchDissolved = 0;
    const batchFlaggedIds = [], batchDissolvedIds = [];

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Batch ${b + 1} of ${totalBatches} (${batch.length} entities)`);
    console.log('─'.repeat(50));

    for (const entity of batch) {
      const committeeId = entity.fecCommitteeId;
      const result      = await fetchCommittee(committeeId, apiKey);
      await delay(DELAY_MS);

      if (result.status === '404') {
        const msg = 'INVALID ID: 404 from FEC API';
        console.log(`  [404]     ${entity.id} (${committeeId}) — clearing`);
        entity.fecCommitteeId = '';
        appendNote(entity, msg);
        totalInvalid++;
        invalidIds.push(entity.id);
        continue;
      }

      if (result.status === 'error') {
        console.log(`  [ERROR]   ${entity.id} (${committeeId}) — ${result.message} — skipping`);
        continue;
      }

      // status === 'ok'
      const { name: fecName, terminated } = result;
      const score = bestMatchScore(fecName, entity.canonicalName, entity.aliases ?? []);

      if (score < MATCH_THRESHOLD) {
        const msg = `MISMATCH: FEC returned "${fecName}" — needs re-verification`;
        console.log(`  [MISMATCH] ${entity.id} (${committeeId}) score=${score.toFixed(2)} FEC="${fecName}"`);
        entity.fecCommitteeId = '';
        appendNote(entity, msg);
        batchFlagged++;
        totalFlagged++;
        batchFlaggedIds.push(entity.id);
        flaggedIds.push(entity.id);
      } else if (terminated) {
        const msg = 'PAC dissolved, historical data still accessible via FEC';
        // Only append if not already noted
        if (!entity.notes?.includes('PAC dissolved')) {
          appendNote(entity, msg);
        }
        console.log(`  [DISSOLVED] ${entity.id} (${committeeId}) score=${score.toFixed(2)} FEC="${fecName}"`);
        batchDissolved++;
        totalDissolved++;
        batchDissolvedIds.push(entity.id);
        dissolvedIds.push(entity.id);
      } else {
        console.log(`  [OK]      ${entity.id} (${committeeId}) score=${score.toFixed(2)} FEC="${fecName}"`);
        batchClean++;
        totalClean++;
      }
    }

    // Batch summary
    console.log(`\nBatch ${b + 1}: ${batch.length} checked / ${batchClean} clean / ${batchFlagged} flagged / ${batchDissolved} dissolved`);
    if (batchFlaggedIds.length)  console.log(`  Flagged:  ${batchFlaggedIds.join(', ')}`);
    if (batchDissolvedIds.length) console.log(`  Dissolved: ${batchDissolvedIds.join(', ')}`);
  }

  // Write updated file
  const output = Array.isArray(parsed) ? entities : { ...parsed, entities };
  await writeFile(ENTITIES_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  // Final summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log('AUDIT COMPLETE');
  console.log('═'.repeat(50));
  console.log(`Total checked:   ${targets.length}`);
  console.log(`Clean (no change): ${totalClean}`);
  console.log(`Dissolved (ID kept, note added): ${totalDissolved}`);
  console.log(`Mismatched (ID cleared): ${totalFlagged}`);
  console.log(`Invalid / 404 (ID cleared): ${totalInvalid}`);
  if (flaggedIds.length)  console.log(`\nMismatched IDs:  ${flaggedIds.join(', ')}`);
  if (dissolvedIds.length) console.log(`Dissolved IDs:   ${dissolvedIds.join(', ')}`);
  if (invalidIds.length)  console.log(`Invalid IDs:     ${invalidIds.join(', ')}`);
  console.log('\nentities.json updated. Commit manually when satisfied.');
}

main().catch((err) => { console.error(err); process.exit(1); });
