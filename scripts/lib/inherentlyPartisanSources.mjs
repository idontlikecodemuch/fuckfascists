import 'dotenv/config';

import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BULK_ROOT = path.join(__dirname, '../../tools/fec-bulk');

const CM_FILE_PATTERN = /^cm(?: \d+)?\.txt$/i;
const INDIV_DIR_PATTERN = /^indiv\d{2}$/i;
const OTH_DIR_PATTERN = /^oth\d{2}$/i;

const CM_FIELD = {
  committeeId: 0,
  committeeName: 1,
  committeeType: 9,
  party: 10,
};

const BULK_FIELD = {
  committeeId: 0,
  reportType: 2,
  transactionType: 5,
  entityType: 6,
  contributorName: 7,
  transactionDate: 13,
  amount: 14,
  otherId: 15,
  memoCode: 18,
  memoText: 19,
};

const CSV_FIELD = {
  formCode: 0,
  committeeId: 1,
  transactionId: 2,
  backReferenceTransactionId: 3,
  backReferenceScheduleName: 4,
  entityType: 5,
  organizationName: 6,
  lastName: 7,
  firstName: 8,
  middleName: 9,
  prefix: 10,
  suffix: 11,
  street1: 12,
  street2: 13,
  city: 14,
  state: 15,
  zip: 16,
  transactionDate: 17,
  amount: 18,
  contributorAggregate: 19,
  memoCode: 20,
  memoText: 21,
};

const PARTY_ACCOUNT_RULES = [
  {
    accountType: 'convention',
    memoNeedles: ['CONVENTION ACCOUNT'],
    transactionPrefix: '30',
    memoPatterns: [/(?:^|[^A-Z])CONVENTION ACCOUNT(?:[^A-Z]|$)/],
  },
  {
    accountType: 'headquarters',
    memoNeedles: ['HEADQUARTERS ACCOUNT', 'BUILDING FUND', 'HQ ACCOUNT'],
    transactionPrefix: '31',
    memoPatterns: [
      /(?:^|[^A-Z])HEADQUARTERS ACCOUNT(?:[^A-Z]|$)/,
      /(?:^|[^A-Z])BUILDING FUND(?:[^A-Z]|$)/,
      /(?:^|[^A-Z])HQ ACCOUNT(?:[^A-Z]|$)/,
    ],
  },
  {
    accountType: 'recount',
    memoNeedles: ['RECOUNT ACCOUNT'],
    transactionPrefix: '32',
    memoPatterns: [/(?:^|[^A-Z])RECOUNT ACCOUNT(?:[^A-Z]|$)/],
  },
];

const INAUGURAL_PARTY_BY_CYCLE = new Map([
  [2018, 'R'],
  [2022, 'D'],
  [2026, 'R'],
]);

