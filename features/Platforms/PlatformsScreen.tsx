import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { TRACKED_PLATFORMS } from './data/platformList';
import { usePlatformAvoidance } from './hooks/usePlatformAvoidance';
import { usePlatformRoster } from './hooks/usePlatformRoster';
import { PlatformRow } from './components/PlatformRow';
import { PlatformSetupScreen } from './components/PlatformSetupScreen';
import { formatWeekOf } from './utils/platformHelpers';
import type { PlatformItem } from './types';
import { platformsCopy } from '../../copy/platforms';
import { useNudgeNotification } from './hooks/useNudgeNotification';
import { theme } from '../../design/tokens';

interface PlatformsScreenProps {
  adapter: StorageAdapter;
}

/**
 * Platform avoidance tracker.
 *
 * On first use, shows a setup screen for the user to select which platforms
 * to track. After setup, shows the main platform list filtered to the user's
 * roster. An EDIT button in the header reopens the setup screen.
 */
export function PlatformsScreen({ adapter }: PlatformsScreenProps) {
  const { selectedIds, saveSelection } = usePlatformRoster();
  const [editing, setEditing] = useState(false);

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
        <View style={styles.headerTop}>
          <Text style={styles.title} accessibilityRole="header" allowFontScaling>
            {platformsCopy.title}
          </Text>
          <Pressable
            onPress={() => setEditing(true)}
            style={styles.editBtn}
            accessibilityRole="button"
            accessibilityLabel={platformsCopy.editLabel}
          >
            <Text style={styles.editText} allowFontScaling>{platformsCopy.editBtn}</Text>
          </Pressable>
        </View>
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
        <FlatList<PlatformItem>
          data={items}
          keyExtractor={(item) => item.platform.id}
          renderItem={({ item }) => (
            <PlatformRow
              item={item}
              weekOf={weekOf}
              onAvoid={() => avoid(item.platform.id)}
              onAvoidDate={(date) => avoidForDate(item.platform.id, date)}
            />
          )}
          contentContainerStyle={styles.list}
          accessibilityRole="list"
          accessibilityLabel={platformsCopy.checklist}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: theme.colors.bgVoid },
  header:     { backgroundColor: theme.colors.bgNav, padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:      { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  editBtn:    { minWidth: theme.a11y.minTapTarget, minHeight: theme.a11y.minTapTarget, borderWidth: theme.borders.standard.width, borderColor: theme.colors.rewardYellow, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  editText:   { ...theme.type.caption, fontWeight: 'bold', color: theme.colors.rewardYellow, letterSpacing: 1 },
  weekLabel:  { ...theme.type.bodyS, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  score:      { ...theme.type.bodyS, fontSize: 13, color: theme.colors.rewardYellow, marginTop: theme.space.xs },
  loader:     { flex: 1, justifyContent: 'center' },
  list:       { paddingBottom: theme.space['3xl'] },
});
