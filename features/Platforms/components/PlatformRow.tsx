import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { getLocalDateString } from '../../../core/utils/localDate';
import { SparkleDecoration } from '../../../core/fx';
import type { PlatformItem } from '../types';
import { getDisplayFigure } from '../context/TrackContext';
import { AvoidButton } from './AvoidButton';
import { FigureBadge } from './FigureBadge';
import {
  TRACK_CHILD_INDENT,
  TRACK_CHILD_FONT_SIZE_COUNT,
  TRACK_CHILD_FONT_SIZE_NAME,
  TRACK_CHILD_ROW_PADDING_VERTICAL,
  TRACK_ROW_DIMMED_OPACITY,
  TRACK_ROW_FACE_ANCHOR_X,
  TRACK_ROW_FACE_ANCHOR_Y,
  TRACK_ROW_FOCUS_BG_COLOR,
  TRACK_ROW_FONT_SIZE_COUNT,
  TRACK_ROW_FONT_SIZE_NAME,
  TRACK_ROW_FONT_SIZE_SUBTITLE,
  TRACK_ROW_PADDING_HORIZONTAL,
  TRACK_ROW_PADDING_VERTICAL,
  TRACK_ROW_SPRITE_SIZE,
  TRACK_SPRITE_BUST_CROP_RATIO,
} from '../../../config/constants';

interface PlatformRowProps {
  item: PlatformItem;
  isChild: boolean;
  focused: boolean;
  /** True when this row sits inside a panel that contains the focused row.
   *  Sibling rows in a focused group use this to pick up the focus tint so
   *  the whole cyan-bevel panel reads as one filled cell. */
  panelFocused: boolean;
  expanded: boolean;
  dimmed: boolean;
  onRowPress: () => void;
  onAvoidPress: () => void;
}

// Sprite renders inside the screen container with a 1px border, so the
// rendered sprite size is the column size minus the two border edges.
const SPRITE_SCREEN_BORDER = 1;
const SPRITE_INNER_SIZE = TRACK_ROW_SPRITE_SIZE - SPRITE_SCREEN_BORDER * 2;

export function PlatformRow({
  item,
  isChild,
  focused,
  panelFocused,
  expanded,
  dimmed,
  onRowPress,
  onAvoidPress,
}: PlatformRowProps) {
  const figureName = getDisplayFigure(item.platform);
  const todayAvoided = (item.dayCounts.get(getLocalDateString()) ?? 0) > 0;
  const countLabel = item.weeklyCount > 0
    ? platformsCopy.countLabel(item.weeklyCount)
    : '';

  return (
    <View
      style={[
        styles.row,
        isChild && styles.childRow,
        panelFocused && styles.panelFocusedRow,
        focused && styles.focusedRow,
        focused && expanded && styles.focusedExpandedRow,
      ]}
    >
      <Pressable
        onPress={onRowPress}
        style={[styles.rowBody, dimmed && styles.dimmedBody]}
        accessibilityRole="button"
        accessibilityLabel={
          expanded
            ? platformsCopy.collapseLabel(item.platform.name)
            : platformsCopy.expandLabel(item.platform.name)
        }
        accessibilityState={{ expanded }}
      >
          {!isChild && (
            <View style={styles.spriteScreen}>
              <FigureBadge
                figureName={figureName}
                state="neutral"
                size={SPRITE_INNER_SIZE}
                cropRatio={TRACK_SPRITE_BUST_CROP_RATIO}
                faceAnchorX={TRACK_ROW_FACE_ANCHOR_X}
                faceAnchorY={TRACK_ROW_FACE_ANCHOR_Y}
              />
            </View>
        )}

        <View style={styles.nameColumn}>
          <Text
            style={[
              styles.name,
              isChild && styles.childName,
              focused && styles.nameFocused,
              isChild && focused && styles.childNameFocused,
            ]}
            numberOfLines={1}
            allowFontScaling
          >
            {item.platform.name}
          </Text>
          {!isChild && (
            <Text style={styles.subtitle} numberOfLines={1} allowFontScaling>
              {figureName}
            </Text>
          )}
        </View>

        {countLabel !== '' && (
          <Text
            style={[styles.count, isChild && styles.childCount, styles.countActive]}
            allowFontScaling
            accessibilityLabel={platformsCopy.countA11y(item.weeklyCount, item.platform.name)}
          >
            {countLabel}
          </Text>
        )}
      </Pressable>

      <AvoidButton
        avoidedToday={todayAvoided}
        platformName={item.platform.name}
        onPress={onAvoidPress}
      />

      {focused && <SparkleDecoration />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.a11y.minTapTarget,
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    paddingVertical: TRACK_ROW_PADDING_VERTICAL,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bevelDark,
    backgroundColor: theme.colors.panelInner,
    overflow: 'visible',
  },
  childRow: {
    paddingLeft: TRACK_CHILD_INDENT,
    paddingVertical: TRACK_CHILD_ROW_PADDING_VERTICAL,
    backgroundColor: theme.colors.panelInner,
  },
  // Any row inside a focused panel — including non-selected siblings under a
  // focused group header — picks up the cyan tint so the panel reads as one
  // continuously filled cell rather than dark rows inside a cyan frame.
  // Bottom border drops to 0 so the row content sits flush against the
  // panelBottomCap's cyan bevel — no dark separator inside the frame.
  panelFocusedRow: {
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
    borderBottomWidth: 0,
  },
  // Focused row: same cyan fill as panelFocusedRow. The selected row is
  // distinguished by name color (focusText) + SparkleDecoration, not by bg.
  focusedRow: {
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
  },
  focusedExpandedRow: {
    borderBottomWidth: 0,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
  },
  dimmedBody: {
    opacity: TRACK_ROW_DIMMED_OPACITY,
  },
  // Sprite "screen": full-row-height column with cyan tint + focusAccent edge
  // and a soft cyan glow. Always-on (not focus-gated) — the sprite reads as
  // a backlit panel in every row.
  spriteScreen: {
    width: TRACK_ROW_SPRITE_SIZE,
    height: TRACK_ROW_SPRITE_SIZE,
    backgroundColor: theme.colors.trackFocusTint,
    borderWidth: SPRITE_SCREEN_BORDER,
    borderColor: theme.colors.focusAccent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: theme.glow.colorHighlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: theme.glow.highlightBlurRadius,
    elevation: 2,
  },
  nameColumn: {
    flex: 1,
    gap: 1,
    paddingHorizontal: theme.space.md,
  },
  name: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_NAME,
    color: theme.colors.textPrimary,
  },
  nameFocused: {
    color: theme.colors.focusText,
  },
  childName: {
    fontSize: TRACK_CHILD_FONT_SIZE_NAME,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textSecondary,
  },
  childNameFocused: {
    color: theme.colors.focusText,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: TRACK_ROW_FONT_SIZE_SUBTITLE,
    color: theme.colors.textSecondary,
  },
  count: {
    minWidth: 28,
    textAlign: 'right',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_COUNT,
    color: theme.colors.textSecondary,
    paddingRight: theme.space.sm,
  },
  childCount: {
    fontSize: TRACK_CHILD_FONT_SIZE_COUNT,
  },
  countActive: {
    color: theme.colors.dangerRed,
  },
});
