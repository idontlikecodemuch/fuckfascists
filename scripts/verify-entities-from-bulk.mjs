import { createReadStream } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { jaroWinkler } from './lib/jaroWinkler.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENTITIES_PATH = path.join(ROOT, 'assets/data/entities.json');
const BULK_ROOT = path.join(ROOT, 'tools/fec-bulk');
const REPORT_PATH = path.join(ROOT, 'tools/fec-bulk/reports/entity-bulk-verification-review.json');
const CM_FILE_PATTERN = /^cm(?: \d+)?\.txt$/i;
const DEFAULT_AUTO_THRESHOLD = 0.9;
const DEFAULT_NEAR_THRESHOLD = 0.78;
const PAC_TYPES = new Set(['N', 'Q']);

const CM_FIELD = {
  committeeId: 0,
  committeeName: 1,
  committeeType: 9,
  connectedOrganizationName: 13,
};

function parseArgs(argv) {
  const args = {
    input: ENTITIES_PATH,
    output: ENTITIES_PATH,
    report: REPORT_PATH,
    dryRun: false,
    ids: [],
    lastVerifiedDate: '',
    markNoMatchNull: false,
    autoThreshold: DEFAULT_AUTO_THRESHOLD,
    nearThreshold: DEFAULT_NEAR_THRESHOLD,
  };

  for (const arg of argv) {
    if (arg.startsWith('--input=')) args.input = path.resolve(process.cwd(), arg.slice('--input='.length));
    else if (arg.startsWith('--output=')) args.output = path.resolve(process.cwd(), arg.slice('--output='.length));
    else if (arg.startsWith('--report=')) args.report = path.resolve(process.cwd(), arg.slice('--report='.length));
    else if (arg.startsWith('--ids=')) args.ids = arg.slice('--ids='.length).split(',').map((id) => id.trim()).filter(Boolean);
    else if (arg.startsWith('--last-verified-date=')) args.lastVerifiedDate = arg.slice('--last-verified-date='.length).trim();
    else if (arg.startsWith('--auto-threshold=')) args.autoThreshold = Number.parseFloat(arg.slice('--auto-threshold='.length));
    else if (arg.startsWith('--near-threshold=')) args.nearThreshold = Number.parseFloat(arg.slice('--near-threshold='.length));
    else if (arg === '--mark-no-match-null') args.markNoMatchNull = true;
    else if (arg === '--dry-run') args.dryRun = true;
  }

  if (!Number.isFinite(args.autoThreshold)) args.autoThreshold = DEFAULT_AUTO_THRESHOLD;
  if (!Number.isFinite(args.nearThreshold)) args.nearThreshold = DEFAULT_NEAR_THRESHOLD;
  return args;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeCommitteeId(value) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  return /^C\d{8}$/.test(normalized) ? normalized : '';
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const LEGAL_SUFFIXES = new Set([
  'ag',
  'co',
  'company',
  'corp',
  'corporation',
  'group',
  'holdings',
  'inc',
  'incorporated',
  'international',
  'llc',
  'lp',
  'ltd',
  'mutual',
  'na',
  'plc',
  'sa',
]);

const PAC_WORDS = new Set([
  'action',
  'committee',
  'employee',
  'employees',
  'fund',
  'government',
  'good',
  'pac',
  'political',
]);

const EMPTY_ORG_VALUES = new Set(['', 'none', 'n a', 'na']);

function stripWords(value, words) {
  return normalize(value)
    .split(' ')
    .filter((word) => word && !words.has(word))
    .join(' ');
}

function stripLegalSuffixes(value) {
  const words = normalize(value).split(' ').filter(Boolean);
  while (words.length > 1 && LEGAL_SUFFIXES.has(words[words.length - 1])) words.pop();
  return words.join(' ');
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values.flat()) {
    const normalized = normalize(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(value);
  }
  return out;
}

function isCampaignLike(committeeName) {
  const normalized = normalize(committeeName);
  return /\b(for congress|for senate|for president|for governor|victory fund|leadership pac)\b/.test(normalized);
}

async function readLines(filePath, onLine) {
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line) await onLine(line);
  }
}

