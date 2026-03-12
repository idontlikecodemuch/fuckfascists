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

import type { Entity, DonationSummary } from '../../core/models';
import { fecFilingUrl, getDisplayFigure } from '../../core/models';
import type { ExtensionMsg, TabFlag, WeeklyStats } from '../types';
import { ChromeStorageAdapter } from '../storage/ChromeStorageAdapter';
import { findByDomain } from './domainMatch';
import {
  setTabFlag, getTabFlag, markTabAvoided, clearTabFlag,
  getLastFlagged, recordFlagged, setSnoozed, isSnoozed,
} from './sessionStore';
import { makeCacheDeps } from '../../core/data/cacheStore';
import { FECClient } from '../../core/api';
import { getMondayOf, recordEntityAvoid } from '../../core/data/eventStore';
import {
  ENTITY_LIST_UPDATE_URL,
  EXTENSION_FLAG_FREQUENCY,
  ENTITY_CACHE_TTL_DAYS,
} from '../../config/constants';

function entityConfidence(matchScore: number | undefined): number {
  return matchScore ?? 1.0; // no override → full confidence for curated alias match
}

// ─── Globals (re-initialised after SW wake) ────────────────────────────────────

const adapter = new ChromeStorageAdapter();
const cacheDeps = makeCacheDeps(adapter);
// Always run in anonymous mode — no API key required or used.
// The FEC API allows anonymous requests at per-IP rate limits, which are
// sufficient for individual extension users. Bundled donationSummary data
// is the primary path; live calls are the fallback for missing/stale entries.
const apiClient = new FECClient({ apiKey: '' });
let entities: Entity[] = [];

async function init() {
  // Load entity list: prefer a CDN-refreshed copy in storage, fall back to the
  // bundled file. The bundled file is the source of truth until a real CDN URL
  // is configured (ENTITY_LIST_UPDATE_URL currently contains a placeholder).
  const listResult = await chrome.storage.local.get('entity_list');
  const stored = listResult['entity_list'] as Entity[] | undefined;
  if (stored?.length) {
    entities = stored;
  } else {
    await loadBundledEntityList();
  }
}

/** Loads the entity list bundled at build time (assets/data/entities.json). */
async function loadBundledEntityList(): Promise<void> {
  try {
    const url = chrome.runtime.getURL('assets/data/entities.json');
    const res = await fetch(url);
    if (!res.ok) return;
    const raw: unknown = await res.json();
    const arr =
      typeof raw === 'object' &&
      raw !== null &&
      !Array.isArray(raw) &&
      Array.isArray((raw as Record<string, unknown>)['entities'])
        ? ((raw as Record<string, unknown>)['entities'] as Entity[])
        : (raw as Entity[]);
    if (Array.isArray(arr) && arr.length > 0) {
      entities = arr;
    }
  } catch {
    // Bundled file missing — extension will not flag until CDN refresh succeeds
  }
}

async function refreshEntityList(): Promise<void> {
  try {
    const res = await fetch(ENTITY_LIST_UPDATE_URL);
    if (!res.ok) return;
    const raw: unknown = await res.json();
    // Accept both { _meta, entities: [...] } wrapper and legacy flat array.
    const arr =
      typeof raw === 'object' &&
      raw !== null &&
      !Array.isArray(raw) &&
      Array.isArray((raw as Record<string, unknown>)['entities'])
        ? ((raw as Record<string, unknown>)['entities'] as Entity[])
        : (raw as Entity[]);
    if (Array.isArray(arr) && arr.length > 0) {
      entities = arr;
      await chrome.storage.local.set({ entity_list: arr });
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

// ── Bundled data freshness ─────────────────────────────────────────────────────

/**
 * Returns true if the entity's bundled donationSummary was verified within
 * the configured cache TTL. An absent or empty lastVerifiedDate is treated
 * as stale.
 */
function isBundledDataFresh(entity: Entity): boolean {
  if (!entity.lastVerifiedDate) return false;
  const verifiedMs = new Date(entity.lastVerifiedDate + 'T00:00:00Z').getTime();
  return Date.now() - verifiedMs < ENTITY_CACHE_TTL_DAYS * 86_400_000;
}

// ── Domain check ───────────────────────────────────────────────────────────────

async function handleCheckDomain(hostname: string, tabId: number): Promise<void> {
  const entity = findByDomain(hostname, entities);
  if (!entity) return;

  if (await isSnoozed(hostname)) return;
  if (!shouldFlag(hostname)) return;

  const cacheKey = `ext:${entity.id}`;
  const CACHE_TTL_MS = ENTITY_CACHE_TTL_DAYS * 86_400_000;

  let donationSummary: DonationSummary | null = null;

  const committeeId =
    entity.fecCommitteeId && entity.fecCommitteeId !== ''
      ? entity.fecCommitteeId
      : null;

  // Priority order for donation data:
  // 1. Local extension cache — populated by previous live API calls.
  // 2. Bundled donationSummary — the primary path; use when present and fresh.
  // 3. Anonymous live FEC API call — fallback when bundled data is absent or stale.
  // 4. Stale bundled data — last resort when the live call fails.
  // 5. No data — flag is still set; popup shows "No bundled donation data."

  const cached = await cacheDeps.getCache(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    // 1. Fresh local cache hit.
    donationSummary = cached.donationSummary;
  } else if (entity.donationSummary && isBundledDataFresh(entity)) {
    // 2. Bundled summary is present and within TTL — use directly, skip API call.
    donationSummary = entity.donationSummary;
  } else if (committeeId) {
    // 3. Bundled data absent or stale — attempt anonymous live call.
    try {
      donationSummary = await apiClient.fetchOrgSummary(committeeId);
      await cacheDeps.setCache({
        key: cacheKey,
        fecCommitteeId: committeeId,
        donationSummary,
        confidence: entityConfidence(undefined),
        fetchedAt: Date.now(),
      });
    } catch {
      // 4. Live call failed — use bundled data as stale fallback if available.
      donationSummary = entity.donationSummary ?? null;
    }
  } else {
    // 4. No committeeId to call — stale bundled data is the only option.
    donationSummary = entity.donationSummary ?? null;
  }

  // noBundledData: the entity was never processed through the data pipeline
  // (no bundled donationSummary) and we have no live data either.
  // Distinct from a transient API failure where we might retry later.
  const noBundledData = donationSummary === null && !entity.donationSummary;

  // Flag the tab regardless of whether donation data loaded. The amber icon
  // fires on any confirmed entity match; data is surfaced in the popup if
  // available.

  const flag: TabFlag = {
    hostname,
    entityId:              entity.id,
    canonicalName:         entity.canonicalName,
    displayFigure:         getDisplayFigure(entity),
    donationDataAvailable: donationSummary !== null,
    noBundledData,
    recentCycle:           donationSummary?.recentCycle ?? null,
    recentRepubs:          donationSummary?.recentRepubs ?? 0,
    recentDems:            donationSummary?.recentDems ?? 0,
    totalRepubs:           donationSummary?.totalRepubs ?? 0,
    totalDems:             donationSummary?.totalDems ?? 0,
    activeCycles:          donationSummary?.activeCycles ?? [],
    fecCommitteeUrl:       donationSummary?.fecCommitteeUrl ?? (committeeId ? fecFilingUrl(committeeId) : null),
    confidence:            entityConfidence(undefined),
    avoided:               false,
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
