import bundledProductsRaw from '../../../assets/data/products.json';
import type { Entity } from '../../../core/models';
import type { NormalizedBarcode } from './normalizeBarcode';

export interface ProductProducerEntry {
  entityId: string;
  prefixes: string[];
  observedBrands?: string[];
}

interface ProductsPayload {
  producers?: ProductProducerEntry[];
}

export interface ProductProducerMatch {
  entity: Entity;
  prefix: string;
  searchTerm: string;
}

function normalizePrefix(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? digits : null;
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

const bundledProductProducers = parseProductProducers(bundledProductsRaw);

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

export function findProducerByBarcodePrefix(
  barcode: NormalizedBarcode,
  entities: Entity[]
): ProductProducerMatch | null {
  return findProducerByBarcodePrefixInProducts(barcode, entities, bundledProductProducers);
}
