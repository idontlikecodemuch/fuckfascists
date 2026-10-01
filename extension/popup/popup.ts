/**
 * Popup entry — queries the active tab, asks the SW for its flag, and routes
 * to the correct rendered state (clean / flagged / avoided).
 *
 * All flagged-state rendering lives in renderFlag.ts so this file stays a
 * thin controller: DOM state switching, message plumbing, and button wiring.
 *
 * The donation math + card/banner routing mirror the mobile app's
 * BusinessCard (Principle #8 cross-surface data parity): resolveCardMode
 * runs in the SW, deriveDonationSummary runs in renderFlag.ts with the same
 * inputs the app's DataZone uses.
 *
 * No browsing history is accessed here. The popup only reads the active tab
 * URL after the user opens the extension, and only to recover a missing
 * service-worker domain check for that tab.
 */

import type {
  TabFlag, WeeklyStats,
  CheckDomainMsg, GetCurrentFlagMsg, AvoidEntityMsg, SnoozeDomainMsg, GetWeeklyStatsMsg,
} from '../types';
import { extCopy } from '../copy';
import { renderFlag } from './renderFlag';

// ── DOM refs ───────────────────────────────────────────────────────────────────

const stateClean   = document.getElementById('state-clean')!;
const stateFlagged = document.getElementById('state-flagged')!;
const stateAvoided = document.getElementById('state-avoided')!;

const appTitle = document.querySelector('.app-title')!;
const cleanMsg = document.querySelector('.clean-msg')!;
const flaggedRegion = document.querySelector('.business-card')!;
const dataUnavailable = document.getElementById('data-unavailable')!;
const fecLink = document.getElementById('fec-link')!;
const avoidedMsg = document.querySelector('.avoided-msg')!;
const avoidedSub = document.querySelector('.avoided-sub')!;

const btnAvoided = document.getElementById('btn-avoided') as HTMLButtonElement;
const btnSnooze  = document.getElementById('btn-snooze')  as HTMLButtonElement;

const statEntity   = document.getElementById('stat-entity')!;
const statPlatform = document.getElementById('stat-platform')!;
const statTop      = document.getElementById('stat-top')!;
const summaryTitle = document.getElementById('summary-title')!;
const statEntityLabel = document.getElementById('stat-entity-label')!;
const statPlatformLabel = document.getElementById('stat-platform-label')!;

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

function hostnameFromTabUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.hostname;
  } catch {
    return null;
  }
}

function hydrateStaticCopy(): void {
  document.title = extCopy.appName;
  appTitle.textContent = extCopy.appName;
  cleanMsg.textContent = extCopy.cleanState;
  flaggedRegion.setAttribute('aria-label', extCopy.flaggedRegionLabel);
  dataUnavailable.textContent = extCopy.donationUnavail;
  fecLink.textContent = extCopy.fecLink;

  btnAvoided.textContent = extCopy.avoidBtn;
  btnAvoided.setAttribute('aria-label', extCopy.avoidBtnA11y);
  btnSnooze.textContent = extCopy.snoozeBtn;
  btnSnooze.setAttribute('aria-label', extCopy.snoozeBtnA11y);

  avoidedMsg.textContent = extCopy.avoidedTitle;
  avoidedSub.textContent = extCopy.avoidedSub;

  const weeklySummary = document.querySelector('.weekly-summary')!;
  weeklySummary.setAttribute('aria-label', extCopy.weeklySummaryA11y);
  summaryTitle.textContent = extCopy.weeklyTitle;
  statEntityLabel.textContent = extCopy.weeklyBiz;
  statPlatformLabel.textContent = extCopy.weeklyPlat;
}

// ── Weekly stats ───────────────────────────────────────────────────────────────

async function loadWeeklyStats(weekOf: string): Promise<void> {
  const msg: GetWeeklyStatsMsg = { type: 'GET_WEEKLY_STATS', weekOf };
  const stats = await chrome.runtime.sendMessage(msg) as WeeklyStats | null;
  if (!stats) return;

  statEntity.textContent   = String(stats.entityAvoidCount);
  statPlatform.textContent = String(stats.platformAvoidCount);

  if (stats.topEntityName) {
    statTop.textContent = `${extCopy.weeklyTop}${stats.topEntityName.toUpperCase()}`;
    statTop.hidden = false;
  } else {
    statTop.hidden = true;
  }
}

async function getCurrentFlag(tabId: number): Promise<TabFlag | null> {
  const flagMsg: GetCurrentFlagMsg = { type: 'GET_CURRENT_FLAG', tabId };
  return await chrome.runtime.sendMessage(flagMsg) as TabFlag | null;
}

async function ensureFlagForActiveTab(tab: chrome.tabs.Tab): Promise<TabFlag | null> {
  const tabId = tab.id;
  if (!tabId) return null;

  const existing = await getCurrentFlag(tabId);
  if (existing) return existing;

  const hostname = hostnameFromTabUrl(tab.url);
  if (!hostname) return null;

  // Recovery path for MV3 cold starts: if the content script's page-load
  // CHECK_DOMAIN message did not leave a tab flag, opening the popup checks
  // the active tab directly and then reads the freshly populated flag.
  const checkMsg: CheckDomainMsg = { type: 'CHECK_DOMAIN', hostname, tabId };
  await chrome.runtime.sendMessage(checkMsg).catch(() => undefined);
  return await getCurrentFlag(tabId);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  hydrateStaticCopy();

  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id;
  if (!tabId) { showOnly(stateClean); return; }

  const flag = await ensureFlagForActiveTab(tab);

  if (!flag) {
    showOnly(stateClean);
  } else if (flag.avoided) {
    showOnly(stateAvoided);
  } else {
    renderFlag(flag);
    showOnly(stateFlagged);
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
