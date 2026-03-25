/**
 * Harness renderers for Track screen states.
 * Wraps Track sub-components in a mock TrackCtx.Provider with fixture data.
 * DEV ONLY — never imported outside features/Dev/.
 */
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { TrackCtx } from '../../Platforms/context/TrackContext';
import { TrackHeader } from '../../Platforms/components/TrackHeader';
import { GameArena } from '../../Platforms/components/GameArena';
import { TrackList } from '../../Platforms/components/TrackList';
import { PlatformSetupScreen } from '../../Platforms/components/PlatformSetupScreen';
import { TRACKED_PLATFORMS } from '../../Platforms/data/platformList';
import { theme } from '../../../design/tokens';
import {
  harnessPlatformItems,
  harnessPlatforms,
  buildMockTrackContext,
} from '../harnessFixtures';

const noop = () => {};
const noopAsync = async () => {};

function TrackShell({ children, context }: {
  children: React.ReactNode;
  context: ReturnType<typeof buildMockTrackContext>;
}) {
  return (
    <TrackCtx.Provider value={context}>
      <SafeAreaView style={styles.root}>
        {children}
      </SafeAreaView>
    </TrackCtx.Provider>
  );
}

/** All rows collapsed, no focus — default roster view. */
export function renderTrackCollapsed(): React.ReactElement {
  const ctx = buildMockTrackContext({
    selectedPlatformId: null,
    openPlatformId: null,
    arenaFocusKey: null,
    focusedFigureName: null,
    todayActions: new Set<string>(),
  });

  return (
    <TrackShell context={ctx}>
      <TrackHeader onEdit={noop} />
      <GameArena />
      <TrackList />
    </TrackShell>
  );
}

/** One row expanded showing day circles. */
export function renderTrackExpanded(): React.ReactElement {
  const ctx = buildMockTrackContext({
    selectedPlatformId: 'twitter',
    openPlatformId: 'twitter',
    arenaFocusKey: 'twitter',
    focusedFigureName: 'Elon Musk',
    todayActions: new Set<string>(),
  });

  return (
    <TrackShell context={ctx}>
      <TrackHeader onEdit={noop} />
      <GameArena />
      <TrackList />
    </TrackShell>
  );
}

/** Rows showing avoided state — todayActions populated. */
export function renderTrackAvoided(): React.ReactElement {
  const ctx = buildMockTrackContext({
    selectedPlatformId: null,
    openPlatformId: 'twitter',
    arenaFocusKey: 'Elon Musk',
    focusedFigureName: 'Elon Musk',
    todayActions: new Set(['Elon Musk', 'Mark Zuckerberg', 'Jeff Bezos']),
    isDefeated: (name: string) =>
      ['Elon Musk', 'Mark Zuckerberg', 'Jeff Bezos'].includes(name),
  });

  return (
    <TrackShell context={ctx}>
      <TrackHeader onEdit={noop} />
      <GameArena />
      <TrackList />
    </TrackShell>
  );
}

/** Arena in grid mode — no figure focused. */
export function renderTrackArenaNeutral(): React.ReactElement {
  const ctx = buildMockTrackContext({
    selectedPlatformId: null,
    openPlatformId: null,
    arenaFocusKey: null,
    focusedFigureName: null,
  });

  return (
    <TrackShell context={ctx}>
      <TrackHeader onEdit={noop} />
      <GameArena />
      <TrackList />
    </TrackShell>
  );
}

/** Arena in single portrait mode — one figure focused. */
export function renderTrackArenaPortrait(): React.ReactElement {
  const ctx = buildMockTrackContext({
    selectedPlatformId: 'twitter',
    openPlatformId: null,
    arenaFocusKey: 'Elon Musk',
    focusedFigureName: 'Elon Musk',
  });

  return (
    <TrackShell context={ctx}>
      <TrackHeader onEdit={noop} />
      <GameArena />
      <TrackList />
    </TrackShell>
  );
}

/** Platform setup/selection screen. */
export function renderTrackSetup(): React.ReactElement {
  return (
    <PlatformSetupScreen
      platforms={TRACKED_PLATFORMS}
      initialSelection={['twitter', 'instagram', 'amazon']}
      onDone={async () => {}}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bgVoid },
});