const CORPORATE_SUFFIXES = new Set([
  'AG',
  'CO',
  'COMPANY',
  'COMPANIES',
  'CORP',
  'CORPORATION',
  'FINANCIAL',
  'GROUP',
  'HOLDING',
  'HOLDINGS',
  'INC',
  'INCORPORATED',
  'LLC',
  'LP',
  'LTD',
  'MANAGEMENT',
  'NV',
  'PLC',
  'PRODUCT',
  'PRODUCTS',
  'SERVICE',
  'SERVICES',
  'THE',
  'USA',
  'US',
]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeCommitteeId(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  return /^C\d{8}$/.test(normalized) ? normalized : '';
}

export function normalizeMajorParty(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  if (normalized === 'REP') return 'R';
  if (normalized === 'DEM' || normalized === 'DFL') return 'D';
  return null;
}

export function parseAmount(value) {
  const parsed = Number.parseFloat(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundCurrency(value) {
  return Number.parseFloat(Number(value || 0).toFixed(2));
}

export function dateToCycle(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return null;
  const year = Number.parseInt(raw.slice(4, 8), 10);
  if (!Number.isFinite(year) || year < 2000) return null;
  return year % 2 === 0 ? year : year + 1;
}

export function bulkDateToIso(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return '';
  return `${raw.slice(4, 8)}-${raw.slice(0, 2)}-${raw.slice(2, 4)}`;
}

function csvDateToIso(value) {
  const raw = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(raw)) return '';
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function normalizeToken(value) {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripCorporateSuffixes(value) {
  const tokens = normalizeToken(value).split(' ').filter(Boolean);
  while (tokens.length > 1 && CORPORATE_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(' ');
}

function normalizePersonName(value) {
  return normalizeToken(value);
}

function normalizeEntityName(value) {
  return stripCorporateSuffixes(value);
}

function buildContributorDisplayName(firstName, middleName, lastName, suffix) {
  return normalizeWhitespace([firstName, middleName, lastName, suffix].filter(Boolean).join(' '));
}

function buildContributorNameVariants(row) {
  if (row.entityType === 'IND') {
    const natural = buildContributorDisplayName(
      row.firstName,
      row.middleName,
      row.organizationOrLastName,
      row.suffix
    );
    const variants = [];
    if (natural) variants.push(natural);
    if (row.organizationOrLastName) variants.push(row.organizationOrLastName);
    const commaVariant = normalizeWhitespace(
      [
        row.organizationOrLastName,
        row.firstName,
        row.middleName,
        row.suffix,
      ]
        .filter(Boolean)
        .join(', ')
        .replace(', ', ', ')
    );
    if (commaVariant) variants.push(commaVariant);
    return Array.from(new Set(variants.map(normalizePersonName).filter(Boolean)));
  }

  const organizationName = normalizeWhitespace(row.organizationOrLastName);
  if (!organizationName) return [];
  return Array.from(
    new Set([
      normalizeEntityName(organizationName),
      normalizeToken(organizationName),
    ].filter(Boolean))
  );
}

async function listMatchingEntries(root, pattern, type = 'file') {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter(
      (entry) => (type === 'dir' ? entry.isDirectory() : entry.isFile()) && pattern.test(entry.name)
    )
    .map((entry) => path.join(root, entry.name))
    .sort();
}

async function readLines(filePath, onLine) {
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line) continue;
    await onLine(line);
  }
}

function getJsonText(node) {
  if (typeof node?.text === 'string') return node.text;
  if (Array.isArray(node?.bytes)) return Buffer.from(node.bytes).toString('utf8');
  return '';
}

async function runRipgrep(patterns, files, onMatch) {
  if (patterns.length === 0 || files.length === 0) return;

  const args = ['--json', '--fixed-strings', '--no-messages'];
  for (const pattern of patterns) args.push('-e', pattern);
  args.push(...files);

  const command = spawn('rg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const stdout = readline.createInterface({ input: command.stdout });

  let stderr = '';
  command.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  for await (const line of stdout) {
    if (!line) continue;

    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.type !== 'match') continue;
    const rawLine = getJsonText(event.data.lines).replace(/\r?\n$/, '');
    await onMatch(rawLine, event.data.path?.text ?? null);
  }

  await new Promise((resolve, reject) => {
    command.on('error', reject);
    command.on('close', (code) => {
      if (code === 0 || code === 1) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `rg exited with code ${code}`));
    });
  });
}

function ensureBucket(map, key, seedFactory) {
  if (!map.has(key)) map.set(key, seedFactory());
  return map.get(key);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export async function loadCommitteeMasterMetadata() {
  const committeeNames = new Map();
  const committeeParties = new Map();
  const committeeTypes = new Map();
  const files = await listMatchingEntries(BULK_ROOT, CM_FILE_PATTERN, 'file');

  for (const filePath of files) {
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const committeeId = normalizeCommitteeId(fields[CM_FIELD.committeeId]);
      if (!committeeId) return;

      const committeeName = normalizeWhitespace(fields[CM_FIELD.committeeName]) || committeeId;
      const committeeType = normalizeWhitespace(fields[CM_FIELD.committeeType]).toUpperCase() || null;
      const party = normalizeMajorParty(fields[CM_FIELD.party]);

      committeeNames.set(committeeId, committeeName);
      if (committeeType) committeeTypes.set(committeeId, committeeType);
      if (party) committeeParties.set(committeeId, party);
    });
  }

  return {
    committeeNames,
    committeeParties,
    committeeTypes,
  };
}

