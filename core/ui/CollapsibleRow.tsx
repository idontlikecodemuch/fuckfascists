import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CollapsibleRowProps {
  /** Whether the expanded section is visible. */
  expanded: boolean;
  /** Called when the header is pressed — parent controls the toggle. */
  onToggle: () => void;
  /** The always-visible header content. */
  renderHeader: () => React.ReactNode;
  /** The content shown when expanded. Receives `expanded` for conditional rendering. */
  renderExpanded: () => React.ReactNode;
  /** Optional — marks this as a child/indented row. */
  isChild?: boolean;
  /** Visual focus highlight (e.g. active selection). */
  focused?: boolean;
  /** Dim row when another row is focused. */
  dimmed?: boolean;
  /** FadeIn duration in ms. Default 200. */
  fadeInMs?: number;
  /** FadeOut duration in ms. Default 150. */
  fadeOutMs?: number;
  /** Disable expand/collapse entirely (non-expandable single-entity rows). */
  expandable?: boolean;

  // ── Style overrides ────────────────────────────────────────────────────────
  /** Outer row container style. */
  style?: StyleProp<ViewStyle>;
  /** Style applied when `isChild` is true. */
  childStyle?: StyleProp<ViewStyle>;
  /** Style applied when `focused` is true. */
  focusedStyle?: StyleProp<ViewStyle>;
  /** Style for the expanded content wrapper. */
  expandedStyle?: StyleProp<ViewStyle>;

  // ── Accessibility ──────────────────────────────────────────────────────────
  /** A11y label for the toggle action. */
  accessibilityLabel?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * A shared collapsible row used by Track and Scorecard.
 *
 * The parent controls `expanded` state — this component is a controlled wrapper
 * that handles the pressable toggle, FadeIn/FadeOut animation on the expanded
 * section, and style composition (child indent, focus highlight, dimming).
 *
 * Style overrides let each consumer skin the row without forking the component.
 * For list-level reflow animation, use `LinearTransition` on the parent
 * Animated.FlatList — this component handles only the expanded section entrance.
 */
export function CollapsibleRow({
  expanded,
  onToggle,
  renderHeader,
  renderExpanded,
  isChild = false,
  focused = false,
  dimmed = false,
  fadeInMs = 200,
  fadeOutMs = 150,
  expandable = true,
  style,
  childStyle,
  focusedStyle,
  expandedStyle,
  accessibilityLabel,
}: CollapsibleRowProps) {
  const handlePress = useCallback(() => {
    if (expandable) onToggle();
  }, [expandable, onToggle]);

  return (
    <View
      style={[
        styles.row,
        isChild && childStyle,
        focused && focusedStyle,
        dimmed && styles.dimmed,
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={!expandable}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: expandable ? expanded : undefined }}
      >
        {renderHeader()}
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(fadeInMs)}
          exiting={FadeOut.duration(fadeOutMs)}
          style={expandedStyle}
        >
          {renderExpanded()}
        </Animated.View>
      )}
    </View>
  );
}

// ── Base styles (intentionally minimal — consumers override via props) ────────

const styles = StyleSheet.create({
  row: {
    overflow: 'visible',
  },
  dimmed: {
    opacity: 0.4,
  },
});
