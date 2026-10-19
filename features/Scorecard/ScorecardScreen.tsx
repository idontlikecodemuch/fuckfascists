import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Entity } from '../../core/models';
import type { StorageAdapter } from '../../core/data';
import type { Platform } from '../Platforms/types';
import type { DropSchedule } from './types';
import { useDropSchedule } from './hooks/useDropSchedule';
import { useScorecard } from './hooks/useScorecard';
import { useScoredWeekCard } from './hooks/useScoredWeekCard';
import { useLateCardNotice } from './hooks/useLateCardNotice';
import { useScorecardCapture } from './context/ScorecardCaptureContext';
import { revealedWeekMarker } from './data/weekMarkers';
import { LivePreview } from './components/LivePreview';
import { ScorecardLoader } from './components/ScorecardLoader';
import { CardPresentation } from './components/CardPresentation';
import { EmptyWeek } from './components/EmptyWeek';
import { PreviewStamp } from './components/PreviewStamp';
import { CardArchive } from './components/CardArchive';
import { PastScorecardsLink } from './components/PastScorecardsLink';
import { getScoredWeekOfDrop } from './utils/scoredWeek';
import {
  deriveScorecardScreenState,
  shouldShowPendingPreviousScorecard,
  shouldShowPreviewStamp,
  type ScorecardUserNav,
} from './utils/screenState';
import { StarField } from '../Info/components/InfoDecorations';
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
  /** DEV-only deterministic schedule for the native release QA harness. */
  devScheduleOverride?: DropSchedule;
  /** DEV-only clock paired with devScheduleOverride. */
  devNowMsOverride?: number;
}

/**
 * Scorecard screen — the weekly synchronized reveal. Display only: the
 * app-shell ScorecardCaptureProvider captures cards and purges raw events.
 * Inside the 48h window with a card → full-screen presentation (which marks
 * the drop revealed for launch routing); while the shell still captures this
 * drop → the loader; otherwise the live preview or empty-drop state, plus a
 * one-line notice for a card saved after its window.
 */
export function ScorecardScreen({
  adapter,
  entities,
  platforms,
  onSwitchTab,
  onPresentationActiveChange,
  devScheduleOverride,
  devNowMsOverride,
}: ScorecardScreenProps) {
  const capture = useScorecardCapture();
  const [userNav, setUserNav] = useState<ScorecardUserNav>('auto');
  const [devCardUri, setDevCardUri] = useState<string | null>(null);
  const [lookupKey, setLookupKey] = useState(0);
  const insets = useSafeAreaInsets();

  const liveDropSchedule = useDropSchedule();
  const qaOverrideActive = __DEV__ && devScheduleOverride != null;
  const schedule = qaOverrideActive ? devScheduleOverride : liveDropSchedule.schedule;
  const scheduleNowMs = qaOverrideActive
    ? devNowMsOverride ?? Date.now()
    : Date.now();
  const hasDropped = qaOverrideActive
    ? scheduleNowMs >= schedule.dropAt
    : liveDropSchedule.hasDropped;
  const scoredWeekOf = getScoredWeekOfDrop(schedule.dropAt);
  const inPresentationWindow =
    hasDropped && scheduleNowMs - schedule.dropAt < SCORECARD_PRESENTATION_WINDOW_MS;

  // Shell captures purge raw events, so re-read everything when they land.
  const refreshKey = capture.cardsVersion + lookupKey;
  const { data: liveData, loading: liveDataLoading } = useScorecard(
    adapter, entities, platforms, schedule.weekOf, refreshKey,
  );
  const { data: dropData, loading: dropDataLoading } = useScorecard(
    adapter, entities, platforms, scoredWeekOf, refreshKey,
  );
  const archivedCard = useScoredWeekCard(hasDropped ? scoredWeekOf : null, refreshKey);
  const cardUri = devCardUri ?? archivedCard.uri;

  // This drop has avoids but no run that started after it has finished yet
  // (cold start before the first run, or the drop just passed in-app).
  const captureDue = capture.running || (capture.lastRunStartedAt ?? 0) < schedule.dropAt;
  const awaitingCapture = captureDue &&
    inPresentationWindow &&
    !cardUri &&
    (dropData?.grandTotal ?? 0) >= MIN_AVOIDS_FOR_DROP;

  // Dev tools: capture liveData on demand (pre-drop preview). Forces a
  // presentation regardless of the window. Does NOT purge events.
  const handleGenerateCard = useCallback(async () => {
    if (!liveData || liveData.grandTotal < MIN_AVOIDS_FOR_DROP) return;
    const result = await capture.captureCard(schedule.weekOf, liveData);
    if (result) {
      setDevCardUri(result.uri);
      setUserNav('present');
    }
  }, [liveData, capture.captureCard, schedule.weekOf]);

  const handleResetCard = useCallback(() => {
    setDevCardUri(null);
    setUserNav('auto');
    setLookupKey((key) => key + 1);
  }, []);

  // Seen or dismissed: launch/resume routing stops opening Scorecard for it.
  const markRevealed = useCallback(() => {
    if (!devCardUri && !qaOverrideActive) void revealedWeekMarker.mark(scoredWeekOf);
  }, [devCardUri, qaOverrideActive, scoredWeekOf]);
  const handleDismiss = useCallback(() => {
    markRevealed();
    setUserNav('dismissed');
  }, [markRevealed]);
  const handleOpenArchive = useCallback(() => setUserNav('archive'), []);

  const liveGrandTotal = liveData?.grandTotal ?? null;
  const effectiveState = deriveScorecardScreenState({
    userNav,
    capturing: capture.capturing || awaitingCapture,
    liveDataLoading,
    dropDataLoading: dropDataLoading || archivedCard.loading,
    cardUri,
    inPresentationWindow,
    liveGrandTotal,
    hasDropped,
    minAvoids: MIN_AVOIDS_FOR_DROP,
  });

  const presentationActive = effectiveState === 'presentation' && Boolean(cardUri);
  const lateWeek = useLateCardNotice(
    effectiveState === 'preview' || effectiveState === 'empty',
    capture.cardsVersion,
  );

  React.useEffect(() => {
    onPresentationActiveChange?.(presentationActive);
    return () => onPresentationActiveChange?.(false);
  }, [onPresentationActiveChange, presentationActive]);

  React.useEffect(() => {
    if (presentationActive) markRevealed();
  }, [presentationActive, markRevealed]);

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
  const showPendingPreviousCard = shouldShowPendingPreviousScorecard({
    hasDropped,
    liveWeekOf: schedule.weekOf,
    scoredWeekOf,
    dropGrandTotal: dropData?.grandTotal ?? null,
    minAvoids: MIN_AVOIDS_FOR_DROP,
  });

  return (
    <SafeAreaView style={styles.container}>
      <StarField seed="scorecard" />

      {effectiveState === 'loading' && <ScorecardLoader />}
      {effectiveState === 'empty' && (
        <EmptyWeek
          onSwitchTab={onSwitchTab}
          onOpenArchive={handleOpenArchive}
          lateWeek={lateWeek}
        />
      )}
      {effectiveState === 'preview' && liveData && (
        <>
          <LivePreview
            data={liveData}
            showPendingPreviousCard={showPendingPreviousCard}
            onSwitchTab={onSwitchTab}
          />
          <PastScorecardsLink onPress={handleOpenArchive} lateWeek={lateWeek} />
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
