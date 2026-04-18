/**
 * Scan screen decorative components — pulse rings, standby panel,
 * corner reticle, sweep line. Extracted to keep consumer files under 250 lines.
 */
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SparkleDecoration } from '../../core/fx';
import { scanCopy } from '../../copy/scan';
import { theme } from '../../design/tokens';
import { bevelFocusRaised } from '../../design/bevel';
import {
  SCAN_ICON_SIZE,
  SCAN_PANEL_HORIZONTAL_MARGIN,
  SCAN_PANEL_SCAN_LINE_OPACITY,
  SCAN_PANEL_SHADOW_OPACITY,
  SCAN_PANEL_SHADOW_RADIUS,
  SCAN_PANEL_WASH_OPACITY,
  SCAN_PANEL_WASH_SIZE,
  SCAN_PULSE_CYCLE_MS,
  SCAN_PULSE_INNER_BORDER,
  SCAN_PULSE_INNER_INSET,
  SCAN_PULSE_INNER_OPACITY,
  SCAN_PULSE_OUTER_BORDER,
  SCAN_PULSE_OUTER_DELAY_MS,
  SCAN_PULSE_OUTER_INSET,
  SCAN_PULSE_OUTER_OPACITY,
  SCAN_RETICLE_ARM_LENGTH,
  SCAN_RETICLE_THICKNESS,
  SCAN_SWEEP_DURATION_MS,
  SCAN_SWEEP_OPACITY,
  BARCODE_SCAN_GUIDE_HEIGHT,
  BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT,
} from '../../config/constants';

// ── Pulse Ring ───────────────────────────────────────────────────────────────

export function PulseRing({ inset, borderWidth, baseOpacity, delayMs }: {
  inset: number; borderWidth: number; baseOpacity: number; delayMs: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) { anim.setValue(0.5); return; }
      Animated.loop(Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(anim, { toValue: 1, duration: SCAN_PULSE_CYCLE_MS / 2, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: SCAN_PULSE_CYCLE_MS / 2, useNativeDriver: true }),
      ])).start();
    });
    return () => { cancelled = true; anim.stopAnimation(); };
  }, [anim, delayMs]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3 * baseOpacity, baseOpacity] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] });

  return (
    <Animated.View
      style={{
        position: 'absolute', top: -inset, left: -inset, right: -inset, bottom: -inset,
        borderWidth, borderColor: theme.colors.focusAccent,
        borderRadius: theme.radii.button + inset, opacity, transform: [{ scale }],
      }}
      pointerEvents="none"
    />
  );
}

// ── Standby Panel ────────────────────────────────────────────────────────────

interface ScanStandbyPanelProps {
  busy: boolean;
  onOpenScanner: () => void;
}

