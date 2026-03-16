import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { theme } from './design/tokens';
import { useOnboarding } from './features/Onboarding/hooks/useOnboarding';
import { OnboardingNavigator } from './features/Onboarding/OnboardingNavigator';
import { MapScreen } from './features/Map/MapScreen';
import { PlatformsScreen } from './features/Platforms/PlatformsScreen';
import { ScorecardScreen } from './features/Scorecard/ScorecardScreen';
import { InfoScreen } from './features/Info/InfoScreen';
import { TRACKED_PLATFORMS } from './features/Platforms/data/platformList';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'map' | 'platforms' | 'report' | 'info' | 'dev';

const TABS: { id: Tab; label: string }[] = [
  { id: 'map',       label: 'MAP'       },
  { id: 'platforms', label: 'TRACK'     },
  { id: 'report',    label: 'SCORECARD' },
  { id: 'info',      label: 'INFO'      },
  ...(__DEV__ ? [{ id: 'dev' as const, label: 'DEV' }] : []),
];

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<Tab, string> = {
  map:       '[ + ]',
  platforms: '[ ✓ ]',
  report:    '[ ★ ]',
  info:      '[ ? ]',
  dev:       '[ # ]',
};

function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(({ id, label }) => {
        const active = id === activeTab;
        return (
          <Pressable
            key={id}
            style={[styles.tabItem, active && styles.tabItemActive]}
            onPress={() => onSelect(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]} allowFontScaling={false}>
              {TAB_ICONS[id]}
            </Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]} allowFontScaling={false}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded] = useFonts({
    'Bungee-Regular': require('./assets/fonts/Bungee-Regular.ttf'),
    'IBMPlexSans-Regular': require('./assets/fonts/IBMPlexSans-Regular.ttf'),
    'IBMPlexSans-SemiBold': require('./assets/fonts/IBMPlexSans-SemiBold.ttf'),
    'IBMPlexSans-Medium': require('./assets/fonts/IBMPlexSans-Medium.ttf'),
  });

  const { isComplete, markComplete } = useOnboarding();
  const [activeTab, setActiveTab]   = useState<Tab>('map');
  const [adapter, setAdapter]       = useState<StorageAdapter | null>(null);
  const [entities, setEntities]     = useState<Entity[]>(() =>
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

  // Wait for fonts, SecureStore read, and SQLite init before rendering anything.
  if (!fontsLoaded || isComplete === null || adapter === null) {
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
          />
        );
      case 'info':
        return <InfoScreen />;
      case 'dev':
        return <CatalogScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <View style={styles.content}>{renderScreen()}</View>
        <TabBar activeTab={activeTab} onSelect={setActiveTab} />
      </View>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  splash:         ViewStyle;
  splashTitle:    TextStyle;
  splashSpinner:  ViewStyle;
  root:           ViewStyle;
  content:        ViewStyle;
  tabBar:         ViewStyle;
  tabItem:        ViewStyle;
  tabItemActive:  ViewStyle;
  tabIcon:        TextStyle;
  tabIconActive:  TextStyle;
  tabLabel:       TextStyle;
  tabLabelActive: TextStyle;
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgNav,
    borderTopWidth: theme.borders.hero.width,
    borderTopColor: theme.colors.frameBlue,
    paddingTop: theme.space.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: theme.colors.surface1,
  },
  tabIcon: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  tabIconActive: {
    color: theme.colors.rewardYellow,
  },
  tabLabel: {
    ...theme.type.caption,
    fontSize: 9,
    letterSpacing: 1,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.rewardYellow,
  },
});
