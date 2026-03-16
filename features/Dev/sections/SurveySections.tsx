/**
 * Platform avoidance component catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { PlatformRow } from '../../Platforms/components/PlatformRow';
import { platformsCopy } from '../../../copy/platforms';
import {
  partialPlatformItems,
  fullPlatformItems,
  emptyPlatformItems,
  avoidedPlatformRow,
  notAvoidedPlatformRow,
} from '../catalogMocks';
import type { PlatformItem } from '../../Platforms/types';

const noop = async () => {};

// Static platform list — uses .map() instead of FlatList to avoid
// VirtualizedList-inside-ScrollView nesting warning.
function PlatformList({ items }: { items: PlatformItem[] }) {
  const totalAvoids = items.reduce((sum, i) => sum + i.weeklyCount, 0);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{platformsCopy.title}</Text>
        <Text style={styles.weekLabel}>Week of Mar 10</Text>
        <Text style={styles.score}>{platformsCopy.score(totalAvoids)}</Text>
      </View>
      {items.map((item) => (
        <PlatformRow key={item.platform.id} item={item} onAvoid={noop} />
      ))}
    </View>
  );
}

// ── Platform full-screen variants ────────────────────────────────────────

export const SurveyPartial = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Platforms — Partial (3/6 active)">
    <PlatformList items={partialPlatformItems} />
  </CatalogSection>
));
SurveyPartial.displayName = 'SurveyPartial';

export const SurveyFull = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Platforms — All Active">
    <PlatformList items={fullPlatformItems} />
  </CatalogSection>
));
SurveyFull.displayName = 'SurveyFull';

export const SurveyEmpty = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Platforms — Empty">
    <PlatformList items={emptyPlatformItems} />
  </CatalogSection>
));
SurveyEmpty.displayName = 'SurveyEmpty';

// ── Individual PlatformRow variants ────────────────────────────────────────

export const PlatformRowAvoided = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="PlatformRow — Avoided (×5)">
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
