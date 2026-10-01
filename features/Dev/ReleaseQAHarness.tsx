import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { captureScreen } from 'react-native-view-shot';
import type { Entity } from '../../core/models';
import { SqliteAdapter } from '../../app/storage/SqliteAdapter';
import { TRACKED_PLATFORMS } from '../Platforms/data/platformList';
import { ScorecardScreen } from '../Scorecard/ScorecardScreen';
import { findCardForWeek } from '../Scorecard/data/cardArchive';
import { buildCardFilename } from '../Scorecard/utils/formatters';
import { getScoredWeekOfDrop } from '../Scorecard/utils/scoredWeek';
import {
  deriveScorecardScreenState,
  shouldShowPendingPreviousScorecard,
} from '../Scorecard/utils/screenState';
import {
  SCORECARD_DROP_NOTIFICATION_ID,
  cancelScorecardDropNotification,
  scheduleDropNotification,
} from '../Scorecard/hooks/useDropSchedule';
import { theme } from '../../design/tokens';

interface ReleaseQAHarnessProps {
  entities: Entity[];
}

interface ReadyState {
  adapter: SqliteAdapter;
  dropAt: number;
  nowMs: number;
  weekOf: string;
}

const QA_DIR = `${FileSystem.documentDirectory}release-qa/`;
const QA_DB = 'release-qa.db';
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * DEV-only native scorecard release QA. Uses an isolated SQLite database but
 * the real ScorecardScreen capture/purge/archive/notification implementations.
 */
export function ReleaseQAHarness({ entities }: ReleaseQAHarnessProps) {
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const completed = useRef(false);
  const presentationActive = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await FileSystem.deleteAsync(QA_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(QA_DIR, { intermediates: true });

      const adapter = await SqliteAdapter.open(QA_DB);
      await Promise.all([
        adapter.clearOldEntityAvoids('9999-12-31'),
        adapter.clearOldPlatformAvoids('9999-12-31'),
      ]);

      const nowMs = Date.now();
      const dropAt = nowMs - 60_000;
      const weekOf = getScoredWeekOfDrop(dropAt);
      const scorecardDir = `${FileSystem.documentDirectory}scorecards/`;
      await FileSystem.makeDirectoryAsync(scorecardDir, { intermediates: true });
      await FileSystem.deleteAsync(
        `${scorecardDir}${buildCardFilename(weekOf)}`,
        { idempotent: true },
      );

      const entity = entities.find((candidate) => candidate.id === 'meta') ??
        entities.find((candidate) => candidate.donationSummary != null);
      if (!entity) throw new Error('No hydrated entity available for scorecard QA');

      await adapter.upsertEntityAvoid({
        entityId: entity.id,
        date: weekOf,
        count: 2,
        surface: 1,
      });

      if (!cancelled) setReady({ adapter, dropAt, nowMs, weekOf });
    })().catch((cause) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
    });
    return () => { cancelled = true; };
  }, [entities]);

  useEffect(() => {
    if (!ready || completed.current) return;
    let cancelled = false;

    (async () => {
      let card = null;
      for (let attempt = 0; attempt < 40; attempt++) {
        card = await findCardForWeek(ready.weekOf);
        if (card) break;
        await delay(500);
      }
      if (!card) throw new Error('Timed out waiting for native scorecard capture');

      await delay(1200);
      if (cancelled) return;

      const screenshotTemp = await captureScreen({ format: 'png', quality: 1 });
      const screenshotPath = `${QA_DIR}scorecard-presentation.png`;
      await FileSystem.copyAsync({ from: screenshotTemp, to: screenshotPath });

      const [entityEvents, platformEvents, cardInfo] = await Promise.all([
        ready.adapter.getEntityAvoids(),
        ready.adapter.getPlatformAvoids(),
        FileSystem.getInfoAsync(card.uri),
      ]);

      let notificationScheduled = false;
      let notificationError: string | null = null;
      try {
        await scheduleDropNotification(Date.now() + 5 * 60_000);
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        notificationScheduled = scheduled.some(
          (request) => request.identifier === SCORECARD_DROP_NOTIFICATION_ID &&
            (request.content.data as { type?: string } | undefined)?.type === 'scorecard-drop',
        );
      } catch (cause) {
        notificationError = cause instanceof Error ? cause.message : String(cause);
      } finally {
        await cancelScorecardDropNotification();
      }

      const report = {
        generatedAt: new Date().toISOString(),
        appVersion: Constants.expoConfig?.version ?? null,
        iosBuildNumber: Constants.expoConfig?.ios?.buildNumber ?? null,
        scorecard: {
          weekOf: ready.weekOf,
          cardExists: cardInfo.exists,
          cardFilename: card.filename,
          presentationActive: presentationActive.current,
          rawEntityEventsAfterCapture: entityEvents.length,
          rawPlatformEventsAfterCapture: platformEvents.length,
          purgePassed: entityEvents.length === 0 && platformEvents.length === 0,
          archiveLookupPassed: (await findCardForWeek(ready.weekOf))?.uri === card.uri,
          screenshotPath,
        },
        triggerDerivations: {
          emptyPostDrop: deriveScorecardScreenState({
            userNav: 'auto',
            capturing: false,
            liveDataLoading: false,
            dropDataLoading: false,
            cardUri: null,
            inPresentationWindow: true,
            liveGrandTotal: 0,
            hasDropped: true,
            minAvoids: 1,
          }) === 'empty',
          populatedPreview: deriveScorecardScreenState({
            userNav: 'auto',
            capturing: false,
            liveDataLoading: false,
            dropDataLoading: false,
            cardUri: null,
            inPresentationWindow: false,
            liveGrandTotal: 2,
            hasDropped: false,
            minAvoids: 1,
          }) === 'preview',
          saturdayRolloverBridge: shouldShowPendingPreviousScorecard({
            hasDropped: false,
            liveWeekOf: '2026-09-05',
            scoredWeekOf: '2026-08-29',
            dropGrandTotal: 2,
            minAvoids: 1,
          }),
        },
        notification: {
          scheduledWithRoutingType: notificationScheduled,
          error: notificationError,
        },
      };

      await FileSystem.writeAsStringAsync(
        `${QA_DIR}report.json`,
        JSON.stringify(report, null, 2),
      );
      completed.current = true;
      console.log('[ReleaseQA]', JSON.stringify(report));
    })().catch((cause) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
    });

    return () => { cancelled = true; };
  }, [ready]);

  if (error) {
    return (
      <SafeAreaView style={styles.error}>
        <Text style={styles.errorText}>RELEASE QA FAILED{`\n`}{error}</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.loadingText}>PREPARING RELEASE QA…</Text>
      </SafeAreaView>
    );
  }

  return (
    <ScorecardScreen
      adapter={ready.adapter}
      entities={entities}
      platforms={TRACKED_PLATFORMS}
      devScheduleOverride={{ dropAt: ready.dropAt, weekOf: ready.weekOf }}
      devNowMsOverride={ready.nowMs}
      onPresentationActiveChange={(active) => { presentationActive.current = active; }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.type.displayS,
    color: theme.colors.rewardYellow,
  },
  error: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
    padding: theme.space.xl,
    justifyContent: 'center',
  },
  errorText: {
    ...theme.type.bodyM,
    color: theme.colors.dangerRed,
    textAlign: 'center',
  },
});
