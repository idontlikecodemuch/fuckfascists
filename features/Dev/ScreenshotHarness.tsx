/**
 * Screenshot harness — dev-only automated screenshot capture tool.
 * Renders each screen state with fixture data, captures via the existing
 * beta screenshot system, and saves to camera roll.
 *
 * Three modes:
 *   1. Full state sweep — every surface, every meaningful state
 *   2. Dynamic Type pass — same sweep, checks device font scale
 *   3. Notification preview — fire Thursday nudge immediately
 *
 * Accessible from the beta dev menu. Not reachable in production builds.
 * DEV ONLY.
 */
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, PixelRatio } from 'react-native';
import { captureScreen } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { harnessCopy } from '../../copy/harness';
import { platformsCopy } from '../../copy/platforms';
import { theme } from '../../design/tokens';
import {
  HARNESS_STEP_SETTLE_MS,
  HARNESS_CAPTURE_DELAY_MS,
} from '../../config/constants';
import {
  HARNESS_STEPS,
  NOTIFICATION_STEP,
  filenameForStep,
  type HarnessMode,
  type HarnessStep,
} from './harnessSteps';
import { renderHarnessStep } from './harnessRenderers';
import { HarnessFontScaleProvider } from './HarnessFontScale';

interface ScreenshotHarnessProps {
  onClose: () => void;
}

type HarnessState = 'idle' | 'running' | 'done';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function ScreenshotHarness({ onClose }: ScreenshotHarnessProps) {
  const [state, setState] = useState<HarnessState>('idle');
  const [currentStep, setCurrentStep] = useState<HarnessStep | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [renderedElement, setRenderedElement] = useState<React.ReactElement | null>(null);
  const cancelled = useRef(false);

  const captureStep = useCallback(async (step: HarnessStep, mode: HarnessMode): Promise<boolean> => {
    if (cancelled.current) return false;

    const element = renderHarnessStep(step.id);
    if (!element) return true; // skip unknown steps

    setCurrentStep(step);
    setRenderedElement(element);

    // Wait for render to settle
    await delay(HARNESS_STEP_SETTLE_MS);
    if (cancelled.current) return false;

    // Capture
    const filename = filenameForStep(step, mode);
    const tempUri = await captureScreen({ format: 'png', quality: 1 });
    const namedUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.copyAsync({ from: tempUri, to: namedUri });
    await MediaLibrary.createAssetAsync(namedUri);
    await FileSystem.deleteAsync(namedUri, { idempotent: true });

    await delay(HARNESS_CAPTURE_DELAY_MS);
    return !cancelled.current;
  }, []);

  const runSweep = useCallback(async (mode: HarnessMode) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera roll permission required.');
      return;
    }

    // A11y preflight
    if (mode === 'a11y') {
      const scale = PixelRatio.getFontScale();
      await new Promise<void>((resolve) => {
        Alert.alert(
          harnessCopy.a11yPreflightTitle,
          harnessCopy.a11yPreflight(scale),
          [{ text: 'OK', onPress: () => resolve() }],
        );
      });
    }

    cancelled.current = false;
    setState('running');
    const steps = HARNESS_STEPS;
    setProgress({ current: 0, total: steps.length });

    let captured = 0;
    for (let i = 0; i < steps.length; i++) {
      if (cancelled.current) break;
      setProgress({ current: i + 1, total: steps.length });
      const ok = await captureStep(steps[i], mode);
      if (!ok) break;
      captured++;
    }

    setState('done');
    setRenderedElement(null);
    setCurrentStep(null);

    if (cancelled.current) {
      Alert.alert(harnessCopy.cancelled);
    } else {
      Alert.alert(harnessCopy.done(captured));
    }
  }, [captureStep]);

  const runNotification = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera roll permission required.');
      return;
    }

    cancelled.current = false;
    setState('running');
    setProgress({ current: 1, total: 1 });

    // Fire the Thursday nudge notification immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title: platformsCopy.nudgeTitle,
        body: platformsCopy.nudgeBody,
        sound: true,
      },
      trigger: null, // null = fire immediately
    });

    // Capture the step
    await captureStep(NOTIFICATION_STEP, 'full');

    setState('done');
    setRenderedElement(null);
    Alert.alert(harnessCopy.notifTitle, harnessCopy.notifFired);
  }, [captureStep]);

  const handleCancel = useCallback(() => {
    cancelled.current = true;
    setState('idle');
    setRenderedElement(null);
    setCurrentStep(null);
  }, []);

  // When running, show the rendered step full-screen
  if (state === 'running' && renderedElement) {
    return (
      <View style={styles.fullScreen}>
        <HarnessFontScaleProvider isA11yMode={false}>
          {renderedElement}
        </HarnessFontScaleProvider>
        <View style={styles.progressOverlay} pointerEvents="box-none">
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              {harnessCopy.capturing(progress.current, progress.total)}
            </Text>
            {currentStep && (
              <Text style={styles.stepLabel}>{harnessCopy.stepLabel(currentStep.label)}</Text>
            )}
            <Pressable onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{harnessCopy.cancelButton}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Mode selector
  return (
    <View style={styles.modal}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>{harnessCopy.title}</Text>

        <ModeButton
          label={harnessCopy.modeFullLabel}
          desc={harnessCopy.modeFullDesc}
          onPress={() => runSweep('full')}
        />
        <ModeButton
          label={harnessCopy.modeA11yLabel}
          desc={harnessCopy.modeA11yDesc}
          onPress={() => runSweep('a11y')}
        />
        <ModeButton
          label={harnessCopy.modeNotifLabel}
          desc={harnessCopy.modeNotifDesc}
          onPress={runNotification}
        />

        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>{harnessCopy.cancelButton}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ModeButton({ label, desc, onPress }: { label: string; desc: string; onPress: () => void }) {
  return (
    <Pressable style={styles.modeBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.modeBtnLabel}>{label}</Text>
      <Text style={styles.modeBtnDesc}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: theme.space.xl },
  modalContent: { backgroundColor: theme.colors.bgNav, borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, padding: theme.space.xl },
  title: { ...theme.type.displayM, color: theme.colors.rewardYellow, letterSpacing: 3, marginBottom: theme.space.xl, textAlign: 'center' },
  modeBtn: { borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, padding: theme.space.lg, marginBottom: theme.space.md, backgroundColor: theme.colors.surface1, minHeight: theme.a11y.minTapTarget },
  modeBtnLabel: { ...theme.type.uiLabel, fontSize: 14, color: theme.colors.textPrimary, letterSpacing: 2 },
  modeBtnDesc: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: theme.space.xs },
  closeBtn: { marginTop: theme.space.md, minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { ...theme.type.uiLabel, color: theme.colors.dangerRed, letterSpacing: 2 },
  progressOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  progressBar: { backgroundColor: 'rgba(0,0,0,0.8)', padding: theme.space.md, alignItems: 'center' },
  progressText: { ...theme.type.bodyS, color: theme.colors.textPrimary },
  stepLabel: { ...theme.type.caption, color: theme.colors.textSecondary, marginTop: theme.space.xs },
  cancelBtn: { marginTop: theme.space.sm, minHeight: theme.a11y.minTapTarget, paddingHorizontal: theme.space.lg, justifyContent: 'center' },
  cancelText: { ...theme.type.uiLabel, color: theme.colors.dangerRed, letterSpacing: 1 },
});
