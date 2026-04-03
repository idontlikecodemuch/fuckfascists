import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INPUT = path.join(__dirname, '../assets/data/people.json');
const DEFAULT_OUTPUT = path.join(__dirname, '../assets/data/people.bundle.json');
const DEFAULT_ENTITIES = path.join(__dirname, '../assets/data/entities.json');

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    entities: DEFAULT_ENTITIES,
    mode: 'linked-only',
    backupOutput: null,
    pretty: false,
  };

  for (const arg of argv) {
    if (arg.startsWith('--input=')) {
      const value = arg.slice('--input='.length).trim();
      if (value) args.input = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) args.output = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--entities=')) {
      const value = arg.slice('--entities='.length).trim();
      if (value) args.entities = path.resolve(process.cwd(), value);
    } else if (arg.startsWith('--mode=')) {
      const value = arg.slice('--mode='.length).trim();
      if (value === 'linked-only' || value === 'none') args.mode = value;
    } else if (arg.startsWith('--backup-output=')) {
      const value = arg.slice('--backup-output='.length).trim();
      args.backupOutput = value ? path.resolve(process.cwd(), value) : null;
    } else if (arg === '--no-backup') {
      args.backupOutput = null;
    } else if (arg === '--pretty') {
      args.pretty = true;
    }
  }

  return args;
}

function normalizePeople(raw) {
  if (Array.isArray(raw?.people)) return raw.people;
  if (Array.isArray(raw)) return raw;
  return [];
}

function normalizeEntities(raw) {
  if (Array.isArray(raw?.entities)) return raw.entities;
  if (Array.isArray(raw)) return raw;
  return [];
}

function hasLiveEntityLink(person, liveEntityIds) {
  const entityIds = Array.isArray(person?.associatedEntityIds) ? person.associatedEntityIds : [];
  return entityIds.some((entityId) => liveEntityIds.has(entityId));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function writeJson(filePath, value, pretty = false) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const spacing = pretty ? 2 : 0;
  await writeFile(filePath, JSON.stringify(value, null, spacing) + '\n', 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const peopleRaw = JSON.parse(await readFile(args.input, 'utf8'));
  const entitiesRaw = JSON.parse(await readFile(args.entities, 'utf8'));
  const people = normalizePeople(peopleRaw);
  const entities = normalizeEntities(entitiesRaw);
  const liveEntityIds = new Set(entities.map((entity) => entity?.id).filter(Boolean));

  if (args.backupOutput) {
    await writeJson(args.backupOutput, peopleRaw, true);
  }

  let rawPeopleRetained = 0;
  let rawEntriesRetained = 0;
  let rawEntriesRemoved = 0;

  const nextPeople = people.map((person) => {
    const rawEntries = Array.isArray(person?.donationSummary?.raw) ? person.donationSummary.raw : [];
    if (!person?.donationSummary) return person;

    const keepRaw = args.mode === 'none' ? false : hasLiveEntityLink(person, liveEntityIds);

    if (keepRaw) {
      rawPeopleRetained += rawEntries.length > 0 ? 1 : 0;
      rawEntriesRetained += rawEntries.length;
      return person;
    }

    rawEntriesRemoved += rawEntries.length;
    return {
      ...person,
      donationSummary: {
        ...person.donationSummary,
        raw: [],
      },
    };
  });

  const nextMeta =
    typeof peopleRaw === 'object' && peopleRaw !== null && !Array.isArray(peopleRaw)
      ? {
          ...(peopleRaw._meta ?? {}),
          updatedAt: today(),
          rawRetentionMode: args.mode,
          rawPeopleRetained,
          rawEntriesRetained,
          rawEntriesRemoved,
          rawBackupPath: args.backupOutput ? path.relative(process.cwd(), args.backupOutput) : null,
        }
      : undefined;

  const nextValue =
    typeof peopleRaw === 'object' && peopleRaw !== null && !Array.isArray(peopleRaw)
      ? { ...peopleRaw, _meta: nextMeta, people: nextPeople }
      : nextPeople;

  await writeJson(args.output, nextValue, args.pretty);

  console.log(`Stripped people raw data in ${args.mode} mode.`);
  console.log(`Retained raw rows: ${rawEntriesRetained}`);
  console.log(`Removed raw rows: ${rawEntriesRemoved}`);
  if (args.backupOutput) {
    console.log(`Full-raw backup: ${args.backupOutput}`);
  }
  console.log(`Output: ${args.output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
