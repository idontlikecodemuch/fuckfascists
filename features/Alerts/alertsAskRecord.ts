import * as SecureStore from 'expo-secure-store';
import { ALERTS_ASK_EVERY_N_DROPS, ALERTS_ASK_MAX_SHOWS } from '../../config/constants';

/** SecureStore key for the "alerts are off" banner history. */
export const ALERTS_ASK_RECORD_KEY = 'alerts_ask_record';

/**
 * How often the "alerts are off" banner has been shown. Holds a count, the
 * scored week of the last drop it showed for, and whether the user tapped
 * "No thanks". Nothing about the user beyond that.
 */
export interface AlertsAskRecord {
  shows: number;
  lastWeekOf: string | null;
  stopped: boolean;
}

export const EMPTY_ALERTS_ASK_RECORD: AlertsAskRecord = { shows: 0, lastWeekOf: null, stopped: false };

const WEEK_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function weekStartUtc(weekOf: string): number | null {
  const match = WEEK_PATTERN.exec(weekOf);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Option C (owner, 2026-10-25): the banner shows for a drop when it has
 * shown fewer than ALERTS_ASK_MAX_SHOWS times, the user has not said
 * "No thanks", and the last drop it showed for is at least
 * ALERTS_ASK_EVERY_N_DROPS drops back (so drops 1, 3 and 5).
 */
export function shouldShowAlertsAsk(record: AlertsAskRecord, weekOf: string): boolean {
  if (record.stopped || record.shows >= ALERTS_ASK_MAX_SHOWS) return false;
  if (!record.lastWeekOf) return true;
  const last = weekStartUtc(record.lastWeekOf);
  const current = weekStartUtc(weekOf);
  if (last === null || current === null) return false;
  return Math.round((current - last) / (7 * DAY_MS)) >= ALERTS_ASK_EVERY_N_DROPS;
}

export function withShown(record: AlertsAskRecord, weekOf: string): AlertsAskRecord {
  return { ...record, shows: record.shows + 1, lastWeekOf: weekOf };
}

export function withStopped(record: AlertsAskRecord): AlertsAskRecord {
  return { ...record, stopped: true };
}

function parseRecord(raw: string | null): AlertsAskRecord {
  if (!raw) return EMPTY_ALERTS_ASK_RECORD;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return EMPTY_ALERTS_ASK_RECORD;
    const { shows, lastWeekOf, stopped } = value as Record<string, unknown>;
    return {
      shows: typeof shows === 'number' && Number.isFinite(shows) ? shows : 0,
      lastWeekOf: typeof lastWeekOf === 'string' && WEEK_PATTERN.test(lastWeekOf) ? lastWeekOf : null,
      stopped: stopped === true,
    };
  } catch {
    return EMPTY_ALERTS_ASK_RECORD;
  }
}

/** Null when storage can't be read, so the banner stays hidden rather than repeating. */
export async function readAlertsAskRecord(): Promise<AlertsAskRecord | null> {
  try {
    return parseRecord(await SecureStore.getItemAsync(ALERTS_ASK_RECORD_KEY));
  } catch {
    return null;
  }
}

export async function writeAlertsAskRecord(record: AlertsAskRecord): Promise<void> {
  try {
    await SecureStore.setItemAsync(ALERTS_ASK_RECORD_KEY, JSON.stringify(record));
  } catch {
    // Keychain briefly unavailable — at worst the banner shows once more.
  }
}
