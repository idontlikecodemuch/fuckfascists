import React, { useRef, useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView, Share, ActivityIndicator } from 'react-native';
import type { Entity } from '../../core/models';
import type { StorageAdapter } from '../../core/data';
import type { Platform } from '../Platforms/types';
import { useDropSchedule } from './hooks/useDropSchedule';
import { useScorecard } from './hooks/useScorecard';
import { ScorecardView } from './components/ScorecardView';
import { formatDropTime, formatWeekRange } from './utils/formatters';
import { scorecardCopy } from '../../copy/scorecard';

interface ScorecardScreenProps {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
}

/**
 * Scorecard screen — the weekly synchronized reveal.
 *
 * States:
 *  1. Loading drop schedule → spinner
 *  2. Drop has happened → show official card (no preview stamp)
 *  3. Drop is pending → show countdown + PREVIEW button
 *  4. User tapped PREVIEW → show card with PREVIEW stamp
 */
export function ScorecardScreen({ adapter, entities, platforms }: ScorecardScreenProps) {
  const cardRef = useRef<View>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Drop time is computed locally — always available, no loading state.
  const { schedule, hasDropped } = useDropSchedule();
  const isPreview = !hasDropped || showPreview;

  const { data, loading: cardLoading } = useScorecard(
    adapter,
    entities,
    platforms,
    schedule.weekOf,
    isPreview
  );

  const handleShare = useCallback(async () => {
    if (!data || data.persons.length === 0) return;

    // "I f*cked {Name} {N}× · {Name} {N}×"
    const personLines = data.persons
      .map((p) => `${p.figureName} ${scorecardCopy.personCount(p.totalCount)}`)
      .join(' \u00b7 ');

    const lines = [
      scorecardCopy.shareHeader,
      formatWeekRange(data.weekOf),
      '',
      personLines,
      '',
      scorecardCopy.tagline,
      scorecardCopy.cta,
    ];

    await Share.share({ message: lines.join('\n') });
  }, [data]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Header bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle} accessibilityRole="header" allowFontScaling>
            {scorecardCopy.title}
          </Text>
          {!hasDropped && (
            <Text style={styles.dropTime} allowFontScaling>
              {scorecardCopy.dropTime(formatDropTime(schedule.dropAt).toUpperCase())}
            </Text>
          )}
        </View>

        {/* ── Card ── */}
        {cardLoading ? (
          <ActivityIndicator
            style={styles.cardLoader}
            color="#CC0000"
            accessibilityLabel={scorecardCopy.loadingLabel}
          />
        ) : data ? (
          <View style={styles.cardWrapper}>
            <ScorecardView ref={cardRef} data={data} />
          </View>
        ) : null}

        {/* ── Actions ── */}
        <View style={styles.actions}>
          {data && data.persons.length > 0 && (
            <Pressable
              style={styles.button}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel={scorecardCopy.shareLabel}
            >
              <Text style={styles.buttonText} allowFontScaling>{scorecardCopy.shareBtn}</Text>
            </Pressable>
          )}

          {!hasDropped && !showPreview && (
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setShowPreview(true)}
              accessibilityRole="button"
              accessibilityLabel={scorecardCopy.previewLabel}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]} allowFontScaling>
                {scorecardCopy.previewBtn}
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
  container:         { flex: 1, backgroundColor: BLACK },
  scroll:            { paddingBottom: 40 },
  topBar:            { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: RED },
  topBarTitle:       { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  dropTime:          { fontFamily: MONO, fontSize: 11, color: '#AAA', marginTop: 4 },
  cardWrapper:       { margin: 16 },
  cardLoader:        { marginTop: 40 },
  actions:           { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  button:            { flex: 1, minHeight: 44, backgroundColor: RED, borderWidth: 3, borderColor: WHITE, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  buttonSecondary:   { backgroundColor: BLACK, borderColor: WHITE },
  buttonText:        { fontFamily: MONO, fontSize: 15, fontWeight: 'bold', color: WHITE, letterSpacing: 2 },
  buttonTextSecondary: { color: WHITE },
});
