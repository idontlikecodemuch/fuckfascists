import 'dotenv/config';

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  DEFAULT_PEOPLE_ENTITY_OVERRIDES_PATH,
  loadPeopleEntityOverrides,
  normalizeEntityRoleRecord,
} from './lib/peopleEntityOverrides.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const FEC_API_BASE = 'https://api.open.fec.gov/v1';
const PERSON_SCHEMA_VERSION = '1.3';

const CACHE_TTL_DAYS = 60;
const DEFAULT_LIMIT = 3800;
const DEFAULT_PER_CYCLE_LIMIT = 1000;
const DEFAULT_DISCOVERY_PAGES_PER_CYCLE = 38;
const SUMMARY_CYCLES_SINCE_2016 = [2016, 2018, 2020, 2022, 2024];
const DEFAULT_DISCOVERY_CYCLES = SUMMARY_CYCLES_SINCE_2016;
const PER_PAGE = 100;
const DISCOVERY_RPM = 20;
const SCHEDULE_A_RPM = 20;
const BACKOFF_INITIAL_MS = 30_000;
const BACKOFF_MAX_MS = 300_000;
const BACKOFF_MAX_RETRIES = 3;
const DEFAULT_WRITE_INTERVAL = 1;
const DISPLAY_SKIP_TOKENS = new Set(['MR', 'MRS', 'MS', 'MISS', 'DR', 'MD', 'PHD', 'DDS', 'DVM', 'ESQ']);

const ROLE_OVERRIDES = {
  'elon-musk': {
    'x-twitter': { role: 'Owner & CTO', startYear: 2022, endYear: null },
    'tesla': { role: 'CEO', startYear: 2008, endYear: null },
    'spacex': { role: 'Founder & CEO', startYear: 2002, endYear: null },
    'xai': { role: 'Founder', startYear: 2023, endYear: null },
  },
  'richard-e-uihlein': {
    'uline': { role: 'Founder & President', startYear: 1980, endYear: null },
  },
  'richard-uihlein': {
    'uline': { role: 'Founder & President', startYear: 1980, endYear: null },
  },
  'stephen-a-schwarzman': {
    'blackstone': { role: 'Co-Founder, Chairman & CEO', startYear: 1985, endYear: null },
  },
  'barry-c-diller': {
    'iac': { role: 'Chairman & Senior Executive', startYear: 1995, endYear: null },
    'dotdash-meredith': { role: 'Chairman & Senior Executive', startYear: 2021, endYear: null },
    'angi': { role: 'Chairman & Senior Executive', startYear: 2017, endYear: null },
  },
  'safra-catz': {
    'oracle': { role: 'CEO', startYear: 2014, endYear: null },
  },
  'jeff-bezos': {
    'amazon': { role: 'Founder & Executive Chair', startYear: 1994, endYear: null },
    'washington-post': { role: 'Owner', startYear: 2013, endYear: null },
  },
  'peter-thiel': {
    'palantir': { role: 'Co-Founder & Chair', startYear: 2003, endYear: null },
  },
  'laurene-powell-jobs': {
    'the-atlantic': { role: 'Owner', startYear: 2017, endYear: null },
  },
  'sheldon-adelson': {
    'las-vegas-sands': { role: 'Founder & CEO', startYear: 1989, endYear: 2021 },
  },
  'brian-david-armstrong': {
    'coinbase': { role: 'Co-Founder & CEO', startYear: 2012, endYear: null },
  },
};
let runtimeRoleOverrides = ROLE_OVERRIDES;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    limit: DEFAULT_LIMIT,
    perCycleLimit: DEFAULT_PER_CYCLE_LIMIT,
    discoveryPagesPerCycle: DEFAULT_DISCOVERY_PAGES_PER_CYCLE,
    discoveryCycles: DEFAULT_DISCOVERY_CYCLES,
    maxPeople: null,
    startRank: 1,
    endRank: null,
    writeInterval: DEFAULT_WRITE_INTERVAL,
    overrides: DEFAULT_PEOPLE_ENTITY_OVERRIDES_PATH,
    augmentDiscovery: argv.includes('--augment-discovery'),
    discoverOnly: argv.includes('--discover-only'),
    force: argv.includes('--force'),
    reseed: argv.includes('--reseed'),
  };

  for (const arg of argv) {
    if (arg.startsWith('--limit=')) {
      const value = Number.parseInt(arg.slice('--limit='.length), 10);
      if (Number.isFinite(value) && value > 0) args.limit = value;
    } else if (arg.startsWith('--per-cycle-limit=')) {
      const value = Number.parseInt(arg.slice('--per-cycle-limit='.length), 10);
      if (Number.isFinite(value) && value > 0) args.perCycleLimit = value;
    } else if (arg === '--no-limit') {
      args.limit = null;
    } else if (arg === '--no-per-cycle-limit') {
      args.perCycleLimit = null;
    } else if (arg.startsWith('--pages-per-cycle=')) {
      const value = Number.parseInt(arg.slice('--pages-per-cycle='.length), 10);
      if (Number.isFinite(value) && value > 0) args.discoveryPagesPerCycle = value;
    } else if (arg.startsWith('--cycles=')) {
      const cycles = arg
        .slice('--cycles='.length)
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value >= 2000);
      if (cycles.length > 0) args.discoveryCycles = Array.from(new Set(cycles));
    } else if (arg.startsWith('--max-people=')) {
      const value = Number.parseInt(arg.slice('--max-people='.length), 10);
      if (Number.isFinite(value) && value > 0) args.maxPeople = value;
    } else if (arg.startsWith('--start-rank=')) {
      const value = Number.parseInt(arg.slice('--start-rank='.length), 10);
      if (Number.isFinite(value) && value > 0) args.startRank = value;
    } else if (arg.startsWith('--end-rank=')) {
      const value = Number.parseInt(arg.slice('--end-rank='.length), 10);
      if (Number.isFinite(value) && value > 0) args.endRank = value;
    } else if (arg.startsWith('--write-interval=')) {
      const value = Number.parseInt(arg.slice('--write-interval='.length), 10);
      if (Number.isFinite(value) && value > 0) args.writeInterval = value;
    } else if (arg.startsWith('--overrides=')) {
      const value = arg.slice('--overrides='.length).trim();
      if (value) args.overrides = path.resolve(process.cwd(), value);
    }
  }

  return args;
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

