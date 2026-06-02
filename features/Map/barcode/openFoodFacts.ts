import { findByAlias, normalize } from '../../../core/matching';
import type { Entity } from '../../../core/models';
import {
  OPEN_FOOD_FACTS_API_BASE_URL,
  OPEN_FOOD_FACTS_USER_AGENT,
  OPEN_FOOD_FACTS_TIMEOUT_MS,
} from '../../../config/constants';
import type { NormalizedBarcode } from './normalizeBarcode';

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  brands_tags?: string[];
  owner?: string;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

export interface BarcodeLookupTarget {
  barcode: string;
  searchTerm: string;
  productName: string | null;
  brandName: string | null;
}

export type BarcodeLookupOutcome =
  | { kind: 'matched'; target: BarcodeLookupTarget }
  | { kind: 'no_match'; barcode: string; productName: string | null; brandName: string | null }
  | { kind: 'not_in_database'; barcode: string }
  | { kind: 'lookup_unavailable'; barcode: string; reason?: string };

// In-memory backoff to keep us from pummeling OFF when they're rate-limiting
// or returning errors. Engaged on any non-OK HTTP response. Resets on app
// restart. 60s matches OFF's per-user rate-limit window (15 req/min for
// product reads), so by the time the cooldown lifts we're allowed again.
//
// Does NOT engage on network errors / AbortError — a single transient
// timeout isn't a policy signal, so the next scan still tries fresh.
const OFF_COOLDOWN_MS = 60_000;
let offCooldownUntilMs = 0;

function splitBrands(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;,/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function extractBrandCandidates(product: OpenFoodFactsProduct): string[] {
  const raw = [
    product.owner ?? '',
    ...splitBrands(product.brands),
    ...(Array.isArray(product.brands_tags) ? product.brands_tags : []),
  ];

  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const value of raw) {
    const cleaned = value
      .replace(/^[a-z]{2}:/i, '')
      .replace(/-/g, ' ')
      .trim();
    if (!cleaned) continue;

    const key = normalize(cleaned);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    candidates.push(cleaned);
  }

  return candidates;
}

export function matchProductBrandsToEntity(
  product: OpenFoodFactsProduct,
  entities: Entity[]
): BarcodeLookupTarget | null {
  const brandCandidates = extractBrandCandidates(product);

  for (const candidate of brandCandidates) {
    const aliasHit = findByAlias(normalize(candidate), entities);
    if (!aliasHit) continue;

    return {
      barcode: '',
      searchTerm: aliasHit.matchedAlias,
      productName: product.product_name?.trim() || null,
      brandName: candidate,
    };
  }

  return null;
}

/**
 * One network call per uncached barcode. We ask only for the brand/product
 * fields needed to map into our local entity list.
 *
 * Required headers per OFF policy:
 *   - User-Agent: AppName/Version (ContactEmail) — generic UAs get blocked.
 * Read rate limit: 15 req/min per user. Aborts after OPEN_FOOD_FACTS_TIMEOUT_MS
 * so a hung connection on cellular can't stall the scan flow indefinitely.
 *
 * All failure modes converge on `lookup_unavailable`. The actual reason
 * (HTTP status, exception name) is logged via console.warn in __DEV__ so
 * Metro/Xcode console reveals the real cause when debugging.
 */
export async function lookupBarcodeViaOpenFoodFacts(
  barcode: NormalizedBarcode,
  entities: Entity[]
): Promise<BarcodeLookupOutcome> {
  // Cooldown short-circuit. If OFF recently returned a non-OK status we
  // suppress outgoing calls for the cooldown window — protects against
  // bug-spam and respects upstream rate limits even when many users on
  // the same NAT share a quota.
  if (Date.now() < offCooldownUntilMs) {
    const remaining = Math.ceil((offCooldownUntilMs - Date.now()) / 1000);
    const reason = `cooldown ${remaining}s`;
    if (__DEV__) console.warn(`[OFF] ${reason} for ${barcode.displayCode}`);
    return { kind: 'lookup_unavailable', barcode: barcode.displayCode, reason };
  }

  const url = `${OPEN_FOOD_FACTS_API_BASE_URL}/product/${encodeURIComponent(barcode.gtin13)}?fields=product_name,brands,brands_tags,owner`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPEN_FOOD_FACTS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': OPEN_FOOD_FACTS_USER_AGENT,
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      // Read the body so we can distinguish OFF's "product not found" 404 from
      // a real upstream / middlebox failure.
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        bodyText = '';
      }

      // OFF v2 returns HTTP 404 + { status: 0, status_verbose: 'product not found' }
      // for UPCs they simply don't have. That's a legitimate "not in database"
      // result, NOT a lookup failure — no cooldown, Clark "No record yet" copy.
      if (response.status === 404) {
        try {
          const parsed = JSON.parse(bodyText) as { status?: number };
          if (parsed.status === 0) {
            return { kind: 'not_in_database', barcode: barcode.displayCode };
          }
        } catch {
          // body wasn't JSON — fall through to lookup_unavailable
        }
      }

      // Real failure (rate limit, server error, IP block, middlebox).
      // Engage cooldown so we back off until OFF is reachable again.
      offCooldownUntilMs = Date.now() + OFF_COOLDOWN_MS;
      const bodyExcerpt = bodyText.slice(0, 120).replace(/\s+/g, ' ').trim();
      const reason = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''} | ${bodyExcerpt || '(empty body)'} | URL: ${url}`;
      if (__DEV__) console.warn(`[OFF] ${reason}`);
      return { kind: 'lookup_unavailable', barcode: barcode.displayCode, reason };
    }

    const payload = (await response.json()) as OpenFoodFactsResponse;
    if (payload.status !== 1 || !payload.product) {
      return {
        kind: 'not_in_database',
        barcode: barcode.displayCode,
      };
    }

    const matched = matchProductBrandsToEntity(payload.product, entities);
    if (matched) {
      return {
        kind: 'matched',
        target: { ...matched, barcode: barcode.displayCode },
      };
    }

    // #102 — alias lookup didn't hit, but if OFF gave us a brand name we hand
    // it down to the full entity-match pipeline (matchEntity does normalize +
    // alias + FEC fuzzy via useEntityScan). The downstream pipeline still
    // gates on confidence, so a no-confidence result falls back to the
    // BarcodeLookupBanner toast — but at least we tried.
    const brands = extractBrandCandidates(payload.product);
    const productName = payload.product.product_name?.trim() || null;
    const brandName = brands[0] ?? null;
    if (brandName) {
      return {
        kind: 'matched',
        target: {
          barcode: barcode.displayCode,
          searchTerm: brandName,
          productName,
          brandName,
        },
      };
    }

    return {
      kind: 'no_match',
      barcode: barcode.displayCode,
      productName,
      brandName: null,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    if (__DEV__) console.warn(`[OFF] ${reason} for ${barcode.displayCode}`);
    return { kind: 'lookup_unavailable', barcode: barcode.displayCode, reason };
  }
}
