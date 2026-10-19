import { useCallback } from 'react';
import { Alert } from 'react-native';
import { betaCopy } from '../../copy/beta';
import type { useBetaMode } from './useBetaMode';

/**
 * Info-screen version-label tap handler. Seven taps request the toggle:
 * beta mode turns off right away, and turns on only after the confirmation.
 */
export function useBetaVersionTap({
  betaEnabled,
  registerTap,
  setBetaEnabled,
}: ReturnType<typeof useBetaMode>): () => Promise<void> {
  return useCallback(async () => {
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
            void (async () => {
              try {
                await setBetaEnabled(true);
                Alert.alert(betaCopy.activated);
              } catch {
                // Storage write failed; beta mode stays off.
              }
            })();
          },
        },
      ],
    );
  }, [registerTap, betaEnabled, setBetaEnabled]);
}
