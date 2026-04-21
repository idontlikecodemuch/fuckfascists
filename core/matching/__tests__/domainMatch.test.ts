import { findByDomain, isThirdPartyProfileHost, normalizeHost } from '../domainMatch';
import type { Entity } from '../../models';

const apple: Entity = {
  id: 'apple',
  canonicalName: 'Apple Inc',
  aliases: ['Apple', 'Apple Store'],
  domains: ['apple.com'],
  categoryTags: ['tech'],
  ceoName: 'Tim Cook',
  fecCommitteeId: 'C00000001',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const walmart: Entity = {
  id: 'walmart',
  canonicalName: 'Walmart Inc',
  aliases: ['Walmart'],
  domains: ['walmart.com'],
  categoryTags: ['retail'],
  ceoName: 'Doug McMillon',
  fecCommitteeId: 'D000000074',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const multiDomain: Entity = {
  id: 'alphabet',
  canonicalName: 'Alphabet Inc',
  aliases: ['Google'],
  domains: ['google.com', 'youtube.com'],
  categoryTags: ['tech'],
  ceoName: 'Sundar Pichai',
  fecCommitteeId: 'C00000099',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const entities = [apple, walmart, multiDomain];

describe('normalizeHost', () => {
  it('lowercases and strips www.', () => {
    expect(normalizeHost('www.Apple.com')).toBe('apple.com');
    expect(normalizeHost('WWW.WALMART.COM')).toBe('walmart.com');
  });

  it('lowercases without www.', () => {
    expect(normalizeHost('Apple.com')).toBe('apple.com');
  });

  it('trims whitespace', () => {
    expect(normalizeHost('  apple.com  ')).toBe('apple.com');
  });

  it('handles empty input', () => {
    expect(normalizeHost('')).toBe('');
  });
});

describe('isThirdPartyProfileHost', () => {
  it('detects social/profile hosts that are not reliable POI first-party domains', () => {
    expect(isThirdPartyProfileHost('facebook.com')).toBe(true);
    expect(isThirdPartyProfileHost('www.instagram.com')).toBe(true);
    expect(isThirdPartyProfileHost('m.youtube.com')).toBe(true);
    expect(isThirdPartyProfileHost('walmart.com')).toBe(false);
  });

  // TestFlight regression #117 — Google Business Profile URLs (google.com /
  // maps.google.com / g.page / g.co / goo.gl) were driving unrelated POIs
  // like "Discount Locksmith" into the Alphabet entity via domain match.
  it('treats Google Business Profile + Maps hosts as third-party', () => {
    expect(isThirdPartyProfileHost('google.com')).toBe(true);
    expect(isThirdPartyProfileHost('www.google.com')).toBe(true);
    expect(isThirdPartyProfileHost('maps.google.com')).toBe(true);
    expect(isThirdPartyProfileHost('business.google.com')).toBe(true);
    expect(isThirdPartyProfileHost('g.page')).toBe(true);
    expect(isThirdPartyProfileHost('g.co')).toBe(true);
    expect(isThirdPartyProfileHost('goo.gl')).toBe(true);
  });

  it('treats review-aggregator profile hosts as third-party', () => {
    expect(isThirdPartyProfileHost('yelp.com')).toBe(true);
    expect(isThirdPartyProfileHost('foursquare.com')).toBe(true);
    expect(isThirdPartyProfileHost('tripadvisor.com')).toBe(true);
    expect(isThirdPartyProfileHost('nextdoor.com')).toBe(true);
  });
});

describe('findByDomain', () => {
  it('matches exact domain', () => {
    expect(findByDomain('apple.com', entities)).toBe(apple);
    expect(findByDomain('walmart.com', entities)).toBe(walmart);
  });

  it('matches with www. prefix', () => {
    expect(findByDomain('www.apple.com', entities)).toBe(apple);
  });

  it('is case-insensitive', () => {
    expect(findByDomain('APPLE.COM', entities)).toBe(apple);
    expect(findByDomain('Www.Walmart.Com', entities)).toBe(walmart);
  });

  it('matches subdomains', () => {
    expect(findByDomain('careers.walmart.com', entities)).toBe(walmart);
    expect(findByDomain('store.apple.com', entities)).toBe(apple);
  });

  it('matches across multiple entity domains', () => {
    expect(findByDomain('google.com', entities)).toBe(multiDomain);
    expect(findByDomain('youtube.com', entities)).toBe(multiDomain);
    expect(findByDomain('www.youtube.com', entities)).toBe(multiDomain);
  });

  it('returns null for unrecognized domains', () => {
    expect(findByDomain('costco.com', entities)).toBeNull();
    expect(findByDomain('randomsite.org', entities)).toBeNull();
  });

  it('returns null for empty or blank input', () => {
    expect(findByDomain('', entities)).toBeNull();
    expect(findByDomain('  ', entities)).toBeNull();
  });

  it('does not match partial domain names', () => {
    // "mapple.com" should NOT match "apple.com"
    expect(findByDomain('mapple.com', entities)).toBeNull();
  });
});
