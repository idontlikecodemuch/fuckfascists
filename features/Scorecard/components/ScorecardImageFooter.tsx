import React from 'react';
import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { Beam } from './ScorecardImageDecorations';

const pr = PixelRatio.get();
const scale = (px: number) => px / pr;

const FOOTER_BEAM_WIDTH_DESIGN = 520;
const TAGLINE_FONT_SIZE_DESIGN = 32;
const CTA_FONT_SIZE_DESIGN = 58;
const CTA_LETTER_SPACING_DESIGN = 6;
const ATTRIBUTION_FONT_SIZE_DESIGN = 22;
const ATTRIBUTION_LETTER_SPACING_DESIGN = 6;

/**
 * Footer section of the rendered scorecard:
 *   Beam (full-width-ish cyan rule)
 *   🤘 The fascists won't f*ck themselves. 🤘   (gold horns)
 *   FCKFASCISTS.ORG   (Bungee cyan, strong glow)
 *   DATA: FEC.GOV     (dim attribution)
 */
export function ScorecardImageFooter() {
  return (
    <View style={styles.footer} collapsable={false}>
      <Beam width={scale(FOOTER_BEAM_WIDTH_DESIGN)} />
      <Text style={styles.tagline} allowFontScaling={false}>
        <Text style={styles.taglineHorns}>🤘 </Text>
        {scorecardCopy.tagline}
        <Text style={styles.taglineHorns}> 🤘</Text>
      </Text>
      <Text style={styles.cta} allowFontScaling={false}>
        {scorecardCopy.cta}
      </Text>
      <Text style={styles.attribution} allowFontScaling={false}>
        {scorecardCopy.dataAttribution}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', gap: scale(16) },
  tagline: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(TAGLINE_FONT_SIZE_DESIGN),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    letterSpacing: scale(1),
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  taglineHorns: { color: theme.colors.rewardYellow },
  cta: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(CTA_FONT_SIZE_DESIGN),
    color: theme.colors.glowCyan,
    letterSpacing: scale(CTA_LETTER_SPACING_DESIGN),
    marginTop: scale(4),
    textShadowColor: 'rgba(122,242,255,0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: scale(20),
  },
  attribution: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(ATTRIBUTION_FONT_SIZE_DESIGN),
    color: theme.colors.scorecardDim,
    letterSpacing: scale(ATTRIBUTION_LETTER_SPACING_DESIGN),
    marginTop: scale(-4),
  },
});
