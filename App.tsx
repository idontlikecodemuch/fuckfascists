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
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
          <ActivityIndicator color="#f5a623" />
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
        <View style={styles.tabBar}>
          {TABS.map(({ id, label }) => {
            const active = id === activeTab;
            return (
              <Pressable
                key={id}
                style={styles.tabItem}
                onPress={() => setActiveTab(id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  splash:         ViewStyle;
  root:           ViewStyle;
  content:        ViewStyle;
  tabBar:         ViewStyle;
  tabItem:        ViewStyle;
  tabLabel:       TextStyle;
  tabLabelActive: TextStyle;
}>({
  splash: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 2,
    borderTopColor: '#333',
    paddingBottom: 20, // safe-area bottom approximation
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  tabLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1,
    color: '#666',
  },
  tabLabelActive: {
    color: '#f5a623',
  },
});
