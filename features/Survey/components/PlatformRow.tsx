import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { SurveyItem } from '../types';
import { surveyCopy } from '../../../copy/survey';
import { sharedCopy } from '../../../copy/shared';

interface PlatformRowProps {
  item: SurveyItem;
  onAvoid: () => Promise<void>;
}

/**
 * Single row in the weekly survey checklist.
 * Once marked avoided the row locks — consistent with the one-way data model.
 * Minimum tap target: 44×44pt on the full row.
 */
export function PlatformRow({ item, onAvoid }: PlatformRowProps) {
  const { platform, avoided } = item;

  return (
    <Pressable
      onPress={avoided ? undefined : async () => { await onAvoid(); }}
      disabled={avoided}
      style={[styles.row, avoided && styles.rowAvoided]}
      accessibilityRole="checkbox"
      accessibilityLabel={avoided ? surveyCopy.rowAvoided(platform.name) : surveyCopy.rowNotAvoided(platform.name)}
      accessibilityState={{ checked: avoided, disabled: avoided }}
    >
      {/* Pixel art checkbox */}
      <View style={[styles.checkbox, avoided && styles.checkboxChecked]}>
        {avoided && <Text style={styles.checkmark} accessible={false}>{sharedCopy.checkmark}</Text>}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} allowFontScaling>{platform.name}</Text>
        <Text style={styles.sub} allowFontScaling>
          {surveyCopy.rowSubtitle(platform.parentCompany, platform.ceoName)}
        </Text>
        <View style={styles.tags}>
          {platform.categoryTags.map((tag) => (
            <Text key={tag} style={styles.tag} allowFontScaling>{tag}</Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const GREEN = '#228B22';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  row:             { flexDirection: 'row', alignItems: 'flex-start', padding: 12, minHeight: 44, borderBottomWidth: 2, borderColor: BLACK },
  rowAvoided:      { backgroundColor: '#E8F5E9' },
  checkbox:        { width: 24, height: 24, borderWidth: 3, borderColor: BLACK, marginRight: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE },
  checkboxChecked: { backgroundColor: GREEN, borderColor: GREEN },
  checkmark:       { color: WHITE, fontSize: 14, fontWeight: 'bold' },
  info:            { flex: 1 },
  name:            { fontFamily: MONO, fontSize: 15, fontWeight: 'bold', color: BLACK, marginBottom: 2 },
  sub:             { fontFamily: MONO, fontSize: 11, color: '#555', marginBottom: 4 },
  tags:            { flexDirection: 'row', gap: 6 },
  tag:             { fontFamily: MONO, fontSize: 10, color: WHITE, backgroundColor: BLACK, paddingHorizontal: 5, paddingVertical: 1 },
});
