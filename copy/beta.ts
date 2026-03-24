import type { Tab } from '../app/navigation/TabBar';

/** Human-readable surface labels used in screenshot filenames and alerts. */
const SURFACE_LABELS: Record<Tab, string> = {
  map: 'map',
  scan: 'scan',
  platforms: 'track',
  report: 'scorecard',
  info: 'info',
  dev: 'dev',
} as const;

export const betaCopy = {
  indicator: "BETA",
  indicatorLabel: "Beta testing mode is active",
  bugButton: "BUG",
  bugButtonLabel: "Report a bug — captures screenshot",
  resetButton: "RESET",
  resetButtonLabel: "Reset app state for a fresh-install style test",
  screenshotSaved: (surface: string) => `Screenshot saved: ${surface}`,
  screenshotFailed: "Could not save screenshot.",
  resetConfirmTitle: "Reset app for testing?",
  resetConfirmBody: "This clears onboarding, launch flags, platform setup, avoid history, and barcode cache so you can test from the beginning again.",
  resetCancelAction: "Cancel",
  resetConfirmAction: "Reset now",
  resetDone: "App state reset. Fully close and reopen the app to start from onboarding again.",
  resetFailed: "Could not reset app state.",
  activated: "Beta mode ON",
  deactivated: "Beta mode OFF",
  surfaceLabel: (tab: Tab): string => SURFACE_LABELS[tab],
} as const;
