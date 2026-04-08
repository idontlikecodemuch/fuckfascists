import { findProducerByBarcodePrefixInProducts } from '../barcode/productIndex';
import type { ProductProducerEntry } from '../barcode/productIndex';
import type { NormalizedBarcode } from '../barcode/normalizeBarcode';
import type { Entity } from '../../../core/models';

const makeEntity = (id: string, name: string, aliases: string[] = []): Entity =>
  ({
    id,
    canonicalName: name,
    aliases: aliases.length ? aliases : [name],
    domains: [],
    categoryTags: [],
    ceoName: '',
    verificationStatus: 'manual',
    lastVerifiedDate: '2026-01-01',
  }) as unknown as Entity;

const pepsico = makeEntity('pepsico', 'Pepsico Inc.', ['Pepsico']);
const cocaCola = makeEntity('coca-cola', 'The Coca-Cola Company', ['Coca-Cola']);
const entities = [pepsico, cocaCola];

const producers: ProductProducerEntry[] = [
  { entityId: 'pepsico', prefixes: ['028400', '012000'] },
  { entityId: 'coca-cola', prefixes: ['049000', '04900012'] },
];

function barcode(upcA: string): NormalizedBarcode {
  return {
    displayCode: upcA,
    gtin13: '0' + upcA,
    upcA,
  };
}

describe('findProducerByBarcodePrefixInProducts', () => {
  it('matches a known Pepsico prefix', () => {
    const result = findProducerByBarcodePrefixInProducts(
      barcode('028400123456'),
      entities,
      producers,
    );
    expect(result).not.toBeNull();
    expect(result!.entity.id).toBe('pepsico');
    expect(result!.prefix).toBe('028400');
    expect(result!.searchTerm).toBe('Pepsico');
  });

  it('matches a known Coca-Cola prefix', () => {
    const result = findProducerByBarcodePrefixInProducts(
      barcode('049000123456'),
      entities,
      producers,
    );
    expect(result).not.toBeNull();
    expect(result!.entity.id).toBe('coca-cola');
  });

  it('returns null for an unknown prefix', () => {
    const result = findProducerByBarcodePrefixInProducts(
      barcode('999999123456'),
      entities,
      producers,
    );
    expect(result).toBeNull();
  });

  it('prefers longest matching prefix', () => {
    const result = findProducerByBarcodePrefixInProducts(
      barcode('049000123456'),
      entities,
      producers,
    );
    expect(result).not.toBeNull();
    // 04900012 (8 digits) is longer than 049000 (6 digits) and both match 049000123456
    expect(result!.prefix).toBe('04900012');
  });

  it('skips producers whose entityId is not in entities list', () => {
    const orphanProducers: ProductProducerEntry[] = [
      { entityId: 'nonexistent', prefixes: ['028400'] },
    ];
    const result = findProducerByBarcodePrefixInProducts(
      barcode('028400123456'),
      entities,
      orphanProducers,
    );
    expect(result).toBeNull();
  });

  it('uses GTIN-13 candidate when upcA is null', () => {
    const eanBarcode: NormalizedBarcode = {
      displayCode: '3017620422003',
      gtin13: '3017620422003',
      upcA: null,
    };
    const euroProducers: ProductProducerEntry[] = [
      { entityId: 'pepsico', prefixes: ['301762'] },
    ];
    const result = findProducerByBarcodePrefixInProducts(
      eanBarcode,
      entities,
      euroProducers,
    );
    expect(result).not.toBeNull();
    expect(result!.prefix).toBe('301762');
  });
});
