import type { Platform } from '../types';
import { getDisplayFigure } from '../context/TrackContext';
import { SHORT_PARENT_NAMES } from '../../../config/constants';

// ── List item types ──────────────────────────────────────────────────────────

export type TrackListItem =
  | { type: 'groupHeader'; key: string; figureName: string; shortName: string; childPlatformIds: string[] }
  | { type: 'childRow'; key: string; platformId: string }
  | { type: 'platformRow'; key: string; platformId: string }
  | { type: 'dayCircles'; key: string; platformId: string; isChild: boolean }
  | { type: 'panelStart'; key: string; variant: 'group' | 'singleton' }
  | { type: 'panelEnd'; key: string }
  | { type: 'separator'; key: string };

// ── Build flat data array ────────────────────────────────────────────────────

/**
 * Transforms the active platforms list into a flat array suitable for FlatList.
 * Groups platforms by parentCompany (>1 member = group), singletons standalone.
 * Groups first, then singletons. Wraps each container in panelStart/panelEnd
 * with separators between them.
 */
export function buildListData(
  platforms: Platform[],
  detailPlatformIds: ReadonlySet<string> = new Set(),
): TrackListItem[] {
  const items: TrackListItem[] = [];
  const grouped = new Map<string, Platform[]>();
  const singletons: Platform[] = [];

  const companyPlatforms = new Map<string, Platform[]>();
  for (const p of platforms) {
    const existing = companyPlatforms.get(p.parentCompany) ?? [];
    existing.push(p);
    companyPlatforms.set(p.parentCompany, existing);
  }

  for (const [company, members] of companyPlatforms) {
    if (members.length > 1) {
      grouped.set(company, members);
    } else {
      singletons.push(members[0]!);
    }
  }

  let containerIndex = 0;

  for (const [company, members] of grouped) {
    if (containerIndex > 0) {
      items.push({ type: 'separator', key: `sep-${containerIndex}` });
    }

    items.push({ type: 'panelStart', key: `panel-start-${company}`, variant: 'group' });

    const figure = getDisplayFigure(members[0]!);
    const shortName = SHORT_PARENT_NAMES[company]
      ?? company.replace(/,?\s*(Inc|Corp|LLC|Ltd|\.com)\.?/gi, '').trim().toUpperCase();

    items.push({
      type: 'groupHeader',
      key: `group-${company}`,
      figureName: figure,
      shortName,
      childPlatformIds: members.map((m) => m.id),
    });

    for (const member of members) {
      items.push({ type: 'childRow', key: `child-${member.id}`, platformId: member.id });
      if (detailPlatformIds.has(member.id)) {
        items.push({
          type: 'dayCircles',
          key: `days-${member.id}`,
          platformId: member.id,
          isChild: true,
        });
      }
    }

    items.push({ type: 'panelEnd', key: `panel-end-${company}` });
    containerIndex++;
  }

  for (const p of singletons) {
    if (containerIndex > 0) {
      items.push({ type: 'separator', key: `sep-${containerIndex}` });
    }

    items.push({ type: 'panelStart', key: `panel-start-${p.id}`, variant: 'singleton' });
    items.push({ type: 'platformRow', key: `platform-${p.id}`, platformId: p.id });
    if (detailPlatformIds.has(p.id)) {
      items.push({
        type: 'dayCircles',
        key: `days-${p.id}`,
        platformId: p.id,
        isChild: false,
      });
    }
    items.push({ type: 'panelEnd', key: `panel-end-${p.id}` });
    containerIndex++;
  }

  return items;
}
