import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Alert, StyleSheet, type ViewStyle } from 'react-native';
import * as Notifications from 'expo-notifications';
import { MapScreen } from '../../features/Map/MapScreen';
import { ScanScreen } from '../../features/Scan/ScanScreen';
import { TrackScreen } from '../../features/Platforms/TrackScreen';
import { NudgeBanner } from '../../features/Platforms/components/NudgeBanner';
import { AppUpdateBanner } from '../../features/Updates/AppUpdateBanner';
import { ScorecardScreen } from '../../features/Scorecard/ScorecardScreen';
import { useScorecardDropNotification } from '../../features/Scorecard/hooks/useScorecardDropNotification';
import { shouldLaunchPendingScorecardDrop } from '../../features/Scorecard/utils/pendingDropLaunch';
import { InfoScreen } from '../../features/Info/InfoScreen';
import { TRACKED_PLATFORMS } from '../../features/Platforms/data/platformList';
import { useNudgeNotification } from '../../features/Platforms/hooks/useNudgeNotification';
import { useEarlyWeekNudge } from '../../features/Platforms/hooks/useEarlyWeekNudge';
import { useBetaMode } from '../../features/Beta/useBetaMode';
import { BetaOverlay } from '../../features/Beta/BetaOverlay';
import { TabBar, type Tab } from '../navigation/TabBar';
import { pickInitialTab } from '../navigation/initialTab';
import { tabForNotificationResponse } from '../navigation/notificationRoute';
import { betaCopy } from '../../copy/beta';
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
 * Rendered only after onboarding and launch gates have passed.
 */
export function AppShell({ adapter, entities, people }: AppShellProps) {
  const { betaEnabled, registerTap, setBetaEnabled } = useBetaMode();
  // Initial tab resolves from the cold-start notification response before any
  // screen mounts. Starting at null holds the shell blank until we know where
  // to route — prevents MapScreen from painting a frame that later leaves a
  // stale native-view ghost behind Scorecard on RN 0.76 + Fabric.
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [harnessOpen, setHarnessOpen] = useState(false);
  const [scorecardPresentationActive, setScorecardPresentationActive] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [nudgeHeight, setNudgeHeight] = useState(0);
  const [appUpdateVisible, setAppUpdateVisible] = useState(false);
  const [appUpdateHeight, setAppUpdateHeight] = useState(0);
  const [avoidRefreshKey, setAvoidRefreshKey] = useState(0);
  // Incrementing key forces screen remount after beta reset, clearing all
  // in-memory state (map pins, tap results, etc.).
  const [resetKey, setResetKey] = useState(0);

  useNudgeNotification();
  useEarlyWeekNudge(adapter, avoidRefreshKey);
  useScorecardDropNotification(adapter, entities, TRACKED_PLATFORMS, avoidRefreshKey);

  useEffect(() => {
    haptics.launchJig();
  }, []);

  // Cold-start routing: if the app was launched from a notification with a
  // route (scorecard drop, early-week nudge), mount that tab directly; else if
  // an unhandled drop is active, mount Scorecard. Routes on content.data
  // (stable keys), not titles — see tabForNotificationResponse.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let resp: Notifications.NotificationResponse | null = null;
      try {
        resp = await Notifications.getLastNotificationResponseAsync();
      } catch {
        // Fall through to the drop-window check and then random launch.
      }

      if (cancelled) return;
      const routedTab = tabForNotificationResponse(resp);
      if (routedTab) {
        setActiveTab(routedTab);
        return;
      }

      const shouldOpenScorecard = await shouldLaunchPendingScorecardDrop({
        adapter,
        entities,
        platforms: TRACKED_PLATFORMS,
      });

      if (!cancelled) {
        setActiveTab(shouldOpenScorecard ? 'report' : pickInitialTab());
      }
    })().catch(() => {
      if (!cancelled) {
        setActiveTab(pickInitialTab());
      }
    });

    return () => { cancelled = true; };
  }, []);

  // Warm-start routing: while the app is running, react to notification taps
  // the same way as the cold-start rule above.
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const routedTab = tabForNotificationResponse(lastNotificationResponse);
    if (routedTab) setActiveTab(routedTab);
  }, [lastNotificationResponse]);

  const handleVersionTap = useCallback(async () => {
    const unlockRequested = await registerTap();
    if (!unlockRequested) return;

    if (betaEnabled) {
      await setBetaEnabled(false);
      Alert.alert(betaCopy.deactivated);
      return;
    }

    Alert.alert(
      betaCopy.enableTitle,
      betaCopy.enableBody,
      [
        { text: betaCopy.enableCancel, style: 'cancel' },
        {
          text: betaCopy.enableConfirm,
          onPress: () => {
            setBetaEnabled(true)
              .then(() => Alert.alert(betaCopy.activated))
              .catch(() => undefined);
          },
        },
      ],
    );
  }, [registerTap, betaEnabled, setBetaEnabled]);

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

  const handleAvoidRecorded = useCallback(() => {
    setAvoidRefreshKey((key) => key + 1);
  }, []);

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

  const handleNudgePress = useCallback(() => {
    setActiveTab('report');
  }, []);

  const handleNudgeVisibleChange = useCallback((visible: boolean) => {
    setNudgeVisible(visible);
    if (!visible) setNudgeHeight(0);
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

  const showShellChrome = !scorecardPresentationActive;
  const contentTopOffset = showShellChrome
    ? appUpdateVisible
      ? appUpdateHeight
      : nudgeVisible
        ? nudgeHeight
        : 0
    : 0;

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
      <View
        key={resetKey}
        style={[styles.content, contentTopOffset > 0 && { paddingTop: contentTopOffset }]}
      >
        {renderScreen()}
      </View>
      {showShellChrome && !appUpdateVisible && (
        <NudgeBanner
          onPress={handleNudgePress}
          onVisibleChange={handleNudgeVisibleChange}
          onHeightChange={setNudgeHeight}
        />
      )}
      <AppUpdateBanner
        suppressed={!showShellChrome}
        onVisibleChange={setAppUpdateVisible}
        onHeightChange={setAppUpdateHeight}
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
