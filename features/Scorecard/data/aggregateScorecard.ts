import type { Entity, EntityAvoidEvent, PlatformAvoidEvent } from '../../../core/models';
import { getDisplayFigure } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import { getAllEntityAvoids, getPlatformAvoidsForWeek } from '../../../core/data';
import type { Platform } from '../../Platforms/types';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ScorecardSource = {
  name: string;    // entity alias or platform name
  count: number;
  verb: string;    // "stayed off" | "skipped" | "walked past" | "avoided"
};

export type ScorecardPerson = {
  figureName: string;    // publicFigureName (ceoName fallback)
  totalCount: number;    // sum across all sources
  sources: ScorecardSource[];
};

// ── Verb mapping ───────────────────────────────────────────────────────────────

/**
 * Derives the display verb from an entity's or platform's categoryTags.
 * First matching tag wins. Falls back to "avoided" when no tag matches.
 */
export function verbForCategory(categoryTags: string[]): string {
  for (const tag of categoryTags) {
    const lower = tag.toLowerCase();
    if (lower === 'platform' || lower === 'social' || lower === 'messaging') return 'stayed off';
    if (lower === 'ecommerce' || lower === 'streaming' || lower === 'shopping') return 'skipped';
    if (lower === 'retailer' || lower === 'restaurant' || lower === 'grocery') return 'walked past';
  }
  return 'avoided';
}

// ── Aggregation ────────────────────────────────────────────────────────────────

/**
 * Aggregates the week's entity and platform avoidance events into a list of
 * ScorecardPerson entries, grouped by resolved public figure name.
 *
 * Pure data function — no UI, no side effects beyond storage reads.
 * Accepts entity list and platform list as parameters for testability.
 */
export async function aggregateScorecard(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  weekOf: string,
): Promise<ScorecardPerson[]> {
  const weekEnd = nextMonday(weekOf);
  const entityIndex = new Map(entities.map((e) => [e.id, e]));
  const platformIndex = new Map(platforms.map((p) => [p.id, p]));

  // Mutable accumulator: figureName → { sources map, running total }
  const personMap = new Map<string, { sources: Map<string, ScorecardSource>; totalCount: number }>();

  // ── Entity avoids ──────────────────────────────────────────────────────────
  const allEntityAvoids = await getAllEntityAvoids(adapter);
  const weekEntityAvoids = allEntityAvoids.filter(
    (e) => e.date >= weekOf && e.date < weekEnd,
  );

  // Sum counts per entityId
  const entityCounts = new Map<string, number>();
  for (const e of weekEntityAvoids) {
    entityCounts.set(e.entityId, (entityCounts.get(e.entityId) ?? 0) + e.count);
  }

  for (const [entityId, count] of entityCounts) {
    const entity = entityIndex.get(entityId);
    const figureName = entity ? getDisplayFigure(entity, entities) : entityId;
    const displayName = entity?.aliases[0] ?? entity?.canonicalName ?? entityId;
    const verb = entity ? verbForCategory(entity.categoryTags) : 'avoided';
    addSource(personMap, figureName, displayName, count, verb);
  }

  // ── Platform avoids ────────────────────────────────────────────────────────
  const platformEvents = await getPlatformAvoidsForWeek(adapter, weekOf);

  // Sum counts per platformId
  const platformCounts = new Map<string, number>();
  for (const e of platformEvents) {
    platformCounts.set(e.platformId, (platformCounts.get(e.platformId) ?? 0) + e.count);
  }

  for (const [platformId, count] of platformCounts) {
    const platform = platformIndex.get(platformId);
    const figureName = platform?.ceoName ?? platformId;
    const displayName = platform?.name ?? platformId;
    const verb = platform ? verbForCategory(platform.categoryTags) : 'avoided';
    addSource(personMap, figureName, displayName, count, verb);
  }

  // ── Build result ───────────────────────────────────────────────────────────
  const result: ScorecardPerson[] = [];
  for (const [figureName, data] of personMap) {
    result.push({
      figureName,
      totalCount: data.totalCount,
      sources: Array.from(data.sources.values()),
    });
  }

  result.sort((a, b) => b.totalCount - a.totalCount);
  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Adds a source to the person accumulator, merging by figureName. */
function addSource(
  personMap: Map<string, { sources: Map<string, ScorecardSource>; totalCount: number }>,
  figureName: string,
  sourceName: string,
  count: number,
  verb: string,
): void {
  let entry = personMap.get(figureName);
  if (!entry) {
    entry = { sources: new Map(), totalCount: 0 };
    personMap.set(figureName, entry);
  }
  entry.totalCount += count;

  const existing = entry.sources.get(sourceName);
  if (existing) {
    existing.count += count;
  } else {
    entry.sources.set(sourceName, { name: sourceName, count, verb });
  }
}

/** Returns the Monday immediately following the given weekOf date string. */
function nextMonday(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}
