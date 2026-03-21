export interface TrackUIState {
  selectedPlatformId: string | null;
  openPlatformId: string | null;
  focusedFigureName: string | null;
}

export type TrackUIAction =
  | { type: 'focus-platform'; platformId: string; figureName: string }
  | { type: 'toggle-platform-details'; platformId: string; figureName: string }
  | { type: 'open-platform-details'; platformId: string; figureName: string }
  | { type: 'focus-group'; figureName: string }
  | { type: 'clear-focus' }
  | { type: 'reset' };

export const initialTrackUIState: TrackUIState = {
  selectedPlatformId: null,
  openPlatformId: null,
  focusedFigureName: null,
};

export function trackUIReducer(state: TrackUIState, action: TrackUIAction): TrackUIState {
  switch (action.type) {
    case 'focus-platform': {
      const keepOpen = state.openPlatformId === action.platformId;
      const nextState = {
        selectedPlatformId: action.platformId,
        openPlatformId: keepOpen ? action.platformId : null,
        focusedFigureName: action.figureName,
      };

      if (
        state.selectedPlatformId === nextState.selectedPlatformId &&
        state.openPlatformId === nextState.openPlatformId &&
        state.focusedFigureName === nextState.focusedFigureName
      ) {
        return state;
      }

      return nextState;
    }
    case 'toggle-platform-details': {
      const isOpen =
        state.selectedPlatformId === action.platformId &&
        state.openPlatformId === action.platformId;

      return {
        selectedPlatformId: action.platformId,
        openPlatformId: isOpen ? null : action.platformId,
        focusedFigureName: action.figureName,
      };
    }
    case 'open-platform-details':
      return {
        selectedPlatformId: action.platformId,
        openPlatformId: action.platformId,
        focusedFigureName: action.figureName,
      };
    case 'focus-group':
      if (
        state.selectedPlatformId === null &&
        state.openPlatformId === null &&
        state.focusedFigureName === action.figureName
      ) {
        return state;
      }

      return {
        selectedPlatformId: null,
        openPlatformId: null,
        focusedFigureName: action.figureName,
      };
    case 'clear-focus':
      if (
        state.selectedPlatformId === null &&
        state.openPlatformId === null &&
        state.focusedFigureName === null
      ) {
        return state;
      }
      return initialTrackUIState;
    case 'reset':
      return initialTrackUIState;
    default:
      return state;
  }
}
