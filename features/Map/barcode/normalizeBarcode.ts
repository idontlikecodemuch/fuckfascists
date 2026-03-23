import type { BarcodeType } from 'expo-camera';

const SUPPORTED_BARCODE_TYPES = new Set<BarcodeType>(['ean13', 'upc_a']);

export interface NormalizedBarcode {
  displayCode: string;
  gtin13: string;
  upcA: string | null;
}

/**
 * Normalizes supported retail barcodes into one canonical lookup shape.
 * We store/look up GTIN-13, but prefer showing UPC-A when one is available.
 */
export function normalizeBarcode(
  rawData: string,
  barcodeType?: string | null
): NormalizedBarcode | null {
  if (barcodeType && !SUPPORTED_BARCODE_TYPES.has(barcodeType as BarcodeType)) {
    return null;
  }

  const digits = rawData.replace(/\D/g, '');

  if (digits.length === 12) {
    return {
      displayCode: digits,
      gtin13: `0${digits}`,
      upcA: digits,
    };
  }

  if (digits.length === 13) {
    return {
      displayCode: digits.startsWith('0') ? digits.slice(1) : digits,
      gtin13: digits,
      upcA: digits.startsWith('0') ? digits.slice(1) : null,
    };
  }

  return null;
}
