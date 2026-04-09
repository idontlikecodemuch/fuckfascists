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
| Progress Archive | /docs/PROGRESS_ARCHIVE.md | Older session logs (pre-March 12, 2026) — reference only, not required reading |
| Products Data Pipeline | /docs/PRODUCTS_DATA_PIPELINE.md | Deep reference for `products.json`, the OFF bulk sync process, checkpoints, cleanup heuristics, and current coverage |
| App Spec (original) | /docs/FuckFascists_AppSpec_ORIGINAL.docx | Canonical product vision as originally written — do not modify |
| README | /README.md | Plain-English public overview — keep current with major feature changes |
| Spec vs. Current State | /docs/SPEC_VS_CURRENT.md | Living document tracking alignment, deviations, and open decisions |
| Voice & Ethos Framework | /docs/FCK_VOICE_FRAMEWORK.md | Canonical voice guide — two voices (Clark the Clerk + The Sh*tposter), tone rules, copy patterns |
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

---

## Security — Read This First

API keys and credentials must **only ever be read from environment variables**. This is a hard rule.

- **Never hardcode any key, token, or credential** in source files, config files, or comments. `.env` is gitignored; `.env.example` shows placeholders only. Hardcoded keys are bugs — remove immediately and rotate.
- **`FECClient` supports anonymous mode** — runs without `FEC_API_KEY`, making requests with no `api_key` param (lower rate limits). `console.warn` in non-prod when key is absent.
- **`FEC_API_KEY` is required for data pipeline scripts** — they make hundreds of requests and exit with an error when the key is missing.
- **`OPENAI_API_KEY` is required for `gpt_image.py`** — the GPT image pipeline reads from `.env` via python-dotenv. Exits with a clear error if missing. Not used by any app or extension runtime code.
- **`GEMINI_API_KEY` is required for Gemini generation scripts** — `generate.py` and `generate_assets.py` read from `.env`. Not used by any app or extension runtime code.

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
│   ├── ui/                          ← uiAssets.ts (require map for UI kit sliced elements + header bar), Tooltip.tsx, useWiggleAnimation.ts
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
// Scorecard drop window (times in ET)
export const SCORECARD_WINDOW_START_HOUR = 16; // 4pm ET Friday
export const SCORECARD_WINDOW_END_HOUR = 15;   // 3pm ET Saturday
export const SCORECARD_WINDOW_DAY = 5;         // Friday (0 = Sunday)

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

### Privacy relaxation: avoided-entity pin coordinates
**Added 2026-04-03.** Map pin coordinates for avoided entities are stored locally in SQLite (`entity_avoid_pins` table), encrypted at rest by iOS Data Protection. Only coordinates for entities the user has actively avoided are stored — not scanned or tapped entities. Rows are auto-purged daily. This enables the map to show today's avoided markers on app relaunch. **This is a candidate for rewrite** — the team may decide to revert to session-only pin storage if any coordinate persistence is unacceptable. See Known Limitations.

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

These scripts are run locally by maintainers — never in CI. Both require `FEC_API_KEY` in `.env`.

### `npm run verify:entities`
Verifies `fecCommitteeId` for each entity in `assets/data/entities.json` via the FEC API.
Searches by canonical name, scores results with Jaro-Winkler, and populates `fecCommitteeId`
when a confident match is found. Marks confirmed no-PAC entities with `fecCommitteeId: null`.

### `npm run fetch:donations`
Pre-fetches FEC donation totals for all entities with a verified `fecCommitteeId` and writes `donationSummary` to `entities.json`. The matching pipeline uses bundled data directly when present and fresh, skipping live FEC calls.

- Fresh entries (within `ENTITY_CACHE_TTL_DAYS` of `lastVerifiedDate`) are skipped. Use `--force` to re-fetch all.
- On failure, `lastVerifiedDate` is cleared so the entity retries on the next plain run.
- Progress saves every 10 fetches — safe to interrupt and restart.
- **Rate limiting** — sliding-window `RateLimiter` class: `COMMITTEE_RPM=30`, `SCHEDULE_B_RPM=8`. On 429: exponential backoff (60s→120s→240s, max 300s, 3 retries). Do NOT reintroduce fixed delays (`FETCH_DELAY_MS` etc.).
- See script header comments in `fetch-donation-data.mjs` for Schedule B attribution details and known FEC API quirks.

