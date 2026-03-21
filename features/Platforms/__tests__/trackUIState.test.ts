import { initialTrackUIState, trackUIReducer } from '../context/trackUIState';

describe('trackUIReducer user flows', () => {
  it('opens and closes day circles when the user taps the focused row body', () => {
    const focused = trackUIReducer(initialTrackUIState, {
      type: 'focus-row',
      platformId: 'instagram',
    });

    const expanded = trackUIReducer(focused, {
      type: 'toggle-row-expansion',
      platformId: 'instagram',
    });
    expect(expanded.focusedPlatformId).toBe('instagram');
    expect(expanded.expandedIds.has('instagram')).toBe(true);

    const collapsed = trackUIReducer(expanded, {
      type: 'toggle-row-expansion',
      platformId: 'instagram',
    });
    expect(collapsed.focusedPlatformId).toBe('instagram');
    expect(collapsed.expandedIds.size).toBe(0);
  });

  it('focuses and expands in one transition when the user taps a checkmark on an unfocused row', () => {
    const state = trackUIReducer(initialTrackUIState, {
      type: 'focus-and-expand-row',
      platformId: 'facebook',
    });

    expect(state.focusedPlatformId).toBe('facebook');
    expect(Array.from(state.expandedIds)).toEqual(['facebook']);
  });

  it('collapses the previously expanded row when the user focuses a different row', () => {
    const expanded = trackUIReducer(initialTrackUIState, {
      type: 'focus-and-expand-row',
      platformId: 'instagram',
    });

    const switched = trackUIReducer(expanded, {
      type: 'focus-row',
      platformId: 'youtube',
    });

    expect(switched.focusedPlatformId).toBe('youtube');
    expect(switched.expandedIds.size).toBe(0);
  });

  it('stores a group focus token without expanding child rows when the user taps a group header', () => {
    const grouped = trackUIReducer(initialTrackUIState, {
      type: 'focus-group',
      figureName: 'Mark Zuckerberg',
    });

    expect(grouped.focusedPlatformId).toBe('Mark Zuckerberg');
    expect(grouped.expandedIds.size).toBe(0);
  });
});
