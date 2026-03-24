import React, { forwardRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ScorecardViewData } from '../types';
import type { ScorecardPerson, ScorecardSource } from '../data/aggregateScorecard';
import { PreviewStamp } from './PreviewStamp';
import { formatWeekRange } from '../utils/formatters';
import { scorecardCopy } from '../../../copy/scorecard';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';

interface ScorecardViewProps {
  data: ScorecardViewData;
  onSwitchTab?: (tab: string) => void;
}

// Heavy layout threshold: 4+ total avoids AND 3+ distinct people
const HEAVY_TOTAL_THRESHOLD = 4;
const HEAVY_PERSON_THRESHOLD = 3;
const TOP_N = 3;

/**
 * The visual scorecard — CEO-centric, confrontational.
 *
 * Two layout variants:
 *  - Heavy: big total, top 3 persons, "+ N others" overflow
 *  - Light: all persons, no total count
 *  - Empty: motivational copy
 *
 * Rendered as a React Native View for react-native-view-shot capture.
 * Exposed via forwardRef so the parent can pass a ref for view capture.
 *
 * allowFontScaling={false} is used throughout this component because the
 * scorecard is captured as a bitmap for sharing via react-native-view-shot.
 * Dynamic Type scaling would break the fixed layout of the captured image,
 * producing clipped or overflowing text in the shared output. The scorecard
 * is a short-lived summary screen, not a reading-heavy surface — the
 * trade-off is acceptable for V1.
 */
