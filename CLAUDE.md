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
| Progress & Current State | /docs/PROGRESS.md | Read this first — current sprint status, last sessions, immediate next steps |
| App Spec (original) | /docs/FuckFascists_AppSpec_ORIGINAL.docx | Canonical product vision as originally written — do not modify |
| README | /README.md | Plain-English public overview — keep current with major feature changes |
| Spec vs. Current State | /docs/SPEC_VS_CURRENT.md | Living document tracking alignment, deviations, and open decisions |
| CLAUDE.md | /CLAUDE.md | Technical reference for AI agents — update continuously |

**Update cadence:**
- PROGRESS.md — update at the end of every session with what was completed and what's next
- README.md — update when a major feature ships or product framing changes
- SPEC_VS_CURRENT.md — update any time a specced feature is built, deferred, or a decision is resolved
- FuckFascists_AppSpec_ORIGINAL.docx — never modified
- CLAUDE.md — updated continuously as the source of truth for implementation

**New instance checklist:**
1. Read PROGRESS.md — understand current state and immediate priorities
2. Read CLAUDE.md — understand technical constraints and working rules
3. Check SPEC_VS_CURRENT.md open decisions — don't re-litigate resolved ones

---

## Non-Negotiable Product Principles

These are not preferences. They are constraints. Never violate them.

1. **Avoids only** — The data model cannot contain a "support" event. If a user visited a flagged business or used a flagged platform, nothing is stored. Only affirmative avoidance actions are recorded.
2. **No geolocation storage** — Location is accessed session-only (on explicit user action). Coordinates are never written to disk or transmitted.
3. **No browsing history** — The extension detects domains in-memory only. Nothing about what a user browsed is ever persisted.
4. **No personal identifiers** — No accounts, no emails, no user IDs in MVP. All data is local-only.
5. **No backend in MVP** — All processing is on-device. The only outbound calls are to the OpenFEC API (directly from the device) and to fetch the curated entity list update (static file on GitHub/CDN).
6. **Transparency always** — Every confidence label is shown. Every data source links to FEC.gov. Nothing is claimed with more certainty than the data supports.
7. **CEO name context split** — CEO names are intentional in the report card and avoid tap feedback — these are designed to be confrontational and shareable. CEO names are intentionally absent from the business card and extension popup — these are informational tools displaying public FEC data. Do not conflate these two design contexts.
8. **Cross-surface data parity** — When a material data or transparency change is made to the app business card or the extension popup, carry the underlying data behavior to both surfaces unless there is an explicit documented V2 divergence decision. UI treatment may differ by surface; confidence labels, donation availability handling, FEC links, and core attribution rules must not silently drift.

---

## Security — Read This First

API keys and credentials must **only ever be read from environment variables** (e.g. `process.env.FEC_API_KEY`). This is a hard rule, not a preference.

- **Never hardcode any key, token, or credential** in source files, config files, or comments.
- **`.env` is gitignored** — it is the only place real keys live. Never commit it.
- **`.env.example`** shows placeholder values only — never real values.
- **If you see a hardcoded key in the codebase, treat it as a bug** — remove it immediately and rotate the exposed key.
- **`FECClient` supports anonymous mode** — the constructor reads `FEC_API_KEY` from `process.env` but does not throw when absent. Without a key, requests are made without an `api_key` param (the FEC API allows this at lower rate limits). A `console.warn` is emitted in non-production environments so the omission is visible during development.
- **`FEC_API_KEY` is required for data pipeline scripts** (`npm run fetch:donations`, `npm run verify:entities`) — these make hundreds of requests and will hit anonymous rate limits. Scripts exit with an error when the key is missing.

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
| Networking | Native fetch — OpenFEC API (primary); CDN for entity list + drop schedule |
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
│   ├── navigation/                  ← tab/stack navigation
│   ├── providers/                   ← context, theme, config
│   └── storage/                     ← SqliteAdapter.ts (expo-sqlite SDK 52, mobile only)
├── features/
│   ├── Map/                         ← geolocation scan, map display, flagging
│   ├── Survey/                      ← weekly platform checklist
│   ├── ReportCard/                  ← generation, drop timing, sharing
│   ├── Onboarding/                  ← first-run flow
│   └── Info/                        ← transparency, about, FAQ
├── core/
│   ├── matching/                    ← entity matching + confidence scoring (SHARED)
│   ├── api/                         ← FEC API client, rate limiting
│   ├── data/                        ← entity list loader, local DB, cache
│   └── models/                      ← shared TypeScript types
├── extension/
│   ├── manifest.json
│   ├── background/                  ← service worker, session tracking
│   ├── content/                     ← domain detection on page load
│   └── popup/                       ← pixel art UI
├── config/
│   └── constants.ts                 ← all configurable variables (see below)
├── scripts/
│   ├── fetch-donation-data.mjs      ← pre-fetches FEC donation data into entities.json
│   └── verify-entities.mjs          ← verifies fecCommitteeId for each entity via FEC API
└── assets/
    └── pixel/                       ← all pixel art assets by type
