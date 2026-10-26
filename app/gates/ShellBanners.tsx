import React, { useCallback, useEffect, useState } from 'react';
import type { StorageAdapter } from '../../core/data';
import type { Entity } from '../../core/models';
import type { Platform } from '../../features/Platforms/types';
import { NudgeBanner } from '../../features/Platforms/components/NudgeBanner';
import { AlertsOffBanner } from '../../features/Alerts/AlertsOffBanner';
import { AppUpdateBanner } from '../../features/Updates/AppUpdateBanner';
import { ElectionBanner } from '../../features/Election/ElectionBanner';

interface ShellBannersProps {
  /** True while the scorecard presentation owns the screen. */
  suppressed: boolean;
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  onNudgePress: () => void;
  /** Height the visible banner covers, so the shell can pad its content. */
  onTopOffsetChange: (offset: number) => void;
}

/**
 * The shell's top banners, one at a time: the Election Day banner wins (it
 * only runs three days), then the app update banner, the Thursday nudge, and
 * the alerts-off banner.
 */
export function ShellBanners({
  suppressed,
  adapter,
  entities,
  platforms,
  onNudgePress,
  onTopOffsetChange,
}: ShellBannersProps) {
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [nudgeHeight, setNudgeHeight] = useState(0);
  const [alertsVisible, setAlertsVisible] = useState(false);
  const [alertsHeight, setAlertsHeight] = useState(0);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [updateHeight, setUpdateHeight] = useState(0);
  const [electionVisible, setElectionVisible] = useState(false);
  const [electionHeight, setElectionHeight] = useState(0);

  const handleNudgeVisibleChange = useCallback((visible: boolean) => {
    setNudgeVisible(visible);
    if (!visible) setNudgeHeight(0);
  }, []);

  const handleAlertsVisibleChange = useCallback((visible: boolean) => {
    setAlertsVisible(visible);
    if (!visible) setAlertsHeight(0);
  }, []);

  const handleElectionVisibleChange = useCallback((visible: boolean) => {
    setElectionVisible(visible);
    if (!visible) setElectionHeight(0);
  }, []);

  const otherBannerVisible = electionVisible || updateVisible;
  const offset = suppressed
    ? 0
    : electionVisible
      ? electionHeight
      : updateVisible
        ? updateHeight
        : nudgeVisible
          ? nudgeHeight
          : alertsVisible
            ? alertsHeight
            : 0;

  useEffect(() => {
    onTopOffsetChange(offset);
  }, [offset, onTopOffsetChange]);

  return (
    <>
      {!suppressed && (
        <ElectionBanner
          onVisibleChange={handleElectionVisibleChange}
          onHeightChange={setElectionHeight}
        />
      )}
      {!suppressed && !otherBannerVisible && (
        <NudgeBanner
          onPress={onNudgePress}
          onVisibleChange={handleNudgeVisibleChange}
          onHeightChange={setNudgeHeight}
        />
      )}
      {!suppressed && !otherBannerVisible && !nudgeVisible && (
        <AlertsOffBanner
          adapter={adapter}
          entities={entities}
          platforms={platforms}
          onVisibleChange={handleAlertsVisibleChange}
          onHeightChange={setAlertsHeight}
        />
      )}
      <AppUpdateBanner
        suppressed={suppressed || electionVisible}
        onVisibleChange={setUpdateVisible}
        onHeightChange={setUpdateHeight}
      />
    </>
  );
}
