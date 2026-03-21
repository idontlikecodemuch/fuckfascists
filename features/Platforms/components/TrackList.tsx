import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getLocalDateString } from '../../../core/utils/localDate';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import {
  ARENA_TRANSITION_MS,
  DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS,
  DAY_CIRCLES_COLLAPSE_STAGGER_MS,
} from '../../../config/constants';
import { getDisplayFigure, useTrack } from '../context/TrackContext';
import type { TrackListItem } from '../utils/listData';
import { buildListData } from '../utils/listData';
import { PlatformGroupHeader } from './PlatformGroupHeader';
import { PlatformRow } from './PlatformRow';

const TRACK_DAILY_OPEN_KEY = 'track_daily_open_last_visit';

export function TrackList() {
  const {
    avoid,
    avoidForDate,
    clearFocus,
    collapseOne,
    expandAll,
    expandedIds,
    focusedFigureName,
    focusedPlatformId,
    focusGroup,
    focusRow,
    isDefeated,
    platforms,
    personWeeklyAvoids,
    pressExpandableRow,
    queueArenaHit,
    todayActions,
    weekAvoids,
    weekOf,
  } = useTrack();

  const listData = useMemo(() => buildListData(platforms), [platforms]);
  const platformItemsById = useMemo(() => {
    return new Map(weekAvoids.map((item) => [item.platform.id, item]));
  }, [weekAvoids]);
  const allPlatformIds = useMemo(() => {
    return listData
      .filter((item): item is Extract<TrackListItem, { type: 'childRow' | 'platformRow' }> =>
        item.type === 'childRow' || item.type === 'platformRow')
      .map((item) => item.platformId);
  }, [listData]);
  const dailyOpenHandledRef = useRef(false);
  const collapseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cancelPendingAutoCollapse = useCallback(() => {
    collapseTimersRef.current.forEach(clearTimeout);
    collapseTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cancelPendingAutoCollapse();
      clearFocus();
    };
  }, [cancelPendingAutoCollapse, clearFocus]);

  useEffect(() => {
    if (dailyOpenHandledRef.current || allPlatformIds.length === 0) return;
    dailyOpenHandledRef.current = true;

    let cancelled = false;
    cancelPendingAutoCollapse();

    (async () => {
      const today = getLocalDateString();
      const lastVisit = await SecureStore.getItemAsync(TRACK_DAILY_OPEN_KEY).catch(() => null);
      if (cancelled || lastVisit === today) return;

      expandAll(allPlatformIds);
      await SecureStore.setItemAsync(TRACK_DAILY_OPEN_KEY, today).catch(() => undefined);

      allPlatformIds.forEach((platformId, index) => {
        const timer = setTimeout(() => {
          collapseOne(platformId);
        }, DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS + (index * DAY_CIRCLES_COLLAPSE_STAGGER_MS));
        collapseTimersRef.current.push(timer);
      });
    })();

    return () => {
      cancelled = true;
      cancelPendingAutoCollapse();
    };
  }, [allPlatformIds, cancelPendingAutoCollapse, collapseOne, expandAll]);

  const getArenaDelay = useCallback((figureName: string) => {
    return focusedFigureName === figureName ? 0 : ARENA_TRANSITION_MS;
  }, [focusedFigureName]);

  const renderItem = useCallback(({ item }: { item: TrackListItem }) => {
    if (item.type === 'groupHeader') {
      return (
        <PlatformGroupHeader
          figureName={item.figureName}
          shortName={item.shortName}
          totalAvoids={personWeeklyAvoids(item.figureName)}
          focused={focusedPlatformId === item.figureName}
          onPress={() => {
            cancelPendingAutoCollapse();
            focusGroup(item.figureName);
          }}
        />
      );
    }

    const platformItem = platformItemsById.get(item.platformId);
    if (!platformItem) return null;

    const figureName = getDisplayFigure(platformItem.platform);
    const platformId = platformItem.platform.id;
    const focused = focusedPlatformId === platformId;
    const expanded = expandedIds.has(platformId);
    const todayAvoided = (platformItem.dayCounts.get(getLocalDateString()) ?? 0) > 0;

    return (
      <PlatformRow
        item={platformItem}
        isChild={item.type === 'childRow'}
        weekOf={weekOf}
        focused={focused}
        expanded={expanded}
        dimmed={focusedPlatformId !== null && !focused}
        defeated={isDefeated(figureName)}
        onRowPress={() => {
          cancelPendingAutoCollapse();
          pressExpandableRow(platformId);
        }}
        onAvoidPress={async () => {
          cancelPendingAutoCollapse();
          const delay = getArenaDelay(figureName);

          if (!todayAvoided) {
            if (!focused) focusRow(platformId);
            const recorded = await avoid(platformId);
            if (recorded) queueArenaHit(figureName, delay);
            return;
          }

          pressExpandableRow(platformId);
          queueArenaHit(figureName, delay);
        }}
        onAvoidDate={async (date) => {
          cancelPendingAutoCollapse();
          const delay = getArenaDelay(figureName);

          if (!focused) focusRow(platformId);
          const recorded = await avoidForDate(platformId, date);
          if (recorded) queueArenaHit(figureName, delay);
        }}
      />
    );
  }, [
    avoid,
    avoidForDate,
    cancelPendingAutoCollapse,
    expandedIds,
    focusedPlatformId,
    focusGroup,
    focusRow,
    getArenaDelay,
    isDefeated,
    personWeeklyAvoids,
    platformItemsById,
    pressExpandableRow,
    queueArenaHit,
    weekOf,
  ]);

  return (
    <FlatList
      data={listData}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      extraData={{
        expandedKey: Array.from(expandedIds).join('|'),
        focusedPlatformId,
        todayKey: Array.from(todayActions).join('|'),
        weekAvoids,
      }}
      removeClippedSubviews={false}
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
