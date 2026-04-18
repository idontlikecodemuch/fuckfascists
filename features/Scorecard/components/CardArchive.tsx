import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { useCardArchive } from '../hooks/useCardArchive';
import { CardPresentation } from './CardPresentation';
import type { ArchivedCard } from '../data/cardArchive';

const THUMB_COLS = 2;
const THUMB_ASPECT = 1920 / 1080;

interface CardArchiveProps {
  onDismiss: () => void;
}

/**
 * Reverse-chronological thumbnail grid of past scorecards.
 * Tap a thumbnail → full-screen CardPresentation with active SHARE.
 */
export function CardArchive({ onDismiss }: CardArchiveProps) {
  const { cards, loading } = useCardArchive();
  const [selected, setSelected] = useState<ArchivedCard | null>(null);

  const renderThumb = useCallback(({ item }: { item: ArchivedCard }) => (
    <Pressable
      style={styles.thumb}
      onPress={() => setSelected(item)}
      accessibilityRole="button"
      accessibilityLabel={`Scorecard: ${item.filename}`}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbImage} resizeMode="cover" />
      <Text style={styles.thumbLabel} allowFontScaling={false}>
        {item.filename.replace('.png', '')}
      </Text>
    </Pressable>
  ), []);

  if (selected) {
    return (
      <CardPresentation
        pngUri={selected.uri}
        onDismiss={() => setSelected(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtn}>{'\u2190'} Back</Text>
        </Pressable>
        <Text style={styles.title}>{scorecardCopy.pastCardsLabel}</Text>
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : cards.length === 0 ? (
        <Text style={styles.empty}>No past scorecards yet.</Text>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.filename}
          renderItem={renderThumb}
          numColumns={THUMB_COLS}
          contentContainerStyle={styles.grid}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.space.md,
    gap: theme.space.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.panelBorder,
  },
  backBtn: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.highlightBlue,
  },
  title: {
    fontFamily: theme.fonts.headline,
    fontSize: 14,
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  grid: {
    padding: theme.space.sm,
    gap: theme.space.sm,
  },
  thumb: {
    flex: 1,
    margin: theme.space.xs,
    borderWidth: 1,
    borderColor: theme.colors.panelBorder,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    aspectRatio: 1 / THUMB_ASPECT,
  },
  thumbLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: theme.colors.panelOuter,
  },
  empty: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.space['4xl'],
  },
});
