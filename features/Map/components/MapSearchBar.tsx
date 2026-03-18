import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface MapSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isScanning: boolean;
  topOffset: number;
}

export function MapSearchBar({ value, onChangeText, onSubmit, isScanning, topOffset }: MapSearchBarProps) {
  return (
    <View style={[styles.container, { top: topOffset }]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={mapCopy.searchPlaceholder}
        placeholderTextColor={theme.colors.textSecondary}
        returnKeyType="search"
        accessibilityLabel={mapCopy.searchLabel}
        accessibilityHint={mapCopy.searchHint}
        allowFontScaling
      />
      <Pressable
        onPress={onSubmit}
        style={[styles.button, isScanning && styles.buttonBusy]}
        accessibilityRole="button"
        accessibilityLabel={isScanning ? mapCopy.scanning : mapCopy.search}
        disabled={isScanning}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonText} allowFontScaling>
          {isScanning ? mapCopy.scanningIcon : mapCopy.scanIcon}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { position: 'absolute', left: theme.space.lg, right: theme.space.lg, flexDirection: 'row', borderTopWidth: theme.borders.standard.width, borderTopColor: theme.colors.highlightBlue, borderBottomWidth: theme.borders.standard.width, borderBottomColor: theme.colors.bgVoid },
  input:      { flex: 1, backgroundColor: theme.colors.surface1, borderColor: theme.colors.highlightBlue, borderWidth: theme.borders.standard.width, borderTopWidth: 0, borderBottomWidth: 0, paddingHorizontal: theme.space.md, height: theme.a11y.minTapTarget, ...theme.type.bodyM, color: theme.colors.textPrimary },
  button:     { width: theme.a11y.minTapTarget, height: theme.a11y.minTapTarget, backgroundColor: theme.colors.bgNav, alignItems: 'center', justifyContent: 'center', borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  buttonBusy: { backgroundColor: theme.colors.surface2 },
  buttonText: { color: theme.colors.glowCyan, fontSize: 22, fontWeight: 'bold' },
});
