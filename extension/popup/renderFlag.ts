/**
 * Flagged-state router.
 *
 * Keeps popup.ts a thin controller. Branches on flag.cardMode — card mode
 * delegates to renderCard.ts; banner mode stays here because it is small
 * (just hides the numbers and writes a reason line).
 *
 * Math + card/banner routing mirror the mobile app (Principle #8):
 *  - resolveCardMode runs in the service worker (pure TS shared module).
 *  - renderCard.ts calls deriveDonationSummary, same as DataZone.tsx.
 */

import type { TabFlag } from '../types';
import { SHOW_FIGURE_NAME_IN_POPUP } from '../../config/constants';
import { extCopy } from '../copy';
import { renderCard } from './renderCard';

// ── DOM refs (banner-scoped) ───────────────────────────────────────────────────

const entityNameEl           = document.getElementById('entity-name')!;
const figureNameEl           = document.getElementById('figure-name')!;
const confidenceDisclaimerEl = document.getElementById('confidence-disclaimer')!;
const recentAmountEl         = document.getElementById('recent-amount')!;
const recentCycleEl          = document.getElementById('recent-cycle')!;
const totalSince2016         = document.getElementById('total-since-2016')!;
const activeCyclesEl         = document.getElementById('active-cycles')!;
const dataUnavailableEl      = document.getElementById('data-unavailable')!;
const basedOnEl              = document.getElementById('based-on')!;
const confidenceBadge        = document.getElementById('confidence-badge')!;
const fecLink                = document.getElementById('fec-link') as HTMLAnchorElement;

// ── Banner rendering ──────────────────────────────────────────────────────────

/**
 * Banner-equivalent flagged state — amber icon stays, AVOID button stays (UI
 * treatment can differ per surface; data behavior must not, per Principle #8),
 * but the donation numbers are replaced by a single unavailable-reason line.
 */
function renderBanner(flag: TabFlag, reason: string): void {
  entityNameEl.textContent = flag.canonicalName.toUpperCase();

  if (SHOW_FIGURE_NAME_IN_POPUP && flag.displayFigure) {
    figureNameEl.textContent = flag.displayFigure;
    figureNameEl.hidden = false;
  } else {
    figureNameEl.hidden = true;
  }

  recentAmountEl.hidden = true;
  recentCycleEl.hidden  = true;
  totalSince2016.hidden = true;
  activeCyclesEl.hidden = true;
  basedOnEl.hidden      = true;
  fecLink.hidden        = true;

  dataUnavailableEl.textContent = reason;
  dataUnavailableEl.hidden = false;

  // No confidence badge in banner mode — there's no data to caveat.
  confidenceBadge.hidden = true;
  confidenceDisclaimerEl.hidden = true;
}

// ── Router ────────────────────────────────────────────────────────────────────

/**
 * Route a TabFlag to the correct rendered state based on the SW-computed
 * cardMode. Caller (popup.ts) is responsible for toggling section visibility
 * — this function only paints into the flagged-section DOM nodes.
 */
export function renderFlag(flag: TabFlag): void {
  const mode = flag.cardMode;
  if (mode === 'card') {
    renderCard(flag);
    return;
  }

  // Banner mode — pick the reason copy. Lookup failure takes precedence over
  // the static banner variant so users see the most actionable message.
  const reason = flag.liveLookupFailed
    ? extCopy.fecError
    : mode.banner === 'dissolved'
      ? extCopy.bannerDissolved(flag.canonicalName)
      : mode.banner === 'no_pac'
        ? extCopy.bannerNoPac(flag.canonicalName)
        : mode.banner === 'lookup_failed'
          ? extCopy.fecError
          : extCopy.donationUnavail; // no_match shouldn't occur for matched tabs
  renderBanner(flag, reason);
}
