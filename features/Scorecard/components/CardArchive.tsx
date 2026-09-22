import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAndroidBackHandler } from '../../../core/ui/useAndroidBackHandler';
import { theme } from '../../../design/tokens';
import { useCardArchive } from '../hooks/useCardArchive';
import { CardPresentation } from './CardPresentation';
import type { ArchivedCard } from '../data/cardArchive';
import { formatCardLabel } from '../utils/formatters';
import { haptics } from '../../../core/fx/haptics';

const THUMB_ASPECT = 1920 / 1080;
const LIST_PADDING = theme.space.md;
const ROW_THUMB_HEIGHT = 56;
const ROW_THUMB_WIDTH = Math.round(ROW_THUMB_HEIGHT / THUMB_ASPECT);
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
      sortOrder === 'newest'
        ? b.modificationTime - a.modificationTime
        : a.modificationTime - b.modificationTime,
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

  const renderRow = useCallback(({ item }: { item: ArchivedCard }) => {
    const label = formatCardLabel(item.filename);
    const isLatest = item.filename === latestFilename;
    return (
      <Pressable
        style={styles.row}
        onPress={() => { haptics.tap(); setSelected(item); }}
        accessibilityRole="button"
        accessibilityLabel={`Scorecard, week of ${label}`}
      >
        <Image source={{ uri: item.uri }} style={styles.rowImage} resizeMode="cover" />
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
        <Text style={styles.chevron} allowFontScaling={false}>{'\u203a'}</Text>
      </Pressable>
    );
  }, [latestFilename]);

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