function sanitizeDisplayTokens(tokens) {
  return tokens.filter((token) => !DISPLAY_SKIP_TOKENS.has(token.replace(/\./g, '')));
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
    const restTokens = sanitizeDisplayTokens(stripSuffix(rest.split(' ').filter(Boolean)));
    if (restTokens.length > 1) {
      pieces.push(...restTokens.slice(1).map(toTitleCase));
    }
  }

  if (parsed.last) pieces.push(toTitleCase(parsed.last));
  return pieces.join(' ').trim() || toTitleCase(fecName);
}

function toFecName(displayName) {
  const cleaned = normalizeWhitespace(displayName);
  const tokens = cleaned.split(' ').filter(Boolean);
  if (tokens.length < 2) return cleaned.toUpperCase();
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const middle = tokens.slice(1, -1).join(' ');
  return [last.toUpperCase(), [first, middle].filter(Boolean).join(' ').toUpperCase()].join(', ');
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cycleLabel(cycle) {
  if (!cycle) return '';
  return `${cycle - 1}-${String(cycle).slice(2)}`;
}

function inferTier(rank) {
  if (!rank || rank < 1) return undefined;
  if (rank <= 50) return 1;
  if (rank <= 200) return 2;
  return 3;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildAliases(canonicalName, searchNames, existingAliases = []) {
  const aliases = [
    toDisplayName(canonicalName),
    ...existingAliases.map(normalizeWhitespace),
    ...searchNames.map(toDisplayName),
  ];
  return unique(aliases.map(normalizeWhitespace));
}

function normalizeSearchName(name) {
  return cleanNameToken(name);
}

function normalizeDonorKey(name) {
  const parsed = parseFecName(name);
  return [parsed.last, parsed.first].join('|');
}

function normalizeMatchName(name) {
  const parsed = parseFecName(name.includes(',') ? name : toFecName(name));
  return [parsed.first, parsed.last].filter(Boolean).join(' ').toLowerCase();
}

function parseAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function bumpCounter(map, key, value) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + value);
}

function chooseTopKey(map) {
  let bestKey = '';
  let bestValue = -1;
  for (const [key, value] of map) {
    if (value > bestValue) {
      bestKey = key;
      bestValue = value;
    }
  }
  return bestKey;
}

function takeTopKeys(map, limit = 5) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function roleRecord(role, startYear = null, endYear = null) {
  return { role, startYear, endYear };
}

function roundCurrency(value) {
  return Number.parseFloat(parseAmount(value).toFixed(2));
}

function normalizeDonationSummary(summary) {
  if (!summary || typeof summary !== 'object') return undefined;

  return {
    totalR: roundCurrency(summary.totalR ?? summary.totalGOP ?? 0),
    totalD: roundCurrency(summary.totalD ?? summary.totalDEM ?? 0),
    totalO: roundCurrency(summary.totalO ?? 0),
    recentCycleR: roundCurrency(summary.recentCycleR ?? summary.recentCycleGOP ?? 0),
    recentCycleD: roundCurrency(summary.recentCycleD ?? summary.recentCycleDEM ?? 0),
    recentCycleO: roundCurrency(summary.recentCycleO ?? 0),
    recentCycle: normalizeWhitespace(summary.recentCycle ?? ''),
    activeCycles: Array.isArray(summary.activeCycles)
      ? summary.activeCycles
          .map((cycle) => Number.parseInt(String(cycle), 10))
          .filter((cycle) => Number.isFinite(cycle) && cycle > 0)
      : [],
    raw: Array.isArray(summary.raw) ? summary.raw : [],
    lastUpdated: typeof summary.lastUpdated === 'string' ? summary.lastUpdated : '',
  };
}

