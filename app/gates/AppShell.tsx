import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapScreen } from '../../features/Map/MapScreen';
import { ScanScreen } from '../../features/Scan/ScanScreen';
import { TrackScreen } from '../../features/Platforms/TrackScreen';
import type { AvoidChange } from '../../features/Platforms/context/TrackContext';
import { ShellBanners } from './ShellBanners';
import { AlertsProvider, useAlerts } from '../../features/Alerts/AlertsContext';
import { ScorecardScreen } from '../../features/Scorecard/ScorecardScreen';
import {
  ScorecardCaptureProvider,
  useScorecardCapture,
} from '../../features/Scorecard/context/ScorecardCaptureContext';
import { InfoScreen } from '../../features/Info/InfoScreen';
import { TRACKED_PLATFORMS } from '../../features/Platforms/data/platformList';
import { useShellNotifications } from './useShellNotifications';
import { useBetaMode } from '../../features/Beta/useBetaMode';
import { useBetaVersionTap } from '../../features/Beta/useBetaVersionTap';
import { BetaOverlay } from '../../features/Beta/BetaOverlay';
import { TabBar, type Tab } from '../navigation/TabBar';
import { useLaunchRouting } from '../navigation/useLaunchRouting';
import { FECClient } from '../../core/api';
import type { StorageAdapter } from '../../core/data';
import type { Entity, PoliticalPerson } from '../../core/models';
import { haptics } from '../../core/fx/haptics';
import { theme } from '../../design/tokens';

// Dev-only catalog — conditional import keeps it out of production bundles.
const CatalogScreen = __DEV__
  ? require('../../features/Dev/CatalogScreen').CatalogScreen
  : () => null;
// Screenshot harness — available in all builds behind the confirmed beta unlock.
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
  people: PoliticalPerson[];
}

/**
 * Main app shell — tab navigation, screen rendering, beta overlay.
 * Rendered only after onboarding and launch gates have passed. Hosts the one
 * scorecard capture path (ScorecardCaptureProvider), which runs after launch
 * routing and on every resume, and the notification permission
 * (AlertsProvider), which the alert schedulers and the alerts banner read.
 */
export function AppShell(props: AppShellProps) {
  return (
    <ScorecardCaptureProvider
      adapter={props.adapter}
      entities={props.entities}
      platforms={TRACKED_PLATFORMS}
    >
      <AlertsProvider>
        <AppShellContent {...props} />
      </AlertsProvider>
    </ScorecardCaptureProvider>
  );
}

