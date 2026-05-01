import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StorageAdapter } from '../../core/data';
import type { Entity, PoliticalPerson } from '../../core/models';
import { fecFilingUrl } from '../../core/models';
import { platformsCopy } from '../../copy/platforms';
import { sharedCopy } from '../../copy/shared';
import { theme } from '../../design/tokens';
import {
  TRACK_ARENA_FLEX,
  TRACK_ARENA_MAX_HEIGHT,
  TRACK_ARENA_MIN_HEIGHT,
  TRACK_ARENA_SEPARATOR_HEIGHT,
} from '../../config/constants';
import { useCardOverlayAnimation } from '../../core/ui/useCardOverlayAnimation';
import { StarField } from '../Info/components/InfoDecorations';
import { BusinessCard } from '../Map/components/BusinessCard';
import type { ScanResult } from '../Map/types';
import { TrackProvider } from './context/TrackContext';
import { TRACKED_PLATFORMS } from './data/platformList';
import { GameArena } from './components/GameArena';
import { PlatformSetupScreen } from './components/PlatformSetupScreen';
import { TrackHeader } from './components/TrackHeader';
import { TrackList } from './components/TrackList';
import { useNudgeNotification } from './hooks/useNudgeNotification';
import { usePlatformRoster } from './hooks/usePlatformRoster';

interface TrackScreenProps {
  adapter: StorageAdapter;
  entities?: Entity[];
  people?: PoliticalPerson[];
}

