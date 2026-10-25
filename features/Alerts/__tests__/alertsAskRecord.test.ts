const getItemAsync = jest.fn();
const setItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({ getItemAsync, setItemAsync }));

import {
  ALERTS_ASK_RECORD_KEY,
  EMPTY_ALERTS_ASK_RECORD,
  readAlertsAskRecord,
  shouldShowAlertsAsk,
  withShown,
  withStopped,
  writeAlertsAskRecord,
} from '../alertsAskRecord';

const WEEK_1 = '2026-10-17';
const WEEK_2 = '2026-10-24';
const WEEK_3 = '2026-10-31';
const WEEK_5 = '2026-11-14';

describe('shouldShowAlertsAsk (option C)', () => {
  it('shows for the first drop', () => {
    expect(shouldShowAlertsAsk(EMPTY_ALERTS_ASK_RECORD, WEEK_1)).toBe(true);
  });

  it('shows every other drop: not the same or the next drop, again two drops later', () => {
    const shown = withShown(EMPTY_ALERTS_ASK_RECORD, WEEK_1);
    expect(shouldShowAlertsAsk(shown, WEEK_1)).toBe(false);
    expect(shouldShowAlertsAsk(shown, WEEK_2)).toBe(false);
    expect(shouldShowAlertsAsk(shown, WEEK_3)).toBe(true);
  });

  it('stops after three shows', () => {
    let record = withShown(EMPTY_ALERTS_ASK_RECORD, WEEK_1);
    record = withShown(record, WEEK_3);
    expect(shouldShowAlertsAsk(record, WEEK_5)).toBe(true);
    record = withShown(record, WEEK_5);
    expect(record.shows).toBe(3);
    expect(shouldShowAlertsAsk(record, '2026-12-26')).toBe(false);
  });

  it('stops for good after "No thanks"', () => {
    const record = withStopped(withShown(EMPTY_ALERTS_ASK_RECORD, WEEK_1));
    expect(shouldShowAlertsAsk(record, '2027-06-05')).toBe(false);
  });

  it('never shows for a week before the last one (clock moved back)', () => {
    const shown = withShown(EMPTY_ALERTS_ASK_RECORD, WEEK_5);
    expect(shouldShowAlertsAsk(shown, WEEK_1)).toBe(false);
  });
});

describe('alerts ask record storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('round-trips a record', async () => {
    const record = withShown(EMPTY_ALERTS_ASK_RECORD, WEEK_1);
    await writeAlertsAskRecord(record);
    expect(setItemAsync).toHaveBeenCalledWith(ALERTS_ASK_RECORD_KEY, JSON.stringify(record));

    getItemAsync.mockResolvedValueOnce(JSON.stringify(record));
    await expect(readAlertsAskRecord()).resolves.toEqual(record);
  });

  it('reads nothing stored as a fresh record', async () => {
    getItemAsync.mockResolvedValueOnce(null);
    await expect(readAlertsAskRecord()).resolves.toEqual(EMPTY_ALERTS_ASK_RECORD);
  });

  it('reads a corrupt record as fresh and cleans bad fields', async () => {
    getItemAsync.mockResolvedValueOnce('{not json');
    await expect(readAlertsAskRecord()).resolves.toEqual(EMPTY_ALERTS_ASK_RECORD);

    getItemAsync.mockResolvedValueOnce(JSON.stringify({ shows: 'x', lastWeekOf: 'soon', stopped: 'yes' }));
    await expect(readAlertsAskRecord()).resolves.toEqual(EMPTY_ALERTS_ASK_RECORD);
  });

  it('returns null when storage cannot be read, so the banner stays hidden', async () => {
    getItemAsync.mockRejectedValueOnce(new Error('keychain locked'));
    await expect(readAlertsAskRecord()).resolves.toBeNull();
  });

  it('swallows a failed write', async () => {
    setItemAsync.mockRejectedValueOnce(new Error('keychain locked'));
    await expect(writeAlertsAskRecord(EMPTY_ALERTS_ASK_RECORD)).resolves.toBeUndefined();
  });
});
