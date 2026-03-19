import React, { useState, useCallback, useMemo } from 'react';
import { View, Alert, StyleSheet, type ViewStyle } from 'react-native';
import { MapScreen } from '../../features/Map/MapScreen';
import { PlatformsScreen } from '../../features/Platforms/PlatformsScreen';
import { ScorecardScreen } from '../../features/Scorecard/ScorecardScreen';
import { InfoScreen } from '../../features/Info/InfoScreen';
import { TRACKED_PLATFORMS } from '../../features/Platforms/data/platformList';
import { useBetaMode } from '../../features/Beta/useBetaMode';
import { BetaOverlay } from '../../features/Beta/BetaOverlay';
import { TabBar, type Tab } from '../navigation/TabBar';
import { betaCopy } from '../../copy/beta';
import { FECClient } from '../../core/api';
import type { StorageAdapter } from '../../core/data';
import type { Entity } from '../../core/models';
import { theme } from '../../design/tokens';

// Dev-only catalog — conditional import keeps it out of production bundles.
const CatalogScreen = __DEV__
  ? require('../../features/Dev/CatalogScreen').CatalogScreen
  : () => null;

interface AppShellProps {
  adapter: StorageAdapter;
  entities: Entity[];
}

/**
 * Main app shell — tab navigation, screen rendering, beta overlay.
 * Rendered only after onboarding and launch gates have passed.
 */
export function AppShell({ adapter, entities }: AppShellProps) {
  const { betaEnabled, registerTap } = useBetaMode();
  const [activeTab, setActiveTab] = useState<Tab>('map');

  const handleVersionTap = useCallback(async () => {
    const toggled = await registerTap();
    if (toggled) {
      Alert.alert(betaEnabled ? betaCopy.deactivated : betaCopy.activated);
    }
  }, [registerTap, betaEnabled]);

  // FECClient is stable for the lifetime of the app.
  const fecClient = useMemo(() => {
    try {
      return new FECClient();
    } catch {
      return null;
    }
  }, []);

  const fetchOrgs = fecClient ? fecClient.fetchOrgs.bind(fecClient) : async () => [];
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
    <View style={styles.root}>
      <View style={styles.content}>{renderScreen()}</View>
      <TabBar activeTab={activeTab} onSelect={setActiveTab} />
      {betaEnabled && <BetaOverlay />}
    </View>
  );
}

const styles = StyleSheet.create<{
  root: ViewStyle;
  content: ViewStyle;
}>({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
  },
  content: {
    flex: 1,
  },
});
