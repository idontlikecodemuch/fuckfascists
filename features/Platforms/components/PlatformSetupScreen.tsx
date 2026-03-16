import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import type { Platform } from '../types';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { getDefaultSelectedIds } from '../hooks/usePlatformRoster';

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

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const GREEN = '#228B22';
const RED   = '#CC0000';
const AMBER = '#CC7A00';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: BLACK },
  header:          { padding: 16, borderBottomWidth: 4, borderColor: RED },
  title:           { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  subhead:         { fontFamily: MONO, fontSize: 12, color: '#AAA', marginTop: 6 },
  list:            { padding: 12, paddingBottom: 80 },
  card:            { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderWidth: 3, borderColor: '#444', backgroundColor: '#2A2A2A', minHeight: 44 },
  cardSelected:    { borderColor: GREEN, backgroundColor: '#1A2E1A' },
  checkbox:        { width: 28, height: 28, borderWidth: 3, borderColor: '#666', alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: BLACK },
  check:           { fontFamily: MONO, fontSize: 16, fontWeight: 'bold', color: GREEN },
  cardInfo:        { flex: 1 },
  cardName:        { fontFamily: MONO, fontSize: 14, fontWeight: 'bold', color: WHITE, marginBottom: 2 },
  cardSub:         { fontFamily: MONO, fontSize: 10, color: '#888', marginBottom: 4 },
  cardTags:        { flexDirection: 'row', gap: 6 },
  cardTag:         { fontFamily: MONO, fontSize: 9, color: BLACK, backgroundColor: AMBER, paddingHorizontal: 4, paddingVertical: 1 },
  footer:          { padding: 16, borderTopWidth: 3, borderColor: RED, backgroundColor: BLACK },
  doneBtn:         { minHeight: 44, borderWidth: 3, borderColor: GREEN, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  doneBtnDisabled: { borderColor: '#444', backgroundColor: '#333' },
  doneText:        { fontFamily: MONO, fontSize: 16, fontWeight: 'bold', color: WHITE, letterSpacing: 2 },
  doneTextDisabled:{ color: '#666' },
});
