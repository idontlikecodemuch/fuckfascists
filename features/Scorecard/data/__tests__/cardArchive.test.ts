import * as FileSystem from 'expo-file-system';
import { findCardForWeek, findLatestCard, listArchivedCards, pruneArchive } from '../cardArchive';
import { SCORECARD_ARCHIVE_MAX } from '../../../../config/constants';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

const mockedFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const ARCHIVE_DIR = 'file:///docs/scorecards/';

function mockArchive(files: string[], modificationTimes: Record<string, number>): void {
  mockedFileSystem.readDirectoryAsync.mockResolvedValue(files);
  mockedFileSystem.getInfoAsync.mockImplementation(async (uri: string) => {
    if (uri === ARCHIVE_DIR) return { exists: true } as Awaited<ReturnType<typeof FileSystem.getInfoAsync>>;

    const filename = uri.replace(ARCHIVE_DIR, '');
    return {
      exists: true,
      modificationTime: modificationTimes[filename] ?? 0,
    } as Awaited<ReturnType<typeof FileSystem.getInfoAsync>>;
  });
}

describe('cardArchive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds the exact scored-week jpg even when another card is newer', async () => {
    mockArchive(
      [
        'Those-I-FCKd-April-11-26.jpg',
        'Those-I-FCKd-April-18-26.jpg',
      ],
      {
        'Those-I-FCKd-April-11-26.jpg': 100,
        'Those-I-FCKd-April-18-26.jpg': 200,
      },
    );

    const card = await findCardForWeek('2026-04-11');
    expect(card?.filename).toBe('Those-I-FCKd-April-11-26.jpg');
  });

  it('falls back to a legacy png for the same scored week', async () => {
    mockArchive(
      ['Those-I-FCKd-April-11-26.png'],
      { 'Those-I-FCKd-April-11-26.png': 100 },
    );

    const card = await findCardForWeek('2026-04-11');
    expect(card?.filename).toBe('Those-I-FCKd-April-11-26.png');
  });

  it('keeps latest-card lookup newest-first for archive display', async () => {
    mockArchive(
      [
        'Those-I-FCKd-April-11-26.jpg',
        'Those-I-FCKd-April-18-26.jpg',
      ],
      {
        'Those-I-FCKd-April-11-26.jpg': 100,
        'Those-I-FCKd-April-18-26.jpg': 200,
      },
    );

    const card = await findLatestCard();
    expect(card?.filename).toBe('Those-I-FCKd-April-18-26.jpg');
  });

  it('orders by scored week, not mtime, when an older week was captured later', async () => {
    mockArchive(
      ['Those-I-FCKd-April-11-26.jpg', 'Those-I-FCKd-April-18-26.jpg', '2026-04-04.png'],
      {
        'Those-I-FCKd-April-11-26.jpg': 900,
        'Those-I-FCKd-April-18-26.jpg': 200,
        '2026-04-04.png': 950,
      },
    );

    const cards = await listArchivedCards();
    expect(cards.map((card) => card.filename)).toEqual([
      'Those-I-FCKd-April-18-26.jpg',
      'Those-I-FCKd-April-11-26.jpg',
      '2026-04-04.png',
    ]);
    expect((await findLatestCard())?.filename).toBe('Those-I-FCKd-April-18-26.jpg');
  });

  it('falls back to mtime only for names that do not parse', async () => {
    const aprilEleven = Date.parse('2026-04-11T00:00:00Z') / 1000;
    mockArchive(
      ['Those-I-FCKd-April-11-26.jpg', 'renamed.jpg'],
      { 'Those-I-FCKd-April-11-26.jpg': 1, 'renamed.jpg': aprilEleven + 60 },
    );

    const cards = await listArchivedCards();
    expect(cards.map((card) => card.filename)).toEqual(['renamed.jpg', 'Those-I-FCKd-April-11-26.jpg']);
  });

  it('prunes the oldest scored weeks even when they were captured last', async () => {
    const weeks = Array.from({ length: SCORECARD_ARCHIVE_MAX + 1 }, (_, index) =>
      new Date(Date.UTC(2024, 0, 6 + index * 7)).toISOString().slice(0, 10));
    const files = weeks.map((weekOf) => `${weekOf}.png`);
    // The oldest week has the newest mtime (captured late on a retry).
    const times = Object.fromEntries(files.map((file, index) => [file, index === 0 ? 10_000 : index]));
    mockArchive(files, times);

    await pruneArchive();

    expect(mockedFileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    expect(mockedFileSystem.deleteAsync).toHaveBeenCalledWith(`${ARCHIVE_DIR}${files[0]}`, { idempotent: true });
  });
});
