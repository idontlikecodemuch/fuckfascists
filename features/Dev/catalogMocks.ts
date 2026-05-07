/**
 * Mock data for the dev visual catalog.
 * Uses realistic entity names and donation figures for production-accurate previews.
 * DEV ONLY — never imported outside features/Dev/.
 */
import type { ScanResult } from '../Map/types';
import type { DonationSummary, Entity } from '../../core/models';
import type { PlatformItem, Platform } from '../Platforms/types';
import type { ScorecardViewData } from '../Scorecard/types';
import type { ReferenceEntry, LinkEntry, AboutContent } from '../Info/types';

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

const walmartEntity: Entity = {
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

const amazonEntity: Entity = {
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

// ── ScanResults ─────────────────────────────────────────────────────────────

export const highConfResult: ScanResult = {
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

export const medConfResult: ScanResult = {
  entityId: 'walgreens-fuzzy',
  canonicalName: 'Walgreens Boots Alliance',
  matchedAlias: 'Walgreens',
  committeeName: 'META PLATFORMS INC PAC',
  confidence: 0.72,
  donationSummary: metaDonations,
  fecCommitteeId: 'C00502906',
  fecFilingUrl: 'https://www.fec.gov/data/committee/C00502906/',
  entity: null,
};

export const noDonationResult: ScanResult = {
  entityId: 'amazon',
  canonicalName: 'Amazon.com Inc',
  matchedAlias: 'Amazon',
  committeeName: null,
  confidence: 0.95,
  donationSummary: null,
  fecCommitteeId: 'C00360354',
  fecFilingUrl: 'https://www.fec.gov/data/committee/C00360354/',
  entity: amazonEntity,
};

export const chooser3Results: ScanResult[] = [highConfResult, medConfResult, noDonationResult];
export const chooser2Results: ScanResult[] = [highConfResult, medConfResult];

// ── Platform items ──────────────────────────────────────────────────────────

const twitterPlatform: Platform = {
  id: 'twitter',
  name: 'X / Twitter',
  entityId: 'x-twitter',
  parentCompany: 'X Corp',
  ceoName: 'Linda Yaccarino',
  categoryTags: ['social'],
  sortOrder: 1,
  defaultSelected: true,
};
const instagramPlatform: Platform = {
  id: 'instagram',
  name: 'Instagram',
  entityId: 'meta',
  parentCompany: 'Meta Platforms',
  ceoName: 'Mark Zuckerberg',
  categoryTags: ['social'],
  sortOrder: 2,
  defaultSelected: true,
};
const amazonPlatform: Platform = {
  id: 'amazon',
  name: 'Amazon',
  entityId: 'amazon',
  parentCompany: 'Amazon.com Inc',
  ceoName: 'Andy Jassy',
  categoryTags: ['shopping', 'streaming'],
  sortOrder: 3,
  defaultSelected: true,
};
const facebookPlatform: Platform = {
  id: 'facebook',
  name: 'Facebook',
  entityId: 'meta',
  parentCompany: 'Meta Platforms',
  ceoName: 'Mark Zuckerberg',
  categoryTags: ['social'],
  sortOrder: 4,
  defaultSelected: true,
};
const youtubePlatform: Platform = {
  id: 'youtube',
  name: 'YouTube',
  entityId: 'google-alphabet',
  parentCompany: 'Alphabet Inc',
  ceoName: 'Sundar Pichai',
  categoryTags: ['streaming', 'social'],
  sortOrder: 5,
  defaultSelected: true,
};
const whatsappPlatform: Platform = {
  id: 'whatsapp',
  name: 'WhatsApp',
  entityId: 'meta',
  parentCompany: 'Meta Platforms',
  ceoName: 'Mark Zuckerberg',
  categoryTags: ['messaging'],
  sortOrder: 6,
  defaultSelected: true,
};

export const partialPlatformItems: PlatformItem[] = [
  { platform: twitterPlatform, weeklyCount: 5, dayCounts: new Map([['2026-03-09', 2], ['2026-03-10', 1], ['2026-03-11', 2]]) },
  { platform: instagramPlatform, weeklyCount: 3, dayCounts: new Map([['2026-03-09', 1], ['2026-03-11', 2]]) },
  { platform: amazonPlatform, weeklyCount: 1, dayCounts: new Map([['2026-03-10', 1]]) },
  { platform: facebookPlatform, weeklyCount: 0, dayCounts: new Map() },
  { platform: youtubePlatform, weeklyCount: 0, dayCounts: new Map() },
  { platform: whatsappPlatform, weeklyCount: 0, dayCounts: new Map() },
];

export const fullPlatformItems: PlatformItem[] = partialPlatformItems.map((i) => ({
  ...i,
  weeklyCount: Math.max(i.weeklyCount, 1),
  dayCounts: i.weeklyCount > 0 ? i.dayCounts : new Map([['2026-03-09', 1]]),
}));
export const emptyPlatformItems: PlatformItem[] = partialPlatformItems.map((i) => ({ ...i, weeklyCount: 0, dayCounts: new Map() }));

export const avoidedPlatformRow: PlatformItem = { platform: twitterPlatform, weeklyCount: 5, dayCounts: new Map([['2026-03-09', 2], ['2026-03-10', 1], ['2026-03-11', 2]]) };
export const notAvoidedPlatformRow: PlatformItem = { platform: instagramPlatform, weeklyCount: 0, dayCounts: new Map() };

// ── Scorecard data ─────────────────────────────────────────────────────────

export const scorecardWithData: ScorecardViewData = {
  weekOf: '2026-03-09',
  persons: [
    {
      figureName: 'The Walton Family',
      totalCount: 5,
      sources: [
        { name: 'Walmart', count: 3, verb: 'walked past' },
        { name: "Sam's Club", count: 2, verb: 'walked past' },
      ],
      surfaces: new Set([1]),
      children: [
        { name: 'Walmart', count: 3, surfaces: new Set([1]) },
        { name: "Sam's Club", count: 2, surfaces: new Set([1]) },
      ],
    },
    {
      figureName: 'Mark Zuckerberg',
      totalCount: 8,
      sources: [
        { name: 'Instagram', count: 4, verb: 'stayed off' },
        { name: 'Facebook', count: 2, verb: 'stayed off' },
        { name: 'WhatsApp', count: 2, verb: 'stayed off' },
      ],
      surfaces: new Set([3]),
      children: [
        { name: 'Instagram', count: 4, surfaces: new Set([3]) },
        { name: 'Facebook', count: 2, surfaces: new Set([3]) },
        { name: 'WhatsApp', count: 2, surfaces: new Set([3]) },
      ],
    },
    {
      figureName: 'Andy Jassy',
      totalCount: 3,
      sources: [
        { name: 'Amazon', count: 2, verb: 'skipped' },
        { name: 'Whole Foods', count: 1, verb: 'walked past' },
      ],
      surfaces: new Set([1, 3]),
      children: [
        { name: 'Amazon', count: 2, surfaces: new Set([3]) },
        { name: 'Whole Foods', count: 1, surfaces: new Set([1]) },
      ],
    },
    {
      figureName: 'Ted Decker',
      totalCount: 1,
      sources: [{ name: 'Home Depot', count: 1, verb: 'walked past' }],
      surfaces: new Set([1]),
      children: [{ name: 'Home Depot', count: 1, surfaces: new Set([1]) }],
    },
  ],
  grandTotal: 17,
  powerTier: { fill: 0.80, label: 'charged', index: 2 },
};

export const scorecardEmpty: ScorecardViewData = {
  weekOf: '2026-03-09',
  persons: [],
  grandTotal: 0,
  powerTier: null,
};

export const scorecardPreview: ScorecardViewData = { ...scorecardWithData };

// ── Info content ────────────────────────────────────────────────────────────

export const mockAbout: AboutContent = {
  tagline: 'Your money is a vote. Make it count.',
  description: 'FCK Fascists helps you identify and avoid businesses that contribute to Republican campaigns and authoritarian politics.',
  organization: 'An open-source project. One person trying to make a difference.',
  ethosTitle: 'WHAT WE BELIEVE',
  ethos: 'Every dollar is a vote. We believe in transparency, accountability, and the power of informed consumer choices.',
  sourceCodeUrl: 'https://github.com/fuckfascists',
};

export const mockReference: ReferenceEntry[] = [
  { id: 't1', q: 'DATA SOURCE', a: 'All donation data comes from the Federal Election Commission.', category: 'data' },
  { id: 't2', q: 'MATCHING', a: 'Business names are matched using Jaro-Winkler similarity scoring.', category: 'data' },
  { id: 'f1', q: 'Where does the donation data come from?', a: 'All data is sourced from the FEC API — the same data available on fec.gov.', category: 'data' },
  { id: 'f2', q: 'Is my location tracked?', a: 'No. GPS coordinates are session-only and never stored.', category: 'privacy' },
];

export const mockLinks: LinkEntry[] = [
  { id: 'l1', label: 'Source Code (GitHub)', url: 'https://github.com/fuckfascists', category: 'source' },
  { id: 'l2', label: 'FEC.gov', url: 'https://www.fec.gov', category: 'source' },
  { id: 'l3', label: 'Privacy Policy', url: 'https://fuckfascists.org/privacy', category: 'legal' },
];
