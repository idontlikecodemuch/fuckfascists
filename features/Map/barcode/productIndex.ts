import bundledProductsRaw from '../../../assets/data/products.json';
import type { Entity } from '../../../core/models';
import type { NormalizedBarcode } from './normalizeBarcode';

export interface ProductProducerEntry {
  entityId: string;
  prefixes: string[];
  observedBrands?: string[];
}

export interface ProductEntry {
  barcode: string;
  displayBarcode?: string;
  productName: string;
  brandName?: string;
  entityId: string;
}

interface ProductsPayload {
  producers?: ProductProducerEntry[];
  products?: ProductEntry[];
}

export interface ProductProducerMatch {
  entity: Entity;
  prefix: string;
  searchTerm: string;
}

export interface ExactProductMatch {
  entity: Entity;
  barcode: string;
  productName: string;
  brandName: string | null;
  searchTerm: string;
}

export type BundledProductMatch =
  | ({ source: 'bundled_product' } & ExactProductMatch)
  | ({ source: 'bundled_prefix' } & ProductProducerMatch);

function normalizePrefix(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? digits : null;
}

function normalizeProductBarcode(value: string | undefined): string | null {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length === 12) return `0${digits}`;
  if (digits.length === 13) return digits;
  return null;
}

function parseProductProducers(raw: unknown): ProductProducerEntry[] {
  const payload = raw as ProductsPayload;
  const producers = Array.isArray(payload?.producers) ? payload.producers : [];
  const parsed: ProductProducerEntry[] = [];

  for (const producer of producers) {
    const normalizedPrefixes = Array.isArray(producer.prefixes)
      ? producer.prefixes
          .map((prefix) => normalizePrefix(prefix))
          .filter((prefix): prefix is string => !!prefix)
      : [];

    if (typeof producer.entityId !== 'string' || !producer.entityId || normalizedPrefixes.length === 0) {
      continue;
    }

    parsed.push({
      entityId: producer.entityId,
      prefixes: normalizedPrefixes,
      observedBrands: Array.isArray(producer.observedBrands)
        ? producer.observedBrands.filter((brand): brand is string => typeof brand === 'string' && brand.trim().length > 0)
        : undefined,
    });
  }

  return parsed;
}

function parseExactProducts(raw: unknown): ProductEntry[] {
  const payload = raw as ProductsPayload;
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const parsed: ProductEntry[] = [];

  for (const product of products) {
    const barcode = normalizeProductBarcode(product.barcode);
    if (
      !barcode ||
      typeof product.entityId !== 'string' ||
      !product.entityId ||
      typeof product.productName !== 'string' ||
      !product.productName.trim()
    ) {
      continue;
    }

    parsed.push({
      barcode,
      displayBarcode: typeof product.displayBarcode === 'string' ? product.displayBarcode : undefined,
      productName: product.productName.trim(),
      brandName:
        typeof product.brandName === 'string' && product.brandName.trim().length > 0
          ? product.brandName.trim()
          : undefined,
      entityId: product.entityId,
    });
  }

  return parsed;
}

const bundledProductProducers = parseProductProducers(bundledProductsRaw);
const bundledExactProducts = parseExactProducts(bundledProductsRaw);

function buildBarcodeCandidates(barcode: NormalizedBarcode): string[] {
  const seen = new Set<string>();
  return [barcode.upcA, barcode.displayCode, barcode.gtin13]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

export function findProductByExactBarcodeInProducts(
  barcode: NormalizedBarcode,
  entities: Entity[],
  products: ProductEntry[]
): ExactProductMatch | null {
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const barcodeCandidates = new Set(
    buildBarcodeCandidates(barcode)
      .map((candidate) => normalizeProductBarcode(candidate))
      .filter((candidate): candidate is string => !!candidate)
  );

  for (const product of products) {
    const productBarcode = normalizeProductBarcode(product.barcode);
    if (!productBarcode || !barcodeCandidates.has(productBarcode)) continue;

    const entity = entityMap.get(product.entityId);
    if (!entity) continue;

    return {
      entity,
      barcode: productBarcode,
      productName: product.productName,
      brandName: product.brandName ?? null,
      searchTerm: entity.aliases[0] ?? entity.canonicalName,
    };
  }

  return null;
}

export function findProducerByBarcodePrefixInProducts(
  barcode: NormalizedBarcode,
  entities: Entity[],
  producers: ProductProducerEntry[]
): ProductProducerMatch | null {
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const barcodeCandidates = buildBarcodeCandidates(barcode);

  let bestMatch: ProductProducerMatch | null = null;

  for (const producer of producers) {
    const entity = entityMap.get(producer.entityId);
    if (!entity) continue;

    for (const prefix of producer.prefixes) {
      const matched = barcodeCandidates.some((candidate) => candidate.startsWith(prefix));
      if (!matched) continue;

      if (!bestMatch || prefix.length > bestMatch.prefix.length) {
        bestMatch = {
          entity,
          prefix,
          searchTerm: entity.aliases[0] ?? entity.canonicalName,
        };
      }
    }
  }

  return bestMatch;
}

export function findBundledProductByBarcodeInProducts(
  barcode: NormalizedBarcode,
  entities: Entity[],
  products: ProductEntry[],
  producers: ProductProducerEntry[]
): BundledProductMatch | null {
  const exactMatch = findProductByExactBarcodeInProducts(barcode, entities, products);
  if (exactMatch) {
    return { ...exactMatch, source: 'bundled_product' };
  }

  const prefixMatch = findProducerByBarcodePrefixInProducts(barcode, entities, producers);
  if (prefixMatch) {
    return { ...prefixMatch, source: 'bundled_prefix' };
  }

  return null;
}

export function findProducerByBarcodePrefix(
  barcode: NormalizedBarcode,
  entities: Entity[]
): ProductProducerMatch | null {
  return findProducerByBarcodePrefixInProducts(barcode, entities, bundledProductProducers);
}

export function findBundledProductByBarcode(
  barcode: NormalizedBarcode,
  entities: Entity[]
): BundledProductMatch | null {
  return findBundledProductByBarcodeInProducts(
    barcode,
    entities,
    bundledExactProducts,
    bundledProductProducers
  );
}
