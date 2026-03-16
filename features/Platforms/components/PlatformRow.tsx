import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PlatformItem } from '../types';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { DayCircles } from './DayCircles';

interface PlatformRowProps {
  item: PlatformItem;
  weekOf: string;
  onAvoid: () => Promise<void>;
  onAvoidDate: (date: string) => Promise<void>;
}

/**
 * Single row in the platform avoidance list.
 * Each tap increments the day's count — the button never locks.
 * Minimum tap target: 44×44pt on the avoid button.
 *
 * Tap the chevron to expand and show 7 day circles for the current week.
 */
export function PlatformRow({ item, weekOf, onAvoid, onAvoidDate }: PlatformRowProps) {
  const { platform, weeklyCount, dayCounts } = item;
  const hasAvoided = weeklyCount > 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.outer, hasAvoided && styles.outerAvoided]}>
      <View style={styles.row}>
        {/* Expand/collapse chevron */}
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.chevronBtn}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? platformsCopy.collapseLabel(platform.name)
              : platformsCopy.expandLabel(platform.name)
          }
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.chevron} allowFontScaling={false}>
            {expanded ? '\u25BC' : '\u25B6'}
          </Text>
        </Pressable>

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

      {expanded && (
        <DayCircles
          weekOf={weekOf}
          platformName={platform.name}
          dayCounts={dayCounts}
          onAvoidDate={onAvoidDate}
        />
      )}
    </View>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const GREEN = '#228B22';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  outer:           { borderBottomWidth: 2, borderColor: BLACK },
  outerAvoided:    { backgroundColor: '#E8F5E9' },
  row:             { flexDirection: 'row', alignItems: 'center', padding: 12, minHeight: 44 },
  chevronBtn:      { minWidth: 28, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  chevron:         { fontFamily: MONO, fontSize: 12, color: BLACK },
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
