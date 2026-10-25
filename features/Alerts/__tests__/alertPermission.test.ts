const getPermissionsAsync = jest.fn();
const requestPermissionsAsync = jest.fn();
const openSettings = jest.fn();

jest.mock('expo-notifications', () => ({ getPermissionsAsync, requestPermissionsAsync }));
jest.mock('react-native', () => ({ Linking: { openSettings } }));

import { openAlertsControl, readAlertsPermission, toAlertsPermission } from '../alertPermission';

type Response = Parameters<typeof toAlertsPermission>[0];

function response(status: string, granted: boolean, canAskAgain: boolean): Response {
  return { status, granted, canAskAgain } as unknown as Response;
}

describe('toAlertsPermission', () => {
  it('is on when granted', () => {
    expect(toAlertsPermission(response('granted', true, true))).toEqual({ status: 'on', neverAsked: false });
  });

  it('can ask when iOS never showed the prompt', () => {
    expect(toAlertsPermission(response('undetermined', false, true))).toEqual({ status: 'ask', neverAsked: true });
  });

  it('needs Settings after an iOS "Don\'t Allow"', () => {
    expect(toAlertsPermission(response('denied', false, false))).toEqual({ status: 'settings', neverAsked: false });
  });

  it('can still ask after one Android denial', () => {
    expect(toAlertsPermission(response('denied', false, true))).toEqual({ status: 'ask', neverAsked: false });
  });
});

describe('openAlertsControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the system prompt while it can', async () => {
    requestPermissionsAsync.mockResolvedValueOnce(response('granted', true, true));
    await expect(openAlertsControl({ status: 'ask', neverAsked: true }))
      .resolves.toEqual({ status: 'on', neverAsked: false });
    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(openSettings).not.toHaveBeenCalled();
  });

  it('opens Settings when the prompt can no longer show, or to turn alerts off', async () => {
    await expect(openAlertsControl({ status: 'settings', neverAsked: false })).resolves.toBeNull();
    await expect(openAlertsControl({ status: 'on', neverAsked: false })).resolves.toBeNull();
    expect(openSettings).toHaveBeenCalledTimes(2);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('reads the current permission', async () => {
    getPermissionsAsync.mockResolvedValueOnce(response('undetermined', false, true));
    await expect(readAlertsPermission()).resolves.toEqual({ status: 'ask', neverAsked: true });
  });
});
