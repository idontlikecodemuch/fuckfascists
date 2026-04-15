/**
 * Fixture data for the screenshot harness.
 * Provides deterministic mock data for every screen state so captures are
 * repeatable without real GPS, API calls, or database state.
 * DEV ONLY — never imported outside features/Dev/.
 */
import type { ScanResult, ScanContext } from '../Map/types';
import type { DonationSummary, Entity } from '../../core/models';
import type { PlatformItem, Platform } from '../Platforms/types';
import type { ScorecardViewData } from '../Scorecard/types';
import type { ScorecardPerson } from '../Scorecard/data/aggregateScorecard';
import type { TrackContextValue } from '../Platforms/context/TrackContext';
import type { AboutContent, ReferenceEntry, LinkEntry } from '../Info/types';
import type { BarcodeNotice } from '../Map/hooks/useBarcodeSearch';

// ── Donation summaries ──────────────────────────────────────────────────────

const walmartDonations: DonationSummary = {
  committeeId: 'C00093054',
  committeeName: 'WALMART INC PAC FOR RESPONSIBLE GOVERNMENT',
  totalRepubs: 3_650_000,
  totalDems: 3_100_000,
  recentRepubs: 980_000,
  recentDems: 720_000,
  recentCycle: 2024,
  activeCycles: [2016, 2018, 2020, 2022, 2024],
  raw: [],
  lastUpdated: '2025-03-10',
  fecCommitteeUrl: 'https://www.fec.gov/data/committee/C00093054/',
};

const metaDonations: DonationSummary = {
  committeeId: 'C00502906',
  committeeName: 'META PLATFORMS INC PAC',
  totalRepubs: 1_200_000,
  totalDems: 1_800_000,
  recentRepubs: 340_000,
  recentDems: 510_000,
  recentCycle: 2024,
  activeCycles: [2020, 2022, 2024],
  raw: [],
  lastUpdated: '2025-03-10',
  fecCommitteeUrl: 'https://www.fec.gov/data/committee/C00502906/',
};

// ── Entities ────────────────────────────────────────────────────────────────

export const walmartEntity: Entity = {
  id: 'walmart',
  canonicalName: 'Walmart Inc',
  aliases: ['Walmart', 'Wal-Mart'],
  domains: ['walmart.com'],
  categoryTags: ['retail', 'grocery'],
  ceoName: 'Doug McMillon',
  publicFigureName: 'The Walton Family',
  fecCommitteeId: 'C00093054',
  verificationStatus: 'manual',
  donationSummary: walmartDonations,
  lastVerifiedDate: '2025-03-10',
};

export const amazonEntity: Entity = {
  id: 'amazon',
  canonicalName: 'Amazon.com Inc',
  aliases: ['Amazon'],
  domains: ['amazon.com'],
  categoryTags: ['retail', 'tech'],
  ceoName: 'Andy Jassy',
  publicFigureName: 'Jeff Bezos',
  fecCommitteeId: 'C00360354',
  verificationStatus: 'manual',
  donationSummary: metaDonations,
  lastVerifiedDate: '2025-03-10',
};

export const metaEntity: Entity = {
  id: 'meta',
  canonicalName: 'Meta Platforms Inc',
  aliases: ['Meta', 'Facebook'],
  domains: ['meta.com', 'facebook.com'],
  categoryTags: ['tech', 'social'],
  ceoName: 'Mark Zuckerberg',
  fecCommitteeId: 'C00502906',
  verificationStatus: 'manual',
  donationSummary: metaDonations,
  lastVerifiedDate: '2025-03-10',
};

export const harnessEntities: Entity[] = [walmartEntity, amazonEntity, metaEntity];

// ── ScanResults ─────────────────────────────────────────────────────────────

