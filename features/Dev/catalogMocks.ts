/**
 * Mock data for the dev visual catalog.
 * Uses realistic entity names and donation figures for production-accurate previews.
 * DEV ONLY — never imported outside features/Dev/.
 */
import type { ScanResult } from '../Map/types';
import type { DonationSummary, Entity } from '../../core/models';
import type { SurveyItem, Platform } from '../Survey/types';
import type { ReportCardData } from '../ReportCard/types';
import type { FaqEntry, LinkEntry, TransparencyPoint, AboutContent } from '../Info/types';

// ── Donation summaries ──────────────────────────────────────────────────────

const walmartDonations: DonationSummary = {
  totalRepubs: 3_650_000,
  totalDems: 3_100_000,
  recentRepubs: 980_000,
  recentDems: 720_000,
  recentCycle: 2024,
  activeCycles: [2016, 2018, 2020, 2022, 2024],
  fecCommitteeUrl: 'https://www.fec.gov/data/committee/C00093054/',
  rawLineItems: [],
};

const metaDonations: DonationSummary = {
  totalRepubs: 1_200_000,
  totalDems: 1_800_000,
  recentRepubs: 340_000,
  recentDems: 510_000,
  recentCycle: 2024,
  activeCycles: [2020, 2022, 2024],
  fecCommitteeUrl: 'https://www.fec.gov/data/committee/C00502906/',
  rawLineItems: [],
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
  confidence: 0.95,
  donationSummary: walmartDonations,
  fecCommitteeId: 'C00093054',
  fecFilingUrl: 'https://www.fec.gov/data/committee/C00093054/',
  entity: walmartEntity,
};

export const medConfResult: ScanResult = {
  entityId: 'walgreens-fuzzy',
  canonicalName: 'Walgreens Boots Alliance',
  confidence: 0.72,
  donationSummary: metaDonations,
  fecCommitteeId: 'C00502906',
  fecFilingUrl: 'https://www.fec.gov/data/committee/C00502906/',
  entity: null,
};

export const noDonationResult: ScanResult = {
  entityId: 'amazon',
  canonicalName: 'Amazon.com Inc',
  confidence: 0.95,
  donationSummary: null,
  fecCommitteeId: 'C00360354',
  fecFilingUrl: 'https://www.fec.gov/data/committee/C00360354/',
  entity: amazonEntity,
};

export const chooser3Results: ScanResult[] = [highConfResult, medConfResult, noDonationResult];
export const chooser2Results: ScanResult[] = [highConfResult, medConfResult];

// ── Platforms / Survey items ────────────────────────────────────────────────

const twitterPlatform: Platform = { id: 'twitter', name: 'Twitter / X', parentCompany: 'X Corp', ceoName: 'Linda Yaccarino', categoryTags: ['social'] };
const instagramPlatform: Platform = { id: 'instagram', name: 'Instagram', parentCompany: 'Meta Platforms', ceoName: 'Mark Zuckerberg', categoryTags: ['social'] };
const amazonPlatform: Platform = { id: 'amazon', name: 'Amazon', parentCompany: 'Amazon.com Inc', ceoName: 'Andy Jassy', categoryTags: ['shopping', 'streaming'] };
const uberPlatform: Platform = { id: 'uber', name: 'Uber', parentCompany: 'Uber Technologies', ceoName: 'Dara Khosrowshahi', categoryTags: ['rideshare'] };
const walmartPlatform: Platform = { id: 'walmart', name: 'Walmart.com', parentCompany: 'Walmart Inc', ceoName: 'Doug McMillon', categoryTags: ['shopping'] };
const foxPlatform: Platform = { id: 'fox-news', name: 'Fox News', parentCompany: 'Fox Corp', ceoName: 'Lachlan Murdoch', categoryTags: ['news'] };

export const partialSurveyItems: SurveyItem[] = [
  { platform: twitterPlatform, avoided: true },
  { platform: instagramPlatform, avoided: true },
  { platform: amazonPlatform, avoided: true },
  { platform: uberPlatform, avoided: false },
  { platform: walmartPlatform, avoided: false },
  { platform: foxPlatform, avoided: false },
];

export const fullSurveyItems: SurveyItem[] = partialSurveyItems.map((i) => ({ ...i, avoided: true }));
export const emptySurveyItems: SurveyItem[] = partialSurveyItems.map((i) => ({ ...i, avoided: false }));

export const avoidedPlatformRow: SurveyItem = { platform: twitterPlatform, avoided: true };
export const notAvoidedPlatformRow: SurveyItem = { platform: instagramPlatform, avoided: false };

// ── Report card data ────────────────────────────────────────────────────────

export const reportWithData: ReportCardData = {
  weekOf: '2026-03-09',
  entityAvoids: [
    { entityId: 'walmart', name: 'Walmart Inc', count: 3, ceoName: 'Doug McMillon' },
    { entityId: 'amazon', name: 'Amazon.com Inc', count: 2, ceoName: 'Andy Jassy' },
    { entityId: 'home-depot', name: 'Home Depot Inc', count: 1, ceoName: 'Ted Decker' },
  ],
  platformAvoids: ['Twitter / X', 'Instagram'],
  totalEntityAvoids: 6,
  totalPlatformAvoids: 2,
  isPreview: false,
};

export const reportEmpty: ReportCardData = {
  weekOf: '2026-03-09',
  entityAvoids: [],
  platformAvoids: [],
  totalEntityAvoids: 0,
  totalPlatformAvoids: 0,
  isPreview: false,
};

export const reportPreview: ReportCardData = { ...reportWithData, isPreview: true };

// ── Info content ────────────────────────────────────────────────────────────

export const mockAbout: AboutContent = {
  tagline: 'Your money is a vote. Make it count.',
  description: 'F*ck Fascists helps you identify and avoid businesses that donate to Republican campaigns and authoritarian politics.',
  organization: 'F*ck Fascists Project · 501(c)(4) nonprofit',
  sourceCodeUrl: 'https://github.com/fuckfascists',
};

export const mockTransparency: TransparencyPoint[] = [
  { id: 't1', title: 'DATA SOURCE', body: 'All donation data comes from the Federal Election Commission.' },
  { id: 't2', title: 'MATCHING', body: 'Business names are matched using Jaro-Winkler similarity scoring.' },
];

export const mockFaqs: FaqEntry[] = [
  { id: 'f1', q: 'Where does the donation data come from?', a: 'All data is sourced from the FEC API — the same data available on fec.gov.' },
  { id: 'f2', q: 'Is my location tracked?', a: 'No. GPS coordinates are session-only and never stored.' },
];

export const mockLinks: LinkEntry[] = [
  { id: 'l1', label: 'Source Code (GitHub)', url: 'https://github.com/fuckfascists', category: 'source' },
  { id: 'l2', label: 'FEC.gov', url: 'https://www.fec.gov', category: 'source' },
  { id: 'l3', label: 'Privacy Policy', url: 'https://fuckfascists.org/privacy', category: 'legal' },
];
