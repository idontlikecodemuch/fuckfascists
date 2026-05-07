# F*CK FASCISTS — CLAUDE.md
> This is the authoritative reference for all AI-assisted development on this project.
> Read this before writing any code. Follow it strictly.

---

## Project Overview

**F*ck Fascists** is a privacy-first, gamified app that empowers people to exercise their autonomous economic power by avoiding businesses, platforms, and corporations that donate to Republican campaigns and authoritarian political movements.

It is organized as a **nonprofit**. The codebase is **open-source**. The product is **positive-only** — it celebrates avoidance, never logs or surfaces "support" events.

### The Three Products (all launch together at v1.0)
1. **Mobile app** — iOS + Android (React Native + Expo)
2. **Browser extension** — Chrome + Firefox (Manifest V3, vanilla JS)
3. **Shared core** — TypeScript package used by both (entity matching, confidence scoring, caching)

---

## Project Documentation

These documents are the authoritative reference for the project. New instances should read them in order before starting any session.

| Document | Location | Purpose |
|---|---|---|
| Progress & Current State | /docs/PROGRESS.md | Read this first — current sprint status, recent sessions, immediate next steps |
| Data Cleaning Audit Handoff | /docs/DATA_CLEANING_AUDIT_2026-04-20.md | Current April 2026 data-cleaning audit packet — local data inputs, changed files, verification commands, metrics, and known review findings |
| Progress Archive | /docs/PROGRESS_ARCHIVE.md | Older session logs (pre-March 12, 2026) — reference only, not required reading |
| Products Data Pipeline | /docs/PRODUCTS_DATA_PIPELINE.md | Deep reference for `products.json`, the OFF bulk sync process, checkpoints, cleanup heuristics, and current coverage |
| App Spec (original) | /docs/FuckFascists_AppSpec_ORIGINAL.docx | Canonical product vision as originally written — do not modify |
| README | /README.md | Plain-English public overview — keep current with major feature changes |
| Spec vs. Current State | /docs/SPEC_VS_CURRENT.md | Living document tracking alignment, deviations, and open decisions |
| Voice & Ethos Framework | /docs/FCK_VOICE_FRAMEWORK.md | Canonical voice guide — two voices (Clark the Clerk + The Sh*tposter), tone rules, copy patterns |
| Scorecard Image Spec | /docs/SCORECARD_IMAGE.md | Rendering spec for shareable scorecard image — test pipeline, layout, colors, fonts, translation to React Native |
| CLAUDE.md | /CLAUDE.md | Technical reference for AI agents — update continuously |

**Update cadence:** PROGRESS.md after every session. CLAUDE.md continuously. README.md and SPEC_VS_CURRENT.md when features ship or decisions resolve. Never modify the original spec. When PROGRESS.md exceeds ~10K tokens, move sessions older than one week to PROGRESS_ARCHIVE.md.

**New instance checklist:** Read PROGRESS.md first, then CLAUDE.md, then check SPEC_VS_CURRENT.md open decisions — don't re-litigate resolved ones.

---

## Non-Negotiable Product Principles

These are not preferences. They are constraints. Never violate them.

1. **Avoids only** — The data model cannot contain a "support" event. If a user visited a flagged business or used a flagged platform, nothing is stored. Only affirmative avoidance actions are recorded.
2. **Minimal geolocation storage** — Location is accessed session-only (on explicit user action). Coordinates are never transmitted. **Exception:** avoided-entity pin coordinates are stored locally (encrypted, auto-purged daily) to hydrate the map on relaunch. See "Privacy relaxation" in Data Model section. This exception is a candidate for rewrite.
3. **No browsing history** — The extension detects domains in-memory only. Nothing about what a user browsed is ever persisted.
4. **No personal identifiers** — No accounts, no emails, no user IDs in MVP. All data is local-only.
5. **No backend in MVP** — All processing is on-device. The only outbound calls are to the OpenFEC API (directly from the device), the Open Food Facts API (barcode → brand resolution), and to fetch the curated entity/people list updates (static files on GitHub/CDN).
6. **Transparency always** — Every confidence label is shown. Every data source links to FEC.gov. Nothing is claimed with more certainty than the data supports.
7. **CEO name context split** — CEO names are intentional in the scorecard and avoid tap feedback — these are designed to be confrontational and shareable. CEO names are intentionally absent from the business card and extension popup — these are informational tools displaying public FEC data. Do not conflate these two design contexts.
8. **Cross-surface data parity** — When a material data or transparency change is made to the app business card or the extension popup, carry the underlying data behavior to both surfaces unless there is an explicit documented V2 divergence decision. UI treatment may differ by surface; confidence labels, donation availability handling, FEC links, and core attribution rules must not silently drift.
9. **Capture-then-purge for the scorecard drop** — When the weekly drop fires, the app aggregates the scored week's avoid events into an image, saves it to disk, and then **purges the raw events that produced it** (scoped strictly to `[weekOf, weekOf+7)`). The rendered card survives; the source data does not. This upholds the "delete the data" promise while letting users celebrate + share. Capture failure retains the raw events for retry — purging is gated on successful capture. Never introduce a code path that deletes unscoped avoid data, and never capture without immediately purging. See "Scorecard — Drop Mechanics" for the full flow.

---

## Security — Read This First

API keys and credentials must **only ever be read from environment variables**. This is a hard rule.

- **Never hardcode any key, token, or credential** in source files, config files, or comments. `.env` is gitignored; `.env.example` shows placeholders only. Hardcoded keys are bugs — remove immediately and rotate.
- **`FECClient` supports anonymous mode** — runs without `FEC_API_KEY`, making requests with no `api_key` param (lower rate limits). `console.warn` in non-prod when key is absent.
- **`FEC_API_KEY` is required only for FEC API pipeline scripts** — `verify:entities`, `fetch:donations`, and `fetch:people` make live FEC API requests and must be flagged before running. Bulk-first scripts such as `hydrate:entities:bulk`, `build:people:bulk-top`, and `hydrate:people:bulk` use local `tools/fec-bulk/` files and do not require an API key.
- **`OPENAI_API_KEY` is required for `gpt_image.py`** — the GPT image pipeline reads from `.env` via python-dotenv. Exits with a clear error if missing. Not used by any app or extension runtime code.
- **`GEMINI_API_KEY` is required for Gemini generation scripts** — `generate.py` and `generate_assets.py` read from `.env`. Not used by any app or extension runtime code.

### Data Encryption at Rest

All locally stored user data is encrypted at rest using OS-native mechanisms. No app-level encryption library (SQLCipher) is used — this avoids Apple App Store export compliance questions.

- **iOS:** `NSFileProtectionComplete` entitlement (`ios/FckFascists/FckFascists.entitlements`). Strongest level — all app files are encrypted and completely inaccessible when the device is locked. Hardware-backed AES-256.
- **Android:** `minSdkVersion: 29` in `app.json`. Android 10+ mandates File-Based Encryption (FBE) — all files in the app's private directory are encrypted at rest with 256-bit AES. Credential Encrypted (CE) storage tier — available after first unlock per boot.
- **SecureStore:** iOS Keychain / Android Keystore — hardware-backed, always encrypted.
- **Extension:** `chrome.storage.local` is plaintext (V2: migrate snooze records to `chrome.storage.session`).

All tables in `fuckfascists.db` share the same database file and receive identical OS-level encryption. There is no per-table encryption difference. See `docs/ENCRYPTION_AUDIT.md` for the full audit.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native + Expo (managed workflow) |
| Mobile targets | iOS + Android |
| Maps | React Native Maps (MapKit/iOS, Google Maps SDK/Android) |
| Location | Expo Location — session-only |
| Mobile storage | Expo SecureStore + expo-sqlite |
| Notifications | Expo Notifications — local scheduling only |
| Report card rendering | react-native-view-shot or React Native Skia |
| Barcode scanning | expo-camera (UPC-A/EAN-13) + Open Food Facts API |
| Networking | Native fetch — OpenFEC API (primary); Open Food Facts (barcode); CDN for entity/people list updates |
| Extension | Manifest V3, vanilla JS + HTML/CSS |
| Extension storage | chrome.storage.local / browser.storage.local |
| Shared core | TypeScript package — /core/matching/, /core/models/, /core/api/ |
| Build | Expo EAS Build (.ipa + .apk outside app stores) |

---

## Repository Structure

```
/
├── CLAUDE.md                        ← this file
├── app/                             ← React Native app root
│   ├── gates/                       ← OnboardingGate, LaunchGate, AppShell (app lifecycle gates)
│   ├── navigation/                  ← tab/stack navigation
│   ├── providers/                   ← context, theme, config
│   └── storage/                     ← SqliteAdapter.ts (expo-sqlite SDK 52, mobile only)
├── features/
│   ├── Map/                         ← geolocation scan, map display, flagging
│   ├── Platforms/                    ← Track screen (platform avoidance). TrackScreen → TrackProvider context → TrackHeader + GameArena + FlatList (PlatformGroupHeader + PlatformRow + AvoidButton + DayCircles). ArenaFX extracted. NudgeBanner in AppShell.
│   ├── Scorecard/                   ← generation, drop timing, sharing
│   ├── Onboarding/                  ← first-run flow (3 screens: Welcome, Permissions, Privacy)
│   ├── Info/                        ← transparency, about, FAQ
│   ├── Scan/                        ← barcode scanning (UPC/EAN → bundled prefix index → Open Food Facts → entity match)
│   ├── Beta/                        ← beta testing mode (triple-tap toggle, BetaOverlay)
│   ├── Launch/                      ← daily launch screen (once per calendar day)
│   └── Dev/                         ← dev-only catalog screen
├── core/
│   ├── matching/                    ← entity matching + confidence scoring (SHARED)
│   ├── api/                         ← FEC API client, rate limiting
│   ├── data/                        ← entity list loader, local DB, cache
│   ├── dropSchedule/                ← deterministic PRNG drop time (computeDropTime.ts)
│   ├── sprites/                     ← spriteAssets.ts (require map), spriteLoader.tsx (SpriteView, nameToSpriteId)
│   ├── arena/                       ← arenaAssets.ts (require map for arena backgrounds)
│   ├── fx/                          ← shared FX system (FXLayer, useFX, effect registry, built-in effects)
│   ├── ui/                          ← uiAssets.ts (require map for UI kit sliced elements + header bar), Tooltip.tsx, useWiggleAnimation.ts, useCardOverlayAnimation.ts (BusinessCard slide+dim shared by Map + Track), AlertBanner.tsx
│   ├── utils/                       ← shared utilities (localDate.ts, etc.)
│   └── models/                      ← shared TypeScript types
├── extension/
│   ├── manifest.json
│   ├── background/                  ← service worker, session tracking
│   ├── content/                     ← domain detection on page load
│   └── popup/                       ← pixel art UI
├── copy/
│   ├── shared.ts                    ← strings used across features
│   ├── map.ts                       ← Map feature copy
│   ├── platforms.ts                  ← Platforms feature copy
│   ├── scorecard.ts                 ← Scorecard feature copy
│   ├── onboard.ts                   ← Onboarding feature copy
│   ├── info.ts                      ← Info UI chrome (section headers, labels, icons)
│   ├── infoContent.ts               ← Info editorial content (bundled default for fetch-and-fallback)
│   ├── beta.ts                      ← Beta mode copy (indicator, alerts, screenshot feedback)
│   ├── launch.ts                    ← Daily launch screen copy (rotating messages, tap label)
│   └── scan.ts                      ← Scan tab copy (CTA, status, barcode result labels)
├── design/
│   ├── tokens.ts                    ← theme object: colors, type, spacing, borders, a11y
│   ├── component-rules.md           ← per-component token usage spec
│   └── asset-manifest.json          ← pixel art asset slots, status, fallbacks
├── config/
│   └── constants.ts                 ← all configurable variables (see below)
├── scripts/
│   ├── fetch-donation-data.mjs      ← pre-fetches FEC donation data into entities.json
│   ├── verify-entities.mjs          ← verifies fecCommitteeId for each entity via FEC API
│   ├── verify-data-integrity.mjs    ← audits duplicate IDs, forward refs, reverse-link gaps, role mismatches
│   ├── reconcile-v1-entities.mjs    ← reconciles entities.json ↔ people.json (V1/V2 split)
│   ├── sync-products-from-off.py    ← scans OFF bulk data into products.json with resumable checkpoints
│   └── generate-arena-assets.mjs    ← scans assets/pixel/arena/ → regenerates core/arena/arenaAssets.ts
├── ios/                             ← generated by expo prebuild; committed to repo
├── modules/
│   └── mapkit-search/               ← local Expo native module (iOS MKLocalPointsOfInterestRequest bridge)
├── tools/
│   └── img-gen/                     ← pixel art asset generation pipeline (Gemini + GPT)
│       ├── scripts/generate.py      ← character sprite generation (Gemini API)
│       ├── scripts/generate_assets.py ← UI ornament generation (Gemini API)
│       ├── scripts/compose.py       ← stack sprite variants into final sheets
│       ├── scripts/process_assets.py ← keying (delegates to remove_magenta) + slicing + scaling → output/new/
│       ├── scripts/remove_magenta.py ← HSV flood-fill chroma key: border BFS + interior removal + defringe
│       ├── scripts/deploy_assets.py  ← copies processed → assets/pixel/
│       ├── scripts/manifest.py      ← generate sprite sheet metadata JSON
│       ├── scripts/gpt_image.py     ← GPT image pipeline (gpt-image-1.5): generate + batch process
│       ├── scripts/slice_ui_kit.py  ← auto-detect + slice UI kit sprite sheet into individual elements
│       ├── scripts/composite_scorecard.py ← scorecard test image compositor (see docs/SCORECARD_IMAGE.md)
│       ├── USAGE.md                 ← full documentation for all pipeline scripts
│       └── asset-prompts.json       ← asset definitions + processing configs
└── assets/
    ├── fonts/                       ← Bungee-Regular, IBMPlexSans-{Regular,SemiBold,Medium}
    └── pixel/                       ← all pixel art assets by type
        ├── brand/                   ← FF_logo.png (stacked), FF_logo_horizontal.png
        ├── arena/                   ← 4 scene backgrounds (sf, nyc street, nyc penthouse, dc)
        ├── ui/                      ← UI kit sliced elements (frames, buttons, bars, badges) + header_bar.png
        └── sprites/                 ← 107 CEO sprite sheets + manifest.json
```

