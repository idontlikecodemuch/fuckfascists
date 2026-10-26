import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SlidingAlertBanner } from '../../core/ui/SlidingAlertBanner';
import { formatLocalDate } from '../../core/utils/localDate';
import { electionCopy } from '../../copy/election';
import { sharedCopy } from '../../copy/shared';
import { getElectionBannerPhase, type ElectionBannerPhase } from './electionDays';

/** SecureStore key: the local date the banner was last hidden (one day at a time). */
export const ELECTION_BANNER_DISMISSED_KEY = 'election_banner_dismissed';

interface ElectionBannerProps {
  onVisibleChange?: (visible: boolean) => void;
  onHeightChange?: (height: number) => void;
}

/**
 * Election Day banner (owner 2026-10-26): from two days before through
 * Election Day, for everyone who opens the app, notifications or not. A tap
 * opens VOTE411 in the browser; tapping it or × hides it for the rest of that
 * day. Re-checked whenever the app becomes active (the day may have changed).
 */
export function ElectionBanner({ onVisibleChange, onHeightChange }: ElectionBannerProps) {
  const [phase, setPhase] = useState<ElectionBannerPhase | null>(null);

  const evaluate = useCallback(async () => {
    const now = Date.now();
    const next = getElectionBannerPhase(now);
    if (!next) {
      setPhase(null);
      return;
    }
    let dismissedOn: string | null = null;
    try {
      dismissedOn = await SecureStore.getItemAsync(ELECTION_BANNER_DISMISSED_KEY);
    } catch {
      // Unreadable: show it; at worst it shows again today.
    }
    setPhase(dismissedOn === formatLocalDate(new Date(now)) ? null : next);
  }, []);

  useEffect(() => {
    void evaluate();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void evaluate();
    });
    return () => subscription.remove();
  }, [evaluate]);

  const hideForToday = useCallback(() => {
    setPhase(null);
    SecureStore.setItemAsync(ELECTION_BANNER_DISMISSED_KEY, formatLocalDate(new Date())).catch(() => undefined);
  }, []);
  const handlePress = useCallback(() => {
    Linking.openURL(sharedCopy.voteInfoUrl).catch(() => undefined);
  }, []);

  if (!phase) return null;
  const day = phase === 'day';

  return (
    <SlidingAlertBanner
      title={day ? electionCopy.bannerDayTitle : electionCopy.bannerBeforeTitle}
      body={day ? electionCopy.bannerDayBody : electionCopy.bannerBeforeBody}
      bodyA11yLabel={day ? electionCopy.bannerDayA11y : electionCopy.bannerBeforeA11y}
      onPress={handlePress}
      onHidden={hideForToday}
      dismissA11yLabel={electionCopy.dismissA11y}
      onVisibleChange={onVisibleChange}
      onHeightChange={onHeightChange}
      showSparkles
    />
  );
}
