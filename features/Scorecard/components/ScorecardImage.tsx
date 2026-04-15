import React, { forwardRef } from 'react';
import { Image, PixelRatio, StyleSheet, Text, View } from 'react-native';
import type { ScorecardViewData } from '../types';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { formatWeekRange } from '../utils/formatters';
import { scorecardBg, scorecardFrame } from '../../../core/scorecard/scorecardAssets';
import { CardPersonRow } from './CardPersonRow';
import { PowerMeter } from './PowerMeter';
import {
  SCORECARD_IMAGE_WIDTH,
  SCORECARD_IMAGE_HEIGHT,
  SCORECARD_CONTENT_ZONE,
} from '../../../config/constants';

const TOP_N = 3;
const pr = PixelRatio.get();
const scale = (px: number) => px / pr;
const VIEW_WIDTH = SCORECARD_IMAGE_WIDTH / pr;
const VIEW_HEIGHT = SCORECARD_IMAGE_HEIGHT / pr;
const SPARKLE = '\u2726'; // ✦
const SPARKLE_SM = '\u2727'; // ✧

interface ScorecardImageProps {
  data: ScorecardViewData;
}

/**
 * The rendered shareable card — 1080×1920 fixed layout.
 *
 * Designed for react-native-view-shot capture ONLY.
 * collapsable={false} on all Views for Android capture.
 * allowFontScaling={false} for bitmap fidelity.
 */
export const ScorecardImage = forwardRef<View, ScorecardImageProps>(
  ({ data }, ref) => {
    const { weekOf, persons, grandTotal, powerTier } = data;
    const visiblePersons = persons.slice(0, TOP_N);
    const overflowCount = Math.max(0, persons.length - TOP_N);
    const dateRange = formatWeekRange(weekOf);

    return (
      <View ref={ref} style={styles.canvas} collapsable={false}>
        {/* Layer 1: Starfield background */}
        <Image source={scorecardBg} style={styles.bgImage} resizeMode="cover" />

        {/* Layer 2: Gold frame overlay */}
        <Image source={scorecardFrame} style={styles.frameImage} resizeMode="stretch" />

        {/* Layer 3: Power meter (left edge) */}
        {powerTier && (
          <PowerMeter tier={powerTier} height={VIEW_HEIGHT - scale(80)} />
        )}

        {/* Layer 4+: Content */}
        <View style={styles.content} collapsable={false}>
          {/* Header with logo */}
          <View style={styles.header} collapsable={false}>
            <Image
              source={require('../../../assets/pixel/brand/FF_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle} allowFontScaling={false}>
              {scorecardCopy.title}
            </Text>
            <Text style={styles.dateText} allowFontScaling={false}>
              {'\u2014 '}{dateRange}{' \u2014'}
            </Text>
          </View>

          {/* "I FCKd" bookend */}
          <View style={styles.bookendRow} collapsable={false}>
            <Text style={styles.bookendBungee} allowFontScaling={false}>
              I FCK
            </Text>
            <Text style={styles.bookendPlex} allowFontScaling={false}>
              d
            </Text>
          </View>

          {/* Count grid zone */}
          <View style={styles.gridZone} collapsable={false}>
            {visiblePersons.map((person, i) => (
              <CardPersonRow
                key={person.figureName}
                person={person}
                isLast={i === visiblePersons.length - 1 && overflowCount === 0}
              />
            ))}
            {overflowCount > 0 && (
              <Text style={styles.overflow} allowFontScaling={false}>
                {scorecardCopy.othersLine(overflowCount)}
              </Text>
            )}
          </View>

          {/* "N× this week" bookend */}
          <View style={styles.closingRow} collapsable={false}>
            <Text style={styles.closingCount} allowFontScaling={false}>
              {grandTotal}{'\u00d7'}
            </Text>
            <Text style={styles.closingText} allowFontScaling={false}>
              {' this week'}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer} collapsable={false}>
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

        {/* Sparkle decorations */}
        <Text style={[styles.sparkle, styles.sparkle1]}>{SPARKLE}</Text>
        <Text style={[styles.sparkle, styles.sparkle2]}>{SPARKLE_SM}</Text>
        <Text style={[styles.sparkle, styles.sparkle3]}>{SPARKLE}</Text>
        <Text style={[styles.sparkle, styles.sparkle4]}>{SPARKLE_SM}</Text>
        <Text style={[styles.sparkle, styles.sparkle5]}>{SPARKLE}</Text>
      </View>
    );
  },
);

ScorecardImage.displayName = 'ScorecardImage';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  canvas: {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: '#0A0B0C',
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
  },
  frameImage: {
    ...StyleSheet.absoluteFillObject,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
  },
  content: {
    flex: 1,
    paddingTop: scale(SCORECARD_CONTENT_ZONE.top + 20),
    paddingLeft: scale(SCORECARD_CONTENT_ZONE.left),
    paddingRight: scale(SCORECARD_CONTENT_ZONE.right),
    paddingBottom: scale(SCORECARD_CONTENT_ZONE.bottom),
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center', gap: scale(8) },
  logo: { width: scale(180), height: scale(100) },
  subtitle: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(26),
    color: theme.colors.textPrimary,
    letterSpacing: scale(6),
  },
  dateText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: scale(22),
    color: '#667788',
    letterSpacing: scale(2),
  },
  bookendRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: scale(20) },
  bookendBungee: { fontFamily: theme.fonts.headline, fontSize: scale(56), color: '#E8E0D0' },
  bookendPlex: { fontFamily: theme.fonts.bodySemiBold, fontSize: scale(56), color: '#E8E0D0' },
  gridZone: {
    backgroundColor: 'rgba(10, 16, 28, 0.5)',
    borderWidth: 2,
    borderColor: '#2A2D30',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
  },
  overflow: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(32),
    color: theme.colors.textSecondary,
    paddingTop: scale(8),
  },
  closingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    marginTop: scale(16),
  },
  closingCount: { fontFamily: theme.fonts.headline, fontSize: scale(56), color: theme.colors.rewardYellow },
  closingText: { fontFamily: theme.fonts.headline, fontSize: scale(56), color: '#E8E0D0' },
  footer: { alignItems: 'center', gap: scale(8) },
  tagline: {
    fontFamily: theme.fonts.bodySemiBold, fontSize: scale(28),
    color: theme.colors.textSecondary, textAlign: 'center',
  },
  cta: {
    fontFamily: theme.fonts.headline, fontSize: scale(44),
    color: theme.colors.glowCyan, letterSpacing: scale(2),
  },
  attribution: {
    fontFamily: theme.fonts.bodySemiBold, fontSize: scale(20),
    color: '#667788', letterSpacing: scale(2),
  },
  // Sparkles
  sparkle: {
    position: 'absolute',
    fontSize: scale(18),
    color: theme.colors.rewardYellow,
  },
  sparkle1: { top: scale(160), right: scale(80) },
  sparkle2: { top: scale(400), left: scale(70) },
  sparkle3: { bottom: scale(300), right: scale(60) },
  sparkle4: { bottom: scale(180), left: scale(90) },
  sparkle5: { top: scale(600), right: scale(45) },
});
