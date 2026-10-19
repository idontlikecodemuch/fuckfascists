const getItemAsync = jest.fn();
const setItemAsync = jest.fn();
const deleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({ getItemAsync, setItemAsync, deleteItemAsync }));

import {
  CAPTURE_FAILURES_KEY,
  readCaptureFailures,
  recordCaptureFailure,
  writeCaptureFailures,
  type CaptureFailures,
} from '../captureFailures';

describe('capture failure records', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setItemAsync.mockResolvedValue(undefined);
    deleteItemAsync.mockResolvedValue(undefined);
  });

  it('reads only well-formed week entries', async () => {
    getItemAsync.mockResolvedValue(JSON.stringify({
      '2026-09-26': { firstFailedAt: 100, attempts: 2 },
      'not-a-week': { firstFailedAt: 100, attempts: 1 },
      '2026-10-03': { firstFailedAt: 'x', attempts: 1 },
      '2026-10-10': { firstFailedAt: 100, attempts: 0 },
    }));

    await expect(readCaptureFailures()).resolves.toEqual({
      '2026-09-26': { firstFailedAt: 100, attempts: 2 },
    });
  });

  it('treats missing, corrupt or unreadable storage as no failures', async () => {
    getItemAsync.mockResolvedValueOnce(null);
    await expect(readCaptureFailures()).resolves.toEqual({});
    getItemAsync.mockResolvedValueOnce('{oops');
    await expect(readCaptureFailures()).resolves.toEqual({});
    getItemAsync.mockRejectedValueOnce(new Error('locked'));
    await expect(readCaptureFailures()).resolves.toEqual({});
  });

  it('stores the map, and deletes the key when nothing is failing', async () => {
    const failures: CaptureFailures = { '2026-09-26': { firstFailedAt: 100, attempts: 1 } };
    await writeCaptureFailures(failures);
    expect(setItemAsync).toHaveBeenCalledWith(CAPTURE_FAILURES_KEY, JSON.stringify(failures));

    await writeCaptureFailures({});
    expect(deleteItemAsync).toHaveBeenCalledWith(CAPTURE_FAILURES_KEY);
  });

  it('keeps the first failure time and counts attempts', () => {
    const failures: CaptureFailures = {};
    expect(recordCaptureFailure(failures, '2026-09-26', 100)).toEqual({ firstFailedAt: 100, attempts: 1 });
    expect(recordCaptureFailure(failures, '2026-09-26', 500)).toEqual({ firstFailedAt: 100, attempts: 2 });
  });
});
