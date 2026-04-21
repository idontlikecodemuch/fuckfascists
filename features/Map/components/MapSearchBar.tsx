import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Platform, Keyboard } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { SparkleDecoration } from '../../../core/fx';

/**
 * Imperative handle exposed to MapScreen. Lets surrounding map gestures
 * (map tap, business-card open) pull focus out of the search field
 * programmatically instead of the user having to find a dismiss target.
 */
export interface MapSearchBarHandle {
  /** Blurs the TextInput and closes the system keyboard. */
  blur: () => void;
}

interface MapSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isScanning: boolean;
  topOffset: number;
}

export const MapSearchBar = forwardRef<MapSearchBarHandle, MapSearchBarProps>(
  function MapSearchBar({ value, onChangeText, onSubmit, isScanning, topOffset }, ref) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    blur: () => {
      inputRef.current?.blur();
      // Belt + suspenders: some Android keyboards linger after blur alone.
      Keyboard.dismiss();
    },
  }), []);

  // Clear (×) affordance — #111/#112. Shown whenever the user could otherwise
  // be stuck: they've typed something, or they focused the field and are
  // looking for an explicit exit. Clears the query AND closes the keyboard
  // in one tap. Hidden while scanning so it can't cancel an in-flight submit.
  const showClear = !isScanning && (focused || value.length > 0);
  const handleClear = () => {
    onChangeText('');
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

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
            ref={inputRef}
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

          {showClear && (
            <Pressable
              onPress={handleClear}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={mapCopy.searchClearLabel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.iconText, styles.clearText]} allowFontScaling={false}>
                {mapCopy.searchClearIcon}
              </Text>
            </Pressable>
          )}

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
});

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
  clearText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
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
