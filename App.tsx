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
import { useOnboarding } from './features/Onboarding/hooks/useOnboarding';
import { OnboardingNavigator } from './features/Onboarding/OnboardingNavigator';
import { MapScreen } from './features/Map/MapScreen';
import { SurveyScreen } from './features/Survey/SurveyScreen';
import { ReportCardScreen } from './features/ReportCard/ReportCardScreen';
import { InfoScreen } from './features/Info/InfoScreen';
import { TRACKED_PLATFORMS } from './features/Survey/data/platforms';
import { SqliteAdapter } from './app/storage/SqliteAdapter';
import { FECClient } from './core/api';
import { fetchEntityList, parseEntityList } from './core/data';
import type { StorageAdapter } from './core/data';
import type { Entity } from './core/models';
import bundledEntitiesRaw from './assets/data/entities.json';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'map' | 'survey' | 'report' | 'info';

const TABS: { id: Tab; label: string }[] = [
  { id: 'map',    label: 'MAP'    },
  { id: 'survey', label: 'WEEKLY' },
  { id: 'report', label: 'CARD'   },
  { id: 'info',   label: 'INFO'   },
];

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<Tab, string> = {
  map:    '[ + ]',
  survey: '[ ✓ ]',
  report: '[ ★ ]',
  info:   '[ ? ]',
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

  // Wait for SecureStore read and SQLite init before rendering anything.
  if (isComplete === null || adapter === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <Text style={styles.splashTitle}>F*CK{'\n'}FASCISTS</Text>
          <ActivityIndicator color="#CC7A00" style={styles.splashSpinner} />
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
      case 'survey':
        return <SurveyScreen adapter={adapter} />;
      case 'report':
        return (
          <ReportCardScreen
            adapter={adapter}
            entities={entities}
            platforms={TRACKED_PLATFORMS}
          />
        );
      case 'info':
        return <InfoScreen />;
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

const BLACK = '#1A1A1A';
const AMBER = '#CC7A00';
const MONO  = 'monospace' as const;

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
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontFamily: MONO,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#CC0000',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: 4,
  },
  splashSpinner: {
    marginTop: 32,
  },
  root: {
    flex: 1,
    backgroundColor: BLACK,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: BLACK,
    borderTopWidth: 3,
    borderTopColor: AMBER,
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#2A2A2A',
  },
  tabIcon: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#555',
    marginBottom: 2,
  },
  tabIconActive: {
    color: AMBER,
  },
  tabLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 1,
    color: '#555',
  },
  tabLabelActive: {
    color: AMBER,
  },
});
