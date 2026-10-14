import bundledProductsRaw from '../../../assets/data/products.json';
import type { Entity } from '../../../core/models';
import { normalizeProductBarcode, parseProductList } from '../../../core/data/productList';
import type {
  PrefixSpace,
  ProductEntry,
  ProductList,
  ProductProducerEntry,
} from '../../../core/data/productList';
import type { NormalizedBarcode } from './normalizeBarcode';

export type { PrefixSpace, ProductEntry, ProductProducerEntry } from '../../../core/data/productList';

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

const EMPTY_PRODUCT_LIST: ProductList = { generatedAt: 0, producers: [], products: [] };

/** The product index compiled into the app. */
export const bundledProductList: ProductList =
  parseProductList(bundledProductsRaw) ?? EMPTY_PRODUCT_LIST;

// The copy every scan reads: the bundled index until a fresher saved or Git copy
// is accepted (see productListUpdate.ts). Swapping it never blocks a scan.
let activeProductList: ProductList = bundledProductList;

export function getActiveProductList(): ProductList {
  return activeProductList;
}

export function setActiveProductList(list: ProductList): void {
  activeProductList = list;
}

/**
 * The single form of the scanned code that a prefix in `space` is compared against.
 * A UPC-A scan is never compared through its `0` + UPC-A form: that form shifts every
 * digit and produced false matches (Barbasol 051009009341 against Campbell's `005100`).
 */
function prefixCandidate(barcode: NormalizedBarcode, space: PrefixSpace | undefined): string | null {
  if (space === 'upcA') return barcode.upcA;
  if (space === 'ean13') return barcode.gtin13;
  return barcode.upcA ?? barcode.gtin13;
}

export function findProductByExactBarcodeInProducts(
  barcode: NormalizedBarcode,
  entities: Entity[],
  products: ProductEntry[]
): ExactProductMatch | null {
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const scanned = normalizeProductBarcode(barcode.gtin13);

  for (const product of products) {
    const productBarcode = normalizeProductBarcode(product.barcode);
    if (!productBarcode || productBarcode !== scanned) continue;

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

  let bestMatch: ProductProducerMatch | null = null;

  for (const producer of producers) {
    const entity = entityMap.get(producer.entityId);
    if (!entity) continue;
    const candidate = prefixCandidate(barcode, producer.prefixSpace);
    if (!candidate) continue;

    for (const prefix of producer.prefixes) {
      if (!candidate.startsWith(prefix)) continue;

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
  return findProducerByBarcodePrefixInProducts(barcode, entities, activeProductList.producers);
}

/** Looks a scan up in the active product list (bundled, saved, or the latest accepted Git copy). */
export function findBundledProductByBarcode(
  barcode: NormalizedBarcode,
  entities: Entity[]
): BundledProductMatch | null {
  return findBundledProductByBarcodeInProducts(
    barcode,
    entities,
    activeProductList.products,
    activeProductList.producers
  );
}
