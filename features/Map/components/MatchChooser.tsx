import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { ScanResult } from '../types';
import { mapCopy } from '../../../copy/map';
import { bevelFocusRaised } from '../../../design/bevel';
import { theme } from '../../../design/tokens';

interface MatchChooserProps {
  results: ScanResult[];
  onSelect: (result: ScanResult) => void;
  onDismiss: () => void;
}

const TAB_HEIGHT = 14;
const TAB_WIDTH = 70;
const TAB_RIGHT = 6;
const FOLDER_BODY_HEIGHT = 65;
const PAPER_LIGHT_HEIGHT = 3;
const PAPER_SHADOW_HEIGHT = 1;
const PAPER_TOTAL_HEIGHT = PAPER_LIGHT_HEIGHT + PAPER_SHADOW_HEIGHT;
const VISIBLE_FOLDERS_BEFORE_SCROLL = 4;
const LIST_MAX_HEIGHT =
  TAB_HEIGHT +
  FOLDER_BODY_HEIGHT * VISIBLE_FOLDERS_BEFORE_SCROLL +
  theme.space.xs;

/**
 * Bottom-anchored overlay shown when a single map tap returns 2+ matched
 * entities. Cockpit cyan sheet wrapping a flush stack of manila-folder rows —
 * each successive folder's tab overlaps the previous folder body, reading
 * like a stack of nested file folders.
 *
 * All matched entities also appear as map markers for visual context —
 * the chooser is the primary interaction path for multi-match taps.
 */
export function MatchChooser({ results, onSelect, onDismiss }: MatchChooserProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.outer}>
        <View
          style={styles.sheet}
          accessibilityViewIsModal
          accessibilityLabel={mapCopy.chooserModalLabel}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.heading} accessibilityRole="header" allowFontScaling>
                {mapCopy.chooserHeading}
              </Text>
              <Text style={styles.subhead} allowFontScaling>
                {mapCopy.chooserSubhead}
              </Text>
            </View>
            <Pressable
              onPress={onDismiss}
              style={styles.dismiss}
              accessibilityRole="button"
              accessibilityLabel={mapCopy.chooserDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.dismissIcon} allowFontScaling={false}>
                {'\u00d7'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <FlatList
            data={results}
            keyExtractor={(item) => item.entityId ?? item.fecCommitteeId}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <FolderRow result={item} onSelect={onSelect} />
            )}
          />
        </View>
      </View>
    </View>
  );
}

function FolderRow({
  result,
  onSelect,
}: {
  result: ScanResult;
  onSelect: (r: ScanResult) => void;
}) {
  const name = result.matchedAlias || result.canonicalName;
  return (
    <View style={styles.row}>
      <View style={styles.tab} pointerEvents="none" />
      <Pressable
        onPress={() => onSelect(result)}
        style={styles.folder}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.chooserRow(name)}
      >
        <View style={styles.paperBorder} />
        <View style={styles.paperShadow} />
        <View style={styles.folderGradTop} />
        <View style={styles.folderGradBot} />
        <View style={styles.folderContent}>
          <Text style={styles.rowName} numberOfLines={1} allowFontScaling>
            {name}
          </Text>
          <Text style={styles.chevron} allowFontScaling={false}>
            {'\u203A'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  outer: {
    margin: theme.space.sm,
    shadowColor: theme.colors.focusAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  sheet: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.panelInner,
    paddingTop: theme.space.md,
    paddingHorizontal: theme.space.md,
    paddingBottom: theme.space.md,
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 6,
        blurRadius: theme.glow.blurRadius,
        spreadDistance: theme.glow.spreadDistance,
        inset: true,
        color: theme.glow.color,
      },
      {
        offsetX: 0,
        offsetY: -6,
        blurRadius: theme.glow.blurRadius,
        spreadDistance: theme.glow.spreadDistance,
        inset: true,
        color: theme.glow.color,
      },
    ],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.xs,
    paddingBottom: theme.space.sm,
  },
  headerText: { flex: 1 },
  heading: {
    ...theme.type.displayS,
    color: theme.colors.focusAccent,
    letterSpacing: 2,
  },
  subhead: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dismiss: {
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissIcon: {
    fontFamily: theme.fonts.headline,
    fontSize: 22,
    lineHeight: 24,
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.focusAccent,
    opacity: 0.4,
    marginBottom: theme.space.md,
  },
  list: {
    maxHeight: LIST_MAX_HEIGHT,
    overflow: 'visible',
  },
  listContent: {
    paddingTop: TAB_HEIGHT,
    paddingBottom: theme.space.xs,
  },
  row: {
    overflow: 'visible',
    height: FOLDER_BODY_HEIGHT,
  },
  tab: {
    position: 'absolute',
    top: -TAB_HEIGHT,
    right: TAB_RIGHT,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    backgroundColor: theme.colors.folderBg,
    borderTopLeftRadius: theme.radii.folderTab,
    borderTopRightRadius: theme.radii.folderTab,
    borderTopWidth: 1,
    borderTopColor: theme.colors.documentText,
    zIndex: 2,
  },
  folder: {
    backgroundColor: theme.colors.folderBg,
    height: FOLDER_BODY_HEIGHT,
    overflow: 'hidden',
  },
  folderGradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: theme.colors.folderBgLight,
    opacity: 0.55,
  },
  folderGradBot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: theme.colors.folderBgDark,
    opacity: 0.45,
  },
  paperBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PAPER_LIGHT_HEIGHT,
    backgroundColor: theme.colors.documentBg,
    zIndex: 1,
  },
  paperShadow: {
    position: 'absolute',
    top: PAPER_LIGHT_HEIGHT,
    left: 0,
    right: 0,
    height: PAPER_SHADOW_HEIGHT,
    backgroundColor: theme.colors.documentShadow,
    zIndex: 1,
  },
  folderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: PAPER_TOTAL_HEIGHT,
    paddingHorizontal: theme.space.lg,
    zIndex: 2,
  },
  rowName: {
    flex: 1,
    fontFamily: theme.fonts.headline,
    fontSize: 22,
    letterSpacing: 1,
    color: theme.colors.documentText,
    marginRight: theme.space.sm,
  },
  chevron: {
    fontFamily: theme.fonts.headline,
    fontSize: 24,
    color: theme.colors.documentText,
    opacity: 0.55,
  },
});
