import React, { useCallback, useEffect, useState } from 'react';
import type { StorageAdapter } from '../../core/data';
import type { Entity } from '../../core/models';
import type { Platform } from '../../features/Platforms/types';
import { NudgeBanner } from '../../features/Platforms/components/NudgeBanner';
import { AlertsOffBanner } from '../../features/Alerts/AlertsOffBanner';
import { AppUpdateBanner } from '../../features/Updates/AppUpdateBanner';

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
 * The shell's top banners, one at a time: the app update banner wins, then
 * the Thursday nudge, then the alerts-off banner.
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

  const handleNudgeVisibleChange = useCallback((visible: boolean) => {
    setNudgeVisible(visible);
    if (!visible) setNudgeHeight(0);
  }, []);

  const handleAlertsVisibleChange = useCallback((visible: boolean) => {
    setAlertsVisible(visible);
    if (!visible) setAlertsHeight(0);
  }, []);

  const offset = suppressed
    ? 0
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
      {!suppressed && !updateVisible && (
        <NudgeBanner
          onPress={onNudgePress}
          onVisibleChange={handleNudgeVisibleChange}
          onHeightChange={setNudgeHeight}
        />
      )}
      {!suppressed && !updateVisible && !nudgeVisible && (
        <AlertsOffBanner
          adapter={adapter}
          entities={entities}
          platforms={platforms}
          onVisibleChange={handleAlertsVisibleChange}
          onHeightChange={setAlertsHeight}
        />
      )}
      <AppUpdateBanner
        suppressed={suppressed}
        onVisibleChange={setUpdateVisible}
        onHeightChange={setUpdateHeight}
      />
    </>
  );
}
