import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Alert, StyleSheet, type ViewStyle } from 'react-native';
import * as Notifications from 'expo-notifications';
import { MapScreen } from '../../features/Map/MapScreen';
import { ScanScreen } from '../../features/Scan/ScanScreen';
import { TrackScreen } from '../../features/Platforms/TrackScreen';
import { NudgeBanner } from '../../features/Platforms/components/NudgeBanner';
import { ScorecardScreen } from '../../features/Scorecard/ScorecardScreen';
import { SCORECARD_DROP_NOTIFICATION_TYPE } from '../../features/Scorecard/hooks/useDropSchedule';
import { InfoScreen } from '../../features/Info/InfoScreen';
import { TRACKED_PLATFORMS } from '../../features/Platforms/data/platformList';
import { useBetaMode } from '../../features/Beta/useBetaMode';
import { BetaOverlay } from '../../features/Beta/BetaOverlay';
import { TabBar, type Tab } from '../navigation/TabBar';
import { betaCopy } from '../../copy/beta';
import { FECClient } from '../../core/api';
import type { StorageAdapter } from '../../core/data';
import type { Entity, PoliticalPerson } from '../../core/models';
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
  people: PoliticalPerson[];
}

/**
 * Routes a notification to the Scorecard tab iff its data.type matches
 * SCORECARD_DROP_NOTIFICATION_TYPE. Falls back to title-string matching
 * for any legacy drop notifications scheduled before the data-type
 * routing shipped (one-week grace period).
 */
function isScorecardDrop(
  resp: Notifications.NotificationResponse | null | undefined,
): boolean {
  if (!resp) return false;
  const content = resp.notification.request.content;
  const data = content.data as { type?: string } | undefined;
  if (data?.type === SCORECARD_DROP_NOTIFICATION_TYPE) return true;
  // Legacy fallback — remove after one release cycle.
  return content.title === 'Your Scorecard Is Ready';
}

/**
 * Main app shell — tab navigation, screen rendering, beta overlay.
 * Rendered only after onboarding and launch gates have passed.
 */
export function AppShell({ adapter, entities, people }: AppShellProps) {
  const { betaEnabled, registerTap } = useBetaMode();
  // Initial tab resolves from the cold-start notification response before any
  // screen mounts. Starting at null holds the shell blank until we know where
  // to route — prevents MapScreen from painting a frame that later leaves a
  // stale native-view ghost behind Scorecard on RN 0.76 + Fabric.
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [harnessOpen, setHarnessOpen] = useState(false);
  // Incrementing key forces screen remount after beta reset, clearing all
  // in-memory state (map pins, tap results, etc.).
  const [resetKey, setResetKey] = useState(0);

  // Cold-start routing: if the app was launched from the scorecard drop
  // notification, skip Map entirely and mount Scorecard directly.
  // Matches on content.data.type (stable routing key) rather than title
  // (human-readable copy that may change).
  useEffect(() => {
    let cancelled = false;
    Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (cancelled) return;
        setActiveTab(isScorecardDrop(resp) ? 'report' : 'map');
      })
      .catch(() => {
        if (!cancelled) setActiveTab('map');
      });
    return () => { cancelled = true; };
  }, []);

  // Warm-start routing: while the app is running, react to notification taps
  // and route the user to Scorecard. Matches the cold-start rule above.
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastNotificationResponse) return;
    if (isScorecardDrop(lastNotificationResponse)) {
      setActiveTab('report');
    }
  }, [lastNotificationResponse]);

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

  const handleBetaReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

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
      <View key={resetKey} style={styles.content}>{renderScreen()}</View>
      <NudgeBanner onPress={handleNudgePress} />
      <TabBar activeTab={activeTab} onSelect={setActiveTab} />
      {betaEnabled && (
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
