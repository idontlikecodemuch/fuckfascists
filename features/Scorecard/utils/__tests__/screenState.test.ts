import {
  deriveScorecardScreenState,
  shouldShowPreviewStamp,
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
