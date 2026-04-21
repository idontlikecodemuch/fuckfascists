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
 * No browsing history is accessed here. The popup only reads state that the
 * service worker already has in memory.
 */

import type {
  TabFlag, WeeklyStats,
  GetCurrentFlagMsg, AvoidEntityMsg, SnoozeDomainMsg, GetWeeklyStatsMsg,
} from '../types';
import { extCopy } from '../copy';
import { renderFlag } from './renderFlag';

// ── DOM refs ───────────────────────────────────────────────────────────────────

const stateClean   = document.getElementById('state-clean')!;
const stateFlagged = document.getElementById('state-flagged')!;
const stateAvoided = document.getElementById('state-avoided')!;

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
