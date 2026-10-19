import {
  deriveScorecardScreenState,
  shouldShowPendingPreviousScorecard,
  shouldShowPreviewStamp,
  userNavForWeek,
} from '../screenState';

const base = {
  userNav: 'auto' as const,
  capturing: false,
  liveDataLoading: false,
  dropDataLoading: false,
  cardUri: null,
  inPresentationWindow: false,
  liveGrandTotal: 0,
  hasDropped: false,
  minAvoids: 1,
};

describe('deriveScorecardScreenState', () => {
  it('presents the captured scored-week card even when the live week is empty', () => {
    expect(deriveScorecardScreenState({
      ...base,
      cardUri: 'file://scorecards/last-week.jpg',
      inPresentationWindow: true,
      liveGrandTotal: 0,
      hasDropped: true,
    })).toBe('presentation');
  });

  it('shows the empty drop state only when there is no card and no live activity', () => {
    expect(deriveScorecardScreenState({
      ...base,
      inPresentationWindow: true,
      liveGrandTotal: 0,
      hasDropped: true,
    })).toBe('empty');
  });

  it('keeps a dismissed card dismissed until remount', () => {
    expect(deriveScorecardScreenState({
      ...base,
      userNav: 'dismissed',
      cardUri: 'file://scorecards/last-week.jpg',
      inPresentationWindow: true,
      liveGrandTotal: 2,
      hasDropped: true,
    })).toBe('preview');
  });

  it('lets user archive navigation override automatic presentation', () => {
    expect(deriveScorecardScreenState({
      ...base,
      userNav: 'archive',
      cardUri: 'file://scorecards/last-week.jpg',
      inPresentationWindow: true,
      liveGrandTotal: 2,
      hasDropped: true,
    })).toBe('archive');
  });
});

describe('shouldShowPreviewStamp', () => {
  it('does not stamp zero-avoid empty screens', () => {
    expect(shouldShowPreviewStamp('empty', 0, 1)).toBe(false);
    expect(shouldShowPreviewStamp('preview', 0, 1)).toBe(false);
  });

  it('stamps active in-app previews', () => {
    expect(shouldShowPreviewStamp('preview', 1, 1)).toBe(true);
  });
});

describe('shouldShowPendingPreviousScorecard', () => {
  const pendingBase = {
    hasDropped: false,
    liveWeekOf: '2026-08-15',
    scoredWeekOf: '2026-08-08',
    dropGrandTotal: 3,
    minAvoids: 1,
  };

  it('shows after the new week starts while last week has a pending card', () => {
    expect(shouldShowPendingPreviousScorecard(pendingBase)).toBe(true);
  });

  it('does not promise a card when the completed week has no avoids', () => {
    expect(shouldShowPendingPreviousScorecard({
      ...pendingBase,
      dropGrandTotal: 0,
    })).toBe(false);
  });

  it('does not show before rollover or after the drop', () => {
    expect(shouldShowPendingPreviousScorecard({
      ...pendingBase,
      liveWeekOf: pendingBase.scoredWeekOf,
    })).toBe(false);
    expect(shouldShowPendingPreviousScorecard({
      ...pendingBase,
      hasDropped: true,
    })).toBe(false);
  });
});

describe('userNavForWeek', () => {
  it('keeps a choice for the scored week it was made for', () => {
    expect(userNavForWeek({ weekOf: '2026-10-03', nav: 'dismissed' }, '2026-10-03')).toBe('dismissed');
    expect(userNavForWeek({ weekOf: '2026-10-03', nav: 'archive' }, '2026-10-03')).toBe('archive');
  });

  it('starts a new scored week at auto, so the next drop presents', () => {
    const dismissedLastWeek = { weekOf: '2026-10-03', nav: 'dismissed' as const };
    expect(userNavForWeek(dismissedLastWeek, '2026-10-10')).toBe('auto');
    expect(deriveScorecardScreenState({
      ...base,
      userNav: userNavForWeek(dismissedLastWeek, '2026-10-10'),
      cardUri: 'file://scorecards/this-week.jpg',
      inPresentationWindow: true,
      liveGrandTotal: 2,
      hasDropped: true,
    })).toBe('presentation');
  });
});
