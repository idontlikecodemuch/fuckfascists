import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.join(__dirname, '../assets/data/people.json');
const ENTITIES_PATH = path.join(__dirname, '../assets/data/entities.json');
const OUTPUT_PATH = path.join(__dirname, '../tools/fec-bulk/reports/people-entity-review-queue.json');

const STOPWORDS = new Set([
  'america',
  'american',
  'and',
  'asset',
  'assets',
  'associates',
  'capital',
  'co',
  'company',
  'corp',
  'corporation',
  'first',
  'fund',
  'funds',
  'general',
  'global',
  'group',
  'holdings',
  'hospital',
  'health',
  'inc',
  'incorporated',
  'international',
  'investment',
  'investments',
  'llc',
  'llp',
  'lp',
  'ltd',
  'management',
  'medical',
  'national',
  'north',
  'operating',
  'partners',
  'properties',
  'property',
  'services',
  'self',
  'south',
  'state',
  'technologies',
  'technology',
  'the',
  'united',
]);

const GENERIC_EMPLOYER_COMPACTS = new Set([
  '',
  'NA',
  'NONE',
  'NOTEMPLOYED',
  'RETIRED',
  'SELF',
  'SELFEMPLOYED',
  'UNEMPLOYED',
]);

const NON_COMMERCIAL_EMPLOYER_PATTERNS = [
  /\bACTION\b/i,
  /\bCAMPAIGN\b/i,
  /\bCHARITY\b/i,
  /\bCOMMITTEE\b/i,
  /\bFOUNDATION\b/i,
  /\bFNDN\b/i,
  /\bFUND\b/i,
  /\bHOSPITAL\b/i,
  /\bPAC\b/i,
  /\bSCHOOL\b/i,
  /\bUNIVERSITY\b/i,
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    input: PEOPLE_PATH,
    entities: ENTITIES_PATH,
    output: OUTPUT_PATH,
    limit: 200,
  };

  for (const arg of argv) {
    if (arg.startsWith('--input=')) {
      const value = arg.slice('--input='.length).trim();
      if (value) args.input = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--entities=')) {
      const value = arg.slice('--entities='.length).trim();
      if (value) args.entities = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) args.output = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--limit=')) {
      const value = Number.parseInt(arg.slice('--limit='.length), 10);
      if (Number.isFinite(value) && value > 0) args.limit = value;
    }
  }

  return args;
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function compactText(value) {
  return normalizeWhitespace(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function tokenize(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function isGenericEmployer(value) {
  const compact = compactText(value);
  if (GENERIC_EMPLOYER_COMPACTS.has(compact)) return true;
  if (compact.startsWith('STATEOF')) return true;
  if (compact.startsWith('CITYOF')) return true;
  if (compact.startsWith('COUNTYOF')) return true;
  if (compact.includes('UNITEDSTATES')) return true;
  if (compact.includes('GOVERNMENT')) return true;
  if (compact.includes('SENATE')) return true;
  if (compact.includes('HOUSEOFREPRESENTATIVES')) return true;
  return false;
}

function isNonCommercialEmployer(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  if (!normalized) return false;
  return NON_COMMERCIAL_EMPLOYER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function looksCompanyLinked(occupation) {
  const normalized = normalizeWhitespace(occupation).toUpperCase();
  if (!normalized) return false;
  return [
    'CEO',
    'COO',
    'CTO',
    'CFO',
    'CHAIR',
    'CHAIRMAN',
    'DIRECTOR',
    'BOARD',
    'FOUNDER',
    'OWNER',
    'PRESIDENT',
    'EXECUTIVE',
    'PARTNER',
    'MANAGING',
    'INVESTOR',
    'ADVISOR',
    'COUNSEL',
  ].some((token) => normalized.includes(token));
}

function personTotal(person) {
  return (person.donationSummary?.raw ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function buildEntityIndex(entities) {
  return entities.map((entity) => {
    const aliases = [entity.name, entity.displayName, entity.canonicalName, ...(entity.aliases ?? [])]
      .map(normalizeWhitespace)
      .filter(Boolean);

    return {
      id: entity.id,
      name: entity.displayName ?? entity.name ?? entity.canonicalName ?? entity.id,
      aliases,
      compactAliases: new Set(aliases.map(compactText).filter(Boolean)),
      tokens: new Set(aliases.flatMap((alias) => tokenize(alias))),
    };
  });
}

function findEntityCandidates(person, entityIndex) {
  const employer = normalizeWhitespace(person.primaryEmployer);
  if (!employer || isGenericEmployer(employer) || isNonCommercialEmployer(employer)) return [];

  const employerCompact = compactText(employer);
  const employerTokens = [...new Set(tokenize(employer))];
  const suggestions = [];

  for (const entity of entityIndex) {
    let score = 0;
    let reason = null;

    if (employerCompact && entity.compactAliases.has(employerCompact)) {
      score = 100;
      reason = 'exact_employer_alias';
    } else if (employerTokens.length > 0) {
      const overlap = employerTokens.filter((token) => entity.tokens.has(token));
      if (overlap.length >= 2) {
        score = 60 + overlap.length * 5;
        reason = `distinctive_token_overlap:${overlap.join(',')}`;
      } else if (overlap.length === 1 && overlap[0].length >= 8 && employerTokens.length <= 2) {
        score = 55;
        reason = `single_distinctive_token_overlap:${overlap[0]}`;
      }
    }

    if (!reason) continue;

    suggestions.push({
      entityId: entity.id,
      entityName: entity.name,
      score,
      reason,
    });
  }

  return suggestions.sort((a, b) => b.score - a.score || a.entityId.localeCompare(b.entityId)).slice(0, 5);
}

function buildSearchQueries(person) {
  const displayName = normalizeWhitespace(person.displayName);
  const commonName = normalizeWhitespace(person.commonName);
  const employer = normalizeWhitespace(person.primaryEmployer);
  const occupation = normalizeWhitespace(person.primaryOccupation);
  const employerForSearch =
    employer && !isGenericEmployer(employer) && !isNonCommercialEmployer(employer) ? employer : '';
  const occupationForSearch = looksCompanyLinked(occupation) ? occupation : '';
  const queries = [
    [displayName, 'company founder shareholder board'].filter(Boolean).join(' '),
    commonName && commonName !== displayName ? [commonName, 'company founder shareholder board'].join(' ') : '',
    employerForSearch ? [displayName, employerForSearch].join(' ') : '',
    employerForSearch && occupationForSearch ? [displayName, occupationForSearch, employerForSearch].join(' ') : '',
    occupationForSearch ? [displayName, occupationForSearch, 'company'].join(' ') : '',
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(queries));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const peopleRaw = JSON.parse(await readFile(args.input, 'utf8'));
  const entitiesRaw = JSON.parse(await readFile(args.entities, 'utf8'));
  const people = Array.isArray(peopleRaw.people) ? peopleRaw.people : Array.isArray(peopleRaw) ? peopleRaw : [];
  const entities = Array.isArray(entitiesRaw.entities) ? entitiesRaw.entities : Array.isArray(entitiesRaw) ? entitiesRaw : [];
  const liveEntityIds = new Set(entities.map((entity) => entity.id).filter(Boolean));
  const entityIndex = buildEntityIndex(entities);

  const queue = people
    .filter((person) => !(person.associatedEntityIds ?? []).some((entityId) => liveEntityIds.has(entityId)))
    .sort((a, b) => (a.donorRank ?? Number.MAX_SAFE_INTEGER) - (b.donorRank ?? Number.MAX_SAFE_INTEGER))
    .slice(0, args.limit)
    .map((person) => {
      const candidateEntityMatches = findEntityCandidates(person, entityIndex);
      const employer = normalizeWhitespace(person.primaryEmployer);
      const occupation = normalizeWhitespace(person.primaryOccupation);
      const hasDistinctEmployer =
        Boolean(employer) && !isGenericEmployer(employer) && !isNonCommercialEmployer(employer);

      return {
        id: person.id,
        displayName: person.displayName,
        commonName: person.commonName ?? null,
        donorRank: person.donorRank ?? null,
        tier: person.tier ?? null,
        totalDonated: Math.round(personTotal(person)),
        totalR: person.donationSummary?.totalR ?? 0,
        totalD: person.donationSummary?.totalD ?? 0,
        primaryState: person.primaryState ?? null,
        primaryEmployer: employer || null,
        primaryOccupation: occupation || null,
        reviewReason:
          candidateEntityMatches.length > 0
            ? 'high-dollar unlinked donor with possible live entity candidates'
            : 'high-dollar unlinked donor requires manual web/entity review',
        needsEntityCreation: hasDistinctEmployer && candidateEntityMatches.length === 0 && looksCompanyLinked(occupation),
        candidateEntityMatches,
        suggestedSearchQueries: buildSearchQueries(person),
      };
    });

  const output = {
    _meta: {
      generatedAt: today(),
      totalCandidates: queue.length,
      sourcePeopleFile: path.relative(process.cwd(), args.input),
      sourceEntitiesFile: path.relative(process.cwd(), args.entities),
      description:
        'Manual review queue for high-priority people-to-entity linking. Generated from current people.json and live entities.json.',
      methodology:
        'Includes top-ranked unlinked donors first. Candidate entity matches are conservative heuristic suggestions from exact or distinctive employer-to-entity alias overlap and are not accepted links until reviewed.',
    },
    queue,
  };

  await writeFile(args.output, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`people-entity review queue saved to ${args.output}`);
  console.log(`queued candidates: ${queue.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
