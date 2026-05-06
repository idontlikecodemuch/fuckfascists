import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Privacy intercept hook for the scorecard share experience.
 *
 * Returns true while the app is in the `active` state, false otherwise.
 *
 * Why we care:
 *   - iOS fires `inactive` when the user pulls down Control Center, when the
 *     App Switcher previews the app, or when an interruption (incoming call)
 *     covers the screen. A JS swap to a clean PNG-only view during `inactive`
 *     means those system snapshots are the rendered card alone — no starfield,
 *     no chrome.
 *   - iOS screenshots are handled separately in CardPresentation: the clean
 *     scorecard sits below a native secure overlay, so the system capture
 *     omits the presentation chrome and reveals the card underneath.
 *   - Android does NOT fire AppState changes for screenshots (they are
 *     silent). The hook still catches App Switcher previews here, which is
 *     a free win. For Android screenshots, the SHARE button is the primary
 *     clean-output path.
 */
export function useAppActive(): boolean {
  const [active, setActive] = useState<boolean>(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      setActive(next === 'active');
    });
    return () => sub.remove();
  }, []);

  return active;
}
