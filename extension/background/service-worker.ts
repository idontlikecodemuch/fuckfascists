/**
 * Extension service worker — Manifest V3.
 *
 * Responsibilities:
 *  1. Listen for CHECK_DOMAIN messages from the content script.
 *  2. Look up the domain against the bundled + CDN-refreshed entity list.
 *  3. If matched and not snoozed, fetch donation data and set the amber icon.
 *  4. Reply to popup messages: GET_CURRENT_FLAG, AVOID_ENTITY, SNOOZE_DOMAIN,
 *     GET_WEEKLY_STATS.
 *
 * Nothing from this file is ever written to disk except through the
 * ChromeStorageAdapter (avoid events + cache) and snooze records.
 * NO browsing history is stored.
 */

import type { Entity } from '../../core/models';
import type { ExtensionMsg, TabFlag, WeeklyStats } from '../types';
import { ChromeStorageAdapter } from '../storage/ChromeStorageAdapter';
import { findByDomain } from './domainMatch';
import {
  setTabFlag, getTabFlag, markTabAvoided, clearTabFlag,
  getLastFlagged, recordFlagged, setSnoozed, isSnoozed,
} from './sessionStore';
import { makeCacheDeps } from '../../core/data/cacheStore';
import { OpenSecretsClient } from '../../core/api/client';
import { getMondayOf, toDateString } from '../../core/data/eventStore';
import { recordEntityAvoid } from '../../core/data/eventStore';
import { ENTITY_LIST_UPDATE_URL, EXTENSION_FLAG_FREQUENCY, ENTITY_CACHE_TTL_DAYS } from '../../config/constants';

// ─── Globals (re-initialised after SW wake) ────────────────────────────────────

const adapter = new ChromeStorageAdapter();
const cacheDeps = makeCacheDeps(adapter);
let apiClient: OpenSecretsClient | null = null;
let entities: Entity[] = [];

async function init() {
  // The OpenSecrets API key is stored in chrome.storage.local under
  // 'opensecrets_api_key'. It must be written there before first use —
  // either via an options page or an onInstalled prompt (to be built in
  // pre-launch checklist item). It is NEVER hard-coded or committed to source.
  // If absent, domain matching still works but no donation data is fetched
  // (handleCheckDomain returns early at the "no client" guard).
  const result = await chrome.storage.local.get('opensecrets_api_key');
  const apiKey = result['opensecrets_api_key'] as string | undefined;
  if (apiKey) {
    apiClient = new OpenSecretsClient({ apiKey });
  }

  // Load entity list from storage (written by the entity list refresher).
  const listResult = await chrome.storage.local.get('entity_list');
  const stored = listResult['entity_list'] as Entity[] | undefined;
  if (stored?.length) {
    entities = stored;
  } else {
    // First run: fetch and cache the entity list from CDN.
    await refreshEntityList();
  }
}

async function refreshEntityList(): Promise<void> {
  try {
    const res = await fetch(ENTITY_LIST_UPDATE_URL);
    if (!res.ok) return;
    const data = (await res.json()) as Entity[];
    if (Array.isArray(data) && data.length > 0) {
      entities = data;
      await chrome.storage.local.set({ entity_list: data });
    }
  } catch {
    // Silently ignore — bundled list (if any) stays active
  }
}

// ── Icon management ────────────────────────────────────────────────────────────

async function setAmberIcon(tabId: number): Promise<void> {
  await chrome.action.setIcon({
    tabId,
    path: {
      16:  'icons/icon-amber16.png',
      32:  'icons/icon-amber32.png',
      48:  'icons/icon-amber48.png',
      128: 'icons/icon-amber128.png',
    },
  });
}

