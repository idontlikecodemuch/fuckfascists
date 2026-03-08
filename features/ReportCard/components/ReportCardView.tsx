import React, { forwardRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { ReportCardData } from '../types';
import { PreviewStamp } from './PreviewStamp';
import { formatWeekRange, formatCount } from '../utils/formatters';

interface ReportCardViewProps {
  data: ReportCardData;
}

/**
 * The visual report card — rendered as a React Native View so it can be
 * captured by react-native-view-shot for sharing as an image.
 * Exposed via forwardRef so the parent can pass a ref for view capture.
 *
 * 8-bit design: dark header, pixel borders, monospace throughout, hard edges.
 */
export const ReportCardView = forwardRef<View, ReportCardViewProps>(
  ({ data }, ref) => {
    const { weekOf, entityAvoids, platformAvoids, totalEntityAvoids, isPreview } = data;

    return (
      <View ref={ref} style={styles.card}>
        {isPreview && <PreviewStamp />}

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title} allowFontScaling={false}>F*CK FASCISTS</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>WEEKLY REPORT</Text>
          <Text style={styles.weekRange} allowFontScaling={false}>
            {formatWeekRange(weekOf)}
          </Text>
        </View>

        {/* ── Score ── */}
        <View style={styles.scoreRow}>
          <ScoreTile value={totalEntityAvoids} label="BUSINESS\nAVOIDED" />
          <ScoreTile value={data.totalPlatformAvoids} label="PLATFORMS\nAVOIDED" />
        </View>

        {/* ── Business avoids ── */}
        {entityAvoids.length > 0 && (
          <Section title="BUSINESSES">
            {entityAvoids.slice(0, 5).map((e) => (
              <View key={e.entityId} style={styles.row}>
                <Text style={styles.rowName} numberOfLines={1} allowFontScaling={false}>
                  {e.name}
                </Text>
                <Text style={styles.rowCount} allowFontScaling={false}>
                  {formatCount(e.count)}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {/* ── Platform avoids ── */}
        {platformAvoids.length > 0 && (
          <Section title="PLATFORMS">
            <Text style={styles.platformList} allowFontScaling={false}>
              {platformAvoids.join(' · ')}
            </Text>
          </Section>
        )}

        {/* ── Empty state ── */}
        {totalEntityAvoids === 0 && platformAvoids.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText} allowFontScaling={false}>
              No avoidances recorded this week yet.{'\n'}
              Use the Map or Survey tab to get started.
            </Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText} allowFontScaling={false}>
            fuckfascists.org · DATA: FEC.GOV
          </Text>
        </View>
      </View>
    );
  }
);

ReportCardView.displayName = 'ReportCardView';

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreTile({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue} allowFontScaling={false}>{value}</Text>
      <Text style={styles.tileLabel} allowFontScaling={false}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} allowFontScaling={false}>{title}</Text>
      {children}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const BLACK  = '#1A1A1A';
const WHITE  = '#F5F5F0';
const RED    = '#CC0000';
const MONO   = 'monospace' as const;

const styles = StyleSheet.create({
  card:          { backgroundColor: WHITE, borderColor: BLACK, borderWidth: 4, overflow: 'hidden' },
  header:        { backgroundColor: BLACK, padding: 16, alignItems: 'center' },
  title:         { fontFamily: MONO, fontSize: 22, fontWeight: 'bold', color: RED, letterSpacing: 4 },
  subtitle:      { fontFamily: MONO, fontSize: 13, color: WHITE, letterSpacing: 6, marginTop: 2 },
  weekRange:     { fontFamily: MONO, fontSize: 11, color: '#AAA', marginTop: 6 },
  scoreRow:      { flexDirection: 'row', borderBottomWidth: 3, borderColor: BLACK },
  tile:          { flex: 1, padding: 16, alignItems: 'center', borderRightWidth: 1, borderColor: BLACK },
  tileValue:     { fontFamily: MONO, fontSize: 36, fontWeight: 'bold', color: RED },
  tileLabel:     { fontFamily: MONO, fontSize: 9, color: '#555', textAlign: 'center', marginTop: 2, letterSpacing: 1 },
  section:       { borderBottomWidth: 2, borderColor: BLACK, padding: 12 },
  sectionTitle:  { fontFamily: MONO, fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 8 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rowName:       { fontFamily: MONO, fontSize: 13, fontWeight: 'bold', color: BLACK, flex: 1 },
  rowCount:      { fontFamily: MONO, fontSize: 13, color: RED, marginLeft: 8 },
  platformList:  { fontFamily: MONO, fontSize: 12, color: BLACK, lineHeight: 20 },
  emptyState:    { padding: 24, alignItems: 'center' },
  emptyText:     { fontFamily: MONO, fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 20 },
  footer:        { backgroundColor: '#EEE', padding: 8, alignItems: 'center', borderTopWidth: 2, borderColor: BLACK },
  footerText:    { fontFamily: MONO, fontSize: 9, color: '#888', letterSpacing: 1 },
});
