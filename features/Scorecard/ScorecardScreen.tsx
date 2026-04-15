import React, { useCallback, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import type { Entity } from '../../core/models';
import type { StorageAdapter } from '../../core/data';
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
 * Four states:
 *  1. preview — scrollable interactive breakdown (Sat → Fri drop)
 *  2. loading — brief transition while PNG captures
 *  3. presentation — full-screen card takeover + SHARE
 *  4. empty — zero avoids, motivational copy
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

  // Check for existing cached card after drop
  React.useEffect(() => {
    if (!hasDropped || !data) return;
    if (data.grandTotal < MIN_AVOIDS_FOR_DROP) {
      setScreenState('empty');
      return;
    }

    let cancelled = false;
    const path = `${FileSystem.documentDirectory}scorecards/${schedule.weekOf}.png`;

    FileSystem.getInfoAsync(path).then((info) => {
      if (cancelled) return;
      if (info.exists) {
        setCardUri(path);
        setScreenState('presentation');
      }
    });

    return () => { cancelled = true; };
  }, [hasDropped, data, schedule.weekOf]);

  // Generate card on demand (dev tools or post-drop trigger)
  const handleGenerateCard = useCallback(async () => {
    if (!data || data.grandTotal < MIN_AVOIDS_FOR_DROP) return;
    setScreenState('loading');

    // Allow one frame for ScorecardImage to mount off-screen
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
