import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PlatformItem } from '../types';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';

interface PlatformRowProps {
  item: PlatformItem;
  onAvoid: () => Promise<void>;
}

/**
 * Single row in the platform avoidance list.
 * Each tap increments the day's count — the button never locks.
 * Minimum tap target: 44×44pt on the avoid button.
 */
export function PlatformRow({ item, onAvoid }: PlatformRowProps) {
  const { platform, weeklyCount } = item;
  const hasAvoided = weeklyCount > 0;

  return (
    <View style={[styles.row, hasAvoided && styles.rowAvoided]}>
      <View style={styles.info}>
        <Text style={styles.name} allowFontScaling>{platform.name}</Text>
        <Text style={styles.sub} allowFontScaling>
          {platformsCopy.rowSubtitle(platform.parentCompany, platform.ceoName)}
        </Text>
        <View style={styles.tags}>
          {platform.categoryTags.map((tag) => (
            <Text key={tag} style={styles.tag} allowFontScaling>{tag}</Text>
          ))}
        </View>
      </View>

      {hasAvoided && (
        <Text
          style={styles.count}
          allowFontScaling
          accessibilityLabel={platformsCopy.countA11y(weeklyCount, platform.name)}
        >
          {platformsCopy.countLabel(weeklyCount)}
        </Text>
      )}

      <Pressable
        onPress={async () => { await onAvoid(); }}
        style={[styles.avoidBtn, hasAvoided && styles.avoidBtnActive]}
        accessibilityRole="button"
        accessibilityLabel={
          hasAvoided
            ? platformsCopy.avoidedLabel(platform.name)
            : platformsCopy.notAvoidedLabel(platform.name)
        }
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text style={[styles.avoidText, hasAvoided && styles.avoidTextActive]} allowFontScaling>
          {hasAvoided ? sharedCopy.checkmark : platformsCopy.avoidBtn}
        </Text>
      </Pressable>
    </View>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const GREEN = '#228B22';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  row:             { flexDirection: 'row', alignItems: 'center', padding: 12, minHeight: 44, borderBottomWidth: 2, borderColor: BLACK },
  rowAvoided:      { backgroundColor: '#E8F5E9' },
  info:            { flex: 1 },
  name:            { fontFamily: MONO, fontSize: 15, fontWeight: 'bold', color: BLACK, marginBottom: 2 },
  sub:             { fontFamily: MONO, fontSize: 11, color: '#555', marginBottom: 4 },
  tags:            { flexDirection: 'row', gap: 6 },
  tag:             { fontFamily: MONO, fontSize: 10, color: WHITE, backgroundColor: BLACK, paddingHorizontal: 5, paddingVertical: 1 },
  count:           { fontFamily: MONO, fontSize: 16, fontWeight: 'bold', color: GREEN, marginRight: 12 },
  avoidBtn:        { minWidth: 44, minHeight: 44, borderWidth: 3, borderColor: BLACK, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  avoidBtnActive:  { backgroundColor: GREEN, borderColor: GREEN },
  avoidText:       { fontFamily: MONO, fontSize: 12, fontWeight: 'bold', color: BLACK },
  avoidTextActive: { color: WHITE },
});
