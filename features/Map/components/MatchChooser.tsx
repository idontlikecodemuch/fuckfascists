import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { ScanResult } from '../types';
import { CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface MatchChooserProps {
  results: ScanResult[];
  onSelect: (result: ScanResult) => void;
  onDismiss: () => void;
}

function ConfidenceTag({ level }: { level: number }) {
  const isVerified = level === 1.0;
  const label = isVerified ? sharedCopy.verified : sharedCopy.matched;
  return (
    <View
      style={[styles.tag, isVerified ? styles.tagVerified : styles.tagMatched]}
      accessibilityLabel={sharedCopy.confidenceA11y(label)}
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
          {mapCopy.chooserHeading(results.length)}
        </Text>

        <FlatList
          data={results}
          keyExtractor={(item) => item.entityId ?? item.fecCommitteeId}
          style={styles.list}
          renderItem={({ item }) => {
            const rowName = item.matchedAlias || item.canonicalName;
            return (
              <Pressable
                onPress={() => onSelect(item)}
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={mapCopy.chooserRow(rowName)}
              >
                <Text
                  style={styles.rowName}
                  numberOfLines={1}
                  allowFontScaling
                >
                  {rowName}
                </Text>
                {item.confidence < CONFIDENCE_THRESHOLD_HIGH && (
                  <ConfidenceTag level={item.confidence} />
                )}
                {item.confidence < CONFIDENCE_THRESHOLD_HIGH && (
                  <Text style={styles.rowWarning} allowFontScaling>{sharedCopy.warningIcon}</Text>
                )}
              </Pressable>
            );
          }}
        />

        <Pressable
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel={mapCopy.chooserDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissLabel} allowFontScaling>{sharedCopy.dismiss}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.frameBlue,
    borderWidth: theme.borders.hero.width,
    borderTopColor: theme.colors.highlightBlue,
    borderBottomColor: theme.colors.bgVoid,
    padding: theme.space.lg,
    margin: theme.space.sm,
    maxHeight: 300,
  },
  heading: {
    ...theme.type.displayS,
    color: theme.colors.rewardYellow,
    marginBottom: theme.space.sm,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: theme.space.sm,
    borderBottomWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    borderLeftWidth: theme.borders.hero.width,
    borderLeftColor: theme.colors.highlightBlue,
    backgroundColor: theme.colors.surface2,
    minHeight: theme.a11y.minTapTarget,
  },
  rowName: {
    flex: 1,
    ...theme.type.uiLabel,
    color: theme.colors.textPrimary,
    marginRight: theme.space.sm,
  },
  rowWarning: {
    fontSize: 14,
    marginLeft: theme.space.xs,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: theme.borders.standard.width,
  },
  tagVerified: {
    backgroundColor: theme.colors.successGreen,
    borderColor: theme.colors.successGreen,
  },
  tagMatched: {
    backgroundColor: theme.colors.rewardYellow,
    borderColor: theme.colors.rewardYellow,
  },
  tagText: {
    ...theme.type.caption,
    fontSize: 10,
    color: theme.colors.bgVoid,
    fontWeight: 'bold',
  },
  dismissButton: {
    minHeight: theme.a11y.minTapTarget,
    paddingVertical: 10,
    paddingHorizontal: theme.space.lg,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.space.sm,
  },
  dismissLabel: {
    ...theme.type.bodyS,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
});
