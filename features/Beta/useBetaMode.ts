import { useState, useEffect, useCallback, useRef } from 'react';
import { readBetaMode, writeBetaMode } from './betaModeStore';

const TAP_COUNT_REQUIRED = 7;
const TAP_WINDOW_MS = 3000;

/**
 * Manages beta testing mode.
 *
 * Seven-tap the version label on the Info screen to request a toggle.
 * State is persisted device-only so it survives app updates but cannot migrate
 * to another phone through an iCloud/backup restore.
 */
export function useBetaMode() {
  const [enabled, setEnabled] = useState(false);
  const tapTimestamps = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    readBetaMode()
      .then((val) => { if (!cancelled) setEnabled(val); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const setBetaEnabled = useCallback(async (next: boolean) => {
    setEnabled(next);
    await writeBetaMode(next);
  }, []);

  /**
   * Call this on every tap of the version label.
   * Returns `true` when the hidden seven-tap threshold is reached. The caller
   * owns confirmation and the actual state change.
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
      return true;
    }
    return false;
  }, []);

  return { betaEnabled: enabled, registerTap, setBetaEnabled };
}
