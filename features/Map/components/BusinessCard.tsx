import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import type { ScanResult } from '../types';
import { AvoidButton } from './AvoidButton';
import type { Entity } from '../../../core/models';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles, getDisplayFigure, getParentEntity } from '../../../core/models';
import { SHOW_FIGURE_NAME_IN_CARD, CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
// Figure name is controlled by SHOW_FIGURE_NAME_IN_CARD (default: false).
// See CLAUDE.md §7 for the informational vs. confrontational screen split.

interface BusinessCardProps {
  result: ScanResult;
  onAvoid: () => Promise<void>;
  /** When true, the avoid button is disabled (e.g. entity not in curated list). */
  avoidDisabled?: boolean;
  onDismiss: () => void;
  /** Full entity list — enables parent attribution when an entity has a parentEntityId. */
  allEntities?: Entity[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: number }) {
  const isVerified = level === 1.0;
  const label = isVerified ? 'VERIFIED' : 'MATCHED';
  return (
    <View
      style={[styles.badge, isVerified ? styles.badgeVerified : styles.badgeMatched]}
      accessibilityLabel={`Confidence: ${label}`}
    >
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Pixel art–styled business card shown when a flagged entity is detected.
 *
 * Design rules enforced here:
 *  - Confidence label is ALWAYS visible (never hidden).
 *  - FEC attribution link is ALWAYS shown.
 *  - MEDIUM matches always show the "verify before acting" disclaimer.
 *  - Never claims more certainty than the data supports.
 *  - Recent cycle is visually prominent; historical totals are secondary.
 */
export function BusinessCard({ result, onAvoid, avoidDisabled = false, onDismiss, allEntities }: BusinessCardProps) {
  const { canonicalName, confidence, donationSummary, entity, fecFilingUrl } = result;

  // Prefer donationSummary's URL (has verified committee ID); fall back to ScanResult's fecFilingUrl.
  const fecUrl = donationSummary?.fecCommitteeUrl ?? fecFilingUrl;

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
          <>
            <Text style={styles.figureName} allowFontScaling>
              {getDisplayFigure(entity, allEntities)}
            </Text>
            {(() => {
              const parent = allEntities ? getParentEntity(entity, allEntities) : undefined;
              if (!parent) return null;
              return (
                <Text style={styles.parentAttribution} allowFontScaling>
                  via {parent.canonicalName}
                </Text>
              );
            })()}
          </>
        )}

        {confidence < CONFIDENCE_THRESHOLD_HIGH && (
          <Text style={styles.disclaimer} accessibilityRole="alert" allowFontScaling>
            ⚠ MEDIUM confidence — verify before acting.
          </Text>
        )}
      </View>

      {/* ── Donation data (null when API unavailable) ── */}
      {donationSummary ? (
        <>
          {/* ── Recent cycle (prominent, always shown) ── */}
          <View style={styles.recentSection}>
            <Text style={[styles.recentAmount, styles.recentGOP]} allowFontScaling>
              GOP {formatDonationAmount(donationSummary.recentRepubs)}
            </Text>
            <Text style={[styles.recentAmount, styles.recentDEM]} allowFontScaling>
              DEM {formatDonationAmount(donationSummary.recentDems)}
            </Text>
            <Text style={styles.recentCycleLabel} allowFontScaling>
              in {formatCycleLabel(donationSummary.recentCycle)}
            </Text>
          </View>

          {/* ── Since 2016 totals (contextual) ── */}
          <View style={styles.totalsSection}>
            <Text style={styles.totalsRow} allowFontScaling>
              Total since 2016:{'\u2002'}GOP {formatDonationAmount(donationSummary.totalRepubs)}{'\u00b7'}DEM {formatDonationAmount(donationSummary.totalDems)}
            </Text>
            {donationSummary.activeCycles.length > 0 && (
              <Text style={styles.totalsRow} allowFontScaling>
                Active cycles: {formatActiveCycles(donationSummary.activeCycles)}
              </Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.unavailableSection}>
          <Text style={styles.unavailableText} allowFontScaling>
            Donation data temporarily unavailable.
          </Text>
        </View>
      )}

      {/* ── FEC record link ── */}
      {fecUrl && (
        <Pressable
          onPress={() => Linking.openURL(fecUrl)}
          accessibilityRole="link"
          accessibilityLabel="See full FEC record on fec.gov"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={styles.fecLinkRow}
        >
          <Text style={styles.fecLink} allowFontScaling>
            See full FEC record →
          </Text>
        </Pressable>
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <AvoidButton onPress={onAvoid} disabled={avoidDisabled} />
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
const BLUE   = '#0044AA';
const MONO   = 'monospace' as const;

const styles = StyleSheet.create({
  card:           { backgroundColor: WHITE, borderColor: BLACK, borderWidth: 4, padding: 16, margin: 8 },
  header:         { marginBottom: 12 },
  titleRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name:           { flex: 1, fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: BLACK, marginRight: 8 },
  figureName:        { fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 2 },
  parentAttribution: { fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 1 },
  disclaimer:     { fontFamily: MONO, fontSize: 11, color: AMBER, marginTop: 4 },
  badge:          { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2 },
  badgeVerified:  { backgroundColor: '#2E7D32', borderColor: '#1B5E20' },
  badgeMatched:   { backgroundColor: AMBER, borderColor: '#7A4800' },
  badgeText:      { fontFamily: MONO, fontSize: 10, color: WHITE, fontWeight: 'bold' },

  // Recent cycle — visually prominent
  recentSection:     { borderTopWidth: 2, borderColor: BLACK, paddingTop: 10, marginBottom: 6 },
  recentAmount:      { fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: BLACK },
  recentGOP:         { color: RED },
  recentDEM:         { color: BLUE },
  recentCycleLabel:  { fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 2 },

  // Since 2016 totals — smaller, contextual
  totalsSection:  { marginBottom: 10 },
  totalsRow:      { fontFamily: MONO, fontSize: 12, color: BLACK, marginBottom: 2 },

  unavailableSection: { borderTopWidth: 2, borderColor: BLACK, paddingTop: 10, marginBottom: 10 },
  unavailableText:    { fontFamily: MONO, fontSize: 13, color: MUTED },

  fecLinkRow:     { marginBottom: 12 },
  fecLink:        { fontFamily: MONO, fontSize: 11, color: BLUE, textDecorationLine: 'underline' },

  actions:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dismissButton:  { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 3, borderColor: BLACK, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  dismissLabel:   { fontFamily: MONO, fontSize: 13, color: BLACK, fontWeight: 'bold' },
});
