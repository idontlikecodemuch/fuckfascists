import React, { useCallback, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Entity } from '../../core/models';
import type { StorageAdapter } from '../../core/data';
import { purgeScoredWeekAvoidEvents } from '../../core/data';
import type { Platform } from '../Platforms/types';
import { useDropSchedule, SCORECARD_DROP_NOTIFICATION_ID } from './hooks/useDropSchedule';
import { useScorecard } from './hooks/useScorecard';
import { useCardCapture } from './hooks/useCardCapture';
import { LivePreview } from './components/LivePreview';
import { ScorecardLoader } from './components/ScorecardLoader';
import { CardPresentation } from './components/CardPresentation';
import { EmptyWeek } from './components/EmptyWeek';
import { ScorecardImage } from './components/ScorecardImage';
import { CardArchive } from './components/CardArchive';
import { findLatestCard } from './data/cardArchive';
import { StarField } from '../Info/components/InfoDecorations';
import { scorecardCopy } from '../../copy/scorecard';
import {
  MIN_AVOIDS_FOR_DROP,
  SCORECARD_PRESENTATION_WINDOW_MS,
} from '../../config/constants';
import { theme } from '../../design/tokens';

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

  // The drop's "presentation window" — Scorecard tab takes over full-screen
  // only while we're within this window of the drop moment. After, the card
  // moves silently into "Past scorecards" and the tab returns to preview.
  const inPresentationWindow =
    hasDropped && Date.now() - schedule.dropAt < SCORECARD_PRESENTATION_WINDOW_MS;

  const { data, loading: dataLoading } = useScorecard(
    adapter, entities, platforms, schedule.weekOf, isPreview,
  );
  const { captureCard, capturing } = useCardCapture();

  // Post-drop: aggregate → capture → purge → (maybe) present.
  //
  // Runs on mount, on drop-fire, and on every visit while the PNG is missing
  // (launch-resilient retry if a previous attempt failed).
  //
  // Presentation takeover is gated by SCORECARD_PRESENTATION_WINDOW_MS. Past
  // that window, the effect still captures+purges if needed (so we keep the
  // privacy promise) but doesn't switch into the full-screen state — the
  // user sees the LivePreview for the new week, and the card is reachable
  // via "Past scorecards."
  React.useEffect(() => {
    if (!hasDropped || !data) return;

    if (data.grandTotal < MIN_AVOIDS_FOR_DROP) {
      setScreenState('empty');
      // Spec: no notification fires for empty weeks. Cancel the scorecard
      // drop identifier only — leaves the Thursday platform nudge intact.
      Notifications.cancelScheduledNotificationAsync(SCORECARD_DROP_NOTIFICATION_ID).catch(() => {});
      return;
    }

    let cancelled = false;

    (async () => {
      // Look up the latest captured card by mtime — robust to the weekOf
      // rollover that happens at Saturday local midnight.
      const latest = await findLatestCard();
      if (cancelled) return;

      // A card already exists for this drop (captured earlier this session
      // or a previous launch). Present if we're still inside the window.
      if (latest) {
        if (inPresentationWindow) {
          setCardUri(latest.uri);
          setScreenState('presentation');
        }
        // Outside the window: fall through to preview (set by default).
        return;
      }

      // No PNG yet — first open since drop. Capture, then purge.
      // Hold 'loading' so the user sees the privacy-proving copy
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
        // Purge failure is non-fatal — the PNG is already saved. Next
        // launch will purge on its normal schedule once the week rolls over.
      }
      if (cancelled) return;

      if (inPresentationWindow) {
        setCardUri(result.uri);
        setScreenState('presentation');
      } else {
        setScreenState('preview');
      }
    })();

    return () => { cancelled = true; };
  }, [hasDropped, data, schedule.weekOf, adapter, captureCard, inPresentationWindow]);

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
