import React, { useState, useEffect, useCallback } from 'react';
import { LaunchScreen, shouldShowLaunchScreen } from '../../features/Launch/LaunchScreen';

interface LaunchGateProps {
  children: React.ReactNode;
}

/**
 * Shows the daily launch screen (once per calendar day) before rendering children.
 * Returns null while checking — the parent splash screen covers this gap.
 */
export function LaunchGate({ children }: LaunchGateProps) {
  const [showLaunch, setShowLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    shouldShowLaunchScreen()
      .then((show) => { if (!cancelled) setShowLaunch(show); })
      .catch(() => { if (!cancelled) setShowLaunch(false); });
    return () => { cancelled = true; };
  }, []);

  const dismissLaunch = useCallback(() => setShowLaunch(false), []);

  if (showLaunch === null) return null;
  if (showLaunch) return <LaunchScreen onDismiss={dismissLaunch} />;

  return <>{children}</>;
}
