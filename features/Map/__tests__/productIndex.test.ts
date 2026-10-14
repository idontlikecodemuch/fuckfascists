import {
  findBundledProductByBarcode,
  findBundledProductByBarcodeInProducts,
  findProducerByBarcodePrefixInProducts,
  findProductByExactBarcodeInProducts,
} from '../barcode/productIndex';
import type { ProductEntry, ProductProducerEntry } from '../barcode/productIndex';
import { normalizeBarcode } from '../barcode/normalizeBarcode';
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
const products: ProductEntry[] = [
  {
    barcode: '0049000123456',
    displayBarcode: '049000123456',
    productName: 'Coca-Cola Classic',
    brandName: 'Coca-Cola',
    entityId: 'coca-cola',
  },
];

function barcode(upcA: string): NormalizedBarcode {
  return {
    displayCode: upcA,
    gtin13: '0' + upcA,
    upcA,
  };
}

describe('UPC-E scans', () => {
  it('resolves a Sprite 20 oz UPC-E scan to Coca-Cola through the expanded prefix', () => {
    const barcode = normalizeBarcode('04976400', 'upc_e');
    expect(barcode).not.toBeNull();
    const match = findProducerByBarcodePrefixInProducts(barcode!, entities, producers);
    expect(match?.entity.id).toBe('coca-cola');
    expect(match?.prefix).toBe('049000');
  });
});

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

describe('prefix spaces (UPC-A vs EAN-13)', () => {
  const campbell = makeEntity('campbell-soup', 'Campbell Soup Co', ["Campbell's"]);
  const scJohnson = makeEntity('sc-johnson', 'S.C. Johnson & Son Inc', ['SC Johnson']);
  const churchDwight = makeEntity('church-dwight', 'Church & Dwight Co Inc', ['Church & Dwight']);
  const ottogi = makeEntity('ottogi', 'Ottogi Corp', ['Ottogi']);
  const ferrero = makeEntity('ferrero', 'Ferrero Group', ['Ferrero']);
  const procterGamble = makeEntity('procter-gamble', 'Procter & Gamble Co', ['P&G']);
  const all = [pepsico, campbell, scJohnson, churchDwight, ottogi, ferrero, procterGamble];

  it('does not match Barbasol 051009009341 to Campbell through its 0 + UPC-A form', () => {
    const scan = normalizeBarcode('051009009341', 'upc_a');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'campbell-soup', prefixes: ['005100'] },
    ]);
    expect(result).toBeNull();
  });

  it("does not match O'Keeffe's 722510026003 to PepsiCo through its 0 + UPC-A form", () => {
    const scan = normalizeBarcode('722510026003', 'upc_a');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'pepsico', prefixes: ['072251'] },
    ]);
    expect(result).toBeNull();
  });

  it('still matches a UPC-A scan against its own prefix (Windex 019800701956)', () => {
    const scan = normalizeBarcode('019800701956', 'upc_a');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'sc-johnson', prefixes: ['019800'], prefixSpace: 'upcA' },
    ]);
    expect(result?.entity.id).toBe('sc-johnson');
  });

  it('matches a UPC-A sent as a 13-digit EAN with a leading zero', () => {
    const scan = normalizeBarcode('0019800701956', 'ean13');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'sc-johnson', prefixes: ['019800'], prefixSpace: 'upcA' },
    ]);
    expect(result?.entity.id).toBe('sc-johnson');
  });

  it('still matches a real EAN-13 (Nutella 3017620422003)', () => {
    const scan = normalizeBarcode('3017620422003', 'ean13');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'ferrero', prefixes: ['301762'] },
    ]);
    expect(result?.entity.id).toBe('ferrero');
  });

  it('matches an EAN-13-space prefix on an EAN-13 scan (Batiste 5010724526774)', () => {
    const scan = normalizeBarcode('5010724526774', 'ean13');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'church-dwight', prefixes: ['5010724'], prefixSpace: 'ean13' },
    ]);
    expect(result?.entity.id).toBe('church-dwight');
  });

  it('keeps a UPC-A-space prefix away from EAN-13 scans that share its digits', () => {
    const scan = normalizeBarcode('3004101234565', 'ean13');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'procter-gamble', prefixes: ['300410'], prefixSpace: 'upcA' },
    ]);
    expect(result).toBeNull();
  });

  it('lets a longer prefix win inside a shared GS1 block (Touchland 850028448007)', () => {
    const scan = normalizeBarcode('850028448007', 'upc_a');
    const result = findProducerByBarcodePrefixInProducts(scan!, all, [
      { entityId: 'ottogi', prefixes: ['850028'] },
      { entityId: 'church-dwight', prefixes: ['850028448'], prefixSpace: 'upcA' },
    ]);
    expect(result?.entity.id).toBe('church-dwight');
    expect(result?.prefix).toBe('850028448');
  });
});

describe('findProductByExactBarcodeInProducts', () => {
  it('matches an exact bundled product barcode', () => {
    const result = findProductByExactBarcodeInProducts(
      barcode('049000123456'),
      entities,
      products,
    );
    expect(result).not.toBeNull();
    expect(result!.entity.id).toBe('coca-cola');
    expect(result!.productName).toBe('Coca-Cola Classic');
    expect(result!.brandName).toBe('Coca-Cola');
  });

  it('skips exact product rows whose entityId is not in entities list', () => {
    const result = findProductByExactBarcodeInProducts(
      barcode('049000123456'),
      entities,
      [{ ...products[0], entityId: 'missing-entity' }],
    );
    expect(result).toBeNull();
  });
});

describe('findBundledProductByBarcodeInProducts', () => {
  it('prefers exact product rows over producer-prefix rows', () => {
    const result = findBundledProductByBarcodeInProducts(
      barcode('049000123456'),
      entities,
      products,
      producers,
    );
    expect(result).not.toBeNull();
    expect(result!.source).toBe('bundled_product');
    if (result?.source === 'bundled_product') {
      expect(result.productName).toBe('Coca-Cola Classic');
    }
  });

  it('falls back to producer prefixes when no exact product matches', () => {
    const result = findBundledProductByBarcodeInProducts(
      barcode('028400123456'),
      entities,
      products,
      producers,
    );
    expect(result).not.toBeNull();
    expect(result!.source).toBe('bundled_prefix');
  });
});

describe('findBundledProductByBarcode', () => {
  it('matches the beta-reported Pepsico EAN exact barcode', () => {
    const result = findBundledProductByBarcode(
      {
        displayCode: '5201156250881',
        gtin13: '5201156250881',
        upcA: null,
      },
      entities,
    );

    expect(result).not.toBeNull();
    expect(result!.source).toBe('bundled_product');
    if (result?.source === 'bundled_product') {
      expect(result.entity.id).toBe('pepsico');
      expect(result.productName).toBe('PepsiCo product');
    }
  });
});
