const getItemAsync = jest.fn();
const setItemAsync = jest.fn();
const deleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({ getItemAsync, setItemAsync, deleteItemAsync }));

import { lateCardMarker, revealedWeekMarker } from '../weekMarkers';

describe('week markers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('use separate keys', () => {
    expect(lateCardMarker.key).toBe('scorecard_late_card_week');
    expect(revealedWeekMarker.key).toBe('scorecard_revealed_week');
  });

  it('store only the week date', async () => {
    setItemAsync.mockResolvedValue(undefined);
    await revealedWeekMarker.mark('2026-10-10');
    expect(setItemAsync).toHaveBeenCalledWith('scorecard_revealed_week', '2026-10-10');
  });

  it('read a stored week date', async () => {
    getItemAsync.mockResolvedValue('2026-10-03');
    await expect(lateCardMarker.read()).resolves.toBe('2026-10-03');
    expect(getItemAsync).toHaveBeenCalledWith('scorecard_late_card_week');
  });

  it('ignore missing, malformed or unreadable values', async () => {
    getItemAsync.mockResolvedValueOnce(null);
    await expect(lateCardMarker.read()).resolves.toBeNull();
    getItemAsync.mockResolvedValueOnce('not-a-date');
    await expect(lateCardMarker.read()).resolves.toBeNull();
    getItemAsync.mockRejectedValueOnce(new Error('keychain locked'));
    await expect(lateCardMarker.read()).resolves.toBeNull();
  });

  it('tolerate failed writes and deletes', async () => {
    setItemAsync.mockRejectedValueOnce(new Error('locked'));
    await expect(revealedWeekMarker.mark('2026-10-10')).resolves.toBeUndefined();
    deleteItemAsync.mockRejectedValueOnce(new Error('missing'));
    await expect(lateCardMarker.clear()).resolves.toBeUndefined();
    expect(deleteItemAsync).toHaveBeenCalledWith('scorecard_late_card_week');
  });
});
