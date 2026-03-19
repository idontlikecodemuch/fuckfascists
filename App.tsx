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
import { SqliteAdapter } from './app/storage/SqliteAdapter';
import { fetchEntityList, parseEntityList } from './core/data';
import type { StorageAdapter } from './core/data';
import type { Entity } from './core/models';
import bundledEntitiesRaw from './assets/data/entities.json';

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

  // Open SQLite and run migrations once on mount.
  useEffect(() => {
    let cancelled = false;
    SqliteAdapter.open()
      .then((a) => { if (!cancelled) setAdapter(a); })
      .catch((err) => console.error('[App] Failed to open SQLite:', err));
    return () => { cancelled = true; };
  }, []);

  // Attempt to refresh entity list from CDN; falls back to bundled on failure.
  useEffect(() => {
    let cancelled = false;
    fetchEntityList(parseEntityList(bundledEntitiesRaw))
      .then((list) => { if (!cancelled) setEntities(list); })
      .catch(() => { /* bundled list already set as initial state */ });
    return () => { cancelled = true; };
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (!fontsLoaded || adapter === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <Text style={styles.splashTitle}>F*CK{'\n'}FASCISTS</Text>
          <ActivityIndicator color={theme.colors.rewardYellow} style={styles.splashSpinner} />
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Gate chain: onboarding → launch → main app ─────────────────────────────

  return (
    <SafeAreaProvider>
      <OnboardingGate>
        <LaunchGate>
          <AppShell adapter={adapter} entities={entities} />
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
