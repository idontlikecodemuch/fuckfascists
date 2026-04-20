/**
 * line29Classifier.mjs — multi-tier party classifier for unattributed Schedule B records
 *
 * Classifies Line 29 (state/local) disbursements and other records that currently
 * fall to raw[] in fetch-donation-data.mjs. Uses four classification tiers:
 *
 *   Tier 1: Beneficiary classification report (spending evidence, 80% threshold)
 *   Tier 2: Committee master formal party (cm.txt)
 *   Tier 3: Hand-curated committee overrides
 *   Tier 4: OpenStates legislator name fuzzy match (Jaro-Winkler >= 0.90)
 *
 * Unclassified records fall through to raw[] as before — no data is lost.
 *
 * Usage:
 *   const classifier = await loadLine29Classifier();
 *   const result = classifier.classify(recipientCommitteeId, recipientName, recipientState, cycle);
 *   // result: { party: 'REP'|'DEM'|null, method: 'beneficiary_report'|'cm_formal_party'|... }
 */

import { createReadStream } from 'node:fs';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import {
  committeeCycleKey,
  normalizeCommitteeId,
  normalizeMajorParty,
  normalizeWhitespace,
} from './data-classification/common.mjs';
import { findLatestReport } from './data-classification/report-files.mjs';
import { loadCommitteeMasterMetadata } from './inherentlyPartisanSources.mjs';
import { COMMITTEE_PARTY_OVERRIDES } from './committeePartyOverrides.mjs';
import { jaroWinkler } from './jaroWinkler.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BULK_ROOT = path.join(__dirname, '../../tools/fec-bulk');
const REPORTS_DIR = path.join(BULK_ROOT, 'reports');
const OPENSTATES_PATH = path.join(__dirname, '../../data/openstates/all-legislators.csv');

const BENEFICIARY_REPORT_PREFIX = 'committee-beneficiary-classification-';
const OPENSTATES_JW_THRESHOLD = 0.90;

// ── OpenStates CSV parser ────────────────────────────────────────────────────

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

/**
 * Parses all-legislators.csv into a Map<state, Array<{name, party}>>.
 * Returns an empty Map if the file is missing (graceful degradation).
 */
