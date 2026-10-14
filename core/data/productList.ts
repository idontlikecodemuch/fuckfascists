import { PRODUCT_LIST_UPDATE_URL } from '../../config/constants';

/**
 * Which form of a scanned code a barcode prefix is compared against.
 * - `upcA`: the 12-digit UPC-A only (US and Canada codes).
 * - `ean13`: the 13-digit EAN-13 only.
 * Rows without a space (the Open Food Facts-derived layer) use the UPC-A when
 * the scan has one and the EAN-13 otherwise.
 */
export type PrefixSpace = 'upcA' | 'ean13';

export interface ProductProducerEntry {
  entityId: string;
  prefixes: string[];
  prefixSpace?: PrefixSpace;
  observedBrands?: string[];
}

export interface ProductEntry {
  barcode: string;
  displayBarcode?: string;
  productName: string;
  brandName?: string;
  entityId: string;
}

/** The scanner's runtime product index: exact barcode rows plus producer prefixes. */
export interface ProductList {
  /** Freshness, ms since epoch, from `_meta.generatedAt` (or `_meta.lastUpdated`). 0 when unknown. */
  generatedAt: number;
  producers: ProductProducerEntry[];
  products: ProductEntry[];
}

/**
 * Attempts to fetch the latest product list from Git.
 * Falls back to the active local list on any network, validation, partial-file,
 * or downgrade failure so barcode scanning keeps working offline.
 *
 * @param local  The list in use now (bundled, or a previously accepted copy).
 */
export async function fetchProductList(local: ProductList): Promise<ProductList> {
  try {
    const response = await fetch(PRODUCT_LIST_UPDATE_URL);
    if (!response.ok) return local;

    const raw: unknown = await response.json();
    const parsed = parseProductList(raw);
    return parsed ? preferFresherProductList(parsed, local) : local;
  } catch {
    return local;
  }
}

/** Reject stale, undated, empty or suspiciously partial payloads instead of downgrading local data. */
export function preferFresherProductList(remote: ProductList, local: ProductList): ProductList {
  if (remote.producers.length === 0 || remote.products.length === 0) return local;
  if (local.producers.length === 0 || local.products.length === 0) return remote;

  const minimumProducers = Math.max(1, Math.floor(local.producers.length * 0.9));
  const minimumProducts = Math.max(1, Math.floor(local.products.length * 0.9));
  if (remote.producers.length < minimumProducers || remote.products.length < minimumProducts) return local;

  if (remote.generatedAt <= 0) return local;
  return remote.generatedAt >= local.generatedAt ? remote : local;
}

/**
 * Parses a products.json payload (`{ _meta, producers, products, ... }`).
 * Returns null when the payload does not have that shape. Individual rows that
 * fail validation are skipped; `preferFresherProductList` rejects the result
 * if that leaves it partial.
 */
export function parseProductList(raw: unknown): ProductList | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw['producers']) || !Array.isArray(raw['products'])) return null;

  return {
    generatedAt: parseFreshness(raw['_meta']),
    producers: raw['producers'].flatMap(parseProducer),
    products: raw['products'].flatMap(parseProduct),
  };
}

/** Serializes a parsed list back into the products.json shape `parseProductList` accepts. */
export function serializeProductList(list: ProductList): string {
  return JSON.stringify({
    _meta: { generatedAt: new Date(list.generatedAt).toISOString() },
    producers: list.producers,
    products: list.products,
  });
}

export function normalizeProductBarcode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12) return `0${digits}`;
  if (digits.length === 13) return digits;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFreshness(meta: unknown): number {
  if (!isRecord(meta)) return 0;
  for (const key of ['generatedAt', 'lastUpdated']) {
    const value = meta[key];
    const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function normalizePrefix(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? digits : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function parseProducer(value: unknown): ProductProducerEntry[] {
  if (!isRecord(value)) return [];
  const entityId = nonEmptyString(value['entityId']);
  const prefixes = Array.isArray(value['prefixes'])
    ? value['prefixes'].map(normalizePrefix).filter((prefix): prefix is string => !!prefix)
    : [];
  if (!entityId || prefixes.length === 0) return [];

  const space = value['prefixSpace'];
  const brands = value['observedBrands'];
  return [
    {
      entityId,
      prefixes,
      prefixSpace: space === 'upcA' || space === 'ean13' ? space : undefined,
      observedBrands: Array.isArray(brands)
        ? brands.filter((brand): brand is string => nonEmptyString(brand) !== null)
        : undefined,
    },
  ];
}

function parseProduct(value: unknown): ProductEntry[] {
  if (!isRecord(value)) return [];
  const barcode = normalizeProductBarcode(value['barcode']);
  const entityId = nonEmptyString(value['entityId']);
  const productName = nonEmptyString(value['productName']);
  if (!barcode || !entityId || !productName) return [];

  return [
    {
      barcode,
      displayBarcode: typeof value['displayBarcode'] === 'string' ? value['displayBarcode'] : undefined,
      productName,
      brandName: nonEmptyString(value['brandName']) ?? undefined,
      entityId,
    },
  ];
}
