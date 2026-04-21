import React from 'react';
import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import type { ScorecardPerson } from '../data/aggregateScorecard';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';

const SPRITE_SIZE = 120;
const pr = PixelRatio.get();
const scale = (px: number) => px / pr;

interface CardPersonRowProps {
  person: ScorecardPerson;
  isLast: boolean;
}

/**
 * Static person row for the rendered 1080×1920 card.
 * Not interactive. collapsable={false} for view-shot capture.
 */
export function CardPersonRow({ person, isLast }: CardPersonRowProps) {
  const parts = person.figureName.trim().split(/\s+/);
  const lastName = parts[parts.length - 1];
  const spriteId = nameToSpriteId(person.figureName);
  const detail = scorecardCopy.platformList(person.sources.map((s) => s.name));

  return (
    <View style={[styles.row, !isLast && styles.divider]} collapsable={false}>
      {/* Reserve the sprite slot dimensions whether or not a sprite exists so
          the name/count columns stay aligned across rows (#100). */}
      <View style={styles.spriteSlot} collapsable={false}>
        <SpriteView spriteId={spriteId} state="defeated" size={SPRITE_SIZE} />
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
        {scorecardCopy.personCount(person.totalCount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    paddingVertical: scale(8),
  },
  spriteSlot: {
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  text: {
    flex: 1,
    gap: scale(4),
  },
  name: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: scale(40),
    color: theme.colors.textPrimary,
  },
  detail: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: scale(24),
    color: theme.colors.textSecondary,
  },
  count: {
    fontFamily: theme.fonts.headline,
    fontSize: scale(80),
    color: theme.colors.rewardYellow,
  },
});
