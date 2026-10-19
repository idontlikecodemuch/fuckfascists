import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../design/tokens';
import { haptics } from '../../../core/fx/haptics';
import type { ArchivedCard } from '../data/cardArchive';
import { formatCardLabel } from '../utils/formatters';

const THUMB_ASPECT = 1920 / 1080;
const ROW_THUMB_HEIGHT = 56;
const ROW_THUMB_WIDTH = Math.round(ROW_THUMB_HEIGHT / THUMB_ASPECT);

interface CardArchiveRowProps {
  card: ArchivedCard;
  isLatest: boolean;
  onPress: (card: ArchivedCard) => void;
}

/** One past scorecard in the archive list: thumbnail, week label, chevron. */
export function CardArchiveRow({ card, isLatest, onPress }: CardArchiveRowProps) {
  const label = formatCardLabel(card.filename);
  return (
    <Pressable
      style={styles.row}
      onPress={() => { haptics.tap(); onPress(card); }}
      accessibilityRole="button"
      accessibilityLabel={`Scorecard, week of ${label}`}
    >
      <Image source={{ uri: card.uri }} style={styles.rowImage} resizeMode="cover" />
      <View style={styles.rowText}>
        <View style={styles.rowMeta}>
          <Text
            style={[styles.rowTag, isLatest && styles.rowTagLatest]}
            allowFontScaling={false}
          >
            {isLatest ? 'LATEST' : 'SCORECARD'}
          </Text>
        </View>
        <Text style={styles.rowTitle} allowFontScaling={false}>
          Week of {label}
        </Text>
        <Text style={styles.rowHint} allowFontScaling={false}>Tap to view and share</Text>
      </View>
      <Text style={styles.chevron} allowFontScaling={false}>{'›'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    padding: theme.space.sm,
    borderWidth: 1,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.panelOuter,
  },
  rowImage: {
    width: ROW_THUMB_WIDTH,
    height: ROW_THUMB_HEIGHT,
    borderWidth: 1,
    borderColor: theme.colors.panelBorder,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowMeta: {
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  rowTag: {
    fontFamily: theme.fonts.headline,
    fontSize: 8,
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  rowTagLatest: {
    color: theme.colors.rewardYellow,
  },
  rowTitle: {
    ...theme.type.uiLabel,
    color: theme.colors.textPrimary,
  },
  rowHint: {
    ...theme.type.caption,
    marginTop: 1,
    color: theme.colors.textSecondary,
  },
  chevron: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 24,
    color: theme.colors.highlightBlue,
  },
});
