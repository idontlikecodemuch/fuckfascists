import React, { useCallback, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { PreviewStamp } from './components/PreviewStamp';
import { CardArchive } from './components/CardArchive';
import { findCardForWeek } from './data/cardArchive';
import { getScoredWeekOfDrop } from './utils/scoredWeek';
import {
  deriveScorecardScreenState,
  shouldShowPreviewStamp,
  type ScorecardUserNav,
} from './utils/screenState';
import { StarField } from '../Info/components/InfoDecorations';
import { scorecardCopy } from '../../copy/scorecard';
import {
  MIN_AVOIDS_FOR_DROP,
  SCORECARD_PRESENTATION_WINDOW_MS,
} from '../../config/constants';
import { theme } from '../../design/tokens';

interface ScorecardScreenProps {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  onSwitchTab?: (tab: string) => void;
  onPresentationActiveChange?: (active: boolean) => void;
}

/**
 * Scorecard screen — the weekly synchronized reveal.
 *
 * Architecture: two independent phases.
 *
 *   Phase 1 — Capture side-effect (useEffect)
 *     Inputs:  hasDropped, dropData, scoredWeekOf, cardOnDisk
 *     Action:  capture+save+purge if needed; sets cardUri on success
 *     Output:  cardUri (truthy = a card exists for this drop)
 *     Does NOT decide what the user sees.
 *
 *   Phase 2 — Display derivation (pure)
 *     Inputs:  cardUri, inPresentationWindow, liveData, hasDropped, userNav
 *     Output:  effectiveState (one of 5 visual modes)
 *
 * Keeping these separated is what prevents the bug where "scored week empty"
 * silently locks the screen into EmptyWeek even when the live week has
 * activity — Phase 2 sees the full picture and falls through to LivePreview.
 *
 * Capture failure semantics: raw events are retained; deps are stable across
 * a single mount, so retries happen on the next mount (tab switch + return).
 */
export function ScorecardScreen({
  adapter,
  entities,
  platforms,
  onSwitchTab,
  onPresentationActiveChange,
}: ScorecardScreenProps) {
  const imageRef = useRef<View>(null);
  const [userNav, setUserNav] = useState<ScorecardUserNav>('auto');
  const [cardUri, setCardUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const { schedule, hasDropped } = useDropSchedule();
  const scoredWeekOf = getScoredWeekOfDrop(schedule.dropAt);

  const inPresentationWindow =
    hasDropped && Date.now() - schedule.dropAt < SCORECARD_PRESENTATION_WINDOW_MS;

  const { data: liveData, loading: liveDataLoading } = useScorecard(
    adapter, entities, platforms, schedule.weekOf,
  );
  const { data: dropData, loading: dropDataLoading } = useScorecard(
    adapter, entities, platforms, scoredWeekOf,
  );
  const { captureCard, capturing } = useCardCapture();

  // ── PHASE 1: capture side-effect ──────────────────────────────────────
  React.useEffect(() => {
    if (!hasDropped || dropDataLoading) return;

    let cancelled = false;

    (async () => {
      // Exact scored-week lookup. Older archive cards must NOT short-circuit
      // this drop's capture+purge flow.
      const existing = await findCardForWeek(scoredWeekOf);
      if (cancelled) return;

      if (existing) {
        setCardUri(existing.uri);
        return;
      }

      if (!dropData) return;

      if (dropData.grandTotal < MIN_AVOIDS_FOR_DROP) {
        // Nothing to capture. Cancel only the scorecard drop notification —
        // leaves the Thursday platform nudge ('platform-nudge-thursday') intact.
        Notifications.cancelScheduledNotificationAsync(SCORECARD_DROP_NOTIFICATION_ID).catch(() => {});
        return;
      }

      // No card yet — capture, then purge. The off-screen ScorecardImage is
      // already rendering dropData (offscreenData below), so the ref is ready.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled) return;

      const result = await captureCard(imageRef, scoredWeekOf);
      if (cancelled) return;

      if (!result) {
        // Capture failed — retain raw events; next mount retries.
        return;
      }

      try {
        await purgeScoredWeekAvoidEvents(adapter, scoredWeekOf);
      } catch {
        // Purge failure is non-fatal — card is saved. Next launch's normal
        // weekly rollover cleans up.
      }
      if (cancelled) return;

      setCardUri(result.uri);
    })();

    return () => { cancelled = true; };
  }, [hasDropped, dropData, dropDataLoading, scoredWeekOf, adapter, captureCard]);

  // Dev-tools: generate on-demand from liveData (pre-drop preview). Forces a
  // presentation regardless of inPresentationWindow. Does NOT purge events.
  //
  // Note: when hasDropped, offscreenData is dropData — so post-drop this
  // captures the scored-week card with the live-week filename. That's an
  // acceptable __DEV__ quirk; the button is most useful pre-drop.
  const handleGenerateCard = useCallback(async () => {
    if (!liveData || liveData.grandTotal < MIN_AVOIDS_FOR_DROP) return;

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const result = await captureCard(imageRef, schedule.weekOf);
    if (result) {
      setCardUri(result.uri);
      setUserNav('present');
    }
  }, [liveData, captureCard, schedule.weekOf]);

  const handleDismiss = useCallback(() => {
    setUserNav('dismissed');
  }, []);

  const handleResetCard = useCallback(() => {
    setCardUri(null);
    setUserNav('auto');
  }, []);

  // ── PHASE 2: derive display state ─────────────────────────────────────
  // Pure function of facts. Phase 1's only contribution is cardUri.
  const liveGrandTotal = liveData?.grandTotal ?? null;
  const effectiveState = deriveScorecardScreenState({
    userNav,
    capturing,
    liveDataLoading,
    dropDataLoading,
    cardUri,
    inPresentationWindow,
    liveGrandTotal,
    hasDropped,
    minAvoids: MIN_AVOIDS_FOR_DROP,
  });

  const presentationActive = effectiveState === 'presentation' && Boolean(cardUri);

  // Off-screen capture target. Pure render-time expression: dropData when
  // we're past the drop and have it loaded, else liveData. Always mounted
  // (when data is available) so the ref is populated before any captureCard
  // call. Pre-drop: dev tools captures liveData. Post-drop: Phase 1 captures
  // dropData. No state toggle needed.
  const offscreenData = hasDropped && dropData ? dropData : liveData;

  React.useEffect(() => {
    onPresentationActiveChange?.(presentationActive);
    return () => onPresentationActiveChange?.(false);
  }, [onPresentationActiveChange, presentationActive]);

  // PREVIEW stamp is a fixed viewport overlay in the in-app preview
  // states — must persist while the user scrolls LivePreview so any
  // screenshot makes the "this isn't the real drop" status explicit.
  // Zero-avoid empty states intentionally do not show it (#130).
  // The stamp never appears on the captured shareable card.
  const showPreviewStamp = shouldShowPreviewStamp(
    effectiveState,
    liveGrandTotal,
    MIN_AVOIDS_FOR_DROP,
  );

  return (
    <SafeAreaView style={styles.container}>
      <StarField seed="scorecard" />

      {/* Off-screen capture target. Positioned far off-screen but kept opaque
          intentionally — on iOS, view-shot returns blank bitmaps when capturing
          through an opacity:0 ancestor. */}
      {offscreenData && (
        <View style={styles.offscreen} pointerEvents="none" collapsable={false}>
          <ScorecardImage ref={imageRef} data={offscreenData} />
        </View>
      )}

      {effectiveState === 'loading' && <ScorecardLoader />}
      {effectiveState === 'empty' && (
        <EmptyWeek
          onSwitchTab={onSwitchTab}
          onOpenArchive={() => setUserNav('archive')}
        />
      )}
      {effectiveState === 'preview' && liveData && (
        <>
          <LivePreview data={liveData} onSwitchTab={onSwitchTab} />
          <Pressable
            style={styles.archiveLink}
            onPress={() => setUserNav('archive')}
            accessibilityRole="link"
          >
            <Text style={styles.archiveLinkText}>{scorecardCopy.pastCardsLabel}</Text>
          </Pressable>
        </>
      )}
      {presentationActive && cardUri && (
        <CardPresentation pngUri={cardUri} onDismiss={handleDismiss} />
      )}
      {effectiveState === 'archive' && (
        <CardArchive
          onDismiss={() => setUserNav('auto')}
          onPresentationActiveChange={onPresentationActiveChange}
        />
      )}

      {/* Dev tools — __DEV__ only, preview state only */}
      {__DEV__ && liveData && effectiveState === 'preview' && (
        <DevToolsPanel
          onGenerateNow={handleGenerateCard}
          onResetCard={handleResetCard}
          weekOf={schedule.weekOf}
        />
      )}

      {/* Fixed PREVIEW stamp — outside ScrollView so screenshots always
          capture it. Positioned top-right under the safe-area inset. */}
      {showPreviewStamp && (
        <View style={[styles.previewStampHost, { top: insets.top }]} pointerEvents="none">
          <PreviewStamp />
        </View>
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
    left: -10000,
    top: 0,
    // Kept opaque intentionally (see JSX comment). z-index isn't strictly
    // needed while the content below renders on top, but helps ensure the
    // capture target never intercepts layout above it.
    zIndex: -1,
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
  previewStampHost: {
    // Fixed viewport-anchored container so the stamp never scrolls with
    // LivePreview content. `top` is set inline via safe-area inset so the
    // stamp clears the dynamic island / status bar. PreviewStamp positions
    // itself absolutely within this host (right offset set inside the component).
    position: 'absolute',
    right: 0,
    width: 140,
    height: 60,
    zIndex: 10,
  },
});
