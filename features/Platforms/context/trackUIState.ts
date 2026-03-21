export interface TrackUIState {
  focusedPlatformId: string | null;
  expandedIds: Set<string>;
}

export type TrackUIAction =
  | { type: 'focus-row'; platformId: string }
  | { type: 'focus-group'; figureName: string }
  | { type: 'clear-focus' }
  | { type: 'toggle-row-expansion'; platformId: string }
  | { type: 'focus-and-expand-row'; platformId: string }
  | { type: 'expand-all'; ids: string[] }
  | { type: 'collapse-one'; platformId: string }
  | { type: 'reset' };

export const initialTrackUIState: TrackUIState = {
  focusedPlatformId: null,
  expandedIds: new Set(),
};

export function trackUIReducer(state: TrackUIState, action: TrackUIAction): TrackUIState {
  switch (action.type) {
    case 'focus-row':
      if (state.focusedPlatformId === action.platformId && state.expandedIds.size === 0) {
        return state;
      }
      return { focusedPlatformId: action.platformId, expandedIds: new Set() };
    case 'focus-group':
      if (state.focusedPlatformId === action.figureName && state.expandedIds.size === 0) {
        return state;
      }
      return { focusedPlatformId: action.figureName, expandedIds: new Set() };
    case 'clear-focus':
      if (state.focusedPlatformId === null && state.expandedIds.size === 0) {
        return state;
      }
      return initialTrackUIState;
    case 'toggle-row-expansion': {
      const isExpanded = state.expandedIds.has(action.platformId);
      return {
        focusedPlatformId: action.platformId,
        expandedIds: isExpanded ? new Set() : new Set([action.platformId]),
      };
    }
    case 'focus-and-expand-row':
      return {
        focusedPlatformId: action.platformId,
        expandedIds: new Set([action.platformId]),
      };
    case 'expand-all':
      return { ...state, expandedIds: new Set(action.ids) };
    case 'collapse-one': {
      if (!state.expandedIds.has(action.platformId)) return state;
      const next = new Set(state.expandedIds);
      next.delete(action.platformId);
      return { ...state, expandedIds: next };
    }
    case 'reset':
      return initialTrackUIState;
    default:
      return state;
  }
}
