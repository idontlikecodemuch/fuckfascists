export type EffectiveScorecardState = 'preview' | 'loading' | 'presentation' | 'empty' | 'archive';

export type ScorecardUserNav = 'auto' | 'archive' | 'dismissed' | 'present';

interface DeriveScorecardScreenStateInput {
  userNav: ScorecardUserNav;
  capturing: boolean;
  liveDataLoading: boolean;
  dropDataLoading: boolean;
  cardUri: string | null;
  inPresentationWindow: boolean;
  liveGrandTotal: number | null;
  hasDropped: boolean;
  minAvoids: number;
}

interface PendingPreviousScorecardInput {
  hasDropped: boolean;
  liveWeekOf: string;
  scoredWeekOf: string;
  dropGrandTotal: number | null;
  minAvoids: number;
}

export function deriveScorecardScreenState({
  userNav,
  capturing,
  liveDataLoading,
  dropDataLoading,
  cardUri,
  inPresentationWindow,
  liveGrandTotal,
  hasDropped,
  minAvoids,
}: DeriveScorecardScreenStateInput): EffectiveScorecardState {
  if (userNav === 'archive') return 'archive';
  if (capturing || liveDataLoading || dropDataLoading) return 'loading';

  const cardActive = Boolean(cardUri) && userNav !== 'dismissed';
  if (cardActive && (userNav === 'present' || inPresentationWindow)) {
    return 'presentation';
  }

  if (liveGrandTotal != null && liveGrandTotal >= minAvoids) return 'preview';
  if (hasDropped && inPresentationWindow) return 'empty';
  return 'preview';
}

export function shouldShowPreviewStamp(
  effectiveState: EffectiveScorecardState,
  liveGrandTotal: number | null,
  minAvoids: number,
): boolean {
  return effectiveState === 'preview' && liveGrandTotal != null && liveGrandTotal >= minAvoids;
}

/**
 * Bridges the Saturday-midnight rollover before the completed week's later
 * scorecard drop. The status is meaningful only when that week has a card.
 */
export function shouldShowPendingPreviousScorecard({
  hasDropped,
  liveWeekOf,
  scoredWeekOf,
  dropGrandTotal,
  minAvoids,
}: PendingPreviousScorecardInput): boolean {
  return !hasDropped &&
    liveWeekOf !== scoredWeekOf &&
    dropGrandTotal != null &&
    dropGrandTotal >= minAvoids;
}
