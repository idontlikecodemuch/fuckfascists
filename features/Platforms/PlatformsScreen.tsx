import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { TRACKED_PLATFORMS } from './data/platformList';
import { usePlatformAvoidance } from './hooks/usePlatformAvoidance';
import { PlatformRow } from './components/PlatformRow';
import { formatWeekOf } from './utils/platformHelpers';
import type { PlatformItem } from './types';
import { platformsCopy } from '../../copy/platforms';

interface PlatformsScreenProps {
  adapter: StorageAdapter;
}

/**
 * Platform avoidance tracker.
 *
 * Users record each time they avoided a tracked digital platform.
 * Each tap immediately records a PlatformAvoidEvent (date-only, no location)
 * and increments the daily count. The weekly tally resets on Monday.
 */
export function PlatformsScreen({ adapter }: PlatformsScreenProps) {
  const { weekOf, items, totalAvoids, loading, avoid } = usePlatformAvoidance(adapter, TRACKED_PLATFORMS);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {platformsCopy.title}
        </Text>
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
          color="#CC0000"
          accessibilityLabel={platformsCopy.loading}
        />
      ) : (
        <FlatList<PlatformItem>
          data={items}
          keyExtractor={(item) => item.platform.id}
          renderItem={({ item }) => (
            <PlatformRow item={item} onAvoid={() => avoid(item.platform.id)} />
          )}
          contentContainerStyle={styles.list}
          accessibilityRole="list"
          accessibilityLabel={platformsCopy.checklist}
        />
      )}
    </SafeAreaView>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const AMBER = '#CC7A00';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: WHITE },
  header:     { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: '#CC0000' },
  title:      { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  weekLabel:  { fontFamily: MONO, fontSize: 13, color: '#CCC', marginTop: 2 },
  score:      { fontFamily: MONO, fontSize: 13, color: AMBER, marginTop: 4 },
  loader:     { flex: 1, justifyContent: 'center' },
  list:       { paddingBottom: 32 },
});
