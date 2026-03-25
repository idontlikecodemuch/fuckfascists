import React, { useState, useCallback, useMemo } from 'react';
import { View, Alert, StyleSheet, type ViewStyle } from 'react-native';
import { MapScreen } from '../../features/Map/MapScreen';
import { ScanScreen } from '../../features/Scan/ScanScreen';
import { TrackScreen } from '../../features/Platforms/TrackScreen';
import { NudgeBanner } from '../../features/Platforms/components/NudgeBanner';
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
// Screenshot harness — available in all builds behind the beta mode triple-tap.
// Lazy-loaded on first open to avoid bloating the production bundle startup.
let _ScreenshotHarness: React.ComponentType<{ onClose: () => void }> | null = null;
function getScreenshotHarness() {
  if (!_ScreenshotHarness) {
    _ScreenshotHarness = require('../../features/Dev/ScreenshotHarness').ScreenshotHarness;
  }
  return _ScreenshotHarness!;
}

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
  const [harnessOpen, setHarnessOpen] = useState(false);

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
      case 'scan':
        return (
          <ScanScreen
            entities={entities}
            adapter={adapter}
            fetchOrgs={fetchOrgs}
            fetchOrgSummary={fetchOrgSummary}
          />
        );
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
        return <TrackScreen adapter={adapter} />;
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

  const handleNudgePress = useCallback(() => {
    setActiveTab('platforms');
  }, []);

  const handleOpenHarness = useCallback(() => {
    setHarnessOpen(true);
  }, []);

  const handleCloseHarness = useCallback(() => {
    setHarnessOpen(false);
  }, []);

  // Screenshot harness takes over the full screen when open (beta mode only)
  if (betaEnabled && harnessOpen) {
    const Harness = getScreenshotHarness();
    return <Harness onClose={handleCloseHarness} />;
  }

  return (
    <View style={styles.root}>
      <NudgeBanner onPress={handleNudgePress} />
      <View style={styles.content}>{renderScreen()}</View>
      <TabBar activeTab={activeTab} onSelect={setActiveTab} />
      {betaEnabled && (
        <BetaOverlay
          activeTab={activeTab}
          onOpenHarness={handleOpenHarness}
        />
      )}
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
