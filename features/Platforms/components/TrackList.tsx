import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
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

  // Set of item keys (panelStart/panelEnd/group/row/dayCircles) belonging to a
  // panel that contains the focused row. Used to swap panel bevel pieces from
  // grey to cyan so the dimensional outline itself reads as the focus highlight
  // — no separate interior cyan border needed.
  const focusedPanelItemKeys = useMemo(() => {
    const focused = new Set<string>();
    let currentPanel: { startKey: string; memberKeys: string[]; hasFocus: boolean } | null = null;

    for (const item of listData) {
      if (item.type === 'panelStart') {
        currentPanel = { startKey: item.key, memberKeys: [item.key], hasFocus: false };
        continue;
      }
      if (item.type === 'panelEnd') {
        if (!currentPanel) continue;
        currentPanel.memberKeys.push(item.key);
        if (currentPanel.hasFocus) {
          for (const k of currentPanel.memberKeys) focused.add(k);
        }
        currentPanel = null;
        continue;
      }
      if (currentPanel) currentPanel.memberKeys.push(item.key);

      let itemFocused = false;
      if (item.type === 'platformRow' || item.type === 'childRow') {
        itemFocused = item.platformId === selectedPlatformId;
      } else if (item.type === 'groupHeader') {
        itemFocused = selectedPlatformId === null && focusedFigureName === item.figureName;
      }
      if (itemFocused && currentPanel) currentPanel.hasFocus = true;
    }

    return focused;
  }, [focusedFigureName, listData, selectedPlatformId]);
  const dailyOpenHandledRef = useRef(false);
  const collapseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previewDismissedRef = useRef(false);

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

      setPreviewOpenIds(allPlatformIds);
      await SecureStore.setItemAsync(TRACK_DAILY_OPEN_KEY, today).catch(() => undefined);

      allPlatformIds.forEach((platformId, index) => {
        const timer = setTimeout(() => {
          if (previewDismissedRef.current) return;
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
  }, [allPlatformIds, cancelPendingAutoCollapse]);

  const getArenaDelay = useCallback((figureName: string) => {
    return focusedFigureName === figureName ? 0 : ARENA_TRANSITION_MS;
  }, [focusedFigureName]);

  const renderItem = useCallback(({ item }: { item: TrackListItem }) => {
    const panelFocused = focusedPanelItemKeys.has(item.key);
    const sidesStyle = panelFocused ? styles.panelSidesFocused : styles.panelSides;

    if (item.type === 'panelStart') {
      return <View style={panelFocused ? styles.panelTopCapFocused : styles.panelTopCap} />;
    }
    if (item.type === 'panelEnd') {
      return <View style={panelFocused ? styles.panelBottomCapFocused : styles.panelBottomCap} />;
    }
    if (item.type === 'separator') {
      return <View style={styles.separator} />;
    }

    if (item.type === 'groupHeader') {
      return (
        <View style={sidesStyle}>
          <PlatformGroupHeader
            figureName={item.figureName}
            shortName={item.shortName}
            totalAvoids={personWeeklyAvoids(item.figureName)}
            focused={selectedPlatformId === null && focusedFigureName === item.figureName}
            panelFocused={panelFocused}
            onPress={() => {
              dismissDailyPreview();
              focusGroup(item.figureName);
            }}
          />
        </View>
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
        <Animated.View entering={FadeIn.duration(200)} style={sidesStyle}>
          <DayCircles
            weekOf={weekOf}
            platformName={platformItem.platform.name}
            dayCounts={platformItem.dayCounts}
            isChild={item.isChild}
            onAvoidDate={async (date) => {
              dismissDailyPreview();
              openPlatformDetails(platformId);
              const delay = getArenaDelay(figureName);
              const recorded = await avoidForDate(platformId, date);
              if (recorded) queueArenaHit(figureName, delay);
            }}
          />
        </Animated.View>
      );
    }

    return (
      <View style={sidesStyle}>
        <PlatformRow
          item={platformItem}
          isChild={item.type === 'childRow'}
          focused={focused}
          panelFocused={panelFocused}
          expanded={expanded}
          dimmed={focusedFigureName !== null && !focused}
          onRowPress={() => {
            dismissDailyPreview();
            togglePlatformDetails(platformId);
          }}
          onAvoidPress={async () => {
            dismissDailyPreview();
            const delay = getArenaDelay(figureName);

            if (!todayAvoided) {
              focusPlatform(platformId);
              const recorded = await avoid(platformId);
              if (recorded) queueArenaHit(figureName, delay);
              return;
            }

            togglePlatformDetails(platformId);
            queueArenaHit(figureName, delay);
          }}
        />
      </View>
    );
  }, [
    avoid,
    avoidForDate,
    detailPlatformIds,
    dismissDailyPreview,
    focusPlatform,
    focusedFigureName,
    focusedPanelItemKeys,
    focusGroup,
    getArenaDelay,
    openPlatformDetails,
    personWeeklyAvoids,
    platformItemsById,
    queueArenaHit,
    selectedPlatformId,
    togglePlatformDetails,
    weekOf,
  ]);

  return (
    <Animated.FlatList
      itemLayoutAnimation={LinearTransition.duration(250)}
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
  panelTopCap: {
    marginHorizontal: theme.space.sm,
    height: 4,
    backgroundColor: theme.colors.panelOuter,
    borderTopWidth: theme.borders.bevel.width,
    borderLeftWidth: theme.borders.bevel.width,
    borderRightWidth: theme.borders.bevel.width,
    borderTopColor: theme.colors.bevelLight,
    borderLeftColor: theme.colors.bevelLight,
    borderRightColor: theme.colors.bevelDark,
    borderTopLeftRadius: theme.radii.sharp,
    borderTopRightRadius: theme.radii.sharp,
  },
  panelTopCapFocused: {
    marginHorizontal: theme.space.sm,
    height: 4,
    // Match the focused row + sides bg so the inside of the cyan bevel reads
    // as one filled cell — no dark gap between the bevel and the row.
    backgroundColor: theme.colors.trackFocusBg,
    borderTopWidth: theme.borders.bevel.width,
    borderLeftWidth: theme.borders.bevel.width,
    borderRightWidth: theme.borders.bevel.width,
    borderTopColor: theme.colors.focusBevelLight,
    borderLeftColor: theme.colors.focusBevelLight,
    borderRightColor: theme.colors.focusBevelDark,
    borderTopLeftRadius: theme.radii.sharp,
    borderTopRightRadius: theme.radii.sharp,
  },
  panelBottomCap: {
    marginHorizontal: theme.space.sm,
    height: 4,
    backgroundColor: theme.colors.panelOuter,
    borderBottomWidth: theme.borders.bevel.width,
    borderLeftWidth: theme.borders.bevel.width,
    borderRightWidth: theme.borders.bevel.width,
    borderBottomColor: theme.colors.bevelDark,
    borderLeftColor: theme.colors.bevelLight,
    borderRightColor: theme.colors.bevelDark,
    borderBottomLeftRadius: theme.radii.sharp,
    borderBottomRightRadius: theme.radii.sharp,
  },
  panelBottomCapFocused: {
    marginHorizontal: theme.space.sm,
    height: 4,
    backgroundColor: theme.colors.trackFocusBg,
    borderBottomWidth: theme.borders.bevel.width,
    borderLeftWidth: theme.borders.bevel.width,
    borderRightWidth: theme.borders.bevel.width,
    borderBottomColor: theme.colors.focusBevelDark,
    borderLeftColor: theme.colors.focusBevelLight,
    borderRightColor: theme.colors.focusBevelDark,
    borderBottomLeftRadius: theme.radii.sharp,
    borderBottomRightRadius: theme.radii.sharp,
  },
  panelSides: {
    marginHorizontal: theme.space.sm,
    borderLeftWidth: theme.borders.bevel.width,
    borderRightWidth: theme.borders.bevel.width,
    borderLeftColor: theme.colors.bevelLight,
    borderRightColor: theme.colors.bevelDark,
    backgroundColor: theme.colors.panelOuter,
    overflow: 'visible',
  },
  panelSidesFocused: {
    marginHorizontal: theme.space.sm,
    borderLeftWidth: theme.borders.bevel.width,
    borderRightWidth: theme.borders.bevel.width,
    borderLeftColor: theme.colors.focusBevelLight,
    borderRightColor: theme.colors.focusBevelDark,
    backgroundColor: theme.colors.trackFocusBg,
    overflow: 'visible',
  },
  separator: {
    height: 1,
    marginHorizontal: theme.space.sm,
    backgroundColor: theme.colors.panelBorder,
    opacity: 0.15,
    marginVertical: theme.space.xs,
  },
});
