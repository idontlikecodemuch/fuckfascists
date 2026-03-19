import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { TRACKED_PLATFORMS } from './data/platformList';
import { usePlatformRoster } from './hooks/usePlatformRoster';
import { useNudgeNotification } from './hooks/useNudgeNotification';
import { TrackProvider } from './context/TrackContext';
import { TrackHeader } from './components/TrackHeader';
import { GameArena } from './components/GameArena';
import { TrackList } from './components/TrackList';
import { PlatformSetupScreen } from './components/PlatformSetupScreen';
import { platformsCopy } from '../../copy/platforms';
import { theme } from '../../design/tokens';

interface TrackScreenProps {
  adapter: StorageAdapter;
}

/**
 * Root Track screen. Plain flex column layout:
 *   TrackHeader (auto height)
 *   GameArena (configurable height)
 *   TrackList (flex: 1, FlatList, only scrollable element)
 *
 * Wraps everything in TrackProvider for shared state.
 * Shows PlatformSetupScreen when no roster is saved.
 */
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

  // Loading state
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

  // Setup / edit screen
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
        <TrackList />
      </SafeAreaView>
    </TrackProvider>
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
});
