const getItemAsync = jest.fn();
const setItemAsync = jest.fn();
const deleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({ getItemAsync, setItemAsync, deleteItemAsync }));

import {
  LATE_CARD_WEEK_KEY,
  clearLateCardWeek,
  markLateCardWeek,
  readLateCardWeek,
} from '../lateCardNotice';

describe('late card notice marker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores only the week date', async () => {
    setItemAsync.mockResolvedValue(undefined);
    await markLateCardWeek('2026-10-03');
    expect(setItemAsync).toHaveBeenCalledWith(LATE_CARD_WEEK_KEY, '2026-10-03');
  });

  it('reads a stored week date', async () => {
    getItemAsync.mockResolvedValue('2026-10-03');
    await expect(readLateCardWeek()).resolves.toBe('2026-10-03');
  });

  it('ignores missing, malformed or unreadable values', async () => {
    getItemAsync.mockResolvedValueOnce(null);
    await expect(readLateCardWeek()).resolves.toBeNull();
    getItemAsync.mockResolvedValueOnce('not-a-date');
    await expect(readLateCardWeek()).resolves.toBeNull();
    getItemAsync.mockRejectedValueOnce(new Error('keychain locked'));
    await expect(readLateCardWeek()).resolves.toBeNull();
  });

  it('clears the marker and tolerates a failed delete', async () => {
    deleteItemAsync.mockRejectedValueOnce(new Error('missing'));
    await expect(clearLateCardWeek()).resolves.toBeUndefined();
    expect(deleteItemAsync).toHaveBeenCalledWith(LATE_CARD_WEEK_KEY);
  });
});