async function resetIcon(tabId: number): Promise<void> {
  await chrome.action.setIcon({
    tabId,
    path: {
      16:  'icons/icon16.png',
      32:  'icons/icon32.png',
      48:  'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  });
}

// ── Frequency throttling ───────────────────────────────────────────────────────

function shouldFlag(hostname: string): boolean {
  const last = getLastFlagged(hostname);
  if (last === null) return true;

  switch (EXTENSION_FLAG_FREQUENCY) {
    case 'session': return false; // already flagged this session
    case 'daily':   return Date.now() - last > 86_400_000;
    case 'weekly':  return Date.now() - last > 7 * 86_400_000;
    default:        return false;
  }
}

// ── Domain check ───────────────────────────────────────────────────────────────

async function handleCheckDomain(hostname: string, tabId: number): Promise<void> {
  const entity = findByDomain(hostname, entities);
  if (!entity) return;

  if (await isSnoozed(hostname)) return;
  if (!shouldFlag(hostname)) return;

  // Fetch or use cached donation data
  const cacheKey = `ext:${entity.id}`;
  const CACHE_TTL_MS = ENTITY_CACHE_TTL_DAYS * 86_400_000;

  let donationSummary = null;

  const cached = await cacheDeps.getCache(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    donationSummary = cached.donationSummary;
  } else if (apiClient && entity.openSecretsOrgId) {
    try {
      donationSummary = await apiClient.getOrgSummary(entity.openSecretsOrgId);
      await cacheDeps.setCache({
        key: cacheKey,
        openSecretsOrgId: entity.openSecretsOrgId,
        donationSummary,
        confidence: entity.confidenceOverride ?? 'MEDIUM',
        fetchedAt: Date.now(),
      });
    } catch {
      // Don't flag without data — silently skip
      return;
    }
  } else {
    return; // no client or org ID — can't show data
  }

  const flag: TabFlag = {
    hostname,
    entityId: entity.id,
    canonicalName: entity.canonicalName,
    ceoName: entity.ceoName,
    donationTotal:  donationSummary.total,
    donationRepubs: donationSummary.repubs,
    sourceUrl:      donationSummary.sourceUrl,
    cycle:          donationSummary.cycle,
    confidence:     entity.confidenceOverride ?? 'MEDIUM',
    avoided: false,
  };

  setTabFlag(tabId, flag);
  recordFlagged(hostname);
  await setAmberIcon(tabId);
}

// ── Avoid entity ───────────────────────────────────────────────────────────────

async function handleAvoidEntity(tabId: number): Promise<{ ok: boolean }> {
  const flag = getTabFlag(tabId);
  if (!flag) return { ok: false };

  markTabAvoided(tabId);
  await recordEntityAvoid(adapter, flag.entityId);
  return { ok: true };
}

// ── Weekly stats ───────────────────────────────────────────────────────────────

async function handleGetWeeklyStats(weekOf: string): Promise<WeeklyStats> {
  const [entityAvoids, platformAvoids] = await Promise.all([
    adapter.getEntityAvoids(),
    adapter.getPlatformAvoids(weekOf),
  ]);

  const weekStart = weekOf;
  const weekEnd = nextMonday(weekOf);

  const weekEntityAvoids = entityAvoids.filter(
    (e) => e.date >= weekStart && e.date < weekEnd,
  );

  // Find top entity by avoid count this week
  const countByEntity = new Map<string, number>();
  let totalEntityAvoids = 0;
  for (const e of weekEntityAvoids) {
    countByEntity.set(e.entityId, (countByEntity.get(e.entityId) ?? 0) + e.count);
    totalEntityAvoids += e.count;
  }

  let topEntityId: string | null = null;
  let topCount = 0;
  for (const [id, count] of countByEntity) {
    if (count > topCount) { topCount = count; topEntityId = id; }
  }

  const topEntity = topEntityId
    ? entities.find((en) => en.id === topEntityId) ?? null
    : null;

  return {
    entityAvoidCount:   totalEntityAvoids,
    platformAvoidCount: platformAvoids.length,
    topEntityName:      topEntity?.canonicalName ?? null,
  };
}

function nextMonday(weekOf: string): string {
  const d = new Date(weekOf + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

// ── Message router ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (msg: ExtensionMsg, sender, sendResponse) => {
    (async () => {
      switch (msg.type) {
        case 'CHECK_DOMAIN': {
          // Prefer the authoritative tab ID from the message sender over the
          // placeholder (-1) sent by the content script.
          const tabId = sender.tab?.id ?? msg.tabId;
          await handleCheckDomain(msg.hostname, tabId);
          sendResponse({ ok: true });
          break;
        }

        case 'GET_CURRENT_FLAG':
          sendResponse(getTabFlag(msg.tabId));
          break;

        case 'AVOID_ENTITY':
          sendResponse(await handleAvoidEntity(msg.tabId));
          break;

        case 'SNOOZE_DOMAIN': {
          // Snooze by hostname — no tab ID needed for the snooze record itself.
          // We clear the tab flag for any tab currently showing this hostname.
          await setSnoozed(msg.hostname, msg.durationMs);
          const snoozedTabId = sender.tab?.id;
          if (snoozedTabId !== undefined) clearTabFlag(snoozedTabId);
          sendResponse({ ok: true });
          break;
        }

        case 'GET_WEEKLY_STATS': {
          const stats = await handleGetWeeklyStats(msg.weekOf);
          sendResponse(stats);
          break;
        }
      }
    })();
    return true; // keep message channel open for async response
  }
);

// ── Tab lifecycle ──────────────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabFlag(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    // New navigation — clear the old flag so stale amber doesn't persist
    clearTabFlag(tabId);
    resetIcon(tabId).catch(() => {/* ignore if tab closed */});
  }
});

// ── Periodic entity list refresh (once per day) ────────────────────────────────
//
// chrome.alarms persists across service worker restarts — the alarm only needs
// to be created once (on install/update), not on every SW wake-up. Calling
// chrome.alarms.create() at the top level of the module ran on every wake and
// threw "Cannot read properties of undefined" in some Chrome initialisation
// states before the runtime was fully ready. Move creation to onInstalled so
// it runs exactly once with a fully-initialised runtime.
//
// The onAlarm listener MUST stay at the top level (MV3 requirement: all event
// listeners must be registered synchronously on startup so Chrome can wake the
// SW when an alarm fires even if it has gone idle).

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'entity-list-refresh') {
    refreshEntityList().catch(() => {/* silently ignore */});
  }
});

chrome.runtime.onInstalled.addListener(() => {
  // (Re-)create the alarm on install or extension update. chrome.alarms.create
  // is idempotent by name — it replaces any existing alarm with the same name.
  chrome.alarms.create('entity-list-refresh', { periodInMinutes: 1440 });
});

// ── Initialise ─────────────────────────────────────────────────────────────────

init().catch(console.error);
