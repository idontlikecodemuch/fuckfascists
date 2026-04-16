# Local Data Encryption Audit

**Date:** 2026-04-15 (updated 2026-04-16)
**Scope:** All local data storage in the mobile app and browser extension.
**Status:** iOS and Android encryption hardened. No app-level encryption library needed.

---

## Executive Summary

All local data is now encrypted at rest on both iOS and Android using OS-native mechanisms. No app-level encryption (SQLCipher) is used — this avoids Apple App Store export compliance questions.

- **iOS:** `NSFileProtectionComplete` entitlement — strongest level, data inaccessible when device is locked
- **Android:** `minSdkVersion: 29` (Android 10+) — File-Based Encryption (FBE) is mandatory, all app-private files encrypted at rest
- **SecureStore:** iOS Keychain / Android Keystore (hardware-backed) — already encrypted
- **Extension:** `chrome.storage.local` remains plaintext (V2 item)

All tables in `fuckfascists.db` (entity avoids, platform avoids, cache, avoid pins, barcode cache) share the same database file and receive identical OS-level encryption. There is no per-table encryption difference.

---

## Encryption Mechanisms

### iOS — NSFileProtectionComplete

Set via `ios/FckFascists/FckFascists.entitlements`:
```xml
<key>com.apple.developer.default-data-protection</key>
<string>NSFileProtectionComplete</string>
```

- **Level:** Strongest. Files are encrypted with a key derived from the user's passcode and device hardware.
- **Accessibility:** Data is ONLY available when the device is unlocked and the app is in the foreground. When the device locks, all app files become inaccessible.
- **Scope:** Applies to ALL app files — SQLite database, scorecard PNGs, any temp files.
- **No export compliance impact:** This is Apple's own Data Protection framework, not app-level encryption. Apple does not consider it "non-exempt encryption" for App Store submission.

### Android — File-Based Encryption (FBE)

Enforced via `app.json`:
```json
"android": { "minSdkVersion": 29 }
```

- **Level:** OS-enforced. Android 10+ mandates FBE — all files in the app's private directory (`/data/data/com.fckapp.fck/`) are encrypted with 256-bit AES at the filesystem level.
- **Storage tier:** Credential Encrypted (CE) — data is available after the user unlocks the device for the first time after boot.
- **Scope:** Covers SQLite database and all app-private files.
- **Trade-off:** Excludes Android 9 and below (~5% of Android users). Acceptable for a privacy-first app.
- **No export compliance impact:** FBE is the OS doing the encryption, not the app.

### Platform Parity

| Property | iOS | Android 10+ |
|---|---|---|
| Encryption algorithm | AES-256 (hardware-backed) | AES-256 (dm-crypt / FBE) |
| When data is accessible | Device unlocked, app in foreground | After first unlock per boot |
| When data is encrypted | Device locked | Device locked / at rest |
| Scope | All app files | All app-private files |
| App-level code needed | None (entitlement only) | None (minSdkVersion only) |
| Export compliance impact | None | None |

---

## Storage Inventory

### Mobile App — SQLite (`fuckfascists.db`)

All tables in the same database file — all receive identical OS-level encryption.

| Table | Data | Privacy Impact | Encryption |
|---|---|---|---|
| `entity_avoid_events` | entity_id, date, count, surface | Medium | OS-native (iOS DP / Android FBE) |
| `platform_avoid_events` | platform_id, date, count | Medium | OS-native |
| `cache` | key (brandName+areaHash), fec_committee_id, donation_summary_json, confidence, fetched_at | Low | OS-native |
| `entity_avoid_pins` | entity_id, date, latitude, longitude, name | High | OS-native |
| `barcode_lookup_cache` | barcode, search_term, product_name, brand_name, source, status, fetched_at | Medium | OS-native |

### Mobile App — SecureStore (`expo-secure-store`)

Hardware-backed encryption (iOS Keychain / Android Keystore). Low-sensitivity data only.

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
| `{documentDirectory}/scorecards/*.png` | Rendered scorecard images | OS-native (same as SQLite) |

### Browser Extension — `chrome.storage.local`

**No encryption.** Data is plaintext in the browser profile directory.

| Key Pattern | Data |
|---|---|
| `avoid:entity:{id}:{date}` | Entity avoid events |
| `avoid:platform:{id}:{date}` | Platform avoid events |
| `cache:{key}` | FEC API result cache |
| `ext:{entityId}` | Extension-local FEC data cache |
| Snooze records | Hostnames of flagged domains user snoozed (7-day TTL) |

---

## Resolved Gaps

### Gap 1: GPS Coordinate Storage — RESOLVED (copy updated)

Copy lead updated the three strings that inaccurately claimed GPS is never saved. The copy now discloses that avoided-entity pin coordinates are stored locally, encrypted, and auto-purged daily.

### Gap 2: Android Encryption — RESOLVED

`minSdkVersion: 29` guarantees File-Based Encryption on all supported Android devices. All app-private files (including SQLite) are encrypted at rest. Parity with iOS.

---

## Remaining Items

| # | Finding | Priority | Action |
|---|---|---|---|
| 1 | Extension snooze records persist flagged hostnames in plaintext | V2 | Migrate to `chrome.storage.session` |
| 2 | Barcode cache not mentioned in Info copy | V1.5 | Add disclosure or reduce TTL |
| 3 | SecureStore and OS-native encryption are correct | Informational | No action |
