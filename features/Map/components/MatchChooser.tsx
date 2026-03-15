import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { ScanResult } from '../types';
import { CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';

interface MatchChooserProps {
  results: ScanResult[];
  onSelect: (result: ScanResult) => void;
  onDismiss: () => void;
}

function ConfidenceTag({ level }: { level: number }) {
  const isVerified = level === 1.0;
  const label = isVerified ? 'VERIFIED' : 'MATCHED';
  return (
    <View
      style={[styles.tag, isVerified ? styles.tagVerified : styles.tagMatched]}
      accessibilityLabel={`Confidence: ${label}`}
    >
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

/**
 * Bottom-anchored overlay shown when a single map tap returns 2+ matched
 * entities. Lets the user pick which business to inspect.
 *
 * All matched entities also appear as map markers for visual context —
 * the chooser is the primary interaction path for multi-match taps.
 */
export function MatchChooser({ results, onSelect, onDismiss }: MatchChooserProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text
          style={styles.heading}
          accessibilityRole="header"
          allowFontScaling
        >
          {results.length} MATCHES FOUND
        </Text>

        <FlatList
          data={results}
          keyExtractor={(item) => item.entityId ?? item.fecCommitteeId}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.canonicalName}`}
            >
              <Text
                style={styles.rowName}
                numberOfLines={1}
                allowFontScaling
              >
                {item.canonicalName}
              </Text>
              <ConfidenceTag level={item.confidence} />
              {item.confidence < CONFIDENCE_THRESHOLD_HIGH && (
                <Text style={styles.rowWarning} allowFontScaling>⚠</Text>
              )}
            </Pressable>
          )}
        />

        <Pressable
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss match chooser"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissLabel} allowFontScaling>DISMISS</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles — matches BusinessCard 8-bit palette ──────────────────────────────

const BLACK  = '#1A1A1A';
const WHITE  = '#F5F5F0';
const AMBER  = '#CC7A00';
const MONO   = 'monospace' as const;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: WHITE,
    borderColor: BLACK,
    borderWidth: 4,
    padding: 16,
    margin: 8,
    maxHeight: 300,
  },
  heading: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: 'bold',
    color: BLACK,
    marginBottom: 8,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderColor: BLACK,
    minHeight: 44,
  },
  rowName: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: 'bold',
    color: BLACK,
    marginRight: 8,
  },
  rowWarning: {
    fontSize: 14,
    marginLeft: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
  },
  tagVerified: {
    backgroundColor: '#2E7D32',
    borderColor: '#1B5E20',
  },
  tagMatched: {
    backgroundColor: AMBER,
    borderColor: '#7A4800',
  },
  tagText: {
    fontFamily: MONO,
    fontSize: 10,
    color: WHITE,
    fontWeight: 'bold',
  },
  dismissButton: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: BLACK,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dismissLabel: {
    fontFamily: MONO,
    fontSize: 13,
    color: BLACK,
    fontWeight: 'bold',
  },
});