export const ScorecardView = forwardRef<View, ScorecardViewProps>(
  ({ data, onSwitchTab }, ref) => {
    const { weekOf, persons, grandTotal, isPreview } = data;
    const isEmpty = persons.length === 0;
    const isHeavy = grandTotal >= HEAVY_TOTAL_THRESHOLD && persons.length >= HEAVY_PERSON_THRESHOLD;

    const visiblePersons = isHeavy ? persons.slice(0, TOP_N) : persons;
    const overflowCount = isHeavy ? persons.length - TOP_N : 0;

    return (
      <View ref={ref} style={styles.card}>
        {isPreview && <PreviewStamp />}

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.appName} allowFontScaling={false}>
            {sharedCopy.appName}
          </Text>
          <Text style={styles.title} allowFontScaling={false}>
            {scorecardCopy.title}
          </Text>
          <Text style={styles.weekRange} allowFontScaling={false}>
            {scorecardCopy.dateRange(formatWeekRange(weekOf))}
          </Text>
        </View>

        {/* ── Empty state ──
         * A11y note: inline <Text onPress> links are below the 44pt minimum tap
         * target. This is an intentional exception — the empty state is a
         * one-time motivational moment read as a sentence, and wrapping each
         * word in a full-size Pressable would break the reading flow. The
         * links are also reachable via VoiceOver swipe-through navigation. */}
        {isEmpty && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText} allowFontScaling={false}>
              {scorecardCopy.emptyBefore}
              <Text
                style={styles.emptyLink}
                onPress={onSwitchTab ? () => onSwitchTab('map') : undefined}
                accessibilityRole={onSwitchTab ? 'link' : undefined}
              >
                {scorecardCopy.emptyMap}
              </Text>
              {scorecardCopy.emptyMiddle}
              <Text
                style={styles.emptyLink}
                onPress={onSwitchTab ? () => onSwitchTab('platforms') : undefined}
                accessibilityRole={onSwitchTab ? 'link' : undefined}
              >
                {scorecardCopy.emptyTrack}
              </Text>
              {scorecardCopy.emptyAfter}
            </Text>
          </View>
        )}

        {/* ── Score body ── */}
        {!isEmpty && (
          <View style={styles.body}>
            {/* Big total (heavy users only) */}
            {isHeavy && (
              <View style={styles.bigTotalRow}>
                <Text style={styles.bigTotal} allowFontScaling={false}>
                  {scorecardCopy.totalCount(grandTotal)}
                </Text>
              </View>
            )}

            {/* Framing line */}
            <View style={styles.framingRow}>
              <Text style={styles.framingText} allowFontScaling={false}>
                {scorecardCopy.framingLine}
              </Text>
            </View>

            {/* Person rows */}
            {visiblePersons.map((person, index) => (
              <PersonRow key={person.figureName} person={person} isTop={index === 0} />
            ))}

            {/* Overflow */}
            {overflowCount > 0 && (
              <View style={styles.overflowRow}>
                <Text style={styles.overflowText} allowFontScaling={false}>
                  {scorecardCopy.othersLine(overflowCount)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.tagline} allowFontScaling={false}>
            {scorecardCopy.tagline}
          </Text>
          <Text style={styles.cta} allowFontScaling={false}>
            {scorecardCopy.cta}
          </Text>
          <Text style={styles.attribution} allowFontScaling={false}>
            {scorecardCopy.dataAttribution}
          </Text>
        </View>
      </View>
    );
  },
);

ScorecardView.displayName = 'ScorecardView';

// ── Sub-components ────────────────────────────────────────────────────────────

function PersonRow({ person, isTop = false }: { person: ScorecardPerson; isTop?: boolean }) {
  const lastName = extractLastName(person.figureName);
  const spriteId = nameToSpriteId(person.figureName);
  const sourceText = person.sources
    .map((s) => formatSource(s))
    .join(' \u00b7 '); // middle dot separator

  return (
    <View style={[styles.personRow, isTop && styles.personRowTop]}>
      <View style={styles.personContent}>
        <SpriteView spriteId={spriteId} state="defeated" size={44} />
        <View style={styles.personText}>
          <View style={styles.personHeader}>
            <Text style={styles.personName} numberOfLines={1} allowFontScaling={false}>
              {lastName}
            </Text>
            <Text style={styles.personCount} allowFontScaling={false}>
              {scorecardCopy.personCount(person.totalCount)}
            </Text>
          </View>
          <Text style={styles.personSources} numberOfLines={2} allowFontScaling={false}>
            {sourceText}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extracts the last name from a full name for prominent display. */
function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

/** Formats a source using the verb-specific copy functions. */
function formatSource(source: ScorecardSource): string {
  switch (source.verb) {
    case 'stayed off':  return scorecardCopy.sourceStayedOff(source.name, source.count);
    case 'skipped':     return scorecardCopy.sourceSkipped(source.name, source.count);
    case 'walked past': return scorecardCopy.sourceWalkedPast(source.name, source.count);
    default:            return scorecardCopy.sourceAvoided(source.name, source.count);
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card:           { backgroundColor: theme.colors.surface1, borderColor: theme.colors.frameBlue, borderWidth: theme.borders.hero.width },
  // Header
  header:         { padding: theme.space.lg, alignItems: 'center', borderBottomWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue },
  appName:        { ...theme.type.displayM, color: theme.colors.dangerRed, letterSpacing: 4 },
  title:          { ...theme.type.caption, color: theme.colors.textPrimary, letterSpacing: 6, marginTop: 2 },
  weekRange:      { ...theme.type.caption, fontSize: 10, color: theme.colors.textSecondary, marginTop: 6, letterSpacing: 1 },
  // Empty state
  emptyState:     { padding: theme.space['3xl'], alignItems: 'center' },
  emptyText:      { ...theme.type.bodyS, fontSize: 13, color: theme.colors.dangerRed, textAlign: 'center', lineHeight: 22, fontWeight: 'bold' },
  emptyLink:      { color: theme.colors.rewardYellow, textDecorationLine: 'underline' },
  // Body
  body:           { padding: theme.space.lg },
  bigTotalRow:    { alignItems: 'center', marginBottom: theme.space.xs },
  bigTotal:       { fontFamily: theme.fonts.headline, fontSize: 48, color: theme.colors.rewardYellow },
  framingRow:     { marginBottom: theme.space.md },
  framingText:    { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 2 },
  // Person row
  personRow:      { marginBottom: theme.space.md, borderLeftWidth: theme.borders.standard.width, borderColor: theme.colors.rewardYellow, paddingLeft: 10 },
  personRowTop:   { borderLeftWidth: theme.borders.hero.width, borderColor: theme.colors.rewardYellow },
  personContent:  { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  personText:     { flex: 1 },
  personHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  personName:     { ...theme.type.displayS, color: theme.colors.textPrimary, flex: 1, textTransform: 'uppercase', letterSpacing: 1 },
  personCount:    { ...theme.type.displayS, color: theme.colors.rewardYellow, marginLeft: theme.space.sm },
  personSources:  { ...theme.type.caption, fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, letterSpacing: 0.5 },
  // Overflow
  overflowRow:    { marginTop: theme.space.xs, paddingLeft: 10 },
  overflowText:   { ...theme.type.bodyS, color: theme.colors.rewardYellow, fontWeight: 'bold' },
  // Footer
  footer:         { borderTopWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, padding: theme.space.md, alignItems: 'center' },
  tagline:        { ...theme.type.caption, fontSize: 10, color: theme.colors.textSecondary, textAlign: 'center', letterSpacing: 1 },
  cta:            { ...theme.type.caption, fontSize: 9, color: theme.colors.rewardYellow, marginTop: theme.space.xs, letterSpacing: 1 },
  attribution:    { ...theme.type.caption, fontSize: 8, color: theme.colors.textSecondary, marginTop: theme.space.xs, letterSpacing: 2 },
});