function isFresh(person) {
  if (!person.donationSummary?.lastUpdated || !person.lastVerifiedDate) return false;
  const verifiedMs = new Date(person.lastVerifiedDate).getTime();
  return Date.now() - verifiedMs <= CACHE_TTL_DAYS * 24 * 60 * 60 * 1_000;
}

function looksLikeOrganizationName(row) {
  const orgKeywords = [
    'ACTION',
    'ADVOCACY',
    'ASSOCIATION',
    'COMMITTEE',
    'CORP',
    'CORPORATION',
    'COUNCIL',
    'FEDERATION',
    'FUND',
    'FOUNDATION',
    'INC',
    'INTERNATIONAL',
    'LLC',
    'PAC',
    'PARTNERSHIP',
    'REALTORS',
    'UNION',
  ];

  const nameParts = [
    cleanNameToken(row.contributor_first_name ?? ''),
    cleanNameToken(row.contributor_last_name ?? ''),
    cleanNameToken(row.contributor_name ?? ''),
  ];

  return orgKeywords.some((keyword) => nameParts.some((part) => part.includes(keyword)));
}

function isDiscoveryRow(row) {
  return (
    row &&
    row.entity_type === 'IND' &&
    typeof row.contributor_first_name === 'string' &&
    row.contributor_first_name.trim().length > 0 &&
    typeof row.contributor_last_name === 'string' &&
    row.contributor_last_name.trim().length > 0 &&
    !looksLikeOrganizationName(row) &&
    row.line_number === '11AI' &&
    typeof row.contributor_name === 'string' &&
    row.contributor_name.includes(',') &&
    parseAmount(row.contribution_receipt_amount) > 0
  );
}

function isHydrationCandidateRow(row) {
  return (
    row &&
    row.entity_type === 'IND' &&
    typeof row.contributor_first_name === 'string' &&
    row.contributor_first_name.trim().length > 0 &&
    typeof row.contributor_last_name === 'string' &&
    row.contributor_last_name.trim().length > 0 &&
    !looksLikeOrganizationName(row) &&
    typeof row.contributor_name === 'string' &&
    row.contributor_name.includes(',') &&
    parseAmount(row.contribution_receipt_amount) > 0
  );
}

function isHydrationRow(row, normalizedSearchNames) {
  return (
    isHydrationCandidateRow(row) &&
    normalizedSearchNames.has(normalizeSearchName(row.contributor_name)) &&
    row.memo_code !== 'X' &&
    row.memoed_subtotal !== true
  );
}

class RateLimiter {
  #name;
  #maxPerMinute;
  #windowMs = 60_000;
  #timestamps = [];

  constructor(maxPerMinute, name = 'api') {
    this.#maxPerMinute = maxPerMinute;
    this.#name = name;
  }

  async throttle() {
    const now = Date.now();
    this.#timestamps = this.#timestamps.filter((t) => now - t < this.#windowMs);
    if (this.#timestamps.length >= this.#maxPerMinute) {
      const waitMs = this.#windowMs - (now - this.#timestamps[0]) + 200;
      if (waitMs > 0) {
        console.log(`  ⏸  ${this.#name} rate limit (${this.#maxPerMinute}/min) — waiting ${Math.ceil(waitMs / 1000)}s`);
        await delay(waitMs);
        const after = Date.now();
        this.#timestamps = this.#timestamps.filter((t) => after - t < this.#windowMs);
      }
    }
    this.#timestamps.push(Date.now());
  }
}

const discoveryLimiter = new RateLimiter(DISCOVERY_RPM, 'schedule_a_discovery');
const scheduleALimiter = new RateLimiter(SCHEDULE_A_RPM, 'schedule_a');

async function apiFetch(url, limiter) {
  await limiter.throttle();
  let response = await fetch(url);
  let backoffMs = BACKOFF_INITIAL_MS;

  for (let retry = 0; response.status === 429 && retry < BACKOFF_MAX_RETRIES; retry += 1) {
    const retryAfter = response.headers?.get?.('Retry-After');
    const waitMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1_000 + 1_000 : backoffMs;
    console.warn(`  ⚠ 429 on ${url.split('?')[0]} — waiting ${Math.ceil(waitMs / 1000)}s (retry ${retry + 1}/${BACKOFF_MAX_RETRIES})`);
    await delay(waitMs);
    backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
    await limiter.throttle();
    response = await fetch(url);
  }

  return response;
}

function buildScheduleAUrl({ apiKey, contributorName, cycles, lastIndexes, sort }) {
  const params = new URLSearchParams({
    per_page: String(PER_PAGE),
    sort,
  });
  if (apiKey) params.set('api_key', apiKey);
  if (contributorName) params.set('contributor_name', contributorName);
  for (const cycle of cycles) params.append('two_year_transaction_period', String(cycle));
  if (lastIndexes?.last_index) params.set('last_index', lastIndexes.last_index);
  if (lastIndexes?.last_contribution_receipt_amount) {
    params.set('last_contribution_receipt_amount', lastIndexes.last_contribution_receipt_amount);
  }
  if (lastIndexes?.last_contribution_receipt_date) {
    params.set('last_contribution_receipt_date', lastIndexes.last_contribution_receipt_date);
  }
  return `${FEC_API_BASE}/schedules/schedule_a/?${params}`;
}

