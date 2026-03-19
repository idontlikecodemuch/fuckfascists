import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useTrack, getDisplayFigure } from '../context/TrackContext';
import { platformsCopy } from '../../../copy/platforms';
import { TrackRow } from './TrackRow';
import { DayCircles } from './DayCircles';
import { theme } from '../../../design/tokens';
import {
  DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS,
  DAY_CIRCLES_COLLAPSE_STAGGER_MS,
} from '../../../config/constants';
import { getLocalDateString } from '../../../core/utils/localDate';
import type { Platform } from '../types';

// ── List item types ──────────────────────────────────────────────────────────

export type TrackListItem =
  | { type: 'groupHeader'; key: string; figureName: string; shortName: string; childPlatformIds: string[] }
  | { type: 'childRow'; key: string; platformId: string }
  | { type: 'platformRow'; key: string; platformId: string };

// ── Build flat data array ────────────────────────────────────────────────────

function buildListData(platforms: Platform[]): TrackListItem[] {
  const items: TrackListItem[] = [];
  const grouped = new Map<string, Platform[]>();
  const singletons: Platform[] = [];

  // Group by parentCompany
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

  // Groups first, then singletons
  for (const [company, members] of grouped) {
    const figure = getDisplayFigure(members[0]!);
    const shortName = platformsCopy.shortParentNames[company] ?? company.replace(/,?\s*(Inc|Corp|LLC|Ltd|\.com)\.?/gi, '').trim().toUpperCase();

    items.push({
      type: 'groupHeader',
      key: `group-${company}`,
      figureName: figure,
      shortName,
      childPlatformIds: members.map((m) => m.id),
    });

    for (const member of members) {
      items.push({
        type: 'childRow',
        key: `child-${member.id}`,
        platformId: member.id,
      });
    }
  }

  for (const p of singletons) {
    items.push({
      type: 'platformRow',
      key: `platform-${p.id}`,
      platformId: p.id,
    });
  }

  return items;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * FlatList rendering the Track screen's platform list.
 * Flat data array with three item types: groupHeader, childRow, platformRow.
 *
 * Daily open animation: on first visit of the day, all rows start expanded
 * showing day circles, then ease closed after a configurable delay with
 * top-to-bottom stagger.
 */
export function TrackList() {
  const { platforms, weekAvoids, weekOf, avoidForDate } = useTrack();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const dailyOpenDone = useRef(false);

  const listData = useMemo(() => buildListData(platforms), [platforms]);

  // All platform IDs for daily open animation
  const allPlatformIds = useMemo(() => {
    return listData
      .filter((item): item is Extract<TrackListItem, { type: 'childRow' | 'platformRow' }> =>
        item.type === 'childRow' || item.type === 'platformRow')
      .map((item) => item.platformId);
  }, [listData]);

  // Daily open animation: expand all on first visit, then stagger-collapse
  useEffect(() => {
    if (dailyOpenDone.current || allPlatformIds.length === 0) return;
    dailyOpenDone.current = true;

    // Start with all expanded
    setExpandedIds(new Set(allPlatformIds));

    // Stagger collapse top to bottom
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < allPlatformIds.length; i++) {
      const timer = setTimeout(() => {
        const id = allPlatformIds[i]!;
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS + (i * DAY_CIRCLES_COLLAPSE_STAGGER_MS));
      timers.push(timer);
    }

    return () => { timers.forEach(clearTimeout); };
  }, [allPlatformIds]);

  const toggleExpand = useCallback((platformId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: TrackListItem }) => {
    if (item.type === 'groupHeader') {
      return <TrackRow item={item} expanded={false} onToggleExpand={toggleExpand} />;
    }

    const platformId = item.platformId;
    const expanded = expandedIds.has(platformId);
    const platformItem = weekAvoids.find((wa) => wa.platform.id === platformId);

    return (
      <View>
        <TrackRow item={item} expanded={expanded} onToggleExpand={toggleExpand} />
        {platformItem && (
          <DayCircles
            weekOf={weekOf}
            platformName={platformItem.platform.name}
            dayCounts={platformItem.dayCounts}
            onAvoidDate={async (date) => { await avoidForDate(platformId, date); }}
            expanded={expanded}
          />
        )}
      </View>
    );
  }, [expandedIds, weekAvoids, weekOf, avoidForDate, toggleExpand]);

  const keyExtractor = useCallback((item: TrackListItem) => item.key, []);

  return (
    <FlatList<TrackListItem>
      data={listData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      accessibilityRole="list"
      accessibilityLabel={platformsCopy.checklist}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space['3xl'],
  },
});
