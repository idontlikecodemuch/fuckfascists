import React from 'react';
import { Image, PixelRatio, StyleSheet, Text, View } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { Beam } from './ScorecardImageDecorations';

const pr = PixelRatio.get();
const scale = (px: number) => px / pr;

const LOGO_W_DESIGN = 520;
const LOGO_ASPECT = 520 / 280;
const SUBTITLE_FONT_SIZE_DESIGN = 32;
const SUBTITLE_LETTER_SPACING_DESIGN = 14;
const DATE_FONT_SIZE_DESIGN = 26;
const DATE_LETTER_SPACING_DESIGN = 4;
const DATE_BEAM_WIDTH_DESIGN = 140;

interface ScorecardImageHeaderProps {
  dateRange: string;
}

/**
 * Header section of the rendered scorecard:
 *   FCK FASCISTS logo (gold drop-shadow)
 *   SCORECARD subtitle (cream, wide letterSpacing)
 *   Beam — date range — Beam (cyan rules flanking the dim date)
 */
export function ScorecardImageHeader({ dateRange }: ScorecardImageHeaderProps) {
  return (
    <View style={styles.header} collapsable={false}>
      <Image
        source={require('../../../assets/pixel/brand/FF_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subtitle} allowFontScaling={false}>
        {scorecardCopy.title}
      </Text>
      <View style={styles.dateRow} collapsable={false}>
        <Beam width={scale(DATE_BEAM_WIDTH_DESIGN)} />
        <Text style={styles.dateText} allowFontScaling={false}>
          {dateRange}
        </Text>
        <Beam width={scale(DATE_BEAM_WIDTH_DESIGN)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: scale(10) },
  logo: {
    width: scale(LOGO_W_DESIGN),
    aspectRatio: LOGO_ASPECT,
    shadowColor: 'rgba(255,201,60,0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: scale(20),
  },
  subtitle: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(SUBTITLE_FONT_SIZE_DESIGN),
    color: theme.colors.scorecardCream,
    letterSpacing: scale(SUBTITLE_LETTER_SPACING_DESIGN),
    marginTop: scale(-4),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(20),
    marginTop: scale(4),
  },
  dateText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: scale(DATE_FONT_SIZE_DESIGN),
    color: theme.colors.scorecardDim,
    letterSpacing: scale(DATE_LETTER_SPACING_DESIGN),
  },
});
