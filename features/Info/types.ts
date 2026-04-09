/**
 * The full Info screen content payload.
 * Designed to be JSON-serializable so it can be fetched from the data repo
 * and updated without an app release.
 */
export interface InfoContent {
  /** Increment when breaking changes are made to the schema. */
  version: string;
  about: AboutContent;
  /** Unified reference accordion — merged from transparency + faq. */
  reference: ReferenceEntry[];
  /** @deprecated — kept for CDN backward compat. Screen reads from reference. */
  transparency?: TransparencyPoint[];
  /** @deprecated — kept for CDN backward compat. Screen reads from reference. */
  faq?: FaqEntry[];
  links: LinkEntry[];
}

export interface AboutContent {
  tagline: string;
  description: string;
  organization: string;
  ethosTitle: string;
  ethos: string;
  sourceCodeUrl: string;
}

export type ReferenceCategory = 'data' | 'privacy' | 'app';

export interface ReferenceEntry {
  id: string;
  q: string;
  a: string;
  category: ReferenceCategory;
}

/** @deprecated — use ReferenceEntry. Kept for CDN backward compat. */
export interface TransparencyPoint {
  id: string;
  title: string;
  body: string;
}

/** @deprecated — use ReferenceEntry. Kept for CDN backward compat. */
export interface FaqEntry {
  id: string;
  q: string;
  a: string;
}

export interface LinkEntry {
  id: string;
  label: string;
  url: string;
  category: 'source' | 'legal' | 'community';
}
