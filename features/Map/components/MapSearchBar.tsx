import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { SparkleDecoration } from '../../../core/fx';

interface MapSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isScanning: boolean;
  topOffset: number;
}

export function MapSearchBar({ value, onChangeText, onSubmit, isScanning, topOffset }: MapSearchBarProps) {
  const [focused, setFocused] = useState(false);

  const outerStyle = isScanning
    ? styles.outerScanning
    : focused
      ? styles.outerFocused
      : styles.outerDefault;

  const innerStyle = isScanning
    ? styles.innerScanning
    : focused
      ? styles.innerFocused
      : styles.innerDefault;

  const shadowStyle = isScanning
    ? styles.shadowScanning
    : focused
      ? styles.shadowFocused
      : styles.shadowDefault;

  const inputColor = isScanning
    ? theme.colors.glowCyan
    : theme.colors.textPrimary;

  const iconColor = isScanning
    ? theme.colors.glowCyan
    : theme.colors.highlightBlue;

  return (
    <View style={[styles.container, shadowStyle, { top: topOffset }]}>
      {/* Outer bevel frame */}
      <View style={[styles.outerFrame, outerStyle]}>
        {/* Inner frame */}
        <View style={[styles.innerFrame, innerStyle]}>
          {/* Left accent bar — focused only */}
          {focused && !isScanning && <View style={styles.focusAccentBar} />}

          <TextInput
            style={[styles.input, { color: inputColor }]}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={mapCopy.searchPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="search"
            accessibilityLabel={mapCopy.searchLabel}
            accessibilityHint={mapCopy.searchHint}
            allowFontScaling
          />

          <Pressable
            onPress={onSubmit}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={isScanning ? mapCopy.scanning : mapCopy.search}
            disabled={isScanning}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.iconText, { color: iconColor }]} allowFontScaling>
              {isScanning ? mapCopy.scanningIcon : mapCopy.scanIcon}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Sparkles — near search icon, hidden during scanning */}
      {!isScanning && <SparkleDecoration />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: theme.space.lg,
    right: theme.space.lg,
    overflow: 'visible',
  },

  // ── Outer bevel frame ──
  outerFrame: {
    borderWidth: theme.borders.bevel.width,
    padding: 2,
  },
  outerDefault: {
    borderTopColor: theme.colors.focusBevelLight,
    borderLeftColor: theme.colors.focusBevelLight,
    borderBottomColor: theme.colors.focusBevelDark,
    borderRightColor: theme.colors.focusBevelDark,
  },
  outerFocused: {
    borderTopColor: theme.colors.highlightBlue,
    borderLeftColor: theme.colors.highlightBlue,
    borderBottomColor: theme.colors.focusAccent,
    borderRightColor: theme.colors.focusAccent,
  },
  outerScanning: {
    borderTopColor: theme.colors.glowCyan,
    borderLeftColor: theme.colors.glowCyan,
    borderBottomColor: '#3A9AA8',
    borderRightColor: '#3A9AA8',
  },

  // ── Inner frame ──
  innerFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  innerDefault: {
    backgroundColor: theme.colors.panelInner,
    borderTopColor: theme.colors.focusBevelDark,
    borderLeftColor: theme.colors.focusBevelDark,
    borderBottomColor: theme.colors.focusBevelLight,
    borderRightColor: theme.colors.focusBevelLight,
  },
  innerFocused: {
    backgroundColor: '#112244',
    borderTopColor: theme.colors.focusBevelDark,
    borderLeftColor: theme.colors.focusBevelDark,
    borderBottomColor: theme.colors.focusBevelLight,
    borderRightColor: theme.colors.focusBevelLight,
  },
  innerScanning: {
    backgroundColor: '#0A1A20',
    borderTopColor: '#3A9AA8',
    borderLeftColor: '#3A9AA8',
    borderBottomColor: theme.colors.glowCyan,
    borderRightColor: theme.colors.glowCyan,
  },

  focusAccentBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.highlightBlue,
  },

  input: {
    flex: 1,
    paddingHorizontal: theme.space.md,
    height: theme.a11y.minTapTarget,
    ...theme.type.bodyM,
  },

  iconButton: {
    width: theme.a11y.minTapTarget,
    height: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  // ── Drop shadows ──
  shadowDefault: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  shadowFocused: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.focusAccent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
    }),
  },
  shadowScanning: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.glowCyan,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
});
