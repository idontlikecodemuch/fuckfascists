import React, { forwardRef } from 'react';
import { Image, PixelRatio, StyleSheet, Text, View } from 'react-native';
import type { ScorecardViewData } from '../types';
import type { ScorecardPerson } from '../data/aggregateScorecard';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { formatWeekRange } from '../utils/formatters';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import {
  SCORECARD_IMAGE_WIDTH,
  SCORECARD_IMAGE_HEIGHT,
  SCORECARD_CONTENT_ZONE,
} from '../../../config/constants';

const TOP_N = 3;
const SPRITE_SIZE = 120;
const pr = PixelRatio.get();

// The RN view is sized in points — view-shot captures at native resolution.
const VIEW_WIDTH = SCORECARD_IMAGE_WIDTH / pr;
const VIEW_HEIGHT = SCORECARD_IMAGE_HEIGHT / pr;

interface ScorecardImageProps {
  data: ScorecardViewData;
}

/**
 * The rendered shareable card — 1080×1920 fixed layout.
 *
 * This component is designed for react-native-view-shot capture ONLY.
 * It is NOT interactive, NOT scrollable, NOT user-facing during rendering.
 * collapsable={false} on all Views to prevent Android from collapsing empty parents.
 * allowFontScaling={false} throughout for bitmap fidelity.
 */
export const ScorecardImage = forwardRef<View, ScorecardImageProps>(
  ({ data }, ref) => {
    const { weekOf, persons, grandTotal } = data;
    const visiblePersons = persons.slice(0, TOP_N);
    const overflowCount = Math.max(0, persons.length - TOP_N);
    const dateRange = formatWeekRange(weekOf);

    return (
      <View ref={ref} style={styles.canvas} collapsable={false}>
        {/* Layer 1: Background */}
        <View style={styles.bgLayer} collapsable={false}>
          <View style={styles.bgFill} collapsable={false} />
        </View>

        {/* Layer 2: Content */}
        <View style={styles.content} collapsable={false}>
          {/* Header */}
          <View style={styles.header} collapsable={false}>
            <Text style={styles.brandTitle} allowFontScaling={false}>
              FCK FASCISTS
            </Text>
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
                isFirst={i === 0}
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
      </View>
    );
  },
);

ScorecardImage.displayName = 'ScorecardImage';

// ── Person row for rendered card ──────────────────────────────────────────────

function CardPersonRow({ person, isFirst, isLast }: {
  person: ScorecardPerson; isFirst: boolean; isLast: boolean;
}) {
  const lastName = extractLastName(person.figureName);
  const spriteId = nameToSpriteId(person.figureName);
  const detail = scorecardCopy.platformList(person.sources.map((s) => s.name));

  return (
    <View
      style={[styles.personRow, !isLast && styles.personDivider]}
      collapsable={false}
    >
      <SpriteView spriteId={spriteId} state="defeated" size={SPRITE_SIZE} />
      <View style={styles.personText} collapsable={false}>
        <Text style={styles.personName} numberOfLines={1} allowFontScaling={false}>
          {lastName.toUpperCase()}
        </Text>
        <Text style={styles.personDetail} numberOfLines={1} allowFontScaling={false}>
          {detail}
        </Text>
      </View>
      <Text style={styles.personCount} allowFontScaling={false}>
        {scorecardCopy.personCount(person.totalCount)}
      </Text>
    </View>
  );
}

function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const scale = (px: number) => px / pr;

const styles = StyleSheet.create({
  canvas: {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: '#0A0B0C',
    overflow: 'hidden',
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgFill: {
    flex: 1,
    backgroundColor: '#0A101C',
  },
  content: {
    flex: 1,
    paddingTop: scale(SCORECARD_CONTENT_ZONE.top + 20),
    paddingLeft: scale(SCORECARD_CONTENT_ZONE.left),
    paddingRight: scale(SCORECARD_CONTENT_ZONE.right),
    paddingBottom: scale(SCORECARD_CONTENT_ZONE.bottom),
    justifyContent: 'space-between',
  },
  // Header
  header: {
    alignItems: 'center',
    gap: scale(8),
  },
  brandTitle: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(60),
    color: theme.colors.rewardYellow,
    letterSpacing: scale(4),
  },
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
  // Bookend: "I FCKd"
  bookendRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: scale(20),
  },
  bookendBungee: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(56),
    color: '#E8E0D0',
  },
  bookendPlex: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(56),
    color: '#E8E0D0',
  },
  // Count grid zone
  gridZone: {
    backgroundColor: 'rgba(10, 16, 28, 0.5)',
    borderWidth: 2,
    borderColor: '#2A2D30',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    paddingVertical: scale(8),
  },
  personDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  personText: {
    flex: 1,
    gap: scale(4),
  },
  personName: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(40),
    color: theme.colors.textPrimary,
  },
  personDetail: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: scale(24),
    color: theme.colors.textSecondary,
  },
  personCount: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(80),
    color: theme.colors.rewardYellow,
  },
  overflow: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(32),
    color: theme.colors.textSecondary,
    paddingTop: scale(8),
  },
  // Closing bookend: "15× this week"
  closingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    marginTop: scale(16),
  },
  closingCount: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(56),
    color: theme.colors.rewardYellow,
  },
  closingText: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(56),
    color: '#E8E0D0',
  },
  // Footer
  footer: {
    alignItems: 'center',
    gap: scale(8),
  },
  tagline: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(28),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  cta: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(44),
    color: theme.colors.glowCyan,
    letterSpacing: scale(2),
  },
  attribution: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(20),
    color: '#667788',
    letterSpacing: scale(2),
  },
});
