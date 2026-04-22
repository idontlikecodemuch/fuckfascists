/**
 * Discovered-committees review queue — committees surfaced in people.json
 * raw[] that aren't yet covered by any live entity. Manual-review feeder;
 * never auto-creates entities.
 *
 * Classification by local cm*.txt metadata:
 *   entity_candidate                  CMTE_TP ∈ {Q,N} + usable CONNECTED_ORG_NM
 *   leadership_pac_classify_only      CMTE_DSGN=D (run by a politician)
 *   classify_only                     H/S/P candidate committees, O/V/W super PACs,
 *                                     X/Y/Z party, Q/N without CONNECTED_ORG_NM
 *   unknown_committee                 not in local cm*.txt (missing cycle?)
 *
 * Usage: node scripts/build-people-discovered-committees.mjs [--limit=N] [--min-amount=N]
 */

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const BULK_ROOT = path.join(__dirname, '../tools/fec-bulk');
const REPORTS_DIR = path.join(BULK_ROOT, 'reports');
const COMMITTEE_MASTER_PATTERN = /^cm(?: \d+)?\.txt$/i;
const MAX_DONOR_IDS_PER_COMMITTEE = 25;

const CM_FIELD = {
  committeeId: 0,
  name: 1,
  designation: 8,
  committeeType: 9,
  party: 10,
  connectedOrganizationName: 13,
};

// H/S/P candidate, O/V/W super PAC/hybrid, X/Y/Z party, I/U/E edges.
const NON_ENTITY_COMMITTEE_TYPES = new Set(['H', 'S', 'P', 'O', 'V', 'W', 'X', 'Y', 'Z', 'I', 'U', 'E']);
const NOISE_CONNECTED_ORG = new Set(['', 'N/A', 'NA', 'NONE', 'NOT APPLICABLE', 'SELF', 'SELF EMPLOYED']);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeCommitteeId(value) {
  return normalizeWhitespace(value).toUpperCase();
}

function parseArgs(argv) {
  const args = { limit: 200, minAmount: 0 };
  for (const arg of argv) {
    if (arg.startsWith('--limit=')) {
      const v = Number.parseInt(arg.slice('--limit='.length), 10);
      if (Number.isFinite(v) && v > 0) args.limit = v;
    } else if (arg.startsWith('--min-amount=')) {
      const v = Number.parseFloat(arg.slice('--min-amount='.length));
      if (Number.isFinite(v) && v >= 0) args.minAmount = v;
    }
  }
  return args;
}

async function loadCommitteeMeta() {
  const entries = await readdir(BULK_ROOT, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!COMMITTEE_MASTER_PATTERN.test(entry.name)) continue;
    const full = path.join(BULK_ROOT, entry.name);
    let ok = entry.isFile();
    if (!ok && entry.isSymbolicLink()) {
      try { ok = (await stat(full)).isFile(); } catch { ok = false; }
    }
    if (ok) files.push(full);
  }
  files.sort();

  const meta = new Map();
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!line) continue;
      const fields = line.split('|');
      const id = normalizeCommitteeId(fields[CM_FIELD.committeeId]);
      if (!id) continue;
      meta.set(id, {
        committeeId: id,
        committeeName: normalizeWhitespace(fields[CM_FIELD.name]) || id,
        committeeDesignation: normalizeWhitespace(fields[CM_FIELD.designation]) || null,
        committeeType: normalizeWhitespace(fields[CM_FIELD.committeeType]) || null,
        committeeParty: normalizeWhitespace(fields[CM_FIELD.party]).toUpperCase() || null,
        connectedOrganizationName: normalizeWhitespace(fields[CM_FIELD.connectedOrganizationName]) || null,
      });
    }
  }
  return meta;
}

function collectEntityCommitteeCoverage(entities) {
  const covered = new Set();
  for (const entity of entities) {
    const id = typeof entity.fecCommitteeId === 'string' ? normalizeCommitteeId(entity.fecCommitteeId) : '';
    if (id) covered.add(id);
    for (const record of entity.fecCommitteeRecords ?? []) {
      const recordId = normalizeCommitteeId(record?.id);
      if (recordId) covered.add(recordId);
    }
  }
  return covered;
}

function classifyDiscoveredCommittee(meta) {
  if (!meta) {
    return { classification: 'unknown_committee', reason: 'committee not present in local cm*.txt' };
  }
  const tp = (meta.committeeType ?? '').toUpperCase();
  const dsgn = (meta.committeeDesignation ?? '').toUpperCase();
  const conn = meta.connectedOrganizationName ?? '';
  const connNormalized = conn.toUpperCase();

  if (dsgn === 'D') {
    return { classification: 'leadership_pac_classify_only', reason: 'CMTE_DSGN=D (leadership PAC)' };
  }
  if (NON_ENTITY_COMMITTEE_TYPES.has(tp)) {
    return { classification: 'classify_only', reason: `CMTE_TP=${tp}` };
  }
  if ((tp === 'Q' || tp === 'N') && conn && !NOISE_CONNECTED_ORG.has(connNormalized)) {
    return { classification: 'entity_candidate', reason: `CMTE_TP=${tp} + CONNECTED_ORG_NM=${conn}` };
  }
  if (tp === 'Q' || tp === 'N') {
    return { classification: 'classify_only', reason: `CMTE_TP=${tp} + no usable CONNECTED_ORG_NM` };
  }
  return { classification: 'classify_only', reason: `CMTE_TP=${tp || 'unknown'}` };
}

