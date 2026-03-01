import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import type { ScanResult } from '../types';
import { AvoidButton } from './AvoidButton';

interface BusinessCardProps {
  result: ScanResult;
  onAvoid: () => Promise<void>;
  onDismiss: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function StatRow({ label, value, red = false }: { label: string; value: string; red?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel} allowFontScaling>{label}</Text>
      <Text style={[styles.statValue, red && styles.statRed]} allowFontScaling>{value}</Text>
    </View>
  );
}

function ConfidenceBadge({ level }: { level: 'HIGH' | 'MEDIUM' }) {
  return (
    <View
      style={[styles.badge, level === 'HIGH' ? styles.badgeHigh : styles.badgeMedium]}
      accessibilityLabel={`Confidence: ${level}`}
    >
      <Text style={styles.badgeText}>{level}</Text>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Pixel art–styled business card shown when a flagged entity is detected.
 *
 * Design rules enforced here:
 *  - Confidence label is ALWAYS visible (never hidden).
 *  - OpenSecrets attribution link is ALWAYS shown (required by data terms).
 *  - MEDIUM matches always show the "verify before acting" disclaimer.
 *  - Never claims more certainty than the data supports.
 */
export function BusinessCard({ result, onAvoid, onDismiss }: BusinessCardProps) {
  const { canonicalName, confidence, donationSummary, entity } = result;

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={styles.name}
            numberOfLines={1}
            accessibilityRole="header"
            allowFontScaling
          >
            {canonicalName}
          </Text>
          <ConfidenceBadge level={confidence} />
        </View>

        {entity?.ceoName ? (
          <Text style={styles.ceo} allowFontScaling>CEO: {entity.ceoName}</Text>
        ) : null}

        {confidence === 'MEDIUM' && (
          <Text style={styles.disclaimer} accessibilityRole="alert" allowFontScaling>
            \u26a0 MEDIUM confidence \u2014 verify before acting.
          </Text>
        )}
      </View>

      {/* ── Donation data ── */}
      <View style={styles.stats}>
        <StatRow label="TOTAL DONATIONS"  value={formatUSD(donationSummary.total)} />
        <StatRow label="REPUBLICANS"      value={formatUSD(donationSummary.repubs)} red />
        <StatRow label="DEMOCRATS"        value={formatUSD(donationSummary.dems)} />
        <StatRow label="LOBBYING"         value={formatUSD(donationSummary.lobbying)} />
        <Text style={styles.cycle} allowFontScaling>
          Election cycle: {donationSummary.cycle}
        </Text>
      </View>

      {/* ── Attribution — required by OpenSecrets data terms ── */}
      <Pressable
        onPress={() => Linking.openURL(donationSummary.sourceUrl)}
        accessibilityRole="link"
        accessibilityLabel="View source data on OpenSecrets"
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text style={styles.source} allowFontScaling>
          SOURCE: OPENSECRETS.ORG \u2197
        </Text>
      </Pressable>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <AvoidButton onPress={onAvoid} />
        <Pressable
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissLabel} allowFontScaling>DISMISS</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const BLACK  = '#1A1A1A';
const WHITE  = '#F5F5F0';
const MONO   = 'monospace' as const;

const styles = StyleSheet.create({
  card:        { backgroundColor: WHITE, borderColor: BLACK, borderWidth: 4, padding: 16, margin: 8 },
  header:      { marginBottom: 10 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name:        { flex: 1, fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: BLACK, marginRight: 8 },
  ceo:         { fontFamily: MONO, fontSize: 11, color: '#555', marginBottom: 2 },
  disclaimer:  { fontFamily: MONO, fontSize: 11, color: '#CC7A00', marginTop: 4 },
  badge:       { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2 },
  badgeHigh:   { backgroundColor: '#CC0000', borderColor: '#7A0000' },
  badgeMedium: { backgroundColor: '#CC7A00', borderColor: '#7A4800' },
  badgeText:   { fontFamily: MONO, fontSize: 10, color: WHITE, fontWeight: 'bold' },
  stats:       { borderTopWidth: 2, borderColor: BLACK, paddingTop: 10, marginBottom: 10 },
  statRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statLabel:   { fontFamily: MONO, fontSize: 11, color: '#555' },
  statValue:   { fontFamily: MONO, fontSize: 12, fontWeight: 'bold', color: BLACK },
  statRed:     { color: '#CC0000' },
  cycle:       { fontFamily: MONO, fontSize: 10, color: '#888', marginTop: 4 },
  source:      { fontFamily: MONO, fontSize: 11, color: '#0066CC', textDecorationLine: 'underline', marginBottom: 12 },
  actions:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dismissButton:  { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 3, borderColor: BLACK, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  dismissLabel:   { fontFamily: MONO, fontSize: 13, color: BLACK, fontWeight: 'bold' },
});
