import { buildBarcodeLabel } from '../buildBarcodeLabel';

describe('buildBarcodeLabel', () => {
  it('combines distinct brand + product with em-dash', () => {
    expect(buildBarcodeLabel('Vinho Verde', 'Casal Garcia', '0000')).toBe(
      'Casal Garcia — Vinho Verde',
    );
    expect(buildBarcodeLabel('Strawberry Lemonade + Vodka', 'Surfside', '0000')).toBe(
      'Surfside — Strawberry Lemonade + Vodka',
    );
  });

  it('uses product name as-is when it already contains the brand', () => {
    expect(buildBarcodeLabel('Waterloo Sparkling Water Raspberry Nectarine', 'Waterloo', '0000')).toBe(
      'Waterloo Sparkling Water Raspberry Nectarine',
    );
    expect(buildBarcodeLabel('Cheetos Crunchy XXtra Flamin Hot', 'Cheetos', '0000')).toBe(
      'Cheetos Crunchy XXtra Flamin Hot',
    );
  });

  it('falls back to the available field when only one is present', () => {
    expect(buildBarcodeLabel('Blackberry Lemonade', null, '0000')).toBe('Blackberry Lemonade');
    expect(buildBarcodeLabel(null, 'Surfside', '0000')).toBe('Surfside');
  });

  it('falls back to the barcode when both are missing', () => {
    expect(buildBarcodeLabel(null, null, '012345')).toBe('012345');
    expect(buildBarcodeLabel('', '', '012345')).toBe('012345');
  });

  it('trims whitespace before comparing or returning', () => {
    expect(buildBarcodeLabel('  Vinho Verde  ', '  Casal Garcia  ', '0000')).toBe(
      'Casal Garcia — Vinho Verde',
    );
  });

  it('overlap check is case-insensitive', () => {
    expect(buildBarcodeLabel('WATERLOO SPARKLING WATER', 'waterloo', '0000')).toBe(
      'WATERLOO SPARKLING WATER',
    );
  });
});
