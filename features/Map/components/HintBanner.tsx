import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface HintBannerProps {
  message: string;
  onDismiss: () => void;
}

/**
 * First-use hint banner displayed on the Map screen.
 * Positioned above the search bar with a dismiss button.
 * Dismissal is persisted via useMapHints + SecureStore.
 */
export function HintBanner({ message, onDismiss }: HintBannerProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.text} allowFontScaling>{message}</Text>
      <Pressable
        onPress={onDismiss}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.hintDismissLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.dismissText} allowFontScaling={false}>{'\u2715'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    gap: theme.space.sm,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.rewardYellow,
    flex: 1,
    lineHeight: 18,
  },
  dismissButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
