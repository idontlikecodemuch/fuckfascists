import * as SecureStore from 'expo-secure-store';

const LEGACY_BETA_MODE_KEY = 'ff_beta_mode';
export const BETA_MODE_KEY = 'ff_beta_mode_device_v2';

const DEVICE_ONLY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Reads the device-only beta toggle and clears the old migratable Keychain key.
 * The v2 key intentionally does not move to a different device through backup
 * restore, so a public install cannot inherit another device's tester state.
 */
export async function readBetaMode(): Promise<boolean> {
  await SecureStore.deleteItemAsync(LEGACY_BETA_MODE_KEY).catch(() => undefined);
  const value = await SecureStore.getItemAsync(BETA_MODE_KEY, DEVICE_ONLY_OPTIONS);
  return value === 'true';
}

export async function writeBetaMode(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(
    BETA_MODE_KEY,
    enabled ? 'true' : 'false',
    DEVICE_ONLY_OPTIONS,
  );
}
