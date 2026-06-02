/**
 * Composes the user-facing label for a scanned product.
 *
 * - Both brand + product, product already mentions the brand → product name
 *   as-is. Avoids redundancy like "Waterloo — Waterloo Sparkling Water".
 * - Both brand + product, no overlap → "Brand — Product".
 *   (OFF often puts the wine *style* or generic descriptor in product_name
 *   while putting the actual brand in brands — e.g., Casal Garcia / Vinho Verde.)
 * - Only one present → that one.
 * - Neither → fallback (typically the barcode).
 *
 * Uses em-dash to match the project's voice convention.
 */
export function buildBarcodeLabel(
  productName: string | null | undefined,
  brandName: string | null | undefined,
  fallback: string,
): string {
  const product = productName?.trim() || null;
  const brand = brandName?.trim() || null;

  if (brand && product) {
    if (product.toLowerCase().includes(brand.toLowerCase())) return product;
    return `${brand} — ${product}`;
  }
  return brand || product || fallback;
}
