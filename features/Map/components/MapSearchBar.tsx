import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';

interface MapSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isScanning: boolean;
  topOffset: number;
}

const MONO = 'monospace' as const;
const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';

export function MapSearchBar({ value, onChangeText, onSubmit, isScanning, topOffset }: MapSearchBarProps) {
  return (
    <View style={[styles.container, { top: topOffset }]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Search a business name..."
        placeholderTextColor="#888"
        returnKeyType="search"
        accessibilityLabel="Search for a business"
        accessibilityHint="Type a business name and press search to check its political donations"
        allowFontScaling
      />
      <Pressable
        onPress={onSubmit}
        style={[styles.button, isScanning && styles.buttonBusy]}
        accessibilityRole="button"
        accessibilityLabel={isScanning ? 'Scanning…' : 'Search'}
        disabled={isScanning}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonText} allowFontScaling>
          {isScanning ? '…' : '\u2315'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { position: 'absolute', left: 16, right: 16, flexDirection: 'row' },
  input:      { flex: 1, backgroundColor: WHITE, borderColor: BLACK, borderWidth: 3, paddingHorizontal: 12, height: 44, fontFamily: MONO, fontSize: 14, color: BLACK },
  button:     { width: 44, height: 44, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WHITE },
  buttonBusy: { backgroundColor: '#555' },
  buttonText: { color: WHITE, fontSize: 20 },
});
