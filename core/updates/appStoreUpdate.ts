import {
  IOS_APP_STORE_LOOKUP_URL,
  IOS_APP_STORE_URL,
} from '../../config/constants';

interface AppStoreLookupResult {
  version?: unknown;
  trackViewUrl?: unknown;
}

interface AppStoreLookupResponse {
  resultCount?: unknown;
  results?: unknown;
}

export interface AppStoreUpdate {
  installedVersion: string;
  availableVersion: string;
  storeUrl: string;
}

function numericVersionParts(version: string): number[] | null {
  const trimmed = version.trim();
  if (!/^\d+(?:\.\d+)*$/.test(trimmed)) return null;
  return trimmed.split('.').map(Number);
}

/** True only when `candidate` is a strictly newer dotted-numeric version. */
export function isNewerVersion(candidate: string, installed: string): boolean {
  const candidateParts = numericVersionParts(candidate);
  const installedParts = numericVersionParts(installed);
  if (!candidateParts || !installedParts) return false;

  const length = Math.max(candidateParts.length, installedParts.length);
  for (let index = 0; index < length; index++) {
    const candidatePart = candidateParts[index] ?? 0;
    const installedPart = installedParts[index] ?? 0;
    if (candidatePart > installedPart) return true;
    if (candidatePart < installedPart) return false;
  }
  return false;
}

/**
 * Checks Apple's public lookup endpoint for a newer release.
 * Fail-open by design: malformed responses, network failures, and storefront
 * outages return null so this app always remains usable from bundled data.
 */
export async function fetchAvailableAppStoreUpdate(
  installedVersion: string,
): Promise<AppStoreUpdate | null> {
  if (!numericVersionParts(installedVersion)) return null;

  try {
    const response = await fetch(IOS_APP_STORE_LOOKUP_URL);
    if (!response.ok) return null;

    const raw = await response.json() as AppStoreLookupResponse;
    if (!Array.isArray(raw.results) || raw.results.length === 0) return null;
    const result = raw.results[0] as AppStoreLookupResult;
    if (typeof result.version !== 'string') return null;
    if (!isNewerVersion(result.version, installedVersion)) return null;

    const storeUrl = typeof result.trackViewUrl === 'string' &&
      result.trackViewUrl.startsWith('https://apps.apple.com/')
      ? result.trackViewUrl
      : IOS_APP_STORE_URL;

    return {
      installedVersion,
      availableVersion: result.version,
      storeUrl,
    };
  } catch {
    return null;
  }
}