export function TrackScreen({ adapter, entities = [], people = [] }: TrackScreenProps) {
  useNudgeNotification();
  const { saveSelection, selectedIds } = usePlatformRoster();
  const [editing, setEditing] = useState(false);
  const [cardEntityId, setCardEntityId] = useState<string | null>(null);

  const activePlatforms = useMemo(() => {
    if (!selectedIds) return [];
    return TRACKED_PLATFORMS.filter((platform) => selectedIds.includes(platform.id));
  }, [selectedIds]);

  // Synthesize a ScanResult from the entity. Same shape BusinessCard expects
  // from the Map's match pipeline. Confidence: 1.0 (curated, not a fuzzy match).
  const cardResult = useMemo<ScanResult | null>(() => {
    if (!cardEntityId) return null;
    const entity = entities.find((e) => e.id === cardEntityId);
    if (!entity) return null;
    const committeeId = entity.fecCommitteeId || '';
    return {
      entityId: entity.id,
      canonicalName: entity.canonicalName,
      matchedAlias: entity.canonicalName,
      committeeName: entity.donationSummary?.committeeName ?? null,
      confidence: 1.0,
      donationSummary: entity.donationSummary ?? null,
      fecCommitteeId: committeeId,
      fecFilingUrl: committeeId ? fecFilingUrl(committeeId) : null,
      entity,
      context: null,
    };
  }, [cardEntityId, entities]);

  // Persistent-mount pattern (same fix as MapScreen for the Fabric sprite-clip
  // bug): keep the BusinessCard subtree mounted across open/close cycles by
  // remembering the last shown result. Visibility toggles via opacity +
  // pointer-events + a11y flags instead of conditional unmount, so RN 0.76 +
  // Fabric never gets to recycle the sprite's clipped native view.
  const lastCardResultRef = useRef<ScanResult | null>(null);
  if (cardResult) {
    lastCardResultRef.current = cardResult;
  }
  const persistentCardResult = cardResult ?? lastCardResultRef.current;
  const cardVisible = cardResult !== null;

  // Slide-in / slide-out + backdrop fade — shared with MapScreen via the
  // useCardOverlayAnimation hook. Wrapper-level slide so BusinessCard's
  // own swipe-dismiss PanResponder runs independently.
  const { slideY, dimOpacity } = useCardOverlayAnimation(cardVisible);

  const handleShowCard = useCallback((entityId: string | null) => {
    if (entityId) setCardEntityId(entityId);
  }, []);

  const handleDismissCard = useCallback(() => {
    setCardEntityId(null);
  }, []);

  const handleDone = useCallback(async (ids: string[]) => {
    await saveSelection(ids);
    setEditing(false);
  }, [saveSelection]);

  if (selectedIds === null) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={theme.colors.frameBlue} />
        <Text style={styles.loadingText} allowFontScaling>
          {platformsCopy.loading}
        </Text>
      </SafeAreaView>
    );
  }

  if (selectedIds === undefined || editing) {
    return (
      <PlatformSetupScreen
        platforms={TRACKED_PLATFORMS}
        initialSelection={selectedIds ?? undefined}
        onDone={handleDone}
      />
    );
  }

  return (
    <TrackProvider adapter={adapter} platforms={activePlatforms}>
      <SafeAreaView style={styles.root}>
        <StarField seed="track" />
        <View style={styles.arenaFrame}>
          <TrackHeader onEdit={() => setEditing(true)} />
          {/* Solid-bg wrapper around GameArena — defense against any
              inset boxShadow bleed from GameArena's container leaking
              past its bounds. Any leak lands on bgVoid here, not on
              the StarField behind. */}
          <View style={styles.gameArenaWrap}>
            <GameArena />
          </View>
        </View>
        <View style={styles.separator} />
        <TrackList onShowCard={handleShowCard} />

        {/* SEE FILE business-card overlay. Persistent mount after first open
            so Fabric doesn't recycle the sprite's clipped native view between
            shows. Backdrop = single Animated.View that combines the dim
            layer with the tap-to-dismiss target. */}
        {persistentCardResult && (
          <>
            <Animated.View
              style={[styles.dimBackdrop, { opacity: dimOpacity }]}
              pointerEvents={cardVisible ? 'auto' : 'none'}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleDismissCard}
                accessibilityRole="button"
                accessibilityLabel={sharedCopy.dismissLabel}
              />
            </Animated.View>
            <Animated.View
              style={[styles.cardContainer, { transform: [{ translateY: slideY }] }]}
              pointerEvents={cardVisible ? 'auto' : 'none'}
              accessibilityElementsHidden={!cardVisible}
              importantForAccessibility={cardVisible ? 'auto' : 'no-hide-descendants'}
            >
              <BusinessCard
                result={persistentCardResult}
                onAvoid={async () => {}}
                onDismiss={handleDismissCard}
                allEntities={entities}
                people={people}
                hideAvoid
                visible={cardVisible}
              />
            </Animated.View>
          </>
        )}
      </SafeAreaView>
    </TrackProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
  },
  arenaFrame: {
    flex: TRACK_ARENA_FLEX,
    minHeight: TRACK_ARENA_MIN_HEIGHT,
    maxHeight: TRACK_ARENA_MAX_HEIGHT,
    overflow: 'hidden',
    backgroundColor: theme.colors.panelOuter,
    // 1px cyan outline framing the arena on all four sides — this is
    // the visible "edge" of the arena and reads as the beginning of
    // the interior glow that fills inward from the inset boxShadow on
    // GameArena's container. Replaces the old bevelFocusRaised (2px
    // raised plaque w/ light + dark sides) for a cleaner uniform feel.
    borderWidth: 1,
    borderColor: theme.colors.focusBevelLight,
  },
  gameArenaWrap: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
    overflow: 'hidden',
    // Top is the visible divider below the header — full 2px reads as
    // the screen's leading edge. Other three sides drop to 1px so they
    // don't stack visually with arenaFrame's existing 1px outline.
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.focusBevelLight,
  },
  separator: {
    // Empty spacer — provides vertical breathing room between the
    // arena and the platform list. No bg or shadow because the arena
    // now has its own 1px cyan outline acting as the edge accent;
    // this used to be a glowDividerLine but the rgba bg leaked
    // StarField through, and a solid bg felt redundant with the new
    // arena outline.
    height: TRACK_ARENA_SEPARATOR_HEIGHT,
  },
  // Combined dim + tap-dismiss layer. Black bg modulated by the animated
  // opacity from useCardOverlayAnimation — fades in/out alongside the
  // card slide. Peak alpha = CARD_OVERLAY_DIM_PEAK_OPACITY.
  dimBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  // Bottom-anchored card wrapper. maxHeight 65% gives the half-sheet feel
  // while the absolute-positioned wrapper itself spans the bottom of the
  // screen (above the dim backdrop).
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
    maxHeight: '65%',
    paddingTop: theme.space['3xl'],
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    backgroundColor: theme.colors.bgVoid,
  },
  loadingText: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
  },
});
