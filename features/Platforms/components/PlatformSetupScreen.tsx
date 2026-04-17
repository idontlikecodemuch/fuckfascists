import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import type { Platform } from '../types';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { getDefaultSelectedIds } from '../hooks/usePlatformRoster';
import { theme } from '../../../design/tokens';
import { bevelRaised, bevelInset, bevelGreenRaised, bevelGreenInset, bevelAmberRaised, glowDividerLine } from '../../../design/bevel';
import { StarField, NeonRule } from '../../Info/components/InfoDecorations';
import { SparkleDecoration } from '../../../core/fx';

interface PlatformSetupScreenProps {
  platforms: Platform[];
  /** Pre-selected IDs when editing an existing roster. Undefined for first-time setup. */
  initialSelection?: string[];
  onDone: (selectedIds: string[]) => Promise<void>;
}

const COLUMN_GAP = theme.space.sm;

/**
 * Character-select screen for choosing which platforms to track.
 * Shown on first use (no prior roster) or when the user taps EDIT.
 *
 * 2-column grid of compact beveled cells. Selected platforms sort to
 * the top with green bevel treatment; unselected use grey bevel.
 *
 * All user-facing strings imported from copy/platforms.ts.
 */
export function PlatformSetupScreen({ platforms, initialSelection, onDone }: PlatformSetupScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const ids = initialSelection ?? getDefaultSelectedIds();
    return new Set(ids);
  });

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDone = useCallback(async () => {
    await onDone([...selected]);
  }, [onDone, selected]);

  // Sort preselected platforms to top on initial render only.
  // Uses the initial selection set (stable), not the live `selected` state,
  // so the grid doesn't reorder as the user taps.
  const initialSet = useMemo(
    () => new Set(initialSelection ?? getDefaultSelectedIds()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const sortedPlatforms = useMemo(
    () => [...platforms].sort((a, b) => {
      const aTop = initialSet.has(a.id) ? 0 : 1;
      const bTop = initialSet.has(b.id) ? 0 : 1;
      return aTop - bTop;
    }),
    [platforms, initialSet],
  );

  const renderItem = useCallback(({ item }: { item: Platform }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        onPress={() => toggle(item.id)}
        style={[styles.cell, isSelected ? styles.cellSelected : styles.cellDefault]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={item.name}
      >
        {isSelected && <View style={styles.greenAccent} />}
        <View style={styles.cellContent}>
          <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : styles.checkboxDefault]}>
            {isSelected && (
              <Text style={styles.check} allowFontScaling={false}>{sharedCopy.checkmark}</Text>
            )}
          </View>
          <Text
            style={[styles.cellName, isSelected && styles.cellNameSelected]}
            allowFontScaling
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
      </Pressable>
    );
  }, [selected, toggle]);

  return (
    <SafeAreaView style={styles.container}>
      <StarField seed="platform-setup" />

      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {platformsCopy.setupTitle}
        </Text>
        <Text style={styles.subhead} allowFontScaling>
          {platformsCopy.setupSubhead}
        </Text>
      </View>
      <NeonRule />

      <FlatList<Platform>
        data={sortedPlatforms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footerDivider} />
      <View style={styles.footer}>
        <View style={{ overflow: 'visible' }}>
          <Pressable
            onPress={handleDone}
            style={[styles.doneBtn, selected.size === 0 && styles.doneBtnDisabled]}
            disabled={selected.size === 0}
            accessibilityRole="button"
            accessibilityLabel={platformsCopy.setupDone}
          >
            <Text style={[styles.doneText, selected.size === 0 && styles.doneTextDisabled]} allowFontScaling>
              {platformsCopy.setupDone}
            </Text>
          </Pressable>
          {selected.size > 0 && <SparkleDecoration />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  header: { padding: theme.space.lg, paddingBottom: theme.space.sm },
  title: { ...theme.type.displayL, color: theme.colors.textPrimary, letterSpacing: 3 },
  subhead: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 6 },
  list: { padding: theme.space.md, paddingBottom: 80 },
  row: { gap: COLUMN_GAP, marginBottom: COLUMN_GAP },

  // ── Cell base ─────────────────────────────────────────────────────────────
  cell: {
    flex: 1,
    minHeight: theme.a11y.minTapTarget,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cellDefault: {
    ...bevelRaised,
    backgroundColor: theme.colors.panelInner,
  },
  cellSelected: {
    ...bevelGreenRaised,
    backgroundColor: theme.colors.successGreenDeep,
  },

  // ── Green left accent (selected only) ─────────────────────────────────────
  greenAccent: {
    width: 4,
    backgroundColor: theme.colors.successGreenText,
  },

  // ── Cell inner content ────────────────────────────────────────────────────
  cellContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.space.md,
    gap: theme.space.sm,
  },

  // ── Checkbox ──────────────────────────────────────────────────────────────
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDefault: {
    ...bevelInset,
    backgroundColor: theme.colors.panelOuter,
  },
  checkboxSelected: {
    ...bevelGreenInset,
    backgroundColor: theme.colors.successGreenDeep,
  },
  check: {
    fontFamily: theme.fonts.headline,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.successGreenText,
  },

  // ── Platform name ─────────────────────────────────────────────────────────
  cellName: {
    ...theme.type.uiLabel,
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  cellNameSelected: {
    color: theme.colors.textPrimary,
  },

  // ── Footer + DONE button ──────────────────────────────────────────────────
  footer: {
    padding: theme.space.lg,
    backgroundColor: theme.colors.bgVoid,
  },
  footerDivider: {
    ...glowDividerLine,
  },
  doneBtn: {
    ...bevelAmberRaised,
    backgroundColor: theme.colors.rewardYellow,
    borderRadius: theme.radii.button,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.sm,
  },
  doneBtnDisabled: {
    ...bevelRaised,
    backgroundColor: theme.colors.panelInner,
  },
  doneText: {
    ...theme.type.displayS,
    color: theme.colors.bgVoid,
    letterSpacing: 2,
  },
  doneTextDisabled: {
    color: theme.colors.textSecondary,
  },
});
