import React, { useRef, useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView, Share, ActivityIndicator } from 'react-native';
import type { Entity } from '../../core/models';
import type { StorageAdapter } from '../../core/data';
import type { Platform } from '../Survey/types';
import { useDropSchedule } from './hooks/useDropSchedule';
import { useReportCard } from './hooks/useReportCard';
import { ReportCardView } from './components/ReportCardView';
import { formatDropTime, formatWeekRange } from './utils/formatters';

interface ReportCardScreenProps {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
}

/**
 * Report Card screen — the weekly synchronized reveal.
 *
 * States:
 *  1. Loading drop schedule → spinner
 *  2. Drop has happened → show official card (no preview stamp)
 *  3. Drop is pending → show countdown + PREVIEW button
 *  4. User tapped PREVIEW → show card with PREVIEW stamp
 */
export function ReportCardScreen({ adapter, entities, platforms }: ReportCardScreenProps) {
  const cardRef = useRef<View>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Drop time is computed locally — always available, no loading state.
  const { schedule, hasDropped } = useDropSchedule();
  const isPreview = !hasDropped || showPreview;

  const { data, loading: cardLoading } = useReportCard(
    adapter,
    entities,
    platforms,
    schedule.weekOf,
    isPreview
  );

  const handleShare = useCallback(async () => {
    if (!data) return;
    const lines = [
      `F*CK FASCISTS — Weekly Report`,
      `${formatWeekRange(data.weekOf)}`,
      ``,
      `${data.totalEntityAvoids} business avoidances`,
      `${data.totalPlatformAvoids} platforms avoided`,
      data.entityAvoids.length > 0
        ? `Top: ${data.entityAvoids.slice(0, 3).map((e) => e.name).join(', ')}`
        : '',
      ``,
      `fuckfascists.org`,
    ].filter(Boolean);

    await Share.share({ message: lines.join('\n') });
  }, [data]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Header bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle} accessibilityRole="header" allowFontScaling>
            REPORT CARD
          </Text>
          {!hasDropped && (
            <Text style={styles.dropTime} allowFontScaling>
              DROPS {formatDropTime(schedule.dropAt).toUpperCase()}
            </Text>
          )}
        </View>

        {/* ── Card ── */}
        {cardLoading ? (
          <ActivityIndicator style={styles.cardLoader} color="#CC0000" />
        ) : data ? (
          <View style={styles.cardWrapper}>
            <ReportCardView ref={cardRef} data={data} />
          </View>
        ) : null}

        {/* ── Actions ── */}
        <View style={styles.actions}>
          {data && (
            <Pressable
              style={styles.button}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share your report card"
            >
              <Text style={styles.buttonText} allowFontScaling>SHARE</Text>
            </Pressable>
          )}

          {!hasDropped && !showPreview && (
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setShowPreview(true)}
              accessibilityRole="button"
              accessibilityLabel="Preview your report card early"
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]} allowFontScaling>
                PREVIEW
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: WHITE },
  scroll:            { paddingBottom: 40 },
  topBar:            { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: RED },
  topBarTitle:       { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  dropTime:          { fontFamily: MONO, fontSize: 11, color: '#AAA', marginTop: 4 },
  cardWrapper:       { margin: 16 },
  cardLoader:        { marginTop: 40 },
  actions:           { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  button:            { flex: 1, minHeight: 44, backgroundColor: RED, borderWidth: 3, borderColor: BLACK, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  buttonSecondary:   { backgroundColor: WHITE, borderColor: BLACK },
  buttonText:        { fontFamily: MONO, fontSize: 15, fontWeight: 'bold', color: WHITE, letterSpacing: 2 },
  buttonTextSecondary: { color: BLACK },
});