export const harnessHighConfResult: ScanResult = {
  entityId: 'walmart',
  canonicalName: 'Walmart Inc',
  matchedAlias: 'Walmart',
  committeeName: 'WALMART INC PAC FOR RESPONSIBLE GOVERNMENT',
  confidence: 0.95,
  donationSummary: walmartDonations,
  fecCommitteeId: 'C00093054',
  fecFilingUrl: 'https://www.fec.gov/data/committee/C00093054/',
  entity: walmartEntity,
};

export const harnessMedConfResult: ScanResult = {
  entityId: 'meta',
  canonicalName: 'Meta Platforms Inc',
  matchedAlias: 'Facebook',
  committeeName: 'META PLATFORMS INC PAC',
  confidence: 0.72,
  donationSummary: metaDonations,
  fecCommitteeId: 'C00502906',
  fecFilingUrl: 'https://www.fec.gov/data/committee/C00502906/',
  entity: metaEntity,
};

export const harnessChooserResults: ScanResult[] = [
  harnessHighConfResult,
  harnessMedConfResult,
  {
    entityId: 'amazon',
    canonicalName: 'Amazon.com Inc',
    matchedAlias: 'Amazon',
    committeeName: null,
    confidence: 0.88,
    donationSummary: null,
    fecCommitteeId: 'C00360354',
    fecFilingUrl: 'https://www.fec.gov/data/committee/C00360354/',
    entity: amazonEntity,
  },
];

const barcodeContext: ScanContext = {
  kind: 'barcode',
  barcode: '0078742370002',
  productName: 'Great Value Spring Water',
  brandName: 'Great Value',
  source: 'open_food_facts',
};

export const harnessBarcodeScanResult: ScanResult = {
  ...harnessHighConfResult,
  context: barcodeContext,
};

export const harnessNoMatchNotice: BarcodeNotice = {
  kind: 'no_match',
  label: 'Kirkland Signature',
};

// ── Platforms ───────────────────────────────────────────────────────────────

const twitterPlatform: Platform = {
  id: 'twitter', name: 'X / Twitter', entityId: 'x-twitter',
  parentCompany: 'X Corp', ceoName: 'Linda Yaccarino', publicFigureName: 'Elon Musk',
  categoryTags: ['social'], sortOrder: 500, defaultSelected: true,
};
const instagramPlatform: Platform = {
  id: 'instagram', name: 'Instagram', entityId: 'meta',
  parentCompany: 'Meta Platforms Inc', ceoName: 'Mark Zuckerberg',
  categoryTags: ['social'], sortOrder: 102, defaultSelected: true,
};
const facebookPlatform: Platform = {
  id: 'facebook', name: 'Facebook', entityId: 'meta',
  parentCompany: 'Meta Platforms Inc', ceoName: 'Mark Zuckerberg',
  categoryTags: ['social'], sortOrder: 101, defaultSelected: true,
};
const amazonPlatform: Platform = {
  id: 'amazon', name: 'Amazon', entityId: 'amazon',
  parentCompany: 'Amazon.com Inc', ceoName: 'Andy Jassy', publicFigureName: 'Jeff Bezos',
  categoryTags: ['retail', 'tech'], sortOrder: 301, defaultSelected: true,
};
const youtubePlatform: Platform = {
  id: 'youtube', name: 'YouTube', entityId: 'google-alphabet',
  parentCompany: 'Alphabet Inc', ceoName: 'Sundar Pichai',
  categoryTags: ['streaming', 'social'], sortOrder: 201, defaultSelected: true,
};

export const harnessPlatforms: Platform[] = [
  twitterPlatform, instagramPlatform, facebookPlatform, amazonPlatform, youtubePlatform,
];

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

export const harnessPlatformItems: PlatformItem[] = [
  { platform: twitterPlatform, weeklyCount: 5, dayCounts: new Map([[today, 2], [yesterday, 3]]) },
  { platform: instagramPlatform, weeklyCount: 3, dayCounts: new Map([[today, 1], [yesterday, 2]]) },
  { platform: facebookPlatform, weeklyCount: 2, dayCounts: new Map([[yesterday, 2]]) },
  { platform: amazonPlatform, weeklyCount: 1, dayCounts: new Map([[today, 1]]) },
  { platform: youtubePlatform, weeklyCount: 0, dayCounts: new Map() },
];

