/**
 * Popup script — renders the pixel art business card for the active tab.
 *
 * Flow:
 *  1. Query the active tab ID.
 *  2. Ask the service worker for the current flag (GET_CURRENT_FLAG).
 *  3. Render the appropriate state: clean, flagged, or already-avoided.
 *  4. Handle AVOIDED and SNOOZE button clicks.
 *  5. Fetch and render weekly stats footer.
 *
 * No browsing history is accessed here. The popup only reads state
 * that the service worker already has in memory.
 */

import type { TabFlag, WeeklyStats, GetCurrentFlagMsg, AvoidEntityMsg, SnoozeDomainMsg, GetWeeklyStatsMsg } from '../types';
import { formatActiveCycles, formatCycleLabel, formatDonationAmount } from '../../core/models';
import { SHOW_FIGURE_NAME_IN_POPUP, CONFIDENCE_THRESHOLD_HIGH } from '../../config/constants';

// ── DOM refs ───────────────────────────────────────────────────────────────────

const stateClean   = document.getElementById('state-clean')!;
const stateFlagged = document.getElementById('state-flagged')!;
const stateAvoided = document.getElementById('state-avoided')!;

// Figure name visibility is controlled by SHOW_FIGURE_NAME_IN_POPUP (see config/constants.ts).
const entityNameEl            = document.getElementById('entity-name')!;
const figureNameEl            = document.getElementById('figure-name')!;
const confidenceDisclaimerEl  = document.getElementById('confidence-disclaimer')!;
const recentAmountEl          = document.getElementById('recent-amount')!;
const recentCycleEl           = document.getElementById('recent-cycle')!;
const totalSince2016          = document.getElementById('total-since-2016')!;
const activeCyclesEl          = document.getElementById('active-cycles')!;
const dataUnavailableEl       = document.getElementById('data-unavailable')!;
const confidenceBadge         = document.getElementById('confidence-badge')!;
const fecLink                 = document.getElementById('fec-link') as HTMLAnchorElement;

const btnAvoided = document.getElementById('btn-avoided') as HTMLButtonElement;
const btnSnooze  = document.getElementById('btn-snooze')  as HTMLButtonElement;

const statEntity   = document.getElementById('stat-entity')!;
const statPlatform = document.getElementById('stat-platform')!;
const statTop      = document.getElementById('stat-top')!;

// ── Helpers ────────────────────────────────────────────────────────────────────

function showOnly(el: HTMLElement) {
  [stateClean, stateFlagged, stateAvoided].forEach((s) => {
    s.hidden = s !== el;
  });
}

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderFlag(flag: TabFlag) {
  entityNameEl.textContent = flag.canonicalName.toUpperCase();

  if (SHOW_FIGURE_NAME_IN_POPUP && flag.displayFigure) {
    figureNameEl.textContent = flag.displayFigure;
    figureNameEl.hidden = false;
  } else {
    figureNameEl.hidden = true;
  }

  if (flag.donationDataAvailable && flag.recentCycle !== null) {
    recentAmountEl.textContent =
      `GOP ${formatDonationAmount(flag.recentRepubs)} · DEM ${formatDonationAmount(flag.recentDems)}`;
    recentCycleEl.textContent  = `in ${formatCycleLabel(flag.recentCycle)}`;
    recentAmountEl.hidden = false;
    recentCycleEl.hidden  = false;

    totalSince2016.textContent =
      `Total since 2016: GOP ${formatDonationAmount(flag.totalRepubs)} · DEM ${formatDonationAmount(flag.totalDems)}`;
    totalSince2016.hidden = false;

    if (flag.activeCycles.length > 0) {
      activeCyclesEl.textContent = `Active cycles: ${formatActiveCycles(flag.activeCycles)}`;
      activeCyclesEl.hidden = false;
    } else {
      activeCyclesEl.hidden = true;
    }

    dataUnavailableEl.hidden = true;
  } else {
    recentAmountEl.hidden = true;
    recentCycleEl.hidden  = true;
    totalSince2016.hidden = true;
    activeCyclesEl.hidden = true;
    // Priority: live call failure > no bundled data > generic unavailable.
    dataUnavailableEl.textContent = flag.liveLookupFailed
      ? "Couldn't reach FEC — try again later."
      : flag.noBundledData
        ? 'No bundled donation data.'
        : 'Donation data temporarily unavailable.';
    dataUnavailableEl.hidden = false;
  }

  // FEC record link
  if (flag.fecCommitteeUrl) {
    fecLink.href = flag.fecCommitteeUrl;
    fecLink.hidden = false;
  } else {
    fecLink.hidden = true;
  }

  const confidenceLabel = flag.confidence >= CONFIDENCE_THRESHOLD_HIGH ? 'HIGH' : 'MEDIUM';
  confidenceBadge.textContent = confidenceLabel;
  confidenceBadge.className   = `confidence-badge ${confidenceLabel}`;

  if (flag.confidence < CONFIDENCE_THRESHOLD_HIGH) {
    confidenceBadge.title = 'MEDIUM confidence — data may not be exact. Always verify at FEC.';
    confidenceDisclaimerEl.textContent = 'MEDIUM confidence — verify before acting.';
    confidenceDisclaimerEl.hidden = false;
  } else {
    confidenceBadge.title = '';
    confidenceDisclaimerEl.hidden = true;
  }

  showOnly(stateFlagged);
}

// ── Weekly stats ───────────────────────────────────────────────────────────────

async function loadWeeklyStats(weekOf: string): Promise<void> {
  const msg: GetWeeklyStatsMsg = { type: 'GET_WEEKLY_STATS', weekOf };
  const stats = await chrome.runtime.sendMessage(msg) as WeeklyStats | null;
  if (!stats) return;

  statEntity.textContent   = String(stats.entityAvoidCount);
  statPlatform.textContent = String(stats.platformAvoidCount);

  if (stats.topEntityName) {
    statTop.textContent = `TOP: ${stats.topEntityName.toUpperCase()}`;
    statTop.hidden = false;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id;
  if (!tabId) { showOnly(stateClean); return; }

  // Request current flag from service worker
  const flagMsg: GetCurrentFlagMsg = { type: 'GET_CURRENT_FLAG', tabId };
  const flag = await chrome.runtime.sendMessage(flagMsg) as TabFlag | null;

  if (!flag) {
    showOnly(stateClean);
  } else if (flag.avoided) {
    showOnly(stateAvoided);
  } else {
    renderFlag(flag);
  }

  // Wire up buttons
  btnAvoided.addEventListener('click', async () => {
    btnAvoided.disabled = true;
    const msg: AvoidEntityMsg = { type: 'AVOID_ENTITY', tabId };
    await chrome.runtime.sendMessage(msg);
    showOnly(stateAvoided);
    await loadWeeklyStats(getMondayOf(new Date())); // refresh stats after avoid
  });

  btnSnooze.addEventListener('click', async () => {
    if (!flag) return;
    const msg: SnoozeDomainMsg = {
      type: 'SNOOZE_DOMAIN',
      hostname: flag.hostname,
      durationMs: 7 * 86_400_000, // 7 days
    };
    await chrome.runtime.sendMessage(msg);
    showOnly(stateClean);
  });

  // Load weekly summary footer
  await loadWeeklyStats(getMondayOf(new Date()));
}

main().catch(console.error);
