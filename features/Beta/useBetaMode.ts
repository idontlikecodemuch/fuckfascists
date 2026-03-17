import { useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

const BETA_KEY = 'ff_beta_mode';
const TAP_COUNT_REQUIRED = 3;
const TAP_WINDOW_MS = 1500;

/**
 * Manages beta testing mode.
 *
 * Triple-tap the version label on the Info screen to toggle.
 * State persisted in SecureStore so it survives app restarts.
 */
export function useBetaMode() {
  const [enabled, setEnabled] = useState(false);
  const tapTimestamps = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(BETA_KEY)
      .then((val) => { if (!cancelled) setEnabled(val === 'true'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback(async () => {
    const next = !enabled;
    setEnabled(next);
    await SecureStore.setItemAsync(BETA_KEY, next ? 'true' : 'false');
    return next;
  }, [enabled]);

  /**
   * Call this on every tap of the version label.
   * Returns `true` when the triple-tap fires (and beta is toggled).
   */
  const registerTap = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    tapTimestamps.current.push(now);

    // Only keep taps within the window
    tapTimestamps.current = tapTimestamps.current.filter(
      (t) => now - t < TAP_WINDOW_MS,
    );

    if (tapTimestamps.current.length >= TAP_COUNT_REQUIRED) {
      tapTimestamps.current = [];
      await toggle();
      return true;
    }
    return false;
  }, [toggle]);

  return { betaEnabled: enabled, registerTap };
}