```

**File size rule: if any file exceeds 250 lines, stop and refactor it before continuing.**

---

## Configurable Variables

All of these live in `/config/constants.ts`. They can be adjusted post-launch without code changes. Never hardcode these values anywhere else.

```typescript
// Report card drop window (times in ET)
export const REPORT_CARD_WINDOW_START_HOUR = 16; // 4pm ET Friday
export const REPORT_CARD_WINDOW_END_HOUR = 15;   // 3pm ET Saturday
export const REPORT_CARD_WINDOW_DAY = 5;         // Friday (0 = Sunday)

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

// Curated entity list update URL — [org] placeholder; update before v1.0 launch
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/entities.json';

// Weekly report card drop schedule — published by a GitHub Action each Monday
export const DROP_SCHEDULE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/drop-schedule.json';

// Info / FAQ / transparency content — editable in the data repo without an app release
export const INFO_CONTENT_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/info.json';

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

// A user confirmed they avoided a platform this week
PlatformAvoidEvent {
  platformId: string     // references static platform list
  weekOf: string         // YYYY-MM-DD (Monday of that week)
}

// Cached FEC API result
LocalCache {
  key: string                        // normalized(brandName + areaHash) — NOT lat/long
  fecCommitteeId: string             // FEC committee ID
  donationSummary: DonationSummary | null
  confidence: number                 // 0–1 numeric score (ConfidenceLevel type alias)
                                     // compare against CONFIDENCE_THRESHOLD_HIGH / _MEDIUM
                                     // to derive display labels at render time
  fetchedAt: number                  // Unix timestamp — checked against ENTITY_CACHE_TTL_DAYS
}
```

### What is NEVER stored
- Any geolocation coordinates
- Any browsing history or visited URLs
- Any record of visiting or using a flagged entity ("support" events)
- Any personal identifier (name, email, device ID)
- Any data on the server side (MVP has no backend)

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
Pre-fetches FEC donation totals for all entities that have a verified `fecCommitteeId` and
writes the result to `entity.donationSummary` in `entities.json`. The matching pipeline reads
bundled `donationSummary` directly when present and fresh, skipping the live FEC API call.

- Fresh entries (within `ENTITY_CACHE_TTL_DAYS` of `lastVerifiedDate`) are skipped automatically.
- Pass `--force` to re-fetch everything: `npm run fetch:donations -- --force`
- Dissolved/new committees with no recorded activity produce a zeroed summary (`activeCycles: []`).
- Entities in `SEARCH_BY_NAME` (currently `google-alphabet`, `uber`) get a name-based pre-pass
  to correct suspect committee IDs before the main fetch loop.
- On fetch failure, `lastVerifiedDate` is cleared to `""` so the entity is retried on the next
  plain run without needing `--force`.
- Expected runtime: ~8–10 min for a full `--force` run (161 entities × ~3s deliberate delay
  per entity). Calls are fully serialized; 429 retries add 5s each but should be rare.
  Use `--force` when re-running after an attribution or filter fix — entities that "succeeded"
  with wrong data keep a fresh `lastVerifiedDate` and are skipped on plain runs.

**Schedule B attribution** — party is resolved via two fields in priority order:
1. `candidate_party_affiliation` on the disbursement record (sparse — often blank in FEC responses)
2. `recipient_committee.party` on the nested recipient committee object (reliably populated)
The endpoint is filtered to `recipient_committee_type=H|S|P` (House, Senate, Presidential
candidate committees only) to exclude operating expenses, bank fees, and non-federal contributions
that leaked through the former `recipient_type=P` filter.

Run `fetch:donations` after `verify:entities` whenever the entity list is updated.
Commit `entities.json` manually after reviewing the output.

---

## Report Card — Drop Mechanics

The weekly report card is a synchronized global event. Every user receives it at the exact same moment.

- A lightweight scheduled job determines the drop time at the start of each week (random within the configured window, avoiding the previous week's hour)
- The drop time is published to a read-only config endpoint (or GitHub-hosted JSON) — the app polls this
- Push notification fires at the exact drop time via Expo Push Notifications
- If notifications are disabled, the card is waiting when the user opens the app
- On-demand cards (generated anytime by the user) get a "PREVIEW" pixel art stamp — the weekly drop retains its specialness
- Extension data is NOT included in the report card (V1) — extension has its own in-popup weekly summary

---

## Browser Extension Behavior

- **Icon turns amber** when user visits a tracked domain — no popup, no banner, no interruption
- User clicks icon to open popup with business card (donation data, confidence, FEC link) + "AVOIDED" button
- Flags **once per session per domain** by default (configurable via EXTENSION_FLAG_FREQUENCY)
- User can snooze a domain ("don't remind me for 7 days")
- **No browsing history stored** — domain detection is in-memory only, cleared on session end
- Extension has its own simple weekly summary in the popup — does not feed into the mobile report card in V1

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
  canonicalName: string          // matches FEC committee/organization name
  aliases: string[]              // consumer-facing brand names
  domains: string[]              // for extension matching (e.g. ["amazon.com", "smile.amazon.com"])
  categoryTags: string[]
  ceoName: string                // operational CEO — for report card display
  publicFigureName?: string      // founder/owner when more culturally recognizable than CEO
                                 // (e.g. Jeff Bezos for Amazon, Rupert Murdoch for Fox/News Corp)
                                 // getDisplayFigure(entity) returns this when present, ceoName otherwise
  parentEntityId?: string        // links subsidiary to parent entity by id
  associatedPersonIds?: string[] // ids referencing assets/data/people.json (unused in display, V1)
  fecCommitteeId?: string | null // three-state:
                                 //   string — confirmed committee ID (populated by verify-entities.mjs)
                                 //   null   — confirmed no corporate PAC (see notes field)
                                 //   ""     — not yet verified (pipeline will attempt to fill)
                                 // When fecCommitteeRecords is present, kept in sync with the active record's id.
  fecCommitteeRecords?: FecCommitteeRecord[] // full history of PAC records for this entity
                                 // (dissolved + active). When present, the data pipeline uses
                                 // the active record's id as the primary fecCommitteeId fetch
                                 // target and logs dissolved records without fetching their data.
                                 // Handles entities that dissolved a former PAC and registered a
                                 // new one (e.g. att, exxonmobil, verizon, wells-fargo,
                                 // goldman-sachs, apple, koch-industries).
                                 // FecCommitteeRecord: { id, status: 'active'|'dissolved',
                                 //   registeredYear?, dissolvedYear? }
  verificationStatus: 'manual' | 'pipeline' | 'unverified'
                                 //   'manual'     — set by a human maintainer; pipeline skips unless --force
                                 //   'pipeline'   — confirmed by verify-entities.mjs via FEC API + JW score
                                 //   'unverified' — default; pipeline will attempt to fill fecCommitteeId
  donationSummary?: DonationSummary // bundled by fetch-donation-data.mjs; pipeline uses this
                                 // directly when present and fresh (within ENTITY_CACHE_TTL_DAYS
                                 // of lastVerifiedDate), skipping the live FEC API call
  lastVerifiedDate: string       // YYYY-MM-DD
}
```

