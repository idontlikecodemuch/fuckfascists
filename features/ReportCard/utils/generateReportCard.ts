import type { Entity } from '../../../core/models';
import { getDisplayFigure } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import { getAllEntityAvoids, getPlatformAvoidsForWeek } from '../../../core/data';
import type { Platform } from '../../Survey/types';
import type { EntityAvoidSummary, ReportCardData } from '../types';

/**
 * Aggregates the week's avoidance events from local storage into a
 * ReportCardData object ready for display or sharing.
 * Pure data transform — no network calls, no side effects.
 */
export async function generateReportCard(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  weekOf: string,
  isPreview: boolean
): Promise<ReportCardData> {
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
  const platformAvoids = platformEvents.map(
    (e) => platformIndex.get(e.platformId)?.name ?? e.platformId
  );

  return {
    weekOf,
    entityAvoids,
    platformAvoids,
    totalEntityAvoids: entityAvoids.reduce((sum, e) => sum + e.count, 0),
    totalPlatformAvoids: platformAvoids.length,
    isPreview,
  };
}

/** Returns the Monday immediately following the given weekOf date. */
export function nextMondayOf(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}
