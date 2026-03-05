import type { Entity } from '../models';
import { ENTITY_LIST_UPDATE_URL } from '../../config/constants';

/**
 * Attempts to fetch the latest curated entity list from the CDN.
 * Falls back to the bundled list on any network or parse failure so the
 * app remains fully functional offline from day one.
 *
 * @param bundled  The entity list compiled into the app at build time.
 *                 Import the bundled JSON and pass it here.
 */
export async function fetchEntityList(bundled: Entity[]): Promise<Entity[]> {
  try {
    const response = await fetch(ENTITY_LIST_UPDATE_URL);
    if (!response.ok) return bundled;

    const raw: unknown = await response.json();
    const parsed = parseEntityList(raw);
    return parsed.length > 0 ? parsed : bundled;
  } catch {
    return bundled;
  }
}

/**
 * Parses and validates a raw JSON value into an Entity array.
 * Accepts both formats:
 *  - Legacy flat array:          Entity[]
 *  - Wrapped object:             { _meta: {...}, entities: Entity[] }
 * Entries that fail validation are silently skipped — a partial list is
 * better than crashing the app on a malformed CDN response.
 */
export function parseEntityList(raw: unknown): Entity[] {
  // Unwrap { _meta, entities } object if present
  let arr: unknown = raw;
  if (
    typeof raw === 'object' &&
    raw !== null &&
    !Array.isArray(raw) &&
    Array.isArray((raw as Record<string, unknown>)['entities'])
  ) {
    arr = (raw as Record<string, unknown>)['entities'];
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter(isValidEntity);
}

function isValidEntity(v: unknown): v is Entity {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;

  return (
    typeof e['id'] === 'string' &&
    e['id'].length > 0 &&
    typeof e['canonicalName'] === 'string' &&
    e['canonicalName'].length > 0 &&
    Array.isArray(e['aliases']) &&
    Array.isArray(e['domains']) &&
    Array.isArray(e['categoryTags']) &&
    typeof e['ceoName'] === 'string' &&
    typeof e['lastVerifiedDate'] === 'string'
  );
}
