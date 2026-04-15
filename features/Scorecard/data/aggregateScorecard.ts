import type { Entity } from '../../../core/models';
import { getDisplayFigure } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import { getAllEntityAvoids, getPlatformAvoidsForWeek } from '../../../core/data';
import { SURFACE_TRACK } from '../../../config/constants';
import type { Platform } from '../../Platforms/types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ScorecardSource {
  name: string;       // entity alias or platform name
  count: number;
  verb: string;       // "stayed off" | "skipped" | "walked past" | "avoided"
  surface?: number;   // 1=map, 2=scan, 3=track (numeric for privacy)
}

/** A child entity that contributed avoids under a parent CEO figure. */
export interface ScorecardChildEntity {
  name: string;
  count: number;
  surfaces: Set<number>;
}

export interface ScorecardPerson {
  figureName: string;                // publicFigureName (ceoName fallback)
  totalCount: number;                // sum across all sources
  sources: ScorecardSource[];
  surfaces: Set<number>;             // union of all source surfaces
  children: ScorecardChildEntity[];  // child entities for expandable rows
}

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
  const weekEndDate = weekEnd(weekOf);
  const entityIndex = new Map(entities.map((e) => [e.id, e]));
  const platformIndex = new Map(platforms.map((p) => [p.id, p]));

  const personMap = new Map<string, PersonAccum>();

  // ── Entity avoids ──────────────────────────────────────────────────────────
  const allEntityAvoids = await getAllEntityAvoids(adapter);
  const weekEntityAvoids = allEntityAvoids.filter(
    (e) => e.date >= weekOf && e.date < weekEndDate,
  );

  // Sum counts + collect surfaces per entityId
  const entityAgg = new Map<string, { count: number; surfaces: Set<number> }>();
  for (const e of weekEntityAvoids) {
    const existing = entityAgg.get(e.entityId);
    if (existing) {
      existing.count += e.count;
      if (e.surface != null) existing.surfaces.add(e.surface);
    } else {
      const surfaces = new Set<number>();
      if (e.surface != null) surfaces.add(e.surface);
      entityAgg.set(e.entityId, { count: e.count, surfaces });
    }
  }

  for (const [entityId, { count, surfaces }] of entityAgg) {
    const entity = entityIndex.get(entityId);
    const figureName = entity ? getDisplayFigure(entity, entities) : entityId;
    const displayName = entity?.aliases[0] ?? entity?.canonicalName ?? entityId;
    const verb = entity ? verbForCategory(entity.categoryTags) : 'avoided';
    const surface = surfaces.size === 1 ? [...surfaces][0] : undefined;
    addSource(personMap, figureName, displayName, count, verb, surface, surfaces);
  }

  // ── Platform avoids ────────────────────────────────────────────────────────
  const platformEvents = await getPlatformAvoidsForWeek(adapter, weekOf);

  const platformCounts = new Map<string, number>();
  for (const e of platformEvents) {
    platformCounts.set(e.platformId, (platformCounts.get(e.platformId) ?? 0) + e.count);
  }

  const trackSurfaces = new Set([SURFACE_TRACK]);
  for (const [platformId, count] of platformCounts) {
    const platform = platformIndex.get(platformId);
    const figureName = platform?.publicFigureName ?? platform?.ceoName ?? platformId;
    const displayName = platform?.name ?? platformId;
    const verb = platform ? verbForCategory(platform.categoryTags) : 'avoided';
    addSource(personMap, figureName, displayName, count, verb, SURFACE_TRACK, trackSurfaces);
  }

  // ── Build result ───────────────────────────────────────────────────────────
  const result: ScorecardPerson[] = [];
  for (const [figureName, data] of personMap) {
    result.push({
      figureName,
      totalCount: data.totalCount,
      sources: Array.from(data.sources.values()),
      surfaces: data.surfaces,
      children: Array.from(data.children.values()),
    });
  }

  result.sort((a, b) => b.totalCount - a.totalCount);
  return result;
}

// ── Internal types ────────────────────────────────────────────────────────────

type PersonAccum = {
  sources: Map<string, ScorecardSource>;
  totalCount: number;
  surfaces: Set<number>;
  children: Map<string, ScorecardChildEntity>;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function addSource(
  personMap: Map<string, PersonAccum>,
  figureName: string,
  sourceName: string,
  count: number,
  verb: string,
  surface: number | undefined,
  sourceSurfaces: Set<number>,
): void {
  let entry = personMap.get(figureName);
  if (!entry) {
    entry = { sources: new Map(), totalCount: 0, surfaces: new Set(), children: new Map() };
    personMap.set(figureName, entry);
  }
  entry.totalCount += count;
  for (const s of sourceSurfaces) entry.surfaces.add(s);

  const existing = entry.sources.get(sourceName);
  if (existing) {
    existing.count += count;
  } else {
    entry.sources.set(sourceName, { name: sourceName, count, verb, surface });
  }

  const child = entry.children.get(sourceName);
  if (child) {
    child.count += count;
    for (const s of sourceSurfaces) child.surfaces.add(s);
  } else {
    entry.children.set(sourceName, { name: sourceName, count, surfaces: new Set(sourceSurfaces) });
  }
}

/** Returns the date string 7 days after the given weekOf. */
function weekEnd(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}
