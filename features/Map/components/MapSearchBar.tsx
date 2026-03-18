import React from 'react';
import { View, TextInput, Pressable, Text, Image, ImageBackground, StyleSheet } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { inputField, btnCircleSearch } from '../../../core/ui/uiAssets';

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
      <ImageBackground source={inputField} resizeMode="stretch" style={styles.inputBg} imageStyle={styles.inputBgImage}>
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
      </ImageBackground>
      <Pressable
        onPress={onSubmit}
        style={[styles.button, isScanning && styles.buttonBusy]}
        accessibilityRole="button"
        accessibilityLabel={isScanning ? mapCopy.scanning : mapCopy.search}
        disabled={isScanning}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image source={btnCircleSearch} style={styles.buttonIcon} resizeMode="contain" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { position: 'absolute', left: theme.space.lg, right: theme.space.lg, flexDirection: 'row', alignItems: 'center' },
  inputBg:      { flex: 1, height: theme.a11y.minTapTarget },
  inputBgImage: { borderRadius: 0 },
  input:        { flex: 1, paddingHorizontal: theme.space.md, height: theme.a11y.minTapTarget, ...theme.type.bodyM, color: theme.colors.textPrimary },
  button:       { width: theme.a11y.minTapTarget, height: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', marginLeft: theme.space.xs },
  buttonBusy:   { opacity: 0.5 },
  buttonIcon:   { width: 36, height: 36 },
});
