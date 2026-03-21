import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
} from 'react-native';
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
import { DayCircles } from './DayCircles';
import { PlatformGroupHeader } from './PlatformGroupHeader';
import { PlatformRow } from './PlatformRow';

const TRACK_DAILY_OPEN_KEY = 'track_daily_open_last_visit';

export function TrackList() {
  const {
    avoid,
    avoidForDate,
    clearFocus,
    focusPlatform,
    focusedFigureName,
    openPlatformDetails,
    openPlatformId,
    selectedPlatformId,
    togglePlatformDetails,
    focusGroup,
    isDefeated,
    platforms,
    personWeeklyAvoids,
    queueArenaHit,
    todayActions,
    weekAvoids,
    weekOf,
  } = useTrack();

  const baseListData = useMemo(() => buildListData(platforms), [platforms]);
  const [previewOpenIds, setPreviewOpenIds] = useState<string[] | null>(null);
  const platformItemsById = useMemo(() => {
    return new Map(weekAvoids.map((item) => [item.platform.id, item]));
  }, [weekAvoids]);
  const detailPlatformIds = useMemo(() => {
    if (previewOpenIds) return new Set(previewOpenIds);
    return openPlatformId ? new Set([openPlatformId]) : new Set<string>();
  }, [openPlatformId, previewOpenIds]);
  const listData = useMemo(() => buildListData(platforms, detailPlatformIds), [detailPlatformIds, platforms]);
  const allPlatformIds = useMemo(() => {
    return baseListData
      .filter((item): item is Extract<TrackListItem, { type: 'childRow' | 'platformRow' }> =>
        item.type === 'childRow' || item.type === 'platformRow')
      .map((item) => item.platformId);
  }, [baseListData]);
  const dailyOpenHandledRef = useRef(false);
  const collapseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previewDismissedRef = useRef(false);

  const animateNextLayout = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  const cancelPendingAutoCollapse = useCallback(() => {
    collapseTimersRef.current.forEach(clearTimeout);
    collapseTimersRef.current = [];
  }, []);

  const dismissDailyPreview = useCallback(() => {
    previewDismissedRef.current = true;
    cancelPendingAutoCollapse();
    setPreviewOpenIds((prev) => {
      if (prev === null) return prev;
      return null;
    });
  }, [cancelPendingAutoCollapse]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
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
    previewDismissedRef.current = false;

    let cancelled = false;
    cancelPendingAutoCollapse();

    (async () => {
      const today = getLocalDateString();
      const lastVisit = await SecureStore.getItemAsync(TRACK_DAILY_OPEN_KEY).catch(() => null);
      if (cancelled || previewDismissedRef.current || lastVisit === today) return;

      animateNextLayout();
      setPreviewOpenIds(allPlatformIds);
      await SecureStore.setItemAsync(TRACK_DAILY_OPEN_KEY, today).catch(() => undefined);

      allPlatformIds.forEach((platformId, index) => {
        const timer = setTimeout(() => {
          if (previewDismissedRef.current) return;
          animateNextLayout();
          setPreviewOpenIds((prev) => {
            if (!prev) return prev;
            const next = prev.filter((id) => id !== platformId);
            return next.length > 0 ? next : null;
          });
        }, DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS + (index * DAY_CIRCLES_COLLAPSE_STAGGER_MS));
        collapseTimersRef.current.push(timer);
      });
    })();

    return () => {
      cancelled = true;
      cancelPendingAutoCollapse();
    };
  }, [allPlatformIds, animateNextLayout, cancelPendingAutoCollapse]);

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
          focused={selectedPlatformId === null && focusedFigureName === item.figureName}
          onPress={() => {
            animateNextLayout();
            dismissDailyPreview();
            focusGroup(item.figureName);
          }}
        />
      );
    }

    const platformItem = platformItemsById.get(item.platformId);
    if (!platformItem) return null;

    const figureName = getDisplayFigure(platformItem.platform);
    const platformId = platformItem.platform.id;
    const focused = selectedPlatformId === platformId;
    const expanded = detailPlatformIds.has(platformId);
    const todayAvoided = (platformItem.dayCounts.get(getLocalDateString()) ?? 0) > 0;

    if (item.type === 'dayCircles') {
      return (
        <DayCircles
          weekOf={weekOf}
          platformName={platformItem.platform.name}
          dayCounts={platformItem.dayCounts}
          isChild={item.isChild}
          onAvoidDate={async (date) => {
            animateNextLayout();
            dismissDailyPreview();
            openPlatformDetails(platformId);
            const delay = getArenaDelay(figureName);
            const recorded = await avoidForDate(platformId, date);
            if (recorded) queueArenaHit(figureName, delay);
          }}
        />
      );
    }

    return (
      <PlatformRow
        item={platformItem}
        isChild={item.type === 'childRow'}
        focused={focused}
        expanded={expanded}
        dimmed={focusedFigureName !== null && !focused}
        defeated={isDefeated(figureName)}
        onRowPress={() => {
          animateNextLayout();
          dismissDailyPreview();
          togglePlatformDetails(platformId);
        }}
        onAvoidPress={async () => {
          dismissDailyPreview();
          const delay = getArenaDelay(figureName);

          if (!todayAvoided) {
            animateNextLayout();
            focusPlatform(platformId);
            const recorded = await avoid(platformId);
            if (recorded) queueArenaHit(figureName, delay);
            return;
          }

          animateNextLayout();
          togglePlatformDetails(platformId);
          queueArenaHit(figureName, delay);
        }}
      />
    );
  }, [
    avoid,
    avoidForDate,
    animateNextLayout,
    detailPlatformIds,
    dismissDailyPreview,
    focusPlatform,
    focusedFigureName,
    focusGroup,
    getArenaDelay,
    isDefeated,
    openPlatformDetails,
    personWeeklyAvoids,
    platformItemsById,
    queueArenaHit,
    selectedPlatformId,
    togglePlatformDetails,
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
        focusedFigureName,
        openPlatformId,
        previewOpenIds,
        selectedPlatformId,
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
