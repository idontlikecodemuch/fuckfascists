import React, { forwardRef } from 'react';
import { Image, PixelRatio, StyleSheet, Text, View } from 'react-native';
import type { ScorecardViewData } from '../types';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { formatWeekRange } from '../utils/formatters';
import { scorecardBg, scorecardFrame, scorecardScanlines } from '../../../core/scorecard/scorecardAssets';
import { CardPersonRow } from './CardPersonRow';
import { PowerMeter } from './PowerMeter';
import { CornerTick, Sparkle } from './ScorecardImageDecorations';
import { ScorecardImageHeader } from './ScorecardImageHeader';
import { ScorecardImageFooter } from './ScorecardImageFooter';
import {
  SCORECARD_CONTENT_ZONE,
  SCORECARD_IMAGE_HEIGHT,
  SCORECARD_IMAGE_WIDTH,
} from '../../../config/constants';

const TOP_N = 3;
const pr = PixelRatio.get();
const scale = (px: number) => px / pr;
const VIEW_WIDTH = SCORECARD_IMAGE_WIDTH / pr;
const VIEW_HEIGHT = SCORECARD_IMAGE_HEIGHT / pr;

const HEADLINE_FONT_SIZE_DESIGN = 120;
const HEADLINE_GAP_DESIGN = 18;
const PANEL_PAD_TOP_DESIGN = 14;
const PANEL_PAD_X_DESIGN = 24;
const PANEL_PAD_BOTTOM_DESIGN = 18;
const OVERFLOW_FONT_SIZE_DESIGN = 36;
const THIS_WEEK_FONT_SIZE_DESIGN = 64;
const THIS_WEEK_LETTER_SPACING_DESIGN = 6;

interface ScorecardImageProps {
  data: ScorecardViewData;
}

/**
 * Rendered shareable card — 1080×1920 fixed layout (Claude Design "polished
 * main"). See docs/SCORECARD_IMAGE.md for the composition spec.
 * Designed for react-native-view-shot capture; collapsable={false} +
 * allowFontScaling={false} throughout for bitmap fidelity.
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

        {/* Layer 2: Vignette — dark fade at edges via inset shadow */}
        <View style={styles.vignette} pointerEvents="none" collapsable={false} />

        {/* Layer 2b: Scanlines — 1px-every-4px dark line, tiled vertically.
            Subtle CRT effect; sits over the bg + vignette but under content. */}
        <Image
          source={scorecardScanlines}
          style={styles.scanlines}
          resizeMode="repeat"
        />

        {/* Layer 3: Power meter (left edge, anchored bottom). */}
        {powerTier && <PowerMeter tier={powerTier} />}

        {/* Layer 4+: Content (header / hero+panel+closing / footer) */}
        <View style={styles.content} collapsable={false}>
          <ScorecardImageHeader dateRange={dateRange} />

          <View style={styles.contentSection} collapsable={false}>
            <View style={styles.headlineRow} collapsable={false}>
              <Text style={styles.headlineWhite} allowFontScaling={false}>
                {scorecardCopy.heroPrefix}
              </Text>
              <Text style={styles.headlineGold} allowFontScaling={false}>
                {grandTotal}
                <Text style={styles.headlineGoldTimes}>×</Text>
              </Text>
            </View>

            <View style={styles.panel} collapsable={false}>
              <CornerTick edge="tl" />
              <CornerTick edge="tr" />
              <CornerTick edge="bl" />
              <CornerTick edge="br" />

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

            <View style={styles.thisWeekRow} collapsable={false}>
              <Text style={styles.thisWeek} allowFontScaling={false}>
                {scorecardCopy.heroWeek}
              </Text>
            </View>
          </View>

          <ScorecardImageFooter />
        </View>

        {/* Sparkles — gold accents in 4 corners, cyan accents mid-card.
            Positions in design space (px on 1080×1920 canvas). */}
        <Sparkle x={180}  y={140}  size={22} />
        <Sparkle x={940}  y={210}  size={18} rotate={25} />
        <Sparkle x={150}  y={1700} size={20} />
        <Sparkle x={960}  y={1760} size={24} rotate={-15} />
        <Sparkle x={240}  y={900}  size={14} small opacity={0.7} />
        <Sparkle x={880}  y={1100} size={14} small opacity={0.7} />
        <Sparkle x={90}   y={1500} size={18} cyan opacity={0.8} />
        <Sparkle x={1000} y={1400} size={16} cyan opacity={0.7} />

        {/* Layer N: Frame overlay — gold ornament border on top of everything. */}
        <Image source={scorecardFrame} style={styles.frameImage} resizeMode="stretch" />
      </View>
    );
  },
);

ScorecardImage.displayName = 'ScorecardImage';

const styles = StyleSheet.create({
  canvas: {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: '#06080e',
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
  },
  // Vignette: inset dark shadow simulates radial darkening at edges.
  vignette: {
    ...StyleSheet.absoluteFillObject,
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 0,
        blurRadius: scale(220),
        spreadDistance: scale(-80),
        inset: true,
        color: 'rgba(0,0,0,0.55)',
      },
    ],
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    opacity: 0.6,
  },
  frameImage: {
    ...StyleSheet.absoluteFillObject,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
  },
  content: {
    flex: 1,
    paddingTop: scale(SCORECARD_CONTENT_ZONE.top),
    paddingLeft: scale(SCORECARD_CONTENT_ZONE.left),
    paddingRight: scale(SCORECARD_CONTENT_ZONE.right),
    paddingBottom: scale(SCORECARD_CONTENT_ZONE.bottom),
    justifyContent: 'space-between',
  },

  contentSection: { flexDirection: 'column' },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(HEADLINE_GAP_DESIGN),
  },
  headlineWhite: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(HEADLINE_FONT_SIZE_DESIGN),
    color: theme.colors.scorecardCream,
    letterSpacing: scale(2),
    lineHeight: scale(HEADLINE_FONT_SIZE_DESIGN),
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  headlineGold: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(HEADLINE_FONT_SIZE_DESIGN),
    color: theme.colors.rewardYellow,
    lineHeight: scale(HEADLINE_FONT_SIZE_DESIGN),
    textShadowColor: 'rgba(255,201,60,0.7)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: scale(22),
  },
  headlineGoldTimes: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(HEADLINE_FONT_SIZE_DESIGN * 0.7),
  },

  panel: {
    marginTop: scale(20),
    backgroundColor: 'rgba(10,16,28,0.62)',
    borderWidth: 2,
    borderColor: theme.colors.panelBorder,
    paddingTop: scale(PANEL_PAD_TOP_DESIGN),
    paddingHorizontal: scale(PANEL_PAD_X_DESIGN),
    paddingBottom: scale(PANEL_PAD_BOTTOM_DESIGN),
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: scale(40), spreadDistance: 0, inset: true, color: 'rgba(40,120,200,0.12)' },
      { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: scale(1), inset: true, color: 'rgba(122,242,255,0.06)' },
    ],
  },
  overflow: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(OVERFLOW_FONT_SIZE_DESIGN),
    color: theme.colors.textSecondary,
    paddingTop: scale(16),
    paddingLeft: scale(8),
    letterSpacing: scale(3),
  },

  thisWeekRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'baseline',
    marginTop: scale(20),
  },
  thisWeek: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(THIS_WEEK_FONT_SIZE_DESIGN),
    color: theme.colors.scorecardCream,
    letterSpacing: scale(THIS_WEEK_LETTER_SPACING_DESIGN),
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
});
