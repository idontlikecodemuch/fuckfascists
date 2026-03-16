import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ScorecardViewData } from '../types';
import type { ScorecardPerson, ScorecardSource } from '../data/aggregateScorecard';
import { PreviewStamp } from './PreviewStamp';
import { formatWeekRange } from '../utils/formatters';
import { scorecardCopy } from '../../../copy/scorecard';
import { sharedCopy } from '../../../copy/shared';

interface ScorecardViewProps {
  data: ScorecardViewData;
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
 */
export const ScorecardView = forwardRef<View, ScorecardViewProps>(
  ({ data }, ref) => {
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

        {/* ── Empty state ── */}
        {isEmpty && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText} allowFontScaling={false}>
              {scorecardCopy.emptyState}
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
            {visiblePersons.map((person) => (
              <PersonRow key={person.figureName} person={person} />
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

function PersonRow({ person }: { person: ScorecardPerson }) {
  const lastName = extractLastName(person.figureName);
  const sourceText = person.sources
    .map((s) => formatSource(s))
    .join(' \u00b7 '); // middle dot separator

  return (
    <View style={styles.personRow}>
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

const BLACK  = '#1A1A1A';
const WHITE  = '#F5F5F0';
const RED    = '#CC0000';
const AMBER  = '#CC7A00';
const MONO   = 'monospace' as const;

const styles = StyleSheet.create({
  card:           { backgroundColor: BLACK, borderColor: RED, borderWidth: 4 },
  // Header
  header:         { padding: 16, alignItems: 'center', borderBottomWidth: 3, borderColor: RED },
  appName:        { fontFamily: MONO, fontSize: 22, fontWeight: 'bold', color: RED, letterSpacing: 4 },
  title:          { fontFamily: MONO, fontSize: 11, color: WHITE, letterSpacing: 6, marginTop: 2 },
  weekRange:      { fontFamily: MONO, fontSize: 10, color: '#777', marginTop: 6, letterSpacing: 1 },
  // Empty state
  emptyState:     { padding: 32, alignItems: 'center' },
  emptyText:      { fontFamily: MONO, fontSize: 13, color: RED, textAlign: 'center', lineHeight: 22, fontWeight: 'bold' },
  // Body
  body:           { padding: 16 },
  bigTotalRow:    { alignItems: 'center', marginBottom: 4 },
  bigTotal:       { fontFamily: MONO, fontSize: 48, fontWeight: 'bold', color: RED },
  framingRow:     { marginBottom: 12 },
  framingText:    { fontFamily: MONO, fontSize: 16, color: WHITE, fontWeight: 'bold', letterSpacing: 2 },
  // Person row
  personRow:      { marginBottom: 12, borderLeftWidth: 3, borderColor: RED, paddingLeft: 10 },
  personHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  personName:     { fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: WHITE, flex: 1, textTransform: 'uppercase', letterSpacing: 1 },
  personCount:    { fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: RED, marginLeft: 8 },
  personSources:  { fontFamily: MONO, fontSize: 10, color: '#999', marginTop: 2, letterSpacing: 0.5 },
  // Overflow
  overflowRow:    { marginTop: 4, paddingLeft: 10 },
  overflowText:   { fontFamily: MONO, fontSize: 12, color: AMBER, fontWeight: 'bold' },
  // Footer
  footer:         { borderTopWidth: 3, borderColor: RED, padding: 12, alignItems: 'center' },
  tagline:        { fontFamily: MONO, fontSize: 10, color: '#999', textAlign: 'center', letterSpacing: 1 },
  cta:            { fontFamily: MONO, fontSize: 9, color: AMBER, marginTop: 4, letterSpacing: 1 },
  attribution:    { fontFamily: MONO, fontSize: 8, color: '#555', marginTop: 4, letterSpacing: 2 },
});
