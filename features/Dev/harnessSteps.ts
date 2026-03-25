/**
 * Step definitions for the screenshot harness.
 * Each step maps to a specific screen + state combination.
 * DEV ONLY — never imported outside features/Dev/.
 */

export interface HarnessStep {
  /** Unique identifier — used as switch key in renderers. */
  id: string;
  /** Screenshot surface name (first segment of filename). */
  surface: string;
  /** State descriptor (second segment of filename). */
  state: string;
  /** Human-readable label shown in progress UI. */
  label: string;
}

/** All states to capture during a full sweep. */
export const HARNESS_STEPS: HarnessStep[] = [
  // Launch
  { id: 'launch_default', surface: 'launch', state: 'default', label: 'Launch \u2014 default' },

  // Onboarding
  { id: 'onboard_welcome', surface: 'onboard', state: 'welcome', label: 'Onboarding \u2014 welcome' },
  { id: 'onboard_privacy', surface: 'onboard', state: 'privacy', label: 'Onboarding \u2014 your data' },
  { id: 'onboard_perms_pregrant', surface: 'onboard', state: 'perms_pregrant', label: 'Onboarding \u2014 setup (pre-grant)' },
  { id: 'onboard_perms_granted', surface: 'onboard', state: 'perms_granted', label: 'Onboarding \u2014 setup (granted)' },

  // Map
  { id: 'map_default', surface: 'map', state: 'default', label: 'Map \u2014 default' },
  { id: 'map_card_pre_avoid', surface: 'map', state: 'card_pre_avoid', label: 'Map \u2014 card (pre-avoid)' },
  { id: 'map_card_post_avoid', surface: 'map', state: 'card_post_avoid', label: 'Map \u2014 card (post-avoid)' },
  { id: 'map_match_chooser', surface: 'map', state: 'match_chooser', label: 'Map \u2014 match chooser' },
  { id: 'map_no_match', surface: 'map', state: 'no_match', label: 'Map \u2014 no match toast' },

  // Track
  { id: 'track_collapsed', surface: 'track', state: 'collapsed', label: 'Track \u2014 collapsed' },
  { id: 'track_expanded', surface: 'track', state: 'expanded', label: 'Track \u2014 expanded + day circles' },
  { id: 'track_avoided', surface: 'track', state: 'avoided', label: 'Track \u2014 avoided state' },
  { id: 'track_arena_neutral', surface: 'track', state: 'arena_neutral', label: 'Track \u2014 arena grid' },
  { id: 'track_arena_portrait', surface: 'track', state: 'arena_portrait', label: 'Track \u2014 arena portrait' },
  { id: 'track_setup', surface: 'track', state: 'setup', label: 'Track \u2014 platform setup' },

  // Scorecard
  { id: 'scorecard_populated', surface: 'scorecard', state: 'populated', label: 'Scorecard \u2014 populated' },
  { id: 'scorecard_empty', surface: 'scorecard', state: 'empty', label: 'Scorecard \u2014 empty' },

  // Info
  { id: 'info_default', surface: 'info', state: 'default', label: 'Info \u2014 default collapsed' },
  { id: 'info_transparency', surface: 'info', state: 'transparency', label: 'Info \u2014 transparency expanded' },
  { id: 'info_faq', surface: 'info', state: 'faq', label: 'Info \u2014 FAQ expanded' },

  // Scan
  { id: 'scan_default', surface: 'scan', state: 'default', label: 'Scan \u2014 default' },
  { id: 'scan_scanner_open', surface: 'scan', state: 'scanner_open', label: 'Scan \u2014 scanner open' },
  { id: 'scan_result_pre_avoid', surface: 'scan', state: 'result_pre_avoid', label: 'Scan \u2014 result (pre-avoid)' },
  { id: 'scan_result_post_avoid', surface: 'scan', state: 'result_post_avoid', label: 'Scan \u2014 result (post-avoid)' },
  { id: 'scan_no_match', surface: 'scan', state: 'no_match', label: 'Scan \u2014 no match' },

  // Tab bar (captured from map view — tab bar always visible)
  { id: 'tabbar_full', surface: 'tabbar', state: 'full', label: 'Tab bar \u2014 from MAP' },
];

export type HarnessMode = 'full' | 'a11y' | 'notification';

/**
 * Build the filename for a captured step.
 * Full sweep: ff_map_default.png
 * A11y pass:  ff_map_default_a11y.png
 */
export function filenameForStep(step: HarnessStep, mode: HarnessMode): string {
  const suffix = mode === 'a11y' ? '_a11y' : '';
  return `ff_${step.surface}_${step.state}${suffix}.png`;
}

/** Notification-only step for mode 3. */
export const NOTIFICATION_STEP: HarnessStep = {
  id: 'notification_thursday',
  surface: 'notification',
  state: 'thursday',
  label: 'Notification \u2014 Thursday nudge',
};
