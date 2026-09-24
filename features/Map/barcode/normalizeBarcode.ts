import type { BarcodeType } from 'expo-camera';

const SUPPORTED_BARCODE_TYPES = new Set<BarcodeType>(['ean13', 'upc_a', 'upc_e']);

export interface NormalizedBarcode {
  displayCode: string;
  gtin13: string;
  upcA: string | null;
}

/**
 * Normalizes supported retail barcodes into one canonical lookup shape.
 * We store/look up GTIN-13, but prefer showing UPC-A when one is available.
 * UPC-E (the zero-suppressed 8-digit symbol on small packages such as 20 oz
 * bottles) is expanded to its UPC-A equivalent first, so bundled prefix and
 * exact-product lookups see the same 12/13-digit codes as a UPC-A scan.
 */
export function normalizeBarcode(
  rawData: string,
  barcodeType?: string | null
): NormalizedBarcode | null {
  if (barcodeType && !SUPPORTED_BARCODE_TYPES.has(barcodeType as BarcodeType)) {
    return null;
  }

  const scanned = rawData.replace(/\D/g, '');
  const digits = barcodeType === 'upc_e' ? expandUpcE(scanned) : scanned;
  if (!digits) return null;

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

/**
 * Expands a UPC-E symbol to the 12-digit UPC-A it abbreviates (GS1 rules).
 * Accepts the 8-digit form scanners report (number system + 6 data digits +
 * check digit) or the bare 6 data digits (number system 0 assumed). Returns
 * null when the number system is not 0/1 or a supplied check digit does not
 * match the expansion, which indicates a misread rather than a real code.
 */
export function expandUpcE(digits: string): string | null {
  let numberSystem = '0';
  let data: string;
  let suppliedCheck: string | null = null;

  if (digits.length === 8) {
    numberSystem = digits[0];
    data = digits.slice(1, 7);
    suppliedCheck = digits[7];
  } else if (digits.length === 6) {
    data = digits;
  } else {
    return null;
  }

  if (numberSystem !== '0' && numberSystem !== '1') return null;

  const [d1, d2, d3, d4, d5, d6] = data.split('');
  let body: string;
  if (d6 === '0' || d6 === '1' || d6 === '2') {
    body = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
  } else if (d6 === '3') {
    body = `${d1}${d2}${d3}00000${d4}${d5}`;
  } else if (d6 === '4') {
    body = `${d1}${d2}${d3}${d4}00000${d5}`;
  } else {
    body = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;
  }

  const withoutCheck = `${numberSystem}${body}`;
  const check = gtinCheckDigit(withoutCheck);
  if (suppliedCheck !== null && suppliedCheck !== check) return null;
  return `${withoutCheck}${check}`;
}

/** Standard GS1 modulo-10 check digit for an 11-digit UPC-A body. */
function gtinCheckDigit(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i += 1) {
    const digit = Number(body[i]);
    // Weight 3 on positions 1, 3, 5, ... counted from the right of the body.
    sum += (body.length - i) % 2 === 1 ? digit * 3 : digit;
  }
  return String((10 - (sum % 10)) % 10);
}
