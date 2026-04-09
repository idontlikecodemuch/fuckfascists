import type { InfoContent, ReferenceEntry } from '../types';
import { INFO_CONTENT_URL } from '../../../config/constants';

/**
 * Fetches the latest Info content from the CDN.
 * Returns the bundled fallback on any network or validation failure.
 * The app is never blocked waiting for this — bundled content renders immediately.
 */
export async function fetchInfoContent(bundled: InfoContent): Promise<InfoContent> {
  try {
    const res = await fetch(INFO_CONTENT_URL);
    if (!res.ok) return bundled;

    const json: unknown = await res.json();
    if (!isValidInfoContent(json)) return bundled;

    // If CDN payload uses old schema (transparency+faq, no reference), transform it
    const content = json as InfoContent;
    if (!content.reference && content.transparency && content.faq) {
      content.reference = buildReferenceFromLegacy(content.transparency, content.faq);
    }
    return content;
  } catch {
    return bundled;
  }
}

/**
 * Runtime type guard — validates the minimum required shape of a fetched
 * InfoContent payload before replacing the bundled content.
 * Accepts payloads with either the new `reference` array or the old
 * `transparency`+`faq` arrays (backward compat).
 */
export function isValidInfoContent(v: unknown): v is InfoContent {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  const hasReference = Array.isArray(c['reference']);
  const hasLegacy = Array.isArray(c['transparency']) && Array.isArray(c['faq']);
  return (
    typeof c['version'] === 'string' &&
    isAbout(c['about']) &&
    (hasReference || hasLegacy) &&
    Array.isArray(c['links'])
  );
}

function isAbout(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a['tagline'] === 'string' &&
    typeof a['description'] === 'string' &&
    typeof a['organization'] === 'string' &&
    typeof a['ethosTitle'] === 'string' &&
    typeof a['ethos'] === 'string' &&
    typeof a['sourceCodeUrl'] === 'string'
  );
}

/**
 * Converts old transparency+faq arrays into the unified reference format.
 * Transparency items become 'data' category; FAQ items become 'app' category.
 * Privacy items (storage, tracking) are detected by ID and categorized correctly.
 */
export function buildReferenceFromLegacy(
  transparency: Array<{ id: string; title: string; body: string }>,
  faq: Array<{ id: string; q: string; a: string }>,
): ReferenceEntry[] {
  const privacyIds = new Set(['storage', 'tracking']);
  const entries: ReferenceEntry[] = [];

  for (const t of transparency) {
    entries.push({
      id: t.id,
      q: t.title,
      a: t.body,
      category: privacyIds.has(t.id) ? 'privacy' : 'data',
    });
  }
  for (const f of faq) {
    entries.push({
      id: f.id,
      q: f.q,
      a: f.a,
      category: privacyIds.has(f.id) ? 'privacy' : 'app',
    });
  }
  return entries;
}
