import { findByAlias, normalize } from '../../../core/matching';
import type { Entity } from '../../../core/models';
import { OPEN_FOOD_FACTS_API_BASE_URL } from '../../../config/constants';
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
  | { kind: 'lookup_unavailable'; barcode: string };

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
 */
export async function lookupBarcodeViaOpenFoodFacts(
  barcode: NormalizedBarcode,
  entities: Entity[]
): Promise<BarcodeLookupOutcome> {
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_API_BASE_URL}/product/${encodeURIComponent(barcode.gtin13)}?fields=product_name,brands,brands_tags,owner`
    );
    if (!response.ok) {
      return { kind: 'lookup_unavailable', barcode: barcode.displayCode };
    }

    const payload = (await response.json()) as OpenFoodFactsResponse;
    if (payload.status !== 1 || !payload.product) {
      return {
        kind: 'no_match',
        barcode: barcode.displayCode,
        productName: null,
        brandName: null,
      };
    }

    const matched = matchProductBrandsToEntity(payload.product, entities);
    if (!matched) {
      const brands = extractBrandCandidates(payload.product);
      return {
        kind: 'no_match',
        barcode: barcode.displayCode,
        productName: payload.product.product_name?.trim() || null,
        brandName: brands[0] ?? null,
      };
    }

    return {
      kind: 'matched',
      target: {
        ...matched,
        barcode: barcode.displayCode,
      },
    };
  } catch {
    return { kind: 'lookup_unavailable', barcode: barcode.displayCode };
  }
}
