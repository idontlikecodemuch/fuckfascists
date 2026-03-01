import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import type { StorageAdapter } from '../../core/data';
import { TRACKED_PLATFORMS } from './data/platforms';
import { useWeeklySurvey } from './hooks/useWeeklySurvey';
import { PlatformRow } from './components/PlatformRow';
import { formatWeekOf } from './utils/surveyHelpers';
import type { SurveyItem } from './types';

interface SurveyScreenProps {
  adapter: StorageAdapter;
}

/**
 * Weekly platform checklist.
 *
 * Users confirm which digital platforms they avoided this week.
 * Each tap immediately records a PlatformAvoidEvent (date-only, no location).
 * The screen is stateless across weeks — next Monday it resets automatically.
 */
export function SurveyScreen({ adapter }: SurveyScreenProps) {
  const { weekOf, items, loading, avoid } = useWeeklySurvey(adapter, TRACKED_PLATFORMS);

  const avoided = items.filter((i) => i.avoided).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          WEEKLY CHECK-IN
        </Text>
        <Text style={styles.weekLabel} allowFontScaling>
          {formatWeekOf(weekOf)}
        </Text>
        <Text style={styles.score} allowFontScaling>
          {avoided} / {items.length} avoided
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          color="#CC0000"
          accessibilityLabel="Loading this week's survey"
        />
      ) : (
        <FlatList<SurveyItem>
          data={items}
          keyExtractor={(item) => item.platform.id}
          renderItem={({ item }) => (
            <PlatformRow item={item} onAvoid={() => avoid(item.platform.id)} />
          )}
          contentContainerStyle={styles.list}
          accessibilityRole="list"
          accessibilityLabel="Platform checklist"
        />
      )}
    </SafeAreaView>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: WHITE },
  header:     { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: '#CC0000' },
  title:      { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  weekLabel:  { fontFamily: MONO, fontSize: 13, color: '#CCC', marginTop: 2 },
  score:      { fontFamily: MONO, fontSize: 13, color: '#3CB371', marginTop: 4 },
  loader:     { flex: 1, justifyContent: 'center' },
  list:       { paddingBottom: 32 },
});