async function fetchScheduleAPage(options, limiter) {
  const url = buildScheduleAUrl(options);
  const response = await apiFetch(url, limiter);
  if (!response.ok) {
    throw new Error(`FEC schedule_a API ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

function buildEntityLookup(entities) {
  const lookup = new Map();

  for (const entity of entities) {
    const publicFigure = typeof entity.publicFigureName === 'string' ? normalizeMatchName(entity.publicFigureName) : '';
    const ceo = typeof entity.ceoName === 'string' ? normalizeMatchName(entity.ceoName) : '';

    if (publicFigure) {
      const matches = lookup.get(publicFigure) ?? [];
      matches.push({ entityId: entity.id, role: 'Public Figure' });
      lookup.set(publicFigure, matches);
    }

    if (ceo) {
      const matches = lookup.get(ceo) ?? [];
      matches.push({ entityId: entity.id, role: 'CEO' });
      lookup.set(ceo, matches);
    }
  }

  return lookup;
}

function normalizeRoleRecord(value) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return normalizeEntityRoleRecord({ role: normalizeWhitespace(value) });
  }
  return normalizeEntityRoleRecord(value);
}

function normalizeRolesByEntity(rawRoles) {
  if (typeof rawRoles !== 'object' || rawRoles === null) return {};

  return Object.fromEntries(
    Object.entries(rawRoles)
      .map(([entityId, role]) => [entityId, normalizeRoleRecord(role)])
      .filter((entry) => entry[1])
  );
}

function mergeEntityLinks({
  personId,
  primaryName,
  searchNames,
  entityLookup,
  existingAssociatedEntityIds = [],
  existingRolesByEntity = {},
}) {
  const associatedEntityIds = [];
  const rolesByEntity = {};
  const seen = new Set();

  const addEntity = (entityId, role) => {
    if (!entityId) return;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      associatedEntityIds.push(entityId);
    }
    if (role) rolesByEntity[entityId] = role;
  };

  for (const entityId of existingAssociatedEntityIds) {
    addEntity(entityId, existingRolesByEntity[entityId]);
  }

  for (const [entityId, role] of Object.entries(existingRolesByEntity)) {
    addEntity(entityId, role);
  }

  const keys = new Set([normalizeMatchName(primaryName), ...searchNames.map(normalizeMatchName)]);
  for (const key of keys) {
    const matches = entityLookup.get(key) ?? [];
    for (const match of matches) {
      const fallbackRole = normalizeRoleRecord(existingRolesByEntity[match.entityId]) ?? roleRecord(match.role);
      addEntity(match.entityId, fallbackRole);
    }
  }

  for (const [entityId, override] of Object.entries(runtimeRoleOverrides[personId] ?? {})) {
    addEntity(entityId, override);
  }

  return { associatedEntityIds, rolesByEntity };
}

function stableContributorId(_rows) {
  return undefined;
}

function normalizeSeedPerson(raw, index, entityLookup) {
  const canonicalName = normalizeWhitespace(raw.canonicalName ?? raw.name ?? '');
  const displayName = normalizeWhitespace(raw.displayName ?? raw.aliases?.[0] ?? toDisplayName(canonicalName));
  const fecSearchNames = unique([
    canonicalName,
    ...(Array.isArray(raw.fecSearchNames) ? raw.fecSearchNames : []),
  ].map(normalizeWhitespace));
  const id = raw.id ?? (slugify(displayName || canonicalName) || `donor-${index + 1}`);
  const donorRank = raw.donorRank ?? index + 1;
  const { associatedEntityIds, rolesByEntity } = mergeEntityLinks({
    personId: id,
    primaryName: canonicalName,
    searchNames: fecSearchNames,
    entityLookup,
    existingAssociatedEntityIds: Array.isArray(raw.associatedEntityIds) ? raw.associatedEntityIds : [],
    existingRolesByEntity: normalizeRolesByEntity(raw.rolesByEntity),
  });

  return {
    id,
    canonicalName,
    displayName,
    commonName: normalizeWhitespace(raw.commonName) || undefined,
    aliases: buildAliases(canonicalName, fecSearchNames, Array.isArray(raw.aliases) ? raw.aliases : []),
    fecContributorId: typeof raw.fecContributorId === 'string' ? raw.fecContributorId : null,
    fecSearchNames,
    associatedEntityIds,
    rolesByEntity,
    primaryState: normalizeWhitespace(raw.primaryState) || undefined,
    primaryEmployer: normalizeWhitespace(raw.primaryEmployer) || undefined,
    primaryOccupation: normalizeWhitespace(raw.primaryOccupation) || undefined,
    donorRank,
    tier: raw.tier ?? inferTier(donorRank),
    donationSummary: normalizeDonationSummary(raw.donationSummary),
    lastVerifiedDate: typeof raw.lastVerifiedDate === 'string' ? raw.lastVerifiedDate : '',
    verificationStatus:
      raw.verificationStatus === 'manual' || raw.verificationStatus === 'unverified'
        ? raw.verificationStatus
        : 'pipeline',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
}

function mergeDiscoveredPeopleWithExisting(discoveredPeople, existingPeople, entityLookup) {
  const byId = new Map(existingPeople.map((person) => [person.id, person]));
  const byCanonicalName = new Map(existingPeople.map((person) => [person.canonicalName, person]));

  return discoveredPeople.map((person, index) => {
    const existing = byId.get(person.id) ?? byCanonicalName.get(person.canonicalName);
    if (!existing) return normalizeSeedPerson(person, index, entityLookup);

    const merged = normalizeSeedPerson(
      {
        ...existing,
        ...person,
        aliases: unique([...(existing.aliases ?? []), ...(person.aliases ?? [])]),
        fecSearchNames: unique([...(existing.fecSearchNames ?? []), ...(person.fecSearchNames ?? [])]),
        donationSummary: existing.donationSummary ?? person.donationSummary,
        notes: existing.notes || person.notes || '',
        lastVerifiedDate: existing.lastVerifiedDate || person.lastVerifiedDate || '',
      },
      index,
      entityLookup
    );

    if (existing.donationSummary && !person.donationSummary) {
      merged.donationSummary = existing.donationSummary;
    }
    if (existing.fecContributorId && !person.fecContributorId) {
      merged.fecContributorId = existing.fecContributorId;
    }

    return merged;
  });
}

function augmentPeopleWithDiscovered(existingPeople, discoveredPeople, entityLookup) {
  const augmented = existingPeople.map((person, index) => normalizeSeedPerson(person, index, entityLookup));
  const byId = new Map(augmented.map((person, index) => [person.id, index]));
  const byCanonicalName = new Map(augmented.map((person, index) => [person.canonicalName, index]));

  for (const discoveredPerson of discoveredPeople) {
    const matchIndex = byId.get(discoveredPerson.id) ?? byCanonicalName.get(discoveredPerson.canonicalName);
    if (matchIndex == null) {
      const appended = normalizeSeedPerson(discoveredPerson, augmented.length, entityLookup);
      appended.donorRank = augmented.length + 1;
      appended.tier = inferTier(appended.donorRank);
      augmented.push(appended);
      byId.set(appended.id, augmented.length - 1);
      byCanonicalName.set(appended.canonicalName, augmented.length - 1);
      continue;
    }

    const existing = augmented[matchIndex];
    const merged = normalizeSeedPerson(
      {
        ...existing,
        ...discoveredPerson,
        donorRank: existing.donorRank,
        tier: existing.tier,
        aliases: unique([...(existing.aliases ?? []), ...(discoveredPerson.aliases ?? [])]),
        fecSearchNames: unique([...(existing.fecSearchNames ?? []), ...(discoveredPerson.fecSearchNames ?? [])]),
        donationSummary: existing.donationSummary ?? discoveredPerson.donationSummary,
        notes: existing.notes || discoveredPerson.notes || '',
        lastVerifiedDate: existing.lastVerifiedDate || discoveredPerson.lastVerifiedDate || '',
      },
      matchIndex,
      entityLookup
    );

    if (existing.donationSummary && !discoveredPerson.donationSummary) {
      merged.donationSummary = existing.donationSummary;
    }
    if (existing.fecContributorId && !discoveredPerson.fecContributorId) {
      merged.fecContributorId = existing.fecContributorId;
    }

    augmented[matchIndex] = merged;
  }

  return augmented.map((person, index) => ({
    ...person,
    donorRank: person.donorRank ?? index + 1,
    tier: person.tier ?? inferTier(person.donorRank ?? index + 1),
  }));
}

async function discoverPeople(entityLookup, apiKey, { limit, perCycleLimit, discoveryPagesPerCycle, discoveryCycles }) {
  const seenSubIds = new Set();
  const donorMap = new Map();
  let recordsScanned = 0;
  let acceptedRows = 0;

  console.log(`Discovering donor seed list from Schedule A`);
  console.log(
    `Discovery cycles: ${discoveryCycles.join(', ')} | Pages/cycle: ${discoveryPagesPerCycle} | Per-cycle shortlist: ${perCycleLimit ?? 'all discovered'} | Final cap: ${limit ?? 'all shortlisted'}\n`
  );

  for (const cycle of discoveryCycles) {
    let lastIndexes = null;

    for (let page = 0; page < discoveryPagesPerCycle; page += 1) {
      const data = await fetchScheduleAPage(
        { apiKey, contributorName: null, cycles: [cycle], lastIndexes, sort: '-contribution_receipt_amount' },
        discoveryLimiter
      );
      const rows = Array.isArray(data.results) ? data.results : [];
      if (rows.length === 0) break;

      recordsScanned += rows.length;

      for (const row of rows) {
        const subId = row.sub_id ?? row.link_id ?? '';
        if (subId && seenSubIds.has(subId)) continue;
        if (subId) seenSubIds.add(subId);
        if (!isDiscoveryRow(row)) continue;

        acceptedRows += 1;
        const amount = parseAmount(row.contribution_receipt_amount);
        const contributorName = normalizeWhitespace(row.contributor_name);
        const contributorState = normalizeWhitespace(row.contributor_state ?? '');
        const donorKey = normalizeDonorKey(contributorName);

        const existing = donorMap.get(donorKey) ?? {
          donorKey,
          totalAmount: 0,
          cycleTotals: new Map(),
          nameTotals: new Map(),
          states: new Map(),
          employers: new Map(),
          occupations: new Map(),
        };

        existing.totalAmount += amount;
        bumpCounter(existing.cycleTotals, cycle, amount);
        bumpCounter(existing.nameTotals, contributorName, amount);
        bumpCounter(existing.states, contributorState, amount);
        bumpCounter(existing.employers, normalizeWhitespace(row.contributor_employer ?? ''), amount);
        bumpCounter(existing.occupations, normalizeWhitespace(row.contributor_occupation ?? ''), amount);
        donorMap.set(donorKey, existing);
      }

      lastIndexes = data.pagination?.last_indexes ?? null;
      const cursor = lastIndexes?.last_contribution_receipt_amount;
      console.log(`  discovery cycle ${cycle} page ${page + 1}/${discoveryPagesPerCycle} | donors=${donorMap.size} | cursor=${cursor ?? 'end'}`);

      if (!lastIndexes?.last_index || rows.length < PER_PAGE) break;
    }
  }

  const shortlistedKeys = perCycleLimit
    ? new Set(
        discoveryCycles.flatMap((cycle) =>
          Array.from(donorMap.values())
            .filter((donor) => (donor.cycleTotals.get(cycle) ?? 0) > 0)
            .sort((a, b) => (b.cycleTotals.get(cycle) ?? 0) - (a.cycleTotals.get(cycle) ?? 0))
            .slice(0, perCycleLimit)
            .map((donor) => donor.donorKey)
        )
      )
    : new Set(donorMap.keys());

  const ranked = Array.from(shortlistedKeys)
    .map((donorKey) => donorMap.get(donorKey))
    .filter(Boolean)
    .sort((a, b) => b.totalAmount - a.totalAmount);
  const seeded = limit ? ranked.slice(0, limit) : ranked;

  const usedIds = new Set();
  const people = seeded.map((aggregated, index) => {
    const canonicalName = chooseTopKey(aggregated.nameTotals);
    const fecSearchNames = takeTopKeys(aggregated.nameTotals, 5);
    const displayName = toDisplayName(canonicalName);
    let id = slugify(displayName);
    if (!id) id = `donor-${index + 1}`;
    while (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);

    const { associatedEntityIds, rolesByEntity } = mergeEntityLinks({
      personId: id,
      primaryName: canonicalName,
      searchNames: fecSearchNames,
      entityLookup,
    });
    const donorRank = index + 1;

    return {
      id,
      canonicalName,
      displayName,
      aliases: buildAliases(canonicalName, fecSearchNames),
      fecContributorId: null,
      fecSearchNames,
      associatedEntityIds,
      rolesByEntity,
      primaryState: chooseTopKey(aggregated.states) || undefined,
      primaryEmployer: chooseTopKey(aggregated.employers) || undefined,
      primaryOccupation: chooseTopKey(aggregated.occupations) || undefined,
      donorRank,
      tier: inferTier(donorRank),
      lastVerifiedDate: '',
      verificationStatus: 'pipeline',
      notes: '',
    };
  });

  return {
    people,
    discoveryMeta: {
      cyclesScanned: discoveryCycles,
      discoveryCycles,
      perCycleLimit,
      finalCap: limit,
      shortlistedDonors: ranked.length,
      pagesPerCycle: discoveryPagesPerCycle,
      recordsScanned,
      acceptedRows,
      methodology:
        'Seeded from the union of the top discovered donors in each cycle, grouped by normalized contributor name, then globally ranked and hydrated across all summary cycles since 2016. Exact all-donor ranking would require processing the full FEC individual-contributions bulk files.',
    },
  };
}

async function fetchPersonDonationSummary(person, apiKey) {
  const searchNames = unique([person.canonicalName, ...(person.fecSearchNames ?? [])].map(normalizeWhitespace));
  const normalizedSearchNames = new Set(searchNames.map(normalizeSearchName));
  const seenSubIds = new Set();
  const rawByCommitteeCycle = new Map();
  const states = new Map();
  const employers = new Map();
  const occupations = new Map();

  for (const searchName of searchNames) {
    let lastIndexes = null;

    while (true) {
      const data = await fetchScheduleAPage(
        {
          apiKey,
          contributorName: searchName,
          cycles: SUMMARY_CYCLES_SINCE_2016,
          lastIndexes,
          sort: '-contribution_receipt_date',
        },
        scheduleALimiter
      );

      const rows = Array.isArray(data.results) ? data.results : [];
      if (rows.length === 0) break;

      for (const row of rows) {
        const subId = row.sub_id ?? row.link_id ?? '';
        if (subId && seenSubIds.has(subId)) continue;
        if (subId) seenSubIds.add(subId);
        if (!isHydrationRow(row, normalizedSearchNames)) continue;

        const amount = parseAmount(row.contribution_receipt_amount);
        if (amount <= 0) continue;

        bumpCounter(states, normalizeWhitespace(row.contributor_state ?? ''), amount);
        bumpCounter(employers, normalizeWhitespace(row.contributor_employer ?? ''), amount);
        bumpCounter(occupations, normalizeWhitespace(row.contributor_occupation ?? ''), amount);

        const committeeId = normalizeWhitespace(row.committee_id ?? row.committee?.committee_id ?? '');
        if (!committeeId) continue;

        const cycle = Number.parseInt(String(row.two_year_transaction_period ?? 0), 10);
        if (!Number.isFinite(cycle) || cycle <= 0) continue;

        const key = `${committeeId}:${cycle}`;
        const contributionDate = normalizeWhitespace(row.contribution_receipt_date ?? '');
        const committeeName = normalizeWhitespace(row.committee?.name ?? row.committee_name ?? committeeId);
        const committeeParty = normalizeWhitespace(row.committee?.party ?? '') || null;
        const committeeType = normalizeWhitespace(row.committee?.committee_type ?? '') || null;

        const existing = rawByCommitteeCycle.get(key);
        if (existing) {
          existing.amount = roundCurrency(existing.amount + amount);
          if (contributionDate > existing.contributionDate) existing.contributionDate = contributionDate;
          if (!existing.committeeParty && committeeParty) existing.committeeParty = committeeParty;
          if (!existing.committeeType && committeeType) existing.committeeType = committeeType;
        } else {
          rawByCommitteeCycle.set(key, {
            committeeName,
            committeeId,
            committeeParty,
            committeeType,
            amount: roundCurrency(amount),
            cycle,
            contributionDate,
          });
        }
      }

      lastIndexes = data.pagination?.last_indexes ?? null;
      if (!lastIndexes?.last_index || rows.length < PER_PAGE) break;
    }
  }

  const raw = Array.from(rawByCommitteeCycle.values()).sort((a, b) => {
    if (b.cycle !== a.cycle) return b.cycle - a.cycle;
    if (b.contributionDate !== a.contributionDate) return b.contributionDate.localeCompare(a.contributionDate);
    return b.amount - a.amount;
  });

  const activeCycles = Array.from(new Set(raw.map((entry) => entry.cycle))).sort((a, b) => a - b);
  const recentCycle = activeCycles.length > 0 ? activeCycles[activeCycles.length - 1] : 0;

  let totalR = 0;
  let totalD = 0;
  let totalO = 0;
  let recentCycleR = 0;
  let recentCycleD = 0;
  let recentCycleO = 0;

  for (const entry of raw) {
    if (entry.committeeParty === 'REP') {
      totalR += entry.amount;
      if (entry.cycle === recentCycle) recentCycleR += entry.amount;
    } else if (entry.committeeParty === 'DEM') {
      totalD += entry.amount;
      if (entry.cycle === recentCycle) recentCycleD += entry.amount;
    } else {
      totalO += entry.amount;
      if (entry.cycle === recentCycle) recentCycleO += entry.amount;
    }
  }

  return {
    fecContributorId: stableContributorId(raw),
    primaryState: chooseTopKey(states) || person.primaryState,
    primaryEmployer: chooseTopKey(employers) || person.primaryEmployer,
    primaryOccupation: chooseTopKey(occupations) || person.primaryOccupation,
    donationSummary: {
      totalR: roundCurrency(totalR),
      totalD: roundCurrency(totalD),
      totalO: roundCurrency(totalO),
      recentCycleR: roundCurrency(recentCycleR),
      recentCycleD: roundCurrency(recentCycleD),
      recentCycleO: roundCurrency(recentCycleO),
      recentCycle: cycleLabel(recentCycle),
      activeCycles,
      raw,
      lastUpdated: today(),
    },
  };
}

async function writePeople(parsed, people, metaExtras = {}) {
  const previousMeta = Array.isArray(parsed) ? {} : parsed._meta ?? {};
  const mergedDiscoveryCycles = unique([
    ...((previousMeta.discoveryCycles ?? previousMeta.cyclesScanned ?? [])),
    ...((metaExtras.discoveryCycles ?? metaExtras.cyclesScanned ?? [])),
  ]);
  const output = Array.isArray(parsed)
    ? people
    : {
        ...parsed,
        _meta: {
          ...previousMeta,
          totalPeople: people.length,
          updatedAt: today(),
          formatVersion: PERSON_SCHEMA_VERSION,
          description: 'High-profile individual donor records for personal FEC contribution tracking.',
          source: 'FEC Schedule A API: /schedules/schedule_a/',
          summaryCycles: SUMMARY_CYCLES_SINCE_2016,
          ...metaExtras,
          shortlistedDonors: people.length,
          discoveryCycles: mergedDiscoveryCycles,
          cyclesScanned: mergedDiscoveryCycles,
        },
        people,
      };

  await writeFile(PEOPLE_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const loadedOverrides = await loadPeopleEntityOverrides(args.overrides);
  runtimeRoleOverrides =
    Object.keys(loadedOverrides.roleOverrides).length > 0
      ? loadedOverrides.roleOverrides
      : ROLE_OVERRIDES;
  const apiKey = process.env['FEC_API_KEY'];
  if (!apiKey) {
    console.error('ERROR: FEC_API_KEY is not set. Add it to your .env file.');
    process.exit(1);
  }

  const rawEntities = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  const entities = Array.isArray(rawEntities) ? rawEntities : rawEntities.entities;
  const entityLookup = buildEntityLookup(entities);

  let parsedPeople = { _meta: { totalPeople: 0, updatedAt: '', formatVersion: PERSON_SCHEMA_VERSION }, people: [] };
  try {
    parsedPeople = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  } catch {
    // No existing file — discovery will seed it.
  }

  let people = Array.isArray(parsedPeople.people)
    ? parsedPeople.people.map((person, index) => normalizeSeedPerson(person, index, entityLookup))
    : [];
  const existingPeople = people;
  let discoveryMeta = {};

  if (people.length === 0 || args.reseed) {
    const discovered = await discoverPeople(entityLookup, apiKey, args);
    people = args.augmentDiscovery
      ? augmentPeopleWithDiscovered(existingPeople, discovered.people, entityLookup)
      : mergeDiscoveredPeopleWithExisting(discovered.people, existingPeople, entityLookup);
    discoveryMeta = discovered.discoveryMeta;
  }

  if (Object.keys(discoveryMeta).length > 0) {
    await writePeople(parsedPeople, people, {
      ...discoveryMeta,
      contributorIdCoverage: people.filter((item) => item.fecContributorId).length,
      hydrationStatus: 'pending',
      hydratedPeople: 0,
    });
    console.log(`\n💾 discovery checkpoint saved (${people.length} people)\n`);
  }

  if (args.discoverOnly) {
    console.log('Discovery complete. Skipping hydration because --discover-only was provided.');
    return;
  }

  const hydrateStartIndex = Math.max(args.startRank - 1, 0);
  const hydrateEndExclusive = Math.min(
    args.endRank ?? (args.maxPeople ? hydrateStartIndex + args.maxPeople : people.length),
    people.length
  );
  const peopleToHydrate = people.slice(hydrateStartIndex, hydrateEndExclusive);

  console.log(
    `\nHydrating donationSummary for ranks ${hydrateStartIndex + 1}-${hydrateEndExclusive} of ${people.length} people across ${SUMMARY_CYCLES_SINCE_2016.join(', ')}...\n`
  );

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (let index = 0; index < peopleToHydrate.length; index += 1) {
    const person = peopleToHydrate[index];
    const absoluteIndex = hydrateStartIndex + index;
    const tag = `[${absoluteIndex + 1}/${people.length}]`;

    if (!args.force && isFresh(person)) {
      skipped += 1;
      continue;
    }

    console.log(`${tag} ${person.id} (${person.canonicalName})...`);

    try {
      const summary = await fetchPersonDonationSummary(person, apiKey);
      person.fecContributorId = summary.fecContributorId ?? null;
      person.primaryState = summary.primaryState ?? person.primaryState;
      person.primaryEmployer = summary.primaryEmployer ?? person.primaryEmployer;
      person.primaryOccupation = summary.primaryOccupation ?? person.primaryOccupation;
      person.donationSummary = summary.donationSummary;
      person.lastVerifiedDate = today();
      if (person.verificationStatus !== 'manual') person.verificationStatus = 'pipeline';
      fetched += 1;

      console.log(`  ✓ ${tag} ${person.displayName} — cycles:${person.donationSummary.activeCycles.join(', ') || 'none'} raw:${person.donationSummary.raw.length}`);

      if (fetched % args.writeInterval === 0) {
        await writePeople(parsedPeople, people, {
          ...discoveryMeta,
          contributorIdCoverage: people.filter((item) => item.fecContributorId).length,
          hydrationStatus: 'in_progress',
          hydratedPeople: people.filter((item) => item.donationSummary?.lastUpdated).length,
        });
        console.log(`  💾 saved (${fetched}/${peopleToHydrate.length - skipped} hydrated in this batch)\n`);
      }
    } catch (error) {
      failed += 1;
      person.lastVerifiedDate = '';
      console.error(`  ✗ ${tag} ${person.id} — ${error instanceof Error ? error.message : error}`);
    }
  }

  await writePeople(parsedPeople, people, {
    ...discoveryMeta,
    contributorIdCoverage: people.filter((item) => item.fecContributorId).length,
    hydrationStatus:
      failed > 0 || hydrateEndExclusive < people.length || hydrateStartIndex > 0 ? 'partial' : 'complete',
    hydratedPeople: people.filter((item) => item.donationSummary?.lastUpdated).length,
  });

  console.log('\n' + '─'.repeat(45));
  console.log(`Hydrated: ${fetched} / Skipped (fresh): ${skipped} / Failed: ${failed}`);
  console.log('─'.repeat(45));
  console.log('people.json updated. Commit manually when ready.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
