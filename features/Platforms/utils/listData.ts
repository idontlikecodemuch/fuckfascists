import type { Platform } from '../types';
import { getDisplayFigure } from '../context/TrackContext';
import { platformsCopy } from '../../../copy/platforms';

// ── List item types ──────────────────────────────────────────────────────────

export type TrackListItem =
  | { type: 'groupHeader'; key: string; figureName: string; shortName: string; childPlatformIds: string[] }
  | { type: 'childRow'; key: string; platformId: string }
  | { type: 'platformRow'; key: string; platformId: string };

// ── Build flat data array ────────────────────────────────────────────────────

/**
 * Transforms the active platforms list into a flat array suitable for FlatList.
 * Groups platforms by parentCompany (>1 member = group), singletons standalone.
 * Groups first, then singletons.
 */
export function buildListData(platforms: Platform[]): TrackListItem[] {
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

  for (const [company, members] of grouped) {
    const figure = getDisplayFigure(members[0]!);
    const shortName = platformsCopy.shortParentNames[company]
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
    }
  }

  for (const p of singletons) {
    items.push({ type: 'platformRow', key: `platform-${p.id}`, platformId: p.id });
  }

  return items;
}
