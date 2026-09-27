/**
 * Card-mode rendering for the popup.
 *
 * Owns every DOM write inside the flagged section for the full-card state:
 * donation amounts, active cycles, confidence badge, and the "Based on"
 * source list. Math + routing parity with the app is preserved by calling
 * deriveDonationSummary() — the same helper DataZone.tsx uses.
 */

import type { TabFlag, TabFlagPerson } from '../types';
import type { DonationSummary, PoliticalPerson } from '../../core/models';
import { formatActiveCycles, formatDonationAmount, getPersonDisplayName, makeFecIndividualUrl } from '../../core/models';
import { getDisplaySurname } from '../../core/utils/surname';
import { deriveDonationSummary } from '../../features/Map/components/dataZoneSummary';
import { SHOW_FIGURE_NAME_IN_POPUP, CONFIDENCE_THRESHOLD_HIGH } from '../../config/constants';
import { extCopy } from '../copy';

// ── DOM refs (card-scoped) ─────────────────────────────────────────────────────

const entityNameEl            = document.getElementById('entity-name')!;
const figureNameEl            = document.getElementById('figure-name')!;
const confidenceDisclaimerEl  = document.getElementById('confidence-disclaimer')!;
const recentAmountEl          = document.getElementById('recent-amount')!;
const recentCycleEl           = document.getElementById('recent-cycle')!;
const totalSince2016          = document.getElementById('total-since-2016')!;
const activeCyclesEl          = document.getElementById('active-cycles')!;
const dataUnavailableEl       = document.getElementById('data-unavailable')!;
const basedOnEl               = document.getElementById('based-on')!;
const confidenceBadge         = document.getElementById('confidence-badge')!;
const fecLink                 = document.getElementById('fec-link') as HTMLAnchorElement;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Derive a short PAC source label. Prefers the entity canonicalName stripped
 * of suffixes; falls back to the raw committee name. Mirrors DataZone.tsx.
 */
function shortPacName(entityName: string | undefined, committeeName: string): string {
  if (entityName) {
    return entityName.replace(/\s*(Inc\.?|Corp\.?|Platforms|\.com|LLC|Company|Co\.?)\s*/gi, '').trim();
  }
  return committeeName
    .replace(/\s*(Political Action Committee|PAC|FEDERAL|FED)\s*/gi, '')
    .replace(/\s*(Inc\.?|Corp\.?)\s*/gi, '')
    .trim();
}

/** TabFlagPerson is structurally a PoliticalPerson (raw stripped) — safe to widen. */
function widenPerson(p: TabFlagPerson): PoliticalPerson {
  return p as unknown as PoliticalPerson;
}

function safeExternalUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function makeSpan(className: string, text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

function renderAmountLine(
  host: HTMLElement,
  leadingText: string,
  primaryText: string,
  separatorText: string,
  secondaryText: string,
  trailingText = '',
): void {
  host.replaceChildren(
    document.createTextNode(leadingText),
    makeSpan('amount-primary', primaryText),
    document.createTextNode(separatorText),
    makeSpan('amount-secondary', secondaryText),
    document.createTextNode(trailingText),
  );
}

// ── "Based on" source list ─────────────────────────────────────────────────────

/**
 * Render the "Based on" row with inline-flowed, comma-separated source links.
 * Mirrors DataZone.tsx — one labeled list of the FEC records whose data
 * composes the displayed totals.
 */
function renderBasedOn(
  entityName: string,
  committeeName: string | null,
  pacUrl: string | null,
  people: TabFlagPerson[],
): void {
  const sources: Array<{ label: string; url: string }> = [];

  if (committeeName && pacUrl) {
    const label = `${extCopy.sourcePrefix} ${shortPacName(entityName, committeeName)} \u2197`;
    const url = safeExternalUrl(pacUrl);
    if (url) sources.push({ label, url });
  }

  for (const person of people) {
    const widened = widenPerson(person);
    const lastName = getDisplaySurname(getPersonDisplayName(widened));
    const url = safeExternalUrl(makeFecIndividualUrl(widened));
    const label = `${lastName} ${extCopy.donationsLinkSuffix} \u2197`;
    if (url) sources.push({ label, url });
  }

  if (sources.length === 0) {
    basedOnEl.hidden = true;
    return;
  }

  const children: Node[] = [makeSpan('based-on-label', extCopy.basedOnLabel), document.createTextNode(' ')];
  sources.forEach((source, index) => {
    if (index > 0) children.push(document.createTextNode(', '));
    const anchor = document.createElement('a');
    anchor.className = 'based-on-link';
    anchor.href = source.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = source.label;
    children.push(anchor);
  });
  basedOnEl.replaceChildren(...children);
  basedOnEl.hidden = false;
}

// ── Card rendering ────────────────────────────────────────────────────────────

/**
 * Render the full card view. Totals combine PAC + linked-people donations;
 * recent-cycle amounts are cycle-aligned (only sources whose most-recent
 * cycle matches the displayed recent cycle contribute). Single source of
 * truth for the math: deriveDonationSummary().
 */
export function renderCard(flag: TabFlag): void {
  entityNameEl.textContent = flag.canonicalName.toUpperCase();

  if (SHOW_FIGURE_NAME_IN_POPUP && flag.displayFigure) {
    figureNameEl.textContent = flag.displayFigure;
    figureNameEl.hidden = false;
  } else {
    figureNameEl.hidden = true;
  }

  // Reconstruct a DonationSummary shape for deriveDonationSummary. The SW
  // populated the flattened fields from the live/bundled summary. raw[] and
  // lastUpdated are stripped at the message boundary — the derived summary
  // doesn't read them, but we must satisfy the type.
  const pacSummary: DonationSummary | null = flag.donationDataAvailable
    ? {
        committeeId: flag.entityFecCommitteeId ?? '',
        committeeName: flag.committeeName ?? '',
        recentCycle: flag.recentCycle ?? 0,
        recentRepubs: flag.recentRepubs,
        recentDems: flag.recentDems,
        totalRepubs: flag.totalRepubs,
        totalDems: flag.totalDems,
        totalO: flag.totalO,
        activeCycles: flag.activeCycles,
        cycleTotals: flag.cycleTotals,
        fecCommitteeUrl: flag.fecCommitteeUrl ?? '',
        raw: [],
        lastUpdated: '',
      }
    : null;

  const widenedPeople = flag.associatedPeople.map(widenPerson);
  const summary = deriveDonationSummary(pacSummary, widenedPeople);

  if (summary.hasRealDonations && summary.recentCycleLabel) {
    const oTotal = summary.totalO;
    const oSuffix = oTotal > 0 ? `${extCopy.oSep}${formatDonationAmount(oTotal)}` : '';

    if (summary.recentRIsLarger) {
      renderAmountLine(
        recentAmountEl,
        '',
        `${extCopy.rPrefix}${formatDonationAmount(summary.recentR)}`,
        extCopy.dSep,
        formatDonationAmount(summary.recentD),
      );
    } else {
      renderAmountLine(
        recentAmountEl,
        '',
        `D: ${formatDonationAmount(summary.recentD)}`,
        extCopy.dSep,
        `R: ${formatDonationAmount(summary.recentR)}`,
      );
    }
    recentCycleEl.textContent  = `${extCopy.cyclePrefix}${summary.recentCycleLabel}`;
    recentAmountEl.hidden = false;
    recentCycleEl.hidden  = false;

    if (summary.rIsLarger) {
      renderAmountLine(
        totalSince2016,
        'Total since 2016: ',
        `${extCopy.rPrefix}${formatDonationAmount(summary.totalR)}`,
        extCopy.dSep,
        formatDonationAmount(summary.totalD),
        oSuffix,
      );
    } else {
      renderAmountLine(
        totalSince2016,
        'Total since 2016: ',
        `D: ${formatDonationAmount(summary.totalD)}`,
        extCopy.dSep,
        `R: ${formatDonationAmount(summary.totalR)}`,
        oSuffix,
      );
    }
    totalSince2016.hidden = false;

    if (summary.activeCycles.length > 0) {
      activeCyclesEl.textContent = `${extCopy.activeCycles}${formatActiveCycles(summary.activeCycles)}`;
      activeCyclesEl.hidden = false;
    } else {
      activeCyclesEl.hidden = true;
    }

    dataUnavailableEl.hidden = true;
  } else {
    // Card mode with zero numbers — possible when a match is known but data
    // is still fetching. Show the unavailable-reason copy in place of
    // amounts; keep "Based on" row hidden since there are no sources yet.
    recentAmountEl.hidden = true;
    recentCycleEl.hidden  = true;
    totalSince2016.hidden = true;
    activeCyclesEl.hidden = true;
    dataUnavailableEl.textContent = flag.liveLookupFailed
      ? extCopy.fecError
      : flag.noBundledData
        ? extCopy.noBundledData
        : extCopy.donationUnavail;
    dataUnavailableEl.hidden = false;
  }

  // "Based on" source list — PAC (if present) + each linked person.
  // Replaces the legacy standalone fec-link when any sources exist.
  const hasAnySource =
    (flag.committeeName !== null && flag.fecCommitteeUrl !== null) ||
    flag.associatedPeople.length > 0;
  if (hasAnySource) {
    renderBasedOn(flag.entityName, flag.committeeName, flag.fecCommitteeUrl, flag.associatedPeople);
    fecLink.hidden = true;
  } else {
    basedOnEl.hidden = true;
    if (flag.fecCommitteeUrl) {
      fecLink.href = flag.fecCommitteeUrl;
      fecLink.hidden = false;
    } else {
      fecLink.hidden = true;
    }
  }

  if (flag.confidence < CONFIDENCE_THRESHOLD_HIGH) {
    confidenceBadge.textContent = extCopy.confidenceMedium;
    confidenceBadge.className   = `confidence-badge ${extCopy.confidenceMedium}`;
    confidenceBadge.title = extCopy.mediumTitle;
    confidenceBadge.hidden = false;
    confidenceDisclaimerEl.textContent = extCopy.mediumWarning;
    confidenceDisclaimerEl.hidden = false;
  } else {
    confidenceBadge.hidden = true;
    confidenceDisclaimerEl.hidden = true;
  }
}
