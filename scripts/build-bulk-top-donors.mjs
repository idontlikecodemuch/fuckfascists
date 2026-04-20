import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const BULK_ROOT = path.join(__dirname, '../tools/fec-bulk');
const DEFAULT_OUTPUT = path.join(BULK_ROOT, 'reports/top-donors-bulk-1000.json');
const DEFAULT_CYCLES = [2016, 2018, 2020, 2022, 2024, 2026];
const DEFAULT_TOP = 1000;
const DEFAULT_CONCURRENCY = 2;

const EXTRACT_AWK = String.raw`
function trim(value) {
  sub(/^[[:space:]]+/, "", value);
  sub(/[[:space:]]+$/, "", value);
  return value;
}

function normalize_space(value) {
  gsub(/[[:space:]]+/, " ", value);
  return trim(value);
}

function clean_token(value) {
  value = toupper(normalize_space(value));
  gsub(/[.'"'"'\"]/, "", value);
  gsub(/[[:space:]]+/, " ", value);
  return trim(value);
}

function is_org_like(name) {
  name = clean_token(name);
  return name ~ /(ACTION|ADVOCACY|ASSOCIATION|COMMITTEE|CORP|CORPORATION|COUNCIL|FEDERATION|FUND|FOUNDATION|INC|INTERNATIONAL|LLC|PAC|PARTNERSHIP|REALTORS|UNION)/;
}

function strip_suffixes(tokens, count) {
  while (count > 0 && (tokens[count] == "JR" || tokens[count] == "SR" || tokens[count] == "II" || tokens[count] == "III" || tokens[count] == "IV" || tokens[count] == "V")) {
    count--;
  }
  return count;
}

function donor_key(name, parts, rest, tokens, count, last, first) {
  name = clean_token(name);
  split(name, parts, ",");
  last = trim(parts[1]);
  rest = trim(parts[2]);
  count = split(rest, tokens, /[[:space:]]+/);
  count = strip_suffixes(tokens, count);
  first = count > 0 ? tokens[1] : "";
  return last "|" first;
}

function detect_cycle(file_path, raw) {
  raw = file_path;
  sub(/^.*indiv/, "", raw);
  raw = substr(raw, 1, 2);
  return 2000 + raw + 0;
}

$7 == "IND" && $19 != "X" && index($8, ",") > 0 && ($15 + 0) > 0 && !is_org_like($8) {
  key = donor_key($8);
  if (key == "|") next;

  amount = $15 + 0;
  name = normalize_space($8);
  state = normalize_space($10);
  employer = normalize_space($12);
  occupation = normalize_space($13);
  cycle = detect_cycle(FILENAME);

  printf "%s\t%.2f\t%s\t%s\t%s\t%s\t%d\n", key, amount, name, state, employer, occupation, cycle;
}
`;