export function buildPeopleSearchIndex(people) {
  const byName = new Map();
  const ambiguous = new Set();

  for (const person of people) {
    const rawNames = [person?.canonicalName, ...(person?.fecSearchNames ?? [])]
      .map(normalizeWhitespace)
      .filter(Boolean);

    for (const rawName of rawNames) {
      const normalized = normalizePersonName(rawName);
      if (!normalized) continue;
      if (byName.has(normalized) && byName.get(normalized) !== person.id) {
        ambiguous.add(normalized);
        continue;
      }
      byName.set(normalized, person.id);
    }
  }

  for (const key of ambiguous) {
    byName.delete(key);
  }

  return {
    byName,
    ambiguous,
  };
}

export function buildEntitySearchIndex(entities) {
  const byName = new Map();
  const ambiguous = new Set();

  for (const entity of entities) {
    const sourceNames = [
      entity?.name,
      entity?.canonicalName,
      entity?.legalName,
      ...(entity?.aliases ?? []),
    ]
      .map(normalizeWhitespace)
      .filter(Boolean);

    for (const sourceName of sourceNames) {
      const normalizedVariants = new Set([
        normalizeEntityName(sourceName),
        normalizeToken(sourceName),
      ]);

      for (const normalized of normalizedVariants) {
        if (!normalized) continue;
        if (byName.has(normalized) && byName.get(normalized) !== entity.id) {
          ambiguous.add(normalized);
          continue;
        }
        byName.set(normalized, entity.id);
      }
    }
  }

  for (const key of ambiguous) {
    byName.delete(key);
  }

  return {
    byName,
    ambiguous,
  };
}

