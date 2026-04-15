import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SURFACE_MAP, SURFACE_SCAN, SURFACE_TRACK } from '../../../config/constants';
import { theme } from '../../../design/tokens';

const ICON_SIZE = 12;

const SURFACE_ICONS: Record<number, { name: keyof typeof Ionicons.glyphMap; label: string }> = {
  [SURFACE_MAP]: { name: 'location-sharp', label: 'Map' },
  [SURFACE_SCAN]: { name: 'barcode-sharp', label: 'Scan' },
  [SURFACE_TRACK]: { name: 'checkmark-circle', label: 'Track' },
};

interface SurfaceIconsProps {
  surfaces: Set<number>;
}

/** Renders small glyphs indicating which surfaces contributed avoids. */
export function SurfaceIcons({ surfaces }: SurfaceIconsProps) {
  if (surfaces.size === 0) return null;

  return (
    <View style={styles.row} accessibilityLabel={buildA11y(surfaces)}>
      {[...surfaces].sort().map((s) => {
        const icon = SURFACE_ICONS[s];
        if (!icon) return null;
        return (
          <Ionicons
            key={s}
            name={icon.name}
            size={ICON_SIZE}
            color={theme.colors.textSecondary}
          />
        );
      })}
    </View>
  );
}

function buildA11y(surfaces: Set<number>): string {
  return [...surfaces]
    .sort()
    .map((s) => SURFACE_ICONS[s]?.label ?? '')
    .filter(Boolean)
    .join(', ');
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
});
