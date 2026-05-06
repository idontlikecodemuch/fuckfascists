import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { TABLE_CACHE, TABLE_ENTITY_AVOIDS, TABLE_PLATFORM_AVOIDS } from '../../core/data';
import { TABLE_BARCODE_LOOKUPS } from '../Map/barcode/barcodeCacheStore';

const DB_NAME = 'fuckfascists.db';
const NUDGE_IDENTIFIER = 'platform-nudge-thursday';

const RESET_SECURE_STORE_KEYS = [
  'onboarding_complete',
  'ff_last_launch_date',
  'platform_roster',
  'track_daily_open_last_visit',
  'map_hints_dismissed',
  'scorecard_presentation_hints_seen',
] as const;

/**
 * Resets the app's first-run and local-data state without disabling beta mode.
 * Used by the beta overlay so testers can repeat onboarding and day-one flows.
 */
export async function resetAppStateForFreshTest(): Promise<void> {
  await Promise.allSettled(
    RESET_SECURE_STORE_KEYS.map((key) => SecureStore.deleteItemAsync(key))
  );

  try {
    await Notifications.cancelScheduledNotificationAsync(NUDGE_IDENTIFIER);
  } catch {
    // If no nudge exists yet, ignore.
  }

  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await Promise.allSettled([
    db.execAsync(`DELETE FROM ${TABLE_ENTITY_AVOIDS}`),
    db.execAsync(`DELETE FROM ${TABLE_PLATFORM_AVOIDS}`),
    db.execAsync(`DELETE FROM ${TABLE_CACHE}`),
    db.execAsync(`DROP TABLE IF EXISTS ${TABLE_BARCODE_LOOKUPS}`),
  ]);
}
