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
import { theme } from '../../design/tokens';

interface ScorecardScreenProps {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  onSwitchTab?: (tab: string) => void;
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
export function ScorecardScreen({ adapter, entities, platforms, onSwitchTab }: ScorecardScreenProps) {
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
            color={theme.colors.dangerRed}
            accessibilityLabel={scorecardCopy.loadingLabel}
          />
        ) : data ? (
          <View style={styles.cardWrapper}>
            <ScorecardView ref={cardRef} data={data} onSwitchTab={onSwitchTab} />
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

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: theme.colors.bgVoid },
  scroll:            { paddingBottom: theme.space['4xl'] },
  topBar:            { backgroundColor: theme.colors.bgNav, padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  topBarTitle:       { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  dropTime:          { ...theme.type.caption, color: theme.colors.textSecondary, marginTop: theme.space.xs },
  cardWrapper:       { margin: theme.space.lg },
  cardLoader:        { marginTop: theme.space['4xl'] },
  actions:           { flexDirection: 'row', gap: theme.space.md, paddingHorizontal: theme.space.lg, marginTop: theme.space.sm },
  button:            { flex: 1, minHeight: theme.a11y.minTapTarget, backgroundColor: theme.colors.dangerRed, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  buttonSecondary:   { backgroundColor: theme.colors.bgVoid, borderColor: theme.colors.frameBlue },
  buttonText:        { ...theme.type.uiLabel, fontSize: 15, color: theme.colors.textPrimary, letterSpacing: 2 },
  buttonTextSecondary: { color: theme.colors.textPrimary },
});
