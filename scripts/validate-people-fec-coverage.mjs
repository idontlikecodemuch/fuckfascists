/**
 * People hydration coverage validation — bulk-local by default, FEC API
 * only when `--api` is passed. Primary target: Bezos canary. Success =
 * every committee the API surfaces for the post-cycle-floor window
 * appears in our raw[], including Blue Origin PAC (C00557793).
 *
 * Usage:
 *   node scripts/validate-people-fec-coverage.mjs [--person=jeff-bezos] [--api]
 *     [--api-key=KEY | $FEC_API_KEY, defaults to DEMO_KEY] [--cycle-floor=2016]
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const REPORTS_DIR = path.join(__dirname, '../tools/fec-bulk/reports');
const FEC_BASE = 'https://api.open.fec.gov/v1';
const DEFAULT_PERSON_ID = 'jeff-bezos';
const DEFAULT_CYCLE_FLOOR = 2016;
const BEZOS_BLUE_ORIGIN_COMMITTEE_ID = 'C00557793';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    personId: DEFAULT_PERSON_ID,
    api: false,
    apiKey: process.env.FEC_API_KEY || 'DEMO_KEY',
    cycleFloor: DEFAULT_CYCLE_FLOOR,
    queryName: null,
  };
  for (const arg of argv) {
    if (arg === '--api') args.api = true;
    else if (arg.startsWith('--person=')) args.personId = arg.slice('--person='.length).trim();
    else if (arg.startsWith('--api-key=')) args.apiKey = arg.slice('--api-key='.length).trim();
    else if (arg.startsWith('--query=')) args.queryName = arg.slice('--query='.length).trim();
    else if (arg.startsWith('--cycle-floor=')) {
      const v = Number.parseInt(arg.slice('--cycle-floor='.length), 10);
      if (Number.isFinite(v)) args.cycleFloor = v;
    }
  }
  return args;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function summarizeRaw(raw, cycleFloor) {
  const filtered = (raw ?? []).filter((row) => (Number(row?.cycle) || 0) >= cycleFloor);
  const committees = new Map();
  let totalAmount = 0;
  for (const row of filtered) {
    const id = String(row?.committeeId ?? '').trim().toUpperCase();
    if (!id) continue;
    if (!committees.has(id)) {
      committees.set(id, { committeeId: id, committeeName: row?.committeeName ?? null, cycles: new Set(), amount: 0 });
    }
    const entry = committees.get(id);
    entry.amount += Number(row?.amount) || 0;
    totalAmount += Number(row?.amount) || 0;
    if (row?.cycle) entry.cycles.add(Number(row.cycle));
  }
  return {
    rowCount: filtered.length,
    committeeCount: committees.size,
    totalAmount: round(totalAmount),
    committees: Array.from(committees.values()).map((entry) => ({
      committeeId: entry.committeeId,
      committeeName: entry.committeeName,
      amount: round(entry.amount),
      cycles: Array.from(entry.cycles).sort((a, b) => a - b),
    })),
  };
}

async function fetchScheduleA({ contributorName, apiKey }) {
  const params = new URLSearchParams({
    contributor_name: contributorName,
    per_page: '100',
    sort: '-contribution_receipt_date',
    api_key: apiKey,
  });
  const url = `${FEC_BASE}/schedules/schedule_a/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FEC API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  const results = json?.results ?? [];
  const truncated = Boolean(json?.pagination?.last_indexes);
  return { results, truncated, pagination: json?.pagination ?? null };
}

function summarizeApi(rows, cycleFloor) {
  const filtered = rows.filter((row) => (Number(row?.two_year_transaction_period) || 0) >= cycleFloor);
  const committees = new Map();
  let totalAmount = 0;
  for (const row of filtered) {
    const id = String(row?.committee_id ?? '').trim().toUpperCase();
    if (!id) continue;
    if (!committees.has(id)) {
      committees.set(id, {
        committeeId: id,
        committeeName: row?.committee?.name ?? null,
        cycles: new Set(),
        amount: 0,
      });
    }
    const entry = committees.get(id);
    entry.amount += Number(row?.contribution_receipt_amount) || 0;
    totalAmount += Number(row?.contribution_receipt_amount) || 0;
    const cycle = Number(row?.two_year_transaction_period);
    if (Number.isFinite(cycle)) entry.cycles.add(cycle);
  }
  return {
    rowCount: filtered.length,
    committeeCount: committees.size,
    totalAmount: round(totalAmount),
    committees: Array.from(committees.values()).map((entry) => ({
      committeeId: entry.committeeId,
      committeeName: entry.committeeName,
      amount: round(entry.amount),
      cycles: Array.from(entry.cycles).sort((a, b) => a - b),
    })),
  };
}

function diffCommittees(ourSummary, apiSummary) {
  const ourIds = new Set(ourSummary.committees.map((c) => c.committeeId));
  const apiIds = new Set(apiSummary.committees.map((c) => c.committeeId));
  const missingFromOurs = apiSummary.committees.filter((c) => !ourIds.has(c.committeeId));
  const extrasInOurs = ourSummary.committees.filter((c) => !apiIds.has(c.committeeId));
  const dollarDelta = ourSummary.totalAmount - apiSummary.totalAmount;
  const dollarDeltaPct = apiSummary.totalAmount > 0
    ? round((dollarDelta / apiSummary.totalAmount) * 100)
    : null;
  return { missingFromOurs, extrasInOurs, dollarDelta: round(dollarDelta), dollarDeltaPct };
}

function resolveQueryName(person, override) {
  if (override) return override;
  return person.canonicalName ?? person.fecSearchNames?.[0] ?? person.displayName ?? null;
}

function findPerson(peopleRaw, personId) {
  const people = Array.isArray(peopleRaw.people) ? peopleRaw.people : Array.isArray(peopleRaw) ? peopleRaw : [];
  return people.find((p) => p.id === personId) ?? null;
}

function printSummary(label, summary) {
  console.log(`${label}:`);
  console.log(`  rows: ${summary.rowCount}`);
  console.log(`  committees: ${summary.committeeCount}`);
  console.log(`  total: $${summary.totalAmount.toLocaleString()}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const peopleRaw = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const person = findPerson(peopleRaw, args.personId);
  if (!person) throw new Error(`Person not found in people.json: ${args.personId}`);

  const ourSummary = summarizeRaw(person.donationSummary?.raw, args.cycleFloor);
  const queryName = resolveQueryName(person, args.queryName);

  console.log(`Validation target: ${args.personId} (${person.displayName ?? person.canonicalName})`);
  console.log(`Query name: ${queryName ?? '(none)'}`);
  console.log(`Cycle floor: ${args.cycleFloor}`);
  console.log('');
  printSummary('Our coverage (bulk-hydrated)', ourSummary);

  if (args.personId === DEFAULT_PERSON_ID) {
    const hasBlueOrigin = ourSummary.committees.some((c) => c.committeeId === BEZOS_BLUE_ORIGIN_COMMITTEE_ID);
    console.log(`  Blue Origin PAC (${BEZOS_BLUE_ORIGIN_COMMITTEE_ID}): ${hasBlueOrigin ? 'PRESENT ✓' : 'MISSING ✗'}`);
  }

  if (!args.api) {
    console.log('');
    console.log('Bulk-local only. Pass --api to compare against FEC Schedule A.');
    return;
  }
  if (!queryName) throw new Error(`No search name available for ${args.personId}`);

  console.log('');
  console.log(`Hitting FEC /schedules/schedule_a (contributor_name="${queryName}")...`);
  const { results, truncated, pagination } = await fetchScheduleA({ contributorName: queryName, apiKey: args.apiKey });
  const apiSummary = summarizeApi(results, args.cycleFloor);
  console.log('');
  printSummary('FEC API coverage (post-cycle-floor)', apiSummary);
  if (truncated) {
    console.log(`  ⚠ API returned more than ${results.length} rows (pagination.count=${pagination?.count}); only first page compared.`);
  }

  const diff = diffCommittees(ourSummary, apiSummary);
  console.log('');
  console.log('Diff (API − Ours):');
  console.log(`  dollar delta: $${diff.dollarDelta.toLocaleString()} (${diff.dollarDeltaPct}%)`);
  console.log(`  committees missing from ours: ${diff.missingFromOurs.length}`);
  for (const c of diff.missingFromOurs) {
    console.log(`    ${c.committeeId}  ${c.committeeName ?? ''}  $${c.amount.toLocaleString()}  cycles ${c.cycles.join(',')}`);
  }
  console.log(`  committees in ours not seen in API first page: ${diff.extrasInOurs.length}`);
  for (const c of diff.extrasInOurs) {
    console.log(`    ${c.committeeId}  ${c.committeeName ?? ''}  $${c.amount.toLocaleString()}  cycles ${c.cycles.join(',')}`);
  }

  const pass = diff.missingFromOurs.length === 0;
  console.log('');
  console.log(pass ? 'PASS — every API committee present in our hydration.' : 'FAIL — committees missing above.');

  await mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `people-fec-validation-${args.personId}-${today()}.json`);
  const report = {
    generatedAt: today(),
    personId: args.personId,
    queryName,
    cycleFloor: args.cycleFloor,
    apiTruncated: truncated,
    apiPagination: pagination,
    ourSummary,
    apiSummary,
    diff,
    pass,
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

  if (!pass) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