---

## Configurable Variables

All of these live in `/config/constants.ts`. They can be adjusted post-launch without code changes. Never hardcode these values anywhere else.

```typescript
// Scorecard drop window (times in ET). Canonical names are DROP_WINDOW_*;
// SCORECARD_WINDOW_* aliases are retained for backward compat with
// computeDropTime.ts until the migration is done.
export const DROP_WINDOW_START_DAY = 5;        // Friday
export const DROP_WINDOW_START_HOUR = 18;      // 6pm ET
export const DROP_WINDOW_END_DAY = 6;          // Saturday
export const DROP_WINDOW_END_HOUR = 16;        // 4pm ET

// Week boundary for event storage (scored week = Sat → Fri)
export const WEEK_START_DAY = 6;               // Saturday
export const WEEK_START_HOUR = 0;              // 12:00am local

// Scorecard — suppress card + notification below this avoid count
export const MIN_AVOIDS_FOR_DROP = 1;

// Scorecard — presentation window (card takes over Scorecard tab for 48h
// after drop, then falls back to LivePreview + archive)
export const SCORECARD_PRESENTATION_WINDOW_MS = 48 * 60 * 60 * 1000;

// Scorecard — archive ceiling (oldest dropped when exceeded)
export const SCORECARD_ARCHIVE_MAX = 104; // 2 years of weekly cards

// Extension flagging frequency
// Options: 'session' | 'daily' | 'weekly'
export const EXTENSION_FLAG_FREQUENCY = 'session';

// FEC API cache TTL
export const ENTITY_CACHE_TTL_DAYS = 60;

// Confidence score thresholds (0–1 scale)
export const CONFIDENCE_THRESHOLD_HIGH = 0.85;
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.60;

// OpenFEC API base URL — primary data source
export const FEC_API_BASE_URL = 'https://api.open.fec.gov/v1';

// Curated entity list update URL
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/idontlikecodemuch/fckfascists-data/main/entities.json';

// Drop schedule is computed deterministically on-device — no CDN fetch needed.
// See core/dropSchedule/computeDropTime.ts. V2: optional server override — see Known Limitations.

// Info / FAQ / transparency content — editable in the data repo without an app release
export const INFO_CONTENT_URL = 'https://raw.githubusercontent.com/idontlikecodemuch/fckfascists-data/main/info.json';

// Map POI tap search — dynamic radius computed from visible region span.
// Default fallback when region is unavailable; min/max clamps for the dynamic calculation.
export const POI_SEARCH_RADIUS_METERS = 50;
export const POI_SEARCH_RADIUS_MIN_METERS = 15;
export const POI_SEARCH_RADIUS_MAX_METERS = 200;
export const TAP_CACHE_TTL_MS = 60 * 1000; // 60 seconds
export const TAP_DEBOUNCE_MS = 500;

// Minimum safe area top padding for absolute overlays and screens that don't use
// SafeAreaView. Floor for non-notch devices; notch/island devices use the larger
// system inset via Math.max(insets.top, SAFE_AREA_TOP_MIN).
export const SAFE_AREA_TOP_MIN = 52;

// Barcode scanning (Scan tab)
export const OPEN_FOOD_FACTS_API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';
export const BARCODE_LOOKUP_CACHE_TTL_DAYS = 30;
export const BARCODE_SCAN_GUIDE_HEIGHT = 128;
export const BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT = 14;

// People list update URL
export const PEOPLE_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/idontlikecodemuch/fckfascists-data/main/people.json';

// Thursday nudge notification — reminds users to log avoids before Friday scorecard drop.
export const NUDGE_DAY = 4;    // Thursday (0 = Sunday)
export const NUDGE_HOUR = 19;  // 7pm local time

// Default platforms pre-checked on setup screen — derived from platforms.json
// defaultSelected: true flags. Exported from features/Platforms/data/platformList.ts,
// NOT in constants.ts. Edit assets/data/platforms.json to change defaults.

// Shared FX system — avoid celebration timing
export const FX_AVOID_DURATION_MS = 3000;
export const FX_AVOID_FADE_MS = 400;

// Launch screen art bounds
export const LAUNCH_HERO_LOGO_MAX_WIDTH = 220;
export const LAUNCH_HERO_LOGO_MAX_HEIGHT = 140;

// Track screen animation timing
export const ARENA_TRANSITION_MS = 500;
export const ARENA_HIT_FX_MS = 800;
export const ARENA_SAME_FIGURE_PULSE_MS = 220;
export const ARENA_HEIGHT = 200;
export const DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS = 2000;
export const DAY_CIRCLES_COLLAPSE_STAGGER_MS = 80;
export const DAY_CIRCLES_ANIMATE_MS = 300;

// Track screen layout tuning — 30+ TRACK_* constants for row/arena/sprite sizing.
// See config/constants.ts for full list. All visual sizing for the platform list
// lives here so the entire appearance can be tuned without opening component files.

// BusinessCard slide-in / dim animation — shared by Map + Track via
// core/ui/useCardOverlayAnimation.ts. Single tuning knob across surfaces.
export const CARD_OVERLAY_SLIDE_DISTANCE = 600;
export const CARD_OVERLAY_SLIDE_IN_MS = 280;
export const CARD_OVERLAY_SLIDE_OUT_MS = 220;
export const CARD_OVERLAY_DIM_PEAK_OPACITY = 0.4;

// Controls whether the public figure / CEO name is shown in specific UI contexts.
// SHOW_FIGURE_NAME_IN_CARD: false — business card is an informational FEC data screen.
// SHOW_FIGURE_NAME_IN_POPUP: true — extension popup benefits from confrontational framing.
export const SHOW_FIGURE_NAME_IN_CARD  = false;
export const SHOW_FIGURE_NAME_IN_POPUP = true;
```

---

## Data Model

### What IS stored (local only)

```typescript
// A user tapped "Avoided" on a flagged business
EntityAvoidEvent {
  entityId: string       // references canonical entity list
  date: string           // YYYY-MM-DD only — no time, no location
  count: number          // increment
}

// A user tapped "Avoided" on a tracked platform
PlatformAvoidEvent {
  platformId: string     // references static platform list
  date: string           // YYYY-MM-DD only — no time, no location
  count: number          // accumulated avoid count — DB owns the increment
}

// Cached FEC API result
LocalCache {
  key: string                        // normalized(brandName + areaHash) — NOT lat/long
  fecCommitteeId: string
  donationSummary: DonationSummary | null
  confidence: number                 // 0–1; compare against CONFIDENCE_THRESHOLD_HIGH/_MEDIUM at render time
  fetchedAt: number                  // Unix timestamp — checked against ENTITY_CACHE_TTL_DAYS
}
```

### What is NEVER stored
- Any geolocation coordinates **except** avoided-entity pin coordinates (see exception below)
- Any browsing history or visited URLs
- Any record of visiting or using a flagged entity ("support" events)
- Any personal identifier (name, email, device ID)
- Any raw avoid event from a scored week after its scorecard image has been captured (see "Scorecard capture-then-purge" below)

### Privacy relaxation: avoided-entity pin coordinates
**Added 2026-04-03.** Map pin coordinates for avoided entities are stored locally in SQLite (`entity_avoid_pins` table). All data in `fuckfascists.db` is encrypted at rest (iOS: `NSFileProtectionComplete`, Android: FBE) — see "Data Encryption at Rest" in the Security section. Only coordinates for entities the user has actively avoided are stored — not scanned or tapped entities. Rows are auto-purged daily. This enables the map to show today's avoided markers on app relaunch. Copy updated 2026-04-16 to disclose this behavior. **This is a candidate for rewrite** — the team may decide to revert to session-only pin storage if any coordinate persistence is unacceptable. See Known Limitations.

### Scorecard capture-then-purge — privacy upgrade
**Added 2026-04-18. Updated 2026-05-07.** When the weekly drop fires, the app aggregates the scored week's events into an image and then deletes those raw events scoped to `[weekOf, weekOf+7)`. After the transition:

- **What persists:** the rendered card image (current format `.jpg`, legacy `.png` accepted) in `FileSystem.documentDirectory/scorecards/`. The image is a derivative — it shows aggregated per-CEO counts and a weekly total. It contains NO timestamps, NO surface indicators (map/scan/track), and NO per-day breakdown. The raw event log cannot be reconstructed from it.
- **What's deleted:** all `EntityAvoidEvent` and `PlatformAvoidEvent` rows within `[weekOf, weekOf+7)`. Scoped purge only — the live week still in progress is never touched (`purgeScoredWeekAvoidEvents` in `core/data/eventStore.ts`).
- **Gating:** purge runs ONLY after `captureCard` returns a successful result. If capture fails (disk full, render error, app killed), the raw events are retained and the next Scorecard tab visit retries. Never silently destroys data on failure.
- **Empty weeks:** if `grandTotal < MIN_AVOIDS_FOR_DROP` at drop time, no card is captured, no purge runs, the drop notification is cancelled (`scorecard-drop` identifier only, Thursday nudge preserved), and the tab shows the empty state during the presentation window. Raw events for that empty week fall through to the normal `purgeOldAvoidEvents` weekly rollover (`App.tsx:54`).
- **Launch-resilient:** if the user was offline when drop fired, the first app open after drop runs the same flow — aggregate → capture → purge → present.

This is a privacy *upgrade* vs. the prior model, which kept raw events until the next Sat-midnight app launch. The card image replaces a multi-row SQL table with a single bitmap that is structurally less invasive.

---

## Entity Matching Pipeline

This logic lives in `/core/matching/` and is shared between the mobile app and the browser extension. Do not duplicate it.

```
1. Normalize input name (lowercase, strip punctuation, trim)
2. Check canonical entity list aliases (exact match → confidence 1.0)
3. If no match → call FEC searchCommittees with normalized name
4. Score each result using Jaro-Winkler similarity
5. Pick best match:
   - score >= CONFIDENCE_THRESHOLD_HIGH (0.85)  → call orgSummary, display
   - score >= CONFIDENCE_THRESHOLD_MEDIUM (0.60) → call orgSummary, display with disclaimer
   - score < CONFIDENCE_THRESHOLD_MEDIUM (0.60)  → no flag, show "Not confidently matched" + FEC.gov search link
6. Cache result in LocalCache with TTL
```

**Never claim certainty the data doesn't support. Always show the confidence label.**

---

## Data Pipeline Scripts

These scripts are run locally by maintainers — never in CI. Prefer local bulk workflows when `tools/fec-bulk/` is staged. FEC API scripts still exist for discovery/fallback, but they hit external APIs and must be flagged before running.

### `npm run verify:entities`
Verifies `fecCommitteeId` for each entity in `assets/data/entities.json` via the FEC API.
Searches by canonical name, scores results with Jaro-Winkler, and populates `fecCommitteeId`
when a confident match is found. Marks confirmed no-PAC entities with `fecCommitteeId: null`.

Requires `FEC_API_KEY` for maintainers. Do not run without flagging the user first.

### `npm run verify:entities:bulk`
Verifies likely entity `fecCommitteeId` values against local FEC committee master files (`tools/fec-bulk/cm*.txt`) without using the FEC API. It is intended for broad entity expansion passes before donation hydration. The matcher is conservative: it uses PAC committee types only, rejects campaign-like names, prefers connected-organization evidence, and writes a review report at `tools/fec-bulk/reports/entity-bulk-verification-review.json`.

Useful flags:

- `--last-verified-date=YYYY-MM-DD` limits the run to newly-added/unverified entities from that batch.
- `--ids=a,b,c` limits the run to specific entity IDs.
- `--dry-run` writes the review report without modifying `entities.json`.
- `--mark-no-match-null` marks no-match entities as confirmed no-PAC; use only after review.

Do not blindly promote `nearMisses` from the report. Treat them as leads for manual review because short aliases can produce plausible but wrong matches.

### `npm run fetch:donations`
Pre-fetches FEC donation totals for all entities with a verified `fecCommitteeId` and writes `donationSummary` to `entities.json`. The matching pipeline uses bundled data directly when present and fresh, skipping live FEC calls.

- Fresh entries (within `ENTITY_CACHE_TTL_DAYS` of `lastVerifiedDate`) are skipped. Use `--force` to re-fetch all.
- Line 29 state/local disbursements are classified when direct FEC party fields are blank. Priority order: latest local beneficiary classification report (`tools/fec-bulk/reports/committee-beneficiary-classification-*.json`), committee master party (`tools/fec-bulk/cm*.txt`), curated committee overrides, then OpenStates legislator fuzzy match by name + state. Use `--no-classify` only when intentionally reproducing pre-classification behavior.
- `--dry-run` exercises the fetch/classification path without writing `entities.json`; it still calls the FEC API and must be flagged first.
- On failure, `lastVerifiedDate` is cleared so the entity retries on the next plain run.
- Progress saves every 10 fetches — safe to interrupt and restart.
- **Rate limiting** — sliding-window `RateLimiter` class: `COMMITTEE_RPM=30`, `SCHEDULE_B_RPM=8`. On 429: exponential backoff (60s→120s→240s, max 300s, 3 retries). Do NOT reintroduce fixed delays (`FETCH_DELAY_MS` etc.).
- See script header comments in `fetch-donation-data.mjs` for Schedule B attribution details and known FEC API quirks.

Requires `FEC_API_KEY` for maintainers. Do not run without flagging the user first. When local bulk data is staged, prefer `npm run hydrate:entities:bulk` for broad hydration and reserve this script for targeted fallback or API comparison.

### `npm run download:openstates`
Downloads OpenStates current legislator CSVs into `data/openstates/all-legislators.csv` for the Line 29 classifier. This hits `data.openstates.org` but does not require an API key. The output is local/generated and gitignored. Run after major state-legislator turnover or before a donation refresh that relies on state/local classification.

### `npm run audit:aliases`
Audits entity aliases for exact duplicates, single-word substring collisions, parent/child alias overlap, and FEC canonical-name drift. It makes no API calls and does not modify data. Run after each entity batch before hydration or product rebuilds.

