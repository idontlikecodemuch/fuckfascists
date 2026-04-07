import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { platformsCopy } from '../../copy/platforms';
import { theme } from '../../design/tokens';
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
        <StarField />
        <TrackHeader onEdit={() => setEditing(true)} />
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
