import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { TRACKED_PLATFORMS } from './data/platformList';
import { usePlatformAvoidance } from './hooks/usePlatformAvoidance';
import { usePlatformRoster } from './hooks/usePlatformRoster';
import { PlatformRow } from './components/PlatformRow';
import { PlatformSetupScreen } from './components/PlatformSetupScreen';
import { GameArena } from './components/GameArena';
import { PlatformGroup } from './components/PlatformGroup';
import { formatWeekOf } from './utils/platformHelpers';
import type { PlatformItem } from './types';
import { platformsCopy } from '../../copy/platforms';
import { useNudgeNotification } from './hooks/useNudgeNotification';
import { nameToSpriteId } from '../../core/sprites/spriteLoader';
import { theme } from '../../design/tokens';

interface PlatformsScreenProps {
  adapter: StorageAdapter;
}

/** Dedupe figures by display name for the arena grid. */
function buildArenaFigures(items: PlatformItem[]) {
  const seen = new Map<string, number>();
  for (const { platform, weeklyCount } of items) {
    const name = platform.publicFigureName ?? platform.ceoName;
    seen.set(name, (seen.get(name) ?? 0) + weeklyCount);
  }
  return [...seen.entries()].map(([name, totalAvoids]) => ({
    name,
    spriteId: nameToSpriteId(name),
    totalAvoids,
  }));
}

/** Short display name for group headers — strips Inc, Corp, Platforms, .com suffixes. */
function shortParentName(name: string): string {
  return name
    .replace(/\s*(Inc|Corp|Platforms|\.com)\s*/gi, '')
    .trim()
    .toUpperCase();
}

/** Group items by parentCompany, preserving order of first appearance. */
function groupByParent(items: PlatformItem[]) {
  const groups: { parent: string; shortName: string; figure: string; items: PlatformItem[] }[] = [];
  const idx = new Map<string, number>();
  for (const item of items) {
    const parent = item.platform.parentCompany;
    const existing = idx.get(parent);
    if (existing !== undefined) {
      groups[existing].items.push(item);
    } else {
      idx.set(parent, groups.length);
      groups.push({
        parent,
        shortName: shortParentName(parent),
        figure: item.platform.publicFigureName ?? item.platform.ceoName,
        items: [item],
      });
    }
  }
  return groups;
}

/**
 * Platform avoidance tracker.
 *
 * On first use, shows a setup screen for the user to select which platforms
 * to track. After setup, shows the main platform list filtered to the user's
 * roster. An EDIT button in the header reopens the setup screen.
 *
 * Restructured: game arena at top, platforms grouped by parent company.
 */
export function PlatformsScreen({ adapter }: PlatformsScreenProps) {
  const { selectedIds, saveSelection } = usePlatformRoster();
  const [editing, setEditing] = useState(false);
  const lastAvoidedRef = useRef<string | null>(null);
  const [lastAvoided, setLastAvoided] = useState<string | null>(null);

  // Schedule Thursday evening nudge notification (silently skips if permission denied)
  useNudgeNotification();

  // Filter platforms to the user's roster
  const activePlatforms = useMemo(() => {
    if (!selectedIds) return TRACKED_PLATFORMS;
    const idSet = new Set(selectedIds);
    return TRACKED_PLATFORMS.filter((p) => idSet.has(p.id));
  }, [selectedIds]);

  const { weekOf, items, totalAvoids, loading, avoid, avoidForDate } =
    usePlatformAvoidance(adapter, activePlatforms);

  const arenaFigures = useMemo(() => buildArenaFigures(items), [items]);
  const grouped = useMemo(() => groupByParent(items), [items]);

  const handleAvoid = useCallback(
    async (platformId: string) => {
      const platform = activePlatforms.find((p) => p.id === platformId);
      if (platform) {
        const figureName = platform.publicFigureName ?? platform.ceoName;
        lastAvoidedRef.current = figureName;
        setLastAvoided(figureName);
      }
      await avoid(platformId);
    },
    [avoid, activePlatforms]
  );

  // Loading roster from SecureStore
  if (selectedIds === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.loader} color={theme.colors.dangerRed} accessibilityLabel={platformsCopy.loading} />
      </SafeAreaView>
    );
  }

  // First-time setup or editing
  if (selectedIds === undefined || editing) {
    return (
      <PlatformSetupScreen
        platforms={TRACKED_PLATFORMS}
        initialSelection={editing && selectedIds ? selectedIds : undefined}
        onDone={async (ids) => {
          await saveSelection(ids);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {platformsCopy.title}
        </Text>
        <Pressable
          onPress={() => setEditing(true)}
          style={styles.editBtn}
          accessibilityRole="button"
          accessibilityLabel={platformsCopy.editLabel}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.editText} allowFontScaling>{platformsCopy.editLabel}</Text>
        </Pressable>
        <Text style={styles.weekLabel} allowFontScaling>
          {platformsCopy.weekLabel(formatWeekOf(weekOf))}
        </Text>
        <Text style={styles.score} allowFontScaling>
          {platformsCopy.score(totalAvoids)}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          color={theme.colors.dangerRed}
          accessibilityLabel={platformsCopy.loading}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} accessibilityLabel={platformsCopy.checklist}>
          {/* Game Arena */}
          <GameArena figures={arenaFigures} lastAvoided={lastAvoided} />

          {/* Grouped platform rows */}
          {grouped.map((group) => {
            const groupAvoids = group.items.reduce((sum, i) => sum + i.weeklyCount, 0);
            const isSingleton = group.items.length === 1;

            if (isSingleton) {
              // Standalone platform — no group header
              const item = group.items[0];
              return (
                <PlatformRow
                  key={item.platform.id}
                  item={item}
                  weekOf={weekOf}
                  onAvoid={() => handleAvoid(item.platform.id)}
                  onAvoidDate={(date) => avoidForDate(item.platform.id, date)}
                />
              );
            }

            return (
              <PlatformGroup
                key={group.parent}
                parentCompany={group.shortName}
                figureName={group.figure}
                totalAvoids={groupAvoids}
              >
                {group.items.map((item) => (
                  <PlatformRow
                    key={item.platform.id}
                    item={item}
                    weekOf={weekOf}
                    onAvoid={() => handleAvoid(item.platform.id)}
                    onAvoidDate={(date) => avoidForDate(item.platform.id, date)}
                    hideSprite
                    compact
                  />
                ))}
              </PlatformGroup>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: theme.colors.bgVoid },
  header:     { backgroundColor: theme.colors.bgNav, padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  title:      { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  editBtn:    { minHeight: theme.a11y.minTapTarget, justifyContent: 'center' },
  editText:   { ...theme.type.bodyS, color: theme.colors.textSecondary },
  weekLabel:  { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 2 },
  score:      { ...theme.type.displayL, color: theme.colors.rewardYellow, marginTop: theme.space.xs },
  loader:     { flex: 1, justifyContent: 'center' },
  list:       { paddingBottom: theme.space['3xl'] },
});