async function loadCommittees() {
  const entries = await readdir(BULK_ROOT, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && CM_FILE_PATTERN.test(entry.name))
    .map((entry) => path.join(BULK_ROOT, entry.name))
    .sort();

  const committees = new Map();
  for (const filePath of files) {
    await readLines(filePath, (line) => {
      const fields = line.split('|');
      const committeeId = normalizeCommitteeId(fields[CM_FIELD.committeeId]);
      if (!committeeId) return;
      const committeeType = normalizeWhitespace(fields[CM_FIELD.committeeType]).toUpperCase();
      if (!PAC_TYPES.has(committeeType)) return;
      const committeeName = normalizeWhitespace(fields[CM_FIELD.committeeName]);
      if (!committeeName || isCampaignLike(committeeName)) return;
      const connectedOrganizationName = normalizeWhitespace(fields[CM_FIELD.connectedOrganizationName]);
      const previous = committees.get(committeeId);
      committees.set(committeeId, {
        committeeId,
        committeeName: committeeName || previous?.committeeName || committeeId,
        committeeType,
        connectedOrganizationName: connectedOrganizationName || previous?.connectedOrganizationName || '',
        sourceFiles: [...new Set([...(previous?.sourceFiles ?? []), path.basename(filePath)])],
      });
    });
  }

  return [...committees.values()];
}

function searchNamesForEntity(entity) {
  return unique([
    entity.fecSearchNames ?? [],
    entity.canonicalName,
    stripLegalSuffixes(entity.canonicalName),
    (entity.aliases ?? []).filter((alias) => normalize(alias).length >= 3),
  ]);
}

function candidateNames(committee) {
  const connectedOrganizationName = normalize(committee.connectedOrganizationName);
  const candidates = [
    { value: committee.connectedOrganizationName, source: 'connectedOrganizationName' },
    { value: stripLegalSuffixes(committee.connectedOrganizationName), source: 'connectedOrganizationName' },
    { value: committee.committeeName, source: 'committeeName' },
    { value: stripWords(committee.committeeName, PAC_WORDS), source: 'committeeNameStripped' },
    { value: stripLegalSuffixes(stripWords(committee.committeeName, PAC_WORDS)), source: 'committeeNameStripped' },
  ];
  const seen = new Set();
  const indexed = [];
  for (const entry of candidates) {
    const normalized = normalize(entry.value);
    const key = `${entry.source}:${normalized}`;
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    indexed.push({
      ...entry,
      normalized,
      connectedOrganizationName,
    });
  }
  return indexed;
}

function indexCommittee(committee) {
  return {
    ...committee,
    indexedNames: candidateNames(committee),
  };
}

function tokenCount(value) {
  return normalize(value).split(' ').filter(Boolean).length;
}

function pairScore(searchName, candidateName) {
  const left = normalize(searchName);
  const right = normalize(candidateName);
  if (!left || !right) return 0;
  let score = jaroWinkler(left, right);
  const leftTokens = tokenCount(left);
  const rightTokens = tokenCount(right);

  if (left.length >= 4 && right.length >= 4 && leftTokens > 1 && wholePhraseContains(right, left)) {
    score = Math.max(score, 0.94);
  }
  if (left.length >= 4 && right.length >= 4 && rightTokens > 1 && wholePhraseContains(left, right)) {
    score = Math.max(score, 0.92);
  }
  return score;
}

function wholePhraseContains(haystack, needle) {
  const left = normalize(haystack);
  const right = normalize(needle);
  if (!left || !right) return false;
  return ` ${left} `.includes(` ${right} `);
}

function hasWholeToken(haystack, token) {
  const normalizedToken = normalize(token);
  if (!normalizedToken || normalizedToken.includes(' ')) return false;
  return normalize(haystack).split(' ').includes(normalizedToken);
}

function leadingTokenMatches(left, right) {
  const leftTokens = normalize(left).split(' ').filter((token) => token && token !== 'the');
  const rightTokens = normalize(right).split(' ').filter((token) => token && token !== 'the');
  let count = 0;
  const max = Math.min(leftTokens.length, rightTokens.length);
  for (let index = 0; index < max; index += 1) {
    if (leftTokens[index] !== rightTokens[index]) break;
    count += 1;
  }
  return count;
}

function isUsableConnectedOrg(value) {
  return !EMPTY_ORG_VALUES.has(normalize(value));
}

function isAutoEvidence(match) {
  if (!match?.committee) return false;
  const searchName = normalize(match.searchName);
  const candidateName = normalize(match.candidateName);
  if (!searchName || !candidateName) return false;

  const searchTokens = tokenCount(searchName);
  const candidateTokens = tokenCount(candidateName);
  const hasConnectedOrg = isUsableConnectedOrg(match.committee.connectedOrganizationName);

  if (match.candidateSource === 'connectedOrganizationName' && hasConnectedOrg) {
    if (searchTokens === 1) {
      return (
        (searchName === candidateName || hasWholeToken(candidateName, searchName)) &&
        hasWholeToken(match.committee.committeeName, searchName)
      );
    }
    return leadingTokenMatches(candidateName, stripLegalSuffixes(searchName)) >= Math.min(2, searchTokens);
  }

  if (match.candidateSource === 'committeeName' || match.candidateSource === 'committeeNameStripped') {
    if (searchTokens < 2) return false;
    return leadingTokenMatches(candidateName, stripLegalSuffixes(searchName)) >= Math.min(2, searchTokens);
  }

  return false;
}

