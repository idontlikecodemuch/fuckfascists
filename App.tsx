import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { theme } from './design/tokens';
import { OnboardingGate } from './app/gates/OnboardingGate';
import { LaunchGate } from './app/gates/LaunchGate';
import { AppShell } from './app/gates/AppShell';
import { sharedCopy } from './copy/shared';
import { SqliteAdapter } from './app/storage/SqliteAdapter';
import { fetchEntityList, parseEntityList, fetchPeopleList, parsePeopleList, purgeOldAvoidEvents } from './core/data';
import { getScorecardAvoidPurgeCutoff } from './features/Scorecard/utils/avoidRetention';
import type { StorageAdapter } from './core/data';
import type { Entity, PoliticalPerson } from './core/models';
import bundledEntitiesRaw from './assets/data/entities.json';
import bundledPeopleRaw from './assets/data/people.bundle.json';

const AutoUpcToastHarness = __DEV__ && process.env.EXPO_PUBLIC_UPC_TOAST_HARNESS === '1'
  ? require('./features/Dev/ScreenshotHarness').ScreenshotHarness as React.ComponentType<{
      onClose: () => void;
      autoMode: 'upc_toasts';
    }>
  : null;

const AutoReleaseQAHarness = __DEV__ && process.env.EXPO_PUBLIC_RELEASE_QA_HARNESS === '1'
  ? require('./features/Dev/ReleaseQAHarness').ReleaseQAHarness as React.ComponentType<{
      entities: Entity[];
    }>
  : null;

const AutoScorecardVisualHarness = __DEV__ && process.env.EXPO_PUBLIC_SCORECARD_VISUAL_HARNESS === '1'
  ? require('./features/Dev/ScreenshotHarness').ScreenshotHarness as React.ComponentType<{
      onClose: () => void;
      autoMode: 'scorecard_states';
    }>
  : null;

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded] = useFonts({
    'Bungee-Regular': require('./assets/fonts/Bungee-Regular.ttf'),
    'IBMPlexSans-Regular': require('./assets/fonts/IBMPlexSans-Regular.ttf'),
    'IBMPlexSans-SemiBold': require('./assets/fonts/IBMPlexSans-SemiBold.ttf'),
    'IBMPlexSans-Medium': require('./assets/fonts/IBMPlexSans-Medium.ttf'),
  });

  useEffect(() => {
    if (__DEV__ && fontsLoaded) {
      console.log('[App] Fonts loaded: Bungee-Regular, IBMPlexSans-Regular, IBMPlexSans-SemiBold, IBMPlexSans-Medium');
    }
  }, [fontsLoaded]);

  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const [entities, setEntities] = useState<Entity[]>(() =>
    parseEntityList(bundledEntitiesRaw)
  );
  const [people, setPeople] = useState<PoliticalPerson[]>(() =>
    parsePeopleList(bundledPeopleRaw)
  );

  // Open SQLite, run migrations, and purge old avoid events. The cutoff keeps
  // the just-finished scorecard week available until capture can save it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await SqliteAdapter.open();
        await purgeOldAvoidEvents(a, getScorecardAvoidPurgeCutoff());
        if (!cancelled) setAdapter(a);
      } catch (err) {
        console.error('[App] Failed to open SQLite:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Local-first: render the bundled entity list immediately, then check the
  // public Git runtime bundle. Per-lookup live FEC remains the final fallback.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchEntityList(parseEntityList(bundledEntitiesRaw));
        if (!cancelled) setEntities(list);
      } catch {
        /* bundled list already set as initial state */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Same local-first → Git refresh order for the slim people runtime bundle.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchPeopleList(parsePeopleList(bundledPeopleRaw));
        if (!cancelled) setPeople(list);
      } catch {
        /* bundled list already set as initial state */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (!fontsLoaded || adapter === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <Text style={styles.splashTitle}>{sharedCopy.appName.replace(' ', '\n')}</Text>
          <ActivityIndicator color={theme.colors.rewardYellow} style={styles.splashSpinner} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (AutoUpcToastHarness) {
    return (
      <SafeAreaProvider>
        <AutoUpcToastHarness onClose={() => undefined} autoMode="upc_toasts" />
      </SafeAreaProvider>
    );
  }

  if (AutoReleaseQAHarness) {
    return (
      <SafeAreaProvider>
        <AutoReleaseQAHarness entities={entities} />
      </SafeAreaProvider>
    );
  }

  if (AutoScorecardVisualHarness) {
    return (
      <SafeAreaProvider>
        <AutoScorecardVisualHarness onClose={() => undefined} autoMode="scorecard_states" />
      </SafeAreaProvider>
    );
  }

  // ── Gate chain: onboarding → launch → main app ─────────────────────────────

  return (
    <SafeAreaProvider>
      <OnboardingGate>
        <LaunchGate>
          <AppShell adapter={adapter} entities={entities} people={people} />
        </LaunchGate>
      </OnboardingGate>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  splash: ViewStyle;
  splashTitle: TextStyle;
  splashSpinner: ViewStyle;
}>({
  splash: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    ...theme.type.displayL,
    fontSize: 36,
    lineHeight: 42,
    color: theme.colors.dangerRed,
    textAlign: 'center',
    letterSpacing: 4,
  },
  splashSpinner: {
    marginTop: theme.space['3xl'],
  },
});
