import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import type { Platform } from '../types';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { getDefaultSelectedIds } from '../hooks/usePlatformRoster';
import { theme } from '../../../design/tokens';

interface PlatformSetupScreenProps {
  platforms: Platform[];
  /** Pre-selected IDs when editing an existing roster. Undefined for first-time setup. */
  initialSelection?: string[];
  onDone: (selectedIds: string[]) => Promise<void>;
}

/**
 * Character-select screen for choosing which platforms to track.
 * Shown on first use (no prior roster) or when the user taps EDIT.
 *
 * All user-facing strings imported from copy/platforms.ts.
 */
export function PlatformSetupScreen({ platforms, initialSelection, onDone }: PlatformSetupScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const ids = initialSelection ?? getDefaultSelectedIds();
    return new Set(ids);
  });

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDone = useCallback(async () => {
    await onDone([...selected]);
  }, [onDone, selected]);

  const renderItem = useCallback(({ item }: { item: Platform }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        onPress={() => toggle(item.id)}
        style={[styles.card, isSelected && styles.cardSelected]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={item.name}
      >
        <View style={styles.checkbox}>
          {isSelected && (
            <Text style={styles.check} allowFontScaling={false}>{sharedCopy.checkmark}</Text>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} allowFontScaling>{item.name}</Text>
          <Text style={styles.cardSub} allowFontScaling>
            {platformsCopy.rowSubtitle(item.parentCompany, item.ceoName)}
          </Text>
          <View style={styles.cardTags}>
            {item.categoryTags.map((tag) => (
              <Text key={tag} style={styles.cardTag} allowFontScaling>{tag}</Text>
            ))}
          </View>
        </View>
      </Pressable>
    );
  }, [selected, toggle]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {platformsCopy.setupTitle}
        </Text>
        <Text style={styles.subhead} allowFontScaling>
          {platformsCopy.setupSubhead}
        </Text>
      </View>

      <FlatList<Platform>
        data={platforms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <Pressable
          onPress={handleDone}
          style={[styles.doneBtn, selected.size === 0 && styles.doneBtnDisabled]}
          disabled={selected.size === 0}
          accessibilityRole="button"
          accessibilityLabel={platformsCopy.setupDone}
        >
          <Text style={[styles.doneText, selected.size === 0 && styles.doneTextDisabled]} allowFontScaling>
            {platformsCopy.setupDone}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: theme.colors.bgVoid },
  header:          { padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  title:           { ...theme.type.displayL, color: theme.colors.textPrimary, letterSpacing: 3 },
  subhead:         { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 6 },
  list:            { padding: theme.space.md, paddingBottom: 80 },
  card:            { flexDirection: 'row', alignItems: 'center', padding: theme.space.md, marginBottom: theme.space.sm, borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, backgroundColor: theme.colors.surface1, minHeight: theme.a11y.minTapTarget },
  cardSelected:    { borderColor: theme.colors.rewardYellow },
  checkbox:        { width: 28, height: 28, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, alignItems: 'center', justifyContent: 'center', marginRight: theme.space.md, backgroundColor: theme.colors.bgVoid },
  check:           { fontFamily: theme.fonts.headline, fontSize: 16, fontWeight: 'bold', color: theme.colors.successGreen },
  cardInfo:        { flex: 1 },
  cardName:        { ...theme.type.uiLabel, color: theme.colors.textPrimary, marginBottom: 2 },
  cardSub:         { ...theme.type.caption, color: theme.colors.textSecondary, marginBottom: theme.space.xs },
  cardTags:        { flexDirection: 'row', gap: 6 },
  cardTag:         { ...theme.type.caption, fontSize: 9, color: theme.colors.bgVoid, backgroundColor: theme.colors.rewardYellow, paddingHorizontal: 4, paddingVertical: 1 },
  footer:          { padding: theme.space.lg, borderTopWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, backgroundColor: theme.colors.bgVoid },
  doneBtn:         { minHeight: theme.a11y.minTapTarget, borderWidth: theme.borders.hero.width, borderColor: theme.colors.successGreen, backgroundColor: theme.colors.successGreen, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  doneBtnDisabled: { borderColor: theme.colors.surface2, backgroundColor: theme.colors.surface2 },
  doneText:        { ...theme.type.displayS, color: theme.colors.bgVoid, letterSpacing: 2 },
  doneTextDisabled:{ color: theme.colors.textSecondary },
});