---

## Environments

```typescript
// Never mock data in dev or prod. Mocks are for tests only.
// Use real OpenFEC API in dev with a dev API key (FEC_API_KEY in .env).
// FEC_API_KEY is optional for the app — FECClient runs in anonymous mode when absent.
// FEC_API_KEY is required for data pipeline scripts (fetch:donations, verify:entities).
// Keep environment config in .env files, never committed. See .env.example.

DEV   — local build, verbose logging on, real API calls (FEC_API_KEY recommended in .env)
TEST  — jest, mocked API responses only here
PROD  — release build, logging off, real API calls (FEC_API_KEY optional — anonymous mode available)
```

---

## Code Quality Rules

These apply to every file, every PR, every AI-generated change.

- **Prefer the simplest solution** — no over-engineering, no premature abstraction
- **No duplication** — check the codebase before adding anything. The matching logic in `/core/matching/` is the one source of truth for both mobile and extension
- **Files over 250 lines must be refactored** — split before continuing
- **No mock or stub data in dev or prod** — mocks live in tests only
- **Never overwrite a key file without confirming** — explain why first
- **Only make requested changes** — do not refactor unrelated code while fixing something else
- **When fixing a bug** — exhaust the existing pattern before introducing a new one. If you do introduce a new pattern, remove the old implementation
- **Environments are cleanly separated** — no prod config leaking into dev and vice versa
- **No one-off scripts in source files** — if a script only runs once, it doesn't belong in the codebase
- **No script execution in CC** — never run npm scripts, shell commands, or data pipeline scripts (fetch:donations, verify:entities, tsc, etc.) from within a CC session. Scripts are run manually by the developer. CC handles code changes only.

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
- Pixel art animations for feedback events (avoid taps, streaks, report card reveal)
- Custom assets designed by the team: logo, CEO avatars, business icons, badges, map markers, report card frame
- Retro sound effects (optional, off by default, user-toggleable)

