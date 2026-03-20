import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { TRACKED_PLATFORMS } from './data/platformList';
import { usePlatformRoster } from './hooks/usePlatformRoster';
import { useNudgeNotification } from './hooks/useNudgeNotification';
import { TrackProvider, useTrack } from './context/TrackContext';
import { TrackHeader } from './components/TrackHeader';
import { GameArena } from './components/GameArena';
import { PlatformGroupHeader } from './components/PlatformGroupHeader';
import { PlatformRow } from './components/PlatformRow';
import { PlatformSetupScreen } from './components/PlatformSetupScreen';
import { buildListData } from './utils/listData';
import type { TrackListItem } from './utils/listData';
import { platformsCopy } from '../../copy/platforms';
import { theme } from '../../design/tokens';
import { getLocalDateString } from '../../core/utils/localDate';
import {
  DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS,
  DAY_CIRCLES_COLLAPSE_STAGGER_MS,
} from '../../config/constants';

// ── Daily open animation guard (module-level, survives unmount/remount) ──────
let _dailyOpenDate: string | null = null;

// ── Root screen ──────────────────────────────────────────────────────────────

interface TrackScreenProps {
  adapter: StorageAdapter;
}

export function TrackScreen({ adapter }: TrackScreenProps) {
  useNudgeNotification();
  const { selectedIds, saveSelection } = usePlatformRoster();
  const [editing, setEditing] = useState(false);

  const activePlatforms = useMemo(() => {
    if (!selectedIds) return [];
    return TRACKED_PLATFORMS.filter((p) => selectedIds.includes(p.id));
  }, [selectedIds]);

  const handleDone = useCallback(async (ids: string[]) => {
    await saveSelection(ids);
    setEditing(false);
  }, [saveSelection]);

  const handleEdit = useCallback(() => {
    setEditing(true);
  }, []);

  if (selectedIds === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.colors.frameBlue} />
        <Text style={styles.loadingText} allowFontScaling>
          {platformsCopy.loading}
        </Text>
      </SafeAreaView>
    );
  }

  if (selectedIds === undefined || editing) {
    return (
      <PlatformSetupScreen
        platforms={TRACKED_PLATFORMS}
        initialSelection={selectedIds ?? undefined}
        onDone={handleDone}
      />
    );
  }

  return (
    <TrackProvider adapter={adapter} platforms={activePlatforms}>
      <SafeAreaView style={styles.root}>
        <TrackHeader onEdit={handleEdit} />
        <GameArena />
        <TrackListInner />
      </SafeAreaView>
    </TrackProvider>
  );
}

// ── Inner list (needs TrackProvider context) ─────────────────────────────────

function TrackListInner() {
  const { platforms, focusedPlatformId, weekAvoids, expandAll, collapseOne } = useTrack();

  const listData = useMemo(() => buildListData(platforms), [platforms]);

  const allPlatformIds = useMemo(() => {
    return listData
      .filter((item): item is Extract<TrackListItem, { type: 'childRow' | 'platformRow' }> =>
        item.type === 'childRow' || item.type === 'platformRow')
      .map((item) => item.platformId);
  }, [listData]);

  // Daily open animation: expand all on first visit of the day, then stagger-collapse.
  // Guard is module-level so unmount/remount (background, screenshot) does NOT re-trigger.
  useEffect(() => {
    const today = getLocalDateString();
    if (_dailyOpenDate === today) return;
    if (allPlatformIds.length === 0) return;

    _dailyOpenDate = today;

    expandAll(allPlatformIds);

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < allPlatformIds.length; i++) {
      const timer = setTimeout(() => {
        collapseOne(allPlatformIds[i]!);
      }, DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS + (i * DAY_CIRCLES_COLLAPSE_STAGGER_MS));
      timers.push(timer);
    }

    return () => { timers.forEach(clearTimeout); };
  }, [allPlatformIds, expandAll, collapseOne]);

  // PlatformRow reads expandedIds + toggleExpand from context directly,
  // so renderItem doesn't need to pass expand props.
  const renderItem = useCallback(({ item }: { item: TrackListItem }) => {
    if (item.type === 'groupHeader') {
      return (
        <PlatformGroupHeader
          figureName={item.figureName}
          shortName={item.shortName}
          childPlatformIds={item.childPlatformIds}
        />
      );
    }

    return (
      <PlatformRow
        platformId={item.platformId}
        isChild={item.type === 'childRow'}
      />
    );
  }, []);

  const keyExtractor = useCallback((item: TrackListItem) => item.key, []);

  return (
    <FlatList<TrackListItem>
      data={listData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      extraData={[focusedPlatformId, weekAvoids]}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      accessibilityRole="list"
      accessibilityLabel={platformsCopy.checklist}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
  },
  center: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.md,
  },
  loadingText: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space['3xl'],
  },
});
