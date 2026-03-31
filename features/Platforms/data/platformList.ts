import type { Entity } from '../../../core/models';
import { parseEntityList } from '../../../core/data';
import type { Platform, PlatformFile, RawPlatformEntry, RawPlatformGroup } from '../types';
import bundledPlatformsRaw from '../../../assets/data/platforms.json';
import bundledEntitiesRaw from '../../../assets/data/entities.json';

// ── Type guard ────────────────────────────────────────────────────────────────

function isGroup(entry: RawPlatformEntry): entry is RawPlatformGroup {
  return 'children' in entry && Array.isArray((entry as unknown as Record<string, unknown>)['children']);
}

// ── Parsing ───────────────────────────────────────────────────────────────────

/**
 * Parses and validates a raw JSON value against the PlatformFile schema.
 * Returns null if the value does not match the expected shape.
 */
export function parsePlatformFile(raw: unknown): PlatformFile | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj['version'] !== 'number') return null;
  if (!Array.isArray(obj['platforms'])) return null;
  return { version: obj['version'] as number, platforms: obj['platforms'] as RawPlatformEntry[] };
}

// ── Entity enrichment ─────────────────────────────────────────────────────────

function lookupEntity(entityId: string, entities: Entity[]) {
  const e = entities.find((ent) => ent.id === entityId);
  return {
    parentCompany: e?.canonicalName ?? entityId,
    ceoName: e?.ceoName ?? '',
    publicFigureName: e?.publicFigureName,
    categoryTags: e?.categoryTags ?? [],
  };
}

// ── Flattening ────────────────────────────────────────────────────────────────

/**
 * Converts a PlatformFile into a flat Platform[] by expanding groups into their
 * children. Children inherit their parent group's entityId for entity enrichment
 * (ceoName, parentCompany, sprite, FEC data).
 *
 * Singletons and group children are sorted together by sortOrder ascending, so
 * groups are interleaved with singletons in the final list.
 *
 * Entity enrichment falls back gracefully: if an entityId has no matching entity
 * in the provided list, parentCompany uses the entityId string and ceoName is ''.
 * This allows the app to render without crashing even when entities.json is
 * missing an entry (e.g. match-group — flagged in CLAUDE.md Known Limitations).
 */
export function flattenPlatforms(file: PlatformFile, entities: Entity[]): Platform[] {
  const result: Platform[] = [];

  for (const entry of file.platforms) {
    if (isGroup(entry)) {
      const enriched = lookupEntity(entry.entityId, entities);
      for (const child of entry.children) {
        result.push({
          id: child.id,
          name: child.name,
          entityId: entry.entityId,
          parentCompany: enriched.parentCompany,
          ceoName: enriched.ceoName,
          publicFigureName: enriched.publicFigureName,
          categoryTags: enriched.categoryTags,
          sortOrder: child.sortOrder,
          defaultSelected: child.defaultSelected,
        });
      }
    } else {
      const enriched = lookupEntity(entry.entityId, entities);
      result.push({
        id: entry.id,
        name: entry.name,
        entityId: entry.entityId,
        parentCompany: enriched.parentCompany,
        ceoName: enriched.ceoName,
        publicFigureName: enriched.publicFigureName,
        categoryTags: enriched.categoryTags,
        sortOrder: entry.sortOrder,
        defaultSelected: entry.defaultSelected,
      });
    }
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Module singleton ──────────────────────────────────────────────────────────

/**
 * Flat list of all tracked platforms, initialized synchronously at module load
 * from bundled assets. Components may import this directly — it is always
 * populated before any React component renders.
 *
 * Groups are expanded: group parent IDs (e.g. 'meta', 'amazon-group') do not
 * appear in this list — only individual leaf platforms that can receive avoid
 * events (e.g. 'facebook', 'instagram', 'amazon', 'twitch').
 *
 * This is the same pattern as entities.json: bundled data is the primary source;
 * a CDN fetch path can be added in a future pass to support live updates.
 */
export const TRACKED_PLATFORMS: Platform[] = (() => {
  const file = parsePlatformFile(bundledPlatformsRaw);
  if (!file) return [];
  const entities = parseEntityList(bundledEntitiesRaw);
  return flattenPlatforms(file, entities);
})();

/**
 * Platform IDs where defaultSelected is true in platforms.json.
 * Used by the setup screen as the initial pre-checked set for new users.
 * Derived from the data — no separate constant to keep in sync.
 */
export const DEFAULT_SELECTED_PLATFORM_IDS: string[] =
  TRACKED_PLATFORMS.filter((p) => p.defaultSelected).map((p) => p.id);
