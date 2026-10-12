import {
  SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR,
  SCORECARD_QUIET_NOTIFICATION_FROM_HOUR,
} from '../../../config/constants';
import { isQuietNotificationHour } from '../quietHours';

describe('isQuietNotificationHour', () => {
  it('is quiet from the evening hour through the morning hour', () => {
    expect(isQuietNotificationHour(SCORECARD_QUIET_NOTIFICATION_FROM_HOUR)).toBe(true);
    expect(isQuietNotificationHour(0)).toBe(true);
    expect(isQuietNotificationHour(SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR - 1)).toBe(true);
  });

  it('is not quiet during the day', () => {
    expect(isQuietNotificationHour(SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR)).toBe(false);
    expect(isQuietNotificationHour(12)).toBe(false);
    expect(isQuietNotificationHour(SCORECARD_QUIET_NOTIFICATION_FROM_HOUR - 1)).toBe(false);
  });
});
