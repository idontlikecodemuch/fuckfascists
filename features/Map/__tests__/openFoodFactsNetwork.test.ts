import type { Entity } from '../../../core/models';
import type { NormalizedBarcode } from '../barcode/normalizeBarcode';

const barcode: NormalizedBarcode = {
  displayCode: '012345678905',
  gtin13: '0012345678905',
  upcA: '012345678905',
};

const pepsico: Entity = {
  id: 'pepsico',
  canonicalName: 'PepsiCo Inc',
  aliases: ['PepsiCo', 'Doritos'],
  domains: ['pepsico.com'],
  categoryTags: ['food'],
  ceoName: 'Ramon Laguarta',
  fecCommitteeId: 'C00039321',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2026-03-11',
};

function makeResponse({
  ok,
  status = 200,
  statusText = '',
  body = '',
  json,
}: {
  ok: boolean;
  status?: number;
  statusText?: string;
  body?: unknown;
  json?: unknown;
}) {
  return {
    ok,
    status,
    statusText,
    text: jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
    json: jest.fn().mockResolvedValue(json),
  };
}

async function loadOpenFoodFacts() {
  jest.resetModules();
  (global as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
  return import('../barcode/openFoodFacts');
}

describe('lookupBarcodeViaOpenFoodFacts', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the required OFF request shape and maps an alias hit', async () => {
    const { lookupBarcodeViaOpenFoodFacts } = await loadOpenFoodFacts();
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        ok: true,
        json: {
          status: 1,
          product: {
            product_name: 'Doritos Nacho Cheese',
            brands: 'Doritos',
          },
        },
      }),
    );

    const result = await lookupBarcodeViaOpenFoodFacts(barcode, [pepsico]);

    expect(result).toEqual({
      kind: 'matched',
      target: {
        barcode: '012345678905',
        searchTerm: 'Doritos',
        productName: 'Doritos Nacho Cheese',
        brandName: 'Doritos',
      },
    });

    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toContain('/product/0012345678905?fields=product_name,brands,brands_tags,owner');
    expect(init).toMatchObject({
      headers: {
        'User-Agent': expect.stringContaining('FCKFascists/'),
        Accept: 'application/json',
      },
    });
    expect(init.signal).toBeDefined();
  });

  it('treats OFF product-not-found 404s as not-in-database without engaging cooldown', async () => {
    const { lookupBarcodeViaOpenFoodFacts } = await loadOpenFoodFacts();
    mockFetch.mockResolvedValue(
      makeResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        body: { status: 0, status_verbose: 'product not found' },
      }),
    );

    await expect(lookupBarcodeViaOpenFoodFacts(barcode, [pepsico])).resolves.toEqual({
      kind: 'not_in_database',
      barcode: '012345678905',
    });
    await lookupBarcodeViaOpenFoodFacts(barcode, [pepsico]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('engages cooldown after real non-OK OFF failures', async () => {
    const { lookupBarcodeViaOpenFoodFacts } = await loadOpenFoodFacts();
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        body: 'blocked',
      }),
    );

    const first = await lookupBarcodeViaOpenFoodFacts(barcode, [pepsico]);
    const second = await lookupBarcodeViaOpenFoodFacts(barcode, [pepsico]);

    expect(first.kind).toBe('lookup_unavailable');
    if (first.kind !== 'lookup_unavailable') throw new Error('expected first lookup to fail');
    expect(first.reason).toContain('HTTP 403 Forbidden');
    expect(second.kind).toBe('lookup_unavailable');
    if (second.kind !== 'lookup_unavailable') throw new Error('expected second lookup to hit cooldown');
    expect(second.reason).toContain('cooldown');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not engage cooldown for transient fetch exceptions', async () => {
    const { lookupBarcodeViaOpenFoodFacts } = await loadOpenFoodFacts();
    mockFetch
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          json: { status: 0 },
        }),
      );

    const first = await lookupBarcodeViaOpenFoodFacts(barcode, [pepsico]);
    const second = await lookupBarcodeViaOpenFoodFacts(barcode, [pepsico]);

    expect(first.kind).toBe('lookup_unavailable');
    if (first.kind !== 'lookup_unavailable') throw new Error('expected first lookup to fail');
    expect(first.reason).toContain('offline');
    expect(second).toEqual({ kind: 'not_in_database', barcode: '012345678905' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('hands unmatched OFF brand names to the downstream entity scan path', async () => {
    const { lookupBarcodeViaOpenFoodFacts } = await loadOpenFoodFacts();
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        ok: true,
        json: {
          status: 1,
          product: {
            product_name: 'Vinho Verde',
            brands: 'Casal Garcia',
          },
        },
      }),
    );

    await expect(lookupBarcodeViaOpenFoodFacts(barcode, [])).resolves.toEqual({
      kind: 'matched',
      target: {
        barcode: '012345678905',
        searchTerm: 'Casal Garcia',
        productName: 'Vinho Verde',
        brandName: 'Casal Garcia',
      },
    });
  });
});
