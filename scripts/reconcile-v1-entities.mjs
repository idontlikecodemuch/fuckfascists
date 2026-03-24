import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENTITIES_PATH = path.join(ROOT, 'assets/data/entities.json');
const PEOPLE_PATH = path.join(ROOT, 'assets/data/people.json');
const REPORT_PATH = path.join(ROOT, 'tools/fec-bulk/reports/people-v2-deferred-entity-links.json');

const MANUAL_REMOVALS = {
  'allen-blue': {
    microsoft: 'Indirect parent-company link removed; Allen Blue has a direct role at LinkedIn, not Microsoft.',
  },
};

const MANUAL_ENTITY_FIXES = {
  'marathon-petroleum': {
    removeAliases: ['Speedway'],
    removeDomains: ['speedway.com'],
    notes:
      'Removed Speedway after 7-Eleven completed the acquisition on May 14, 2021.',
  },
  verizon: {
    removeAliases: ['Yahoo', 'AOL'],
    removeDomains: ['yahoo.com'],
    notes:
      'Removed Yahoo/AOL overlap after Verizon sold those assets to Apollo in September 2021.',
  },
  adobe: {
    removeAliases: ['Figma'],
    removeDomains: [],
    notes:
      'Removed Figma overlap after the Adobe acquisition was terminated on December 18, 2023.',
  },
  conocophillips: {
    removeAliases: ['Conoco', 'Phillips 66'],
    removeDomains: [],
    notes:
      'Removed Conoco/Phillips 66 overlap after Phillips 66 became the downstream company and retained the Conoco, Phillips 66, and 76 fuel brands in the May 1, 2012 spin-off.',
  },
  'southern-company': {
    removeAliases: ['Gulf Power'],
    removeDomains: [],
    notes:
      'Removed Gulf Power overlap after Southern Company completed the sale to NextEra Energy on January 1, 2019.',
  },
  'dell-technologies': {
    removeAliases: ['VMware'],
    removeDomains: [],
    notes:
      'Removed VMware overlap after Dell Technologies completed the VMware spin-off on November 1, 2021.',
  },
  'charles-schwab': {
    removeAliases: ['TD Ameritrade'],
    removeDomains: ['tdameritrade.com'],
    notes:
      'Removed TD Ameritrade overlap after adding a dedicated historical TD Ameritrade entity following Charles Schwab integration.',
  },
  nvidia: {
    removeAliases: ['RTX'],
    addAliases: ['GeForce RTX'],
    removeDomains: [],
    notes:
      'Replaced the bare RTX alias with GeForce RTX to avoid collisions with RTX Corp while preserving the NVIDIA product-line reference.',
  },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function unique(values) {
  return [...new Set(values)];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function removeValues(values, removals) {
  const removalSet = new Set(removals.map((value) => value.toLowerCase()));
  return values.filter((value) => !removalSet.has(String(value).toLowerCase()));
}

function splitNotes(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return [];
  return value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function stripChildOverlap(entities) {
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const report = [];

  for (const child of entities) {
    if (!child.parentEntityId) continue;
    const parent = byId.get(child.parentEntityId);
    if (!parent) continue;

    const originalAliases = asArray(parent.aliases);
    const originalDomains = asArray(parent.domains);
    const childAliases = new Set(asArray(child.aliases).map((value) => String(value).toLowerCase()));
    const childDomains = new Set(asArray(child.domains).map((value) => String(value).toLowerCase()));

    const nextAliases = originalAliases.filter((value) => !childAliases.has(String(value).toLowerCase()));
    const nextDomains = originalDomains.filter((value) => !childDomains.has(String(value).toLowerCase()));

    if (nextAliases.length !== originalAliases.length || nextDomains.length !== originalDomains.length) {
      parent.aliases = nextAliases;
      parent.domains = nextDomains;
      report.push({
        parentEntityId: parent.id,
        childEntityId: child.id,
        removedAliases: originalAliases.filter((value) => !nextAliases.includes(value)),
        removedDomains: originalDomains.filter((value) => !nextDomains.includes(value)),
      });
    }
  }

  return report;
}

function applyManualEntityFixes(entities) {
  const changes = [];

  for (const entity of entities) {
    const fix = MANUAL_ENTITY_FIXES[entity.id];
    if (!fix) continue;

    const originalAliases = asArray(entity.aliases);
    const originalDomains = asArray(entity.domains);
    const strippedAliases = removeValues(originalAliases, fix.removeAliases ?? []);
    const strippedDomains = removeValues(originalDomains, fix.removeDomains ?? []);
    const nextAliases = unique([...strippedAliases, ...asArray(fix.addAliases)]).sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
    const nextDomains = unique([...strippedDomains, ...asArray(fix.addDomains)]).sort((a, b) =>
      String(a).localeCompare(String(b)),
    );

    const aliasesChanged =
      nextAliases.length !== originalAliases.length ||
      nextAliases.some((value, index) => value !== originalAliases[index]);
    const domainsChanged =
      nextDomains.length !== originalDomains.length ||
      nextDomains.some((value, index) => value !== originalDomains[index]);
    const originalNotes = splitNotes(entity.notes);
    const nextNotes = unique([...originalNotes, fix.notes].filter(Boolean));
    const notesChanged = nextNotes.join(' | ') !== originalNotes.join(' | ');

    if (!aliasesChanged && !domainsChanged && !notesChanged) {
      continue;
    }

    entity.aliases = nextAliases;
    entity.domains = nextDomains;
    if (nextNotes.length > 0) entity.notes = nextNotes.join(' | ');
    changes.push({
      entityId: entity.id,
      removedAliases: originalAliases.filter((value) => !nextAliases.includes(value)),
      removedDomains: originalDomains.filter((value) => !nextDomains.includes(value)),
      addedAliases: nextAliases.filter((value) => !originalAliases.includes(value)),
      addedDomains: nextDomains.filter((value) => !originalDomains.includes(value)),
    });
  }

  return changes;
}

function reconcilePersonLinks(people, liveEntityIds) {
  const deferred = [];
  const manualPersonLinkRemovals = [];
  const nextPeople = people.map((person) => {
    const seenEntityIds = new Set();
    const keepEntityIds = [];
    const nextRoles = {};
    const associatedEntityIds = asArray(person.associatedEntityIds);
    const rolesByEntity = person.rolesByEntity ?? {};
    const manual = MANUAL_REMOVALS[person.id] ?? {};

    for (const entityId of associatedEntityIds) {
      const role = rolesByEntity[entityId] ?? null;
      if (manual[entityId]) {
        manualPersonLinkRemovals.push({
          personId: person.id,
          personDisplayName: person.displayName,
          entityId,
          role,
          reason: manual[entityId],
        });
        continue;
      }
      if (seenEntityIds.has(entityId)) continue;
      seenEntityIds.add(entityId);
      keepEntityIds.push(entityId);
      if (role) nextRoles[entityId] = role;
      if (!liveEntityIds.has(entityId)) {
        deferred.push({
          personId: person.id,
          personDisplayName: person.displayName,
          entityId,
          role,
          reason: 'Deferred because the entity is not in the live V1 entities file.',
        });
      }
    }

    for (const [entityId, role] of Object.entries(rolesByEntity)) {
      if (manual[entityId]) continue;
      if (seenEntityIds.has(entityId) && !nextRoles[entityId]) nextRoles[entityId] = role;
      if (!seenEntityIds.has(entityId)) {
        manualPersonLinkRemovals.push({
          personId: person.id,
          personDisplayName: person.displayName,
          entityId,
          role,
          reason: 'Role record had no matching associatedEntityIds entry.',
        });
      }
    }

    return {
      ...person,
      associatedEntityIds: keepEntityIds,
      rolesByEntity: nextRoles,
    };
  });

  return { nextPeople, deferred, manualPersonLinkRemovals };
}

function addReverseLinks(entities, people, liveEntityIds) {
  const peopleByEntityId = new Map();
  for (const person of people) {
    for (const entityId of asArray(person.associatedEntityIds)) {
      if (!liveEntityIds.has(entityId)) continue;
      const bucket = peopleByEntityId.get(entityId) ?? [];
      bucket.push(person.id);
      peopleByEntityId.set(entityId, bucket);
    }
  }

  for (const entity of entities) {
    const personIds = unique(peopleByEntityId.get(entity.id) ?? []).sort();
    if (personIds.length > 0) {
      entity.associatedPersonIds = personIds;
    } else {
      delete entity.associatedPersonIds;
    }
  }
}

async function main() {
  const shouldWrite = process.argv.includes('--write');
  const entitiesRaw = await loadJson(ENTITIES_PATH);
  const peopleRaw = await loadJson(PEOPLE_PATH);
  const entities = Array.isArray(entitiesRaw.entities) ? entitiesRaw.entities : entitiesRaw;
  const people = Array.isArray(peopleRaw.people) ? peopleRaw.people : peopleRaw;
  const liveEntityIds = new Set(entities.map((entity) => entity.id));

  const { nextPeople, deferred, manualPersonLinkRemovals } = reconcilePersonLinks(people, liveEntityIds);
  addReverseLinks(entities, nextPeople, liveEntityIds);
  const childOverlapChanges = stripChildOverlap(entities);
  const manualEntityChanges = applyManualEntityFixes(entities);

  const deferredEntityIds = unique(deferred.map((entry) => entry.entityId)).sort();
  const linkedPeople = nextPeople.filter((person) => asArray(person.associatedEntityIds).length > 0).length;
  const uniqueEntityIds = unique(nextPeople.flatMap((person) => asArray(person.associatedEntityIds))).sort();
  const liveLinkedPeople = nextPeople.filter((person) =>
    asArray(person.associatedEntityIds).some((entityId) => liveEntityIds.has(entityId))
  ).length;
  const liveUniqueEntityIds = unique(
    nextPeople.flatMap((person) =>
      asArray(person.associatedEntityIds).filter((entityId) => liveEntityIds.has(entityId))
    )
  ).sort();

  const nextPeopleFile = {
    ...peopleRaw,
    _meta: {
      ...(peopleRaw._meta ?? {}),
      updatedAt: today(),
      linkedPeople,
      uniqueEntityIds: uniqueEntityIds.length,
      forwardReferencedEntityIds: deferredEntityIds,
      entityLinkMode: 'v2-canonical',
      liveEntityLinkMode: 'v1-live-only',
      liveLinkedPeople,
      liveUniqueEntityIds: liveUniqueEntityIds.length,
      deferredEntityLinkCount: deferred.length,
      deferredForwardReferencedEntityIds: deferredEntityIds,
      deferredEntityLinksReport: path.relative(ROOT, REPORT_PATH),
    },
    people: nextPeople,
  };

  const nextEntitiesFile = Array.isArray(entitiesRaw)
    ? entities
    : {
        ...entitiesRaw,
        _meta: {
          ...(entitiesRaw._meta ?? {}),
          updatedAt: today(),
          totalEntities: entities.length,
        },
        entities,
      };

  const report = {
    generatedAt: today(),
    entityLinkMode: 'v2-canonical',
    liveEntityLinkMode: 'v1-live-only',
    deferredEntityLinkCount: deferred.length,
    deferredEntityIds,
    deferredLinks: deferred,
    manualPersonLinkRemovals,
    childOverlapChanges,
    manualEntityChanges,
  };

  if (!shouldWrite) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(ENTITIES_PATH, JSON.stringify(nextEntitiesFile, null, 2) + '\n', 'utf8');
  await writeFile(PEOPLE_PATH, JSON.stringify(nextPeopleFile, null, 2) + '\n', 'utf8');
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`Updated ${path.relative(ROOT, ENTITIES_PATH)}`);
  console.log(`Updated ${path.relative(ROOT, PEOPLE_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