function bestCommitteeMatch(entity, committees) {
  const searchNames = searchNamesForEntity(entity);
  let bestAny = null;
  let bestAuto = null;

  for (const committee of committees) {
    for (const searchName of searchNames) {
      for (const candidate of committee.indexedNames) {
        const score = pairScore(searchName, candidate.value);
        const match = {
            score,
            searchName,
            candidateName: candidate.value,
            candidateSource: candidate.source,
            committee,
        };
        if (!bestAny || score > bestAny.score) {
          bestAny = match;
        }
        if (isAutoEvidence(match) && (!bestAuto || score > bestAuto.score)) {
          bestAuto = match;
        }
      }
    }
  }

  const empty = { score: 0, searchName: '', candidateName: '', candidateSource: '', committee: null };
  return { bestAny: bestAny ?? empty, bestAuto: bestAuto ?? empty };
}

function targetEntities(entities, args) {
  const idFilter = new Set(args.ids);
  return entities.filter((entity) => {
    if (args.ids.length > 0 && !idFilter.has(entity.id)) return false;
    if (args.lastVerifiedDate && entity.lastVerifiedDate !== args.lastVerifiedDate) return false;
    return entity.verificationStatus === 'unverified' && !entity.fecCommitteeId;
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(await readFile(args.input, 'utf8'));
  const entities = Array.isArray(raw) ? raw : raw.entities;
  const selected = targetEntities(entities, args);
  const committees = (await loadCommittees()).map(indexCommittee);

  const autoVerified = [];
  const nearMisses = [];
  const noMatches = [];
  const verifiedDate = today();

  for (const entity of selected) {
    const { bestAny, bestAuto } = bestCommitteeMatch(entity, committees);
    const best = bestAuto.score >= args.autoThreshold ? bestAuto : bestAny;
    const entry = {
      entityId: entity.id,
      canonicalName: entity.canonicalName,
      score: Number(best.score.toFixed(3)),
      searchName: best.searchName,
      candidateName: best.candidateName,
      candidateSource: best.candidateSource,
      committeeId: best.committee?.committeeId ?? null,
      committeeName: best.committee?.committeeName ?? null,
      connectedOrganizationName: best.committee?.connectedOrganizationName ?? null,
      sourceFiles: best.committee?.sourceFiles ?? [],
    };

    if (best === bestAuto && best.committee && best.score >= args.autoThreshold) {
      entity.fecCommitteeId = best.committee.committeeId;
      entity.verificationStatus = 'pipeline';
      entity.lastVerifiedDate = verifiedDate;
      autoVerified.push(entry);
    } else if (best.committee && best.score >= args.nearThreshold) {
      nearMisses.push(entry);
    } else {
      if (args.markNoMatchNull) {
        entity.fecCommitteeId = null;
        entity.verificationStatus = 'pipeline';
        entity.lastVerifiedDate = verifiedDate;
      }
      noMatches.push(entry);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'FEC bulk committee master files in tools/fec-bulk/cm*.txt',
    thresholds: {
      auto: args.autoThreshold,
      near: args.nearThreshold,
    },
    summary: {
      entitiesLoaded: entities.length,
      entitiesSelected: selected.length,
      committeesLoaded: committees.length,
      autoVerified: autoVerified.length,
      nearMisses: nearMisses.length,
      noMatches: noMatches.length,
      noMatchesMarkedNull: args.markNoMatchNull ? noMatches.length : 0,
      dryRun: args.dryRun,
    },
    autoVerified,
    nearMisses,
    noMatches,
  };

  await mkdir(path.dirname(args.report), { recursive: true });
  await writeFile(args.report, JSON.stringify(report, null, 2) + '\n', 'utf8');

  if (!args.dryRun) {
    const output = Array.isArray(raw)
      ? entities
      : { ...raw, _meta: { ...raw._meta, totalEntities: entities.length, updatedAt: verifiedDate }, entities };
    await writeFile(args.output, JSON.stringify(output, null, 2) + '\n', 'utf8');
  }

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Review report: ${path.relative(ROOT, args.report)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
