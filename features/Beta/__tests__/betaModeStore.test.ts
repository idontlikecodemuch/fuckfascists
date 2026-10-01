const mockDeleteItemAsync = jest.fn();
const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  deleteItemAsync: mockDeleteItemAsync,
  getItemAsync: mockGetItemAsync,
  setItemAsync: mockSetItemAsync,
}));

import {
  BETA_MODE_KEY,
  readBetaMode,
  writeBetaMode,
} from '../betaModeStore';

describe('betaModeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteItemAsync.mockResolvedValue(undefined);
    mockGetItemAsync.mockResolvedValue(null);
    mockSetItemAsync.mockResolvedValue(undefined);
  });

  it('ignores and removes the legacy migratable beta key', async () => {
    await expect(readBetaMode()).resolves.toBe(false);

    expect(mockDeleteItemAsync).toHaveBeenCalledWith('ff_beta_mode');
    expect(mockGetItemAsync).toHaveBeenCalledWith(
      BETA_MODE_KEY,
      { keychainAccessible: 6 },
    );
  });

  it('reads only the device-v2 key', async () => {
    mockGetItemAsync.mockResolvedValue('true');
    await expect(readBetaMode()).resolves.toBe(true);
  });

  it('writes beta state as device-only', async () => {
    await writeBetaMode(true);
    expect(mockSetItemAsync).toHaveBeenCalledWith(
      BETA_MODE_KEY,
      'true',
      { keychainAccessible: 6 },
    );
  });
});
