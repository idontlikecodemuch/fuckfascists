# Local Data Encryption Audit

**Date:** 2026-04-15
**Scope:** All local data storage in the mobile app and browser extension.
**Action:** Audit report only. No storage layers modified.

---

## Executive Summary

The app relies on platform-level encryption (iOS Data Protection, iOS Keychain / Android Keystore) rather than application-level encryption. Adequate for iOS MVP. Android has no guaranteed app-level protection for SQLite data. The browser extension stores data in plaintext `chrome.storage.local`. Three copy strings inaccurately claim GPS coordinates are never saved.

---

## Storage Inventory

### Mobile App — SQLite (`fuckfascists.db`)

Opened via `expo-sqlite` `openDatabaseAsync()` with no encryption options. No SQLCipher or app-level encryption. Relies on iOS Data Protection (file-level, hardware-backed when device is locked).

| Table | Data | Privacy Impact |
|---|---|---|
| `entity_avoid_events` | entity_id, date, count, surface | Medium — reveals which corporations the user avoids, by date |
| `platform_avoid_events` | platform_id, date, count | Medium — reveals which platforms the user avoids |
| `cache` | key (brandName+areaHash), fec_committee_id, donation_summary_json, confidence, fetched_at | Low — areaHash is a ~1km grid token, not raw coordinates |
| `entity_avoid_pins` | entity_id, date, **latitude, longitude**, name | **High** — raw GPS coordinates for avoided businesses |
| `barcode_lookup_cache` | barcode, search_term, product_name, brand_name, source, status, fetched_at (30-day TTL) | Medium — reveals CPG brand scanning patterns |

**Schema source:** `core/data/schema.ts` (main tables), `features/Map/barcode/barcodeCacheStore.ts` (barcode cache).

### Mobile App — SecureStore (`expo-secure-store`)

Uses iOS Keychain (hardware-backed) / Android Keystore. Encrypted by default. Low-sensitivity data only.

| Key | Data | Used By |
|---|---|---|
| `onboarding_complete` | `"true"` / absent | `useOnboarding.ts` |
| `ff_beta_mode` | `"true"` / `"false"` | `useBetaMode.ts` |
| `platform_roster` | JSON array of platform IDs | `usePlatformRoster.ts` |
| `map_hints_dismissed` | JSON array of hint IDs | `useMapHints.ts` |
| `ff_last_launch_date` | `YYYY-MM-DD` string | `LaunchScreen.tsx` |
| `track_daily_open_last_visit` | date string | `TrackList.tsx` |

### Mobile App — File System

| Path | Data | Encryption |
|---|---|---|
| `{documentDirectory}/scorecards/*.png` | Rendered scorecard images (weekly summaries) | iOS Data Protection |

### Browser Extension — `chrome.storage.local`

**No encryption.** Data is plaintext in the browser profile directory.

| Key Pattern | Data |
|---|---|
| `avoid:entity:{id}:{date}` | Entity avoid events (entityId, date, count) |
| `avoid:platform:{id}:{date}` | Platform avoid events |
| `cache:{key}` | FEC API result cache |
| `ext:{entityId}` | Extension-local FEC data cache |
| Snooze records | Hostnames of flagged domains the user snoozed (7-day TTL) |

### Browser Extension — In-Memory Only

| Store | Data | Persisted? |
|---|---|---|
| `sessionStore.ts` TabFlag map | Tab flags, domain-last-flagged timestamps | No (RAM only, cleared on SW restart) |

---

## Encryption Status by Platform

| Platform | SQLite DB | SecureStore | File System |
|---|---|---|---|
| **iOS** | iOS Data Protection (encrypted at rest when locked) | iOS Keychain (hardware-backed) | iOS Data Protection |
| **Android** | **None guaranteed** — depends on device full-disk encryption | Android Keystore (encrypted) | **None guaranteed** |

---

## Gaps Between Copy and Reality

### Gap 1: GPS Coordinate Storage (CRITICAL)

Three copy strings claim GPS is never saved:

1. **`copy/onboard.ts:19`** — `"GPS is used once to center your map. Coordinates are never saved."`
2. **`copy/infoContent.ts:107-108`** — `"GPS is accessed only when you use the map and is never saved."`
3. **`copy/infoContent.ts:97-100`** — `"No times, no locations, no identifiers."`

**Reality:** `entity_avoid_pins` stores raw latitude/longitude for avoided entities. Stored locally, encrypted via iOS Data Protection, auto-purged daily. Documented in CLAUDE.md as a "privacy relaxation" and candidate for rewrite.

**Severity:** V1 launch blocker. Users are not giving informed consent to coordinate storage.

**Already tracked:** CLAUDE.md Known Limitations ("Map auto-scan on open" and "Avoided-entity pin coordinate storage").

### Gap 2: Android Encryption (HIGH)

No explicit claim of encryption in copy, but users may reasonably assume privacy when told "data is local only." Android SQLite has no app-level encryption unless the device has full-disk encryption enabled (user setting, not guaranteed).

**Severity:** High for Android users without device encryption. Not a V1 launch blocker (iOS-only beta), but should be addressed before Android launch.

### Gap 3: Extension Storage Plaintext (MEDIUM)

Extension avoid events and snooze records are stored in plaintext. Snooze records reveal which flagged domains the user visited (even though browsing history is not stored).

**Severity:** Medium. The extension correctly avoids storing browsing history, but snooze records are a partial leak. Consider migrating to `chrome.storage.session` (MV3, cleared on browser close) in V2.

### Gap 4: Barcode Cache Not Disclosed (LOW)

`barcode_lookup_cache` stores scanned brand names for 30 days. Not mentioned in Info copy.

**Severity:** Low. The cache contains product metadata, not personal data. But it does reveal CPG scanning patterns.

---

## What's Working Correctly

- SecureStore usage is appropriate — low-sensitivity flags in iOS Keychain
- No personal identifiers stored anywhere
- No browsing history persisted (extension is in-memory only)
- No "support" events — only avoidance is recorded
- FEC cache keys use areaHash, not raw coordinates
- Avoid pin auto-purge runs daily
- No outbound user data — only FEC.gov, GitHub, and Open Food Facts queries

---

## Recommendations

| # | Finding | Priority | Action |
|---|---|---|---|
| 1 | Copy says "GPS never saved" — entity_avoid_pins stores coords | **V1 launch blocker** | Update 3 copy strings |
| 2 | Android SQLite has no app-level encryption | V1.5 | Evaluate SQLCipher or remove GPS pin storage on Android |
| 3 | Extension snooze records persist flagged hostnames | V2 | Migrate to `chrome.storage.session` |
| 4 | Barcode cache not mentioned in Info copy | V1.5 | Add disclosure or reduce TTL |
| 5 | iOS Data Protection is platform-adequate for MVP | Informational | No action |
| 6 | SecureStore usage is correct | Informational | No action |