// ── Mock TrackContext builder ───────────────────────────────────────────────

const noop = () => {};
const noopAsync = async () => false;
const noopAsyncVoid = async () => {};

export function buildMockTrackContext(
  overrides: Partial<TrackContextValue> = {},
): TrackContextValue {
  return {
    selectedPlatformId: null,
    openPlatformId: null,
    arenaFocusKey: null,
    focusedFigureName: null,
    focusPlatform: noop,
    openPlatformDetails: noop,
    togglePlatformDetails: noop,
    focusGroup: noop,
    clearFocus: noop,
    weekAvoids: harnessPlatformItems,
    totalAvoids: 11,
    weekOf: today,
    todayActions: new Set<string>(),
    avoid: noopAsync,
    avoidForDate: noopAsync,
    loading: false,
    error: null,
    platforms: harnessPlatforms,
    personWeeklyAvoids: () => 0,
    isDefeated: () => false,
    arenaHitRequest: null,
    queueArenaHit: noop,
    clearAll: noopAsyncVoid,
    ...overrides,
  };
}

// ── Scorecard ───────────────────────────────────────────────────────────────

const scorecardPersons: ScorecardPerson[] = [
  { figureName: 'Elon Musk', totalCount: 5, sources: [{ name: 'X / Twitter', count: 5, verb: 'stayed off' }], surfaces: new Set([3]), children: [{ name: 'X / Twitter', count: 5, surfaces: new Set([3]) }] },
  { figureName: 'Mark Zuckerberg', totalCount: 5, sources: [{ name: 'Instagram', count: 3, verb: 'stayed off' }, { name: 'Facebook', count: 2, verb: 'stayed off' }], surfaces: new Set([3]), children: [{ name: 'Instagram', count: 3, surfaces: new Set([3]) }, { name: 'Facebook', count: 2, surfaces: new Set([3]) }] },
  { figureName: 'Jeff Bezos', totalCount: 1, sources: [{ name: 'Amazon', count: 1, verb: 'skipped' }], surfaces: new Set([1]), children: [{ name: 'Amazon', count: 1, surfaces: new Set([1]) }] },
];

export const harnessScorecardPopulated: ScorecardViewData = {
  weekOf: today, persons: scorecardPersons, grandTotal: 11, powerTier: { fill: 0.55, label: 'powered', index: 1 }, isPreview: false,
};

export const harnessScorecardEmpty: ScorecardViewData = { weekOf: today, persons: [], grandTotal: 0, powerTier: null, isPreview: false };

// ── Info ────────────────────────────────────────────────────────────────────

export const harnessAbout: AboutContent = { tagline: 'Your money is a vote. Make it count.', description: 'F*ck Fascists helps you identify and avoid businesses that donate to Republican campaigns.', organization: 'F*ck Fascists Project \u00b7 501(c)(4) nonprofit', ethosTitle: 'WHAT WE BELIEVE', ethos: 'Every dollar is a vote.', sourceCodeUrl: 'https://github.com/fuckfascists' };
export const harnessReference: ReferenceEntry[] = [{ id: 't1', q: 'DATA SOURCE', a: 'All donation data comes from the Federal Election Commission.', category: 'data' }, { id: 't2', q: 'MATCHING', a: 'Business names are matched using Jaro-Winkler similarity scoring.', category: 'data' }, { id: 'f1', q: 'Where does the donation data come from?', a: 'All data is sourced from the FEC API.', category: 'data' }, { id: 'f2', q: 'Is my location tracked?', a: 'No. GPS coordinates are session-only and never stored.', category: 'privacy' }];
export const harnessLinks: LinkEntry[] = [{ id: 'l1', label: 'Source Code (GitHub)', url: 'https://github.com/fuckfascists', category: 'source' }, { id: 'l2', label: 'FEC.gov', url: 'https://www.fec.gov', category: 'source' }];
