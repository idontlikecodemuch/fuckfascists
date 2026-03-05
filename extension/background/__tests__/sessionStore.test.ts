/**
 * Session store unit tests.
 *
 * Snooze tests mock chrome.storage.local — the same approach used for the
 * ChromeStorageAdapter tests.
 */

import {
  setTabFlag, getTabFlag, markTabAvoided, clearTabFlag,
  getLastFlagged, recordFlagged,
} from '../sessionStore';
import type { TabFlag } from '../../types';

// ─── chrome.storage.local mock ────────────────────────────────────────────────

const store: Record<string, unknown> = {};
const chromeMock = {
  storage: {
    local: {
      get: jest.fn(async (key: string) => ({ [key]: store[key] })),
      set: jest.fn(async (items: Record<string, unknown>) => { Object.assign(store, items); }),
      remove: jest.fn(async (key: string) => { delete store[key]; }),
    },
  },
};
(global as unknown as Record<string, unknown>).chrome = chromeMock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeFlag(overrides: Partial<TabFlag> = {}): TabFlag {
  return {
    hostname:        'amazon.com',
    entityId:        'amazon',
    canonicalName:   'Amazon',
    ceoName:         'Andy Jassy',
    recentCycle:     2024,
    recentRepubs:    1_200_000,
    recentDems:      0,
    totalRepubs:     4_200_000,
    totalDems:       800_000,
    activeCycles:    [2016, 2018, 2020, 2022, 2024],
    fecCommitteeUrl: 'https://www.fec.gov/data/committee/C00431171/',
    confidence:      'HIGH',
    avoided:         false,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('tab flag store', () => {
  it('getTabFlag returns null for unknown tab', () => {
    expect(getTabFlag(999)).toBeNull();
  });

  it('setTabFlag and getTabFlag roundtrip', () => {
    const flag = makeFlag();
    setTabFlag(1, flag);
    expect(getTabFlag(1)).toEqual(flag);
  });

  it('markTabAvoided sets avoided=true and returns true', () => {
    setTabFlag(2, makeFlag());
    const ok = markTabAvoided(2);
    expect(ok).toBe(true);
    expect(getTabFlag(2)?.avoided).toBe(true);
  });

  it('markTabAvoided returns false for unknown tab', () => {
    expect(markTabAvoided(999)).toBe(false);
  });

  it('clearTabFlag removes the entry', () => {
    setTabFlag(3, makeFlag());
    clearTabFlag(3);
    expect(getTabFlag(3)).toBeNull();
  });

  it('clearTabFlag on unknown tab is a no-op', () => {
    expect(() => clearTabFlag(999)).not.toThrow();
  });
});

describe('domain flag-frequency store', () => {
  it('getLastFlagged returns null for unseen domain', () => {
    expect(getLastFlagged('unseen.com')).toBeNull();
  });

  it('recordFlagged and getLastFlagged roundtrip', () => {
    const before = Date.now();
    recordFlagged('test.com');
    const after = Date.now();
    const ts = getLastFlagged('test.com');
    expect(ts).not.toBeNull();
    expect(ts!).toBeGreaterThanOrEqual(before);
    expect(ts!).toBeLessThanOrEqual(after);
  });

  it('recordFlagged updates timestamp on second call', async () => {
    recordFlagged('update.com');
    const first = getLastFlagged('update.com');
    await new Promise((r) => setTimeout(r, 5));
    recordFlagged('update.com');
    const second = getLastFlagged('update.com');
    expect(second!).toBeGreaterThan(first!);
  });
});
