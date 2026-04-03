import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_PEOPLE_ENTITY_OVERRIDES_PATH = path.join(
  __dirname,
  '../data/people-entity-overrides.json'
);

const VALID_BENEFIT_BASES = new Set([
  'control_owner',
  'executive',
  'founder_stake',
  'family_control',
  'major_shareholder',
  'board_material',
  'board_routine',
  'weak',
]);

const VALID_CONFIDENCE = new Set(['high', 'medium', 'manual-review']);

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeYear(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOwnershipPct(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNotes(value) {
  const normalized = normalizeWhitespace(value);
  return normalized || undefined;
}

export function inferBenefitBasis(value) {
  const explicit = normalizeWhitespace(value?.benefitBasis);
  if (explicit && VALID_BENEFIT_BASES.has(explicit)) return explicit;

  const role = normalizeWhitespace(value?.role).toUpperCase();
  const notes = normalizeWhitespace(value?.notes).toUpperCase();
  const ownershipPct = normalizeOwnershipPct(value?.ownershipPct);

  if (
    role.includes('MAJORITY SHAREHOLDER') ||
    role.includes('CONTROLLING SHAREHOLDER') ||
    role.includes('OWNER') ||
    role.includes('CO-OWNER')
  ) {
    return 'control_owner';
  }

  if (role.includes('FAMILY') && (role.includes('OWNER') || role.includes('SHAREHOLDER'))) {
    return 'family_control';
  }

  if (role.includes('SHAREHOLDER')) {
    return 'major_shareholder';
  }

  if (role.includes('FOUNDER')) {
    return 'founder_stake';
  }

  if (
    role.includes('CEO') ||
    role.includes('PRESIDENT') ||
    role.includes('COO') ||
    role.includes('CTO') ||
    role.includes('CFO') ||
    role.includes('EXECUTIVE CHAIR') ||
    role.includes('EXECUTIVE CHAIRMAN') ||
    role.includes('CHAIRMAN') ||
    role.includes('CHAIR') ||
    role.includes('VICE CHAIR') ||
    role.includes('SENIOR EXECUTIVE')
  ) {
    return 'executive';
  }

  if (
    role.includes('BOARD') ||
    role.includes('DIRECTOR') ||
    role.includes('ADVISOR') ||
    notes.includes('BOARD')
  ) {
    if (ownershipPct !== null || notes.includes('STOCK') || notes.includes('EQUITY') || notes.includes('OWNERSHIP')) {
      return 'board_material';
    }
    return 'board_routine';
  }

  if (ownershipPct !== null && ownershipPct >= 5) {
    return 'major_shareholder';
  }

  return 'weak';
}

export function normalizeEntityRoleRecord(value) {
  if (typeof value !== 'object' || value === null) return null;

  const role = normalizeWhitespace(value.role);
  if (!role) return null;

  const startYear = normalizeYear(value.startYear);
  const endYear = normalizeYear(value.endYear);
  const ownershipPct = normalizeOwnershipPct(value.ownershipPct);
  const notes = normalizeNotes(value.notes);
  const benefitBasis = inferBenefitBasis({ ...value, role, ownershipPct, notes });
  const confidence = VALID_CONFIDENCE.has(normalizeWhitespace(value.confidence))
    ? normalizeWhitespace(value.confidence)
    : undefined;

  let isCurrent;
  if (typeof value.isCurrent === 'boolean') {
    isCurrent = value.isCurrent;
  } else if (endYear !== null) {
    isCurrent = false;
  } else if (/\bFORMER\b|\bEMERITUS\b/i.test(role)) {
    isCurrent = false;
  } else {
    isCurrent = true;
  }

  return {
    role,
    startYear,
    endYear,
    benefitBasis,
    isCurrent,
    ownershipPct,
    confidence,
    notes,
  };
}

export async function loadPeopleEntityOverrides(filePath = DEFAULT_PEOPLE_ENTITY_OVERRIDES_PATH) {
  try {
    const raw = JSON.parse(await readFile(filePath, 'utf8'));
    const people = typeof raw === 'object' && raw !== null ? raw.people ?? {} : {};
    const commonNameOverrides = {};
    const roleOverrides = {};

    for (const [personId, entry] of Object.entries(people)) {
      if (typeof entry !== 'object' || entry === null) continue;

      const commonName = normalizeWhitespace(entry.commonName);
      if (commonName) commonNameOverrides[personId] = commonName;

      const entityLinks = typeof entry.entityLinks === 'object' && entry.entityLinks !== null ? entry.entityLinks : {};
      const nextLinks = {};
      for (const [entityId, link] of Object.entries(entityLinks)) {
        const normalized = normalizeEntityRoleRecord(link);
        if (normalized) nextLinks[entityId] = normalized;
      }
      if (Object.keys(nextLinks).length > 0) roleOverrides[personId] = nextLinks;
    }

    return {
      raw,
      commonNameOverrides,
      roleOverrides,
    };
  } catch {
    return {
      raw: { people: {} },
      commonNameOverrides: {},
      roleOverrides: {},
    };
  }
}
