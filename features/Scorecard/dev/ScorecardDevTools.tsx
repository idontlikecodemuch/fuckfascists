import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { theme } from '../../../design/tokens';

interface ScorecardDevToolsProps {
  onGenerateNow: () => void;
  onResetCard: () => void;
  weekOf: string;
}

/**
 * Togglable dev panel for testing the scorecard during development.
 * Only renders when __DEV__ or beta mode is active.
 *
 * Features:
 * - "Generate Card Now" — bypasses drop schedule, triggers immediate capture
 * - "Reset Card" — clears cached PNG for the current week
 *
 * Fully removable: guarded by __DEV__ check in ScorecardScreen.
 */
export function ScorecardDevTools({ onGenerateNow, onResetCard, weekOf }: ScorecardDevToolsProps) {
  const handleReset = async () => {
    const dir = `${FileSystem.documentDirectory}scorecards/`;
    const path = `${dir}${weekOf}.png`;
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path);
        Alert.alert('Card Reset', `Deleted ${weekOf}.png`);
      } else {
        Alert.alert('No Card', 'No cached card for this week.');
      }
    } catch {
      Alert.alert('Error', 'Failed to reset card.');
    }
    onResetCard();
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>DEV TOOLS</Text>
      <View style={styles.buttons}>
        <Pressable style={styles.btn} onPress={onGenerateNow}>
          <Text style={styles.btnText}>Generate Card Now</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleReset}>
          <Text style={styles.btnText}>Reset Card</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    margin: theme.space.md,
    padding: theme.space.md,
    backgroundColor: 'rgba(255,60,60,0.1)',
    borderWidth: 1,
    borderColor: theme.colors.dangerRed,
    gap: theme.space.sm,
  },
  label: {
    fontFamily: theme.fonts.headline,
    fontSize: 10,
    color: theme.colors.dangerRed,
    letterSpacing: 3,
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.space.sm,
  },
  btn: {
    flex: 1,
    backgroundColor: theme.colors.rewardYellow,
    paddingVertical: theme.space.sm,
    alignItems: 'center',
    borderRadius: 2,
  },
  btnDanger: {
    backgroundColor: theme.colors.dangerRed,
  },
  btnText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 11,
    color: theme.colors.bgVoid,
  },
});
