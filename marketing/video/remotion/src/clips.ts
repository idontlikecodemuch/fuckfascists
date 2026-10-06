import { staticFile } from 'remotion';
import type { Cut } from './timing';

/**
 * Pre-trimmed segments (scripts/prep-clips.sh → marketing/video/clips/).
 * Times are seconds relative to the clip start.
 *  - shakeAt: AVOID stamp / arena hit → 2 px frame shake
 *  - revealAt: gold reveal flash in the drop footage → 3 px shake
 *  - rainAt: when our own money-rain layer starts
 *  - notificationAt: fraction of the panel when the iOS banner drops in
 */
export type ClipKind = 'phone' | 'phonedev' | 'full';
export type ClipSpec = {
  file: string;
  kind: ClipKind;
  anchor?: 'top' | 'bottom';
  shakeAt?: number;
  revealAt?: number;
  rainAt?: number;
  notificationAt?: number;
  /**
   * Full-bleed staging. align: which edge keeps the 5% aspect sliver. report: the file is
   * up for the whole beat (no box, no Clark; he glitches out if he was on screen before).
   * reportAt: seconds into the beat when the file comes up (Clark glitches out, box leaves).
   * clarkOpacity: 0 hides Clark for list-heavy beats. startFrom: seconds skipped at the
   * head of the clip (brings the payoff sooner).
   */
  full?: { align?: 'top' | 'center' | 'bottom'; report?: boolean; reportAt?: number; clarkOpacity?: number; startFrom?: number };
};

const MAP_TAP = { align: 'bottom', startFrom: 0.8 } as const;
const MAP_FILE = { align: 'bottom', report: true } as const;
const MAP_AVOID = { align: 'bottom', report: true, startFrom: 0.3 } as const;
const TRACK = { align: 'top', clarkOpacity: 0 } as const;
const SCAN_CAM = { align: 'bottom' } as const;
const SCAN_FILE = { align: 'bottom', report: true, startFrom: 0.4 } as const;
const CARD_PREVIEW = { align: 'top' } as const;

export const CLIPS: Record<string, ClipSpec> = {
  // one alignment per feature so the footage never moves between beats
  '60-03': { file: '60_03_map_pins', kind: 'phone', full: MAP_TAP },
  '60-04': { file: '60_04_map_card', kind: 'phone', full: MAP_FILE },
  '60-05': { file: '60_05_map_avoid', kind: 'phone', shakeAt: 0.85, full: MAP_AVOID },
  '60-06': { file: '60_06_track_grid', kind: 'phone', full: TRACK },
  '60-07': { file: '60_07_track_week', kind: 'phone', full: TRACK },
  '60-08': { file: '60_08_track_defeat', kind: 'phone', shakeAt: 0.7, full: TRACK },
  '60-09': { file: '60_09_scan_camera', kind: 'phone', full: SCAN_CAM },
  '60-10': { file: '60_10_scan_card', kind: 'phone', shakeAt: 2.15, full: SCAN_FILE },
  '60-11': { file: '60_11_scorecard_preview', kind: 'phonedev', notificationAt: 0.6, full: CARD_PREVIEW },
  '60-12': { file: '60_12_drop', kind: 'full', revealAt: 0.72, rainAt: 1.3 },
  '60-13': { file: '60_13_share', kind: 'full', anchor: 'bottom' },
  // combined beats: the file comes up part-way through
  '30-03': { file: '30_03_map', kind: 'phone', shakeAt: 2.75, full: { align: 'bottom', reportAt: 0.95 } },
  '30-04': { file: '30_04_track', kind: 'phone', shakeAt: 3.45, full: TRACK },
  '30-05': { file: '30_05_scan', kind: 'phone', full: { align: 'bottom', reportAt: 1.4 } },
  '30-06': { file: '30_06_drop', kind: 'full', revealAt: 0.62, rainAt: 1.2 },
  '15-02': { file: '15_02_tap', kind: 'phone', shakeAt: 1.45, full: { align: 'bottom', report: true } },
  '15-03': { file: '15_03_trackscan', kind: 'phone', shakeAt: 0.45, full: { align: 'center', clarkOpacity: 0, reportAt: 1.5 } },
  '15-04': { file: '15_04_drop', kind: 'full', revealAt: 0.62, rainAt: 1.2 },
  // per-tab shorts reuse the 60's beats
  'map-02': { file: '60_03_map_pins', kind: 'phone', full: MAP_TAP },
  'map-03': { file: '60_04_map_card', kind: 'phone', full: MAP_FILE },
  'map-04': { file: '60_05_map_avoid', kind: 'phone', shakeAt: 0.85, full: MAP_AVOID },
  'track-02': { file: '60_06_track_grid', kind: 'phone', full: TRACK },
  'track-03': { file: '60_07_track_week', kind: 'phone', full: TRACK },
  'track-04': { file: '60_08_track_defeat', kind: 'phone', shakeAt: 0.7, full: TRACK },
  'scan-02': { file: '60_09_scan_camera', kind: 'phone', full: SCAN_CAM },
  'scan-03': { file: '60_10_scan_card', kind: 'phone', shakeAt: 2.15, full: SCAN_FILE },
  'card-02': { file: '60_11_scorecard_preview', kind: 'phonedev', notificationAt: 0.6, full: CARD_PREVIEW },
  'card-03': { file: '60_12_drop', kind: 'full', revealAt: 0.72, rainAt: 1.3 },
  'card-04': { file: '60_13_share', kind: 'full', anchor: 'bottom' },
};

