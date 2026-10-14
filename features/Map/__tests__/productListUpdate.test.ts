import * as FileSystem from 'expo-file-system';
import { refreshProductList } from '../barcode/productListUpdate';
import {
  bundledProductList,
  findBundledProductByBarcode,
  getActiveProductList,
  setActiveProductList,
} from '../barcode/productIndex';
import { normalizeBarcode } from '../barcode/normalizeBarcode';
import { serializeProductList } from '../../../core/data/productList';
import type { ProductList } from '../../../core/data/productList';
import { parseEntityList } from '../../../core/data/entityList';
import bundledEntitiesRaw from '../../../assets/data/entities.json';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}));

const mockedFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const SAVED_PATH = 'file:///docs/runtime-data/products.json';
const mockFetch = jest.fn();
global.fetch = mockFetch;

const entities = parseEntityList(bundledEntitiesRaw);
// A barcode no bundled row knows, so only an updated copy can match it.
const TEST_SCAN = normalizeBarcode('999999000017', 'upc_a')!;

/** The bundled list plus one test prefix, stamped `deltaMs` after the bundled copy. */
function updatedCopy(deltaMs: number, entityId = 'walmart'): ProductList {
  return {
    generatedAt: bundledProductList.generatedAt + deltaMs,
    producers: [...bundledProductList.producers, { entityId, prefixes: ['999999'], prefixSpace: 'upcA' }],
    products: bundledProductList.products,
  };
}

function noSavedCopy(): void {
  mockedFileSystem.getInfoAsync.mockResolvedValue({ exists: false } as Awaited<ReturnType<typeof FileSystem.getInfoAsync>>);
}

function savedCopy(list: ProductList): void {
  mockedFileSystem.getInfoAsync.mockResolvedValue({ exists: true } as Awaited<ReturnType<typeof FileSystem.getInfoAsync>>);
  mockedFileSystem.readAsStringAsync.mockResolvedValue(serializeProductList(list));
}

function gitServes(list: ProductList): void {
  mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(JSON.parse(serializeProductList(list))) });
}

describe('refreshProductList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setActiveProductList(bundledProductList);
  });

  it('starts on the bundled copy, so a scan resolves before any refresh', () => {
    const scan = normalizeBarcode('019800701956', 'upc_a')!;
    expect(findBundledProductByBarcode(scan, entities)?.entity.id).toBe('sc-johnson');
  });

  it('falls back to the bundled copy when offline', async () => {
    noSavedCopy();
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    const result = await refreshProductList();

    expect(result).toBe(bundledProductList);
    expect(getActiveProductList()).toBe(bundledProductList);
    expect(mockedFileSystem.writeAsStringAsync).not.toHaveBeenCalled();
    expect(findBundledProductByBarcode(TEST_SCAN, entities)).toBeNull();
  });

  it('accepts a newer Git copy, saves it, and the matcher uses it', async () => {
    noSavedCopy();
    gitServes(updatedCopy(60_000));

    await refreshProductList();

    expect(getActiveProductList().generatedAt).toBe(bundledProductList.generatedAt + 60_000);
    expect(findBundledProductByBarcode(TEST_SCAN, entities)?.entity.id).toBe('walmart');
    expect(mockedFileSystem.writeAsStringAsync).toHaveBeenCalledWith(SAVED_PATH, expect.any(String));
  });

  it('rejects an older Git copy and keeps the bundled one', async () => {
    noSavedCopy();
    gitServes(updatedCopy(-60_000));

    await refreshProductList();

    expect(getActiveProductList()).toBe(bundledProductList);
    expect(findBundledProductByBarcode(TEST_SCAN, entities)).toBeNull();
    expect(mockedFileSystem.writeAsStringAsync).not.toHaveBeenCalled();
  });

  it('rejects a partial Git copy', async () => {
    noSavedCopy();
    const partial = updatedCopy(60_000);
    gitServes({ ...partial, products: partial.products.slice(0, 10) });

    await refreshProductList();

    expect(getActiveProductList()).toBe(bundledProductList);
  });

  it('uses the copy saved on an earlier launch, even offline', async () => {
    savedCopy(updatedCopy(60_000));
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await refreshProductList();

    expect(getActiveProductList().generatedAt).toBe(bundledProductList.generatedAt + 60_000);
    expect(findBundledProductByBarcode(TEST_SCAN, entities)?.entity.id).toBe('walmart');
  });

  it('ignores a saved copy older than the bundled one (after an app update)', async () => {
    savedCopy(updatedCopy(-60_000));
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await refreshProductList();

    expect(getActiveProductList()).toBe(bundledProductList);
    expect(findBundledProductByBarcode(TEST_SCAN, entities)).toBeNull();
  });

  it('ignores an unreadable saved copy', async () => {
    mockedFileSystem.getInfoAsync.mockResolvedValue({ exists: true } as Awaited<ReturnType<typeof FileSystem.getInfoAsync>>);
    mockedFileSystem.readAsStringAsync.mockResolvedValue('{"truncated": ');
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(refreshProductList()).resolves.toBe(bundledProductList);
    expect(getActiveProductList()).toBe(bundledProductList);
  });

  it('keeps the accepted copy in memory when saving it fails', async () => {
    noSavedCopy();
    mockedFileSystem.writeAsStringAsync.mockRejectedValueOnce(new Error('disk full'));
    gitServes(updatedCopy(60_000, 'target'));

    await refreshProductList();

    expect(findBundledProductByBarcode(TEST_SCAN, entities)?.entity.id).toBe('target');
  });
});