Run `fetch:donations` after `verify:entities` whenever the entity list is updated. Commit `entities.json` manually after review.

### `python3 scripts/sync-products-from-off.py`
Processes the Open Food Facts MongoDB bulk dump into `assets/data/products.json`. Scans ~4.4M product documents, extracts UPC prefix evidence per producer, and outputs a two-layer index: conservative runtime `producers` (18 entries mapped to existing entity IDs) and broader `producerResearch` (206 entries for future expansion). Checkpoint-based resume (`tools/off-bulk/checkpoints/`). Requires the OFF bulk archive at `tools/off-bulk/openfoodfacts-mongodbdump` (not committed — 91GB+). Use `--rebuild-from-checkpoint` to regenerate `products.json` from saved aggregates without rescanning. See `docs/PRODUCTS_DATA_PIPELINE.md` for full details.

### `node scripts/generate-arena-assets.mjs`
Scans `assets/pixel/arena/` for PNG files and regenerates `core/arena/arenaAssets.ts` — a static `require()` map used by `GameArena`. Run this after adding or removing arena background images. The generated file should be committed to the repo (Metro bundler requires the static `require()` strings at build time).

### `node scripts/verify-data-integrity.mjs`
Audits data integrity across `entities.json` and `people.json`. Checks: duplicate IDs, forward refs (entity → person), reverse-link gaps (bidirectional integrity), role mismatches in `rolesByEntity`, GPT pass integrity, and stale documentation. Run after any entity/person data changes. Does not make API calls — safe to run anytime.

### `node scripts/reconcile-v1-entities.mjs`
Reconciles `entities.json` against `people.json` for V1/V2 separation. Adds reverse `associatedPersonIds` to live entities, keeps `entities.json` aligned only to live V1 IDs. Preserves V2-only forward refs in `tools/fec-bulk/reports/people-v2-deferred-entity-links.json` so deferred links are recoverable. Run after people data updates.

---

## Scorecard — Drop Mechanics

The weekly scorecard is a synchronized global event. Every user with the same app version receives it at the exact same moment — computed entirely on-device with no network dependency.

