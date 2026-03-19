/**
 * Platform avoidance component catalog sections. DEV ONLY.
 *
 * The Track screen was rebuilt from scratch — PlatformRow is no longer a
 * standalone component (rows are rendered by TrackRow inside TrackList).
 * These catalog entries show placeholder text until the catalog is updated
 * to use the new component architecture.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { theme } from '../../../design/tokens';

const Placeholder = ({ label }: { label: string }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText} allowFontScaling>{label}</Text>
    <Text style={styles.placeholderSub} allowFontScaling>
      Track screen rebuilt — open the Track tab to preview
    </Text>
  </View>
);

export const PlatformsPartial = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Platforms — Partial (3/6 active)">
    <Placeholder label="Track screen — partial avoids" />
  </CatalogSection>
));
PlatformsPartial.displayName = 'PlatformsPartial';

export const PlatformsFull = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Platforms — All Active">
    <Placeholder label="Track screen — all active" />
  </CatalogSection>
));
PlatformsFull.displayName = 'PlatformsFull';

export const PlatformsEmpty = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Platforms — Empty">
    <Placeholder label="Track screen — empty state" />
  </CatalogSection>
));
PlatformsEmpty.displayName = 'PlatformsEmpty';

export const PlatformRowAvoided = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="PlatformRow — Avoided (×5)">
    <Placeholder label="TrackRow — avoided state" />
  </CatalogSection>
));
PlatformRowAvoided.displayName = 'PlatformRowAvoided';

export const PlatformRowNotAvoided = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="PlatformRow — Not Avoided">
    <Placeholder label="TrackRow — not avoided state" />
  </CatalogSection>
));
PlatformRowNotAvoided.displayName = 'PlatformRowNotAvoided';

const styles = StyleSheet.create({
  placeholder: {
    padding: theme.space.lg,
    backgroundColor: theme.colors.surface1,
    alignItems: 'center',
    gap: theme.space.sm,
  },
  placeholderText: {
    ...theme.type.uiLabel,
    color: theme.colors.textPrimary,
  },
  placeholderSub: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
  },
});
