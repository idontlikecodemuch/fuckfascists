import * as SecureStore from 'expo-secure-store';

/**
 * "Not yet seen" marker for a card captured more than the presentation window
 * after its drop. Stores one week date (YYYY-MM-DD) and nothing else; the
 * Scorecard tab shows a one-line notice for it once, then clears it.
 */
export const LATE_CARD_WEEK_KEY = 'scorecard_late_card_week';

const WEEK_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function markLateCardWeek(weekOf: string): Promise<void> {
  await SecureStore.setItemAsync(LATE_CARD_WEEK_KEY, weekOf);
}

export async function readLateCardWeek(): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(LATE_CARD_WEEK_KEY);
    return value && WEEK_PATTERN.test(value) ? value : null;
  } catch {
    return null;
  }
}

export async function clearLateCardWeek(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(LATE_CARD_WEEK_KEY);
  } catch {
    // Nothing stored, or the keychain is briefly unavailable — ignore.
  }
}
