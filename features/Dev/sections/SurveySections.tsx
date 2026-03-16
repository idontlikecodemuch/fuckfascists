/**
 * Survey component catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { PlatformRow } from '../../Survey/components/PlatformRow';
import { surveyCopy } from '../../../copy/survey';
import {
  partialSurveyItems,
  fullSurveyItems,
  emptySurveyItems,
  avoidedPlatformRow,
  notAvoidedPlatformRow,
} from '../catalogMocks';
import type { SurveyItem } from '../../Survey/types';

const noop = async () => {};

// Static survey list — uses .map() instead of FlatList to avoid
// VirtualizedList-inside-ScrollView nesting warning.
function SurveyList({ items }: { items: SurveyItem[] }) {
  const avoided = items.filter((i) => i.avoided).length;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{surveyCopy.title}</Text>
        <Text style={styles.weekLabel}>Week of Mar 10</Text>
        <Text style={styles.score}>{surveyCopy.score(avoided, items.length)}</Text>
      </View>
      {items.map((item) => (
        <PlatformRow key={item.platform.id} item={item} onAvoid={noop} />
      ))}
    </View>
  );
}

// ── Survey full-screen variants ────────────────────────────────────────────

export const SurveyPartial = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Survey — Partial (3/6)">
    <SurveyList items={partialSurveyItems} />
  </CatalogSection>
));
SurveyPartial.displayName = 'SurveyPartial';

export const SurveyFull = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Survey — Full Completion">
    <SurveyList items={fullSurveyItems} />
  </CatalogSection>
));
SurveyFull.displayName = 'SurveyFull';

export const SurveyEmpty = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Survey — Empty">
    <SurveyList items={emptySurveyItems} />
  </CatalogSection>
));
SurveyEmpty.displayName = 'SurveyEmpty';

// ── Individual PlatformRow variants ────────────────────────────────────────

export const PlatformRowAvoided = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="PlatformRow — Avoided">
    <PlatformRow item={avoidedPlatformRow} onAvoid={noop} />
  </CatalogSection>
));
PlatformRowAvoided.displayName = 'PlatformRowAvoided';

export const PlatformRowNotAvoided = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="PlatformRow — Not Avoided">
    <PlatformRow item={notAvoidedPlatformRow} onAvoid={noop} />
  </CatalogSection>
));
PlatformRowNotAvoided.displayName = 'PlatformRowNotAvoided';

// ── Styles ─────────────────────────────────────────────────────────────────

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const AMBER = '#CC7A00';
const MONO = 'monospace' as const;

const styles = StyleSheet.create({
  container: { backgroundColor: WHITE },
  header: { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: '#CC0000' },
  title: { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  weekLabel: { fontFamily: MONO, fontSize: 13, color: '#CCC', marginTop: 2 },
  score: { fontFamily: MONO, fontSize: 13, color: AMBER, marginTop: 4 },
});
