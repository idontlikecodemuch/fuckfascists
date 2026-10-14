import * as FileSystem from 'expo-file-system';
import {
  fetchProductList,
  parseProductList,
  preferFresherProductList,
  serializeProductList,
} from '../../../core/data/productList';
import type { ProductList } from '../../../core/data/productList';
import { bundledProductList, setActiveProductList } from './productIndex';

// The accepted Git copy lives in the app's private documents directory, which
// gets the same OS encryption at rest as the rest of the app's files.
const RUNTIME_DATA_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}runtime-data/` : null;
const SAVED_PRODUCT_LIST = RUNTIME_DATA_DIR ? `${RUNTIME_DATA_DIR}products.json` : null;

/** Reads the product list accepted on an earlier launch. Null when absent or unreadable. */
export async function loadSavedProductList(): Promise<ProductList | null> {
  if (!SAVED_PRODUCT_LIST) return null;
  try {
    const info = await FileSystem.getInfoAsync(SAVED_PRODUCT_LIST);
    if (!info.exists) return null;
    const text = await FileSystem.readAsStringAsync(SAVED_PRODUCT_LIST);
    return parseProductList(JSON.parse(text));
  } catch {
    return null;
  }
}

/** Saves an accepted product list for later launches. Failure only costs the cache. */
export async function saveProductList(list: ProductList): Promise<void> {
  if (!RUNTIME_DATA_DIR || !SAVED_PRODUCT_LIST) return;
  try {
    await FileSystem.makeDirectoryAsync(RUNTIME_DATA_DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(SAVED_PRODUCT_LIST, serializeProductList(list));
  } catch {
    /* keep scanning on the in-memory copy */
  }
}

/**
 * Local-first product list refresh, run in the background at launch:
 * 1. scans start on the bundled index (already active);
 * 2. a saved copy from an earlier launch replaces it if at least as fresh and complete;
 * 3. the Git copy replaces that if it passes the same checks, and is saved.
 * Never throws; any failure leaves the current copy in use.
 */
export async function refreshProductList(bundled: ProductList = bundledProductList): Promise<ProductList> {
  let active = bundled;
  try {
    const saved = await loadSavedProductList();
    if (saved) {
      active = preferFresherProductList(saved, bundled);
      setActiveProductList(active);
    }

    const latest = await fetchProductList(active);
    // An equally fresh copy carries the same data; skip rewriting the saved file.
    if (latest !== active && latest.generatedAt > active.generatedAt) {
      active = latest;
      setActiveProductList(active);
      await saveProductList(active);
    }
  } catch {
    /* bundled or saved copy stays active */
  }
  return active;
}
