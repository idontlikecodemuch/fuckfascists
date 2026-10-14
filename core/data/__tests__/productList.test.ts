import {
  fetchProductList,
  parseProductList,
  serializeProductList,
} from '../productList';
import type { ProductList } from '../productList';
import { PRODUCT_LIST_UPDATE_URL } from '../../../config/constants';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const LOCAL_TIME = '2026-10-14T22:00:00Z';

function payload(generatedAt: string | null, producerCount = 10, productCount = 10): Record<string, unknown> {
  return {
    _meta: generatedAt ? { generatedAt } : {},
    producers: Array.from({ length: producerCount }, (_, i) => ({
      entityId: `entity-${i}`,
      prefixes: [String(100000 + i)],
      source: 'off-bulk',
    })),
    producerResearch: [],
    products: Array.from({ length: productCount }, (_, i) => ({
      barcode: `00490001234${i % 10}`,
      productName: `Product ${i}`,
      entityId: `entity-${i}`,
    })),
  };
}

const local = parseProductList(payload(LOCAL_TIME)) as ProductList;

const mockFetch = jest.fn();
global.fetch = mockFetch;

function respondWith(body: unknown): void {
  mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(body) } as Response);
}

// ─── fetchProductList ────────────────────────────────────────────────────────

describe('fetchProductList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the products.json runtime bundle from Git', async () => {
    respondWith(payload('2026-10-20T00:00:00Z'));
    await fetchProductList(local);
    expect(mockFetch).toHaveBeenCalledWith(PRODUCT_LIST_UPDATE_URL);
    expect(PRODUCT_LIST_UPDATE_URL).toMatch(/\/assets\/data\/products\.json$/);
  });

  it('accepts a newer complete copy', async () => {
    respondWith(payload('2026-10-20T00:00:00Z', 11, 12));
    const result = await fetchProductList(local);
    expect(result).not.toBe(local);
    expect(result.producers).toHaveLength(11);
    expect(result.products).toHaveLength(12);
    expect(result.generatedAt).toBe(Date.parse('2026-10-20T00:00:00Z'));
  });

  it('accepts an equally fresh copy', async () => {
    respondWith(payload(LOCAL_TIME));
    const result = await fetchProductList(local);
    expect(result.generatedAt).toBe(local.generatedAt);
  });

  it('rejects an older copy', async () => {
    respondWith(payload('2026-10-01T00:00:00Z'));
    expect(await fetchProductList(local)).toBe(local);
  });

  it('rejects a copy with no freshness field', async () => {
    respondWith(payload(null));
    expect(await fetchProductList(local)).toBe(local);
  });

  it('rejects a partial copy (too few producers)', async () => {
    respondWith(payload('2026-10-20T00:00:00Z', 5, 10));
    expect(await fetchProductList(local)).toBe(local);
  });

  it('rejects a partial copy (too few exact products)', async () => {
    respondWith(payload('2026-10-20T00:00:00Z', 10, 5));
    expect(await fetchProductList(local)).toBe(local);
  });

  it('rejects a copy with empty producers or products', async () => {
    respondWith(payload('2026-10-20T00:00:00Z', 0, 10));
    expect(await fetchProductList(local)).toBe(local);
    respondWith(payload('2026-10-20T00:00:00Z', 10, 0));
    expect(await fetchProductList(local)).toBe(local);
  });

  it('rejects malformed payloads', async () => {
    for (const body of [null, 'products', [payload(LOCAL_TIME)], { _meta: { generatedAt: '2026-10-20' } }]) {
      respondWith(body);
      expect(await fetchProductList(local)).toBe(local);
    }
  });

  it('rejects a copy whose rows are malformed (drops below the completeness floor)', async () => {
    const body = payload('2026-10-20T00:00:00Z');
    body.producers = (body.producers as unknown[]).map((row, i) => (i < 5 ? { entityId: 7, prefixes: [123456] } : row));
    respondWith(body);
    expect(await fetchProductList(local)).toBe(local);
  });

  it('falls back to the local copy on a non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    expect(await fetchProductList(local)).toBe(local);
  });

  it('falls back to the local copy when offline', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await fetchProductList(local)).toBe(local);
  });

  it('falls back to the local copy when the body is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    } as unknown as Response);
    expect(await fetchProductList(local)).toBe(local);
  });
});

// ─── parse / prefer / serialize ──────────────────────────────────────────────

describe('parseProductList', () => {
  it('reads generatedAt, falling back to the date-only lastUpdated', () => {
    expect(parseProductList(payload(LOCAL_TIME))?.generatedAt).toBe(Date.parse(LOCAL_TIME));
    const dated = { ...payload(null), _meta: { lastUpdated: '2026-10-01' } };
    expect(parseProductList(dated)?.generatedAt).toBe(Date.parse('2026-10-01'));
  });

  it('keeps prefixSpace only when it is upcA or ean13', () => {
    const body = payload(LOCAL_TIME, 3, 1);
    const rows = body.producers as Record<string, unknown>[];
    rows[0].prefixSpace = 'upcA';
    rows[1].prefixSpace = 'ean13';
    rows[2].prefixSpace = 'gtin14';
    const parsed = parseProductList(body);
    expect(parsed?.producers.map((row) => row.prefixSpace)).toEqual(['upcA', 'ean13', undefined]);
  });

  it('normalizes exact barcodes to 13 digits', () => {
    const parsed = parseProductList({
      _meta: { generatedAt: LOCAL_TIME },
      producers: [],
      products: [{ barcode: '049000123456', productName: 'Coke', entityId: 'coca-cola' }],
    });
    expect(parsed?.products[0].barcode).toBe('0049000123456');
  });

  it('round-trips through serializeProductList', () => {
    const parsed = parseProductList(JSON.parse(serializeProductList(local)));
    expect(parsed).toEqual(local);
  });
});
