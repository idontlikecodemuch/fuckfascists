import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBanner } from '../../core/ui/AlertBanner';
import {
  fetchAvailableAppStoreUpdate,
  type AppStoreUpdate,
} from '../../core/updates/appStoreUpdate';
import { updatesCopy } from '../../copy/updates';
import { theme } from '../../design/tokens';

interface AppUpdateBannerProps {
  /** Temporarily hides the notice without losing its per-version dismiss state. */
  suppressed?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  onHeightChange?: (height: number) => void;
}

const DISMISSED_VERSION_KEY = 'app_update_dismissed_version';

/**
 * Optional App Store update notice. It is intentionally dismissible and
 * fail-open: no store/network response can block the offline-first app.
 */
export function AppUpdateBanner({
  suppressed = false,
  onVisibleChange,
  onHeightChange,
}: AppUpdateBannerProps) {
  const [update, setUpdate] = useState<AppStoreUpdate | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const insets = useSafeAreaInsets();
  const visible = Platform.OS === 'ios' && !!update && !dismissed && !suppressed;

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const installedVersion = Constants.expoConfig?.version;
    if (!installedVersion) return;

    let cancelled = false;
    (async () => {
      const available = await fetchAvailableAppStoreUpdate(installedVersion);
      const dismissedVersion = await SecureStore.getItemAsync(DISMISSED_VERSION_KEY)
        .catch(() => null);
      if (cancelled) return;
      if (available && dismissedVersion === available.availableVersion) {
        setDismissed(true);
      }
      setUpdate(available);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    onVisibleChange?.(visible);
    if (!visible) onHeightChange?.(0);
    return () => {
      onVisibleChange?.(false);
      onHeightChange?.(0);
    };
  }, [onHeightChange, onVisibleChange, visible]);

  const handlePress = useCallback(() => {
    if (!update) return;
    Linking.openURL(update.storeUrl).catch(() => undefined);
  }, [update]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    onHeightChange?.(Math.ceil(event.nativeEvent.layout.height));
  }, [onHeightChange]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (update) {
      SecureStore.setItemAsync(DISMISSED_VERSION_KEY, update.availableVersion)
        .catch(() => undefined);
    }
  }, [update]);

  if (!visible) return null;

  return (
    <View style={styles.position} onLayout={handleLayout}>
      <AlertBanner
        title={updatesCopy.title}
        body={updatesCopy.body}
        onPress={handlePress}
        onDismiss={handleDismiss}
        bodyA11yLabel={updatesCopy.openA11y}
        dismissA11yLabel={updatesCopy.dismissA11y}
        panelStyle={{ paddingTop: insets.top + theme.space.sm }}
        showSparkles
      />
    </View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
  },
});
