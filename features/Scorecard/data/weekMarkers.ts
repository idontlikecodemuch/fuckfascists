import * as SecureStore from 'expo-secure-store';

const WEEK_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A best-effort SecureStore marker that holds one week date (YYYY-MM-DD) and
 * nothing else. Storage errors are swallowed: a lost marker only means a
 * notice or a reveal route shows again (or not), never lost data.
 */
export interface WeekMarker {
  key: string;
  mark: (weekOf: string) => Promise<void>;
  read: () => Promise<string | null>;
  clear: () => Promise<void>;
}

function createWeekMarker(key: string): WeekMarker {
  return {
    key,
    mark: async (weekOf) => {
      try {
        await SecureStore.setItemAsync(key, weekOf);
      } catch {
        // Keychain briefly unavailable — the marker is best-effort.
      }
    },
    read: async () => {
      try {
        const value = await SecureStore.getItemAsync(key);
        return value && WEEK_PATTERN.test(value) ? value : null;
      } catch {
        return null;
      }
    },
    clear: async () => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // Nothing stored, or the keychain is briefly unavailable.
      }
    },
  };
}

/**
 * Card captured more than the presentation window after its drop that has not
 * been announced yet. The Scorecard tab shows a one-line notice once.
 */
export const lateCardMarker = createWeekMarker('scorecard_late_card_week');

/**
 * Scored week whose drop presentation the user has seen or dismissed. Launch
 * and resume routing open Scorecard for an in-window drop until it is set.
 */
export const revealedWeekMarker = createWeekMarker('scorecard_revealed_week');
