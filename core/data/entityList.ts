import type { Entity } from '../models';
import { ENTITY_LIST_UPDATE_URL } from '../../config/constants';

/**
 * Attempts to fetch the latest curated entity list from Git.
 * Falls back to the active local list on any network, validation, partial-file,
 * or downgrade failure so the app remains fully functional offline.
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
    return preferFresherEntityList(parsed, bundled);
  } catch {
    return bundled;
  }
}

function entityDataTimestamp(entity: Entity): number {
  const summaryTimestamp = entity.donationSummary?.lastUpdated
    ? Date.parse(entity.donationSummary.lastUpdated)
    : 0;
  return Math.max(Date.parse(entity.lastVerifiedDate) || 0, summaryTimestamp || 0);
}

/** Reject stale or suspiciously partial Git payloads instead of downgrading local data. */
export function preferFresherEntityList(remote: Entity[], local: Entity[]): Entity[] {
  if (remote.length === 0) return local;
  if (local.length === 0) return remote;

  const minimumCompleteCount = Math.max(1, Math.floor(local.length * 0.9));
  if (remote.length < minimumCompleteCount) return local;

  const remoteTimestamp = remote.reduce(
    (latest, entity) => Math.max(latest, entityDataTimestamp(entity)),
    0,
  );
  const localTimestamp = local.reduce(
    (latest, entity) => Math.max(latest, entityDataTimestamp(entity)),
    0,
  );
  return remoteTimestamp >= localTimestamp ? remote : local;
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
  return arr.flatMap(normalizeEntity);
}

function normalizeEntity(v: unknown): Entity[] {
  if (typeof v !== 'object' || v === null) return [];
  const e = v as Record<string, unknown>;

  const valid =
    typeof e['id'] === 'string' &&
    e['id'].length > 0 &&
    typeof e['canonicalName'] === 'string' &&
    e['canonicalName'].length > 0 &&
    Array.isArray(e['aliases']) &&
    Array.isArray(e['domains']) &&
    Array.isArray(e['categoryTags']) &&
    (typeof e['ceoName'] === 'string' || typeof e['publicFigureName'] === 'string') &&
    typeof e['lastVerifiedDate'] === 'string';
  if (!valid) return [];

  // Some owner/founder-led entities intentionally carry only a public figure.
  // Runtime consumers still require ceoName, so normalize it to the verified
  // public figure instead of silently dropping the entire entity.
  const entity = e as unknown as Entity;
  if (typeof e['ceoName'] === 'string') return [entity];
  return [{ ...entity, ceoName: e['publicFigureName'] as string }];
}