---

## Current Sprint Focus

**Phase 1 MVP — build in this order:**

1. `/core/models/` — TypeScript types for all entities, events, cache ✅
2. `/core/matching/` — entity matching pipeline (test-driven) ✅
3. `/core/api/` — FEC API client with rate limiting and caching ✅
4. `/core/data/` — entity list loader, SQLite schema, local DB ✅
5. `features/Map/` — scan, flag, business card, avoid tap ✅
6. `features/Survey/` — weekly platform checklist ✅
7. `features/ReportCard/` — generation, drop timing, sharing ✅
8. `features/Onboarding/` — first-run flow ✅
9. `features/Info/` — transparency, about, FAQ ✅
10. `extension/` — Chrome/Firefox extension using shared core ✅

**Start with the core. Build one vertical slice (Map → flag → avoid tap) end-to-end before moving on.**

### Feature Status

| Feature / Milestone | Status |
|---|---|
| Core models, matching pipeline, FEC API client | ✅ Done |
| SQLite adapter (`app/storage/SqliteAdapter.ts`) | ✅ Done |
| Map scan, flag, business card, avoid tap | ✅ Done |
| Survey, Report Card, Onboarding, Info screens | ✅ Done |
| Browser extension (MV3, Chrome + Firefox) | ✅ Done |
| FEC entity verification run (`verify:entities`) | ✅ Done |
| Donation data bundled into `entities.json` | ✅ Done |
| Anonymous FEC API mode (no key required in app) | ✅ Done |
| App tested on physical device | 🔄 In progress |
| Extension tested in Chrome | ✅ Done |

---

## Modern Code Standards

> Apply these to **every file you write or edit**. These are not style preferences — they are correctness requirements. A deprecated API that works today will break on the next SDK update.

### Self-check rule
After writing any file, scan it once for deprecated APIs, `.then()` chains, `var`, `require()`, and `any`. Rewrite before finishing. If you are genuinely uncertain whether a method is current, flag it with a `// TODO: verify API is current for <package>@<version>` comment rather than silently shipping something that may fail at runtime.

---

### Dependencies
- Before using any library method, check the installed version in `package.json` and confirm the API is current for that version.
- Prefer explicit, minimal API calls over convenience wrappers that change between versions.
- Never install a new dependency without checking: (1) is there an existing dep that already does this? (2) is it actively maintained? (3) does it have a clean audit (`npm audit`)?

---

### Node / TypeScript
- **ESM only** — `import`/`export`, never `require()`/`module.exports`.
- **`async`/`await` only** — never `.then()`/`.catch()` chains.
- **`const` and `let` only** — never `var`.
- **`unknown` over `any`** — use `unknown` and narrow explicitly; `any` is banned except in test mocks where unavoidable.
- **`satisfies`** — use where type narrowing improves safety without widening the inferred type.
- **Optional chaining and nullish coalescing** — use `?.` and `??` where appropriate; avoid verbose `=== null || === undefined` guards.
- **Strict mode** — `tsconfig.json` has `"strict": true`. Never disable strict checks per-file.
- Do not use deprecated TypeScript utility types (e.g. `Readonly` is fine; `Extract`/`Exclude` are fine; avoid anything marked `@deprecated` in the TS release notes).