const AGGREGATE_AWK = String.raw`
BEGIN {
  FS = "\t";
  OFS = "\t";
  current_key = "";
  donor_count = 0;
}

function reset_state() {
  total_amount = 0;
  delete name_totals;
  delete state_totals;
  delete employer_totals;
  delete occupation_totals;
  delete cycle_totals;
}

function best_key(map, key, best, best_value) {
  best = "";
  best_value = -1;
  for (key in map) {
    if (map[key] > best_value) {
      best = key;
      best_value = map[key];
    }
  }
  return best;
}

function cycle_totals_string(out, cycle) {
  out = "";
  for (cycle = 2016; cycle <= 2026; cycle += 2) {
    if ((cycle in cycle_totals) && cycle_totals[cycle] > 0) {
      if (out != "") out = out ";";
      out = out cycle "=" sprintf("%.2f", cycle_totals[cycle]);
    }
  }
  return out;
}

function flush_current() {
  if (current_key == "") return;

  donor_count++;
  printf "%s\t%.2f\t%s\t%s\t%s\t%s\t%s\n",
    current_key,
    total_amount,
    best_key(name_totals),
    best_key(state_totals),
    best_key(employer_totals),
    best_key(occupation_totals),
    cycle_totals_string();
}

{
  key = $1;
  amount = $2 + 0;
  name = $3;
  state = $4;
  employer = $5;
  occupation = $6;
  cycle = $7 + 0;

  if (current_key != key) {
    flush_current();
    reset_state();
    current_key = key;
  }

  total_amount += amount;
  name_totals[name] += amount;
  if (state != "") state_totals[state] += amount;
  if (employer != "") employer_totals[employer] += amount;
  if (occupation != "") occupation_totals[occupation] += amount;
  cycle_totals[cycle] += amount;
}

END {
  flush_current();
}
`;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function cleanNameToken(value) {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/[.'"]/g, '')
    .replace(/\s+/g, ' ');
}

function stripSuffix(tokens) {
  const suffixes = new Set(['JR', 'SR', 'II', 'III', 'IV', 'V']);
  while (tokens.length > 0 && suffixes.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens;
}

function parseFecName(name) {
  const cleaned = cleanNameToken(name);
  if (!cleaned) return { first: '', last: '', full: '' };

  if (cleaned.includes(',')) {
    const [rawLast, rawRest = ''] = cleaned.split(',', 2);
    const restTokens = stripSuffix(rawRest.split(' ').filter(Boolean));
    return {
      first: restTokens[0] ?? '',
      last: rawLast.trim(),
      full: cleaned,
    };
  }

  const tokens = stripSuffix(cleaned.split(' ').filter(Boolean));
  if (tokens.length === 0) return { first: '', last: '', full: cleaned };
  if (tokens.length === 1) return { first: tokens[0], last: '', full: cleaned };
  return {
    first: tokens[0],
    last: tokens[tokens.length - 1],
    full: cleaned,
  };
}

function normalizeDonorKey(name) {
  const parsed = parseFecName(name);
  return [parsed.last, parsed.first].join('|');
}

function toTitleCase(token) {
  return token
    .toLowerCase()
    .split(/([\s-])/)
    .map((part) => (/^[\s-]$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

function toDisplayName(fecName) {
  const parsed = parseFecName(fecName);
  const pieces = [];
  if (parsed.first) pieces.push(toTitleCase(parsed.first));

  const full = cleanNameToken(fecName);
  if (full.includes(',')) {
    const [, rest = ''] = full.split(',', 2);
    const restTokens = stripSuffix(rest.split(' ').filter(Boolean));
    if (restTokens.length > 1) {
      pieces.push(...restTokens.slice(1).map(toTitleCase));
    }
  }

  if (parsed.last) pieces.push(toTitleCase(parsed.last));
  return pieces.join(' ').trim() || toTitleCase(fecName);
}

function parseArgs(argv) {
  const args = {
    cycles: DEFAULT_CYCLES,
    top: DEFAULT_TOP,
    output: DEFAULT_OUTPUT,
    concurrency: DEFAULT_CONCURRENCY,
  };

  for (const arg of argv) {
    if (arg.startsWith('--cycles=')) {
      const cycles = arg
        .slice('--cycles='.length)
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value >= 2000);
      if (cycles.length > 0) args.cycles = Array.from(new Set(cycles));
    } else if (arg.startsWith('--top=')) {
      const value = Number.parseInt(arg.slice('--top='.length), 10);
      if (Number.isFinite(value) && value > 0) args.top = value;
    } else if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) args.output = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--concurrency=')) {
      const value = Number.parseInt(arg.slice('--concurrency='.length), 10);
      if (Number.isFinite(value) && value > 0) args.concurrency = value;
    }
  }

  return args;
}

async function listFilesForCycle(cycle) {
  const suffix = String(cycle).slice(2);
  const byDateDir = path.join(BULK_ROOT, `indiv${suffix}`, 'by_date');
  const entries = await readdir(byDateDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.txt') && !entry.name.includes('invalid_dates'))
    .map((entry) => path.join(byDateDir, entry.name))
    .sort();
}

function parseCycleTotals(raw) {
  const cycleTotals = {};
  for (const part of normalizeWhitespace(raw).split(';').filter(Boolean)) {
    const [cycleText, amountText] = part.split('=');
    const cycle = Number.parseInt(cycleText, 10);
    const amount = Number.parseFloat(amountText);
    if (Number.isFinite(cycle) && Number.isFinite(amount)) {
      cycleTotals[String(cycle)] = amount;
    }
  }
  return cycleTotals;
}

function apiTotalForCycles(person, cycles) {
  const cycleSet = new Set(cycles);
  if (!Array.isArray(person.donationSummary?.raw)) return null;
  return person.donationSummary.raw
    .filter((entry) => cycleSet.has(entry.cycle))
    .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
}

function buildPeopleLookup(people) {
  const keyToIds = new Map();
  const peopleById = new Map();

  for (const person of people) {
    peopleById.set(person.id, person);
    const names = new Set([person.canonicalName, ...(person.fecSearchNames ?? [])].map(normalizeWhitespace).filter(Boolean));
    for (const name of names) {
      const key = normalizeDonorKey(name);
      if (!key) continue;
      const ids = keyToIds.get(key) ?? new Set();
      ids.add(person.id);
      keyToIds.set(key, ids);
    }
  }

  return { keyToIds, peopleById };
}

class MinHeap {
  #items = [];

  constructor(compare) {
    this.compare = compare;
  }

  get size() {
    return this.#items.length;
  }

  toArray() {
    return [...this.#items];
  }

  peek() {
    return this.#items[0] ?? null;
  }

  push(item) {
    this.#items.push(item);
    this.#bubbleUp(this.#items.length - 1);
  }

  replaceTop(item) {
    if (this.#items.length === 0) {
      this.#items[0] = item;
      return;
    }
    this.#items[0] = item;
    this.#bubbleDown(0);
  }

  #bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.#items[index], this.#items[parent]) >= 0) break;
      [this.#items[index], this.#items[parent]] = [this.#items[parent], this.#items[index]];
      index = parent;
    }
  }

  #bubbleDown(index) {
    const length = this.#items.length;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;

      if (left < length && this.compare(this.#items[left], this.#items[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.#items[right], this.#items[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.#items[index], this.#items[smallest]] = [this.#items[smallest], this.#items[index]];
      index = smallest;
    }
  }
}

function waitForProcess(child, label) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function topCounterKey(counter) {
  let bestKey = '';
  let bestValue = -1;
  for (const [key, value] of counter.entries()) {
    if (value > bestValue) {
      bestKey = key;
      bestValue = value;
    }
  }
  return bestKey;
}

function bumpCounter(counter, key, amount) {
  if (!key) return;
  counter.set(key, (counter.get(key) ?? 0) + amount);
}

async function buildPartialFile({
  file,
  index,
  totalFiles,
  tempDir,
  extractScriptPath,
  aggregateScriptPath,
}) {
  const partialPath = path.join(tempDir, `partial-${String(index + 1).padStart(3, '0')}.tsv`);
  const filePipeline = [
    `awk -F '|' -f ${shellQuote(extractScriptPath)} ${shellQuote(file)}`,
    `sort -T ${shellQuote(tempDir)}`,
    `awk -F '\\t' -f ${shellQuote(aggregateScriptPath)} > ${shellQuote(partialPath)}`,
  ];
  const fileCommand = `set -euo pipefail; ${filePipeline.join(' | ')}`;
  const pipeline = spawn('bash', ['-lc', fileCommand], {
    env: { ...process.env, LC_ALL: 'C' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await waitForProcess(pipeline, `bulk donor file pipeline (${path.basename(file)})`);
  const partialStats = await stat(partialPath);
  if (partialStats.size === 0) return null;

  if (index === 0 || index === totalFiles - 1 || (index + 1) % 10 === 0) {
    console.log(`[${index + 1}/${totalFiles}] ${path.basename(file)} -> ${partialStats.size} bytes`);
  }

  return partialPath;
}

async function buildTopDonors(files, top, concurrency = DEFAULT_CONCURRENCY) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'fec-bulk-top-'));
  const extractScriptPath = path.join(tempDir, 'extract.awk');
  const aggregateScriptPath = path.join(tempDir, 'aggregate.awk');
  const mergedPath = path.join(tempDir, 'partials-merged-sorted.tsv');

  await writeFile(extractScriptPath, EXTRACT_AWK, 'utf8');
  await writeFile(aggregateScriptPath, AGGREGATE_AWK, 'utf8');

  try {
    const partialPaths = new Array(files.length);
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < files.length) {
        const index = nextIndex;
        nextIndex += 1;
        partialPaths[index] = await buildPartialFile({
          file: files[index],
          index,
          totalFiles: files.length,
          tempDir,
          extractScriptPath,
          aggregateScriptPath,
        });
      }
    }

    const workerCount = Math.max(1, Math.min(concurrency, files.length));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    const nonEmptyPartialPaths = partialPaths.filter(Boolean);
    const mergeCommand = `set -euo pipefail; sort -T ${shellQuote(tempDir)} ${nonEmptyPartialPaths.map(shellQuote).join(' ')} > ${shellQuote(mergedPath)}`;
    const mergeProcess = spawn('bash', ['-lc', mergeCommand], {
      env: { ...process.env, LC_ALL: 'C' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await waitForProcess(mergeProcess, 'bulk donor partial merge');

    const mergedStats = await stat(mergedPath);
    console.log(`Merged partial size: ${mergedStats.size} bytes`);
    if (mergedStats.size === 0) {
      throw new Error('Bulk donor merged partials produced zero bytes.');
    }

    const heap = new MinHeap((a, b) => a.totalAmount - b.totalAmount);
    let donorsAggregated = 0;

    let currentKey = '';
    let totalAmount = 0;
    let nameTotals = new Map();
    let stateTotals = new Map();
    let employerTotals = new Map();
    let occupationTotals = new Map();
    let cycleTotals = new Map();

    function resetCurrent() {
      totalAmount = 0;
      nameTotals = new Map();
      stateTotals = new Map();
      employerTotals = new Map();
      occupationTotals = new Map();
      cycleTotals = new Map();
    }

    function flushCurrent() {
      if (!currentKey) return;

      donorsAggregated += 1;
      const donor = {
        donorKey: currentKey,
        canonicalName: topCounterKey(nameTotals),
        displayName: toDisplayName(topCounterKey(nameTotals)),
        totalAmount,
        primaryState: topCounterKey(stateTotals),
        primaryEmployer: topCounterKey(employerTotals),
        primaryOccupation: topCounterKey(occupationTotals),
        activeCycles: Array.from(cycleTotals.keys()).sort((a, b) => a - b),
        cycleTotals: Object.fromEntries(
          Array.from(cycleTotals.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([cycle, amount]) => [String(cycle), Number.parseFloat(amount.toFixed(2))])
        ),
      };

      if (heap.size < top) {
        heap.push(donor);
        return;
      }

      const currentMin = heap.peek();
      if (currentMin && donor.totalAmount > currentMin.totalAmount) {
        heap.replaceTop(donor);
      }
    }

    const reader = readline.createInterface({ input: createReadStream(mergedPath, { encoding: 'utf8' }) });
    for await (const line of reader) {
      if (!line) continue;

      const [donorKey, amountText, canonicalName, primaryState, primaryEmployer, primaryOccupation, cycleTotalsText = ''] = line.split('\t');
      const amount = Number.parseFloat(amountText);
      if (!donorKey || !Number.isFinite(amount)) continue;

      if (currentKey !== donorKey) {
        flushCurrent();
        resetCurrent();
        currentKey = donorKey;
      }

      totalAmount += amount;
      bumpCounter(nameTotals, normalizeWhitespace(canonicalName), amount);
      bumpCounter(stateTotals, normalizeWhitespace(primaryState), amount);
      bumpCounter(employerTotals, normalizeWhitespace(primaryEmployer), amount);
      bumpCounter(occupationTotals, normalizeWhitespace(primaryOccupation), amount);

      for (const [cycleText, cycleAmount] of Object.entries(parseCycleTotals(cycleTotalsText))) {
        const cycle = Number.parseInt(cycleText, 10);
        if (!Number.isFinite(cycle)) continue;
        cycleTotals.set(cycle, (cycleTotals.get(cycle) ?? 0) + cycleAmount);
      }
    }

    flushCurrent();

    return {
      donorsAggregated,
      donors: heap.toArray().sort((a, b) => b.totalAmount - a.totalAmount),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const parsedPeople = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const people = Array.isArray(parsedPeople.people) ? parsedPeople.people : Array.isArray(parsedPeople) ? parsedPeople : [];

  const filesByCycle = new Map();
  for (const cycle of args.cycles) {
    filesByCycle.set(cycle, await listFilesForCycle(cycle));
  }

  const files = Array.from(filesByCycle.values()).flat();
  console.log(`Ranking top ${args.top} donors from bulk files across cycles ${args.cycles.join(', ')}...`);
  console.log(`Files scanned: ${files.length}`);

  const { donorsAggregated, donors } = await buildTopDonors(files, args.top, args.concurrency);
  const { keyToIds, peopleById } = buildPeopleLookup(people);

  let matchedCount = 0;
  let missingCount = 0;
  let ambiguousCount = 0;
  let hydratedMatches = 0;

  const validatedDonors = donors.map((donor, index) => {
    const ids = Array.from(keyToIds.get(donor.donorKey) ?? []);
    let matchedPerson = null;
    let validation = { status: 'missing' };

    if (ids.length === 1) {
      matchedCount += 1;
      matchedPerson = peopleById.get(ids[0]) ?? null;
      const apiTotal = matchedPerson ? apiTotalForCycles(matchedPerson, args.cycles) : null;
      const hydrated = apiTotal !== null;
      if (hydrated) hydratedMatches += 1;
      validation = {
        status: 'matched',
        peopleId: matchedPerson?.id ?? null,
        currentPeopleRank: matchedPerson?.donorRank ?? null,
        hydrated,
        apiTotalForCycles: apiTotal,
        apiDeltaForCycles: apiTotal === null ? null : Number.parseFloat((donor.totalAmount - apiTotal).toFixed(2)),
      };
    } else if (ids.length > 1) {
      ambiguousCount += 1;
      validation = {
        status: 'ambiguous',
        candidatePeopleIds: ids,
      };
    } else {
      missingCount += 1;
    }

    return {
      donorRankBulk: index + 1,
      ...donor,
      validation,
    };
  });

  const output = {
    _meta: {
      generatedAt: today(),
      source:
        'FEC individual bulk by_date files aggregated by normalized donor key (LAST|FIRST) across IND rows with memo_code != X and positive contribution amounts.',
      methodology:
        'Primary name/state/employer/occupation are chosen by the highest contributed amount observed for that normalized donor key. This is suitable for ranking and validation, but still needs manual review for edge-case name collisions.',
      cycles: args.cycles,
      top: args.top,
      filesScanned: files.length,
      donorsAggregated,
      validation: {
        matchedCount,
        missingCount,
        ambiguousCount,
        hydratedMatches,
        coveragePct: donors.length > 0 ? Number.parseFloat(((matchedCount / donors.length) * 100).toFixed(2)) : 0,
      },
    },
    donors: validatedDonors,
    missingFromPeople: validatedDonors.filter((donor) => donor.validation.status === 'missing').slice(0, 100),
    ambiguousMatches: validatedDonors.filter((donor) => donor.validation.status === 'ambiguous').slice(0, 100),
    hydratedMismatches: validatedDonors
      .filter((donor) => donor.validation.status === 'matched' && donor.validation.hydrated && donor.validation.apiDeltaForCycles !== 0)
      .sort((a, b) => Math.abs(b.validation.apiDeltaForCycles) - Math.abs(a.validation.apiDeltaForCycles))
      .slice(0, 100),
  };

  await writeFile(args.output, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`\nBulk top donor report saved to ${args.output}`);
  console.log(
    `Matched ${matchedCount}/${validatedDonors.length} to people.json (${output._meta.validation.coveragePct}%), missing ${missingCount}, ambiguous ${ambiguousCount}, hydrated matches ${hydratedMatches}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
