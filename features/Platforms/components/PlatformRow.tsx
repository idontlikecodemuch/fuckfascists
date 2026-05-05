import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { fillSelf, flexChild } from '../../../design/layout';
import { getLocalDateString } from '../../../core/utils/localDate';
import { SparkleDecoration } from '../../../core/fx';
import type { PlatformItem } from '../types';
import { getDisplayFigure } from '../context/TrackContext';
import { AvoidButton } from './AvoidButton';
import { FigureBadge } from './FigureBadge';
import {
  TRACK_BUTTON_WIDTH,
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
  /** True when this is the last platform/child row in its panel — the
   *  panelBottomCap follows immediately so no row-bottom rule needed.
   *  When false, the row gets a subtle separator that crosses the whole
   *  row width (including under the AVOID button). */
  isLastInGroup: boolean;
  expanded: boolean;
  dimmed: boolean;
  onRowPress: () => void;
  onAvoidPress: () => void;
  /** Tap handler for the inline SEE FILE link — opens the platform's
   *  business card. Only renders when present and !isChild (top-level
   *  rows only; child rows under a group share the parent's SEE FILE). */
  onSeeFile?: () => void;
}

// Sprite-screen has a single 1px right divider only — top/left/bottom are
// already provided by the surrounding panel bevel + cap edges. The inner
// FigureBadge size accounts for the right border so the sprite stays
// inside the cyan box on every side — no spill on uncovered edges.
const SPRITE_SCREEN_BORDER = 1;
const SPRITE_INNER_SIZE = TRACK_ROW_SPRITE_SIZE - SPRITE_SCREEN_BORDER;

export function PlatformRow({
  item,
  isChild,
  focused,
  panelFocused,
  isLastInGroup,
  expanded,
  dimmed,
  onRowPress,
  onAvoidPress,
  onSeeFile,
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
        !isLastInGroup && styles.rowSeparator,
        panelFocused && styles.panelFocusedRow,
        panelFocused && isChild && styles.panelFocusedChildRow,
        panelFocused && !isLastInGroup && styles.panelFocusedRowSeparator,
        focused && styles.focusedRow,
        focused && expanded && styles.focusedExpandedRow,
      ]}
    >
      {!isChild && (
        <>
          <View style={styles.gradTop} pointerEvents="none" />
          <View style={styles.gradBot} pointerEvents="none" />
        </>
      )}
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
          <View style={styles.nameRow}>
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
            {!isChild && onSeeFile && (
              <Pressable
                onPress={onSeeFile}
                style={styles.seeFileLink}
                accessibilityRole="button"
                accessibilityLabel={platformsCopy.seeFileA11y(item.platform.name)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons
                  name="folder-outline"
                  size={11}
                  color={theme.colors.highlightBlue}
                  style={styles.seeFileIcon}
                />
                <Text style={styles.seeFileLabel} allowFontScaling>
                  {platformsCopy.seeFileLabel}
                </Text>
              </Pressable>
            )}
          </View>
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
    ...fillSelf,
    flexDirection: 'row',
    alignItems: 'center',
    // Row height tracks the sprite-screen — sprite, button, and row all
    // share one vertical dimension so the button reads as a flush slice.
    minHeight: TRACK_ROW_SPRITE_SIZE,
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    paddingVertical: TRACK_ROW_PADDING_VERTICAL,
    backgroundColor: theme.colors.panelInner,
    overflow: 'visible',
  },
  // Sub-rows sit slightly recessed below the gradient-lit parent header.
  // Both default + focused states use a darker bg than the parent — focused
  // uses trackFocusBgDeep (set by panelFocusedChildRow), default uses the
  // even-deeper panelOuter so children blend with the panel side bevels.
  childRow: {
    paddingLeft: TRACK_CHILD_INDENT,
    paddingVertical: TRACK_CHILD_ROW_PADDING_VERTICAL,
    backgroundColor: theme.colors.panelOuter,
  },
  // Subtle bottom rule for any non-last row in a panel — crosses the full
  // row width (including under the AVOID button) so stacked rows read as a
  // separated stack. Color shifts to focusBevelDark in a focused panel.
  rowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.panelBorder,
  },
  panelFocusedRowSeparator: {
    borderBottomColor: theme.colors.focusBevelDark,
  },
  // Any row inside a focused panel — including non-selected siblings under a
  // focused group header — picks up the cyan tint so the panel reads as one
  // continuously filled cell rather than dark rows inside a cyan frame.
  panelFocusedRow: {
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
  },
  // Sub-rows inside a focused multi-row panel use a slightly darker cyan
  // so the gradient-lit parent header reads as raised in front of them.
  panelFocusedChildRow: {
    backgroundColor: theme.colors.trackFocusBgDeep,
  },
  // Focused row: same cyan fill as panelFocusedRow. The selected row is
  // distinguished by name color (focusText) + SparkleDecoration, not by bg.
  focusedRow: {
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
  },
  // When the focused row is also expanded (day-circles open), draw a cyan
  // bottom rule between the row and the day-circles strip so the strip reads
  // as a separate sub-zone of the same focused panel.
  focusedExpandedRow: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.focusBevelDark,
  },
  rowBody: {
    flex: 1,
    ...flexChild,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: TRACK_ROW_SPRITE_SIZE,
  },
  dimmedBody: {
    opacity: TRACK_ROW_DIMMED_OPACITY,
  },
  // 2-step gradient overlay on top-level rows (singletons + group headers
  // get this in their own component). Top half adds a subtle highlight,
  // bottom adds a subtle shadow — together they fake a curved/raised
  // surface like the multi-folder POI selection list. Right edge stops at
  // the AVOID button's left edge so the button stays a flat slice.
  gradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: TRACK_BUTTON_WIDTH,
    height: '45%',
    backgroundColor: '#FFFFFF',
    opacity: 0.10,
  },
  gradBot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: TRACK_BUTTON_WIDTH,
    height: '35%',
    backgroundColor: '#000000',
    opacity: 0.28,
  },
  // Sprite "screen": full-row-height column with cyan tint and a soft cyan
  // glow. Only a right divider — the panel cap + sides already contain the
  // sprite on top/left/bottom, so additional borders there would double up.
  spriteScreen: {
    width: TRACK_ROW_SPRITE_SIZE,
    height: TRACK_ROW_SPRITE_SIZE,
    backgroundColor: theme.colors.trackFocusTint,
    borderRightWidth: SPRITE_SCREEN_BORDER,
    borderRightColor: theme.colors.focusAccent,
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
    ...flexChild,
    gap: 1,
    paddingHorizontal: theme.space.md,
  },
  // Inline row holding the platform name + the SEE FILE link.
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  // Tappable inline link to open the platform's business card. Body font,
  // smaller than the platform name, with a folder icon (matches the manila
  // folder metaphor used across the app).
  seeFileLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeFileIcon: {
    marginRight: 3,
  },
  seeFileLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: theme.colors.highlightBlue,
  },
  name: {
    flexShrink: 1,
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
