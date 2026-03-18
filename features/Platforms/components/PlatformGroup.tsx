import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';

interface PlatformGroupProps {
  parentCompany: string;
  figureName: string;
  totalAvoids: number;
  children: React.ReactNode;
}

const DEFEATED_THRESHOLD = 3;

/**
 * Group header for platforms sharing the same parentCompany.
 * Shows the parent company name, rolled-up avoid total, and the figure sprite.
 */
export function PlatformGroup({ parentCompany, figureName, totalAvoids, children }: PlatformGroupProps) {
  const spriteId = nameToSpriteId(figureName);
  const isDefeated = totalAvoids >= DEFEATED_THRESHOLD;

  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <SpriteView
          spriteId={spriteId}
          state={isDefeated ? 'defeated' : 'neutral'}
          size={32}
          opacity={totalAvoids > 0 ? 1 : 0.5}
        />
        <Text style={styles.headerText} allowFontScaling numberOfLines={1}>
          {platformsCopy.groupHeader(parentCompany, totalAvoids)}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: theme.space.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface1,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderTopWidth: theme.borders.standard.width,
    borderTopColor: theme.colors.highlightBlue,
    borderBottomWidth: theme.borders.standard.width,
    borderBottomColor: theme.colors.bgVoid,
    gap: theme.space.sm,
  },
  headerText: {
    ...theme.type.displayS,
    color: theme.colors.rewardYellow,
    flex: 1,
  },
});
