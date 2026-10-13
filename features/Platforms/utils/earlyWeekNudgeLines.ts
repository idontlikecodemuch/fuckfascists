/**
 * The early-week nudge lines, in copy order: when each may go out and which
 * tab a tap opens. Copy lives in copy/platforms.ts; this file only assigns it.
 * A line without days or hours can land on any usable minute of the default
 * EARLY_WEEK_NUDGE_* window.
 */

import { platformsCopy } from '../../../copy/platforms';
import {
  EARLY_WEEK_NUDGE_COFFEE_END_HOUR,
  EARLY_WEEK_NUDGE_COFFEE_START_HOUR,
  EARLY_WEEK_NUDGE_EARLY_DAY_END_HOUR,
  EARLY_WEEK_NUDGE_LUNCH_END_HOUR,
  EARLY_WEEK_NUDGE_LUNCH_START_HOUR,
} from '../../../config/constants';
import type { EarlyWeekNudgeTiming } from './earlyWeekNudge';

/** Tabs an early-week nudge can open (a subset of the app's Tab ids). */
export type EarlyWeekNudgeTab = 'platforms' | 'map';

export interface EarlyWeekNudgeLine {
  readonly title: string;
  readonly body: string;
  /** Lines about logging open Track; lines about places and spending open the map. */
  readonly opens: EarlyWeekNudgeTab;
  readonly timing: EarlyWeekNudgeTiming;
}

const MONDAY = 1;
const TUESDAY = 2;
const lines = platformsCopy.earlyNudges;

export const EARLY_WEEK_NUDGE_LINES: readonly EarlyWeekNudgeLine[] = [
  { ...lines.mondayCure, opens: 'platforms', timing: { days: [MONDAY] } },
  { ...lines.mondayFairGame, opens: 'map', timing: { days: [MONDAY] } },
  {
    ...lines.tuesdayYesterday,
    opens: 'platforms',
    timing: { days: [TUESDAY], endHour: EARLY_WEEK_NUDGE_EARLY_DAY_END_HOUR },
  },
  { ...lines.tuesdayTaco, opens: 'map', timing: { days: [TUESDAY] } },
  { ...lines.tuesdayWhyNot, opens: 'map', timing: { days: [TUESDAY] } },
  {
    ...lines.lunch,
    opens: 'map',
    timing: { startHour: EARLY_WEEK_NUDGE_LUNCH_START_HOUR, endHour: EARLY_WEEK_NUDGE_LUNCH_END_HOUR },
  },
  {
    ...lines.coffee,
    opens: 'map',
    timing: { startHour: EARLY_WEEK_NUDGE_COFFEE_START_HOUR, endHour: EARLY_WEEK_NUDGE_COFFEE_END_HOUR },
  },
  { ...lines.newWeek, opens: 'platforms', timing: {} },
];

/** One timing per line, in the same order, for the scheduler. */
export const EARLY_WEEK_NUDGE_TIMINGS: readonly EarlyWeekNudgeTiming[] =
  EARLY_WEEK_NUDGE_LINES.map((line) => line.timing);

export function isEarlyWeekNudgeTab(value: unknown): value is EarlyWeekNudgeTab {
  return value === 'platforms' || value === 'map';
}
