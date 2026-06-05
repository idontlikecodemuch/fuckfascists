import { computeDropTime } from '../../../../core/dropSchedule/computeDropTime';
import type { StorageAdapter } from '../../../../core/data';
import {
  getPendingScorecardDropWeek,
  shouldLaunchPendingScorecardDrop,
} from '../pendingDropLaunch';
import { getScoredWeekOfDrop } from '../scoredWeek';
import { SCORECARD_PRESENTATION_WINDOW_MS } from '../../../../config/constants';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

const adapter = {} as StorageAdapter;
const dropAt = computeDropTime(2026, 22).getTime();
const scoredWeekOf = getScoredWeekOfDrop(dropAt);

describe('getPendingScorecardDropWeek', () => {
  it('returns the scored week inside the active presentation window', () => {
    expect(getPendingScorecardDropWeek(dropAt + 60_000)).toBe(scoredWeekOf);
  });

  it('returns null after the presentation window closes', () => {
    expect(getPendingScorecardDropWeek(dropAt + SCORECARD_PRESENTATION_WINDOW_MS)).toBeNull();
  });
});

describe('shouldLaunchPendingScorecardDrop', () => {
  const base = {
    adapter,
    entities: [],
    platforms: [],
    nowMs: dropAt + 60_000,
  };

  it('launches Scorecard when the drop has data and no archived card yet', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      aggregate: jest.fn().mockResolvedValue([{ totalCount: 2 }]),
      findArchivedCard: jest.fn().mockResolvedValue(null),
    })).resolves.toBe(true);
  });

  it('does not launch when this scored-week card is already archived', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      aggregate: jest.fn().mockResolvedValue([{ totalCount: 2 }]),
      findArchivedCard: jest.fn().mockResolvedValue({
        filename: 'card.jpg',
        uri: 'file://card.jpg',
        modificationTime: 1,
      }),
    })).resolves.toBe(false);
  });

  it('does not launch empty drops', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      aggregate: jest.fn().mockResolvedValue([]),
      findArchivedCard: jest.fn().mockResolvedValue(null),
    })).resolves.toBe(false);
  });
});
