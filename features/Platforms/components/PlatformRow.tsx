import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PlatformItem } from '../types';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { DayCircles } from './DayCircles';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { getLocalDateString } from '../../../core/utils/localDate';

const SPRITE_DEFEATED_THRESHOLD = 3;

interface PlatformRowProps {
  item: PlatformItem;
  weekOf: string;
  onAvoid: () => Promise<void>;
  onAvoidDate: (date: string) => Promise<void>;
  /** Hide the sprite (e.g. when row is inside a group that already shows the sprite). */
  hideSprite?: boolean;
  /** Compact mode — less padding for grouped child rows. */
  compact?: boolean;
}

/**
 * Single row in the platform avoidance list.
 * Each tap increments the day's count — the button never locks.
 * Minimum tap target: 44×44pt on the avoid button.
 *
 * Tap anywhere on the row (except the avoid button) to expand/collapse day circles.
 * Second avoid tap on a day that already has avoids auto-expands the row
 * to teach the backfill mechanic organically.
 */
export function PlatformRow({ item, weekOf, onAvoid, onAvoidDate, hideSprite = false, compact = false }: PlatformRowProps) {
  const { platform, weeklyCount, dayCounts } = item;
  const hasAvoided = weeklyCount > 0;
  const [expanded, setExpanded] = useState(false);

  const figureName = platform.publicFigureName ?? platform.ceoName;
  const spriteId = nameToSpriteId(figureName);
  const spriteState = weeklyCount >= SPRITE_DEFEATED_THRESHOLD ? 'defeated' as const : 'neutral' as const;
  const spriteOpacity = hasAvoided ? 1 : 0.4;

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  // Second-tap auto-expand: if today already has avoids, expand after logging
  const handleAvoidPress = useCallback(async () => {
    const todayCount = dayCounts.get(getLocalDateString()) ?? 0;
    await onAvoid();
    if (todayCount > 0 && !expanded) {
      setExpanded(true);
    }
  }, [onAvoid, dayCounts, expanded]);

  return (
    <View style={[styles.outer, hasAvoided && styles.outerAvoided]}>
      <View style={[styles.row, compact && styles.rowCompact]}>
        {/* Row content — tappable to expand/collapse */}
        <Pressable
          onPress={toggleExpand}
          style={styles.rowContent}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? platformsCopy.collapseLabel(platform.name)
              : platformsCopy.expandLabel(platform.name)
          }
        >
          <Text style={styles.chevron} allowFontScaling={false}>
            {expanded ? '\u2212' : '+'}
          </Text>

          {!hideSprite && (
            <SpriteView spriteId={spriteId} state={spriteState} size={36} opacity={spriteOpacity} />
          )}

          <View style={styles.info}>
            <Text style={styles.name} allowFontScaling>{platform.name}</Text>
            {!hideSprite && (
              <Text style={styles.sub} allowFontScaling>
                {platformsCopy.rowSubtitle(platform.parentCompany, platform.publicFigureName ?? platform.ceoName)}
              </Text>
            )}
            <View style={styles.tags}>
              {platform.categoryTags.map((tag) => (
                <Text key={tag} style={styles.tag} allowFontScaling>{tag}</Text>
              ))}
            </View>
          </View>

          {hasAvoided && (
            <Text
              style={styles.count}
              allowFontScaling
              accessibilityLabel={platformsCopy.countA11y(weeklyCount, platform.name)}
            >
              {platformsCopy.countLabel(weeklyCount)}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleAvoidPress}
          style={[styles.avoidBtn, hasAvoided && styles.avoidBtnActive]}
          accessibilityRole="button"
          accessibilityLabel={
            hasAvoided
              ? platformsCopy.avoidedLabel(platform.name)
              : platformsCopy.notAvoidedLabel(platform.name)
          }
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={[styles.avoidText, hasAvoided && styles.avoidTextActive]} allowFontScaling>
            {hasAvoided ? sharedCopy.checkmark : platformsCopy.avoidBtn}
          </Text>
        </Pressable>
      </View>

      {expanded && (
        <DayCircles
          weekOf={weekOf}
          platformName={platform.name}
          dayCounts={dayCounts}
          onAvoidDate={onAvoidDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer:           { borderBottomWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, backgroundColor: theme.colors.surface1 },
  outerAvoided:    { backgroundColor: theme.colors.surface2 },
  row:             { flexDirection: 'row', alignItems: 'center', padding: theme.space.md, minHeight: theme.a11y.minTapTarget },
  rowCompact:      { paddingVertical: theme.space.sm, paddingLeft: theme.space['3xl'] },
  rowContent:      { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: theme.a11y.minTapTarget },
  chevron:         { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textPrimary, minWidth: 28, textAlign: 'center', marginRight: theme.space.xs },
  info:            { flex: 1, marginLeft: theme.space.xs },
  name:            { ...theme.type.uiLabel, color: theme.colors.textPrimary, marginBottom: 2 },
  sub:             { ...theme.type.caption, color: theme.colors.textSecondary, marginBottom: theme.space.xs },
  tags:            { flexDirection: 'row', gap: 6 },
  tag:             { ...theme.type.caption, fontSize: 10, color: theme.colors.bgVoid, backgroundColor: theme.colors.highlightBlue, paddingHorizontal: 5, paddingVertical: 1 },
  count:           { ...theme.type.displayS, color: theme.colors.rewardYellow, marginRight: theme.space.md },
  avoidBtn:        { minWidth: theme.a11y.minTapTarget, minHeight: theme.a11y.minTapTarget, borderWidth: theme.borders.hero.width, borderColor: theme.colors.rewardYellow, backgroundColor: theme.colors.rewardYellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  avoidBtnActive:  { backgroundColor: theme.colors.successGreen, borderColor: theme.colors.successGreen },
  avoidText:       { ...theme.type.displayS, fontSize: 11, fontWeight: 'bold', color: theme.colors.bgVoid },
  avoidTextActive: { color: theme.colors.bgVoid },
});
