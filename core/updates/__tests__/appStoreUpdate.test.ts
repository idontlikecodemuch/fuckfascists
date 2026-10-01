import {
  fetchAvailableAppStoreUpdate,
  isNewerVersion,
} from '../appStoreUpdate';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('isNewerVersion', () => {
  it('compares dotted numeric versions component-by-component', () => {
    expect(isNewerVersion('1.0.2', '1.0.1')).toBe(true);
    expect(isNewerVersion('1.10.0', '1.9.9')).toBe(true);
    expect(isNewerVersion('2.0', '1.99.99')).toBe(true);
    expect(isNewerVersion('1.0.1', '1.0.1')).toBe(false);
    expect(isNewerVersion('1.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('0.9.9', '1.0.0')).toBe(false);
  });

  it('rejects malformed versions instead of prompting', () => {
    expect(isNewerVersion('latest', '1.0.1')).toBe(false);
    expect(isNewerVersion('1.0.2-beta', '1.0.1')).toBe(false);
    expect(isNewerVersion('1.0.2', '')).toBe(false);
  });
});

describe('fetchAvailableAppStoreUpdate', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns a newer App Store version and its HTTPS store URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resultCount: 1,
        results: [{
          version: '1.0.2',
          trackViewUrl: 'https://apps.apple.com/us/app/example/id6761508241',
        }],
      }),
    } as Response);

    await expect(fetchAvailableAppStoreUpdate('1.0.1')).resolves.toEqual({
      installedVersion: '1.0.1',
      availableVersion: '1.0.2',
      storeUrl: 'https://apps.apple.com/us/app/example/id6761508241',
    });
  });

  it('does not prompt for the installed or an older version', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ version: '1.0.1' }] }),
    } as Response);
    await expect(fetchAvailableAppStoreUpdate('1.0.1')).resolves.toBeNull();
  });

  it('fails open on store, network, or payload errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    await expect(fetchAvailableAppStoreUpdate('1.0.1')).resolves.toBeNull();

    mockFetch.mockRejectedValueOnce(new Error('offline'));
    await expect(fetchAvailableAppStoreUpdate('1.0.1')).resolves.toBeNull();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);
    await expect(fetchAvailableAppStoreUpdate('1.0.1')).resolves.toBeNull();
  });
});
