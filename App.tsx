import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { theme } from './design/tokens';
import { useOnboarding } from './features/Onboarding/hooks/useOnboarding';
import { OnboardingNavigator } from './features/Onboarding/OnboardingNavigator';
import { MapScreen } from './features/Map/MapScreen';
import { PlatformsScreen } from './features/Platforms/PlatformsScreen';
import { ScorecardScreen } from './features/Scorecard/ScorecardScreen';
import { InfoScreen } from './features/Info/InfoScreen';
import { TRACKED_PLATFORMS } from './features/Platforms/data/platformList';
import { useBetaMode } from './features/Beta/useBetaMode';
import { BetaOverlay } from './features/Beta/BetaOverlay';
import { LaunchScreen, shouldShowLaunchScreen } from './features/Launch/LaunchScreen';
import { TabBar, type Tab } from './app/navigation/TabBar';
import { betaCopy } from './copy/beta';
import { SqliteAdapter } from './app/storage/SqliteAdapter';
import { FECClient } from './core/api';
import { fetchEntityList, parseEntityList } from './core/data';
import type { StorageAdapter } from './core/data';
import type { Entity } from './core/models';
import bundledEntitiesRaw from './assets/data/entities.json';

// Dev-only catalog — conditional import keeps it out of production bundles.
const CatalogScreen = __DEV__
  ? require('./features/Dev/CatalogScreen').CatalogScreen
  : () => null;

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

  const { isComplete, markComplete } = useOnboarding();
  const { betaEnabled, registerTap } = useBetaMode();
  const [activeTab, setActiveTab]   = useState<Tab>('map');
  const [adapter, setAdapter]       = useState<StorageAdapter | null>(null);
  const [entities, setEntities]     = useState<Entity[]>(() =>
    parseEntityList(bundledEntitiesRaw)
  );
  const [showLaunch, setShowLaunch] = useState<boolean | null>(null);

  // Check if launch screen should show (once per calendar day)
  useEffect(() => {
    let cancelled = false;
    shouldShowLaunchScreen()
      .then((show) => { if (!cancelled) setShowLaunch(show); })
      .catch(() => { if (!cancelled) setShowLaunch(false); });
    return () => { cancelled = true; };
  }, []);

  const handleVersionTap = useCallback(async () => {
    const toggled = await registerTap();
    if (toggled) {
      Alert.alert(betaEnabled ? betaCopy.deactivated : betaCopy.activated);
    }
  }, [registerTap, betaEnabled]);

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

  // FECClient is stable for the lifetime of the app.
  const fecClient = useMemo(() => {
    try {
      return new FECClient();
    } catch {
      // FEC_API_KEY missing — API-dependent features will show "not matched".
      return null;
    }
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────────

  // Wait for fonts, SecureStore read, SQLite init, and launch check before rendering.
  if (!fontsLoaded || isComplete === null || adapter === null || showLaunch === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <Text style={styles.splashTitle}>F*CK{'\n'}FASCISTS</Text>
          <ActivityIndicator color={theme.colors.rewardYellow} style={styles.splashSpinner} />
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Onboarding ───────────────────────────────────────────────────────────────

  if (!isComplete) {
    return (
      <SafeAreaProvider>
        <OnboardingNavigator onComplete={markComplete} />
      </SafeAreaProvider>
    );
  }

  // ── Daily launch screen ──────────────────────────────────────────────────────

  if (showLaunch) {
    return (
      <SafeAreaProvider>
        <LaunchScreen onDismiss={() => setShowLaunch(false)} />
      </SafeAreaProvider>
    );
  }

  // ── Main app ─────────────────────────────────────────────────────────────────

  const fetchOrgs      = fecClient ? fecClient.fetchOrgs.bind(fecClient)      : async () => [];
  const fetchOrgSummary = fecClient ? fecClient.fetchOrgSummary.bind(fecClient) : async () => null;

  const renderScreen = () => {
    switch (activeTab) {
      case 'map':
        return (
          <MapScreen
            entities={entities}
            adapter={adapter}
            fetchOrgs={fetchOrgs}
            fetchOrgSummary={fetchOrgSummary}
          />
        );
      case 'platforms':
        return <PlatformsScreen adapter={adapter} />;
      case 'report':
        return (
          <ScorecardScreen
            adapter={adapter}
            entities={entities}
            platforms={TRACKED_PLATFORMS}
            onSwitchTab={(tab) => setActiveTab(tab as Tab)}
          />
        );
      case 'info':
        return <InfoScreen onVersionTap={handleVersionTap} />;
      case 'dev':
        return <CatalogScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <View style={styles.content}>{renderScreen()}</View>
        <TabBar activeTab={activeTab} onSelect={setActiveTab} />
        {betaEnabled && <BetaOverlay />}
      </View>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  splash:        ViewStyle;
  splashTitle:   TextStyle;
  splashSpinner: ViewStyle;
  root:          ViewStyle;
  content:       ViewStyle;
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
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
  },
  content: {
    flex: 1,
  },
});
