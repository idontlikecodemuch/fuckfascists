import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { StorageAdapter } from '../../core/data';
import type { Entity } from '../../core/models';
import type { Platform } from '../../features/Platforms/types';
import { shouldLaunchPendingScorecardDrop } from '../../features/Scorecard/utils/pendingDropLaunch';
import type { Tab } from './TabBar';
import { pickInitialTab } from './initialTab';
import { resolveLaunchTab } from './launchRoute';
import { tabForNotificationResponse } from './notificationRoute';

interface LaunchRoutingInput {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  setActiveTab: (tab: Tab) => void;
  /** Runs after each routing decision: once at cold start, then on every resume. */
  onRouted: () => void;
}

/**
 * App-shell routing:
 * - cold start: notification route, else Scorecard for a pending drop, else
 *   the random launch tab (see resolveLaunchTab);
 * - warm notification taps: the notification's tab;
 * - resume to 'active': Scorecard for a pending drop.
 * onRouted fires only after the route is set, so the shell's card capture can
 * never decide the route.
 */
export function useLaunchRouting(input: LaunchRoutingInput): void {
  const latest = useRef(input);
  latest.current = input;
  const coldStartDone = useRef(false);

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
      // Never leave the shell blank: any failure falls back to the random tab.
      const tab = await resolveLaunchTab(response, hasPendingDrop).catch(() => pickInitialTab());
      if (cancelled) return;
      latest.current.setActiveTab(tab);
      coldStartDone.current = true;
      latest.current.onRouted();
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — cold start runs once

  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const routedTab = tabForNotificationResponse(lastNotificationResponse);
    if (routedTab) latest.current.setActiveTab(routedTab);
  }, [lastNotificationResponse]);

  useEffect(() => {
    let previous: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      const resumed = next === 'active' && previous !== 'active';
      previous = next;
      if (!resumed || !coldStartDone.current) return;
      void (async () => {
        if (await hasPendingDrop().catch(() => false)) latest.current.setActiveTab('report');
        latest.current.onRouted();
      })();
    });
    return () => subscription.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — reads latest via ref
}
