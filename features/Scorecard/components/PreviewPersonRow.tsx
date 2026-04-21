import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ScorecardPerson } from '../data/aggregateScorecard';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { CollapsibleRow } from '../../../core/ui/CollapsibleRow';
import { SurfaceIcons } from './SurfaceIcon';

const SPRITE_SIZE = 44;

interface PreviewPersonRowProps {
  person: ScorecardPerson;
  expanded: boolean;
  onToggle: () => void;
}

export function PreviewPersonRow({ person, expanded, onToggle }: PreviewPersonRowProps) {
  const expandable = person.children.length > 1;
  const lastName = extractLastName(person.figureName);
  const spriteId = nameToSpriteId(person.figureName);
  const parentName = person.sources[0]?.name ?? '';

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      {/* Reserve the sprite slot dimensions whether or not a sprite exists,
          so the name/count columns stay aligned across rows (#100). */}
      <View style={styles.spriteSlot}>
        <SpriteView spriteId={spriteId} state="defeated" size={SPRITE_SIZE} />
      </View>
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={1} allowFontScaling={false}>
          {lastName.toUpperCase()}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.company} numberOfLines={1} allowFontScaling={false}>
            {parentName}
          </Text>
          <SurfaceIcons surfaces={person.surfaces} />
        </View>
      </View>
      <Text style={styles.count} allowFontScaling={false}>
        {scorecardCopy.personCount(person.totalCount)}
      </Text>
      {expandable && (
        <Text style={[styles.indicator, expanded && styles.indicatorOpen]}>
          {expanded ? theme.accordion.expandedIndicator : theme.accordion.collapsedIndicator}
        </Text>
      )}
    </View>
  ), [spriteId, lastName, parentName, person.surfaces, person.totalCount, expandable, expanded]);

  const renderExpanded = useCallback(() => (
    <View style={styles.childList}>
      {person.children.map((child) => (
        <View key={child.name} style={styles.childRow}>
          <Text style={styles.childIndent}>{'\u21B3'}</Text>
          <Text style={styles.childName} numberOfLines={1} allowFontScaling={false}>
            {child.name}
          </Text>
          <SurfaceIcons surfaces={child.surfaces} />
          <Text style={styles.childCount} allowFontScaling={false}>
            {scorecardCopy.personCount(child.count)}
          </Text>
        </View>
      ))}
    </View>
  ), [person.children]);

  return (
    <CollapsibleRow
      expanded={expanded}
      onToggle={onToggle}
      renderHeader={renderHeader}
      renderExpanded={renderExpanded}
      expandable={expandable}
      style={styles.row}
      focusedStyle={styles.focusedRow}
      accessibilityLabel={`${lastName}, ${person.totalCount} avoids`}
    />
  );
}

function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
  },
  focusedRow: {
    backgroundColor: theme.colors.focusTint,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.a11y.minTapTarget,
    gap: theme.space.sm,
  },
  spriteSlot: {
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
  },
  company: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  count: {
    fontFamily: theme.fonts.headline,
    fontSize: 24,
    color: theme.colors.rewardYellow,
    minWidth: 36,
    textAlign: 'right',
  },
  indicator: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: theme.colors.textSecondary,
    width: 20,
    textAlign: 'center',
  },
  indicatorOpen: {
    color: theme.colors.highlightBlue,
  },
  // Expanded children
  childList: {
    paddingLeft: SPRITE_SIZE + theme.space.sm,
    paddingBottom: theme.space.xs,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    paddingVertical: 3,
  },
  childIndent: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  childName: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  childCount: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
    color: theme.colors.rewardYellow,
    minWidth: 24,
    textAlign: 'right',
  },
});
