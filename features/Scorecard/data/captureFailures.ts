import * as SecureStore from 'expo-secure-store';
import {
  SCORECARD_CAPTURE_GIVE_UP_DAYS,
  SCORECARD_CAPTURE_GIVE_UP_MIN_ATTEMPTS,
  SCORECARD_CAPTURE_GIVE_UP_MIN_FAILING_DAYS,
} from '../../../config/constants';

export const CAPTURE_FAILURES_KEY = 'scorecard_capture_failures';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Failed-capture history for one week. No content, only timing and a count. */
export interface CaptureFailure {
  firstFailedAt: number;
  attempts: number;
}

/** Week date (YYYY-MM-DD) → failure history. */
export type CaptureFailures = Record<string, CaptureFailure>;

function isCaptureFailure(value: unknown): value is CaptureFailure {
  if (typeof value !== 'object' || value === null) return false;
  const { firstFailedAt, attempts } = value as Record<string, unknown>;
  return Number.isFinite(firstFailedAt) && Number.isInteger(attempts) && (attempts as number) > 0;
}

export async function readCaptureFailures(): Promise<CaptureFailures> {
  try {
    const raw = await SecureStore.getItemAsync(CAPTURE_FAILURES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== 'object' || parsed === null) return {};
    const failures: CaptureFailures = {};
    for (const [weekOf, value] of Object.entries(parsed)) {
      if (WEEK_PATTERN.test(weekOf) && isCaptureFailure(value)) failures[weekOf] = value;
    }
    return failures;
  } catch {
    return {};
  }
}

export async function writeCaptureFailures(failures: CaptureFailures): Promise<void> {
  try {
    if (Object.keys(failures).length === 0) {
      await SecureStore.deleteItemAsync(CAPTURE_FAILURES_KEY);
    } else {
      await SecureStore.setItemAsync(CAPTURE_FAILURES_KEY, JSON.stringify(failures));
    }
  } catch {
    // Best-effort: a lost record only delays a give-up, never deletes data early.
  }
}

/** Counts one failed capture of `weekOf` at `nowMs`; returns the updated record. */
export function recordCaptureFailure(
  failures: CaptureFailures,
  weekOf: string,
  nowMs: number,
): CaptureFailure {
  const previous = failures[weekOf];
  const next = previous
    ? { firstFailedAt: previous.firstFailedAt, attempts: previous.attempts + 1 }
    : { firstFailedAt: nowMs, attempts: 1 };
  failures[weekOf] = next;
  return next;
}

/**
 * Give up on a week (scoped purge without a card) only when its drop is at
 * least SCORECARD_CAPTURE_GIVE_UP_DAYS old, it has kept failing for at least
 * SCORECARD_CAPTURE_GIVE_UP_MIN_FAILING_DAYS, and at least
 * SCORECARD_CAPTURE_GIVE_UP_MIN_ATTEMPTS captures failed.
 */
export function shouldGiveUpCapture(failure: CaptureFailure, dropAt: number, nowMs: number): boolean {
  return nowMs - dropAt >= SCORECARD_CAPTURE_GIVE_UP_DAYS * DAY_MS &&
    nowMs - failure.firstFailedAt >= SCORECARD_CAPTURE_GIVE_UP_MIN_FAILING_DAYS * DAY_MS &&
    failure.attempts >= SCORECARD_CAPTURE_GIVE_UP_MIN_ATTEMPTS;
}