function aggregateByCommittee(people, coveredCommittees) {
  const byCommittee = new Map();
  for (const person of people) {
    const raw = person?.donationSummary?.raw;
    if (!Array.isArray(raw)) continue;
    for (const row of raw) {
      const committeeId = normalizeCommitteeId(row?.committeeId);
      if (!committeeId) continue;
      if (coveredCommittees.has(committeeId)) continue;
      let entry = byCommittee.get(committeeId);
      if (!entry) {
        entry = {
          committeeId,
          totalAmount: 0,
          cycles: new Set(),
          donorPersonIds: new Set(),
        };
        byCommittee.set(committeeId, entry);
      }
      entry.totalAmount += Number(row?.amount) || 0;
      if (row?.cycle) entry.cycles.add(Number(row.cycle));
      entry.donorPersonIds.add(person.id);
    }
  }
  return byCommittee;
}

function finalize(byCommittee, committeeMeta, { limit, minAmount }) {
  const enriched = Array.from(byCommittee.values())
    .map((entry) => {
      const meta = committeeMeta.get(entry.committeeId);
      const { classification, reason } = classifyDiscoveredCommittee(meta);
      const donorIds = Array.from(entry.donorPersonIds).sort();
      return {
        committeeId: entry.committeeId,
        committeeName: meta?.committeeName ?? null,
        committeeType: meta?.committeeType ?? null,
        committeeDesignation: meta?.committeeDesignation ?? null,
        connectedOrganizationName: meta?.connectedOrganizationName ?? null,
        committeeParty: meta?.committeeParty ?? null,
        totalAmount: Math.round(entry.totalAmount * 100) / 100,
        cycles: Array.from(entry.cycles).sort((a, b) => a - b),
        donorCount: donorIds.length,
        donorPersonIds: donorIds.slice(0, MAX_DONOR_IDS_PER_COMMITTEE),
        classification,
        reason,
      };
    })
    .filter((entry) => entry.totalAmount >= minAmount);

  enriched.sort((a, b) => {
    const rankA = a.classification === 'entity_candidate' ? 0 : 1;
    const rankB = b.classification === 'entity_candidate' ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    return b.totalAmount - a.totalAmount;
  });

  const counts = enriched.reduce((acc, entry) => {
    acc[entry.classification] = (acc[entry.classification] ?? 0) + 1;
    return acc;
  }, {});

  return {
    queue: enriched.slice(0, limit),
    counts,
    totalDiscovered: enriched.length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [peopleRaw, entitiesRaw, committeeMeta] = await Promise.all([
    readFile(PEOPLE_PATH, 'utf8').then(JSON.parse),
    readFile(ENTITIES_PATH, 'utf8').then(JSON.parse),
    loadCommitteeMeta(),
  ]);
  const people = Array.isArray(peopleRaw.people) ? peopleRaw.people : Array.isArray(peopleRaw) ? peopleRaw : [];
  const entities = Array.isArray(entitiesRaw.entities) ? entitiesRaw.entities : Array.isArray(entitiesRaw) ? entitiesRaw : [];

  const coveredCommittees = collectEntityCommitteeCoverage(entities);
  const byCommittee = aggregateByCommittee(people, coveredCommittees);
  const { queue, counts, totalDiscovered } = finalize(byCommittee, committeeMeta, args);

  const output = {
    _meta: {
      generatedAt: today(),
      description:
        'Committees surfaced from people.json raw[] that are not already covered by any live entity. Heuristic classification only; entity creation goes through manual review + overrides.',
      methodology:
        'Per-committee aggregation over all people; classification via CMTE_TP + CMTE_DSGN + CONNECTED_ORG_NM from local cm*.txt; sorted entity_candidate first then by dollars desc.',
      sourcePeopleFile: path.relative(process.cwd(), PEOPLE_PATH),
      sourceEntitiesFile: path.relative(process.cwd(), ENTITIES_PATH),
      totalDiscoveredCommittees: totalDiscovered,
      classificationCounts: counts,
      queueLimit: args.limit,
      minAmountFilter: args.minAmount,
      maxDonorIdsPerCommittee: MAX_DONOR_IDS_PER_COMMITTEE,
    },
    queue,
  };

  const outPath = path.join(REPORTS_DIR, `people-discovered-committees-${today()}.json`);
  await writeFile(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${outPath}`);
  console.log(`Total discovered: ${totalDiscovered}`);
  for (const [cls, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cls}: ${count}`);
  }
  console.log(`Report includes top ${Math.min(args.limit, totalDiscovered)} entries.`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
