import * as FileSystem from 'expo-file-system';
import { findCardForWeek, findLatestCard } from '../cardArchive';

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
});
