import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { StorageAdapter } from '../../core/data';
import type { Entity } from '../../core/models';
import type { Platform } from '../Platforms/types';
import { SlidingAlertBanner } from '../../core/ui/SlidingAlertBanner';
import { alertsCopy } from '../../copy/alerts';
import {
  getPendingScorecardDropWeek,
  shouldLaunchPendingScorecardDrop,
} from '../Scorecard/utils/pendingDropLaunch';
import { useAlerts } from './AlertsContext';
import {
  readAlertsAskRecord,
  shouldShowAlertsAsk,
  withShown,
  withStopped,
  writeAlertsAskRecord,
  type AlertsAskRecord,
} from './alertsAskRecord';

interface AlertsOffBannerProps {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  onVisibleChange?: (visible: boolean) => void;
  onHeightChange?: (height: number) => void;
}

// Drop week shown in this app session, so a failed record write can't
// bring the banner back on every resume.
let shownThisSession: string | null = null;

/**
 * "Alerts are off" banner (option C, owner 2026-10-25). While notifications
 * are off, the first open inside a drop's 48h window shows it, after that
 * drop's card reveal (or late reveal) has been seen; every other drop, at
 * most three times. A tap asks iOS or opens Settings; "No thanks" ends it.
 */
export function AlertsOffBanner({
  adapter,
  entities,
  platforms,
  onVisibleChange,
  onHeightChange,
}: AlertsOffBannerProps) {
  const { permission, checkVersion, openControl } = useAlerts();
  const [weekOf, setWeekOf] = useState<string | null>(null);
  const recordRef = useRef<AlertsAskRecord | null>(null);
  // Sync-ref: only read inside async work, not render inputs.
  const inputsRef = useRef({ adapter, entities, platforms });
  inputsRef.current = { adapter, entities, platforms };

  const alertsOff = permission !== null && permission.status !== 'on';

  useEffect(() => {
    if (!alertsOff) {
      setWeekOf(null);
      return undefined;
    }
    let cancelled = false;

    const evaluate = async () => {
      const dropWeek = getPendingScorecardDropWeek(Date.now());
      if (!dropWeek || shownThisSession === dropWeek) return;
      const record = await readAlertsAskRecord();
      if (cancelled || !record || !shouldShowAlertsAsk(record, dropWeek)) return;
      // The drop's card reveal comes first; the banner follows it.
      if (await shouldLaunchPendingScorecardDrop(inputsRef.current)) return;
      if (cancelled || shownThisSession === dropWeek) return;

      shownThisSession = dropWeek;
      recordRef.current = withShown(record, dropWeek);
      setWeekOf(dropWeek);
      await writeAlertsAskRecord(recordRef.current);
    };

    void evaluate();
    return () => { cancelled = true; };
  }, [alertsOff, checkVersion]);

  const handleHidden = useCallback(() => setWeekOf(null), []);
  const handlePress = useCallback(() => { void openControl(); }, [openControl]);
  const handleNoThanks = useCallback(() => {
    if (recordRef.current) void writeAlertsAskRecord(withStopped(recordRef.current));
  }, []);

  if (!weekOf || !alertsOff) return null;

  return (
    <SlidingAlertBanner
      title={alertsCopy.bannerTitle}
      body={alertsCopy.bannerBody}
      bodyA11yLabel={alertsCopy.bannerA11y}
      onPress={handlePress}
      onHidden={handleHidden}
      dismissA11yLabel={alertsCopy.dismissA11y}
      secondaryLabel={alertsCopy.noThanks}
      secondaryA11yLabel={alertsCopy.noThanksA11y}
      onSecondaryPress={handleNoThanks}
      onVisibleChange={onVisibleChange}
      onHeightChange={onHeightChange}
    />
  );
}
