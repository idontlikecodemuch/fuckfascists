/**
 * The full Info screen content payload.
 * Designed to be JSON-serializable so it can be fetched from the data repo
 * and updated without an app release.
 */
export interface InfoContent {
  /** Increment when breaking changes are made to the schema. */
  version: string;
  about: AboutContent;
  transparency: TransparencyPoint[];
  faq: FaqEntry[];
  links: LinkEntry[];
}

export interface AboutContent {
  tagline: string;
  description: string;
  organization: string;
  sourceCodeUrl: string;
}

export interface TransparencyPoint {
  id: string;
  title: string;
  body: string;
}

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
