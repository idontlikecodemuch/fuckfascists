/**
 * Which early-week nudge lines go out on which weekday, and which tab a tap
 * opens. Copy lives in copy/platforms.ts; this file only assigns it.
 */

import { platformsCopy } from '../../../copy/platforms';

/** Tabs an early-week nudge can open (a subset of the app's Tab ids). */
export type EarlyWeekNudgeTab = 'platforms' | 'map';

export interface EarlyWeekNudgeLine {
  readonly title: string;
  readonly body: string;
  /** Lines about apps open Track; lines about places open the map. */
  readonly opens: EarlyWeekNudgeTab;
}

const lines = platformsCopy.earlyNudges;

/** Keyed by local weekday (0 = Sunday). Must cover EARLY_WEEK_NUDGE_DAYS. */
export const EARLY_WEEK_NUDGE_LINES: Readonly<Record<number, readonly EarlyWeekNudgeLine[]>> = {
  1: [
    { ...lines.mondayCure, opens: 'platforms' },
    { ...lines.mondayAutopilot, opens: 'platforms' },
    { ...lines.mondayFairGame, opens: 'map' },
    { ...lines.mondayNewWeek, opens: 'platforms' },
  ],
  2: [
    { ...lines.tuesdayYesterday, opens: 'platforms' },
    { ...lines.tuesdayTaco, opens: 'map' },
    { ...lines.tuesdayWhyNot, opens: 'platforms' },
    { ...lines.tuesdayBite, opens: 'map' },
  ],
};

export function earlyWeekNudgeLinesForDay(weekday: number): readonly EarlyWeekNudgeLine[] {
  return EARLY_WEEK_NUDGE_LINES[weekday] ?? [];
}

export function isEarlyWeekNudgeTab(value: unknown): value is EarlyWeekNudgeTab {
  return value === 'platforms' || value === 'map';
}