function buildIdLookup(rows) {
  return new Map(rows.map((row) => [row.id, row]));
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

function parseF13CsvReceipt(line) {
  const fields = parseCsvLine(line);
  if (fields[CSV_FIELD.formCode] !== 'F132') return null;
  const entityType = normalizeWhitespace(fields[CSV_FIELD.entityType]).toUpperCase();

  return {
    formCode: fields[CSV_FIELD.formCode],
    committeeId: normalizeCommitteeId(fields[CSV_FIELD.committeeId]),
    transactionId: normalizeWhitespace(fields[CSV_FIELD.transactionId]),
    entityType,
    organizationOrLastName:
      entityType === 'IND'
        ? normalizeWhitespace(fields[CSV_FIELD.lastName])
        : normalizeWhitespace(fields[CSV_FIELD.organizationName]),
    firstName: normalizeWhitespace(fields[CSV_FIELD.firstName]),
    middleName: normalizeWhitespace(fields[CSV_FIELD.middleName]),
    suffix: normalizeWhitespace(fields[CSV_FIELD.suffix]),
    transactionDate: normalizeWhitespace(fields[CSV_FIELD.transactionDate]),
    amount: parseAmount(fields[CSV_FIELD.amount]),
    memoCode: normalizeWhitespace(fields[CSV_FIELD.memoCode]).toUpperCase() || null,
    memoText: normalizeWhitespace(fields[CSV_FIELD.memoText]) || null,
  };
}

function pickPartyAccountRule(memoText, transactionType, nameText = '') {
  const normalizedMemo = normalizeWhitespace(memoText).toUpperCase();
  const normalizedName = normalizeWhitespace(nameText).toUpperCase();
  const normalizedType = normalizeWhitespace(transactionType).toUpperCase();
  const transactionPrefix = normalizedType.slice(0, 2);
  const searchableText = [normalizedMemo, normalizedName].filter(Boolean);

  for (const rule of PARTY_ACCOUNT_RULES) {
    const matchesText = rule.memoPatterns.some((pattern) =>
      searchableText.some((text) => pattern.test(text))
    );
    if (!matchesText) continue;
    return {
      ...rule,
      memoMatches: Boolean(normalizedMemo),
      nameMatches: Boolean(normalizedName),
      transactionMatches: transactionPrefix === rule.transactionPrefix,
      transactionHasAccountPrefix: ['30', '31', '32'].includes(transactionPrefix),
    };
  }

  return null;
}

export async function discoverPartyAccountCommittees() {
  const committeeMetadata = await loadCommitteeMasterMetadata();
  const indivDirs = await listMatchingEntries(BULK_ROOT, INDIV_DIR_PATTERN, 'dir');
  const indivFiles = [];

  for (const dirPath of indivDirs) {
    const byDateDir = path.join(dirPath, 'by_date');
    const files = await listMatchingEntries(byDateDir, /\.txt$/i, 'file');
    indivFiles.push(...files);
  }

  const committeeMap = new Map();
  const qaIssues = [];

  await runRipgrep(
    PARTY_ACCOUNT_RULES.flatMap((rule) => rule.memoNeedles),
    indivFiles,
    (line, filePath) => {
      const fields = line.split('|');
      const committeeId = normalizeCommitteeId(fields[BULK_FIELD.committeeId]);
      const memoText = normalizeWhitespace(fields[BULK_FIELD.memoText]);
      const transactionType = normalizeWhitespace(fields[BULK_FIELD.transactionType]).toUpperCase();
      const amount = parseAmount(fields[BULK_FIELD.amount]);
      const transactionDate = bulkDateToIso(fields[BULK_FIELD.transactionDate]);
      const rule = pickPartyAccountRule(memoText, transactionType);
      const resolvedParty = committeeMetadata.committeeParties.get(committeeId) ?? null;
      const committeeType = committeeMetadata.committeeTypes.get(committeeId) ?? null;

      if (!committeeId || amount <= 0 || !rule) return;
      if (committeeType !== 'Y') return;

      if (!resolvedParty) {
        qaIssues.push({
          type: 'missing_major_party',
          committeeId,
          committeeName: committeeMetadata.committeeNames.get(committeeId) ?? committeeId,
          memoText,
          transactionType,
          filePath,
        });
        return;
      }

      if (rule.transactionHasAccountPrefix && !rule.transactionMatches) {
        qaIssues.push({
          type: 'memo_transaction_mismatch',
          committeeId,
          committeeName: committeeMetadata.committeeNames.get(committeeId) ?? committeeId,
          memoText,
          transactionType,
          expectedPrefix: rule.transactionPrefix,
          filePath,
        });
        return;
      }

      const committee = ensureBucket(committeeMap, committeeId, () => ({
        committeeId,
        committeeName: committeeMetadata.committeeNames.get(committeeId) ?? committeeId,
        resolvedParty,
        totalAmount: 0,
        rows: 0,
        accountTypes: new Set(),
        memoExamples: [],
        firstSeenDate: transactionDate || null,
        lastSeenDate: transactionDate || null,
      }));

      committee.totalAmount += amount;
      committee.rows += 1;
      committee.accountTypes.add(rule.accountType);
      if (memoText && committee.memoExamples.length < 3 && !committee.memoExamples.includes(memoText)) {
        committee.memoExamples.push(memoText);
      }
      if (transactionDate && (!committee.firstSeenDate || transactionDate < committee.firstSeenDate)) {
        committee.firstSeenDate = transactionDate;
      }
      if (transactionDate && (!committee.lastSeenDate || transactionDate > committee.lastSeenDate)) {
        committee.lastSeenDate = transactionDate;
      }
    }
  );

  return {
    committees: Array.from(committeeMap.values())
      .map((committee) => ({
        ...committee,
        totalAmount: roundCurrency(committee.totalAmount),
        accountTypes: Array.from(committee.accountTypes).sort(),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount || a.committeeId.localeCompare(b.committeeId)),
    qaIssues,
  };
}

export async function collectPartyAccountEntityRows(entities, partyAccountCommittees) {
  const trackedCommitteeToEntity = new Map();
  for (const entity of entities) {
    const committeeId =
      normalizeCommitteeId(entity?.donationSummary?.committeeId) || normalizeCommitteeId(entity?.fecCommitteeId);
    if (committeeId) trackedCommitteeToEntity.set(committeeId, entity);
  }

  const byCommitteeId = new Map(
    partyAccountCommittees.map((committee) => [committee.committeeId, committee])
  );
  const patterns = partyAccountCommittees.map((committee) => `|${committee.committeeId}|`);
  const othDirs = await listMatchingEntries(BULK_ROOT, OTH_DIR_PATTERN, 'dir');
  const othFiles = othDirs.map((dirPath) => path.join(dirPath, 'itoth.txt'));

  const entityRows = new Map();
  const accountTypeTotals = new Map();
  const qaIssues = [];

  await runRipgrep(patterns, othFiles, (line, filePath) => {
    const fields = line.split('|');
    const filerCommitteeId = normalizeCommitteeId(fields[BULK_FIELD.committeeId]);
    const recipientCommitteeId = normalizeCommitteeId(fields[BULK_FIELD.otherId]);
    const recipient = byCommitteeId.get(recipientCommitteeId) ?? null;
    const entity = trackedCommitteeToEntity.get(filerCommitteeId) ?? null;
    const amount = parseAmount(fields[BULK_FIELD.amount]);
    const cycle = dateToCycle(fields[BULK_FIELD.transactionDate]);
    const contributorName = normalizeWhitespace(fields[BULK_FIELD.contributorName]);
    const transactionType = normalizeWhitespace(fields[BULK_FIELD.transactionType]).toUpperCase();
    const memoCode = normalizeWhitespace(fields[BULK_FIELD.memoCode]).toUpperCase();
    const memoText = normalizeWhitespace(fields[BULK_FIELD.memoText]) || null;
    const rule = pickPartyAccountRule(memoText, transactionType, contributorName);

    if (!recipient || !entity || amount <= 0 || !cycle || memoCode === 'X' || !rule) return;

    if (rule.transactionHasAccountPrefix && !rule.transactionMatches) {
      qaIssues.push({
        type: 'memo_transaction_mismatch',
        entityId: entity.id,
        entityName: entity.canonicalName ?? entity.name ?? entity.id,
        recipientCommitteeId,
        recipientCommitteeName: recipient.committeeName,
        contributorName,
        memoText,
        transactionType,
        expectedPrefix: rule.transactionPrefix,
        filePath,
      });
      return;
    }

    const key = [
      entity.id,
      recipientCommitteeId,
      cycle,
      recipient.resolvedParty,
      rule.accountType,
    ].join(':');

    const bucket = ensureBucket(entityRows, key, () => ({
      entityId: entity.id,
      entityName: entity.canonicalName ?? entity.name ?? entity.id,
      cycle,
      amount: 0,
      resolvedParty: recipient.resolvedParty,
      sourceKind: 'party_account',
      recipientCommitteeId,
      recipientCommitteeName: recipient.committeeName,
      accountTypes: [rule.accountType],
      memoExamples: [],
    }));

    bucket.amount += amount;
    if (memoText && bucket.memoExamples.length < 2 && !bucket.memoExamples.includes(memoText)) {
      bucket.memoExamples.push(memoText);
    }

    accountTypeTotals.set(rule.accountType, (accountTypeTotals.get(rule.accountType) ?? 0) + amount);
  });

  return {
    rows: Array.from(entityRows.values())
      .map((row) => ({
        ...row,
        amount: roundCurrency(row.amount),
      }))
      .sort((a, b) => b.amount - a.amount || a.entityId.localeCompare(b.entityId)),
    accountTypeTotals: Array.from(accountTypeTotals.entries())
      .map(([accountType, amount]) => ({
        accountType,
        amount: roundCurrency(amount),
      }))
      .sort((a, b) => b.amount - a.amount || a.accountType.localeCompare(b.accountType)),
    qaIssues,
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }
  return response.text();
}

async function fetchF13Filings() {
  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) {
    throw new Error('FEC_API_KEY is required to fetch F13 inaugural filings');
  }

  const results = [];
  let page = 1;

  while (true) {
    const data = await fetchJson(
      `https://api.open.fec.gov/v1/filings/?form_type=F13&per_page=100&page=${page}&sort=-receipt_date&api_key=${encodeURIComponent(apiKey)}`
    );
    const batch = Array.isArray(data?.results) ? data.results : [];
    results.push(...batch);
    if (batch.length < 100 || page >= Number(data?.pagination?.pages || 1)) break;
    page += 1;
  }

  return results;
}

function selectInauguralCommitteeSources(filings) {
  const grouped = new Map();

  for (const filing of filings) {
    const cycle = Number(filing?.cycle || 0);
    const committeeId = normalizeCommitteeId(filing?.committee_id);
    if (!committeeId || !INAUGURAL_PARTY_BY_CYCLE.has(cycle)) continue;

    const bucket = ensureBucket(grouped, committeeId, () => ({
      committeeId,
      committeeName: normalizeWhitespace(filing?.committee_name) || committeeId,
      cycle,
      resolvedParty: INAUGURAL_PARTY_BY_CYCLE.get(cycle),
      filings: [],
    }));

    bucket.filings.push({
      reportType: normalizeWhitespace(filing?.report_type).toUpperCase() || null,
      coverageStartDate: normalizeWhitespace(filing?.coverage_start_date) || null,
      coverageEndDate: normalizeWhitespace(filing?.coverage_end_date) || null,
      receiptDate: normalizeWhitespace(filing?.receipt_date) || null,
      mostRecent: Boolean(filing?.most_recent),
      csvUrl: normalizeWhitespace(filing?.csv_url) || null,
      fileNumber: filing?.file_number ?? null,
      formType: normalizeWhitespace(filing?.form_type) || null,
    });
  }

  return Array.from(grouped.values())
    .map((committee) => {
      const latestByReportType = new Map();
      for (const filing of committee.filings) {
        const reportKey = filing.reportType || `unknown:${filing.receiptDate}`;
        const current = latestByReportType.get(reportKey);
        if (!current || filing.receiptDate > current.receiptDate) {
          latestByReportType.set(reportKey, filing);
        }
      }

      const selectedFilings = Array.from(latestByReportType.values()).sort((a, b) =>
        (a.receiptDate || '').localeCompare(b.receiptDate || '')
      );
      const usesApiFallback = selectedFilings.some((filing) => !filing.csvUrl);

      return {
        committeeId: committee.committeeId,
        committeeName: committee.committeeName,
        cycle: committee.cycle,
        resolvedParty: committee.resolvedParty,
        sourceMode: usesApiFallback ? 'schedule_a_api' : 'filing_csv',
        filings: selectedFilings,
      };
    })
    .sort((a, b) => a.cycle - b.cycle || a.committeeId.localeCompare(b.committeeId));
}

async function visitScheduleACommitteeRows(committeeId, cycle, onRow) {
  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) {
    throw new Error('FEC_API_KEY is required to fetch inaugural Schedule A rows');
  }

  let lastIndex = '';
  let lastDate = '';

  while (true) {
    const params = new URLSearchParams({
      committee_id: committeeId,
      per_page: '100',
      sort: '-contribution_receipt_date',
      api_key: apiKey,
    });
    if (cycle) {
      params.set('two_year_transaction_period', String(cycle));
    }
    if (lastIndex) params.set('last_index', lastIndex);
    if (lastDate) params.set('last_contribution_receipt_date', lastDate);

    const data = await fetchJson(`https://api.open.fec.gov/v1/schedules/schedule_a/?${params}`);
    const batch = Array.isArray(data?.results) ? data.results : [];
    for (const row of batch) {
      await onRow({
        committeeId: normalizeCommitteeId(row?.committee_id),
        entityType: normalizeWhitespace(row?.entity_type).toUpperCase(),
        organizationOrLastName: normalizeWhitespace(row?.contributor_name),
        firstName: normalizeWhitespace(row?.contributor_first_name),
        middleName: normalizeWhitespace(row?.contributor_middle_name),
        suffix: normalizeWhitespace(row?.contributor_suffix),
        transactionDate: normalizeWhitespace(row?.contribution_receipt_date).replace(/-/g, ''),
        amount: parseAmount(row?.contribution_receipt_amount),
        memoCode: normalizeWhitespace(row?.memo_code).toUpperCase() || null,
        memoText: normalizeWhitespace(row?.memo_text) || null,
        transactionId: normalizeWhitespace(row?.transaction_id),
        source: 'schedule_a_api',
      });
    }

    const indexes = data?.pagination?.last_indexes;
    if (!indexes?.last_index || batch.length < 100) break;
    lastIndex = indexes.last_index;
    lastDate = indexes.last_contribution_receipt_date;
  }
}

async function visitCsvReceiptRows(csvUrl, onRow) {
  const text = await fetchText(csvUrl);
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (!line) continue;
    const parsed = parseF13CsvReceipt(line);
    if (!parsed) continue;
    await onRow({
      ...parsed,
      source: 'filing_csv',
    });
  }
}

