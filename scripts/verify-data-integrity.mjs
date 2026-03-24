import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENTITIES_PATH = path.join(ROOT, 'assets/data/entities.json');
const PEOPLE_PATH = path.join(ROOT, 'assets/data/people.json');
const GPT_PASS_PATH = path.join(ROOT, 'entities_GPTpass.json');
const CLAUDE_PATH = path.join(ROOT, 'CLAUDE.md');
const SPEC_PATH = path.join(ROOT, 'docs/SPEC_VS_CURRENT.md');
const PROGRESS_PATH = path.join(ROOT, 'docs/PROGRESS.md');

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function normalizeAlias(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeDomain(value) {
  return String(value ?? '').trim().toLowerCase();
}

function hasFigure(entity) {
  return Boolean(
    (typeof entity.ceoName === 'string' && entity.ceoName.trim()) ||
      (typeof entity.publicFigureName === 'string' && entity.publicFigureName.trim())
  );
}

function summarizeCollisions(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    for (const rawValue of keyFn(item)) {
      if (!rawValue) continue;
      const value = rawValue;
      const bucket = map.get(value) ?? [];
      bucket.push(item.id);
      map.set(value, bucket);
    }
  }
  return [...map.entries()]
    .filter(([, ids]) => new Set(ids).size > 1)
    .map(([value, ids]) => ({ value, ids: [...new Set(ids)] }))
    .sort((left, right) => right.ids.length - left.ids.length || left.value.localeCompare(right.value));
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function main() {
  const entitiesRaw = await loadJson(ENTITIES_PATH);
  const peopleRaw = await loadJson(PEOPLE_PATH);
  const passRaw = await loadJson(GPT_PASS_PATH);
  const claude = await readFile(CLAUDE_PATH, 'utf8');
  const spec = await readFile(SPEC_PATH, 'utf8');
  const progress = await readFile(PROGRESS_PATH, 'utf8');

  const entities = Array.isArray(entitiesRaw.entities) ? entitiesRaw.entities : entitiesRaw;
  const people = Array.isArray(peopleRaw.people) ? peopleRaw.people : peopleRaw;
  const passNew = Array.isArray(passRaw.proposedNewEntities) ? passRaw.proposedNewEntities : [];
  const passSplits = Array.isArray(passRaw.proposedEntitySplits) ? passRaw.proposedEntitySplits : [];
  const passAliases = Array.isArray(passRaw.proposedAliasAdds) ? passRaw.proposedAliasAdds : [];

  const entityIds = new Set(entities.map((entity) => entity.id));
  const peopleIds = new Set(people.map((person) => person.id));
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const passNewIds = new Set(passNew.map((entity) => entity.id));
  const passSplitIds = new Set(passSplits.map((entity) => entity.id));

  const missingPeopleFromEntities = [];
  const missingReversePeople = [];
  for (const entity of entities) {
    const personIds = Array.isArray(entity.associatedPersonIds) ? entity.associatedPersonIds : [];
    for (const personId of personIds) {
      const person = peopleById.get(personId);
      if (!person) {
        missingPeopleFromEntities.push({ entityId: entity.id, personId });
        continue;
      }
      if (!Array.isArray(person.associatedEntityIds) || !person.associatedEntityIds.includes(entity.id)) {
        missingReversePeople.push({ entityId: entity.id, personId });
      }
    }
  }

  const missingEntitiesFromPeople = [];
  const missingReverseEntities = [];
  const invalidRoleLinks = [];
  for (const person of people) {
    const associatedEntityIds = Array.isArray(person.associatedEntityIds) ? person.associatedEntityIds : [];
    const roleKeys = Object.keys(person.rolesByEntity ?? {});

    for (const entityId of associatedEntityIds) {
      if (!entityIds.has(entityId)) {
        missingEntitiesFromPeople.push({
          personId: person.id,
          entityId,
          inGptPassNew: passNewIds.has(entityId),
          inGptPassSplit: passSplitIds.has(entityId),
        });
      } else {
        const entity = entitiesById.get(entityId);
        const reverseIds = Array.isArray(entity?.associatedPersonIds) ? entity.associatedPersonIds : [];
        if (!reverseIds.includes(person.id)) {
          missingReverseEntities.push({ personId: person.id, entityId });
        }
      }
      if (!roleKeys.includes(entityId)) {
        invalidRoleLinks.push({ personId: person.id, entityId, issue: 'associated_entity_without_role' });
      }
    }

    for (const entityId of roleKeys) {
      if (!associatedEntityIds.includes(entityId)) {
        invalidRoleLinks.push({ personId: person.id, entityId, issue: 'role_without_associated_entity' });
      }
    }
  }

  const computedForwardRefs = [...new Set(missingEntitiesFromPeople.map((entry) => entry.entityId))].sort();
  const declaredForwardRefs = [...new Set(peopleRaw._meta?.forwardReferencedEntityIds ?? [])].sort();
  const declaredForwardRefSet = new Set(declaredForwardRefs);
  const undeclaredMissingEntitiesFromPeople = missingEntitiesFromPeople.filter(
    (entry) => !declaredForwardRefSet.has(entry.entityId)
  );
  const aliasCollisions = summarizeCollisions(entities, (entity) => (entity.aliases ?? []).map(normalizeAlias)).filter(
    (entry) => entry.value
  );
  const domainCollisions = summarizeCollisions(entities, (entity) => (entity.domains ?? []).map(normalizeDomain)).filter(
    (entry) => entry.value
  );
  const passIdCollisionsWithLive = [...new Set([...passNewIds, ...passSplitIds].filter((id) => entityIds.has(id)))];
  const passIdCollisionsWithinPass = [...passNewIds].filter((id) => passSplitIds.has(id));
  const splitParentStatus = passSplits.map((entity) => ({
    id: entity.id,
    parentEntityId: entity.parentEntityId ?? null,
    inLive: Boolean(entity.parentEntityId && entityIds.has(entity.parentEntityId)),
    inPassNew: Boolean(entity.parentEntityId && passNewIds.has(entity.parentEntityId)),
  }));

  const report = {
    files: {
      entities: path.relative(ROOT, ENTITIES_PATH),
      people: path.relative(ROOT, PEOPLE_PATH),
      gptPass: path.relative(ROOT, GPT_PASS_PATH),
    },
    summary: {
      liveEntities: entities.length,
      livePeople: people.length,
      gptPassNewEntities: passNew.length,
      gptPassSplits: passSplits.length,
      gptPassAliasAdds: passAliases.length,
    },
    liveIntegrity: {
      duplicateEntityIds: duplicateValues(entities.map((entity) => entity.id)),
      duplicatePeopleIds: duplicateValues(people.map((person) => person.id)),
      missingPeopleFromEntities,
      missingReversePeople,
      missingEntitiesFromPeople,
      undeclaredMissingEntitiesFromPeople,
      missingReverseEntities,
      invalidRoleLinks,
      declaredForwardRefs,
      computedForwardRefs,
      forwardRefMismatch:
        JSON.stringify(declaredForwardRefs) !== JSON.stringify(computedForwardRefs),
      aliasCollisionsSample: aliasCollisions.slice(0, 20),
      domainCollisionsSample: domainCollisions.slice(0, 20),
    },
    gptPassIntegrity: {
      passIdCollisionsWithLive,
      passIdCollisionsWithinPass,
      aliasAddsNetNew: passAliases.reduce((count, entry) => {
        const liveAliases = new Set((entitiesById.get(entry.entityId)?.aliases ?? []).map((alias) => alias.toLowerCase()));
        return count + entry.addAliases.filter((alias) => !liveAliases.has(alias.toLowerCase())).length;
      }, 0),
      newEntitiesMissingDomains: passNew.filter((entity) => !Array.isArray(entity.domains) || entity.domains.length === 0).map((entity) => entity.id),
      newEntitiesMissingFigures: passNew.filter((entity) => !hasFigure(entity)).map((entity) => entity.id),
      splitEntitiesMissingDomains: passSplits.filter((entity) => !Array.isArray(entity.domains) || entity.domains.length === 0).map((entity) => entity.id),
      splitEntitiesMissingFigures: passSplits.filter((entity) => !hasFigure(entity)).map((entity) => entity.id),
      splitParentsMissingInLive: splitParentStatus.filter((entry) => entry.parentEntityId && !entry.inLive),
      splitParentsResolvableInBatch: splitParentStatus.filter((entry) => entry.parentEntityId && !entry.inLive && entry.inPassNew),
    },
    docs: {
      specMentions107People: spec.includes('seeded with 107 people'),
      specClaimsBidirectionalEstablished: spec.includes('bidirectional linkage established'),
      claudeUsesStringRolesExample: claude.includes('rolesByEntity: { [entityId: string]: string }'),
      progressClaimsPreExistingPersonTestFailure: progress.includes('1 pre-existing failure in personList.test.ts'),
    },
  };

  console.log(JSON.stringify(report, null, 2));

  const hasCriticalIssues =
    report.liveIntegrity.duplicateEntityIds.length > 0 ||
    report.liveIntegrity.duplicatePeopleIds.length > 0 ||
    report.liveIntegrity.missingPeopleFromEntities.length > 0 ||
    report.liveIntegrity.undeclaredMissingEntitiesFromPeople.length > 0 ||
    report.liveIntegrity.missingReversePeople.length > 0 ||
    report.liveIntegrity.missingReverseEntities.length > 0 ||
    report.liveIntegrity.invalidRoleLinks.length > 0 ||
    report.liveIntegrity.forwardRefMismatch ||
    report.gptPassIntegrity.passIdCollisionsWithinPass.length > 0;

  process.exitCode = hasCriticalIssues ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
