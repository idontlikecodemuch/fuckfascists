import { useCallback, useState } from 'react';
import {
  userNavForWeek,
  type ScorecardUserNav,
  type WeekUserNav,
} from '../utils/screenState';

/**
 * Scorecard user navigation (archive, dismissed, dev present), scoped to the
 * current scored week: it reads 'auto' again as soon as the scored week
 * changes. See userNavForWeek.
 */
export function useScorecardUserNav(
  scoredWeekOf: string,
): [ScorecardUserNav, (nav: ScorecardUserNav) => void] {
  const [state, setState] = useState<WeekUserNav>({ weekOf: scoredWeekOf, nav: 'auto' });
  const setNav = useCallback(
    (nav: ScorecardUserNav) => setState({ weekOf: scoredWeekOf, nav }),
    [scoredWeekOf],
  );
  return [userNavForWeek(state, scoredWeekOf), setNav];
}
