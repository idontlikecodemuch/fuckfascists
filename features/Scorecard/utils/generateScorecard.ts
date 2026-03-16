import type { Entity } from '../../../core/models';
import { getDisplayFigure } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import { getAllEntityAvoids, getPlatformAvoidsForWeek } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import type { EntityAvoidSummary, ScorecardData } from '../types';

/**
 * Aggregates the week's avoidance events from local storage into a
 * ScorecardData object ready for display or sharing.
 * Pure data transform — no network calls, no side effects.
 */
export async function generateScorecard(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  weekOf: string,
  isPreview: boolean
): Promise<ScorecardData> {
  const weekEnd = nextMondayOf(weekOf);

  // ── Entity avoids ──────────────────────────────────────────────────────────
  const allEntityAvoids = await getAllEntityAvoids(adapter);
  const weekEvents = allEntityAvoids.filter(
    (e) => e.date >= weekOf && e.date < weekEnd
  );

  const countMap = new Map<string, number>();
  for (const e of weekEvents) {
    countMap.set(e.entityId, (countMap.get(e.entityId) ?? 0) + e.count);
  }

  const entityIndex = new Map(entities.map((e) => [e.id, e]));
  const entityAvoids: EntityAvoidSummary[] = Array.from(countMap.entries())
    .map(([entityId, count]) => {
      const entity = entityIndex.get(entityId);
      // TODO: group entityAvoids by figure name so subsidiaries of the same parent
      // collapse under one entry (e.g. "Mark Zuckerberg: Instagram 4× · WhatsApp 2×")
      return { entityId, name: entity?.canonicalName ?? entityId, count, ceoName: entity ? getDisplayFigure(entity, entities) : undefined };
    })
    .sort((a, b) => b.count - a.count);

  // ── Platform avoids ────────────────────────────────────────────────────────
  const platformEvents = await getPlatformAvoidsForWeek(adapter, weekOf);
  const platformIndex = new Map(platforms.map((p) => [p.id, p]));
  // Aggregate per-day counts into a total per platform for the week.
  const platformCountMap = new Map<string, number>();
  for (const e of platformEvents) {
    platformCountMap.set(e.platformId, (platformCountMap.get(e.platformId) ?? 0) + e.count);
  }
  const platformAvoids = Array.from(platformCountMap.keys()).map(
    (id) => platformIndex.get(id)?.name ?? id
  );
  const totalPlatformAvoids = Array.from(platformCountMap.values()).reduce((sum, c) => sum + c, 0);

  return {
    weekOf,
    entityAvoids,
    platformAvoids,
    totalEntityAvoids: entityAvoids.reduce((sum, e) => sum + e.count, 0),
    totalPlatformAvoids,
    isPreview,
  };
}

/** Returns the Monday immediately following the given weekOf date. */
export function nextMondayOf(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}