---

### React Native / Expo SDK 52
- Use **Expo SDK 52** APIs only. Check the SDK 52 changelog before using any Expo module.
- **Permissions** — use per-module async methods: `Location.requestForegroundPermissionsAsync()`, `Notifications.requestPermissionsAsync()`, etc. Never use the old unified `Permissions` API from `expo-permissions` (removed in SDK 45).
- **`expo-constants`** — use `Constants.expoConfig` not the deprecated `Constants.manifest`.
- **`expo-location`** — `getCurrentPositionAsync()` and `watchPositionAsync()` are current. Do not use removed methods.
- **`expo-sqlite`** — use the current `openDatabaseAsync()` / `SQLiteDatabase` API (SDK 52 switched to an async-first API). Do not use the old synchronous `openDatabase()` from SDK ≤ 50.
- **`expo-notifications`** — `scheduleNotificationAsync()` with typed trigger objects is current. Use `DateTriggerInput` etc. from the types; do not use the old string-based trigger format.
- **`expo-secure-store`** — `setItemAsync()` / `getItemAsync()` / `deleteItemAsync()` are current.

---

### Jest 29
- **`jest.createMockFromModule()`** — use this; never the legacy `jest.genMockFromModule()`.
- **`.toHaveBeenCalledWith()`** — use this; never the alias `.toBeCalledWith()`.
- **`.toHaveBeenCalled()`** — use this; never `.toBeCalled()`.
- **fetch mocking** — assign to `globalThis.fetch = jest.fn()` or use a dedicated mock library. Do not use `jest.spyOn(global, 'fetch')` — it is unreliable across Node versions.
- **Fake timers** — use `jest.useFakeTimers()` with `jest.runAllTimersAsync()` (Jest 29+); avoid the deprecated `jest.runAllTimers()` for async code.
- **`beforeEach` cleanup** — always call `jest.clearAllMocks()` (or `jest.resetAllMocks()`) in `beforeEach` to prevent state leaking between tests.

---

### Browser Extension (MV3)
- **Event listeners must be registered at the top level** of the service worker — never inside `async` functions, `setTimeout`, or `.then()` chains. Chrome terminates the SW between events; listeners not registered synchronously on startup will be missed.
- **`chrome.alarms`** — create alarms inside `chrome.runtime.onInstalled`, not at the module top level. Alarms persist across SW restarts; re-creating them on every wake is unnecessary and was the cause of a runtime crash (see commit `fad4a0e`).
- **Async message handlers** — return `true` synchronously from `onMessage` listeners that call `sendResponse` asynchronously, or the message port will close before the response is sent.
- **`chrome.action.setIcon`** — takes a `path` object keyed by pixel density string (`"16"`, `"32"`, etc.), not a single string.
- Do not use deprecated MV2 APIs (`chrome.browserAction`, `chrome.pageAction`, `webRequest` blocking mode, etc.).

---

### General
- **No `console.log` in production paths** — use it only in dev/test; remove or guard with an env check before shipping.
- **No magic numbers** — any threshold, TTL, size, or timing value belongs in `config/constants.ts`.
- **Error boundaries** — all async paths in hooks must handle rejection. Use the cancelled-flag pattern for `useEffect` cleanup (see `useInfoContent.ts` for the canonical example).
- **Update this section** — if you encounter a new deprecation warning, a breaking API change, or a pattern that caused a runtime bug in this project, add it here before finishing the session.
- **V2 cleanup — extension confidence CSS classes** — `extension/popup/popup.ts` derives `'HIGH'`/`'MEDIUM'` strings from the numeric confidence score solely to drive CSS class names (`confidence-badge HIGH`, `confidence-badge MEDIUM`). The display logic is correct, but the class names are legacy string-label artifacts. In V2, rename the classes to `confidence-badge--high` / `confidence-badge--medium` (BEM) and update the corresponding CSS. Not blocking for MVP.

