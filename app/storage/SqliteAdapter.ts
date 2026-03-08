import * as SQLite from 'expo-sqlite';
import type { StorageAdapter } from '../../core/data';
import type { EntityAvoidEvent, LocalCache, PlatformAvoidEvent } from '../../core/models';
import {
  TABLE_ENTITY_AVOIDS,
  TABLE_PLATFORM_AVOIDS,
  TABLE_CACHE,
  ALL_DDL,
} from '../../core/data';

// ── Row shapes ────────────────────────────────────────────────────────────────

interface CacheRow {
  key: string;
  fec_committee_id: string;
  donation_summary_json: string;
  confidence: number;
  fetched_at: number;
}

interface EntityAvoidRow {
  entity_id: string;
  date: string;
  count: number;
}

interface PlatformAvoidRow {
  platform_id: string;
  week_of: string;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

/**
 * Mobile SQLite implementation of StorageAdapter.
 *
 * Uses expo-sqlite SDK 52 async-first API (openDatabaseAsync / runAsync / etc.).
 * Use SqliteAdapter.open() — never call the constructor directly.
 *
 * Privacy: no coordinates, no URLs, no personal identifiers are stored.
 * Only affirmative avoidance events are written.
 */
export class SqliteAdapter implements StorageAdapter {
  private constructor(private readonly db: SQLite.SQLiteDatabase) {}

  /** Opens the database and runs all DDL migrations. */
  static async open(name = 'fuckfascists.db'): Promise<SqliteAdapter> {
    const db = await SQLite.openDatabaseAsync(name);
    for (const ddl of ALL_DDL) {
      await db.execAsync(ddl);
    }
    return new SqliteAdapter(db);
  }

  // ── Cache ──────────────────────────────────────────────────────────────────

  async getCacheEntry(key: string): Promise<LocalCache | null> {
    const row = await this.db.getFirstAsync<CacheRow>(
      `SELECT * FROM ${TABLE_CACHE} WHERE key = ?`,
      [key],
    );
    if (!row) return null;
    return {
      key:             row.key,
      fecCommitteeId:  row.fec_committee_id,
      donationSummary: JSON.parse(row.donation_summary_json) as LocalCache['donationSummary'],
      confidence:      row.confidence,
      fetchedAt:       row.fetched_at,
    };
  }

  async setCacheEntry(entry: LocalCache): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${TABLE_CACHE}
         (key, fec_committee_id, donation_summary_json, confidence, fetched_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        entry.key,
        entry.fecCommitteeId,
        JSON.stringify(entry.donationSummary),
        entry.confidence,
        entry.fetchedAt,
      ],
    );
  }

  // ── Entity avoid events ────────────────────────────────────────────────────

  async upsertEntityAvoid(event: EntityAvoidEvent): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO ${TABLE_ENTITY_AVOIDS} (entity_id, date, count)
       VALUES (?, ?, 1)
       ON CONFLICT (entity_id, date) DO UPDATE SET count = count + 1`,
      [event.entityId, event.date],
    );
  }

  async getEntityAvoids(entityId?: string): Promise<EntityAvoidEvent[]> {
    const rows = entityId
      ? await this.db.getAllAsync<EntityAvoidRow>(
          `SELECT * FROM ${TABLE_ENTITY_AVOIDS} WHERE entity_id = ?`,
          [entityId],
        )
      : await this.db.getAllAsync<EntityAvoidRow>(
          `SELECT * FROM ${TABLE_ENTITY_AVOIDS}`,
        );

    return rows.map((r) => ({ entityId: r.entity_id, date: r.date, count: r.count }));
  }

  // ── Platform avoid events ──────────────────────────────────────────────────

  async upsertPlatformAvoid(event: PlatformAvoidEvent): Promise<void> {
    await this.db.runAsync(
      `INSERT OR IGNORE INTO ${TABLE_PLATFORM_AVOIDS} (platform_id, week_of)
       VALUES (?, ?)`,
      [event.platformId, event.weekOf],
    );
  }

  async getPlatformAvoids(weekOf?: string): Promise<PlatformAvoidEvent[]> {
    const rows = weekOf
      ? await this.db.getAllAsync<PlatformAvoidRow>(
          `SELECT * FROM ${TABLE_PLATFORM_AVOIDS} WHERE week_of = ?`,
          [weekOf],
        )
      : await this.db.getAllAsync<PlatformAvoidRow>(
          `SELECT * FROM ${TABLE_PLATFORM_AVOIDS}`,
        );

    return rows.map((r) => ({ platformId: r.platform_id, weekOf: r.week_of }));
  }
}
