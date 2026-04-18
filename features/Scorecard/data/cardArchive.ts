import * as FileSystem from 'expo-file-system';
import { SCORECARD_ARCHIVE_MAX } from '../../../config/constants';

const ARCHIVE_DIR = `${FileSystem.documentDirectory}scorecards/`;

export interface ArchivedCard {
  filename: string;          // e.g. "Those-I-FCKd-April-11-26.png"
  uri: string;               // local file URI
  modificationTime: number;  // seconds since epoch (FileSystem convention)
}

/**
 * Lists all archived scorecard PNGs, sorted newest-first by file mtime.
 * Sorting by mtime (vs. filename) is robust to the new human-readable
 * filename format where "April" would lexically precede "May" correctly
 * but "November" would precede "October" incorrectly.
 */
export async function listArchivedCards(): Promise<ArchivedCard[]> {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVE_DIR);
    if (!info.exists) return [];

    const files = await FileSystem.readDirectoryAsync(ARCHIVE_DIR);
    const pngs = files.filter((f) => f.endsWith('.png'));

    const withTime = await Promise.all(
      pngs.map(async (filename) => {
        const uri = `${ARCHIVE_DIR}${filename}`;
        const stat = await FileSystem.getInfoAsync(uri);
        const modificationTime =
          stat.exists && 'modificationTime' in stat
            ? (stat.modificationTime as number)
            : 0;
        return { filename, uri, modificationTime };
      }),
    );

    return withTime.sort((a, b) => b.modificationTime - a.modificationTime);
  } catch {
    return [];
  }
}

/**
 * Returns the most recently captured scorecard PNG, or null if none exists.
 * Used by ScorecardScreen to resolve the "current drop" PNG without having
 * to compute the filename from a scored-week date.
 */
export async function findLatestCard(): Promise<ArchivedCard | null> {
  const cards = await listArchivedCards();
  return cards[0] ?? null;
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