export async function collectInauguralRows(people, entities) {
  const filings = await fetchF13Filings();
  const committees = selectInauguralCommitteeSources(filings);
  const peopleIndex = buildPeopleSearchIndex(people);
  const entityIndex = buildEntitySearchIndex(entities);
  const peopleById = buildIdLookup(people);
  const entitiesById = buildIdLookup(entities);

  const peopleRows = new Map();
  const entityRows = new Map();
  const unmatchedEntityContributors = new Map();
  const qaIssues = [];

  const applyReceiptRow = (committee, row) => {
    const amount = parseAmount(row.amount);
    const contributorVariants = buildContributorNameVariants(row);
    const contributionDate =
      row.source === 'filing_csv' ? csvDateToIso(row.transactionDate) : bulkDateToIso(row.transactionDate);
    const cycle = committee.cycle || dateToCycle(row.transactionDate);

    if (!cycle || amount <= 0) return;
    if (normalizeWhitespace(row.organizationOrLastName).toUpperCase() === 'UNITEMIZED TOTAL') return;
    if (normalizeWhitespace(row.memoCode).toUpperCase() === 'X') return;

    if (row.entityType === 'IND') {
      const personId = contributorVariants
        .map((variant) => peopleIndex.byName.get(variant) ?? null)
        .find(Boolean);

      if (!personId) return;

      const person = peopleById.get(personId);
      const key = [personId, committee.committeeId, cycle].join(':');
      const bucket = ensureBucket(peopleRows, key, () => ({
        personId,
        displayName: person?.displayName ?? personId,
        committeeId: committee.committeeId,
        committeeName: committee.committeeName,
        cycle,
        amount: 0,
        committeeParty: committee.resolvedParty === 'R' ? 'REP' : 'DEM',
        contributionDate,
        sourceKind: 'inaugural_f13',
      }));
      bucket.amount += amount;
      if (contributionDate && (!bucket.contributionDate || contributionDate > bucket.contributionDate)) {
        bucket.contributionDate = contributionDate;
      }
      return;
    }

    const entityId = contributorVariants
      .map((variant) => entityIndex.byName.get(variant) ?? null)
      .find(Boolean);

    if (!entityId) {
      const contributorName = normalizeWhitespace(row.organizationOrLastName);
      if (contributorName) {
        const unmatchedKey = [contributorName, cycle, row.entityType].join(':');
        const bucket = ensureBucket(unmatchedEntityContributors, unmatchedKey, () => ({
          contributorName,
          amount: 0,
          cycle,
          entityType: row.entityType,
        }));
        bucket.amount += amount;
      }
      return;
    }

    const entity = entitiesById.get(entityId);
    const key = [entityId, committee.committeeId, cycle].join(':');
    const bucket = ensureBucket(entityRows, key, () => ({
      entityId,
      entityName: entity?.canonicalName ?? entity?.name ?? entityId,
      cycle,
      amount: 0,
      resolvedParty: committee.resolvedParty,
      sourceKind: 'inaugural_f13',
      recipientCommitteeId: committee.committeeId,
      recipientCommitteeName: committee.committeeName,
    }));
    bucket.amount += amount;
  };

  for (const committee of committees) {
    if (committee.sourceMode === 'schedule_a_api') {
      await visitScheduleACommitteeRows(committee.committeeId, committee.cycle, (row) =>
        applyReceiptRow(committee, row)
      );
    } else {
      for (const filing of committee.filings) {
        if (!filing.csvUrl) continue;
        await visitCsvReceiptRows(filing.csvUrl, (row) => applyReceiptRow(committee, row));
      }
    }

    if (committee.sourceMode === 'schedule_a_api') {
      qaIssues.push({
        type: 'api_fallback',
        committeeId: committee.committeeId,
        committeeName: committee.committeeName,
        cycle: committee.cycle,
        reason: 'missing_csv_coverage',
      });
    }
  }

  return {
    generatedAt: today(),
    committees,
    peopleRows: Array.from(peopleRows.values())
      .map((row) => ({
        ...row,
        amount: roundCurrency(row.amount),
      }))
      .sort((a, b) => b.amount - a.amount || a.personId.localeCompare(b.personId)),
    entityRows: Array.from(entityRows.values())
      .map((row) => ({
        ...row,
        amount: roundCurrency(row.amount),
      }))
      .sort((a, b) => b.amount - a.amount || a.entityId.localeCompare(b.entityId)),
    topUnmatchedEntityContributors: Array.from(unmatchedEntityContributors.values())
      .map((row) => ({
        ...row,
        amount: roundCurrency(row.amount),
      }))
      .sort((a, b) => b.amount - a.amount || a.contributorName.localeCompare(b.contributorName))
      .slice(0, 50),
    qaIssues,
  };
}
