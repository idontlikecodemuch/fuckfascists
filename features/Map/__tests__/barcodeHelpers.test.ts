import { normalizeBarcode } from '../barcode/normalizeBarcode';
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
