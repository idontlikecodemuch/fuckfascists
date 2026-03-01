import type { TabFlag, SnoozeRecord } from '../types';

/**
 * In-memory session store — lives only in the service worker's lifetime.
 *
 * Nothing here is written to disk. When the service worker terminates, the
 * session store is gone. This is the correct behaviour per the spec:
 *   "No browsing history — the extension detects domains in-memory only,
 *    cleared on session end."
 *
 * Snooze records are stored in chrome.storage.local (persisted) — see below.
 */

// ── Per-tab flag map ───────────────────────────────────────────────────────────

const tabFlags = new Map<number, TabFlag>();

export function setTabFlag(tabId: number, flag: TabFlag): void {
  tabFlags.set(tabId, flag);
}

export function getTabFlag(tabId: number): TabFlag | null {
  return tabFlags.get(tabId) ?? null;
}

export function markTabAvoided(tabId: number): boolean {
  const flag = tabFlags.get(tabId);
  if (!flag) return false;
  tabFlags.set(tabId, { ...flag, avoided: true });
  return true;
}

export function clearTabFlag(tabId: number): void {
  tabFlags.delete(tabId);
}

// ── Domain → last-flagged epoch map (for frequency throttling) ─────────────────

const domainLastFlagged = new Map<string, number>();

export function getLastFlagged(hostname: string): number | null {
  return domainLastFlagged.get(hostname) ?? null;
}

export function recordFlagged(hostname: string): void {
  domainLastFlagged.set(hostname, Date.now());
}

// ── Snooze helpers (chrome.storage.local — persisted across SW restarts) ───────

const SNOOZE_PREFIX = 'snooze:';

export async function setSnoozed(hostname: string, durationMs: number): Promise<void> {
  const record: SnoozeRecord = { hostname, until: Date.now() + durationMs };
  await chrome.storage.local.set({ [`${SNOOZE_PREFIX}${hostname}`]: record });
}

export async function isSnoozed(hostname: string): Promise<boolean> {
  const key = `${SNOOZE_PREFIX}${hostname}`;
  const result = await chrome.storage.local.get(key);
  const record = result[key] as SnoozeRecord | undefined;
  if (!record) return false;
  if (Date.now() >= record.until) {
    // Expired — clean up
    await chrome.storage.local.remove(key);
    return false;
  }
  return true;
}
