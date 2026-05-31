import { SCORECARD_PRESENTATION_WINDOW_MS } from '../../../../config/constants';
import { getScorecardDropRefreshDelayMs } from '../dropTime';

describe('getScorecardDropRefreshDelayMs', () => {
  it('refreshes shortly after a future drop boundary', () => {
    const nowMs = Date.UTC(2026, 4, 29, 22, 59);
    const dropAtMs = Date.UTC(2026, 4, 29, 23, 0);

    expect(getScorecardDropRefreshDelayMs(nowMs, dropAtMs)).toBe(61_000);
  });

  it('refreshes shortly after the presentation window expires', () => {
    const dropAtMs = Date.UTC(2026, 4, 29, 23, 0);
    const nowMs = dropAtMs + SCORECARD_PRESENTATION_WINDOW_MS - 60_000;

    expect(getScorecardDropRefreshDelayMs(nowMs, dropAtMs)).toBe(61_000);
  });

  it('does not schedule another refresh after the presentation window', () => {
    const dropAtMs = Date.UTC(2026, 4, 29, 23, 0);
    const nowMs = dropAtMs + SCORECARD_PRESENTATION_WINDOW_MS;

    expect(getScorecardDropRefreshDelayMs(nowMs, dropAtMs)).toBeNull();
  });
});
