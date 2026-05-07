import * as FileSystem from 'expo-file-system';
import { SCORECARD_ARCHIVE_MAX } from '../../../config/constants';
import { buildCardFilename } from '../utils/formatters';

const ARCHIVE_DIR = `${FileSystem.documentDirectory}scorecards/`;

export interface ArchivedCard {
  filename: string;          // e.g. "Those-I-FCKd-April-11-26.jpg"
  uri: string;               // local file URI
  modificationTime: number;  // seconds since epoch (FileSystem convention)
}

/**
 * Lists all archived scorecard images, sorted newest-first by file mtime.
 * Accepts both `.jpg` (current format, JPEG q=0.88, ~6× smaller than PNG)
 * and `.png` (legacy lossless captures from before 2026-04-30) so users
 * who upgrade keep their archive intact.
 *
 * Sorting by mtime (vs. filename) is robust to the human-readable filename
 * format where "April" would lexically precede "May" correctly but
 * "November" would precede "October" incorrectly.
 */
export async function listArchivedCards(): Promise<ArchivedCard[]> {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVE_DIR);
    if (!info.exists) return [];

    const files = await FileSystem.readDirectoryAsync(ARCHIVE_DIR);
    const images = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

    const withTime = await Promise.all(
      images.map(async (filename) => {
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
 * Returns the most recently captured scorecard image, or null if none exists.
 * Used by the archive/gallery surface only. The drop flow must use
 * findCardForWeek() so an older archive card cannot satisfy a new drop.
 */
export async function findLatestCard(): Promise<ArchivedCard | null> {
  const cards = await listArchivedCards();
  return cards[0] ?? null;
}

/**
 * Returns the archived scorecard for one scored week, or null if not captured.
 * Exact filename matching is intentional: the post-drop privacy flow should
 * only skip capture+purge when the card for this same Sat-Fri window exists.
 */
export async function findCardForWeek(weekOf: string): Promise<ArchivedCard | null> {
  const currentFilename = buildCardFilename(weekOf);
  const legacyPngFilename = currentFilename.replace(/\.jpg$/i, '.png');
  const cards = await listArchivedCards();

  return cards.find((card) =>
    card.filename === currentFilename || card.filename === legacyPngFilename,
  ) ?? null;
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