async function loadOpenStatesLegislators() {
  if (!(await fileExists(OPENSTATES_PATH))) {
    console.warn('  ⚠ OpenStates data not found — Tier 4 (name fuzzy match) disabled');
    console.warn(`    Run: node scripts/download-openstates.mjs`);
    return new Map();
  }

  const byState = new Map();
  const rl = readline.createInterface({
    input: createReadStream(OPENSTATES_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let headerSkipped = false;
  for await (const line of rl) {
    if (!headerSkipped) { headerSkipped = true; continue; }
    if (!line.trim()) continue;

    // CSV format: state,name,current_party,current_chamber,given_name,family_name
    const fields = parseCsvLine(line);
    const state = normalizeWhitespace(fields[0]).toUpperCase();
    const name = normalizeWhitespace(fields[1]).toUpperCase();
    const rawParty = normalizeWhitespace(fields[2]).toUpperCase();

    if (!state || !name) continue;

    const party = rawParty === 'REPUBLICAN' ? 'REP' : rawParty === 'DEMOCRATIC' ? 'DEM' : null;
    if (!party) continue;

    if (!byState.has(state)) byState.set(state, []);
    byState.get(state).push({ name, party });
  }

  return byState;
}

// ── Beneficiary report loader ────────────────────────────────────────────────

async function loadBeneficiaryMap() {
  let reportPath;
  try {
    reportPath = await findLatestReport(REPORTS_DIR, BENEFICIARY_REPORT_PREFIX);
  } catch {
    console.warn('  ⚠ Beneficiary classification report not found — Tier 1 disabled');
    return new Map();
  }

  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  const map = new Map();
  for (const record of (report.committeeCycles ?? [])) {
    map.set(committeeCycleKey(record.committeeId, record.cycle), record);
  }

  console.log(`  Beneficiary report: ${path.basename(reportPath)} (${map.size} committee-cycle entries)`);
  return map;
}

async function loadCommitteeMasterMetadataSafely() {
  try {
    return await loadCommitteeMasterMetadata();
  } catch (err) {
    console.warn(`  ⚠ Committee master load failed: ${err.message} — Tier 2 disabled`);
    return { committeeParties: new Map() };
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Loads all classification data and returns a classifier object.
 *
 * The classifier degrades gracefully: missing data files disable individual
 * tiers but don't prevent the script from running. If ALL data is missing,
 * the classifier effectively becomes a no-op (everything stays in raw[]).
 */
export async function loadLine29Classifier() {
  console.log('Loading Line 29 classifier...');

  const [beneficiaryMap, committeeMeta, legislatorsByState] = await Promise.all([
    loadBeneficiaryMap(),
    loadCommitteeMasterMetadataSafely(),
    loadOpenStatesLegislators(),
  ]);

  const { committeeParties } = committeeMeta;

  const stats = {
    classifiedR: 0,
    classifiedD: 0,
    unclassified: 0,
    byMethod: new Map(),
  };

  function trackMethod(method) {
    stats.byMethod.set(method, (stats.byMethod.get(method) ?? 0) + 1);
  }

  /**
   * Attempts to classify a recipient as REP or DEM.
   * Returns { party: 'REP'|'DEM'|null, method: string }.
   */
  function classify(recipientCommitteeId, recipientName, recipientState, cycle) {
    const normalizedId = normalizeCommitteeId(recipientCommitteeId);

    // Tier 1: Beneficiary classification report (highest confidence)
    if (normalizedId && cycle) {
      const record = beneficiaryMap.get(committeeCycleKey(normalizedId, cycle));
      if (record?.resolvedParty === 'R') {
        stats.classifiedR++;
        trackMethod('beneficiary_report');
        return { party: 'REP', method: 'beneficiary_report' };
      }
      if (record?.resolvedParty === 'D') {
        stats.classifiedD++;
        trackMethod('beneficiary_report');
        return { party: 'DEM', method: 'beneficiary_report' };
      }
    }

    // Tier 2: Committee master formal party (cm.txt)
    if (normalizedId) {
      const cmParty = committeeParties.get(normalizedId);
      if (cmParty === 'R') {
        stats.classifiedR++;
        trackMethod('cm_formal_party');
        return { party: 'REP', method: 'cm_formal_party' };
      }
      if (cmParty === 'D') {
        stats.classifiedD++;
        trackMethod('cm_formal_party');
        return { party: 'DEM', method: 'cm_formal_party' };
      }
    }

    // Tier 3: Hand-curated committee overrides
    if (normalizedId) {
      const overrideParty = COMMITTEE_PARTY_OVERRIDES[normalizedId];
      if (overrideParty === 'REP' || overrideParty === 'DEM') {
        if (overrideParty === 'REP') stats.classifiedR++;
        else stats.classifiedD++;
        trackMethod('committee_override');
        return { party: overrideParty, method: 'committee_override' };
      }
    }

    // Tier 4: OpenStates legislator fuzzy match by name + state
    const normalizedName = normalizeWhitespace(recipientName).toUpperCase();
    const normalizedState = normalizeWhitespace(recipientState).toUpperCase();

    if (normalizedName && normalizedState && legislatorsByState.has(normalizedState)) {
      const candidates = legislatorsByState.get(normalizedState);
      let bestScore = 0;
      let bestParty = null;

      for (const candidate of candidates) {
        const score = jaroWinkler(normalizedName, candidate.name);
        if (score > bestScore) {
          bestScore = score;
          bestParty = candidate.party;
        }
      }

      if (bestScore >= OPENSTATES_JW_THRESHOLD && bestParty) {
        if (bestParty === 'REP') stats.classifiedR++;
        else stats.classifiedD++;
        trackMethod('openstates_fuzzy');
        return { party: bestParty, method: 'openstates_fuzzy' };
      }
    }

    // Unclassified — falls through to raw[]
    stats.unclassified++;
    return { party: null, method: 'unclassified' };
  }

  const committeeCount = committeeParties.size;
  const legislatorCount = Array.from(legislatorsByState.values()).reduce((sum, arr) => sum + arr.length, 0);
  const beneficiaryCount = beneficiaryMap.size;

  console.log(`  Committee master: ${committeeCount} committees`);
  console.log(`  OpenStates: ${legislatorCount} legislators across ${legislatorsByState.size} states`);
  console.log('');

  return {
    classify,
    stats,
    committeeCount,
    legislatorCount,
    beneficiaryCount,
  };
}
