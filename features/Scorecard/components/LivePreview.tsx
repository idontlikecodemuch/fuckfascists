import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import {
  DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS,
  DAY_CIRCLES_COLLAPSE_STAGGER_MS,
} from '../../../config/constants';
import type { ScorecardViewData } from '../types';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { formatWeekRange } from '../utils/formatters';
import { NeonRule } from '../../Info/components/InfoDecorations';
import { SparkleDecoration } from '../../../core/fx';
import { PreviewStamp } from './PreviewStamp';
import { PreviewPersonRow } from './PreviewPersonRow';

interface LivePreviewProps {
  data: ScorecardViewData;
  onSwitchTab?: (tab: string) => void;
}

/**
 * State 1: The in-app interactive preview — scrollable, detailed, NOT shareable.
 * Shows the hero count, person rows grouped by CEO, and "DROPS THIS FRIDAY" subtext.
 * This is the reason to visit the Scorecard tab mid-week.
 */
export function LivePreview({ data, onSwitchTab }: LivePreviewProps) {
  const { weekOf, persons, grandTotal } = data;
  const dateRange = formatWeekRange(weekOf);

  // Start with all expandable rows open, then gracefully collapse with stagger.
  const expandableNames = persons.filter((p) => p.children.length > 1).map((p) => p.figureName);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(expandableNames));
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (expandableNames.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    expandableNames.forEach((name, i) => {
      const delay = DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS + i * DAY_CIRCLES_COLLAPSE_STAGGER_MS;
      timers.push(setTimeout(() => {
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
      }, delay));
    });
    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — run once on mount

  const handleToggle = useCallback((figureName: string) => {
    // Manual toggle cancels any pending auto-collapse timers.
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(figureName)) next.delete(figureName);
      else next.add(figureName);
      return next;
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* ── Preview frame ── */}
      <View style={styles.frame}>
        <PreviewStamp />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} allowFontScaling={false}>
            {scorecardCopy.title}
          </Text>
          <Text style={styles.dropsLabel} allowFontScaling={false}>
            {scorecardCopy.dropsLabel}
          </Text>
          <NeonRule />
          <Text style={styles.dateRange} allowFontScaling={false}>
            {dateRange}
          </Text>
        </View>

        {/* Hero count */}
        <View style={styles.hero}>
          <Text style={styles.heroCount} allowFontScaling={false}>
            {grandTotal}{'\u00d7'}
          </Text>
          <SparkleDecoration variant="large" />
          <Text style={styles.heroLabel} allowFontScaling={false}>
            {scorecardCopy.heroLabel}
          </Text>
          <Text style={styles.heroWeek} allowFontScaling={false}>
            {scorecardCopy.heroWeek}
          </Text>
        </View>

        <NeonRule />

        {/* Person rows */}
        {persons.length > 0 ? (
          <Animated.FlatList
            itemLayoutAnimation={LinearTransition.duration(250)}
            data={persons}
            keyExtractor={(p) => p.figureName}
            renderItem={({ item }) => (
              <PreviewPersonRow
                person={item}
                expanded={expanded.has(item.figureName)}
                onToggle={() => handleToggle(item.figureName)}
              />
            )}
            scrollEnabled={false}
          />
        ) : (
          <EmptyHint onSwitchTab={onSwitchTab} />
        )}
      </View>
    </ScrollView>
  );
}

function EmptyHint({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText} allowFontScaling={false}>
        {scorecardCopy.emptyState.split(/\{(\w+)\}/).map((part, i) => {
          if (part === 'map' || part === 'track') {
            return (
              <Text
                key={i}
                style={styles.emptyLink}
                onPress={onSwitchTab ? () => onSwitchTab(part === 'map' ? 'map' : 'platforms') : undefined}
              >
                {part === 'map' ? 'Map' : 'Track'}
              </Text>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.space['4xl'],
  },
  frame: {
    margin: theme.space.md,
    borderWidth: 2,
    borderColor: theme.colors.amberActionLight,
    overflow: 'visible',
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: theme.space.xl,
    paddingHorizontal: theme.space.lg,
    gap: 4,
  },
  title: {
    fontFamily: theme.fonts.headline,
    fontSize: 20,
    color: theme.colors.textPrimary,
    letterSpacing: 4,
  },
  dropsLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
  },
  dateRange: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: theme.space.xl,
    overflow: 'visible',
  },
  heroCount: {
    fontFamily: theme.fonts.headline,
    fontSize: 56,
    color: theme.colors.rewardYellow,
  },
  heroLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginTop: theme.space.xs,
  },
  heroWeek: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    color: theme.colors.textSecondary,
    letterSpacing: 3,
    marginTop: 2,
  },
  // Empty
  emptyState: {
    padding: theme.space['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.amberActionLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyLink: {
    color: theme.colors.rewardYellow,
    textDecorationLine: 'underline',
  },
});