function AppShellContent({ adapter, entities, people }: AppShellProps) {
  const betaMode = useBetaMode();
  const { betaEnabled } = betaMode;
  // Initial tab resolves from the cold-start notification response before any
  // screen mounts. Starting at null holds the shell blank until we know where
  // to route — prevents MapScreen from painting a frame that later leaves a
  // stale native-view ghost behind Scorecard on RN 0.76 + Fabric.
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [harnessOpen, setHarnessOpen] = useState(false);
  const [scorecardPresentationActive, setScorecardPresentationActive] = useState(false);
  const [bannerOffset, setBannerOffset] = useState(0);
  const [avoidRefreshKey, setAvoidRefreshKey] = useState(0);
  // Incrementing key forces screen remount after beta reset, clearing all
  // in-memory state (map pins, tap results, etc.).
  const [resetKey, setResetKey] = useState(0);
  const { runPendingCaptures, lateRevealVersion } = useScorecardCapture();
  const { alertsOn, promptAfterAvoid } = useAlerts();

  useShellNotifications(adapter, entities, avoidRefreshKey, alertsOn);

  useEffect(() => {
    haptics.launchJig();
  }, []);

  // Route first (cold start: notification or pending drop; resume: pending
  // drop), then capture any pending scorecards.
  const handleRouted = useCallback(() => { void runPendingCaptures(); }, [runPendingCaptures]);
  useLaunchRouting({
    adapter, entities, platforms: TRACKED_PLATFORMS, setActiveTab, onRouted: handleRouted, lateRevealVersion,
  });

  const handleVersionTap = useBetaVersionTap(betaMode);

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

  const presentationActiveRef = useRef(false);
  presentationActiveRef.current = scorecardPresentationActive;
  const handleAvoidRecorded = useCallback((change?: AvoidChange) => {
    setAvoidRefreshKey((key) => key + 1);
    if (change !== 'removed') promptAfterAvoid(() => presentationActiveRef.current);
  }, [promptAfterAvoid]);

  const renderScreen = () => {
    switch (activeTab) {
      case null:
        return null;
      case 'scan':
        return (
          <ScanScreen
            entities={entities}
            people={people}
            adapter={adapter}
            fetchOrgs={fetchOrgs}
            fetchOrgSummary={fetchOrgSummary}
            onAvoidRecorded={handleAvoidRecorded}
          />
        );
      case 'map':
        return (
          <MapScreen
            entities={entities}
            people={people}
            adapter={adapter}
            fetchOrgs={fetchOrgs}
            fetchOrgSummary={fetchOrgSummary}
            onAvoidRecorded={handleAvoidRecorded}
          />
        );
      case 'platforms':
        return (
          <TrackScreen
            adapter={adapter}
            entities={entities}
            people={people}
            onAvoidRecorded={handleAvoidRecorded}
          />
        );
      case 'report':
        return (
          <ScorecardScreen
            adapter={adapter}
            entities={entities}
            platforms={TRACKED_PLATFORMS}
            onSwitchTab={(tab) => setActiveTab(tab as Tab)}
            onPresentationActiveChange={setScorecardPresentationActive}
          />
        );
      case 'info':
        return <InfoScreen onVersionTap={handleVersionTap} />;
      case 'dev':
        return <CatalogScreen />;
    }
  };

  const handleNudgePress = useCallback(() => setActiveTab('report'), []);

  const handleOpenHarness = useCallback(() => setHarnessOpen(true), []);
  const handleCloseHarness = useCallback(() => setHarnessOpen(false), []);
  const handleBetaReset = useCallback(() => setResetKey((k) => k + 1), []);

  const showShellChrome = !scorecardPresentationActive;
  const contentTopOffset = showShellChrome ? bannerOffset : 0;
  // A top banner already covers the status bar, so screens under it must not
  // add the top inset again (Track and Map did: a double gap under banners).
  const insets = useSafeAreaInsets();
  const contentInsets = useMemo(
    () => (contentTopOffset > 0 ? { ...insets, top: 0 } : insets),
    [contentTopOffset, insets],
  );

  // Screenshot harness takes over the full screen when open (beta mode only)
  if (betaEnabled && harnessOpen) {
    const Harness = getScreenshotHarness();
    return <Harness onClose={handleCloseHarness} />;
  }

  // Hold blank on bgVoid while the initial-tab resolver runs. This is
  // typically <50ms since the notification response is cached — the gap is
  // not user-visible.
  if (activeTab === null) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaInsetsContext.Provider value={contentInsets}>
        <View
          key={resetKey}
          style={[styles.content, contentTopOffset > 0 && { paddingTop: contentTopOffset }]}
        >
          {renderScreen()}
        </View>
      </SafeAreaInsetsContext.Provider>
      <ShellBanners
        suppressed={!showShellChrome}
        adapter={adapter}
        entities={entities}
        platforms={TRACKED_PLATFORMS}
        onNudgePress={handleNudgePress}
        onTopOffsetChange={setBannerOffset}
      />
      {showShellChrome && <TabBar activeTab={activeTab} onSelect={setActiveTab} />}
      {betaEnabled && showShellChrome && (
        <BetaOverlay
          activeTab={activeTab}
          onOpenHarness={handleOpenHarness}
          onReset={handleBetaReset}
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
