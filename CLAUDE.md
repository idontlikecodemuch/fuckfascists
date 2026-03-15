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

**Update cadence:** PROGRESS.md after every session. CLAUDE.md continuously. README.md and SPEC_VS_CURRENT.md when features ship or decisions resolve. Never modify the original spec.

**New instance checklist:** Read PROGRESS.md first, then CLAUDE.md, then check SPEC_VS_CURRENT.md open decisions — don't re-litigate resolved ones.

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

API keys and credentials must **only ever be read from environment variables**. This is a hard rule.

- **Never hardcode any key, token, or credential** in source files, config files, or comments. `.env` is gitignored; `.env.example` shows placeholders only. Hardcoded keys are bugs — remove immediately and rotate.
- **`FECClient` supports anonymous mode** — runs without `FEC_API_KEY`, making requests with no `api_key` param (lower rate limits). `console.warn` in non-prod when key is absent.
- **`FEC_API_KEY` is required for data pipeline scripts** — they make hundreds of requests and exit with an error when the key is missing.

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
| Networking | Native fetch — OpenFEC API (primary); CDN for entity list updates |
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
│   ├── dropSchedule/                ← deterministic PRNG drop time (computeDropTime.ts)
│   ├── utils/                       ← shared utilities (localDate.ts, etc.)
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
├── ios/                             ← generated by expo prebuild; committed to repo
├── modules/
│   └── mapkit-search/               ← local Expo native module (iOS MKLocalPointsOfInterestRequest bridge)
└── assets/
    └── pixel/                       ← all pixel art assets by type
```

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

// Drop schedule is computed deterministically on-device — no CDN fetch needed.
// See core/dropSchedule/computeDropTime.ts. V2: optional server override — see Known Limitations.

// Info / FAQ / transparency content — editable in the data repo without an app release
export const INFO_CONTENT_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/info.json';

// Map POI tap search — dynamic radius computed from visible region span.
// Default fallback when region is unavailable; min/max clamps for the dynamic calculation.
export const POI_SEARCH_RADIUS_METERS = 50;
export const POI_SEARCH_RADIUS_MIN_METERS = 15;
export const POI_SEARCH_RADIUS_MAX_METERS = 200;
export const TAP_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const TAP_DEBOUNCE_MS = 500;

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
  fecCommitteeId: string
  donationSummary: DonationSummary | null
  confidence: number                 // 0–1; compare against CONFIDENCE_THRESHOLD_HIGH/_MEDIUM at render time
  fetchedAt: number                  // Unix timestamp — checked against ENTITY_CACHE_TTL_DAYS
}
```

### What is NEVER stored
- Any geolocation coordinates
- Any browsing history or visited URLs
- Any record of visiting or using a flagged entity ("support" events)
- Any personal identifier (name, email, device ID)

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

---

## Report Card — Drop Mechanics

The weekly report card is a synchronized global event. Every user with the same app version receives it at the exact same moment — computed entirely on-device with no network dependency.

- Drop time is computed deterministically via PRNG in `core/dropSchedule/computeDropTime.ts` — same ISO week year + week number always produces the same result on every install, forever
- Seed: djb2 hash of `"ff-drop-{year}-W{week}"` mod 23, mapped to an hour offset within the Friday 4pm ET – Saturday 3pm ET window (23 hours, EST = UTC-5 hardcoded for MVP)
- Collision rule: if this week's hour matches last week's, advance by 1 hour (wrapping within the window) — fully deterministic
- No network fetch for the schedule — `useDropSchedule` calls `getCurrentDropTime()` synchronously, no loading state
- Push notification is scheduled locally at the computed drop moment via Expo Notifications
- If notifications are disabled, the card is waiting when the user opens the app
- On-demand cards (generated anytime by the user) get a "PREVIEW" pixel art stamp — the weekly drop retains its specialness
- Extension data is NOT included in the report card (V1) — extension has its own in-popup weekly summary

**V2:** An optional lightweight server ping may add schedule overrides — see "Known Limitations / Technical Debt → V2: Optional Server Schedule Override."

---

## Browser Extension Behavior

- **Icon turns amber** when user visits a tracked domain — no popup, no banner, no interruption
- User clicks icon to open popup with business card (donation data, confidence, FEC link) + "AVOIDED" button
- Flags **once per session per domain** by default (configurable via EXTENSION_FLAG_FREQUENCY)
- User can snooze a domain ("don't remind me for 7 days")
- **No browsing history stored** — domain detection is in-memory only, cleared on session end
- Extension has its own simple weekly summary in the popup — does not feed into the mobile report card in V1

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
  ceoName: string                    // operational CEO — report card display
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

**Phase 1 MVP — feature status:**

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
| App built and running on iOS simulator | ✅ Done — `FckFascists.app` installed on iPhone 16 Pro simulator |
| App tested on physical device | 🔄 Pending |
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
  - **Native guard (defense-in-depth):** `AIRMap.m` patched with `if (subview == nil) return` at the top of `insertReactSubview:atIndex:`, `removeReactSubview:`, and `addSubview:`. This prevents the `NSInvalidArgumentException` even if a nil subview leaks through from the Fabric reconciler for any reason. **This patch lives in the Pods source and will be overwritten by `pod install`.** If it recurs, add a `post_install` hook in the Podfile to re-apply the guard, or pin a forked react-native-maps pod.
