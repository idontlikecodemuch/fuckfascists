import * as SecureStore from 'expo-secure-store';
import { formatLocalDate } from '../../core/utils/localDate';

/** SecureStore key: the local date the election banner was last hidden. */
export const ELECTION_BANNER_DISMISSED_KEY = 'election_banner_dismissed';

/** Hides the election banner for the rest of today (best-effort). */
export async function hideElectionBannerForToday(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ELECTION_BANNER_DISMISSED_KEY, formatLocalDate(new Date()));
  } catch {
    // Keychain briefly unavailable — at worst the banner shows again today.
  }
}

/** True when the banner was hidden earlier today. Unreadable storage reads as not hidden. */
export async function isElectionBannerHiddenToday(nowMs: number): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ELECTION_BANNER_DISMISSED_KEY)) === formatLocalDate(new Date(nowMs));
  } catch {
    return false;
  }
}
