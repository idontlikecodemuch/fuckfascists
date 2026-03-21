import { initialTrackUIState, trackUIReducer } from '../context/trackUIState';

describe('trackUIReducer user flows', () => {
  it('selects and opens a platform row on first tap, then closes details on second tap', () => {
    const opened = trackUIReducer(initialTrackUIState, {
      type: 'toggle-platform-details',
      platformId: 'instagram',
      figureName: 'Mark Zuckerberg',
    });

    expect(opened.selectedPlatformId).toBe('instagram');
    expect(opened.openPlatformId).toBe('instagram');
    expect(opened.focusedFigureName).toBe('Mark Zuckerberg');

    const closed = trackUIReducer(opened, {
      type: 'toggle-platform-details',
      platformId: 'instagram',
      figureName: 'Mark Zuckerberg',
    });

    expect(closed.selectedPlatformId).toBe('instagram');
    expect(closed.openPlatformId).toBeNull();
    expect(closed.focusedFigureName).toBe('Mark Zuckerberg');
  });

  it('switches the open detail row when the user taps a different platform', () => {
    const opened = trackUIReducer(initialTrackUIState, {
      type: 'toggle-platform-details',
      platformId: 'instagram',
      figureName: 'Mark Zuckerberg',
    });

    const switched = trackUIReducer(opened, {
      type: 'toggle-platform-details',
      platformId: 'youtube',
      figureName: 'Sundar Pichai',
    });

    expect(switched.selectedPlatformId).toBe('youtube');
    expect(switched.openPlatformId).toBe('youtube');
    expect(switched.focusedFigureName).toBe('Sundar Pichai');
  });

  it('focuses a platform without forcing details open when the user taps AVOID', () => {
    const focused = trackUIReducer(initialTrackUIState, {
      type: 'focus-platform',
      platformId: 'amazon',
      figureName: 'Jeff Bezos',
    });

    expect(focused.selectedPlatformId).toBe('amazon');
    expect(focused.openPlatformId).toBeNull();
    expect(focused.focusedFigureName).toBe('Jeff Bezos');
  });

  it('focuses a group figure without keeping a row selected or open', () => {
    const grouped = trackUIReducer(initialTrackUIState, {
      type: 'focus-group',
      figureName: 'Mark Zuckerberg',
    });

    expect(grouped.selectedPlatformId).toBeNull();
    expect(grouped.openPlatformId).toBeNull();
    expect(grouped.focusedFigureName).toBe('Mark Zuckerberg');
  });
});