/**
 * Full-bleed intro backgrounds, per line: the app's own opening screens instead of an
 * empty map. clark=false where the footage already shows him (his memo).
 */
export const INTRO_BG: Record<string, { file: string; clark: boolean }> = {
  'c60-02-2': { file: 'intro_welcome', clark: true }, // the Welcome screen (creator cut the memo: "Clark about Clark")
  'c60-02-3': { file: 'hook_card_rain', clark: true }, // "That card?" → the card itself
  'c30-02-2': { file: 'intro_welcome', clark: true }, // "No accounts. No tracking." (c30-02-1 is the live office take)
};

export const HOOK_CLIP = 'hook_card_rain';

/**
 * Cold opens for the per-tab shorts (ColdOpenPanel): the payoff moment, ~1.5 s, before
 * the title card. startFrom/shakeAt in seconds; shakeAt is relative to the open's start.
 */
export type ColdOpen = { file: string; startFrom: number; align: 'top' | 'center' | 'bottom'; shakeAt?: number; rain?: boolean };
export const COLD_OPEN: Partial<Record<Cut, ColdOpen>> = {
  map: { file: '60_05_map_avoid', startFrom: 0.3, align: 'bottom', shakeAt: 0.55 }, // file up → AVOID stamp at 0.55 s
  track: { file: '60_08_track_defeat', startFrom: 0.2, align: 'top', shakeAt: 0.5 }, // today's tap → Musk defeated at 0.5 s
  scan: { file: '30_05_scan', startFrom: 0.7, align: 'bottom' }, // barcode lock → Coca-Cola record at 0.7 s
  card: { file: '60_12_drop', startFrom: 0.9, align: 'top', rain: true }, // the card, our rain from frame 0, the app's at 0.4 s
};
export const clipSrc = (file: string): string => staticFile(`media/clips/${file}.mp4`);
export const MAP_STILL = staticFile('media/clips/map_still.png');
export const PREVIEW_STILL = staticFile('media/clips/preview_still.png');
export const CLARK_BUST = staticFile('media/clark/clark_bust_2x.png');
export const CLARK_FULL = staticFile('media/clark/clark_alpha.png');
export const LOGO_H = staticFile('media/brand/FF_logo_horizontal.png');
/** Optional 16:9 'in context' Clark scene for a line (wide intro): clips/clark/scene/<id>.mp4 */
export const clarkSceneFrame = (id: string, index: number): string =>
  staticFile(`media/clips/clark/scene/${id}/${String(index + 1).padStart(4, '0')}.jpg`);
/** Music bed per cut: the punk bed (64 s) and its 30 s / 15 s edits (hopeful files kept beside them); shorts use the 15. */
export const musicSrc = (cut: Cut): string =>
  staticFile(cut === '60' ? 'media/music/fck_bed_punk_64s.mp3' : cut === '30' ? 'media/music/fck_bed_punk_30s.mp3' : 'media/music/fck_bed_punk_15s.mp3');
export const STARFIELD = staticFile('assets/star_field_base.png');
export const LOGO = staticFile('assets/FF_logo.png');
export const APP_ICON = staticFile('assets/icon.png');
export const CASH = [0, 1, 2, 3].map((i) => staticFile(`assets/cash_${i}.png`));
/** Optional keyed Veo clip per line (scripts/prep-clark.sh → clips/clark/<id>.webm). */
export const clarkVeoFrame = (id: string, index: number): string =>
  staticFile(`media/clips/clark/${id}/${String(index + 1).padStart(4, '0')}.png`);
