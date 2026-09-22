import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Routes the Android hardware/gesture Back action to an overlay's own dismiss
 * handler while that overlay is showing. Without this, Back finishes the
 * single Activity and drops the user on the launcher from a business card,
 * scanner sheet, scorecard presentation, or archive.
 *
 * No-op on iOS (no hardware back event is emitted there). Handlers registered
 * later run first, so a nested overlay closes before its parent.
 */
export function useAndroidBackHandler(onBack: () => void, enabled = true): void {
  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, enabled]);
}
