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
const DEFAULT_BULK_TOP_PATH = path.join(__dirname, '../tools/fec-bulk/reports/top-donors-bulk-1000.json');
const DEFAULT_SUMMARY_PATH = path.join(__dirname, '../tools/fec-bulk/reports/top-donors-bulk-1000-merge-summary.json');
const DEFAULT_REVIEW_QUEUE_PATH = path.join(__dirname, '../tools/fec-bulk/reports/people-entity-review-queue.json');
const FORMAT_VERSION = '1.3';
const DISPLAY_SKIP_TOKENS = new Set(['MR', 'MRS', 'MS', 'MISS', 'DR', 'MD', 'PHD', 'DDS', 'DVM', 'ESQ']);
const COMMON_NAME_OVERRIDES = {
  'bernard-marcus': 'Bernie Marcus',
  'cantey-ergen': 'Candy Ergen',
  'charles-r-schwab': 'Charles Schwab',
  'frederick-smith': 'Fred Smith',
  'howard-w-lutnick': 'Howard Lutnick',
  'james-a-haslam': 'Jim Haslam',
  'james-kevin-scott': 'Kevin Scott',
  'james-sinegal': 'Jim Sinegal',
  'james-simons': 'Jim Simons',
  'jim-c-walton': 'Jim Walton',
  'j-christopher-reyes': 'Chris Reyes',
  'j-joe-ricketts': 'Joe Ricketts',
  'jonathan-d-gray': 'Jon Gray',
  'k-rupert-murdoch': 'Rupert Murdoch',
  'kenneth-c-griffin': 'Ken Griffin',
  'kenneth-l-fisher': 'Ken Fisher',
  'lawrence-ellison': 'Larry Ellison',
  'm-jude-reyes': 'Jude Reyes',
  'michael-r-bloomberg': 'Mike Bloomberg',
  'michael-sacks': 'Mike Sacks',
  'patrick-g-ryan': 'Pat Ryan',
  'paul-e-singer': 'Paul Singer',
  'thomas-f-steyer': 'Tom Steyer',
  'warren-a-stephens': 'Warren Stephens',
  'evan-williams': 'Ev Williams',
  'james-s-davis': 'Jim Davis',
  'john-l-nau': 'John Nau III',
};
const ROLE_OVERRIDES = {
  'miriam-adelson': {
    'las-vegas-sands': { role: 'Majority Shareholder', startYear: 2021, endYear: null },
  },
  'michael-r-bloomberg': {
    bloomberg: { role: 'Founder', startYear: 1981, endYear: null },
  },
  'elon-musk': {
    'x-twitter': { role: 'Owner & CTO', startYear: 2022, endYear: null },
    tesla: { role: 'CEO', startYear: 2008, endYear: null },
    spacex: { role: 'Founder & CEO', startYear: 2002, endYear: null },
    xai: { role: 'Founder', startYear: 2023, endYear: null },
  },
  'richard-e-uihlein': {
    uline: { role: 'Founder & President', startYear: 1980, endYear: null },
  },
  'richard-uihlein': {
    uline: { role: 'Founder & President', startYear: 1980, endYear: null },
  },
  'elizabeth-uihlein': {
    uline: { role: 'Co-Founder & President', startYear: 1980, endYear: null },
  },
  'stephen-a-schwarzman': {
    blackstone: { role: 'Co-Founder, Chairman & CEO', startYear: 1985, endYear: null },
  },
  'charles-r-schwab': {
    'charles-schwab': { role: 'Founder & Chairman', startYear: 1971, endYear: null },
  },
  'lawrence-ellison': {
    oracle: { role: 'Founder, Executive Chairman & CTO', startYear: 1977, endYear: null },
  },
  'reed-hastings': {
    netflix: { role: 'Co-Founder & Executive Chairman', startYear: 2023, endYear: null },
  },
  'k-rupert-murdoch': {
    'fox-corporation': { role: 'Chairman Emeritus', startYear: 2023, endYear: null },
  },
  'daniel-gilbert': {
    'rocket-companies': { role: 'Founder & Chairman', startYear: 1985, endYear: null },
  },
  'jonathan-d-gray': {
    blackstone: { role: 'President & COO', startYear: 2018, endYear: null },
  },
  'hamilton-e-james': {
    blackstone: { role: 'Executive Vice Chairman', startYear: 2018, endYear: null },
  },
  'allen-blue': {
    linkedin: { role: 'Co-Founder & VP, Product Strategy', startYear: 2002, endYear: null },
  },
  'brad-smith': {
    microsoft: { role: 'Vice Chair & President', startYear: 2021, endYear: null },
  },
  'barry-c-diller': {
    iac: { role: 'Chairman & Senior Executive', startYear: 1995, endYear: null },
    'dotdash-meredith': { role: 'Chairman & Senior Executive', startYear: 2021, endYear: null },
    angi: { role: 'Chairman & Senior Executive', startYear: 2017, endYear: null },
  },
  'safra-catz': {
    oracle: { role: 'CEO', startYear: 2014, endYear: null },
  },
  'jeff-bezos': {
    amazon: { role: 'Founder & Executive Chair', startYear: 1994, endYear: null },
    'washington-post': { role: 'Owner', startYear: 2013, endYear: null },
  },
  'peter-thiel': {
    palantir: { role: 'Co-Founder & Chair', startYear: 2003, endYear: null },
  },
  'alexander-c-karp': {
    palantir: { role: 'Co-Founder, CEO & Director', startYear: 2003, endYear: null },
  },
  'laurene-powell-jobs': {
    'the-atlantic': { role: 'Owner', startYear: 2017, endYear: null },
  },
  'sheldon-adelson': {
    'las-vegas-sands': { role: 'Founder & CEO', startYear: 1989, endYear: 2021 },
  },
  'brian-david-armstrong': {
    coinbase: { role: 'Co-Founder & CEO', startYear: 2012, endYear: null },
  },
  'sheryl-sandberg': {
    meta: { role: 'Former COO', startYear: 2008, endYear: 2022 },
  },
  'kenneth-c-griffin': {
    citadel: { role: 'Founder & CEO', startYear: 1990, endYear: null },
  },
  'ken-griffin': {
    citadel: { role: 'Founder & CEO', startYear: 1990, endYear: null },
  },
  'thomas-f-steyer': {
    'farallon-capital': { role: 'Founder', startYear: 1986, endYear: null },
  },
  'george-soros': {
    'soros-fund-management': { role: 'Founder & Chairman', startYear: 1970, endYear: null },
  },
  'jeff-yass': {
    'susquehanna-international-group': { role: 'Co-Founder & Managing Director', startYear: 1987, endYear: null },
  },
  'paul-e-singer': {
    'elliott-management': { role: 'Founder, President & Co-CEO', startYear: 1977, endYear: null },
  },
  'dustin-a-moskovitz': {
    asana: { role: 'Co-Founder & Board Chair', startYear: 2008, endYear: null },
  },
  'fred-eychaner': {
    'newsweb-corporation': { role: 'Chairman & President', startYear: null, endYear: null },
  },
  'james-simons': {
    'renaissance-technologies': { role: 'Founder & Former Chairman', startYear: 1982, endYear: 2024 },
  },
  'henry-laufer': {
    'renaissance-technologies': { role: 'Former Executive', startYear: null, endYear: null },
  },
  'robert-mercer': {
    'renaissance-technologies': { role: 'Former Co-CEO', startYear: null, endYear: null },
  },
  'diane-hendricks': {
    'abc-supply': { role: 'Co-Founder & Chair', startYear: 1982, endYear: null },
  },
  'warren-a-stephens': {
    'stephens-inc': { role: 'Chairman, President & CEO', startYear: null, endYear: null },
  },
  'deborah-simon': {
    'simon-property-group': { role: 'Former Senior Vice President & Family Shareholder', startYear: null, endYear: null },
  },
  'ronald-cameron': {
    mountaire: { role: 'Chairman', startYear: null, endYear: null },
  },
  'reid-hoffman': {
    linkedin: { role: 'Co-Founder', startYear: 2002, endYear: null },
  },
  'bernard-marcus': {
    'home-depot': { role: 'Co-Founder', startYear: 1978, endYear: null },
  },
  'arthur-blank': {
    'home-depot': { role: 'Co-Founder', startYear: 1978, endYear: null },
  },
  'irwin-jacobs': {
    qualcomm: { role: 'Co-Founder', startYear: 1985, endYear: null },
  },
  'james-a-haslam': {
    'pilot-flying-j': { role: 'Founder', startYear: 1958, endYear: null },
  },
  'donald-sussman': {
    'paloma-partners': { role: 'Founder', startYear: null, endYear: null },
  },
  's-donald-sussman': {
    'paloma-partners': { role: 'Founder & Chairman', startYear: null, endYear: null },
  },
  'patrick-g-ryan': {
    'ryan-specialty': { role: 'Founder & Executive Chairman', startYear: 2010, endYear: null },
  },
  'craig-j-duchossois': {
    'duchossois-group': { role: 'Executive Chairman', startYear: null, endYear: null },
  },
  'samuel-bankman-fried': {
    ftx: { role: 'Founder & Former CEO', startYear: 2019, endYear: 2022 },
  },
  'stephen-mandel': {
    'lone-pine-capital': { role: 'Founder', startYear: 1997, endYear: null },
  },
  'george-m-marcus': {
    'marcus-millichap': { role: 'Founder & Chairman', startYear: 1971, endYear: null },
  },
  'kelcy-warren': {
    'energy-transfer': { role: 'Executive Chairman', startYear: null, endYear: null },
  },
  'j-joe-ricketts': {
    'td-ameritrade': { role: 'Founder & Former Chairman', startYear: 1975, endYear: 2011 },
  },
  'thomas-peterffy': {
    'interactive-brokers': { role: 'Founder & Chairman', startYear: 1977, endYear: null },
  },
  'haim-saban': {
    'saban-entertainment': { role: 'Founder & Former Chairman & CEO', startYear: null, endYear: null },
  },
  'vivek-ramaswamy': {
    'roivant-sciences': { role: 'Founder & Former CEO', startYear: 2014, endYear: null },
  },
  'james-s-davis': {
    'new-balance': { role: 'Chairman', startYear: null, endYear: null },
  },
  'kenneth-l-fisher': {
    'fisher-investments': { role: 'Founder & Executive Chairman', startYear: 1979, endYear: null },
  },
  'michael-sacks': {
    'grosvenor-capital-management': { role: 'Chairman & CEO', startYear: null, endYear: null },
  },
  'john-l-nau': {
    'silver-eagle-beverages': { role: 'Chairman & CEO', startYear: null, endYear: null },
  },
  'james-kevin-scott': {
    microsoft: { role: 'CTO', startYear: 2017, endYear: null },
  },
  'frederick-smith': {
    fedex: { role: 'Founder & Former Executive Chairman', startYear: 1973, endYear: 2025 },
  },
  'lee-roy-mitchell': {
    cinemark: { role: 'Founder & Board Member', startYear: 1984, endYear: null },
  },
  'evan-williams': {
    medium: { role: 'Founder & Chairman', startYear: 2012, endYear: null },
  },
  'james-sinegal': {
    costco: { role: 'Co-Founder', startYear: 1983, endYear: null },
  },
  'eric-schmidt': {
    'google-alphabet': { role: 'Former CEO & Executive Chairman', startYear: 2001, endYear: 2019 },
  },
  'jan-koum': {
    meta: { role: 'Former Board Member', startYear: 2014, endYear: 2018 },
  },
  'rob-walton': {
    walmart: { role: 'Former Chairman', startYear: 1992, endYear: 2015 },
  },
  'jim-c-walton': {
    walmart: { role: 'Former Board Member', startYear: 2005, endYear: 2016 },
  },
  'mark-epstein': {
    qualcomm: { role: 'Senior Vice President', startYear: null, endYear: null },
  },
  'john-thompson': {
    microsoft: { role: 'Former Chairman & Board Member', startYear: 2012, endYear: 2021 },
  },
  'david-cohen': {
    comcast: { role: 'Former Senior Executive Vice President', startYear: null, endYear: null },
  },
  'michael-moritz': {
    'sequoia-capital': { role: 'Partner & Former Chair', startYear: null, endYear: null },
  },
  'jeffrey-sprecher': {
    'intercontinental-exchange': { role: 'Founder, Chair & CEO', startYear: 2000, endYear: null },
  },
  'j-christopher-reyes': {
    'reyes-holdings': { role: 'Co-Chairman', startYear: null, endYear: null },
  },
  'm-jude-reyes': {
    'reyes-holdings': { role: 'Vice Chairman', startYear: null, endYear: null },
  },
  'greg-brockman': {
    openai: { role: 'Co-Founder & President', startYear: 2015, endYear: null },
  },
  'stewart-w-bainum': {
    'choice-hotels': { role: 'Chairman of the Board', startYear: 1997, endYear: null },
  },
  'evan-goldberg': {
    oracle: { role: 'NetSuite Founder & Executive Vice President', startYear: 1998, endYear: null },
  },
  'cantey-ergen': {
    'dish-network': { role: 'Co-Founder & Senior Advisor', startYear: 1980, endYear: null },
  },
  'jacob-helberg': {
    palantir: { role: 'Senior Advisor to the CEO', startYear: null, endYear: null },
  },
};
let runtimeCommonNameOverrides = COMMON_NAME_OVERRIDES;
let runtimeRoleOverrides = ROLE_OVERRIDES;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    input: DEFAULT_BULK_TOP_PATH,
    output: PEOPLE_PATH,
    summary: DEFAULT_SUMMARY_PATH,
    overrides: DEFAULT_PEOPLE_ENTITY_OVERRIDES_PATH,
    reviewQueue: DEFAULT_REVIEW_QUEUE_PATH,
    keepExtra: true,
  };

  for (const arg of argv) {
    if (arg.startsWith('--input=')) {
      const value = arg.slice('--input='.length).trim();
      if (value) args.input = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) args.output = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--summary=')) {
      const value = arg.slice('--summary='.length).trim();
      if (value) args.summary = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--overrides=')) {
      const value = arg.slice('--overrides='.length).trim();
      if (value) args.overrides = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--review-queue=')) {
      const value = arg.slice('--review-queue='.length).trim();
      if (value) args.reviewQueue = path.resolve(process.cwd(), value);
    } else if (arg === '--keep-extra') {
      args.keepExtra = true;
    } else if (arg === '--drop-extra') {
      args.keepExtra = false;
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
    const restTokens = sanitizeDisplayTokens(stripSuffix(rest.split(' ').filter(Boolean)));
    if (restTokens.length > 1) {
      pieces.push(...restTokens.slice(1).map(toTitleCase));
    }
  }

  if (parsed.last) pieces.push(toTitleCase(parsed.last));
  return pieces.join(' ').trim() || toTitleCase(fecName);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanCanonicalName(name) {
  const cleaned = cleanNameToken(name);
  if (!cleaned) return '';

  if (!cleaned.includes(',')) return cleaned;

  const [rawLast, rawRest = ''] = cleaned.split(',', 2);
  const restTokens = sanitizeDisplayTokens(stripSuffix(rawRest.split(' ').filter(Boolean)));
  return [rawLast.trim(), restTokens.join(' ')].filter(Boolean).join(', ');
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

function normalizeMatchName(name) {
  const parsed = parseFecName(String(name).includes(',') ? name : toFecName(name));
  return [parsed.first, parsed.last].filter(Boolean).join(' ').toLowerCase();
}

function inferTier(rank) {
  if (!rank || rank < 1) return undefined;
  if (rank <= 50) return 1;
  if (rank <= 200) return 2;
  return 3;
}

function unique(values) {
  return Array.from(new Set(values.map(normalizeWhitespace).filter(Boolean)));
}

function normalizeRoleRecord(value) {
  return normalizeEntityRoleRecord(value);
}

function roleRecord(role, startYear = null, endYear = null) {
  return { role, startYear, endYear };
}

function normalizeCommonName(value, displayName = '') {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return undefined;
  if (normalized.toLowerCase() === normalizeWhitespace(displayName).toLowerCase()) return undefined;
  return normalized;
}

function compactText(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isStrongEmployerAlias(value) {
  const alias = normalizeWhitespace(value);
  if (!alias || alias.length < 4) return false;

  const compact = compactText(alias);
  if (compact.length < 4) return false;

  const blocked = new Set([
    'SELF',
    'NONE',
    'NA',
    'NAA',
    'N/A',
    'GENERAL',
    'GLOBAL',
    'UNITED',
    'AMERICAN',
    'ENTERPRISE',
    'SOUTHERN',
    'FOUNDATION',
    'GROUP',
    'HOLDINGS',
  ]);

  return !blocked.has(alias.toUpperCase()) && !blocked.has(compact);
}

function hasCompanyLinkedOccupation(occupation) {
  const normalized = normalizeWhitespace(occupation).toUpperCase();
  if (!normalized) return false;

  return [
    'CEO',
    'COO',
    'CTO',
    'CFO',
    'CHAIR',
    'CHAIRMAN',
    'PRESIDENT',
    'FOUNDER',
    'OWNER',
    'BOARD',
    'DIRECTOR',
    'EXECUTIVE',
    'VICE PRESIDENT',
    'VP',
    'MANAGING DIRECTOR',
    'PARTNER',
    'SENIOR ADVISOR',
    'GENERAL COUNSEL',
  ].some((token) => normalized.includes(token));
}

function buildEntityMatcher(entities) {
  const personLookup = new Map();
  const employerLookup = new Map();

  const addLookup = (lookup, key, value) => {
    if (!key) return;
    const matches = lookup.get(key) ?? [];
    matches.push(value);
    lookup.set(key, matches);
  };

  for (const entity of entities) {
    const publicFigure = typeof entity.publicFigureName === 'string' ? normalizeMatchName(entity.publicFigureName) : '';
    const ceo = typeof entity.ceoName === 'string' ? normalizeMatchName(entity.ceoName) : '';

    if (publicFigure) {
      addLookup(personLookup, publicFigure, { entityId: entity.id, role: 'Public Figure', source: 'publicFigureName' });
    }

    if (ceo) {
      addLookup(personLookup, ceo, { entityId: entity.id, role: 'CEO', source: 'ceoName' });
    }

    const employerAliases = unique([entity.name, ...(entity.aliases ?? [])]).filter(isStrongEmployerAlias);
    for (const alias of employerAliases) {
      addLookup(employerLookup, compactText(alias), { entityId: entity.id, role: null, source: 'employerAlias' });
    }
  }

  return { personLookup, employerLookup };
}

function matchEntitiesForPerson({ primaryName, commonName, aliases = [], searchNames = [], primaryEmployer, primaryOccupation, entityMatcher }) {
  const matches = [];
  const seen = new Set();
  const addMatch = (match) => {
    if (!match?.entityId || seen.has(match.entityId)) return;
    seen.add(match.entityId);
    matches.push(match);
  };

  const personKeys = new Set(
    unique([primaryName, commonName, ...aliases, ...searchNames])
      .map(normalizeMatchName)
      .filter(Boolean)
  );

  for (const key of personKeys) {
    const candidates = entityMatcher.personLookup.get(key) ?? [];
    for (const candidate of candidates) addMatch(candidate);
  }

  const employerKey = compactText(primaryEmployer);
  if (employerKey && hasCompanyLinkedOccupation(primaryOccupation)) {
    const candidates = entityMatcher.employerLookup.get(employerKey) ?? [];
    for (const candidate of candidates) addMatch(candidate);
  }

  return matches;
}

function mergeEntityLinks({
  personId,
  primaryName,
  commonName,
  aliases = [],
  searchNames,
  primaryEmployer,
  primaryOccupation,
  entityMatcher,
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
    if (role && !rolesByEntity[entityId]) rolesByEntity[entityId] = role;
  };

  for (const entityId of existingAssociatedEntityIds) {
    addEntity(entityId, normalizeRoleRecord(existingRolesByEntity[entityId]));
  }

  for (const [entityId, role] of Object.entries(existingRolesByEntity)) {
    addEntity(entityId, normalizeRoleRecord(role));
  }

  const matches = matchEntitiesForPerson({
    primaryName,
    commonName,
    aliases,
    searchNames,
    primaryEmployer,
    primaryOccupation,
    entityMatcher,
  });
  for (const match of matches) {
    addEntity(match.entityId, match.role ? roleRecord(match.role) : null);
  }

  for (const [entityId, override] of Object.entries(runtimeRoleOverrides[personId] ?? {})) {
    if (!seen.has(entityId)) {
      seen.add(entityId);
      associatedEntityIds.push(entityId);
    }
    rolesByEntity[entityId] = normalizeRoleRecord(override) ?? override;
  }

  return { associatedEntityIds, rolesByEntity };
}

function scorePerson(person) {
  const donorRank = Number.isFinite(person.donorRank) ? person.donorRank : 100_000;
  const aliasCount = Array.isArray(person.aliases) ? person.aliases.length : 0;
  const searchNameCount = Array.isArray(person.fecSearchNames) ? person.fecSearchNames.length : 0;
  const entityCount = Array.isArray(person.associatedEntityIds) ? person.associatedEntityIds.length : 0;
  const hydrated = Array.isArray(person.donationSummary?.raw) && person.donationSummary.raw.length > 0;
  const manual = person.verificationStatus === 'manual';

  return (
    (manual ? 1_000_000 : 0) +
    (hydrated ? 100_000 : 0) +
    entityCount * 1_000 +
    searchNameCount * 100 +
    aliasCount * 10 +
    Math.max(0, 10_000 - donorRank)
  );
}

function mergeRoles(people) {
  const rolesByEntity = {};

  for (const person of people) {
    const source = typeof person.rolesByEntity === 'object' && person.rolesByEntity !== null ? person.rolesByEntity : {};
    for (const [entityId, role] of Object.entries(source)) {
      if (rolesByEntity[entityId]) continue;
      const normalized = normalizeRoleRecord(role);
      if (normalized) rolesByEntity[entityId] = normalized;
    }
  }

  return rolesByEntity;
}

function bestExistingCanonicalName(names, donorKey, fallback) {
  const candidates = unique(names.map(cleanCanonicalName)).filter((name) => normalizeDonorKey(name) === donorKey);
  if (candidates.length === 0) return fallback;

  return candidates.sort((a, b) => {
    const aParsed = parseFecName(a);
    const bParsed = parseFecName(b);
    const aScore = aParsed.full.includes(',') ? aParsed.full.length : 0;
    const bScore = bParsed.full.includes(',') ? bParsed.full.length : 0;
    return bScore - aScore || b.length - a.length || a.localeCompare(b);
  })[0];
}

function ensureUniqueId(baseId, usedIds, rank) {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) suffix += 1;
  const nextId = `${baseId}-${suffix}`;
  usedIds.add(nextId);
  return nextId || `donor-${rank}`;
}

function buildExistingByKey(people) {
  const byKey = new Map();

  for (const person of people) {
    const names = unique([person.canonicalName, ...(person.fecSearchNames ?? [])]);
    const keys = new Set(names.map(normalizeDonorKey).filter(Boolean));
    for (const key of keys) {
      const bucket = byKey.get(key) ?? [];
      bucket.push(person);
      byKey.set(key, bucket);
    }
  }

  return byKey;
}

function pickDonationSummary(people) {
  return (
    people.find((person) => Array.isArray(person.donationSummary?.raw) && person.donationSummary.raw.length > 0)?.donationSummary ??
    people.find((person) => person.donationSummary)?.donationSummary
  );
}

function buildMergedPerson(donor, matches, usedIds, entityMatcher) {
  const sortedMatches = [...matches].sort((a, b) => scorePerson(b) - scorePerson(a));
  const primary = sortedMatches[0] ?? null;
  const canonicalCandidates = [
    cleanCanonicalName(donor.canonicalName),
    ...sortedMatches.map((person) => person.canonicalName),
    ...sortedMatches.flatMap((person) => person.fecSearchNames ?? []),
  ];
  const canonicalName = bestExistingCanonicalName(canonicalCandidates, donor.donorKey, cleanCanonicalName(donor.canonicalName));
  const displayName = normalizeWhitespace(primary?.displayName) || toDisplayName(canonicalName);
  const baseId = normalizeWhitespace(primary?.id) || slugify(displayName || canonicalName) || `donor-${donor.donorRankBulk}`;
  const commonName = normalizeCommonName(
    sortedMatches.find((person) => normalizeWhitespace(person.commonName))?.commonName ?? runtimeCommonNameOverrides[baseId],
    displayName
  );
  const aliases = unique([
    displayName,
    commonName,
    donor.displayName,
    toDisplayName(canonicalName),
    ...sortedMatches.flatMap((person) => person.aliases ?? []),
    ...sortedMatches.map((person) => toDisplayName(person.canonicalName)),
  ]);
  const fecSearchNames = unique([
    canonicalName,
    cleanCanonicalName(donor.canonicalName),
    ...sortedMatches.map((person) => person.canonicalName),
    ...sortedMatches.flatMap((person) => person.fecSearchNames ?? []),
  ]);
  const mergedExistingRoles = mergeRoles(sortedMatches);
  const { associatedEntityIds, rolesByEntity } = mergeEntityLinks({
    personId: baseId,
    primaryName: canonicalName,
    commonName,
    aliases,
    searchNames: unique([commonName, ...fecSearchNames, ...aliases]),
    primaryEmployer: normalizeWhitespace(donor.primaryEmployer) || normalizeWhitespace(primary?.primaryEmployer) || undefined,
    primaryOccupation: normalizeWhitespace(donor.primaryOccupation) || normalizeWhitespace(primary?.primaryOccupation) || undefined,
    entityMatcher,
    existingAssociatedEntityIds: unique(sortedMatches.flatMap((person) => person.associatedEntityIds ?? [])),
    existingRolesByEntity: mergedExistingRoles,
  });
  const notes = unique(sortedMatches.map((person) => person.notes ?? '')).join(' | ');
  const contributorId = sortedMatches.find((person) => typeof person.fecContributorId === 'string' && person.fecContributorId.trim().length > 0)?.fecContributorId ?? null;
  const verificationStatus = sortedMatches.some((person) => person.verificationStatus === 'manual')
    ? 'manual'
    : sortedMatches.some((person) => person.verificationStatus === 'pipeline')
      ? 'pipeline'
      : 'unverified';
  const lastVerifiedDate =
    normalizeWhitespace(
      sortedMatches.find((person) => normalizeWhitespace(person.lastVerifiedDate))?.lastVerifiedDate ?? ''
    ) || today();

  return {
    id: ensureUniqueId(baseId, usedIds, donor.donorRankBulk),
    canonicalName,
    displayName,
    commonName,
    aliases,
    fecContributorId: contributorId,
    fecSearchNames,
    associatedEntityIds,
    rolesByEntity,
    primaryState: normalizeWhitespace(donor.primaryState) || normalizeWhitespace(primary?.primaryState) || undefined,
    primaryEmployer: normalizeWhitespace(donor.primaryEmployer) || normalizeWhitespace(primary?.primaryEmployer) || undefined,
    primaryOccupation: normalizeWhitespace(donor.primaryOccupation) || normalizeWhitespace(primary?.primaryOccupation) || undefined,
    donorRank: donor.donorRankBulk,
    tier: inferTier(donor.donorRankBulk),
    donationSummary: pickDonationSummary(sortedMatches),
    lastVerifiedDate,
    verificationStatus,
    notes,
  };
}

function buildMeta(existingMeta, bulkMeta, people, duplicateKeysCollapsed, duplicateDisplayNamesCollapsed, hadExistingPeople, currentEntityIds) {
  const hydratedPeople = people.filter((person) => Array.isArray(person.donationSummary?.raw) && person.donationSummary.raw.length > 0).length;
  const contributorIdCoverage = people.filter((person) => typeof person.fecContributorId === 'string' && person.fecContributorId.trim().length > 0).length;
  const linkedPeople = people.filter((person) => Array.isArray(person.associatedEntityIds) && person.associatedEntityIds.length > 0).length;
  const uniqueEntityIds = new Set(people.flatMap((person) => person.associatedEntityIds ?? []));
  const forwardReferencedEntityIds = Array.from(uniqueEntityIds).filter((entityId) => !currentEntityIds.has(entityId));

  return {
    totalPeople: people.length,
    updatedAt: today(),
    formatVersion: FORMAT_VERSION,
    description: existingMeta?.description ?? 'High-profile individual donor records for personal FEC contribution tracking.',
    source:
      'FEC bulk individual contributions (by_date files) for donor ranking, with entity matching and any existing Schedule A API hydration preserved when available.',
    cyclesScanned: Array.isArray(bulkMeta?.cycles) ? bulkMeta.cycles : existingMeta?.cyclesScanned ?? [2016, 2018, 2020, 2022, 2024, 2026],
    methodology:
      'Ranked from FEC bulk individual-contribution files by normalized donor key across selected cycles; people-first matching checks donor names, common names, and exact employer aliases before preserving any existing hydrated Schedule A summaries, aliases, and entity links. Curated person-to-entity overrides come from scripts/data/people-entity-overrides.json; unresolved high-priority cases belong in tools/fec-bulk/reports/people-entity-review-queue.json.',
    contributorIdCoverage,
    summaryCycles: existingMeta?.summaryCycles ?? [2016, 2018, 2020, 2022, 2024, 2026],
    discoveryCycles: Array.isArray(bulkMeta?.cycles) ? bulkMeta.cycles : existingMeta?.discoveryCycles ?? [2016, 2018, 2020, 2022, 2024, 2026],
    bulkTopCount: bulkMeta?.top ?? people.length,
    bulkDonorsAggregated: bulkMeta?.donorsAggregated ?? null,
    bulkValidation: hadExistingPeople ? bulkMeta?.validation ?? null : null,
    duplicateKeysCollapsed,
    duplicateDisplayNamesCollapsed,
    linkedPeople,
    uniqueEntityIds: uniqueEntityIds.size,
    forwardReferencedEntityIds,
    hydrationStatus: hydratedPeople === 0 ? 'pending' : hydratedPeople === people.length ? 'complete' : 'partial',
    hydratedPeople,
  };
}

function appendExtras(mergedPeople, existingPeople, usedIds) {
  const seenKeys = new Set(mergedPeople.map((person) => normalizeDonorKey(person.canonicalName)).filter(Boolean));
  const extras = [];

  for (const person of existingPeople) {
    const key = normalizeDonorKey(person.canonicalName);
    if (!key || seenKeys.has(key)) continue;

    const nextId = ensureUniqueId(person.id, usedIds, person.donorRank ?? extras.length + 1);
    extras.push({
      ...person,
      id: nextId,
    });
    seenKeys.add(key);
  }

  return mergedPeople.concat(extras);
}

function manualPeopleFromOverrides(rawOverrides, mergedPeople, usedIds) {
  const overridePeople = typeof rawOverrides?.people === 'object' && rawOverrides.people !== null ? rawOverrides.people : {};
  const existingIds = new Set(mergedPeople.map((person) => person.id));
  const existingDonorKeys = new Set(mergedPeople.map((person) => normalizeDonorKey(person.canonicalName)).filter(Boolean));
  const manualPeople = [];

  for (const [personId, entry] of Object.entries(overridePeople)) {
    const person = typeof entry?.person === 'object' && entry.person !== null ? entry.person : null;
    if (!person || existingIds.has(personId)) continue;

    const canonicalName = cleanCanonicalName(person.canonicalName);
    const displayName = normalizeWhitespace(person.displayName) || toDisplayName(canonicalName);
    const donorKey = normalizeDonorKey(canonicalName);
    if (!canonicalName || !displayName || existingDonorKeys.has(donorKey)) continue;

    const commonName = normalizeCommonName(person.commonName, displayName);
    const roleOverrides = runtimeRoleOverrides[personId] ?? {};
    const rolesByEntity = {};
    for (const [entityId, role] of Object.entries(roleOverrides)) {
      const normalized = normalizeRoleRecord(role);
      if (normalized) rolesByEntity[entityId] = normalized;
    }

    const associatedEntityIds = Object.keys(rolesByEntity);
    manualPeople.push({
      id: ensureUniqueId(personId, usedIds, manualPeople.length + 1),
      canonicalName,
      displayName,
      commonName,
      aliases: unique([
        displayName,
        commonName,
        toDisplayName(canonicalName),
        ...(Array.isArray(person.aliases) ? person.aliases : []),
      ]),
      fecContributorId: normalizeWhitespace(person.fecContributorId) || null,
      fecSearchNames: unique([
        canonicalName,
        ...(Array.isArray(person.fecSearchNames) ? person.fecSearchNames : []),
      ]),
      associatedEntityIds,
      rolesByEntity,
      primaryState: normalizeWhitespace(person.primaryState) || undefined,
      primaryEmployer: normalizeWhitespace(person.primaryEmployer) || undefined,
      primaryOccupation: normalizeWhitespace(person.primaryOccupation) || undefined,
      donorRank: Number.isFinite(person.donorRank) ? person.donorRank : undefined,
      tier: Number.isFinite(person.donorRank) ? inferTier(person.donorRank) : undefined,
      lastVerifiedDate: normalizeWhitespace(person.lastVerifiedDate) || today(),
      verificationStatus: normalizeWhitespace(person.verificationStatus) || 'manual',
      notes: normalizeWhitespace(person.notes),
    });
    existingIds.add(personId);
    if (donorKey) existingDonorKeys.add(donorKey);
  }

  return manualPeople;
}

function pickBetterCanonicalName(a, b) {
  const candidates = unique([a, b]).filter(Boolean);
  if (candidates.length === 0) return a || b || '';
  return candidates.sort((left, right) => right.length - left.length || left.localeCompare(right))[0];
}

function mergeRoleMaps(left = {}, right = {}) {
  const merged = { ...left };
  for (const [entityId, role] of Object.entries(right)) {
    const normalized = normalizeRoleRecord(role);
    if (!normalized) continue;
    const existing = normalizeRoleRecord(merged[entityId]);
    if (!existing) {
      merged[entityId] = normalized;
      continue;
    }
    if (existing.role === 'Public Figure' && normalized.role !== 'Public Figure') {
      merged[entityId] = normalized;
      continue;
    }
    if (existing.role === 'CEO' && !['CEO', 'Public Figure'].includes(normalized.role)) {
      merged[entityId] = normalized;
    }
  }
  return merged;
}

function collapseDuplicateDisplayNames(people) {
  const byDisplay = new Map();

  for (const person of people) {
    const key = normalizeWhitespace(person.displayName).toLowerCase();
    const bucket = byDisplay.get(key) ?? [];
    bucket.push(person);
    byDisplay.set(key, bucket);
  }

  const collapsed = [];
  const duplicateSummaries = [];

  for (const [displayKey, group] of byDisplay.entries()) {
    if (group.length === 1) {
      collapsed.push(group[0]);
      continue;
    }

    const sorted = [...group].sort((a, b) => (a.donorRank ?? 100_000) - (b.donorRank ?? 100_000));
    const primary = { ...sorted[0] };
    for (const extra of sorted.slice(1)) {
      primary.canonicalName = pickBetterCanonicalName(primary.canonicalName, extra.canonicalName);
      primary.commonName =
        normalizeCommonName(primary.commonName, primary.displayName) ??
        normalizeCommonName(extra.commonName, primary.displayName);
      primary.aliases = unique([...(primary.aliases ?? []), ...(extra.aliases ?? [])]);
      primary.fecSearchNames = unique([...(primary.fecSearchNames ?? []), ...(extra.fecSearchNames ?? [])]);
      primary.associatedEntityIds = unique([...(primary.associatedEntityIds ?? []), ...(extra.associatedEntityIds ?? [])]);
      primary.rolesByEntity = mergeRoleMaps(primary.rolesByEntity, extra.rolesByEntity);
      primary.primaryState = primary.primaryState || extra.primaryState;
      primary.primaryEmployer = primary.primaryEmployer || extra.primaryEmployer;
      primary.primaryOccupation = primary.primaryOccupation || extra.primaryOccupation;
      primary.donationSummary = primary.donationSummary ?? extra.donationSummary;
      primary.verificationStatus =
        primary.verificationStatus === 'manual' || extra.verificationStatus === 'manual'
          ? 'manual'
          : primary.verificationStatus === 'pipeline' || extra.verificationStatus === 'pipeline'
            ? 'pipeline'
            : 'unverified';
      primary.notes = unique([primary.notes ?? '', extra.notes ?? '']).join(' | ');
    }

    collapsed.push(primary);
    duplicateSummaries.push({
      displayName: sorted[0].displayName,
      ids: sorted.map((person) => person.id),
      canonicalNames: sorted.map((person) => person.canonicalName),
      keptId: primary.id,
    });
  }

  collapsed.sort((a, b) => (a.donorRank ?? 100_000) - (b.donorRank ?? 100_000));
  collapsed.forEach((person, index) => {
    person.donorRank = index + 1;
    person.tier = inferTier(index + 1);
  });

  return { people: collapsed, duplicateSummaries };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const loadedOverrides = await loadPeopleEntityOverrides(args.overrides);
  runtimeCommonNameOverrides =
    Object.keys(loadedOverrides.commonNameOverrides).length > 0
      ? loadedOverrides.commonNameOverrides
      : COMMON_NAME_OVERRIDES;
  runtimeRoleOverrides =
    Object.keys(loadedOverrides.roleOverrides).length > 0
      ? loadedOverrides.roleOverrides
      : ROLE_OVERRIDES;
  const existingRaw = JSON.parse(await readFile(PEOPLE_PATH, 'utf8'));
  const entitiesRaw = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  const bulkRaw = JSON.parse(await readFile(args.input, 'utf8'));
  const existingPeople = Array.isArray(existingRaw.people) ? existingRaw.people : Array.isArray(existingRaw) ? existingRaw : [];
  const hadExistingPeople = existingPeople.length > 0;
  const entities = Array.isArray(entitiesRaw.entities) ? entitiesRaw.entities : Array.isArray(entitiesRaw) ? entitiesRaw : [];
  const currentEntityIds = new Set(entities.map((entity) => entity.id).filter(Boolean));
  const donors = Array.isArray(bulkRaw.donors) ? bulkRaw.donors : [];
  const existingByKey = buildExistingByKey(existingPeople);
  const entityMatcher = buildEntityMatcher(entities);
  const usedIds = new Set();
  let duplicateKeysCollapsed = 0;

  let mergedPeople = donors.map((donor) => {
    const matches = existingByKey.get(donor.donorKey) ?? [];
    if (matches.length > 1) duplicateKeysCollapsed += 1;
    return buildMergedPerson(donor, matches, usedIds, entityMatcher);
  });

  const collapsedDisplayNames = collapseDuplicateDisplayNames(mergedPeople);
  mergedPeople = collapsedDisplayNames.people;

  if (args.keepExtra) {
    mergedPeople = appendExtras(mergedPeople, existingPeople, usedIds);
  }

  const manualOverridePeople = manualPeopleFromOverrides(loadedOverrides.raw, mergedPeople, usedIds);
  mergedPeople = mergedPeople.concat(manualOverridePeople);

  const nextPeopleFile = {
    _meta: buildMeta(
      existingRaw._meta ?? {},
      bulkRaw._meta ?? {},
      mergedPeople,
      duplicateKeysCollapsed,
      collapsedDisplayNames.duplicateSummaries.length,
      hadExistingPeople,
      currentEntityIds
    ),
    people: mergedPeople,
  };

  const mergeSummary = {
    generatedAt: today(),
    input: args.input,
    output: args.output,
    donorCount: donors.length,
    mergedPeopleCount: mergedPeople.length,
    duplicateKeysCollapsed,
    duplicateDisplayNamesCollapsed: collapsedDisplayNames.duplicateSummaries.length,
    matchedDonors: donors.filter((donor) => donor.validation?.status === 'matched').length,
    ambiguousDonors: donors.filter((donor) => donor.validation?.status === 'ambiguous').length,
    missingDonors: donors.filter((donor) => donor.validation?.status === 'missing').length,
    manualOverridePeople: manualOverridePeople.length,
    hydratedPeople: nextPeopleFile._meta.hydratedPeople,
    linkedPeople: nextPeopleFile._meta.linkedPeople,
    uniqueEntityIds: nextPeopleFile._meta.uniqueEntityIds,
    forwardReferencedEntityIds: nextPeopleFile._meta.forwardReferencedEntityIds,
    keptExtraPeople: args.keepExtra ? mergedPeople.length - donors.length : 0,
    collapsedDisplayNames: collapsedDisplayNames.duplicateSummaries,
    sampleCollapsedDuplicates: donors
      .map((donor) => ({
        donorKey: donor.donorKey,
        canonicalName: donor.canonicalName,
        matchedIds: (existingByKey.get(donor.donorKey) ?? []).map((person) => person.id),
      }))
      .filter((item) => item.matchedIds.length > 1)
      .slice(0, 50),
  };

  await writeFile(args.output, JSON.stringify(nextPeopleFile, null, 2) + '\n', 'utf8');
  await writeFile(args.summary, JSON.stringify(mergeSummary, null, 2) + '\n', 'utf8');

  console.log(`Synced ${mergedPeople.length} people from ${donors.length} bulk-ranked donors.`);
  console.log(`Collapsed ${duplicateKeysCollapsed} duplicate donor keys from existing people.json.`);
  console.log(`Wrote ${args.output}`);
  console.log(`Wrote ${args.summary}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
