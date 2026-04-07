import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import readline from 'node:readline';
import path from 'node:path';

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeCommitteeId(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  return /^C\d{8}$/.test(normalized) ? normalized : '';
}

export function classifyMajorPartyBucket(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  if (normalized === 'REP') return 'R';
  if (normalized === 'DEM' || normalized === 'DFL') return 'D';
  return 'O';
}

export function normalizeMajorParty(value) {
  const bucket = classifyMajorPartyBucket(value);
  return bucket === 'O' ? null : bucket;
}

export function parseAmount(value) {
  const parsed = Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundCurrency(value) {
  return Number.parseFloat(Number(value || 0).toFixed(2));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatPct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

export function dateToCycle(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return null;
  const year = Number.parseInt(raw.slice(4, 8), 10);
  if (!Number.isFinite(year) || year < 2000) return null;
  return year % 2 === 0 ? year : year + 1;
}

export function committeeCycleKey(committeeId, cycle) {
  return `${committeeId}:${cycle}`;
}

export async function listMatchingEntries(root, pattern, type = 'file') {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => (type === 'dir' ? entry.isDirectory() : entry.isFile()) && pattern.test(entry.name))
    .map((entry) => path.join(root, entry.name))
    .sort();
}

export async function readLines(filePath, onLine) {
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line) continue;
    await onLine(line);
  }
}