- **react-native-maps — `onRegionChangeComplete` render loop** — storing the map region in `useState` and passing the setter directly to `onRegionChangeComplete` creates an infinite re-render loop: region change → setState → re-render MapView → region change → ... The app freezes. **Fix:** Store region in a `useRef` instead of `useState` — the region is only consumed by zoom callbacks (never rendered directly), so it doesn't need to trigger re-renders. `MapScreen.tsx` uses `regionRef` with a stable `handleRegionChange` callback. Do not revert this to `useState`.
- **react-native-maps — map snap-back on location update** — a `useEffect` depending on `location.coords` that unconditionally calls `animateToRegion` will snap the map back to the user's position every time coords get a new object reference (e.g. location button press, tab re-mount). **Fix:** Use a `hasInitiallyCentered` ref guard so the auto-center fires exactly once on mount. For the location button, use a separate `pendingRecenter` ref flag + effect pattern: set the flag before calling `requestLocation`, then the effect only animates when the flag is true. Do not combine initial centering and explicit re-centering into a single unguarded effect.
- **POI search radius tuning** — `computeSearchRadius()` uses 2% of the visible map span (not 5%). At 5%, the auto-center zoom (`latitudeDelta: 0.02`) produced a 111m radius — over a city block. At 2% with min clamp 15m, street-level taps resolve to individual buildings. If cross-street matches recur, reduce the multiplier further or add a hard cap below 50m.
- **V2 cleanup — extension confidence CSS classes** — `popup.ts` uses `'HIGH'`/`'MEDIUM'` string class names derived from numeric scores. In V2, rename to BEM format (`confidence-badge--high`/`--medium`).

---

## Entity Relationships

### parentEntityId — subsidiary → parent linkage
- Report card ladders up to parent's `displayFigure` via `getDisplayFigure(entity, allEntities)`.
- Business card always shows the entity's own data; when `SHOW_FIGURE_NAME_IN_CARD` is true and `parentEntityId` is set, also shows "via [Parent canonicalName]".
- Do not conflate these contexts — see Principle §7.

### associatedPersonIds — entity → people.json linkage
- Unused in V1 display. Reserved for future individual donor lookup. Do not use to drive current UI.

### Data file separation
- `entities.json` + `fecCommitteeId` → corporate PAC contributions (`/committees/{id}/totals/`)
- `people.json` + `fecContributorId` → individual Schedule A contributions (`/schedules/schedule_a/`)
- Do not conflate — different FEC endpoints, different data semantics.

### people.json schema — `PoliticalPerson`
`id` (lowercase-hyphenated), `name` (FEC-formatted "Last, First"), `fecContributorId?`, `associatedEntityIds[]`, `rolesByEntity` (entity id → role string), `notes`.

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

### service-worker.ts over 250 lines (Priority: V1 cleanup)
`extension/background/service-worker.ts` is 393 lines — over the 250-line file limit. Pre-existing violation; was 361 lines before the API key removal session. Refactor plan: extract `handleCheckDomain`, `isBundledDataFresh`, and related data-fetch logic into `extension/background/domainCheck.ts`. The message router, tab lifecycle listeners, and alarm handler stay in `service-worker.ts`.

### CYCLES_SINCE_2016 — cycle constant update (Priority: V1.5)
`CYCLES_SINCE_2016` in `scripts/fetch-donation-data.mjs` and `core/api/FECClient.ts` must be updated manually when a new election cycle begins. Both are candidates for renaming to `CYCLES_TO_FETCH` (more accurate now that 2026 is included) — not blocking for MVP but should be done alongside the next cycle update.

### Schedule B filter non-functional — pipeline performance (Priority: V1.5)
`recipient_committee_type=H|S|P` is silently ignored by the FEC API — all disbursements are fetched and filtered client-side. Large PACs (Walmart: ~9,500 records) are slow. Fix: switch to `/schedules/schedule_b/by_recipient_id/` + party lookup per recipient. Would reduce Walmart from ~96 API pages to ~2. Correct totals now, just slow.

### raw line items — committee ID attribution (Priority: V2)
`FECLineItem` has no `committeeId` field. When an entity has multiple `fecCommitteeRecords`, raw line items from different committees are indistinguishable.

### Independent Expenditures — IE tracking (Priority: V3)
Schedule E (independent expenditures) is not tracked. IEs are spending by outside groups to support/oppose candidates — for high-profile individuals (Musk, Bezos) this may be their most significant political activity. V3 should add `ieContributions` to `Entity` and `PoliticalPerson` and query `/schedules/schedule_e/`. IE data uses a different query pattern (filer = spender, not recipient) — do not conflate with Schedule A or B.

### AIRMap.m nil guard patch — pod install fragile (Priority: V1 hardening)
`AIRMap.m` in the `react-native-maps` pod has been patched with nil guards on `insertReactSubview:atIndex:`, `removeReactSubview:`, and `addSubview:`. This patch is overwritten on every `pod install`. Options: (1) add a `post_install` hook in the Podfile that patches the file automatically, (2) fork `react-native-maps` and pin to the fork, (3) upstream the fix. Option 1 is the lowest-friction V1 solution.

### V2: Optional Server Schedule Override
Drop time is computed on-device (see `core/dropSchedule/computeDropTime.ts`). V2 may add a lightweight server ping for: schedule overrides, entity list freshness checks, info content freshness checks. Constraints: minimal data (version hashes only, no payloads), no user-identifying or behavioral data, app functions identically if ping fails. The ping is a freshness hint, not a dependency. Do not build now.

---

## Data Maintenance

See header comments in `scripts/verify-entities.mjs` for AI verification rules.
