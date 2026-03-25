/**
 * Copy strings for the dev-only screenshot harness.
 * DEV ONLY — never imported by production components.
 */
export const harnessCopy = {
  // BetaOverlay button
  shotsButton: 'SHOTS',
  shotsButtonLabel: 'Open screenshot harness',

  // Mode selector
  title: 'SCREENSHOT HARNESS',
  modeFullLabel: 'FULL SWEEP',
  modeFullDesc: 'Every surface, every state',
  modeA11yLabel: 'A11Y PASS',
  modeA11yDesc: 'Same sweep, largest Dynamic Type',
  modeNotifLabel: 'NOTIFICATION',
  modeNotifDesc: 'Fire Thursday nudge now',

  // Progress
  capturing: (current: number, total: number) => `Capturing ${current} of ${total}`,
  stepLabel: (label: string) => label,

  // Completion
  done: (count: number) => `Done \u2014 ${count} screenshots saved to camera roll.`,
  cancelled: 'Harness cancelled.',
  cancelButton: 'CANCEL',

  // Pre-flight
  a11yPreflight: (scale: number) =>
    `Current font scale: ${scale.toFixed(1)}\u00d7. For a true Dynamic Type pass, ` +
    'set your device to the largest text size in Settings \u203a Accessibility \u203a ' +
    'Display & Text Size \u203a Larger Text. Tap OK to proceed with the current scale.',
  a11yPreflightTitle: 'Dynamic Type',

  // Notification
  notifFired: 'Thursday nudge notification fired. Check your notification shade to capture it manually.',
  notifTitle: 'Notification Sent',
} as const;
