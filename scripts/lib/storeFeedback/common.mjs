import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function parseArgs(argv) {
  const args = { _: [] };
  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      args._.push(arg);
      continue;
    }
    const raw = arg.slice(2);
    if (raw.startsWith('no-')) {
      args[raw.slice(3)] = false;
      continue;
    }
    const eq = raw.indexOf('=');
    if (eq === -1) {
      args[raw] = true;
      continue;
    }
    args[raw.slice(0, eq)] = raw.slice(eq + 1);
  }
  return args;
}

export function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

export async function writeJson(file, data) {
  await ensureDir(path.dirname(file));
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

export async function writeJsonl(file, rows) {
  await ensureDir(path.dirname(file));
  await writeFile(file, rows.map((row) => JSON.stringify(row)).join('\n') + '\n');
}

export function redactEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'redacted';
  const prefix = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${prefix}...@${domain}`;
}

export function truncate(text, max = 180) {
  if (!text) return '';
  const compact = String(text).replace(/\s+/g, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

export function includedMap(included = []) {
  const map = new Map();
  for (const item of included) map.set(`${item.type}:${item.id}`, item);
  return map;
}

export function related(included, relationship) {
  const ref = relationship?.data;
  if (!ref || Array.isArray(ref)) return null;
  return included.get(`${ref.type}:${ref.id}`) ?? null;
}

export function filterSince(records, since) {
  if (!since) return records;
  const cutoff = new Date(since).getTime();
  if (Number.isNaN(cutoff)) throw new Error(`Invalid --since value: ${since}`);
  return records.filter((record) => {
    if (!record.createdAt) return true;
    return new Date(record.createdAt).getTime() >= cutoff;
  });
}

export function recordsToMarkdown(records, meta = {}) {
  const lines = [
    '# Store Feedback Import',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Records: ${records.length}`,
  ];
  if (meta.skipped?.length) {
    lines.push('', 'Skipped providers:', ...meta.skipped.map((s) => `- ${s}`));
  }
  lines.push('');

  for (const record of records) {
    const label = [record.source, record.kind].filter(Boolean).join(' / ');
    const build = record.appVersion || record.buildVersion || record.buildNumber || 'unknown build';
    const device = [record.device?.model, record.device?.osVersion].filter(Boolean).join(' ');
    const rating = record.rating ? ` ${record.rating}★` : '';
    lines.push(`## ${record.createdAt || 'unknown date'} — ${label}${rating}`);
    lines.push(`- ID: ${record.id}`);
    lines.push(`- Build: ${build}`);
    if (device) lines.push(`- Device: ${device}`);
    if (record.tester?.email) lines.push(`- Tester: ${record.tester.email}`);
    if (record.comment) lines.push(`- Comment: ${truncate(record.comment, 500)}`);
    if (record.attachments?.length) {
      lines.push(`- Attachments: ${record.attachments.map((a) => a.path || a.url || a.kind).join(', ')}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
