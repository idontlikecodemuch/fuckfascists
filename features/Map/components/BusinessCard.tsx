import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import type { ScanResult } from '../types';
import { AvoidButton } from './AvoidButton';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles, getDisplayFigure } from '../../../core/models';
import { SHOW_FIGURE_NAME_IN_CARD } from '../../../config/constants';
// Figure name is controlled by SHOW_FIGURE_NAME_IN_CARD (default: false).
// See CLAUDE.md §7 for the informational vs. confrontational screen split.

interface BusinessCardProps {
  result: ScanResult;
  onAvoid: () => Promise<void>;
  onDismiss: () => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
 *  - Recent cycle is visually prominent; historical totals are secondary.
 */
export function BusinessCard({ result, onAvoid, onDismiss }: BusinessCardProps) {
  const { canonicalName, confidence, donationSummary, entity } = result;
  const {
    recentCycle, recentRepubs, recentDems,
    totalRepubs, totalDems,
    activeCycles, fecCommitteeUrl,
  } = donationSummary;

  const hasRecentRepubs = recentRepubs > 0;
  const hasRecentDems   = recentDems > 0;
  const showRecentSection = hasRecentRepubs || hasRecentDems;

  const recentLabel = hasRecentRepubs
    ? `${formatDonationAmount(recentRepubs)} to Republicans`
    : `${formatDonationAmount(recentDems)} to Democrats`;

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

        {SHOW_FIGURE_NAME_IN_CARD && entity && (
          <Text style={styles.figureName} allowFontScaling>
            {getDisplayFigure(entity)}
          </Text>
        )}

        {confidence === 'MEDIUM' && (
          <Text style={styles.disclaimer} accessibilityRole="alert" allowFontScaling>
            \u26a0 MEDIUM confidence \u2014 verify before acting.
          </Text>
        )}
      </View>

      {/* ── Recent cycle (prominent) ── */}
      {showRecentSection && (
        <View style={styles.recentSection}>
          <Text style={styles.recentAmount} allowFontScaling>
            {recentLabel}
          </Text>
          <Text style={styles.recentCycleLabel} allowFontScaling>
            in {formatCycleLabel(recentCycle)}
          </Text>
        </View>
      )}

      {/* ── Since 2016 totals (contextual) ── */}
      <View style={styles.totalsSection}>
        <Text style={styles.totalsRow} allowFontScaling>
          Total since 2016:{'\u2002'}GOP {formatDonationAmount(totalRepubs)}{'\u00b7'}DEM {formatDonationAmount(totalDems)}
        </Text>
        {activeCycles.length > 0 && (
          <Text style={styles.totalsRow} allowFontScaling>
            Active cycles: {formatActiveCycles(activeCycles)}
          </Text>
        )}
      </View>

      {/* ── FEC record link ── */}
      <Pressable
        onPress={() => Linking.openURL(fecCommitteeUrl)}
        accessibilityRole="link"
        accessibilityLabel="See full FEC record on fec.gov"
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        style={styles.fecLinkRow}
      >
        <Text style={styles.fecLink} allowFontScaling>
          See full FEC record \u2192
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
const RED    = '#CC0000';
const MUTED  = '#888888';
const AMBER  = '#CC7A00';
const BLUE   = '#0066CC';
const MONO   = 'monospace' as const;

const styles = StyleSheet.create({
  card:           { backgroundColor: WHITE, borderColor: BLACK, borderWidth: 4, padding: 16, margin: 8 },
  header:         { marginBottom: 12 },
  titleRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name:           { flex: 1, fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: BLACK, marginRight: 8 },
  figureName:     { fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 2 },
  disclaimer:     { fontFamily: MONO, fontSize: 11, color: AMBER, marginTop: 4 },
  badge:          { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2 },
  badgeHigh:      { backgroundColor: RED, borderColor: '#7A0000' },
  badgeMedium:    { backgroundColor: AMBER, borderColor: '#7A4800' },
  badgeText:      { fontFamily: MONO, fontSize: 10, color: WHITE, fontWeight: 'bold' },

  // Recent cycle — visually prominent
  recentSection:     { borderTopWidth: 2, borderColor: BLACK, paddingTop: 10, marginBottom: 6 },
  recentAmount:      { fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: RED },
  recentCycleLabel:  { fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 2 },

  // Since 2016 totals — smaller, contextual
  totalsSection:  { marginBottom: 10 },
  totalsRow:      { fontFamily: MONO, fontSize: 12, color: BLACK, marginBottom: 2 },

  fecLinkRow:     { marginBottom: 12 },
  fecLink:        { fontFamily: MONO, fontSize: 11, color: BLUE, textDecorationLine: 'underline' },

  actions:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dismissButton:  { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 3, borderColor: BLACK, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  dismissLabel:   { fontFamily: MONO, fontSize: 13, color: BLACK, fontWeight: 'bold' },
});
