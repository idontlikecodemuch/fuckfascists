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
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
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
    readRevealedWeek: jest.fn().mockResolvedValue(null),
    readLateWeek: jest.fn().mockResolvedValue(null),
  };
  const archivedCard = {
    filename: 'card.jpg',
    uri: 'file://card.jpg',
    modificationTime: 1,
  };

  it('launches Scorecard when the drop has data and no archived card yet', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      aggregate: jest.fn().mockResolvedValue([{ totalCount: 2 }]),
      findArchivedCard: jest.fn().mockResolvedValue(null),
    })).resolves.toBe(true);
  });

  it('launches when the shell already captured the card but it has not been revealed', async () => {
    const aggregate = jest.fn().mockResolvedValue([]);
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      aggregate,
      findArchivedCard: jest.fn().mockResolvedValue(archivedCard),
    })).resolves.toBe(true);
    expect(aggregate).not.toHaveBeenCalled();
  });

  it('does not launch once this drop has been revealed', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      readRevealedWeek: jest.fn().mockResolvedValue(scoredWeekOf),
      aggregate: jest.fn().mockResolvedValue([{ totalCount: 2 }]),
      findArchivedCard: jest.fn().mockResolvedValue(archivedCard),
    })).resolves.toBe(false);
  });

  it('still launches when an older week was the last one revealed', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      readRevealedWeek: jest.fn().mockResolvedValue('2020-01-04'),
      aggregate: jest.fn().mockResolvedValue([{ totalCount: 2 }]),
      findArchivedCard: jest.fn().mockResolvedValue(null),
    })).resolves.toBe(true);
  });

  it('does not launch outside the presentation window', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      nowMs: dropAt + SCORECARD_PRESENTATION_WINDOW_MS,
      findArchivedCard: jest.fn().mockResolvedValue(archivedCard),
    })).resolves.toBe(false);
  });

  it('launches outside the window for a missed drop card awaiting its late reveal', async () => {
    const lateWeek = '2026-05-09';
    const findArchivedCard = jest.fn().mockResolvedValue(archivedCard);
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      nowMs: dropAt + SCORECARD_PRESENTATION_WINDOW_MS,
      readLateWeek: jest.fn().mockResolvedValue(lateWeek),
      findArchivedCard,
    })).resolves.toBe(true);
    expect(findArchivedCard).toHaveBeenCalledWith(lateWeek);
  });

  it('ignores a late marker whose card no longer exists', async () => {
    await expect(shouldLaunchPendingScorecardDrop({
      ...base,
      nowMs: dropAt + SCORECARD_PRESENTATION_WINDOW_MS,
      readLateWeek: jest.fn().mockResolvedValue('2026-05-09'),
      findArchivedCard: jest.fn().mockResolvedValue(null),
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