- Drop time is computed deterministically via PRNG in `core/dropSchedule/computeDropTime.ts` — same ISO week year + week number always produces the same result on every install, forever
- Seed: djb2 hash of `"ff-drop-{year}-W{week}"` mod 23, mapped to an hour offset within the Friday 4pm ET – Saturday 3pm ET window (23 hours, EST = UTC-5 hardcoded for MVP)
- Collision rule: if this week's hour matches last week's, advance by 1 hour (wrapping within the window) — fully deterministic
- No network fetch for the schedule — `useDropSchedule` calls `getCurrentDropTime()` synchronously, no loading state
- Push notification is scheduled locally at the computed drop moment via Expo Notifications
- If notifications are disabled, the card is waiting when the user opens the app
- On-demand cards (generated anytime by the user) get a "PREVIEW" pixel art stamp — the weekly drop retains its specialness
- Extension data is NOT included in the scorecard (V1) — extension has its own in-popup weekly summary

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
// FEC_API_KEY optional for app (anonymous mode); required for data pipeline scripts.

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
- **Never leave more than 2 worktrees alive.** If you see stale worktrees (no unique commits), remove them.
- **The main worktree must stay on `main`** unless you are actively working on a feature branch and will switch back when done. Never leave the main worktree parked on a stale feature branch.

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
| Browser extension (MV3, Chrome + Firefox) | ✅ Done |
| FEC entity verification run (`verify:entities`) | ✅ Done |
| Donation data bundled into `entities.json` | ✅ Done |
| Anonymous FEC API mode (no key required in app) | ✅ Done |
| Design system: tokens + 26 components migrated | ✅ Done — `design/tokens.ts` + all components use theme tokens |
| Pixel art assets: pipeline + deploy + wired | ✅ Done — 35 assets in `assets/pixel/`, FlagMarker + BusinessCard wired. 107 CEO sprites in `assets/pixel/sprites/`, wired into BusinessCard, PlatformRow, ScorecardView. 4-step keying pipeline with 1px alpha erosion. Brand logos wired (map header, launch, onboarding, icon, splash). 4 arena backgrounds wired into GameArena. UI kit sliced (30 elements): frames wired into BusinessCard + ScorecardView, buttons into AvoidButton + MapControls, input field into MapSearchBar, bar into TabBar, header bar into MapScreen. |
| Design refinement: 8-bit game energy | ✅ Done — Map header bar, search bar depth, tab bar texture, BusinessCard sprite-left layout + donation hierarchy flip + reward overlay + sprite perch ON card, MatchChooser visual upgrade, GameArena tiled bg texture + rewardYellow cell borders, PlatformGroup parent company grouping + short names + hideSprite/compact child rows, InfoScreen collapsible transparency + section ornamentation, tap-to-dismiss backdrop, AvoidButton depth borders, global highlight lines reduced to 2px |
| Onboarding tightened (5→3 screens) | ✅ Done — Welcome, Privacy (WHAT WE DON'T DO), Permissions (BEFORE WE START). Privacy promise before permission request. |
| Beta testing mode | ✅ Done — triple-tap toggle, BetaOverlay, screenshot tool |
| Daily launch screen | ✅ Done — once per calendar day, rotating messages, 5s auto-dismiss, breathing logo animation |
| Avoid celebration animation + haptics | ✅ Done — shared FX system (`core/fx/`) with FXLayer + useFX + effect registry; AvoidCelebration effect (scale + fade) |
| App built and running on iOS simulator | ✅ Done — `FckFascists.app` installed on iPhone 16 Pro simulator |
| Device visual refinement pass | ✅ Done — launch screen 5s + breathing logo, map header spacing, BusinessCard corners/z-index/sprite 150pt, SpriteView headOnly, GameArena full bleed + all-platforms roster, PlatformRow row-tap + auto-expand, TabBar texture 2x |
| BusinessCard rebuild + component extraction | ✅ Done — BusinessCard (168 lines), BusinessBanner + resolveCardMode (114), DataZone (161), DetailSheet (placeholder), useMapControls hook (73). Card/banner routing, FXLayer in MapScreen, all files under 250 lines. |
| App.tsx extraction | ✅ Done — App.tsx (112 lines): fonts + data init + gate chain. OnboardingGate, LaunchGate, AppShell extracted to `app/gates/`. |
| Barcode scanning v1 (Scan tab, UPC/EAN, Open Food Facts) | ✅ Done — dedicated Scan tab, expo-camera, GTIN-13 normalization, SQLite barcode cache, Open Food Facts API, reuses BusinessCard result flow with SCANNED PRODUCT context |
| OFF data pipeline + bundled prefix matching | ✅ Done — `products.json` (18 producers, 243 KB), `productIndex.ts` prefix lookup as fast path in `useBarcodeSearch`, `sync-products-from-off.py` pipeline script. Instant local match for major CPG producers (Pepsico, Coca-Cola, General Mills, etc.) before cache/network fallback. |
| Accessibility audit + fix | ✅ Done — a11y labels/roles/states on all interactive elements, tap targets ≥44pt, modal focus trapping, reduced-motion gating, copy keys extracted, tab bar labels from copy |
| Entity/person data reconciliation | ✅ Done — `verify-data-integrity.mjs` + `reconcile-v1-entities.mjs`, V1/V2 split, bidirectional ref integrity enforced |
| Device testing fixes (10 issues) | ✅ Done — safe area constant, camera permission eager request, map header reduced, FigureBadge empty fallback, arena sprite flush, responsive logos, onboarding reorder, permissions confirmed state, privacy layout, CTA reconciled to PRESS START |
| Repo cleanup + git workflow rules | ✅ Done — branch consolidation, worktree cleanup, .gitignore hardened, lockfiles synced, Git Workflow Rules in CLAUDE.md |
| Copy rewrite (Voice & Ethos Framework v3.2) | ✅ Done — 11 copy files + 10 component files. Brand "FCK FASCISTS", R:/D: labels, app-wide URL variables, tokenized scorecard empty state, collapsed source verbs, new ethos section, map first-use hints, tappable open-source link, actual OS permission checking. `shortParentNames` moved to `config/constants.ts`. |
| Info screen game UI restyle | ✅ Done — star field bg (bg_stars.gif), amber plaque about section (3px bevel, corner brackets, neon rule, SparkleDecoration info variant), inset-beveled "Built to Last" panel, beveled FAQ accordions (grey bevel, blue focus state, ▼/▲ chevrons, sparkles on expand), plain text links (highlightBlue), Bungee/highlightBlue section headers. InfoDecorations.tsx extracted. |
| Onboarding + MapSearchBar restyle | ✅ Done — Star field bg + neon bar + amber beveled CTAs w/ sparkles on all 3 onboarding screens. Beveled square progress dots. Welcome: centered + green checkmark features. Privacy: inset-bevel panels w/ blue accent bar. Permissions: raised-bevel cards w/ status dots, amber ALLOW, green granted badges. MapSearchBar: 3-state bevel (default/focused/scanning), drop shadow, SparkleDecoration. |
| PlatformSetupScreen visual redesign | ✅ Done — 2-column grid, StarField bg, NeonRule, green bevelGreenRaised selected cells, amber bevelAmberRaised DONE button with SparkleDecoration. bevelGreenRaised added to design/bevel.ts. |
| App tested on physical device | 🔄 Pending |
| First-use tooltip system (Map screen) | ✅ Done — reusable `Tooltip` component (`core/ui/Tooltip.tsx`) with Mario-cloud depth, wiggle animation, directional tails. Replaces `HintBanner`. Three sequential hints: search bar, map tap, barcode scan. `useWiggleAnimation` hook extracted. |
| Extension tested in Chrome | ✅ Done |

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
- `entities.json` + `fecCommitteeId` → corporate PAC contributions via `/committees/{id}/totals/` and `/schedules/schedule_b/`
- `people.json` + `fecContributorId` (or `fecSearchNames`) → individual Schedule A contributions via `/schedules/schedule_a/?contributor_name=`
- Local bulk hydration for people lives in `scripts/hydrate-people-from-bulk.mjs` and uses downloaded FEC `indiv*/by_date/` files plus `cm*.txt` committee masters.
- Do not conflate — different FEC endpoints, different data semantics, different query patterns.

### People ↔ entity maintenance workflow
- Treat `assets/data/people.json` as a generated artifact, not the hand-edited source of truth for person↔entity relationship data.
- Human-reviewed accepted links live in `scripts/data/people-entity-overrides.json`.
- Regenerate the donor/person file with `npm run sync:people:bulk-top`.
- Regenerate the manual triage list with `npm run build:people:entity-review-queue`.
- Before shipping or wiring app-bundled people data, run `npm run strip:people:raw`. This preserves the full source-of-truth file at `assets/data/people.json` and writes the slim bundled copy to `assets/data/people.bundle.json`, keeping `donationSummary.raw` only for people linked to live `entities.json` records. Use `--mode=none` if the app later needs a fully raw-free bundle.
- `tools/fec-bulk/reports/people-entity-review-queue.json` is only a review worksheet. Its candidate suggestions are heuristic leads, not accepted links.
- A person may still appear in the review queue even after a manual link is added if the linked company ID is only a forward ref in `people.json` and still needs a real `entities.json` record.
- For manual-review cases, record the final decision in `scripts/data/people-entity-overrides.json` using `benefitBasis`, `isCurrent`, `confidence`, and `notes` rather than editing `people.json` directly.
- Preferred maintenance order:
  1. Update `scripts/data/people-entity-overrides.json`
  2. Run `npm run sync:people:bulk-top`
  3. Run `npm run build:people:entity-review-queue`
  4. Run `npm run strip:people:raw`
  5. Only then inspect `assets/data/people.json`, `assets/data/people.bundle.json`, and the review queue output

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

### platforms.json — match-group entity missing (Priority: next entities review)
`assets/data/platforms.json` references `entityId: "match-group"` for the Match Group parent (Tinder, Hinge, OkCupid). No matching entity exists in `entities.json`. As a result, these three child platforms have `ceoName: ''`, no sprite, no FEC data, and `parentCompany` falls back to the raw string `'match-group'`. Add a `match-group` entity to `entities.json` during the next entities review. Run `verify-entities.mjs` to locate the correct FEC committee ID.

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

### Avoided-entity pin coordinate storage — privacy relaxation candidate (Priority: V1.5)
`entity_avoid_pins` SQLite table stores coordinates for avoided entities locally (encrypted at rest, auto-purged daily). This was added to enable map hydration on relaunch — showing today's avoided markers without re-tapping. The original privacy principle was "coordinates are never written to disk." This relaxation stores only avoided-entity coordinates, only locally, and only for the current day. **Candidate for rewrite** if the team decides any coordinate persistence is unacceptable. Revert path: remove the table, remove hydration logic in `MapScreen.tsx`, pins become session-only again.

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
