import type { PoliticalPerson } from '../models';
import { PEOPLE_LIST_UPDATE_URL } from '../../config/constants';

/**
 * Attempts to fetch the latest curated people list from the CDN.
 * Falls back to the bundled list on any network or parse failure so the app
 * remains usable offline.
 */
export async function fetchPeopleList(bundled: PoliticalPerson[]): Promise<PoliticalPerson[]> {
  try {
    const response = await fetch(PEOPLE_LIST_UPDATE_URL);
    if (!response.ok) return bundled;

    const raw: unknown = await response.json();
    const parsed = parsePeopleList(raw);
    return parsed.length > 0 ? parsed : bundled;
  } catch {
    return bundled;
  }
}

/**
 * Parses and validates a raw JSON value into a PoliticalPerson array.
 * Accepts both formats:
 *   - PoliticalPerson[]
 *   - { _meta: {...}, people: PoliticalPerson[] }
 */
export function parsePeopleList(raw: unknown): PoliticalPerson[] {
  let arr: unknown = raw;
  if (
    typeof raw === 'object' &&
    raw !== null &&
    !Array.isArray(raw) &&
    Array.isArray((raw as Record<string, unknown>)['people'])
  ) {
    arr = (raw as Record<string, unknown>)['people'];
  }

  if (!Array.isArray(arr)) return [];
  return arr.filter(isValidPerson);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isRoleRecord(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const role = value as Record<string, unknown>;
  const isNullableYear = (year: unknown) => year === null || typeof year === 'number';

  return typeof role['role'] === 'string' && isNullableYear(role['startYear']) && isNullableYear(role['endYear']);
}

function isContribution(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const contribution = value as Record<string, unknown>;

  return (
    typeof contribution['committeeName'] === 'string' &&
    typeof contribution['committeeId'] === 'string' &&
    (contribution['committeeParty'] === null || typeof contribution['committeeParty'] === 'string') &&
    (contribution['committeeType'] === null || typeof contribution['committeeType'] === 'string') &&
    typeof contribution['amount'] === 'number' &&
    typeof contribution['cycle'] === 'number' &&
    typeof contribution['contributionDate'] === 'string'
  );
}

function isDonationSummary(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const summary = value as Record<string, unknown>;

  return (
    typeof summary['totalGOP'] === 'number' &&
    typeof summary['totalDEM'] === 'number' &&
    typeof summary['recentCycleGOP'] === 'number' &&
    typeof summary['recentCycleDEM'] === 'number' &&
    typeof summary['recentCycle'] === 'string' &&
    Array.isArray(summary['activeCycles']) &&
    summary['activeCycles'].every((cycle) => typeof cycle === 'number') &&
    Array.isArray(summary['raw']) &&
    summary['raw'].every(isContribution) &&
    typeof summary['lastUpdated'] === 'string'
  );
}

function isValidPerson(value: unknown): value is PoliticalPerson {
  if (typeof value !== 'object' || value === null) return false;
  const person = value as Record<string, unknown>;
  const roles = person['rolesByEntity'];
  const validRoles =
    typeof roles === 'object' &&
    roles !== null &&
    Object.values(roles as Record<string, unknown>).every(isRoleRecord);

  return (
    typeof person['id'] === 'string' &&
    person['id'].length > 0 &&
    typeof person['canonicalName'] === 'string' &&
    person['canonicalName'].length > 0 &&
    typeof person['displayName'] === 'string' &&
    (person['commonName'] === undefined || typeof person['commonName'] === 'string') &&
    isStringArray(person['aliases']) &&
    isStringArray(person['associatedEntityIds']) &&
    validRoles &&
    (person['fecSearchNames'] === undefined || isStringArray(person['fecSearchNames'])) &&
    (person['donationSummary'] === undefined || isDonationSummary(person['donationSummary'])) &&
    (person['verificationStatus'] === 'manual' ||
      person['verificationStatus'] === 'pipeline' ||
      person['verificationStatus'] === 'unverified') &&
    typeof person['lastVerifiedDate'] === 'string'
  );
}
