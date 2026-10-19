import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { useAndroidBackHandler } from '../../../core/ui/useAndroidBackHandler';
import { theme } from '../../../design/tokens';
import { useCardArchive } from '../hooks/useCardArchive';
import { CardPresentation } from './CardPresentation';
import { CardArchiveRow } from './CardArchiveRow';
import { compareCardsNewestFirst, type ArchivedCard } from '../data/cardArchive';
import { haptics } from '../../../core/fx/haptics';

const LIST_PADDING = theme.space.md;
const TAB_BAR_CLEARANCE = 124;

type SortOrder = 'newest' | 'oldest';

interface CardArchiveProps {
  onDismiss: () => void;
  onPresentationActiveChange?: (active: boolean) => void;
}

/**
 * Dated list of past scorecards.
 * Tap a row → full-screen CardPresentation with active SHARE.
 */
export function CardArchive({ onDismiss, onPresentationActiveChange }: CardArchiveProps) {
  useAndroidBackHandler(onDismiss);
  const { cards, loading } = useCardArchive();
  const [selected, setSelected] = useState<ArchivedCard | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const latestFilename = cards[0]?.filename;
  const archiveCountLabel = cards.length === 1 ? '1 saved card' : `${cards.length} saved cards`;
  const sortedCards = useMemo(
    () => [...cards].sort((a, b) =>
      sortOrder === 'newest' ? compareCardsNewestFirst(a, b) : compareCardsNewestFirst(b, a),
    ),
    [cards, sortOrder],
  );

  useEffect(() => {
    onPresentationActiveChange?.(Boolean(selected));
  }, [onPresentationActiveChange, selected]);

  useEffect(() => {
    return () => onPresentationActiveChange?.(false);
  }, [onPresentationActiveChange]);

  const setSort = useCallback((next: SortOrder) => {
    if (next === sortOrder) return;
    haptics.tap();
    setSortOrder(next);
  }, [sortOrder]);

  const renderRow = useCallback(({ item }: { item: ArchivedCard }) => (
    <CardArchiveRow card={item} isLatest={item.filename === latestFilename} onPress={setSelected} />
  ), [latestFilename]);

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
          onPress={() => { haptics.tap(); onDismiss(); }}
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
          data={sortedCards}
          keyExtractor={(c) => c.filename}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={(
            <View style={styles.summary}>
              <View>
                <Text style={styles.summaryLabel} allowFontScaling={false}>PAST CARDS</Text>
                <Text style={styles.summaryCount} allowFontScaling={false}>{archiveCountLabel}</Text>
              </View>
              <View style={styles.sortControl}>
                <Pressable
                  style={[styles.sortOption, sortOrder === 'newest' && styles.sortOptionActive]}
                  onPress={() => setSort('newest')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortOrder === 'newest' }}
                  accessibilityLabel="Sort newest first"
                >
                  <Text
                    style={[styles.sortText, sortOrder === 'newest' && styles.sortTextActive]}
                    allowFontScaling={false}
                  >
                    Newest
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.sortOption, sortOrder === 'oldest' && styles.sortOptionActive]}
                  onPress={() => setSort('oldest')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortOrder === 'oldest' }}
                  accessibilityLabel="Sort oldest first"
                >
                  <Text
                    style={[styles.sortText, sortOrder === 'oldest' && styles.sortTextActive]}
                    allowFontScaling={false}
                  >
                    Oldest
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
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
  list: {
    paddingTop: theme.space.md,
    paddingHorizontal: LIST_PADDING,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
    marginBottom: theme.space.md,
  },
  summaryLabel: {
    fontFamily: theme.fonts.headline,
    fontSize: 10,
    color: theme.colors.rewardYellow,
    letterSpacing: 2,
  },
  summaryCount: {
    ...theme.type.caption,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  sortControl: {
    flexDirection: 'row',
    minHeight: 36,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.panelOuter,
  },
  sortOption: {
    minWidth: 68,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortOptionActive: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.rewardYellow,
  },
  sortText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  sortTextActive: {
    color: theme.colors.rewardYellow,
  },
  separator: {
    height: theme.space.sm,
  },
  empty: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.space['4xl'],
  },
});