---

## Entity Relationships

### parentEntityId — subsidiary → parent linkage
- `parentEntityId` links a subsidiary entity to its parent company by id
- **Report card** ladders up to the parent's `displayFigure` when `parentEntityId` is present — call `getDisplayFigure(entity, allEntities)` and pass the full entity list
- **Business card** is an informational screen and always shows the entity's own data (canonical name, confidence, FEC record); when `SHOW_FIGURE_NAME_IN_CARD` is true and `parentEntityId` is set, it additionally shows "via [Parent canonicalName]" under the figure name
- Do not conflate these two contexts — see §7 "CEO name context split" above

### associatedPersonIds — entity → people.json linkage
- `associatedPersonIds` is an array of ids referencing records in `assets/data/people.json`
- Currently unused in display — reserved for future individual donor lookup
- Do not use this field to drive any current UI — wait for the feature to be scoped

### Data file separation
- `entities.json` + `fecCommitteeId` → **corporate PAC contributions** (FEC committee filings)
- `people.json` + `fecContributorId` → **individual Schedule A contributions** (personal donations)
- Do not conflate these two sources; they are queried via different FEC API endpoints:
  - Corporate: `/committees/{id}/totals/`
  - Individual: `/schedules/schedule_a/?contributor_name=Last%2C+First`

### people.json schema — `PoliticalPerson`
- `id`: lowercase-hyphenated (e.g. `"elon-musk"`)
- `name`: FEC-formatted `"Last, First"` for API query compatibility
- `fecContributorId`: optional; populated by a future data pipeline step
- `associatedEntityIds`: list of entity ids this person is linked to
- `rolesByEntity`: map of entity id → role string (e.g. `{ "tesla": "CEO & Founder" }`)
- `notes`: freeform (e.g. `"Also donated via America PAC"`)

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

`CYCLES_SINCE_2016` in `scripts/fetch-donation-data.mjs` and `CYCLES_SINCE_2016`
in `core/api/FECClient.ts` must be updated manually when a new election cycle begins.
Both constants are candidates for renaming to `CYCLES_TO_FETCH` (more accurate now that 2026
is included) — not blocking for MVP but should be done alongside the next cycle update.

### raw line items — committee ID attribution (Priority: V2)
`FECLineItem` currently stores `lineNumber`, `description`, `amount`, `cycle`, and `isReceipt`.
When an entity has multiple `fecCommitteeRecords` (dissolved + active PACs), raw line
items from different committees are indistinguishable — there is no `committeeId` field
on `FECLineItem`.

### Independent Expenditures — IE tracking (Priority: V3)
The current data pipeline covers two FEC data sources:
- Corporate PAC contributions: Schedule B via `/schedules/schedule_b/` (filtered to candidate committee recipients)
- Individual donations: Schedule A via `/schedules/schedule_a/`

Independent Expenditures (Schedule E) are not currently tracked. IEs are spending by outside
groups — including corporate-affiliated ones — to support or oppose candidates, and are reported
separately from PAC contributions. For high-profile individuals (Musk, Bezos etc.) IE data may
represent their most significant political activity.

V3 should add an `ieContributions` field to both `Entity` and `PoliticalPerson` and query
`/schedules/schedule_e/` accordingly. Note: IE data requires a different query pattern — filer
is the spender, not the recipient. Do not conflate with Schedule A or B data.

---

## Data Maintenance / AI Verification Process

### AI verification sweep (run after each FEC data update)

When using an AI agent to verify or correct fecCommitteeId values, use this prompt pattern:

```
CRITICAL RULES FOR THE AI AGENT:
1. A valid corporate PAC committee name must contain the company's name or a clear derivative.
   Reject any match where the committee name is a person's name, contains "FOR CONGRESS",
   "FOR SENATE", "FOR HOUSE", or is clearly a political campaign committee.
2. "No activity on record" is a red flag — real active corporate PACs have financial activity.
   Flag these for manual review rather than auto-accepting.
3. Do maximum 2 searches per entity. Do not go deep.
4. If uncertain, set fecCommitteeId: "" (unverified) rather than accepting a questionable match.
5. Always cross-reference the entity's categoryTags against the committee name.
   A "retail" entity matched to a "CONSTRUCTION" committee is always wrong.
```
