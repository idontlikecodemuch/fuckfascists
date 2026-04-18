import React, { useCallback, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import type { Entity } from '../../core/models';
import type { StorageAdapter } from '../../core/data';
import { purgeScoredWeekAvoidEvents } from '../../core/data';
import type { Platform } from '../Platforms/types';
import { useDropSchedule } from './hooks/useDropSchedule';
import { useScorecard } from './hooks/useScorecard';
import { useCardCapture } from './hooks/useCardCapture';
import { LivePreview } from './components/LivePreview';
import { ScorecardLoader } from './components/ScorecardLoader';
import { CardPresentation } from './components/CardPresentation';
import { EmptyWeek } from './components/EmptyWeek';
import { ScorecardImage } from './components/ScorecardImage';
import { CardArchive } from './components/CardArchive';
import { StarField } from '../Info/components/InfoDecorations';
import { scorecardCopy } from '../../copy/scorecard';
import { MIN_AVOIDS_FOR_DROP } from '../../config/constants';
import { theme } from '../../design/tokens';
import { buildCardFilename } from './utils/formatters';

type ScreenState = 'preview' | 'loading' | 'presentation' | 'empty' | 'archive';

interface ScorecardScreenProps {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  onSwitchTab?: (tab: string) => void;
}

/**
 * Scorecard screen — the weekly synchronized reveal.
 *
 * Lifecycle:
 *   1. preview     — scrollable interactive breakdown (Sat → Fri drop)
 *   2. loading     — brief transition while PNG captures
 *   3. presentation — full-screen card takeover + SHARE
 *   4. empty       — zero avoids, motivational copy
 *   5. archive     — past scorecards thumbnail gallery
 *
 * Post-drop flow (aggregate → capture → purge → present):
 *   When hasDropped fires, we aggregate the scored week's events into a PNG,
 *   save it to disk, and then purge the raw events scoped to that exact
 *   Sat–Fri window. The card persists; the source data does not. This is
 *   how the app keeps its "delete the data" promise while still letting the
 *   user celebrate + share the drop.
 *
 *   Launch-resilient: if the app was closed when the drop fired, the first
 *   open after drop runs the same flow. If capture fails (disk full, render
 *   error), raw events are RETAINED and the next visit retries — we never
 *   silently destroy data on failure.
 */
export function ScorecardScreen({ adapter, entities, platforms, onSwitchTab }: ScorecardScreenProps) {
  const imageRef = useRef<View>(null);
  const [screenState, setScreenState] = useState<ScreenState>('preview');
  const [cardUri, setCardUri] = useState<string | null>(null);

  const { schedule, hasDropped } = useDropSchedule();
  const isPreview = !hasDropped;

  const { data, loading: dataLoading } = useScorecard(
    adapter, entities, platforms, schedule.weekOf, isPreview,
  );
  const { captureCard, capturing } = useCardCapture();

  // Post-drop: aggregate → capture → purge → present.
  // Runs on mount, on drop-fire, and on every visit while the PNG is missing
  // (launch-resilient retry if a previous attempt failed).
  React.useEffect(() => {
    if (!hasDropped || !data) return;

    if (data.grandTotal < MIN_AVOIDS_FOR_DROP) {
      setScreenState('empty');
      // Spec: no notification fires for empty weeks.
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      return;
    }

    let cancelled = false;
    const dir = `${FileSystem.documentDirectory}scorecards/`;
    const path = `${dir}${buildCardFilename(schedule.weekOf)}`;

    (async () => {
      const info = await FileSystem.getInfoAsync(path);
      if (cancelled) return;

      // Already captured — present immediately, no re-capture, no re-purge.
      if (info.exists) {
        setCardUri(path);
        setScreenState('presentation');
        return;
      }

      // First open after drop: capture the PNG, then purge its source events.
      // Hold 'loading' so the user sees the privacy-proving loader copy
      // ("Locking in my card. Shredding the data.") during the transition.
      setScreenState('loading');

      // Allow one frame for the off-screen ScorecardImage to mount.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (cancelled) return;

      const result = await captureCard(imageRef, schedule.weekOf);
      if (cancelled) return;

      if (!result) {
        // Capture failed — retain raw events and retry on next visit.
        setScreenState('preview');
        return;
      }

      // Capture succeeded → purge the scored week's events (scoped to
      // [weekOf, weekOf+7) so the live week can't be touched).
      try {
        await purgeScoredWeekAvoidEvents(adapter, schedule.weekOf);
      } catch {
        // Purge failure is non-fatal — the PNG is already saved. Next launch
        // will purge on its normal schedule once the week rolls over.
      }
      if (cancelled) return;

      setCardUri(result.uri);
      setScreenState('presentation');
    })();

    return () => { cancelled = true; };
  }, [hasDropped, data, schedule.weekOf, adapter, captureCard]);

  // Dev-tools: generate on-demand (pre-drop preview card). Does NOT purge —
  // the scored week hasn't ended yet.
  const handleGenerateCard = useCallback(async () => {
    if (!data || data.grandTotal < MIN_AVOIDS_FOR_DROP) return;
    setScreenState('loading');

    requestAnimationFrame(async () => {
      const result = await captureCard(imageRef, schedule.weekOf);
      if (result) {
        setCardUri(result.uri);
        setScreenState('presentation');
      } else {
        setScreenState('preview');
      }
    });
  }, [data, captureCard, schedule.weekOf]);

  const handleDismiss = useCallback(() => {
    setScreenState('preview');
  }, []);

  const handleResetCard = useCallback(() => {
    setCardUri(null);
    setScreenState('preview');
  }, []);

  const effectiveState: ScreenState =
    dataLoading ? 'loading' :
    screenState === 'loading' || capturing ? 'loading' :
    screenState;

  return (
    <SafeAreaView style={styles.container}>
      <StarField seed="scorecard" />

      {/* Off-screen capture target — always mounted when data exists */}
      {data && (
        <View style={styles.offscreen} pointerEvents="none">
          <ScorecardImage ref={imageRef} data={data} />
        </View>
      )}

      {effectiveState === 'loading' && <ScorecardLoader />}
      {effectiveState === 'empty' && <EmptyWeek onSwitchTab={onSwitchTab} />}
      {effectiveState === 'preview' && data && (
        <>
          <LivePreview data={data} onSwitchTab={onSwitchTab} />
          <Pressable
            style={styles.archiveLink}
            onPress={() => setScreenState('archive')}
            accessibilityRole="link"
          >
            <Text style={styles.archiveLinkText}>{scorecardCopy.pastCardsLabel}</Text>
          </Pressable>
        </>
      )}
      {effectiveState === 'presentation' && cardUri && (
        <CardPresentation pngUri={cardUri} onDismiss={handleDismiss} />
      )}
      {effectiveState === 'archive' && (
        <CardArchive onDismiss={() => setScreenState('preview')} />
      )}

      {/* Dev tools — __DEV__ only, preview state only */}
      {__DEV__ && data && effectiveState === 'preview' && (
        <DevToolsPanel
          onGenerateNow={handleGenerateCard}
          onResetCard={handleResetCard}
          weekOf={schedule.weekOf}
        />
      )}
    </SafeAreaView>
  );
}

// Lazy-load dev tools to keep them out of production
function DevToolsPanel(props: { onGenerateNow: () => void; onResetCard: () => void; weekOf: string }) {
  const { ScorecardDevTools } = require('./dev/ScorecardDevTools');
  return <ScorecardDevTools {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
  },
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  archiveLink: {
    alignSelf: 'center',
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
  },
  archiveLinkText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});