### `npm run hydrate:entities:bulk`
Hydrates corporate/entity PAC donation summaries from local FEC PAS2 and OTH bulk files. Uses cycles `2016, 2018, 2020, 2022, 2024, 2026`, the latest local Line 29 beneficiary classification report, local committee/candidate/linkage files, and Schedule-B-like OTH rows. This is the preferred broad entity hydration path when `tools/fec-bulk/` is staged. It makes no API calls, writes `assets/data/entities.json`, and creates `assets/data/entities.pre-bulk-hydration.json`.

Run `npm run audit:aliases` and `node scripts/verify-data-integrity.mjs` after this script.

### People bulk scripts
`npm run build:people:bulk-top`, `npm run sync:people:bulk-top`, `npm run hydrate:people:bulk`, `npm run build:people:entity-review-queue`, and `npm run strip:people:raw` maintain `people.json` and `people.bundle.json` from local FEC individual-contribution bulk files. Cycles include `2026`. `sync:people:bulk-top` keeps extra pre-existing people by default; `--drop-extra` intentionally discards people outside the top-donor merge and should be treated as destructive.

The hydrator matches FEC contributor-name rows to our people using FEC-flavored fuzz (`scripts/lib/fecNameFuzz.mjs`, a verbatim port of openFEC's `parse_fulltext`). It tokenizes on `\W+`, strips non-ASCII via NFKD + ascii-ignore, and requires every query token to prefix-match some field token (Postgres tsquery `:*` AND semantics). This matches FEC's web UI coverage exactly — if FEC's site returns a row for a contributor_name query, ours does too. Name variants (`BEZOS, JEFF` ↔ `BEZOS, JEFFREY PRESTON`) no longer need to be pre-enumerated in `fecSearchNames`, though the field remains supported as an escape hatch for exotic filings.

Preferred order (bulk-first; API only for targeted validation):

1. `npm run build:people:bulk-top`
2. `npm run sync:people:bulk-top`
3. `npm run hydrate:people:bulk`
4. `node scripts/build-committee-beneficiary-map.mjs --basename=committee-beneficiary-classification-YYYY-MM-DD` — rebuild committee-cycle classification from local bulk (no API)
5. `node scripts/build-people-classification-preview.mjs --basename=people-classification-preview-YYYY-MM-DD` — apply beneficiary + inherently partisan classifications to a staging `.people.json` preview (does not touch live)
6. Review preview totals (`*-people-classification-preview-*.md`), then apply: `cp tools/fec-bulk/reports/people-classification-preview-YYYY-MM-DD.people.json assets/data/people.json`
7. `npm run build:people:entity-review-queue`
8. `node scripts/build-people-discovered-committees.mjs` — review queue of committees in raw[] not yet covered by any live entity (`entity_candidate` / `classify_only` / `leadership_pac_classify_only` / `unknown_committee`)
9. `node scripts/reconcile-v1-entities.mjs --write`
10. `npm run strip:people:raw`
11. (Optional canary) `node scripts/validate-people-fec-coverage.mjs --person=jeff-bezos --api` — one FEC API call to spot-check a person's coverage vs. Schedule A

### `python3 scripts/sync-products-from-off.py`
Processes the Open Food Facts MongoDB bulk dump into `assets/data/products.json`. Scans ~4.4M product documents, extracts exact barcode product rows plus UPC prefix evidence per producer, and outputs a three-layer index: exact runtime `products` (1,000 rows in the April 2026 data-cleaning batch), conservative runtime `producers` (87 entries), and broader `producerResearch` (206 entries for future expansion). Rebuilds read current `entities.json` to refresh product-side entity match fields before runtime producers are built, including clearing stale product-side `entityId` values after alias cleanup. Checkpoint-based resume (`tools/off-bulk/checkpoints/`). Requires the OFF bulk archive at `tools/off-bulk/openfoodfacts-mongodbdump` (not committed — 91GB+). Use `--rebuild-from-checkpoint --exact-product-limit 1000` to regenerate `products.json` from saved aggregates and the 5,000-row exact-product candidate pool without rescanning. Philip Morris International and Altria currently resolve to distinct runtime entity IDs. See `docs/PRODUCTS_DATA_PIPELINE.md` and `docs/DATA_CLEANING_AUDIT_2026-04-20.md` for details and current audit caveats.

### `node scripts/generate-arena-assets.mjs`
Scans `assets/pixel/arena/` for PNG files and regenerates `core/arena/arenaAssets.ts` — a static `require()` map used by `GameArena`. Run this after adding or removing arena background images. The generated file should be committed to the repo (Metro bundler requires the static `require()` strings at build time).

### `node scripts/verify-data-integrity.mjs`
Audits data integrity across `entities.json` and `people.json`. Checks: duplicate IDs, forward refs (entity → person), reverse-link gaps (bidirectional integrity), role mismatches in `rolesByEntity`, GPT pass integrity, and stale documentation. Run after any entity/person data changes. Does not make API calls — safe to run anytime.

### `node scripts/reconcile-v1-entities.mjs`
Reconciles `entities.json` against `people.json` for V1/V2 separation. Adds reverse `associatedPersonIds` to live entities, keeps `entities.json` aligned only to live V1 IDs. Preserves V2-only forward refs in `tools/fec-bulk/reports/people-v2-deferred-entity-links.json` so deferred links are recoverable. Run after people data updates.

---

## Scorecard — Drop Mechanics

The weekly scorecard is a synchronized global event. Every user with the same app version receives it at the exact same moment — computed entirely on-device with no network dependency.

### Drop timing
- Drop time is computed deterministically via PRNG in `core/dropSchedule/computeDropTime.ts` — same ISO week year + week number always produces the same result on every install, forever.
- Seed: djb2 hash of `"ff-drop-{year}-W{week}"` mod `WINDOW_HOURS` (22), mapped to an hour offset within the **Friday 6pm ET – Saturday 4pm ET window** (22 hours, EST = UTC-5 hardcoded for MVP). Window is controlled by `DROP_WINDOW_START_HOUR` / `DROP_WINDOW_END_HOUR` in `config/constants.ts` — `SCORECARD_WINDOW_*` aliases remain for backward compat with `computeDropTime.ts`.
- Collision rule: if this week's hour matches last week's, advance by 1 hour (wrapping within the window) — fully deterministic.
- No network fetch for the schedule — `useDropSchedule` calls `getCurrentDropTime()` synchronously, no loading state.
- Push notification is scheduled locally at the computed drop moment via Expo Notifications. Identifier is `SCORECARD_DROP_NOTIFICATION_ID = 'scorecard-drop'` — scoped cancel-and-reschedule preserves the Thursday nudge (`platform-nudge-thursday`).
- Notification carries `content.data = { type: 'scorecard-drop' }`. `AppShell` routes on `data.type`, not the human-readable title, so copy edits don't break cold-start or warm-start routing.

### Post-drop flow (capture → purge → present)
This is the full lifecycle and it ties directly to Principle #9:

1. **Drop fires** (or first app open after a missed drop). `ScorecardScreen`'s post-drop effect runs.
2. **Gate on avoid count**: if `grandTotal < MIN_AVOIDS_FOR_DROP`, show empty state, cancel the `scorecard-drop` notification only, and return. No capture, no purge.
3. **Check for the scored week's existing card** via `findCardForWeek(scoredWeekOf)`. This is an exact filename match for the week represented by the drop, with `.png` legacy fallback. Older archive cards must never satisfy a new drop.
4. **Otherwise, capture**: mount `ScorecardImage` off-screen, `captureRef` to a JPEG, move to `scorecards/Those-I-FCKd-{Month}-{DD}-{YY}.jpg`. Loader shows `"Locking in my card. Shredding the data."` during this transition.
5. **Purge scoped events** via `purgeScoredWeekAvoidEvents(adapter, scoredWeekOf)` — runs ONLY if capture succeeded. Scope is strictly `[scoredWeekOf, scoredWeekOf+7)` so the live week can never be touched. Failure is non-fatal (card is already saved); next weekly rollover handles leftovers.
6. **Present** if we're within the 48h window (`SCORECARD_PRESENTATION_WINDOW_MS` from `schedule.dropAt`). Past that, fall through to `LivePreview` for the new live week. The card remains reachable via "Past scorecards."

### Presentation window
- **48h from drop moment.** Controlled by `SCORECARD_PRESENTATION_WINDOW_MS` in `config/constants.ts`.
- Inside the window: Scorecard tab is a full-screen takeover with SHARE button.
- Outside the window: tab returns to `LivePreview`; the card moves silently into the "Past scorecards" archive (sorted by file mtime, newest first).

### weekOf rollover — exact scored-week lookup
`getLocalWeekStart()` returns the Saturday starting the current local week — it advances at Saturday midnight local. The drop can still be in its presentation window after that rollover, so `ScorecardScreen` computes `scoredWeekOf` from `schedule.dropAt` via `getScoredWeekOfDrop()` (anchor one day before the drop, then find that local Sat-Fri week). The post-drop flow aggregates, captures, purges, and checks archives with `scoredWeekOf`, not the live `schedule.weekOf`. This prevents an old archived card from short-circuiting a new drop while still avoiding Saturday-midnight orphaning.

### Filename format
`Those-I-FCKd-{Month}-{DD}-{YY}.jpg` — e.g. `Those-I-FCKd-April-11-26.jpg`. Built by `buildCardFilename(weekOf)` in `features/Scorecard/utils/formatters.ts`. The prefix echoes the card's hero sentence ("I FCKd [grid] N× this week"); reads like an inscription (riff on "To Those I Loved") when the share receiver sees it. Voice: Sh*tposter (user voice, first-person), non-vulgar, FCK substitution per the voice framework. Archive view renders a readable label via `formatCardLabel()` → `"April 11, 2026"`. Legacy `.png` cards remain readable and are matched by `findCardForWeek()`.

### PREVIEW stamp semantics
- **Real Friday drop:** no preview stamp on the captured card.
- **On-demand (dev tools, early generation):** the preview UI is explicitly stamped so test screenshots are not confused with the real synchronized drop. Spec: "the weekly drop retains its specialness."

### Capture-failure / offline behavior
- If `captureCard` returns `null` (view-shot error, disk full, timeout), the effect sets state back to `'preview'` and the raw events are **retained**. The next Scorecard tab visit retries. Under no circumstance is purge reached when capture failed.
- **Capture timeout:** `useCardCapture` races `captureRef` against `SCORECARD_CAPTURE_TIMEOUT_MS` (10s) via a `withTimeout` helper. A hung view-shot call rejects after the timeout and falls through to the retain-on-failure path — the loader can't freeze the user indefinitely on "Shredding the data."
- Launch-resilient: the post-drop effect runs on every Scorecard mount, not just on drop-fire, so a user who missed the drop moment triggers the same flow on their first visit after.

### Extension data
Extension data is NOT included in the scorecard (V1) — extension has its own in-popup weekly summary. Structurally enforced: mobile SQLite and extension `chrome.storage.local` have no sync path.

**V2:** An optional lightweight server ping may add schedule overrides — see "Known Limitations / Technical Debt → V2: Optional Server Schedule Override."

---

## Browser Extension Behavior

- **Icon turns amber** when user visits a tracked domain — no popup, no banner, no interruption
- User clicks icon to open popup with business card (donation data, confidence, FEC link) + "AVOIDED" button
- Flags **once per session per domain** by default (configurable via EXTENSION_FLAG_FREQUENCY)
- User can snooze a domain ("don't remind me for 7 days")
- **No browsing history stored** — domain detection is in-memory only, cleared on session end
- Extension has its own simple weekly summary in the popup — does not feed into the mobile scorecard in V1

### Extension — FEC API key
- **No API key is used or stored** — the extension always calls the FEC API in anonymous mode (no `api_key` param). FEC anonymous rate limits are per-IP and sufficient for individual users. A shared key would pool all users against one limit, which is a scaling problem.
- **No options page exists** for API key configuration — do not create one.
- `FECClient` is constructed with `{ apiKey: '' }` to prevent `process.env` access in the browser context while keeping the client in anonymous mode.

### Extension — donation data priority order
When a flagged domain is detected, `handleCheckDomain` resolves donation data in this order:
1. **Fresh local extension cache** (`ext:{entityId}` in `chrome.storage.local`) — populated by previous live calls
2. **Bundled `entity.donationSummary`** — primary path; used when present and `isBundledDataFresh()` returns true (within `ENTITY_CACHE_TTL_DAYS` of `entity.lastVerifiedDate`). No API call made.
3. **Anonymous live FEC call** — fallback when bundled data is absent or stale; result written to local cache
4. **Stale bundled data** — used when the live call fails and bundled data exists (even if expired)
5. **No data** — `noBundledData: true` on `TabFlag`; popup shows "No bundled donation data." (not "temporarily unavailable")

---

## Canonical Entity List

- Single JSON file covering: top 500 US companies, top 500 retailers, top 500–1,000 GOP-donating orgs
- Hosted publicly on GitHub — community can view, fork, and submit PRs
- Bundled with the app at build time (works offline from day one)
- App fetches updates periodically from ENTITY_LIST_UPDATE_URL and caches locally
- Domain mappings (amazon.com → Amazon → Jeff Bezos) live in the same list

### Future expansion: non-corporate entities
V1 covers for-profit corporations and their PACs. Add foundations (e.g. Gates Foundation), NGOs / nonprofits (e.g. Goodwill, ASPCA), and family offices in a later release — users will reasonably search for these.

### Entity schema
```typescript
{
  id: string
  canonicalName: string              // matches FEC committee/organization name
  aliases: string[]                  // consumer-facing brand names
  domains: string[]                  // for extension matching (e.g. ["amazon.com"])
  categoryTags: string[]
  ceoName: string                    // operational CEO — scorecard display
  publicFigureName?: string          // culturally recognizable figure (e.g. Bezos for Amazon); getDisplayFigure() resolves
  parentEntityId?: string            // links subsidiary to parent by id
  associatedPersonIds?: string[]     // refs to people.json — unused in V1 display
  fecCommitteeId?: string | null     // string=confirmed ID, null=confirmed no PAC, ""=unverified
  fecCommitteeRecords?: FecCommitteeRecord[] // dissolved+active PAC history; { id, status, registeredYear?, dissolvedYear? }
  verificationStatus: 'manual' | 'pipeline' | 'unverified'
  donationSummary?: DonationSummary  // bundled by fetch-donation-data.mjs; used when fresh
  lastVerifiedDate: string           // YYYY-MM-DD
}
```

---

## Environments

```typescript
// Environment config in .env files, never committed. See .env.example.
// FEC_API_KEY optional for app (anonymous mode); required only for FEC API pipeline scripts.

DEV   — local build, verbose logging on, real API calls (FEC_API_KEY recommended in .env)
TEST  — jest, mocked API responses only here
PROD  — release build, logging off, real API calls (FEC_API_KEY optional — anonymous mode)
```

---

## Code Quality Rules

These apply to every file, every PR, every AI-generated change.

- **Architecture before patches** — before changing anything, ask whether the design itself is the problem. Incremental fixes on a broken foundation compound debt. If a structural change is needed, flag it and explain why before executing — never silently restructure.
- **Prefer the simplest solution** — no over-engineering, no premature abstraction
- **No duplication** — check the codebase before adding anything. The matching logic in `/core/matching/` is the one source of truth for both mobile and extension
- **Files over 250 lines must be refactored** — split before continuing
- **Scoped exception — maintainers-only bulk/report scripts** — files under `scripts/` and private helpers under `scripts/lib/data-classification/` may exceed 250 lines when they implement a single audited bulk-data transformation and further splitting would materially increase regression or review risk. In those cases, extract shared helpers/formatters first, keep runtime/app code under 250 lines, and document the exception in the relevant handoff/progress notes.
- **No mock or stub data in dev or prod** — mocks live in tests only
- **Never overwrite a key file without confirming** — explain why first
- **Only make requested changes** — do not refactor unrelated code while fixing something else
- **When fixing a bug** — exhaust the existing pattern before introducing a new one. If you do introduce a new pattern, remove the old implementation
- **Environments are cleanly separated** — no prod config leaking into dev and vice versa
- **No one-off scripts in source files** — if a script only runs once, it doesn't belong in the codebase
- **Flag before running scripts** — do not run unnecessary, unsafe, or potentially destructive scripts without flagging them first. Safe operations (`npm install`, `pod install`, `tsc --noEmit`, `jest`, build commands) are fine. Data pipeline scripts that make external API calls (`fetch:donations`, `verify:entities`, `fetch:people`) or modify data files should be flagged with what they do and what they'll change before execution. Never run scripts that could cost money, hit rate limits, or modify production data without explicit approval.
- **All visual constants from design tokens** — colors, spacing, typography, borders, and accessibility values must be imported from `design/tokens.ts`. Never hardcode hex values, pixel measurements, or font names in components. See `design/component-rules.md` for per-component token usage.
- **Outer-halo glows use `glow()` helper** — for `boxShadow` halos around an element (not insets, not drop-shadows), use `glow(hex, intensity)` from `design/glow.ts`. Pass any color (`theme.colors.rewardYellow`, `focusAccent`, `glowCyan`, etc.) and pick `'subtle' | 'mid' | 'strong'` from `theme.glow.intensities`. Color is parameterized so we don't grow a combinatorial color × intensity token table. Bespoke patterns (3-stop emissive, 2-color layered, single-stop tight rim) stay hand-tuned. Inset glows + dividers continue to use the legacy `theme.glow.{color, colorDefeated, colorHighlight, blurRadius, ...}` fields — different concept.

---

## Git Workflow Rules

These rules prevent the branch sprawl, orphaned worktrees, and build-state drift that plagued the repo through March 2026. Follow them strictly.

### Branch discipline
- **`main` is always deployable.** Every commit on `main` must type-check and pass tests. Do not push broken code to `main`.
- **One feature = one branch.** Name it `{scope}/{short-description}` (e.g. `feat/barcode-scan`, `fix/map-crash`, `data/people-v2`). Delete it after merging.
- **Do not create parallel branches for the same work.** If a branch exists for a task, continue on that branch — do not fork a new one from a different base.
- **Rebase or squash before merging to main.** The main branch should have clean, readable history. Avoid merge commits when possible.
- **Push feature branches to origin** so other agents/sessions can see them. Do not accumulate local-only branches.

### Worktree hygiene
- **Claude Code worktrees are ephemeral.** They exist for one session's work. When done, commit, push, and remove the worktree.
- **Limit active worktrees to 2** — one for the current session, plus optionally one for paused-but-active work (e.g. a data pipeline branch awaiting review). If you see stale worktrees with no unique unpushed commits, remove them.
- **The main worktree must stay on `main`** unless you are actively working on a feature branch and will switch back when done. Never leave the main worktree parked on a stale feature branch.
- **After pushing from a worktree, fast-forward local main** — run `git pull --ff-only origin main` in the main worktree so Xcode builds reflect the latest code.

### Before committing
- **Stage specific files** — never `git add -A` or `git add .`. Review what you're committing.
- **Check that new dependencies have matching lockfile + iOS pod entries.** If you add a dep to `package.json`, the `Podfile.lock` and `project.pbxproj` must be updated before committing (run `npm install && cd ios && pod install` locally).
- **Never commit scratch/working files** (e.g. `entities_GPTpass.json`). Add them to `.gitignore` first.
- **Never commit bulk data files.** The `tools/fec-bulk/` directory is 91GB+. It is gitignored. If you create new bulk data directories, gitignore them immediately.

### After merging
- **Delete the merged branch** (local and remote). Do not accumulate dead branches.
- **Prune remote tracking refs** — `git remote prune origin` after deleting remote branches.
- **Verify `main` is current** — `git pull origin main` in the main worktree.

### What NOT to do
- Do not squash-merge a subset of a branch's changes to main and then continue working on the original branch. This creates diverged histories that are painful to reconcile.
- Do not create worktrees from feature branches. Worktrees should branch from `main`.
- Do not park uncommitted changes in the main worktree for days. Either commit them on a branch or stash them.

---

## Copy Management Rules

All user-facing strings live in `copy/` (mobile) or `extension/copy.ts` (extension). Components import from these files. Never hardcode a user-facing string in a component.

- **copy/ structure:** beta.ts, info.ts, infoContent.ts, launch.ts, map.ts, onboard.ts, platforms.ts, scan.ts, scorecard.ts, shared.ts
- **Extension:** extension/copy.ts (separate — vanilla JS cannot import from RN copy files)
- **Naming:** two-level max (area.element). No `a11y` prefix — use `Label` or `Hint` suffix only when paired with a visible string. Abbreviate: onboarding→onboard.
- **Dynamic strings** are arrow functions: `heading: (n: number) => \`${n} MATCHES\``
- **Static strings** are plain values: `title: "INFO"`
- **New features:** add copy entries to the relevant copy file BEFORE building the component. The copy file is the spec. The component is the consumer.
- **Copy review changes:** edit copy files only. No component changes needed for pure copy updates.
- **CC prompt rule:** any prompt that creates or modifies a component with user-facing text must include: "All user-facing strings must be imported from the corresponding file in copy/. Do not hardcode any user-facing string in a component."
- **Audit:** run `bash scripts/audit-copy.sh` at the end of any session that creates or modifies UI components. Fix any hits before committing.
- **Info editorial content** (FAQ answers, about text, methodology) lives in `copy/infoContent.ts` as a bundled default. `useInfoContent` hook fetches from `INFO_CONTENT_URL` in the background and replaces bundled content if a valid update is available. Fetch failure silently falls back to bundled. This is the same pattern as entities.json: bundled first, fetch if available, stale bundled as fallback.
- **Info UI chrome** (section headers, labels, icons) stays in `copy/info.ts` — bundled only, updated via app releases.
- **Copy-preview tool sync** — `tools/copy-preview/` contains an interactive HTML review tool with a consolidated `copy-all.json` (flat JSON of all copy files) and `copy-all.js` (auto-generated JS wrapper). **After any session that modifies copy files, regenerate both files** to keep the review tool in sync. Regeneration: update `copy-all.json` by hand (flatten functions to `{param}` templates, arrays to dot notation), then run `node -e "const j=require('./tools/copy-preview/copy-all.json');require('fs').writeFileSync('./tools/copy-preview/copy-all.js','// Auto-generated from copy-all.json — do not edit directly.\nvar COPY_ALL_DATA = '+JSON.stringify(j,null,2)+';\n')"`. Also update `SURFACE_COPY_MAP` in `index.html` if keys were added, removed, or renamed.

---

## AI Agent Efficiency

- **Minimize token-heavy payloads** — never paste full JSON entities or complete fetch output into the lead architect session. Ask CC to report specific field values inline. Truncate fetch outputs to the first 10 lines + summary footer.
- **Delegate diagnostics to CC** — use the lead architect for decisions and prompts; use CC for investigation and reporting findings in summary form only.
- **Status updates should be minimal** — "Done, clean" is sufficient when there are no issues. Only report exceptions and errors in full.

---

## Accessibility Requirements (non-negotiable)

- Dynamic Type support on all text elements
- VoiceOver (iOS) and TalkBack (Android) labels on every interactive element
- High-contrast mode compatibility on all screens
- Reduced-motion: all pixel art animations must respect the system reduced-motion setting — static pixel art remains, animations are disabled
- Minimum tap target: 44×44pt on all interactive elements
- The retro 8-bit aesthetic must never come at the cost of usability

---

## Visual Design System

The entire app is styled as a **vintage 8-bit video game**. This is the foundational design language, not a skin.

- Chunky, pixelated components with hard edges
- Limited color palettes per screen (4–6 colors, NES/Game Boy era)
- Pixel art fonts — paired with system fallback for Dynamic Type scaling
- Pixel art animations for feedback events (avoid taps, streaks, scorecard reveal)
- Custom assets designed by the team: logo, CEO avatars, business icons, badges, map markers, scorecard frame
- Retro sound effects (optional, off by default, user-toggleable)

---

## Current Sprint Focus

**Phase 1 MVP — feature status:**

| Feature / Milestone | Status |
|---|---|
| Core models, matching pipeline, FEC API client | ✅ Done |
| SQLite adapter (`app/storage/SqliteAdapter.ts`) | ✅ Done |
| Map scan, flag, business card, avoid tap | ✅ Done |
| Platforms, Scorecard, Onboarding, Info screens | ✅ Done |
| Track screen rebuild (context-driven, flat layout) | ✅ Done — TrackProvider context (todayActions + recentlyDefeated), TrackHeader + GameArena + FlatList with PlatformGroupHeader/PlatformRow/AvoidButton/DayCircles. ArenaFX extracted. Sat–Fri week, per-figure arena backgrounds, past-day avoid triggers defeated sprite, StarField bg. All files ≤250 lines. |
| Track row full-height columns + sprite-screen | ✅ Done (2026-04-29) — PlatformRow rebuilt around full-row-height columns: sprite-screen left (44×44 cyan tint + focusAccent border + soft glow), AVOID button right (64×44 fills row), nameColumn middle. Focused row swaps borderLeft 3px for borderTop+borderBottom focusAccent rules (day-today convention extended row-wide); when expanded the bottom rule drops so the row + day-circles strip read as one continuous focusTint band closing on a focusAccent rule. `trackFocusTint` 0.08 → 0.18, `TRACK_TODAY_BAND_OPACITY` 0.12 → 0.30, `TRACK_DAY_CIRCLES_PADDING_*` 3/5 → 1/1, `TRACK_ROW_PADDING_*` 5/12 → 0/0, `TRACK_ROW_SPRITE_SIZE` 32 → 44, `TRACK_BUTTON_HEIGHT` 36 → 44, `TRACK_CHILD_INDENT` 56 → 64. JSX structure preserved — single styled `<View>` wrapper added around `FigureBadge`. Reference SVG at `tools/img-gen/reference/track-row-states.svg`. |
| Track screen full polish — uniform 48pt slices + cyan dimensional bevel + multi-platform group polish | ✅ Done (2026-05-01, `531ae65`) — `TRACK_ROW_SPRITE_SIZE` 44 → 48, `TRACK_BUTTON_HEIGHT` 44 → `TRACK_ROW_SPRITE_SIZE`, `TRACK_BUTTON_WIDTH` 64 → 56, `TRACK_GROUP_HEADER_PADDING_VERTICAL` 5 → 0, `TRACK_CHILD_ROW_PADDING_VERTICAL` 4 → 0, `TRACK_ROW_FACE_ANCHOR_Y` 0.5 → 0.42 (heads upper third). PlatformRow gets a 2-step gradient overlay (white 0.10 / black 0.28) + `panelFocusedRow` brighter fill + sub-row `panelFocusedChildRow` (`trackFocusBgDeep`) + row-level `rowSeparator` for non-last rows. PlatformGroupHeader: avatar mirrors row sprite-screen with right + bottom dividers; Bungee 14pt name; inline SEE FILE link; count `dangerRed` matches singleton; `panelFocusedContainer` cyan fill; bottom border `bevelLight`/`focusBevelDark`. AvoidButton: `bevelFocusRaised` active + `bevelGreenInset` done + `borderRadius: 0`. TrackList: `focusedPanelItemKeys` precomputation drives panel cap/sides cyan dimensional bevel; cap variants collapsed to bevel.width height (no fill gap); inline `isLastInGroup` lookup. New tokens `trackFocusBg #15243A` + `trackFocusBgDeep #0B1422`. `listData.ts` regex strips `Platforms` so `Meta Platforms Inc` → `META`. |
| Arena visual polish — 1px outline + 2px screen border + flush sprites + pumped flicker | ✅ Done (2026-05-01, `531ae65`) — `arenaFrame` flat 1px `focusBevelLight` outer outline (was `bevelFocusRaised` 2px raised plaque, dropped). New `gameArenaWrap` View wraps GameArena with `bgVoid` solid bg (defensive against StarField bleed) + 2px top + 1px other-sides cyan border framing the arena content as a "screen." `gridCell.paddingBottom: 2 → 0` so sprite art sits flush with yellow border. `grid` padding `space.sm` (8) → `space.md` (12). Pumped flicker: `ARENA_FLICKER_DIP_OPACITY` 0.35 → 0.10, intervals 4–14s → 2.5–8s, `DIP_MS` 90 → 120, `RECOVER_MS` 140 → 180 — reads as a CRT pulse instead of near-imperceptible. Separator below arena dropped translucent rgba bg + glow shadow (was leaking StarField), now an empty 8pt spacer. `TRACK_ARENA_SEPARATOR_HEIGHT` 4 → 8. |
| SEE FILE → BusinessCard overlay (Track) + shared slide-dim animation | ✅ Done (2026-05-01, `039d784`) — `BusinessCard` gains `hideAvoid?: boolean` prop. New `core/ui/useCardOverlayAnimation.ts(visible) → { slideY, dimOpacity }` shared by Map + Track via `CARD_OVERLAY_SLIDE_DISTANCE`/`SLIDE_IN_MS`/`SLIDE_OUT_MS`/`DIM_PEAK_OPACITY` constants — single tuning knob across surfaces. MapScreen: backdrop becomes persistent (gated on `persistentCardResult`, not `cardVisible`) + `dimBackdrop` style with animated opacity; card container becomes `Animated.View` with `translateY: slideY`; old `opacity: cardVisible ? 1 : 0` toggle dropped. TrackScreen: takes `entities` + `people` props; `cardEntityId` state; `cardResult` useMemo synthesizes `ScanResult` inline from the matched Entity; same hook + persistent-mount pattern (avoids Fabric sprite-clip). Top-level rows (singletons + group headers) get a SEE FILE inline link (folder-outline icon + IBM Plex Medium 10pt highlightBlue label) via `onSeeFile` prop wired through TrackList; tap focuses the row first then opens the card. AppShell threads entities/people to TrackScreen. |
| TabBar brand-yellow glow strip | ✅ Done (2026-05-01, `bd1e1a2`) — Replaced cyan strip above the tab bar with brand `rewardYellow` line + heavy multi-layer halo. Switched legacy `shadowColor`/`shadowRadius`/`shadowOpacity` to RN 0.76 `boxShadow` three-stop stack (blur 12 alpha 1.0 / blur 24 alpha 0.7 / blur 36 offsetY -4 alpha 0.4). Line 3px → 2px so halo carries the visual. |
| AvoidButton state-leak bug fix (Map BusinessCard) | ✅ Done (2026-05-01, `1c21723`) — `features/Map/components/AvoidButton.tsx` useEffect was a one-way sync (`if (initialConfirmed) setConfirmed(true)`) — symmetric reset was missing. After Apr 27's persistent-mount fix made `BusinessCard` reuse the AvoidButton instance across card opens, `confirmed=true` from a prior avoid leaked onto every subsequent (non-avoided) card, making them all read as already avoided. Fix: useEffect now two-way syncs both `confirmed` and `error` whenever `initialConfirmed` changes. Pre-existing bug, surfaced when the persistent-mount pattern reached Track. |
| Sprite face-anchor (canonical post-normalization) | ✅ Done (2026-04-29) — `SpriteView` accepts `faceAnchorX/Y` props; when set, computes `cropOffsetX/Y` dynamically from `SPRITE_FACE_NEUTRAL_X/Y = 0.52/0.23` or `SPRITE_FACE_DEFEATED_X/Y = 0.62/0.24` (selected by sprite `state`). Two pairs of constants in `config/constants.ts` measured from the normalize_sprites.py pipeline output — same for every sprite, defeated leans `+0.10` X. Per-Track-surface anchors: `TRACK_ROW_FACE_ANCHOR_X/Y = 0.5/0.5` (face dead center in row sprite-screen), `TRACK_ARENA_SINGLE_FACE_ANCHOR_X/Y = 0.5/0.3` (upper third), `TRACK_ARENA_GRID_FACE_ANCHOR_X/Y = 0.5/0.35`. Removes `TRACK_SPRITE_BUST_CROP_OFFSET_X/Y`, `TRACK_ARENA_GRID_CROP_OFFSET_X/Y`, `TRACK_ARENA_SINGLE_CROP_OFFSET_X/Y` (replaced by face-anchor math). `TRACK_GRID_SPRITE_SCALE: 1.0 → 0.93` so arena grid sprites fit inside the cell content area (cell - 2×border - paddingBottom). PlatformRow, PlatformGroupHeader, GameArena (single + grid) all use the face-anchor mode. Backward-compatible — non-Track surfaces (BusinessCard, Scorecard) keep their explicit `cropOffsetX/Y`. |
| Scorecard image — Claude Design "polished main" alignment | ✅ Done (2026-04-30) — `ScorecardImage.tsx` rebuilt to match `tools/img-gen/reference/fck-scorecard claude design/project/scorecard/index.html`. Composition: I FCK'D N× headline up top (Bungee 120, gold N× w/ glow), data panel with cyan corner-tick brackets, THIS WEEK alone bottom-right, footer with beam + 🤘 tagline + Bungee 58 cyan CTA + DATA: FEC.GOV. Person rows scaled up (sprite 200, name 52, count 104). Beam-flanked date header. Vignette via inset boxShadow; scanlines via tiled `assets/pixel/scorecard/scanlines.png`. Power bar reanchored to fixed bottom (520) with tier-proportional native height — tube stays in place, top decoration grows. New tokens: `scorecardCream #E8E0D0`, `scorecardDim #667788`. Extracted: `ScorecardImageHeader`, `ScorecardImageFooter`, `ScorecardImageDecorations` (Beam, CornerTick, Sparkle helpers). Test pipeline: `tools/img-gen/scripts/composite_scorecard.py` rewritten to match RN render; old preserved as `composite_scorecard_legacy.py`. Spec doc `docs/SCORECARD_IMAGE.md` extensively updated. |
| Browser extension (MV3, Chrome + Firefox) | ✅ Done |
| FEC entity verification run (`verify:entities`) | ✅ Done |
| Donation data bundled into `entities.json` | ✅ Done |
| Anonymous FEC API mode (no key required in app) | ✅ Done |
| Design system: tokens + 26 components migrated | ✅ Done — `design/tokens.ts` + all components use theme tokens |
| Pixel art assets: pipeline + deploy + wired | ✅ Done — 35 assets in `assets/pixel/`, FlagMarker + BusinessCard wired. 107 CEO sprites in `assets/pixel/sprites/`, wired into BusinessCard, PlatformRow, ScorecardView. 4-step keying pipeline with 1px alpha erosion. Brand logos wired (map header, launch, onboarding, icon, splash). 4 arena backgrounds wired into GameArena. UI kit sliced (30 elements): frames wired into BusinessCard + ScorecardView, buttons into AvoidButton + MapControls, input field into MapSearchBar, bar into TabBar, header bar into MapScreen. Eagle seal (`seal_eagle.png` + `seal_eagle_sm.png`) wired into manila folder card. |
| Design refinement: 8-bit game energy | ✅ Done — Map header bar, search bar depth, tab bar texture, BusinessCard sprite-left layout + donation hierarchy flip + reward overlay + sprite perch ON card, MatchChooser visual upgrade, GameArena tiled bg texture + rewardYellow cell borders, PlatformGroup parent company grouping + short names + hideSprite/compact child rows, InfoScreen collapsible transparency + section ornamentation, tap-to-dismiss backdrop, AvoidButton depth borders, global highlight lines reduced to 2px |
| Onboarding tightened (5→3 screens) | ✅ Done — Welcome, Privacy (WHAT WE DON'T DO), Permissions (BEFORE WE START). Privacy promise before permission request. |
| Beta testing mode | ✅ Done — triple-tap toggle, BetaOverlay, screenshot tool |
| Daily launch screen | ✅ Done — once per calendar day, rotating messages, 5s auto-dismiss, breathing logo animation |
| Avoid celebration animation + haptics | ✅ Done — card-local StampOverlay + MoneyParticles + screen shake + amber pulse (replaced former full-screen AvoidCelebration checkmark). FX system (`core/fx/`) still used by GameArena. |
| App built and running on iOS simulator | ✅ Done — `FckFascists.app` installed on iPhone 16 Pro simulator |
| Device visual refinement pass | ✅ Done — launch screen 5s + breathing logo, map header spacing, BusinessCard corners/z-index/sprite 150pt, SpriteView headOnly, GameArena full bleed + all-platforms roster, PlatformRow row-tap + auto-expand, TabBar texture 2x |
| BusinessCard rebuild + component extraction | ✅ Done — BusinessCard (168 lines), BusinessBanner + resolveCardMode (114), DataZone (161), DetailSheet (placeholder), useMapControls hook (73). Card/banner routing, FXLayer in MapScreen, all files under 250 lines. |
| App.tsx extraction | ✅ Done — App.tsx (112 lines): fonts + data init + gate chain. OnboardingGate, LaunchGate, AppShell extracted to `app/gates/`. |
| Barcode scanning v1 (Scan tab, UPC/EAN, Open Food Facts) | ✅ Done — dedicated Scan tab, expo-camera, GTIN-13 normalization, SQLite barcode cache, Open Food Facts API, reuses BusinessCard result flow with SCANNED PRODUCT context |
| OFF data pipeline + bundled product/prefix matching | ✅ Done — `products.json` (1,000 exact barcode product rows + 87 runtime producer rows in the April 2026 data batch; Philip Morris International and Altria resolve to distinct entity IDs), `productIndex.ts` exact lookup then prefix lookup as fast path in `useBarcodeSearch`, `sync-products-from-off.py` pipeline script. Instant local match for exact bundled products and major CPG producers (Nestle, Pepsico, Danone, Coca-Cola, Unilever, General Mills, etc.) before cache/network fallback. |
| Accessibility audit + fix | ✅ Done — a11y labels/roles/states on all interactive elements, tap targets ≥44pt, modal focus trapping, reduced-motion gating, copy keys extracted, tab bar labels from copy |
| Entity/person data reconciliation | ✅ Done — `verify-data-integrity.mjs` + `reconcile-v1-entities.mjs`, V1/V2 split, bidirectional ref integrity enforced |
| Device testing fixes (10 issues) | ✅ Done — safe area constant, camera permission eager request, map header reduced, FigureBadge empty fallback, arena sprite flush, responsive logos, onboarding reorder, permissions confirmed state, privacy layout, CTA reconciled to PRESS START |
| Repo cleanup + git workflow rules | ✅ Done — branch consolidation, worktree cleanup, .gitignore hardened, lockfiles synced, Git Workflow Rules in CLAUDE.md |
| Copy rewrite (Voice & Ethos Framework v3.2) | ✅ Done — 11 copy files + 10 component files. Brand "FCK FASCISTS", R:/D: labels, app-wide URL variables, tokenized scorecard empty state, collapsed source verbs, new ethos section, map first-use hints, tappable open-source link, actual OS permission checking. `shortParentNames` moved to `config/constants.ts`. |
| Info screen game UI restyle | ✅ Done — star field bg (bg_stars.gif), amber plaque about section (3px bevel, corner brackets, neon rule, SparkleDecoration info variant), inset-beveled "Built to Last" panel, beveled accordion rows (grey bevel, blue focus state, +/− indicators from `theme.accordion` tokens, sparkles on expand), plain text links (highlightBlue), Bungee/highlightBlue section headers. InfoDecorations.tsx extracted. Unified reference accordion: THE DATA + FAQ merged into single `reference[]` with inline category labels (THE DATA, PRIVACY, THE APP). |
| Onboarding + MapSearchBar restyle | ✅ Done — Star field bg + neon bar + amber beveled CTAs w/ sparkles on all 3 onboarding screens. Beveled square progress dots. Welcome: centered + green checkmark features. Privacy: inset-bevel panels w/ blue accent bar. Permissions: raised-bevel cards w/ status dots, amber ALLOW, green granted badges. MapSearchBar: 3-state bevel (default/focused/scanning), drop shadow, SparkleDecoration. |
| PlatformSetupScreen visual redesign | ✅ Done — 2-column grid, StarField bg, NeonRule, green bevelGreenRaised selected cells, amber bevelAmberRaised DONE button with SparkleDecoration. bevelGreenRaised added to design/bevel.ts. |
| App tested on physical device | 🔄 Pending |
| First-use tooltip system (Map screen) | ✅ Done — reusable `Tooltip` component (`core/ui/Tooltip.tsx`) with Mario-cloud depth, wiggle animation, directional tails. Replaces `HintBanner`. Three sequential hints: search bar, map tap, barcode scan. `useWiggleAnimation` hook extracted. |
| BusinessCard manila folder reskin | ✅ Done — manila folder wrapper, cream document table layout, folder tab dismiss, sprite perch (168px, 80/20 split), swipe-down dismiss, post-avoid stamp + particles + shake + amber pulse, AvoidButton hydration fix, AvoidCelebration removed. Pixel art eagle seal wired (48px BOX-downsampled, red-tinted folder + dark doc header). |
| Extension tested in Chrome | ✅ Done |
| Scorecard rebuild (4-state tab, rendered card, archive) | ✅ Done — 4-state screen (preview/loading/presentation/empty/archive), ScorecardImage 1080×1920 capture, CardPresentation full-screen takeover + celebrations, surface tracking (numeric column), shared CollapsibleRow, card archive, dev tools. Drop window Fri 6pm–Sat 4pm ET. |
| Scorecard capture-then-purge privacy flow | ✅ Done (2026-04-18, hardened 2026-05-07) — drop fires → aggregate scored week → capture card → purge scoped events `[scoredWeekOf, scoredWeekOf+7)`. `purgeScoredWeekAvoidEvents` in `core/data/eventStore.ts`. Purge is gated on capture success; failure retains raw events for retry on next visit. Launch-resilient — first open after a missed drop runs the same flow. Loader copy proves the promise: "Locking in my card. Shredding the data." |
| Scorecard 48h presentation window + scored-week lookup | ✅ Done (2026-04-18, hardened 2026-05-07) — `SCORECARD_PRESENTATION_WINDOW_MS = 48h`. Full-screen takeover only inside the window; after, tab returns to LivePreview and card moves to archive. Drop flow resolves the card via exact `findCardForWeek(scoredWeekOf)` so older archived cards cannot skip the current capture+purge; `scoredWeekOf` anchors to `dropAt - 24h` so Saturday local rollover still maps to the week that ended Friday. |
| Scorecard filename + archive labels — inscription format | ✅ Done (2026-04-18, JPEG 2026-04-30) — captured cards saved as `Those-I-FCKd-{Month}-{DD}-{YY}.jpg` via `buildCardFilename()`. Archive labels render readable `"April 11, 2026"` via `formatCardLabel()`. Legacy `.png` cards remain readable. Sh*tposter voice, non-vulgar, first-person. |
| Scorecard notification hygiene (scoped cancel, data.type routing) | ✅ Done (2026-04-18) — drop notification has identifier `'scorecard-drop'` + `data.type = 'scorecard-drop'`. Cancellation scoped by identifier so Thursday nudge (`platform-nudge-thursday`) survives. `AppShell` routes on `data.type` with one-release title-string fallback. |
| Cold-start notification deep-link — no Map ghost | ✅ Done (2026-04-18) — `AppShell` resolves launch notification via `getLastNotificationResponseAsync()` before any screen mounts; holds blank on bgVoid (<50ms) until routing decides. `MapScreen` root has `overflow: 'hidden'` as defense-in-depth for the RN 0.76 Fabric native-view retention pattern. |
| Scorecard share experience — runway + privacy intercept + cross-platform share | ✅ Done (2026-05-02; iOS screenshot mechanism corrected 2026-05-05) — `CardPresentation` presents the cached card as the trophy artifact with `CardHalo`, `MoneyParticles`, `ChevronRunway`, and `ShareButton`. Gestures: tap SHARE → share, swipe-up (>`SCORECARD_SHARE_SWIPE_UP_THRESHOLD=80`) → share, swipe-down (>120) → dismiss. iOS screenshot behavior uses a scoped secure-overlay sandwich: a full clean card sits as the unprotected base layer, while the full presentation layer (starfield, smaller card, halo, money, runway, SHARE, dismiss) renders inside native `FFSecureCaptureView` (`UITextField.secureTextEntry`), so screenshots omit the presentation layer and reveal the clean card underneath. `AppShell` hides tab/nudge/beta chrome while the presentation is active so the takeover owns the full viewport and the screenshot base stays centered. `useAppActive` still swaps to the full clean card for App Switcher / control-center / interruption snapshots. Cross-platform share: iOS uses RN `Share.share({ url })`; Android uses `expo-sharing` `Sharing.shareAsync()` because RN's `url` is iOS-only. Android screenshot parity remains post-capture: `expo-screen-capture`'s listener auto-invokes share with the clean card, while the chrome screenshot still lands in Photos because Android has no pre-capture hook; Android also avoids rendering the hidden clean-card base during active presentation to keep the path lighter. Listener lifecycle is scoped to `CardPresentation`; nothing else intercepts screenshots. |

---

## Modern Code Standards

> Apply these to **every file you write or edit**. These are not style preferences — they are correctness requirements. A deprecated API that works today will break on the next SDK update.

### Self-check rule
After writing any file, scan it once for deprecated APIs, `.then()` chains, `var`, `require()`, and `any`. Rewrite before finishing. If you are genuinely uncertain whether a method is current, flag it with a `// TODO: verify API is current for <package>@<version>` comment rather than silently shipping something that may fail at runtime.

### Dependencies
- Before using any library method, check the installed version in `package.json` and confirm the API is current for that version.
- Prefer explicit, minimal API calls over convenience wrappers that change between versions.
- Never install a new dependency without checking: (1) is there an existing dep that already does this? (2) is it actively maintained? (3) does it have a clean audit (`npm audit`)?

### Node / TypeScript
- **ESM only** — `import`/`export`, never `require()`/`module.exports`.
- **`async`/`await` only** — never `.then()`/`.catch()` chains.
- **`const` and `let` only** — never `var`.
- **`unknown` over `any`** — use `unknown` and narrow explicitly; `any` is banned except in test mocks where unavoidable.
- **`satisfies`** — use where type narrowing improves safety without widening the inferred type.
- **Optional chaining and nullish coalescing** — use `?.` and `??` where appropriate; avoid verbose `=== null || === undefined` guards.
- **Strict mode** — `tsconfig.json` has `"strict": true`. Never disable strict checks per-file.
- Do not use deprecated TypeScript utility types (e.g. `Readonly` is fine; `Extract`/`Exclude` are fine; avoid anything marked `@deprecated` in the TS release notes).

### React Native / Expo SDK 52
- Use **Expo SDK 52** APIs only. Check the SDK 52 changelog before using any Expo module.
- **Permissions** — use per-module async methods: `Location.requestForegroundPermissionsAsync()`, `Notifications.requestPermissionsAsync()`, etc. Never use the old unified `Permissions` API from `expo-permissions` (removed in SDK 45).
- **`expo-constants`** — use `Constants.expoConfig` not the deprecated `Constants.manifest`.
- **`expo-location`** — `getCurrentPositionAsync()` and `watchPositionAsync()` are current. Do not use removed methods.
- **`expo-sqlite`** — use the current `openDatabaseAsync()` / `SQLiteDatabase` API (SDK 52 switched to an async-first API). Do not use the old synchronous `openDatabase()` from SDK ≤ 50.
- **`expo-notifications`** — `scheduleNotificationAsync()` with typed trigger objects is current. Use `DateTriggerInput` etc. from the types; do not use the old string-based trigger format.
- **`expo-secure-store`** — `setItemAsync()` / `getItemAsync()` / `deleteItemAsync()` are current.
- **Native modules** — one exists: `MapKitSearchModule` (iOS only). Expo Modules API, Swift source at `modules/mapkit-search/ios/MapKitSearchModule.swift`, TS wrapper at `features/Map/nativeModules/MapKitSearch.ts`. Registered in root `package.json` as `"mapkit-search": "file:./modules/mapkit-search"` — CocoaPods discovers it on `expo prebuild`. **Do not add `expo.autolinking.searchPaths`** — it replaces default paths and breaks react-native resolution. Returns `[]` silently when not linked. Do not use the old `NativeModules` bridge — project has `newArchEnabled: true`.
- **MKLocalSearch must run on the main thread** — `MapKitSearchModule.swift` wraps the `MKLocalSearch` creation and `.start()` call in `DispatchQueue.main.async { }`. Expo Modules `AsyncFunction` bodies run on a background queue, but `MKLocalSearch` silently hangs if started off the main thread — the completion handler never fires, the JS promise never resolves, and the app appears frozen. This was the critical physical-device fix. Do not remove the dispatch wrapper.

### Jest 29
- **`jest.createMockFromModule()`** — use this; never the legacy `jest.genMockFromModule()`.
- **`.toHaveBeenCalledWith()`** — use this; never the alias `.toBeCalledWith()`.
- **`.toHaveBeenCalled()`** — use this; never `.toBeCalled()`.
- **fetch mocking** — assign to `globalThis.fetch = jest.fn()` or use a dedicated mock library. Do not use `jest.spyOn(global, 'fetch')` — it is unreliable across Node versions.
- **Fake timers** — use `jest.useFakeTimers()` with `jest.runAllTimersAsync()` (Jest 29+); avoid the deprecated `jest.runAllTimers()` for async code.
- **`beforeEach` cleanup** — always call `jest.clearAllMocks()` (or `jest.resetAllMocks()`) in `beforeEach` to prevent state leaking between tests.

### Browser Extension (MV3)
- **Event listeners must be registered at the top level** of the service worker — never inside `async` functions, `setTimeout`, or `.then()` chains. Chrome terminates the SW between events; listeners not registered synchronously on startup will be missed.
- **`chrome.alarms`** — create alarms inside `chrome.runtime.onInstalled`, not at the module top level. Alarms persist across SW restarts; re-creating them on every wake is unnecessary and was the cause of a runtime crash (see commit `fad4a0e`).
- **Async message handlers** — return `true` synchronously from `onMessage` listeners that call `sendResponse` asynchronously, or the message port will close before the response is sent.
- **`chrome.action.setIcon`** — takes a `path` object keyed by pixel density string (`"16"`, `"32"`, etc.), not a single string.
- Do not use deprecated MV2 APIs (`chrome.browserAction`, `chrome.pageAction`, `webRequest` blocking mode, etc.).

### General
- **No `console.log` in production paths** — use it only in dev/test; remove or guard with an env check before shipping.
- **No magic numbers** — any threshold, TTL, size, or timing value belongs in `config/constants.ts`.
- **Error boundaries** — all async paths in hooks must handle rejection. Use the cancelled-flag pattern for `useEffect` cleanup (see `useInfoContent.ts` for the canonical example).
- **Update this section** — if you encounter a new deprecation warning, a breaking API change, or a pattern that caused a runtime bug in this project, add it here before finishing the session.
- **react-native-maps — `AIRMap insertReactSubview:atIndex:` nil crash** — caused by a `<Marker>` rendered with `key=""` or `key={undefined}`. In Fabric (new arch), a falsy key causes the reconciler to pass a nil native view to the map's subview array → hard crash. **Two layers of defense:**
  - **JS guard (primary):** Always guard `id = entityId ?? fecCommitteeId` with `if (!id) return/continue` before creating a `MapPin` or rendering a `Marker`. Both `useTapSearch.ts` and `MapScreen.tsx` pin effect have this guard.
  - **Native guard (defense-in-depth):** `AIRMap.m` patched with `if (subview == nil) return` at the top of `insertReactSubview:atIndex:`, `removeReactSubview:`, and `addSubview:`. This prevents the `NSInvalidArgumentException` even if a nil subview leaks through from the Fabric reconciler for any reason. **The Podfile `post_install` hook re-applies this patch automatically after every `pod install`** — it reads `AIRMap.m`, checks for the nil guards, and injects them if missing. The hook is idempotent (safe to run repeatedly).
- **react-native-maps — `onRegionChangeComplete` render loop** — storing the map region in `useState` and passing the setter directly to `onRegionChangeComplete` creates an infinite re-render loop: region change → setState → re-render MapView → region change → ... The app freezes. **Fix:** Store region in a `useRef` instead of `useState` — the region is only consumed by zoom callbacks (never rendered directly), so it doesn't need to trigger re-renders. `MapScreen.tsx` uses `regionRef` with a stable `handleRegionChange` callback. Do not revert this to `useState`.
- **react-native-maps — map snap-back on location update** — a `useEffect` depending on `location.coords` that unconditionally calls `animateToRegion` will snap the map back to the user's position every time coords get a new object reference (e.g. location button press, tab re-mount). **Fix:** Use a `hasInitiallyCentered` ref guard so the auto-center fires exactly once on mount. For the location button, use a separate `pendingRecenter` ref flag + effect pattern: set the flag before calling `requestLocation`, then the effect only animates when the flag is true. Do not combine initial centering and explicit re-centering into a single unguarded effect.
- **POI search radius tuning** — `computeSearchRadius()` uses 2% of the visible map span (not 5%). At 5%, the auto-center zoom (`latitudeDelta: 0.02`) produced a 111m radius — over a city block. At 2% with min clamp 15m, street-level taps resolve to individual buildings. If cross-street matches recur, reduce the multiplier further or add a hard cap below 50m.
- **POI tap cache key** — `tapCellKey()` in `useTapSearch.ts` rounds to 4 decimal places (~11m grid, not 3 dp / ~111m) and includes the computed search radius. This ensures (a) taps on opposite sides of a street get different cache entries, and (b) zooming in/out at the same location triggers a fresh MKLocalPointsOfInterestRequest instead of returning stale results from a wider/narrower search. TTL is 60s (double-tap dedup only, not exploration persistence).
- **V2 cleanup — extension confidence CSS classes** — `popup.ts` uses `'HIGH'`/`'MEDIUM'` string class names derived from numeric scores. In V2, rename to BEM format (`confidence-badge--high`/`--medium`).
- **`NSCameraUsageDescription` required for barcode scanning** — iOS requires an explicit `NSCameraUsageDescription` in `Info.plist`. Requesting camera access without it causes an OS-level crash. Validate with `plutil -lint ios/FckFascists/Info.plist` after any prebuild.
- **Barcode scanner mount timing** — `BarcodeScannerSheet` is mounted only after the user taps `OPEN SCANNER`, not when the Scan tab renders. This keeps camera setup contextual and avoids idle preview rendering that can block tab switches. Do not move scanner initialization to tab mount.
- **`LayoutAnimation.configureNext` SIGABRT on RN 0.76 + new arch (Fabric)** — `LayoutAnimation` is broken on React Native 0.76.0 with `newArchEnabled: true`. Every call to `LayoutAnimation.configureNext` crashes the Fabric C++ animation driver with SIGABRT. This is a known RN regression (facebook/react-native#47617). **Do not use `LayoutAnimation` anywhere in this project.** `react-native-reanimated` is the project's animation library — it is built for Fabric and works correctly on RN 0.76. Use `Animated.FlatList` with `itemLayoutAnimation={LinearTransition.duration(250)}` for list reflow and `Animated.View entering={FadeIn.duration(200)}` for item enter animations.
- **Unmemoized hook return values cause infinite render loops (Fabric SIGABRT)** — a hook that returns an array or object computed inline (not via `useMemo`) gives a new reference on every render. If that value is listed as a `useEffect` dep, the effect fires on every render, which triggers state updates, which triggers re-renders — infinite loop. On RN 0.76 + Fabric this manifests as `_LIBCPP_ASSERT_SEMANTIC_REQUIREMENT "Your comparator is not a valid strict-weak ordering"` SIGABRT. **Rules:** (1) Any array or object returned from a hook must be wrapped in `useMemo`. (2) If a hook prop (like `entities: Entity[]`) is used only inside async logic — not as a rendered value — use the sync-ref pattern instead of listing it as an effect dep: `const ref = useRef(prop); ref.current = prop;` — the effect dep array omits the prop entirely. See `usePlatformAvoidance.ts` (items memoized), `useScorecard.ts` and `useBarcodeSearch.ts` (sync-ref pattern).
- **FXLayer / callback-as-prop infinite loop** — passing an inline arrow `() => onComplete(entry.id)` as a prop to a component that lists `onComplete` in a `useEffect` dependency array creates a new function reference on every parent render, re-triggering the effect on every render — infinite loop. **Pattern:** extract an `FXEntryRenderer` wrapper component that receives `entryId` and `onComplete` as props and memoizes the combined callback with `useCallback`. The wrapper's stable identity prevents the child effect from re-firing. Applied in `core/fx/FXLayer.tsx`. Same rule applies any time an inline callback is passed as a prop to a component that uses it as an effect dependency.
- **`useCallback` dependency on an object returned by a hook** — if a `useCallback` dep is an object or value produced by another hook (e.g. `[fx]` where `fx` is `useFX()` returning `{ entries, active, fire, remove, reducedMotion }`), the callback is recreated on every render because the hook returns a new object identity. Any `useEffect` that depends on that callback will re-fire continuously. **Fix:** depend only on the stable primitive or memoized function from the hook (e.g. `[fx.fire]` instead of `[fx]`). `fire` is wrapped in `useCallback([], [])` inside `useFX`, so it is stable across renders. Applied in `GameArena.tsx` `fireHitFX`. Check all `useCallback` deps for hook-object references.

---

## Entity Relationships

### parentEntityId — subsidiary → parent linkage
- Report card ladders up to parent's `displayFigure` via `getDisplayFigure(entity, allEntities)`.
- Business card always shows the entity's own data; when `SHOW_FIGURE_NAME_IN_CARD` is true and `parentEntityId` is set, also shows "via [Parent canonicalName]".
- Do not conflate these contexts — see Principle §7.

### associatedPersonIds — entity → people.json linkage
- `Entity.associatedPersonIds[]` references `PoliticalPerson.id` values in `people.json`.
- `people.json` is allowed to stay ahead of `entities.json`: `PoliticalPerson.associatedEntityIds[]` may include V2-only company IDs that are not live yet.
- Live entity reverse links stay strict: `Entity.associatedPersonIds[]` should only mirror people linked to IDs that exist in the current V1 `entities.json`.
- V2-only company links are also mirrored into `tools/fec-bulk/reports/people-v2-deferred-entity-links.json` so the forward refs stay reviewable while `entities.json` remains the clean live graph.
- `PoliticalPerson.rolesByEntity` maps entity IDs to role records (e.g. `{ "tesla": { role: "CEO", startYear: 2008, endYear: null, benefitBasis: "executive", isCurrent: true, confidence: "high" } }`).
- V1: linkage is data-only and not surfaced in UI. V1.5+: personal Schedule A contributions may appear in DataZone when live entity coverage is ready.
- Integrity rule: every ID in `associatedPersonIds` must exist in `people.json`; undeclared forward refs in `people.json` are a data bug, but declared V2 forward refs are allowed.
- Use `scripts/verify-data-integrity.mjs` to audit the live files before and after data updates.

### Person ↔ entity matching standard
- Matching is based on **economic benefit**, not ideology, fame, or generalized association.
- Core test: would ordinary consumer spending at this business reasonably improve this person's **wealth or financial position** through the company?
- Do not merge this with display-figure logic. Matching decides who is linked in `people.json`; display remains `publicFigureName -> getDisplayFigure()` on the entity side.
- Documentation status: the internal methodology is now defined here, but the public-facing Info / FAQ copy for this rule still needs to be written in app voice before rollout. Treat that as a separate copy task; do not improvise product copy from the technical spec.

### Person ↔ entity matching algorithm
1. Gather public evidence for role, ownership, governance position, and current status.
   Accept primary evidence first: company filings, proxy statements, investor relations, official leadership/board pages, and strong business reporting.
   Do not rely on employer strings alone for link creation.
2. Assign a `benefitBasis` to every accepted relationship:
   - `control_owner`
   - `executive`
   - `founder_stake`
   - `family_control`
   - `major_shareholder`
   - `board_material`
   - `board_routine`
   - `weak`
3. Auto-include when evidence supports:
   - current CEO, president, chair, executive chair, owner, co-owner
   - founder with ongoing stake or control
   - controlling family member
   - major shareholder
   - board chair
4. Include only with stronger evidence when:
   - board member + meaningful equity or unusually large stock-based compensation
   - former founder or former executive + verified ongoing material stake
   - family member + verified ownership or control
5. Do not include by default when the relationship is only:
   - former employment
   - honorary/advisory title
   - family name
   - ordinary independent board seat with routine director compensation only
   - small passive shareholding
   - employer-field inference only
6. Ownership thresholds:
   - public company: `5%+` beneficial ownership -> include
   - public company: `1% to 5%` -> include if also founder, chair, executive, or otherwise central to company control
   - public company: `<1%` -> not enough by itself
   - private company: require explicit evidence such as `owner`, `co-owner`, `controlling shareholder`, `major shareholder`, or equivalent
7. Currentness:
   - populate `isCurrent` for every accepted link
   - default to `true` unless there is evidence of departure
   - when there is evidence of departure, set `isCurrent: false` and populate `endYear`
8. Auditability:
   - every accepted link should eventually store `benefitBasis`
   - borderline/manual-review cases should carry a freeform `notes` field explaining the call
   - `confidence` applies to the relationship link itself, not the donor totals

### Data file separation
- `entities.json` + `fecCommitteeId` -> corporate PAC contributions. Preferred broad hydration is local bulk via `scripts/hydrate-entities-from-bulk.mjs`; FEC API endpoints (`/committees/{id}/totals/` and `/schedules/schedule_b/`) are fallback/discovery paths.
- `people.json` + `fecContributorId` (or `fecSearchNames`) -> individual Schedule A contributions. Preferred broad hydration is local bulk via `scripts/hydrate-people-from-bulk.mjs`.
- Local bulk hydration for people uses downloaded FEC `indiv*/by_date/` files plus `cm*.txt` committee masters.
- Do not conflate — different FEC endpoints, different data semantics, different query patterns.

### People ↔ entity maintenance workflow
- Treat `assets/data/people.json` as a generated artifact, not the hand-edited source of truth for person↔entity relationship data.
- Human-reviewed accepted links live in `scripts/data/people-entity-overrides.json`.
- Regenerate the donor/person file with `npm run sync:people:bulk-top`. This keeps pre-existing extra people by default; only use `--drop-extra` after an explicit destructive reset decision.
- Hydrate people donation summaries with `npm run hydrate:people:bulk`.
- Regenerate the manual triage list with `npm run build:people:entity-review-queue`.
- Before shipping or wiring app-bundled people data, run `npm run strip:people:raw`. This preserves the full source-of-truth file at `assets/data/people.json` and writes the slim bundled copy to `assets/data/people.bundle.json`, keeping `donationSummary.raw` only for people linked to live `entities.json` records. Use `--mode=none` if the app later needs a fully raw-free bundle.
- `tools/fec-bulk/reports/people-entity-review-queue.json` is only a review worksheet. Its candidate suggestions are heuristic leads, not accepted links.
- A person may still appear in the review queue even after a manual link is added if the linked company ID is only a forward ref in `people.json` and still needs a real `entities.json` record.
- For manual-review cases, record the final decision in `scripts/data/people-entity-overrides.json` using `benefitBasis`, `isCurrent`, `confidence`, and `notes` rather than editing `people.json` directly.
- Preferred maintenance order (bulk-first; includes the beneficiary-classifier chain that was previously omitted from this doc):
  1. Update `scripts/data/people-entity-overrides.json`
  2. Run `npm run sync:people:bulk-top`
  3. Run `npm run hydrate:people:bulk` (FEC-fuzz matcher — see `scripts/lib/fecNameFuzz.mjs`)
  4. Run `node scripts/build-committee-beneficiary-map.mjs` — regenerate committee-cycle classification from local bulk
  5. Run `node scripts/build-people-classification-preview.mjs` — writes a staging `.people.json` preview (does not touch live)
  6. Review preview, then apply: `cp tools/fec-bulk/reports/people-classification-preview-YYYY-MM-DD.people.json assets/data/people.json`
  7. Run `npm run build:people:entity-review-queue`
  8. Run `node scripts/build-people-discovered-committees.mjs` — review queue of people-observed committees not yet in any entity
  9. Run `node scripts/reconcile-v1-entities.mjs --write`
  10. Run `npm run strip:people:raw`
  11. Only then inspect `assets/data/people.json`, `assets/data/people.bundle.json`, and the review queue output
  12. (Optional canary) Run `node scripts/validate-people-fec-coverage.mjs --person=jeff-bezos --api` to spot-check one person against FEC's Schedule A

### people.json schema — `PoliticalPerson`
```typescript
{
  id: string                           // lowercase-hyphenated slug (e.g. "elon-musk")
  canonicalName: string                // FEC lookup format: "LAST, FIRST" or "LAST, FIRST M."
  displayName: string                  // consumer-facing display label (e.g. "Elon Musk")
  commonName?: string                  // optional shortened/common form (e.g. "Ken Griffin")
  aliases: string[]                    // consumer-facing display names (e.g. ["Elon Musk"])
  fecContributorId?: string | null     // stable FEC contributor ID when available
  fecSearchNames?: string[]            // alternate contributor_name variants in FEC filings
  primaryState?: string                // disambiguation for common names
  primaryEmployer?: string             // disambiguation for common names
  primaryOccupation?: string           // disambiguation for common names
  donorRank?: number                   // ranking from donor pipeline
  tier?: number                        // UI/display grouping derived from donorRank
  associatedEntityIds: string[]        // refs to entities.json IDs
  rolesByEntity: {
    [entityId: string]: {
      role: string
      startYear: number | null
      endYear: number | null
      benefitBasis?: 'control_owner' | 'executive' | 'founder_stake' | 'family_control' | 'major_shareholder' | 'board_material' | 'board_routine' | 'weak'
      isCurrent?: boolean              // pipeline target: always populated; treat undefined as true for legacy rows
      ownershipPct?: number | null
      confidence?: 'high' | 'medium' | 'manual-review'
      notes?: string
    }
  }
  donationSummary?: {
    totalR: number
    totalD: number
    recentCycleR: number
    recentCycleD: number
    recentCycle: string
    activeCycles: number[]
    raw: PoliticalPersonContribution[]
    lastUpdated: string
  }
  verificationStatus: 'manual' | 'pipeline' | 'unverified'
  lastVerifiedDate: string             // YYYY-MM-DD
  notes?: string                       // e.g. "Also donated via America PAC"
}
```
`getPersonDisplayName(person)` returns the first alias, or de-formats the canonical FEC name as a fallback.
People `R/D` totals are resolved from committee party metadata when available and may use curated committee-ID overrides for obvious partisan PACs; `raw[]` remains the authoritative committee-cycle record.
High-confidence committee verification notes live in `tools/fec-bulk/reports/committee-party-verification-2026-04-03.md`; as of April 3, 2026, the curated bulk pass resolves about `85.67%` of hydrated raw dollars into `R` / `D` and intentionally leaves cross-partisan, independent, and thin-evidence committees unclassified.

---

## Out of Scope (MVP) — Do Not Build

- Background location tracking
- Storage of browsing history in the extension
- Storage of any "support" events
- Owner-level donation inference for unknown businesses
- Social features or leaderboards
- Server-side analytics or telemetry
- Real-time backend services
- Donation processing (Phase 3)
- Widgets or Watch integration (Phase 2)
- Safari extension (Phase 2)
- Cross-device sync between extension and mobile app (Phase 2)

---

## Known Limitations / Technical Debt

### Match pipeline cache survives matching-algorithm changes (Priority: V1 launch decision)

**Observed 2026-04-22 on TestFlight:** "The Festival Center" (a DC nonprofit whose Apple Maps website is `instagram.com/festivaldc`) was still rendering as Meta on the business card even after the `shouldTrustDomainMatch` narrowing landed on `main` (commit `933e6ac`, Apr 20) and made it to the build. The narrowing does correctly reject `instagram.com` as third-party evidence — confirmed by the existing regression test `"ignores third-party profile domains when the POI name is a different business"` in [core/matching/__tests__/pipeline.test.ts](core/matching/__tests__/pipeline.test.ts) — but the persistent `LocalCache` at [core/data/cacheStore.ts](core/data/cacheStore.ts) holds entries for `ENTITY_CACHE_TTL_DAYS` (60 days) from a pre-narrowing build when domain matching trusted `instagram.com`. On cache hit, `matchEntity` short-circuits at step 1 and returns the cached Meta `donationSummary` without re-running the narrowing. The bug persists for any user whose cache was populated before Apr 20, until either the entry ages out or the cache is cleared. Verified by uninstall/reinstall: clean cache → The Festival Center correctly returns no match.

Two independent staleness risks exist on the persistent cache for match results:

1. **Algorithm-change staleness.** When matching logic changes (the Apr 20 narrowing, earlier alias-prefix guard in `c53332d`, the Apr 22 FEC-fuzzy token guard in `8d1b101`), existing cache entries still reflect the old behavior.
2. **Data-freshness staleness.** Cached `donationSummary` is a snapshot at write time. When `entities.json` ships with updated bundled donation data, `shouldUseCachedSummary` does not compare against the current entity's bundled summary, so cache hits can serve stale donation figures for up to 60 days after a data-bundle refresh.

Two remediation directions, with different trade profiles:

- **Option A — targeted `useCache: false` for POI taps.** POI tap matching is entirely local (`allowFecFallback: false`, bundled donation summaries), so the persistent cache saves no measurable work for that call site; the cache was originally sized for the API-era pipeline where cache hits avoided real FEC round-trips. Add `useCache?: boolean` to `MatchEntityOptions`, default `true`, pass `false` from `useTapSearch`. Manual search / barcode-derived flows (where `allowFecFallback: true` and real FEC calls happen) keep using the cache unchanged. Clean architectural separation: cache is only for "expensive lookups," and expensive means network. No schema change. No version-bump discipline. Existing bad entries age out via TTL. **Tradeoff to be aware of:** if a future version enables `allowFecFallback: true` for POI taps (e.g., to match uncurated entities discovered at tap time), the cache becomes valuable again and the flag gets flipped back. Also does not address the data-freshness-staleness risk on the manual-search path.

- **Option B — `algoVersion` constant + per-entry version check.** Adds an `algoVersion` field to `LocalCache`, bumped in `config/constants.ts` whenever matching logic changes materially. `shouldUseCachedSummary` checks for match; mismatched or legacy-undefined entries are evicted. Addresses algorithm-change staleness for all call sites (POI taps, manual search, barcode). Requires remembering to bump the constant on every matching-logic change — easy to forget months from now, at which point this bug class silently reappears.

**Product-side consideration called out by the team:** there is a future where the persistent cache also drives a write-back-to-bundled pattern — the API call for uncovered entities refreshes `donationSummary` locally, and the cached result becomes the source of truth until the next bundled-data ship. In that universe, the cache is load-bearing across all call sites and the right fix is closer to (B) with additional bundled-data-comparison on hit, not (A). Decide direction before V1 launch.

**Short-term posture (current):** neither option shipped. Existing cache entries age out naturally over 60 days. Users who explicitly uninstall + reinstall clear immediately. Any new false-positive reports between now and launch should be verified against a clean cache before concluding the matching algorithm is still wrong.

### MapKit domain matching — iOS only (Priority: informational)
`matchEntity` accepts an optional `domain` parameter. On iOS, the enriched MapKit bridge (`MapKitSearchModule.swift`) returns website hostnames alongside POI names. First-party domains are high-confidence, but third-party profile hosts (`facebook.com`, `instagram.com`, `linkedin.com`, `tiktok.com`, `twitter.com`, `x.com`, `youtube.com`) are not definitive corporate evidence unless the POI name itself also aliases to that entity. POI taps pass `{ allowFecFallback: false }` so random local organizations cannot drift into corporate PACs by fuzzy FEC similarity; manual search and barcode flows keep the default fallback. On Android, `onPoiClick` provides only a name string — matching uses alias search and the same POI fallback guard. The `category` field (MKPointOfInterestCategory) is passed through from MapKit but not yet used for matching — available for future filtering. V2: investigate Google Places API for Android domain/category parity.

### Prefix matching — multi-word aliases only (Priority: resolved)
Single-word aliases (e.g. "Apple", "American", "Delta") cannot prefix-match in `findByAlias`. Only multi-word aliases (e.g. "Apple Store", "American Airlines") qualify for prefix matching with a max 2-word suffix. This prevents false positives like "American Association Teachers of German" matching American Airlines, or "Apple Federal Credit Union" matching Apple Inc. Exact matching (Pass 1) is unaffected — "Apple" still exact-matches the input "apple". On iOS, domain matching handles the "Apple Georgetown" case definitively; on Android, these fall through to fuzzy FEC search.

### platforms.json — match-group entity (Priority: resolved in local data batch)
`assets/data/platforms.json` references `entityId: "match-group"` for the Match Group parent (Tinder, Hinge, OkCupid). The April 20 data-cleaning batch adds `match-group` to `entities.json`, and the current integrity gate reports no platform orphan entity IDs. Broad donation hydration should use local FEC bulk when staged; flag the user before any fallback FEC API discovery.

### service-worker.ts over 250 lines (Priority: V1 cleanup)
`extension/background/service-worker.ts` is 389 lines — over the 250-line file limit. Pre-existing violation; was 361 lines before the API key removal session. Refactor plan: extract `handleCheckDomain`, `isBundledDataFresh`, and related data-fetch logic into `extension/background/domainCheck.ts`. The message router, tab lifecycle listeners, and alarm handler stay in `service-worker.ts`.

### Placeholder URLs and email in copy/shared.ts (Priority: V1 launch blocker)
`contactEmail`, `extensionChromeUrl`, and `extensionFirefoxUrl` in `copy/shared.ts` are temporary placeholders (GitHub repo links and `hello@fckfascists.com`). Before launch: replace `extensionChromeUrl` and `extensionFirefoxUrl` with real Chrome Web Store / Firefox Add-ons URLs once the extensions are published, and confirm `contactEmail` is a real monitored address. Search for `"[need to change"` across the codebase to catch any other placeholders that may have been missed.

### CYCLES_SINCE_2016 — cycle constant update (Priority: V1.5)
`CYCLES_SINCE_2016` in `scripts/fetch-donation-data.mjs` and `core/api/FECClient.ts` must be updated manually when a new election cycle begins. Both are candidates for renaming to `CYCLES_TO_FETCH` (more accurate now that 2026 is included) — not blocking for MVP but should be done alongside the next cycle update.

### Schedule B filter non-functional — pipeline performance (Priority: V1.5)
`recipient_committee_type=H|S|P` is silently ignored by the FEC API — all disbursements are fetched and filtered client-side. Large PACs (Walmart: ~9,500 records) are slow. Fix: switch to `/schedules/schedule_b/by_recipient_id/` + party lookup per recipient. Would reduce Walmart from ~96 API pages to ~2. Correct totals now, just slow.

### raw line items — committee ID attribution (Priority: V2)
`FECLineItem` has no `committeeId` field. When an entity has multiple `fecCommitteeRecords`, raw line items from different committees are indistinguishable.

### Independent Expenditures — IE tracking (Priority: V3)
Schedule E (independent expenditures) is not tracked. IEs are spending by outside groups to support/oppose candidates — for high-profile individuals (Musk, Bezos) this may be their most significant political activity. V3 should add `ieContributions` to `Entity` and `PoliticalPerson` and query `/schedules/schedule_e/`. IE data uses a different query pattern (filer = spender, not recipient) — do not conflate with Schedule A or B.

### AIRMap.m nil guard patch — ✅ Resolved
`AIRMap.m` in the `react-native-maps` pod has nil guards on `insertReactSubview:atIndex:`, `removeReactSubview:`, and `addSubview:`. The Podfile `post_install` hook now re-applies this patch automatically after every `pod install`. The hook is idempotent — it detects existing guards and skips if already present. No manual intervention required.

### Map-asset ghost on cold-start from scorecard notification — ✅ Resolved
**Landed 2026-04-18.** Tapping the scorecard drop notification while the app was cold used to briefly mount `MapScreen` (default `activeTab = 'map'`) before the notification handler set it to `'report'`. On RN 0.76 + Fabric, Map's `position: 'absolute'` header subtree (stone-tile strip, horizontal logo, `header_bar.png`) left stale native-view paint that ghosted behind Scorecard. Resolved with three layers of defense: (1) `AppShell` resolves the launch notification via `Notifications.getLastNotificationResponseAsync()` before any screen mounts and routes directly to Scorecard; (2) `MapScreen`'s root `SafeAreaView` now has `overflow: 'hidden'` so the absolute header subtree is clipped to Map's frame; (3) notification routing now uses `content.data.type === 'scorecard-drop'` with a one-release-cycle title-string fallback, so copy edits don't break deep-linking.

### BusinessCard sprite clips on second open — ✅ Resolved
**Landed 2026-04-27.** On physical devices, a business card sprite could render correctly on first open, then come back cropped to the top of the head after dismissing and reopening the same or another card. The failure pattern looked like layout at first glance, but the actual trigger was lifecycle: the card subtree was being unmounted on dismiss, and RN 0.76 + Fabric could recycle the clipped native view that `SpriteView` uses for sprite-sheet cropping with stale geometry. Earlier attempts that focused on perch offsets or swapping image libraries were red herrings; the bug was in native view reuse, not sprite math.

**Fix:** `MapScreen.tsx` now keeps the full-card host mounted after first open and toggles visibility with opacity, pointer events, and accessibility flags rather than conditional unmounting. `BusinessCard.tsx` resets its transient animated state (`translateY`, `shakeX`, `shakeY`) when the hidden card becomes visible again so swipe-dismiss and stamp-shake offsets do not leak into the next open. `SpriteView` accepts `visible?: boolean`; when false, the inner bitmap is moved far above the crop box so sprite-sheet changes while hidden do not briefly flash the wrong crop region. This means the sprite's clipped native subtree survives card closes, and Fabric no longer gets a chance to remount it with stale bounds.

**Rules going forward:**
- Treat repeat-open sprite clipping as a renderer/lifecycle problem before touching offsets.
- Do not reintroduce `activeResult && showFullCard` unmounting for the full business-card subtree unless the sprite rendering strategy changes.
- If the persistent-mount approach ever becomes untenable, the fallback architecture is to pre-slice sprite sheets into per-frame PNGs and stop relying on runtime `overflow: 'hidden'` cropping for the card sprite.

### BETA_SCORECARD_INTERVAL_HOURS pre-launch flip (Priority: V1 launch blocker)
`BETA_SCORECARD_INTERVAL_HOURS = 48` in `config/constants.ts` overrides the weekly schedule for dev builds. Must be flipped to `0` before shipping to production. To remove the override entirely, delete the constant, delete `core/dropSchedule/betaDropSchedule.ts`, and remove the conditional in `useDropSchedule.ts`.

### MIN_AVOIDS_FOR_DROP threshold tuning (Priority: V1.5)
`MIN_AVOIDS_FOR_DROP = 1` in `config/constants.ts` means a single avoid generates a card + notification. Decide whether this is the right floor for "card-worthy" before V1 launch. Raising it (e.g. to 3) also implies updating the `EmptyWeek` copy and any marketing referencing "any avoid counts."

### Android scorecard screenshot parity (Priority: V1.5)
Android currently keeps scorecard screenshot parity post-capture: `expo-screen-capture` detects the screenshot after it lands, then opens share with the clean cached PNG. This is intentionally lighter than rendering an Android-only hidden clean-card base, and avoids `FLAG_SECURE` because that would block screenshots rather than produce the clean card. V1.5: revisit whether a native Android implementation can approximate the iOS secure-overlay sandwich without new dependencies or heavy background rendering. If no clean path exists, keep Android on the post-capture share fallback.

### Thursday nudge silent wipe — ✅ Resolved
**Landed 2026-04-18.** `useDropSchedule.ts` and `ScorecardScreen.tsx` previously both called `cancelAllScheduledNotificationsAsync()` when re-scheduling the drop or suppressing it on an empty week. That wiped every scheduled notification — including the Thursday platform nudge (`platform-nudge-thursday`). Users on a week with zero avoids lost their nudge silently. Drop notification now has a stable identifier (`scorecard-drop`); cancellation is scoped via `cancelScheduledNotificationAsync(id)` and the Thursday nudge is untouched.

### Scorecard notification routing by data.type (Priority: resolved)
Drop notification carries `content.data = { type: 'scorecard-drop' }`. `AppShell` matches on this via the `isScorecardDrop()` helper. Title-string matching (`'Your Scorecard Is Ready'`) is retained as a legacy fallback for one release cycle so any notification already scheduled at upgrade time still routes correctly. Remove the fallback after V1.1.

### Avoided-entity pin coordinate storage — privacy relaxation candidate (Priority: V1.5)
`entity_avoid_pins` SQLite table stores coordinates for avoided entities locally (auto-purged daily). All data in `fuckfascists.db` is encrypted at rest — see "Data Encryption at Rest" in the Security section. This was added to enable map hydration on relaunch — showing today's avoided markers without re-tapping. The original privacy principle was "coordinates are never written to disk." This relaxation stores only avoided-entity coordinates, only locally, and only for the current day. **Candidate for rewrite** if the team decides any coordinate persistence is unacceptable. Revert path: remove the table, remove hydration logic in `MapScreen.tsx`, pins become session-only again.

### SparkleDecoration — `info` variant uses hardcoded pixel offsets (Priority: V1.5)
`SparkleDecoration` positions sparks using absolute `top`/`right` pixel values. The `info` variant (used on the Info screen about plaque) places sparks across all four edges, but uses hardcoded `right` values (200, 220) to reach the left side of the parent. On a ~375pt-wide phone (panel ~343pt) these land roughly in the left-center area — close enough for decoration, but on wider devices (tablets, landscape) the sparks drift toward center instead of hugging the left edge. Fix options: (1) add `left`/`bottom` support to the render loop and use those directly, (2) accept a `containerWidth` prop and compute positions as percentages, or (3) use `useWindowDimensions` to derive positions dynamically. Not blocking — decorative only.

### Xcode project name — consider renaming before App Store (Priority: pre-App Store)
Pre-App Store: consider renaming Xcode project from FckFascists to FCK. Internal only — not user-facing, not blocking beta.

### V2: Extension copy — `dSep` naming cleanup (Priority: V2)
`dSep` in `extension/copy.ts` does double duty: it's the mid-dot separator between R and D amounts AND the D: label (value: `" · D: "`). Asymmetric with `rPrefix`. Consider splitting into `dPrefix` + a shared `separator` constant, or renaming both to `rLabel`/`dLabel` for clarity. Low priority — cosmetic only, no functional impact.

### Map auto-scan on open — copy update needed (Priority: V1 launch blocker)
The map now auto-scans for nearby POIs when it opens and location resolves. This is session-only (coordinates never stored or transmitted), but the Info/FAQ copy does not yet disclose this behavior. The privacy principle section should be updated to note that the app queries nearby businesses on map open, not only on explicit tap/search.

### react-native-maps — `AIRMap insertReactSubview:` nil crash (Priority: resolved)
Rapid marker add/remove cycles cause the Fabric reconciler to pass nil subviews to `AIRMap.m`, crashing with `NSInvalidArgumentException: insertObject:atIndex: object cannot be nil` (react-native-maps [#5345](https://github.com/react-native-maps/react-native-maps/issues/5345), [#5217](https://github.com/react-native-maps/react-native-maps/issues/5217)). **Three layers of defense:**
- **JS serialization (primary):** `useTapSearch.ts` uses `inFlightRef` to prevent concurrent `processTapNames` execution. If a tap search is in-flight, new taps are dropped.
- **Ghost marker cap:** `tapNoMatchCoords` capped at 20 entries with coordinate deduplication. Prevents unbounded marker accumulation.
- **Native nil guard (defense-in-depth):** Podfile `post_install` hook patches `AIRMap.m` with nil checks on `insertReactSubview:`, `removeReactSubview:`, and `addSubview:`. Idempotent — re-applies on every `pod install`. **Run `pod install` after checkout to apply the patch.**
- **Do not use `tracksViewChanges={false}`** with custom Image children on Fabric — causes stale render state that triggers the nil crash.

### V2: Optional Server Schedule Override
Drop time is computed on-device (see `core/dropSchedule/computeDropTime.ts`). V2 may add a lightweight server ping for: schedule overrides, entity list freshness checks, info content freshness checks. Constraints: minimal data (version hashes only, no payloads), no user-identifying or behavioral data, app functions identically if ping fails. The ping is a freshness hint, not a dependency. Do not build now.

---

## Data Maintenance

See header comments in `scripts/verify-entities.mjs` for AI verification rules.
