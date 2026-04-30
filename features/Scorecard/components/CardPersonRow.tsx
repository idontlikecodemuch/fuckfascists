import React from 'react';
import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import type { ScorecardPerson } from '../data/aggregateScorecard';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';

const SPRITE_SLOT_DESIGN = 200;
const SPRITE_DESIGN = 180;
const NAME_FONT_SIZE_DESIGN = 52;
const DETAIL_FONT_SIZE_DESIGN = 26;
const COUNT_FONT_SIZE_DESIGN = 104;
const COL_GAP_DESIGN = 20;
const ROW_PAD_V_DESIGN = 14;
const ROW_PAD_H_DESIGN = 8;
const COUNT_PAD_RIGHT_DESIGN = 16;

const pr = PixelRatio.get();
const scale = (px: number) => px / pr;

interface CardPersonRowProps {
  person: ScorecardPerson;
  isLast: boolean;
}

/**
 * Static person row for the rendered 1080×1920 card.
 *
 * Grid: [sprite slot 200] [gap 20] [name + platforms — flex 1] [gap 20] [count auto].
 * Defeated sprite, anchored by face position so the eyes hit the same y on
 * every character. Counts are gold with a soft amber glow + drop shadow —
 * they read as achievements, not warnings.
 *
 * Not interactive. collapsable={false} for view-shot capture.
 */
export function CardPersonRow({ person, isLast }: CardPersonRowProps) {
  const parts = person.figureName.trim().split(/\s+/);
  const lastName = parts[parts.length - 1];
  const spriteId = nameToSpriteId(person.figureName);
  const detail = scorecardCopy.platformList(person.sources.map((s) => s.name));

  return (
    <View style={[styles.row, !isLast && styles.divider]} collapsable={false}>
      <View style={styles.spriteSlot} collapsable={false}>
        <SpriteView
          spriteId={spriteId}
          state="defeated"
          size={scale(SPRITE_DESIGN)}
          // Defeated face position has the head leaning forward; for the
          // share image we still want the face roughly centered horizontally
          // so the row reads as a portrait row. SpriteView reads state to
          // pick the correct face position — anchor at viewport center for
          // both axes.
          faceAnchorX={0.5}
          faceAnchorY={0.5}
        />
      </View>
      <View style={styles.text} collapsable={false}>
        <Text style={styles.name} numberOfLines={1} allowFontScaling={false}>
          {lastName.toUpperCase()}
        </Text>
        <Text style={styles.detail} numberOfLines={1} allowFontScaling={false}>
          {detail}
        </Text>
      </View>
      <Text style={styles.count} allowFontScaling={false}>
        {person.totalCount}
        <Text style={styles.countTimes}>×</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(ROW_PAD_V_DESIGN),
    paddingHorizontal: scale(ROW_PAD_H_DESIGN),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  spriteSlot: {
    width: scale(SPRITE_SLOT_DESIGN),
    height: scale(SPRITE_DESIGN),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(COL_GAP_DESIGN),
  },
  text: {
    flex: 1,
    gap: scale(6),
    marginRight: scale(COL_GAP_DESIGN),
  },
  name: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(NAME_FONT_SIZE_DESIGN),
    color: theme.colors.scorecardCream,
    letterSpacing: scale(2),
    lineHeight: scale(NAME_FONT_SIZE_DESIGN),
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  detail: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: scale(DETAIL_FONT_SIZE_DESIGN),
    color: theme.colors.textSecondary,
    letterSpacing: scale(0.5),
    lineHeight: scale(DETAIL_FONT_SIZE_DESIGN * 1.2),
  },
  count: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(COUNT_FONT_SIZE_DESIGN),
    color: theme.colors.rewardYellow,
    lineHeight: scale(COUNT_FONT_SIZE_DESIGN),
    paddingRight: scale(COUNT_PAD_RIGHT_DESIGN),
    textShadowColor: 'rgba(255, 201, 60, 0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  countTimes: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(COUNT_FONT_SIZE_DESIGN * 0.65),
  },
});
