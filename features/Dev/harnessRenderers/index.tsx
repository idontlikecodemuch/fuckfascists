/**
 * Harness renderer dispatch — maps step IDs to rendered screen states.
 * DEV ONLY — never imported outside features/Dev/.
 */
import React from 'react';
import {
  renderLaunchDefault,
  renderOnboardWelcome,
  renderOnboardPrivacy,
  renderOnboardPermsPreGrant,
  renderOnboardPermsGranted,
} from './gateStates';
import {
  renderMapDefault,
  renderMapCardPreAvoid,
  renderMapCardPostAvoid,
  renderMapMatchChooser,
  renderMapNoMatch,
} from './mapStates';
import {
  renderTrackCollapsed,
  renderTrackExpanded,
  renderTrackAvoided,
  renderTrackArenaNeutral,
  renderTrackArenaPortrait,
  renderTrackSetup,
} from './trackStates';
import {
  renderScorecardPopulated,
  renderScorecardEmpty,
  renderInfoDefault,
  renderInfoTransparency,
  renderInfoFaq,
  renderScanDefault,
  renderScanScannerOpen,
  renderScanResultPreAvoid,
  renderScanResultPostAvoid,
  renderScanNoMatch,
} from './contentStates';

const RENDERERS: Record<string, () => React.ReactElement> = {
  // Gates
  launch_default: renderLaunchDefault,
  onboard_welcome: renderOnboardWelcome,
  onboard_privacy: renderOnboardPrivacy,
  onboard_perms_pregrant: renderOnboardPermsPreGrant,
  onboard_perms_granted: renderOnboardPermsGranted,

  // Map
  map_default: renderMapDefault,
  map_card_pre_avoid: renderMapCardPreAvoid,
  map_card_post_avoid: renderMapCardPostAvoid,
  map_match_chooser: renderMapMatchChooser,
  map_no_match: renderMapNoMatch,

  // Track
  track_collapsed: renderTrackCollapsed,
  track_expanded: renderTrackExpanded,
  track_avoided: renderTrackAvoided,
  track_arena_neutral: renderTrackArenaNeutral,
  track_arena_portrait: renderTrackArenaPortrait,
  track_setup: renderTrackSetup,

  // Scorecard
  scorecard_populated: renderScorecardPopulated,
  scorecard_empty: renderScorecardEmpty,

  // Info
  info_default: renderInfoDefault,
  info_transparency: renderInfoTransparency,
  info_faq: renderInfoFaq,

  // Scan
  scan_default: renderScanDefault,
  scan_scanner_open: renderScanScannerOpen,
  scan_result_pre_avoid: renderScanResultPreAvoid,
  scan_result_post_avoid: renderScanResultPostAvoid,
  scan_no_match: renderScanNoMatch,

  // Tab bar — reuses map default (tab bar is always visible via AppShell)
  tabbar_full: renderMapDefault,
};

/**
 * Render the React element for a given harness step ID.
 * Returns null if the step ID is unknown.
 */
export function renderHarnessStep(stepId: string): React.ReactElement | null {
  const renderer = RENDERERS[stepId];
  return renderer ? renderer() : null;
}
