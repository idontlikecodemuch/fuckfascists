import { buildSurveyItems, formatWeekOf } from '../utils/surveyHelpers';
import type { Platform } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const twitter: Platform = {
  id: 'twitter',
  name: 'Twitter / X',
  parentCompany: 'X Corp',
  ceoName: 'Linda Yaccarino',
  categoryTags: ['social'],
};

const amazon: Platform = {
  id: 'amazon',
  name: 'Amazon',
  parentCompany: 'Amazon.com Inc',
  ceoName: 'Andy Jassy',
  categoryTags: ['shopping'],
};

const platforms = [twitter, amazon];

// ─── buildSurveyItems ─────────────────────────────────────────────────────────

describe('buildSurveyItems', () => {
  it('marks platforms in the avoided set as avoided=true', () => {
    const items = buildSurveyItems(platforms, new Set(['twitter']));
    expect(items.find((i) => i.platform.id === 'twitter')?.avoided).toBe(true);
    expect(items.find((i) => i.platform.id === 'amazon')?.avoided).toBe(false);
  });

  it('marks all platforms as avoided=false when the set is empty', () => {
    const items = buildSurveyItems(platforms, new Set());
    expect(items.every((i) => !i.avoided)).toBe(true);
  });

  it('marks all platforms as avoided=true when all ids are in the set', () => {
    const items = buildSurveyItems(platforms, new Set(['twitter', 'amazon']));
    expect(items.every((i) => i.avoided)).toBe(true);
  });

  it('preserves platform order', () => {
    const items = buildSurveyItems(platforms, new Set());
    expect(items[0].platform.id).toBe('twitter');
    expect(items[1].platform.id).toBe('amazon');
  });

  it('carries the platform reference through unchanged', () => {
    const items = buildSurveyItems([twitter], new Set());
    expect(items[0].platform).toBe(twitter);
  });

  it('returns an empty array for an empty platform list', () => {
    expect(buildSurveyItems([], new Set(['twitter']))).toEqual([]);
  });

  it('ignores ids in the avoided set that do not match any platform', () => {
    const items = buildSurveyItems(platforms, new Set(['nonexistent']));
    expect(items.every((i) => !i.avoided)).toBe(true);
  });
});

// ─── formatWeekOf ─────────────────────────────────────────────────────────────

describe('formatWeekOf', () => {
  it('formats a Monday date as "Week of Mon D"', () => {
    expect(formatWeekOf('2024-03-11')).toBe('Week of Mar 11');
  });

  it('formats January 1 correctly', () => {
    expect(formatWeekOf('2024-01-01')).toBe('Week of Jan 1');
  });

  it('formats December correctly', () => {
    expect(formatWeekOf('2024-12-02')).toBe('Week of Dec 2');
  });

  it('does not add a leading zero to single-digit days', () => {
    const result = formatWeekOf('2024-03-04');
    expect(result).toBe('Week of Mar 4');
    expect(result).not.toContain('04');
  });

  it('always starts with "Week of"', () => {
    expect(formatWeekOf('2024-06-17')).toMatch(/^Week of /);
  });
});
