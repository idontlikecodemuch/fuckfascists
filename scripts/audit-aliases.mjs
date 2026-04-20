import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENTITIES_PATH = path.join(ROOT, 'assets/data/entities.json');

const LEGAL_SUFFIXES = new Set([
  'co',
  'company',
  'corp',
  'corporation',
  'inc',
  'incorporated',
  'llc',
  'lp',
  'ltd',
  'plc',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeForFec(value) {
  return normalize(value)
    .split(' ')
    .filter((part) => part && !LEGAL_SUFFIXES.has(part))
    .join(' ');
}

function tokens(value) {
  return normalize(value).split(' ').filter(Boolean);
}

function isSingleWordAlias(alias) {
  const parts = tokens(alias);
  return parts.length === 1 && parts[0].length > 2;
}

function entityLabel(entity) {
  return `${entity.id} (${entity.canonicalName})`;
}

async function loadEntities() {
  const raw = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  return Array.isArray(raw.entities) ? raw.entities : raw;
}

function auditExactAliasDuplicates(entities) {
  const aliasesByNormalized = new Map();

  for (const entity of entities) {
    for (const alias of asArray(entity.aliases)) {
      const normalized = normalize(alias);
      if (!normalized) continue;
      const bucket = aliasesByNormalized.get(normalized) ?? [];
      bucket.push({ entityId: entity.id, canonicalName: entity.canonicalName, alias });
      aliasesByNormalized.set(normalized, bucket);
    }
  }

  return [...aliasesByNormalized.entries()]
    .filter(([, entries]) => new Set(entries.map((entry) => entry.entityId)).size > 1)
    .map(([normalizedAlias, entries]) => ({ normalizedAlias, entries }))
    .sort((left, right) => left.normalizedAlias.localeCompare(right.normalizedAlias));
}

function auditSingleWordSubstringCollisions(entities) {
  const singleWordAliases = [];
  const searchableAliases = [];

  for (const entity of entities) {
    const aliases = asArray(entity.aliases);
    for (const alias of aliases) {
      if (isSingleWordAlias(alias)) {
        singleWordAliases.push({
          entityId: entity.id,
          canonicalName: entity.canonicalName,
          alias,
          token: tokens(alias)[0],
        });
      }
      searchableAliases.push({
        entityId: entity.id,
        canonicalName: entity.canonicalName,
        alias,
        tokens: tokens(alias),
      });
    }
  }

  const collisions = [];
  for (const single of singleWordAliases) {
    for (const target of searchableAliases) {
      if (single.entityId === target.entityId) continue;
      if (target.tokens.length <= 1) continue;
      if (!target.tokens.includes(single.token)) continue;
      collisions.push({
        singleWordEntityId: single.entityId,
        singleWordAlias: single.alias,
        targetEntityId: target.entityId,
        targetAlias: target.alias,
      });
    }
  }

  return collisions.sort(
    (left, right) =>
      left.singleWordAlias.localeCompare(right.singleWordAlias) ||
      left.targetAlias.localeCompare(right.targetAlias),
  );
}

function auditParentChildOverlap(entities) {
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const overlaps = [];

  for (const child of entities) {
    if (!child.parentEntityId) continue;
    const parent = byId.get(child.parentEntityId);
    if (!parent) continue;

    const parentAliases = new Map(asArray(parent.aliases).map((alias) => [normalize(alias), alias]));
    const parentDomains = new Map(asArray(parent.domains).map((domain) => [normalize(domain), domain]));
    const overlappingAliases = asArray(child.aliases)
      .map((alias) => ({ child: alias, parent: parentAliases.get(normalize(alias)) }))
      .filter((entry) => entry.parent);
    const overlappingDomains = asArray(child.domains)
      .map((domain) => ({ child: domain, parent: parentDomains.get(normalize(domain)) }))
      .filter((entry) => entry.parent);

    if (overlappingAliases.length > 0 || overlappingDomains.length > 0) {
      overlaps.push({
        parentEntityId: parent.id,
        childEntityId: child.id,
        overlappingAliases,
        overlappingDomains,
      });
    }
  }

  return overlaps.sort(
    (left, right) =>
      left.parentEntityId.localeCompare(right.parentEntityId) ||
      left.childEntityId.localeCompare(right.childEntityId),
  );
}

function auditFecCanonicalDrift(entities) {
  const drift = [];

  for (const entity of entities) {
    const committeeName = entity.donationSummary?.committeeName;
    if (!committeeName) continue;

    const normalizedCommittee = normalizeForFec(committeeName);
    const candidates = [entity.canonicalName, ...asArray(entity.aliases)].map(normalizeForFec).filter(Boolean);
    const hasNameOverlap = candidates.some(
      (candidate) =>
        candidate.length > 2 &&
        (normalizedCommittee.includes(candidate) || candidate.includes(normalizedCommittee)),
    );

    if (!hasNameOverlap) {
      drift.push({
        entityId: entity.id,
        canonicalName: entity.canonicalName,
        committeeName,
        committeeId: entity.donationSummary.committeeId ?? entity.fecCommitteeId ?? null,
      });
    }
  }

  return drift.sort((left, right) => left.entityId.localeCompare(right.entityId));
}

async function main() {
  const entities = await loadEntities();
  const report = {
    files: {
      entities: path.relative(ROOT, ENTITIES_PATH),
    },
    summary: {
      entities: entities.length,
    },
    exactAliasDuplicates: auditExactAliasDuplicates(entities),
    singleWordSubstringCollisions: auditSingleWordSubstringCollisions(entities),
    parentChildOverlap: auditParentChildOverlap(entities),
    fecCanonicalDrift: auditFecCanonicalDrift(entities),
  };

  report.summary.exactAliasDuplicates = report.exactAliasDuplicates.length;
  report.summary.singleWordSubstringCollisions = report.singleWordSubstringCollisions.length;
  report.summary.parentChildOverlap = report.parentChildOverlap.length;
  report.summary.fecCanonicalDrift = report.fecCanonicalDrift.length;

  console.log(JSON.stringify(report, null, 2));

  const hasBlockingAliasIssues =
    report.exactAliasDuplicates.length > 0 || report.parentChildOverlap.length > 0;
  if (hasBlockingAliasIssues) {
    process.exitCode = 1;
  }
}

await main();
