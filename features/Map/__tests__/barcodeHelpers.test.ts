import { expandUpcE, normalizeBarcode } from '../barcode/normalizeBarcode';
import { extractBrandCandidates, matchProductBrandsToEntity } from '../barcode/openFoodFacts';
import type { Entity } from '../../../core/models';

const pepsico: Entity = {
  id: 'pepsico',
  canonicalName: 'PepsiCo Inc',
  aliases: ['PepsiCo', 'Pepsi', 'Frito-Lay', 'Doritos'],
  domains: ['pepsico.com'],
  categoryTags: ['food'],
  ceoName: 'Ramon Laguarta',
  fecCommitteeId: 'C00039321',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2026-03-11',
};

describe('normalizeBarcode', () => {
  it('normalizes UPC-A into GTIN-13 while preserving the 12-digit display code', () => {
    expect(normalizeBarcode('012345678905', 'upc_a')).toEqual({
      displayCode: '012345678905',
      gtin13: '0012345678905',
      upcA: '012345678905',
    });
  });

  it('normalizes EAN-13 with a leading zero into an equivalent UPC-A display code', () => {
    expect(normalizeBarcode('0012345678905', 'ean13')).toEqual({
      displayCode: '012345678905',
      gtin13: '0012345678905',
      upcA: '012345678905',
    });
  });

  it('rejects unsupported barcode types and malformed payloads', () => {
    expect(normalizeBarcode('012345678905', 'qr')).toBeNull();
    expect(normalizeBarcode('abc', 'upc_a')).toBeNull();
    expect(normalizeBarcode('12345670', 'ean8')).toBeNull();
  });

  it('expands an 8-digit UPC-E (Sprite 20 oz bottle) to its UPC-A equivalent', () => {
    // 0 497640 0 on the bottle → Coca-Cola prefix 049000.
    expect(normalizeBarcode('04976400', 'upc_e')).toEqual({
      displayCode: '049000007640',
      gtin13: '0049000007640',
      upcA: '049000007640',
    });
  });

  it('applies every UPC-E expansion rule', () => {
    expect(expandUpcE('01234531')).toBe('012300000451'); // last digit 3
    expect(expandUpcE('01234543')).toBe('012340000053'); // last digit 4
    expect(expandUpcE('11234579')).toBe('112345000079'); // last digit 5-9, number system 1
    expect(expandUpcE('497640')).toBe('049000007640');        // bare 6 data digits
  });

  it('rejects UPC-E payloads with a bad check digit, number system, or length', () => {
    expect(normalizeBarcode('04976401', 'upc_e')).toBeNull();
    expect(expandUpcE('24976400')).toBeNull();
    expect(expandUpcE('0497640')).toBeNull();
    expect(normalizeBarcode('049000007640', 'upc_e')).toBeNull();
  });
});

describe('Open Food Facts helpers', () => {
  it('dedupes owner, brands, and brand tags into normalized candidates', () => {
    expect(
      extractBrandCandidates({
        owner: 'Frito-Lay',
        brands: 'Doritos, Pepsi',
        brands_tags: ['en:doritos', 'en:frito-lay'],
      })
    ).toEqual(['Frito Lay', 'Doritos', 'Pepsi']);
  });

  it('maps a product brand candidate back into the bundled entity list', () => {
    expect(
      matchProductBrandsToEntity(
        {
          product_name: 'Doritos Nacho Cheese',
          brands: 'Doritos',
        },
        [pepsico]
      )
    ).toEqual({
      barcode: '',
      searchTerm: 'Doritos',
      productName: 'Doritos Nacho Cheese',
      brandName: 'Doritos',
    });
  });
});
