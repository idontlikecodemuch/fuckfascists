import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { StorageAdapter } from '../../core/data';
import type { Entity } from '../../core/models';
import type { Platform } from '../../features/Platforms/types';
import { shouldLaunchPendingScorecardDrop } from '../../features/Scorecard/utils/pendingDropLaunch';
import type { Tab } from './TabBar';
import { pickInitialTab } from './initialTab';
import { nextResumeState, resolveLaunchTab, resolveResumeTab } from './launchRoute';
import { tabForNotificationResponse } from './notificationRoute';

interface LaunchRoutingInput {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  setActiveTab: (tab: Tab) => void;
  /** Runs after each routing decision: once at cold start, then on every resume. */
  onRouted: () => void;
  /** Bumped when a capture run marked a missed drop's card for its late reveal. */
  lateRevealVersion: number;
}

/**
 * App-shell routing:
 * - cold start: notification route, else Scorecard for an unrevealed drop in
 *   its window, else the random launch tab (see resolveLaunchTab);
 * - warm notification taps: the notification's tab;
 * - resume (background → active only, see nextResumeState): Scorecard for an
 *   unrevealed drop, unless a notification tap routed since the app left the
 *   foreground (the tap wins).
 * - a missed drop's card just captured: Scorecard for its one late reveal,
 *   unless a notification tap routed in this foreground session (the tap wins;
 *   the late marker stays set, so the next launch or resume reveals it).
 * onRouted fires only after the route is set, so the shell's card capture can
 * never decide the route.
 */
export function useLaunchRouting(input: LaunchRoutingInput): void {
  const latest = useRef(input);
  latest.current = input;
  const coldStartDone = useRef(false);
  const notificationRoutedAt = useRef(0);
  const leftForegroundAt = useRef(0);

  const hasPendingDrop = (): Promise<boolean> => {
    const { adapter, entities, platforms } = latest.current;
    return shouldLaunchPendingScorecardDrop({ adapter, entities, platforms });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let response: Notifications.NotificationResponse | null = null;
      try {
        response = await Notifications.getLastNotificationResponseAsync();
      } catch {
        // Fall through to the pending-drop check and the random launch tab.
      }
      // A launch tap counts as this session's notification route (the tap wins).
      if (tabForNotificationResponse(response)) notificationRoutedAt.current = Date.now();
      // Never leave the shell blank: any failure falls back to the random tab.
      const tab = await resolveLaunchTab(response, hasPendingDrop).catch(() => pickInitialTab());
      if (cancelled) return;
      latest.current.setActiveTab(tab);
      coldStartDone.current = true;
      latest.current.onRouted();
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — cold start runs once

  // Warm taps. A listener, not useLastNotificationResponse: that hook drops a
  // response whose identifier matches the previous one, and the drop alert
  // ('scorecard-drop') and the soonest early-week nudge reuse theirs weekly.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const routedTab = tabForNotificationResponse(response);
      if (!routedTab) return;
      notificationRoutedAt.current = Date.now();
      latest.current.setActiveTab(routedTab);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (input.lateRevealVersion === 0) return;
    if (notificationRoutedAt.current > leftForegroundAt.current) return;
    latest.current.setActiveTab('report');
  }, [input.lateRevealVersion]);

  useEffect(() => {
    let previous: AppStateStatus = AppState.currentState;
    let inBackground = previous === 'background';
    const subscription = AppState.addEventListener('change', (next) => {
      if (previous === 'active' && next !== 'active') leftForegroundAt.current = Date.now();
      previous = next;
      const step = nextResumeState(inBackground, next);
      inBackground = step.inBackground;
      if (!step.resumed || !coldStartDone.current) return;
      void (async () => {
        const pending = await hasPendingDrop().catch(() => false);
        // A tap that lands after this check routes later and still wins.
        const tab = resolveResumeTab(pending, notificationRoutedAt.current, leftForegroundAt.current);
        if (tab) latest.current.setActiveTab(tab);
        latest.current.onRouted();
      })();
    });
    return () => subscription.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — reads latest via ref
}
