import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ALERTS_PROMPT_AFTER_AVOID_DELAY_MS } from '../../config/constants';
import {
  openAlertsControl,
  readAlertsPermission,
  requestAlertsPermission,
  type AlertsPermission,
} from './alertPermission';

interface AlertsContextValue {
  /** Null until the first read finishes. */
  permission: AlertsPermission | null;
  alertsOn: boolean;
  /** Bumps after every permission read (launch, resume, a prompt). */
  checkVersion: number;
  /** The system prompt while it can still show, otherwise the app's Settings page. */
  openControl: () => Promise<void>;
  /**
   * After an avoid: the system prompt, once, for someone who was never asked.
   * Skipped while `isBlocked()` is true when it is due (a card reveal on screen).
   */
  promptAfterAvoid: (isBlocked?: () => boolean) => void;
}

const AlertsContext = createContext<AlertsContextValue>({
  permission: null,
  alertsOn: false,
  checkVersion: 0,
  openControl: async () => undefined,
  promptAfterAvoid: () => undefined,
});

/**
 * App-shell owner of the notification permission. Re-reads it on launch and
 * whenever the app becomes active (someone may have changed it in Settings),
 * so the scheduling hooks, the alerts-off banner and the Info toggle agree.
 */
export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<AlertsPermission | null>(null);
  const [checkVersion, setCheckVersion] = useState(0);
  // The permission could not be read yet: schedulers still try (as before 1.2.2).
  const [readFailed, setReadFailed] = useState(false);
  const permissionRef = useRef<AlertsPermission | null>(null);
  const promptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((next: AlertsPermission) => {
    permissionRef.current = next;
    setPermission(next);
    setReadFailed(false);
    setCheckVersion((version) => version + 1);
  }, []);

  const refresh = useCallback(async () => {
    try {
      apply(await readAlertsPermission());
    } catch {
      // Keep the last known permission.
      if (!permissionRef.current) setReadFailed(true);
    }
  }, [apply]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      subscription.remove();
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    };
  }, [refresh]);

  const openControl = useCallback(async () => {
    try {
      const current = permissionRef.current ?? await readAlertsPermission();
      const next = await openAlertsControl(current);
      if (next) apply(next);
    } catch {
      // Prompt or Settings unavailable — nothing changes.
    }
  }, [apply]);

  const promptAfterAvoid = useCallback((isBlocked?: () => boolean) => {
    if (!permissionRef.current?.neverAsked || promptTimerRef.current) return;
    promptTimerRef.current = setTimeout(async () => {
      promptTimerRef.current = null;
      // Backgrounded or a card reveal meanwhile: try again after the next avoid.
      if (AppState.currentState !== 'active' || isBlocked?.()) return;
      try {
        apply(await requestAlertsPermission());
      } catch {
        // Prompt unavailable — the banner and the Info toggle still offer it.
      }
    }, ALERTS_PROMPT_AFTER_AVOID_DELAY_MS);
  }, [apply]);

  const value = useMemo<AlertsContextValue>(() => ({
    permission,
    alertsOn: permission ? permission.status === 'on' : readFailed,
    checkVersion,
    openControl,
    promptAfterAvoid,
  }), [checkVersion, openControl, permission, promptAfterAvoid, readFailed]);

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts(): AlertsContextValue {
  return useContext(AlertsContext);
}
