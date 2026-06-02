import type { DonationSummary, PoliticalPerson } from '../../../../core/models';
import { deriveDonationSummary, getLatestCompletedMajorCycle } from '../dataZoneSummary';

const baseSummary: DonationSummary = {
  committeeId: 'C00000001',
  committeeName: 'ACME PAC',
  recentCycle: 2026,
  recentRepubs: 300,
  recentDems: 100,
  totalRepubs: 1_300,
  totalDems: 600,
  totalO: 0,
  recentO: 0,
  activeCycles: [2024, 2026],
  cycleTotals: [
    [2024, 1_000, 500, 0],
    [2026, 300, 100, 0],
  ],
  raw: [],
  lastUpdated: '2026-05-29',
  fecCommitteeUrl: 'https://www.fec.gov/data/committee/C00000001/',
};

const linkedPerson: PoliticalPerson = {
  id: 'jane-donor',
  canonicalName: 'DONOR, JANE',
  displayName: 'Jane Donor',
  aliases: [],
  associatedEntityIds: ['acme'],
  rolesByEntity: {},
  verificationStatus: 'manual',
  lastVerifiedDate: '2026-05-29',
  donationSummary: {
    totalR: 50,
    totalD: 250,
    totalO: 0,
    recentCycleR: 10,
    recentCycleD: 20,
    recentCycleO: 0,
    recentCycle: '2025-26',
    activeCycles: [2024, 2026],
    cycleTotals: [
      [2024, 40, 230, 0],
      [2026, 10, 20, 0],
    ],
    raw: [],
    lastUpdated: '2026-05-29',
  },
};

describe('deriveDonationSummary', () => {
  it('uses the latest completed major cycle when compact cycle totals are available', () => {
    const summary = deriveDonationSummary(baseSummary, [linkedPerson], new Date('2026-05-29T12:00:00Z'));

    expect(summary.recentCycleLabel).toBe('2023–24');
    expect(summary.recentR).toBe(1_040);
    expect(summary.recentD).toBe(730);
    expect(summary.totalR).toBe(1_350);
    expect(summary.totalD).toBe(850);
  });

  it('falls back to the active current cycle when no completed cycle exists', () => {
    const currentOnly: DonationSummary = {
      ...baseSummary,
      activeCycles: [2026],
      cycleTotals: [[2026, 300, 100, 0]],
    };

    const summary = deriveDonationSummary(currentOnly, [], new Date('2026-05-29T12:00:00Z'));

    expect(summary.recentCycleLabel).toBe('2025–26');
    expect(summary.recentR).toBe(300);
    expect(summary.recentD).toBe(100);
  });
});

describe('getLatestCompletedMajorCycle', () => {
  it('treats the current even-year cycle as incomplete until the following year', () => {
    expect(getLatestCompletedMajorCycle(new Date('2026-05-29T12:00:00Z'))).toBe(2024);
    expect(getLatestCompletedMajorCycle(new Date('2027-01-02T12:00:00Z'))).toBe(2026);
  });
});
