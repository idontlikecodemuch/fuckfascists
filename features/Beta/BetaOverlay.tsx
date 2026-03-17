import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { captureScreen } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { betaCopy } from '../../copy/beta';
import { theme } from '../../design/tokens';

/**
 * Floating beta overlay — shown when beta mode is active.
 * - "BETA" indicator badge in top-left
 * - "BUG" floating button in bottom-left — captures screenshot and saves to camera roll
 */
export function BetaOverlay() {
  const capturing = useRef(false);

  const handleBugReport = useCallback(async () => {
    if (capturing.current) return;
    capturing.current = true;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(betaCopy.screenshotFailed);
        return;
      }
      const uri = await captureScreen({ format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(betaCopy.screenshotSaved);
    } catch {
      Alert.alert(betaCopy.screenshotFailed);
    } finally {
      capturing.current = false;
    }
  }, []);

  return (
    <>
      {/* Beta indicator */}
      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText} accessibilityLabel={betaCopy.indicatorLabel}>
          {betaCopy.indicator}
        </Text>
      </View>

      {/* Bug report button */}
      <Pressable
        style={styles.bugButton}
        onPress={handleBugReport}
        accessibilityRole="button"
        accessibilityLabel={betaCopy.bugButtonLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.bugText}>{betaCopy.bugButton}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 52,
    left: theme.space.md,
    backgroundColor: theme.colors.dangerRed,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 2,
    zIndex: 999,
  },
  badgeText: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
    fontSize: 9,
  },
  bugButton: {
    position: 'absolute',
    bottom: 100,
    left: theme.space.md,
    width: 44,
    height: 44,
    backgroundColor: theme.colors.dangerRed,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  bugText: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 1,
    fontSize: 10,
  },
});
