import * as SQLite from 'expo-sqlite';
import { BARCODE_LOOKUP_CACHE_TTL_DAYS } from '../../../config/constants';

const DB_NAME = 'fuckfascists.db';
export const TABLE_BARCODE_LOOKUPS = 'barcode_lookup_cache';

export interface CachedBarcodeLookup {
  barcode: string;
  searchTerm: string | null;
  productName: string | null;
  brandName: string | null;
  source: 'open_food_facts';
  status: 'matched' | 'no_match';
  fetchedAt: number;
}

interface BarcodeLookupRow {
  barcode: string;
  search_term: string | null;
  product_name: string | null;
  brand_name: string | null;
  source: 'open_food_facts';
  status: 'matched' | 'no_match';
  fetched_at: number;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function isExpired(fetchedAt: number): boolean {
  const ttlMs = BARCODE_LOOKUP_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - fetchedAt > ttlMs;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${TABLE_BARCODE_LOOKUPS} (
          barcode     TEXT    PRIMARY KEY,
          search_term TEXT,
          product_name TEXT,
          brand_name  TEXT,
          source      TEXT    NOT NULL,
          status      TEXT    NOT NULL,
          fetched_at  INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }

  return dbPromise;
}

export async function getCachedBarcodeLookup(barcode: string): Promise<CachedBarcodeLookup | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BarcodeLookupRow>(
    `SELECT * FROM ${TABLE_BARCODE_LOOKUPS} WHERE barcode = ?`,
    [barcode]
  );

  if (!row) return null;

  if (isExpired(row.fetched_at)) {
    await db.runAsync(`DELETE FROM ${TABLE_BARCODE_LOOKUPS} WHERE barcode = ?`, [barcode]);
    return null;
  }

  return {
    barcode: row.barcode,
    searchTerm: row.search_term,
    productName: row.product_name,
    brandName: row.brand_name,
    source: row.source,
    status: row.status,
    fetchedAt: row.fetched_at,
  };
}

export async function setCachedBarcodeLookup(entry: CachedBarcodeLookup): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${TABLE_BARCODE_LOOKUPS}
      (barcode, search_term, product_name, brand_name, source, status, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.barcode,
      entry.searchTerm,
      entry.productName,
      entry.brandName,
      entry.source,
      entry.status,
      entry.fetchedAt,
    ]
  );
}
