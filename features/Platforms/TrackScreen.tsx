import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { platformsCopy } from '../../copy/platforms';
import { theme } from '../../design/tokens';
import { bevelFocusRaised } from '../../design/bevel';
import {
  TRACK_ARENA_FLEX,
  TRACK_ARENA_MAX_HEIGHT,
  TRACK_ARENA_MIN_HEIGHT,
  TRACK_ARENA_SEPARATOR_HEIGHT,
} from '../../config/constants';
import { StarField } from '../Info/components/InfoDecorations';
import { TrackProvider } from './context/TrackContext';
import { TRACKED_PLATFORMS } from './data/platformList';
import { GameArena } from './components/GameArena';
import { PlatformSetupScreen } from './components/PlatformSetupScreen';
import { TrackHeader } from './components/TrackHeader';
import { TrackList } from './components/TrackList';
import { useNudgeNotification } from './hooks/useNudgeNotification';
import { usePlatformRoster } from './hooks/usePlatformRoster';

interface TrackScreenProps {
  adapter: StorageAdapter;
}

export function TrackScreen({ adapter }: TrackScreenProps) {
  useNudgeNotification();
  const { saveSelection, selectedIds } = usePlatformRoster();
  const [editing, setEditing] = useState(false);

  const activePlatforms = useMemo(() => {
    if (!selectedIds) return [];
    return TRACKED_PLATFORMS.filter((platform) => selectedIds.includes(platform.id));
  }, [selectedIds]);

  const handleDone = useCallback(async (ids: string[]) => {
    await saveSelection(ids);
    setEditing(false);
  }, [saveSelection]);

  if (selectedIds === null) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
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
        <StarField seed="track" />
        <View style={styles.arenaFrame}>
          <TrackHeader onEdit={() => setEditing(true)} />
          <GameArena />
        </View>
        <View style={styles.separator} />
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
  arenaFrame: {
    flex: TRACK_ARENA_FLEX,
    minHeight: TRACK_ARENA_MIN_HEIGHT,
    maxHeight: TRACK_ARENA_MAX_HEIGHT,
    overflow: 'hidden',
    backgroundColor: theme.colors.panelOuter,
    ...bevelFocusRaised,
  },
  separator: {
    height: TRACK_ARENA_SEPARATOR_HEIGHT,
    backgroundColor: theme.colors.panelOuter,
    borderTopWidth: 1,
    borderTopColor: theme.colors.focusAccent,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    backgroundColor: theme.colors.bgVoid,
  },
  loadingText: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
  },
});
