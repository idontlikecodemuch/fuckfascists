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

// ── DOM refs ───────────────────────────────────────────────────────────────────

const stateClean   = document.getElementById('state-clean')!;
const stateFlagged = document.getElementById('state-flagged')!;
const stateAvoided = document.getElementById('state-avoided')!;

const entityNameEl   = document.getElementById('entity-name')!;
const ceoNameEl      = document.getElementById('ceo-name')!;
const donationRepubs = document.getElementById('donation-repubs')!;
const donationTotal  = document.getElementById('donation-total')!;
const donationCycle  = document.getElementById('donation-cycle')!;
const confidenceBadge = document.getElementById('confidence-badge')!;
const openSecretsLink = document.getElementById('opensecrets-link') as HTMLAnchorElement;
const fecLink         = document.getElementById('fec-link')         as HTMLAnchorElement;

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

function formatUSD(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
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
  entityNameEl.textContent  = flag.canonicalName.toUpperCase();
  ceoNameEl.textContent     = `CEO: ${flag.ceoName}`;
  donationRepubs.textContent = formatUSD(flag.donationRepubs);
  donationTotal.textContent  = formatUSD(flag.donationTotal);
  donationCycle.textContent  = flag.cycle;
  openSecretsLink.href       = flag.sourceUrl;

  // FEC filing link — only show when a committee ID was available.
  if (flag.fecFilingUrl) {
    fecLink.hidden = false;
    fecLink.onclick = (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: flag.fecFilingUrl! });
    };
  } else {
    fecLink.hidden = true;
  }

  confidenceBadge.textContent = flag.confidence;
  confidenceBadge.className   = `confidence-badge ${flag.confidence}`;

  if (flag.confidence === 'MEDIUM') {
    confidenceBadge.title = 'MEDIUM confidence — data may not be exact. Always verify at OpenSecrets.';
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
