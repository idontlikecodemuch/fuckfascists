import type { InfoContent } from '../types';
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
    return isValidInfoContent(json) ? json : bundled;
  } catch {
    return bundled;
  }
}

/**
 * Runtime type guard — validates the minimum required shape of a fetched
 * InfoContent payload before replacing the bundled content.
 */
export function isValidInfoContent(v: unknown): v is InfoContent {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c['version'] === 'string' &&
    isAbout(c['about']) &&
    Array.isArray(c['transparency']) &&
    Array.isArray(c['faq']) &&
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
    typeof a['sourceCodeUrl'] === 'string'
  );
}