export function ScanStandbyPanel({ busy, onOpenScanner }: ScanStandbyPanelProps) {
  return (
    <>
      {/* Color wash behind panel */}
      <View style={styles.washContainer} pointerEvents="none">
        <View style={styles.wash} />
      </View>

      <View style={styles.panelOuter}>
        <View style={styles.panel}>
          <View style={styles.scanLine1} pointerEvents="none" />
          <View style={styles.scanLine2} pointerEvents="none" />

          <View style={styles.panelContent}>
            <Ionicons name="barcode-outline" size={SCAN_ICON_SIZE} color={theme.colors.focusText} style={styles.icon} />
            <Text style={styles.heading} accessibilityRole="header" allowFontScaling>{scanCopy.heading}</Text>
            <Text style={styles.body} allowFontScaling>
              {scanCopy.bodyLine1}{'\n'}{scanCopy.bodyLine2}
            </Text>

            <View style={styles.ctaWrapper}>
              <PulseRing inset={SCAN_PULSE_INNER_INSET} borderWidth={SCAN_PULSE_INNER_BORDER} baseOpacity={SCAN_PULSE_INNER_OPACITY} delayMs={0} />
              <PulseRing inset={SCAN_PULSE_OUTER_INSET} borderWidth={SCAN_PULSE_OUTER_BORDER} baseOpacity={SCAN_PULSE_OUTER_OPACITY} delayMs={SCAN_PULSE_OUTER_DELAY_MS} />
              <Pressable
                onPress={onOpenScanner}
                disabled={busy}
                style={[styles.cta, busy && styles.ctaBusy]}
                accessibilityRole="button"
                accessibilityLabel={busy ? scanCopy.busyActionLabel : scanCopy.primaryActionLabel}
                accessibilityState={{ disabled: busy }}
              >
                <Text style={styles.ctaLabel}>{busy ? scanCopy.busyAction : scanCopy.primaryAction}</Text>
              </Pressable>
              <SparkleDecoration />
            </View>

            <Text style={styles.footnote} allowFontScaling>
              {scanCopy.footnoteLine1}{'\n'}{scanCopy.footnoteLine2}
            </Text>
          </View>

          <SparkleDecoration variant="info" />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  washContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  wash: {
    width: SCAN_PANEL_WASH_SIZE, height: SCAN_PANEL_WASH_SIZE,
    borderRadius: SCAN_PANEL_WASH_SIZE / 2, backgroundColor: theme.colors.focusAccent,
    opacity: SCAN_PANEL_WASH_OPACITY,
  },
  panelOuter: {
    marginHorizontal: SCAN_PANEL_HORIZONTAL_MARGIN,
    shadowColor: theme.colors.focusAccent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: SCAN_PANEL_SHADOW_OPACITY, shadowRadius: SCAN_PANEL_SHADOW_RADIUS, elevation: 12,
  },
  panel: {
    ...bevelFocusRaised, backgroundColor: theme.colors.panelInner, overflow: 'visible',
    boxShadow: [
      { offsetX: 0, offsetY: 6, blurRadius: theme.glow.blurRadius, spreadDistance: theme.glow.spreadDistance, inset: true, color: theme.glow.color },
      { offsetX: 0, offsetY: -6, blurRadius: theme.glow.blurRadius, spreadDistance: theme.glow.spreadDistance, inset: true, color: theme.glow.color },
    ],
  },
  scanLine1: {
    position: 'absolute', top: '40%' as unknown as number, left: theme.space.lg, right: theme.space.lg,
    height: 1, backgroundColor: theme.colors.focusAccent, opacity: SCAN_PANEL_SCAN_LINE_OPACITY,
  },
  scanLine2: {
    position: 'absolute', top: '55%' as unknown as number, left: theme.space['2xl'], right: theme.space['2xl'],
    height: 1, backgroundColor: theme.colors.focusAccent, opacity: SCAN_PANEL_SCAN_LINE_OPACITY,
  },
  panelContent: {
    alignItems: 'center', paddingVertical: theme.space['3xl'], paddingHorizontal: theme.space.xl, zIndex: 2,
  },
  icon: { marginBottom: theme.space.md },
  heading: { ...theme.type.displayL, color: theme.colors.focusText, textAlign: 'center', marginBottom: theme.space.sm },
  body: { ...theme.type.bodyM, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  ctaWrapper: { marginTop: theme.space['2xl'], marginBottom: theme.space.lg, overflow: 'visible' },
  cta: {
    minHeight: theme.a11y.minTapTarget, paddingHorizontal: theme.space['3xl'],
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.focusAccent,
    ...bevelFocusRaised, borderRadius: theme.radii.button,
  },
  ctaBusy: { backgroundColor: theme.colors.surface2, opacity: 0.7 },
  ctaLabel: { ...theme.type.displayS, color: theme.colors.textPrimary, letterSpacing: 1 },
  footnote: { ...theme.type.caption, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 16 },
});

// ── Sweep Line ──────────────────────────────────────────────────────────────

export function SweepLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) { anim.setValue(0.5); return; }
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: SCAN_SWEEP_DURATION_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: SCAN_SWEEP_DURATION_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    });
    return () => { cancelled = true; anim.stopAnimation(); };
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, BARCODE_SCAN_GUIDE_HEIGHT - 2] });

  return (
    <Animated.View
      style={[sweepStyles.line, { transform: [{ translateY }] }]}
      pointerEvents="none"
    />
  );
}

const sweepStyles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: `${BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT + 2}%` as unknown as number,
    right: `${BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT + 2}%` as unknown as number,
    height: 1, backgroundColor: theme.colors.focusAccent, opacity: SCAN_SWEEP_OPACITY,
  },
});

// ── Corner Reticle ──────────────────────────────────────────────────────────

export function CornerReticle() {
  const arm = SCAN_RETICLE_ARM_LENGTH;
  const t = SCAN_RETICLE_THICKNESS;
  const color = theme.colors.focusAccent;
  const c = (top: boolean, left: boolean) => ({
    position: 'absolute' as const,
    [top ? 'top' : 'bottom']: 0, [left ? 'left' : 'right']: 0,
    width: arm, height: arm,
    [`border${top ? 'Top' : 'Bottom'}Width`]: t,
    [`border${left ? 'Left' : 'Right'}Width`]: t,
    [`border${top ? 'Top' : 'Bottom'}Color`]: color,
    [`border${left ? 'Left' : 'Right'}Color`]: color,
  });
  return (
    <>
      <View style={c(true, true)} pointerEvents="none" />
      <View style={c(true, false)} pointerEvents="none" />
      <View style={c(false, true)} pointerEvents="none" />
      <View style={c(false, false)} pointerEvents="none" />
    </>
  );
}
