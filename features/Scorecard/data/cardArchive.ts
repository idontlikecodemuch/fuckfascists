import * as FileSystem from 'expo-file-system';
import { SCORECARD_ARCHIVE_MAX } from '../../../config/constants';

const ARCHIVE_DIR = `${FileSystem.documentDirectory}scorecards/`;

export interface ArchivedCard {
  weekOf: string;  // YYYY-MM-DD
  uri: string;     // local file URI
}

/** Lists all archived scorecard PNGs, sorted reverse-chronologically. */
export async function listArchivedCards(): Promise<ArchivedCard[]> {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVE_DIR);
    if (!info.exists) return [];

    const files = await FileSystem.readDirectoryAsync(ARCHIVE_DIR);
    return files
      .filter((f) => f.endsWith('.png'))
      .map((f) => ({
        weekOf: f.replace('.png', ''),
        uri: `${ARCHIVE_DIR}${f}`,
      }))
      .sort((a, b) => b.weekOf.localeCompare(a.weekOf));
  } catch {
    return [];
  }
}

/** Prunes oldest cards when the archive exceeds SCORECARD_ARCHIVE_MAX. */
export async function pruneArchive(): Promise<void> {
  const cards = await listArchivedCards();
  if (cards.length <= SCORECARD_ARCHIVE_MAX) return;

  const toDelete = cards.slice(SCORECARD_ARCHIVE_MAX);
  for (const card of toDelete) {
    await FileSystem.deleteAsync(card.uri, { idempotent: true });
  }
}
