# F*ck Fascists — Architecture Reference

> **Purpose of this file:** A single document for any developer or AI agent to read
> cold and fully understand the system — data flows, design decisions, privacy
> constraints, and how to continue building. Read this alongside `CLAUDE.md`.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Map](#2-repository-map)
3. [The Privacy Contract](#3-the-privacy-contract)
4. [Data Model](#4-data-model)
5. [Entity Matching Pipeline](#5-entity-matching-pipeline)
6. [CDN-Fetch-with-Bundled-Fallback Pattern](#6-cdn-fetch-with-bundled-fallback-pattern)
7. [Mobile App Architecture](#7-mobile-app-architecture)
8. [Browser Extension Architecture](#8-browser-extension-architecture)
9. [Report Card Drop Mechanics](#9-report-card-drop-mechanics)
10. [Storage Adapters](#10-storage-adapters)
11. [Build & Test](#11-build--test)
12. [Pre-Launch Checklist](#12-pre-launch-checklist)
13. [How to Add a Feature](#13-how-to-add-a-feature)
14. [Out of Scope (MVP)](#14-out-of-scope-mvp)

---

## 1. System Overview

Three products ship together at v1.0:

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   React Native App  │   │  Browser Extension  │   │    Shared Core      │
│   iOS + Android     │   │  Chrome + Firefox   │   │  TypeScript only    │
│   /app + /features  │   │  /extension         │   │  /core              │
└──────────┬──────────┘   └──────────┬──────────┘   └──────────┬──────────┘
           │                         │                          │
           └─────────────────────────┴──────────────────────────┘
                         both import from /core
```

**The mobile app** is the primary product. Users scan nearby businesses, tap
AVOIDED when they skip a flagged one, complete a weekly platform checklist, and
receive a synchronized weekly report card.

**The browser extension** detects flagged domains in-tab, turns the icon amber,
and lets users log avoidances without leaving the current page.

**The shared core** (`/core`) contains the entity matching pipeline, the
FEC API client, the storage adapter interface, and all shared TypeScript types.
It is framework-free — no React, no Expo, no Chrome APIs. Both products import
from it.

**Cross-surface rule:** the mobile business card and extension popup may differ
in layout, copy emphasis, and visual tone, but they are not allowed to drift on
material data behavior. Confidence handling, donation-data availability states,
FEC attribution links, and committee attribution rules must stay aligned across
both surfaces unless a deliberate V2 divergence is documented first.

---

## 2. Repository Map

```
/
├── CLAUDE.md               ← Non-negotiable product rules. Read first, always.
├── ARCHITECTURE.md         ← This file.
├── config/
│   └── constants.ts        ← ALL tunable values. Never hardcode elsewhere.
│
├── core/                   ← Framework-free TypeScript. Shared by app + extension.
│   ├── models/             ← Domain types: Entity, Events, Cache, Confidence
│   ├── matching/           ← Entity matching pipeline (normalize → fuzzy → score)
│   ├── api/                ← FEC API client with rate limiting
│   └── data/               ← StorageAdapter interface, entity list loader, eventStore
│
├── features/               ← React Native feature modules
│   ├── Map/                ← Geolocation scan, entity flag, BusinessCard, avoid tap
│   ├── Survey/             ← Weekly platform checklist
│   ├── ReportCard/         ← Drop timing, card generation, sharing
│   ├── Onboarding/         ← 5-step first-run flow
│   └── Info/               ← Transparency, about, FAQ, links (CDN-updatable)
│
├── App.tsx                 ← current app shell: onboarding gate + manual tab bar
├── app/
│   └── storage/            ← SqliteAdapter.ts (expo-sqlite mobile adapter)
│
├── extension/              ← Browser extension (Chrome/Firefox MV3)
│   ├── manifest.json       ← MV3 manifest
│   ├── types.ts            ← Message contract between content/background/popup
│   ├── storage/            ← ChromeStorageAdapter (implements StorageAdapter)
│   ├── background/         ← Service worker: domain check, session state, icons
│   ├── content/            ← Content script: hostname extraction
│   └── popup/              ← Pixel art UI: business card, AVOIDED, snooze, stats
│
├── assets/
│   └── pixel/              ← Pixel art assets (logo, CEO avatars, badges, markers)
│
└── scripts/
    └── build-extension.mjs ← esbuild config for the extension
```

### File size rule
**Any file exceeding 250 lines must be refactored before adding more code.** This
is enforced by `CLAUDE.md`. No exceptions.

---

## 3. The Privacy Contract

These are not preferences. Violating any of them is a product-ending bug.

| Constraint | Enforcement point |
|---|---|
| **No coordinates ever stored** | `areaHash.ts` converts GPS → fuzzy grid token before any cache write. `LocalCache.key` uses the hash, never `lat,lng`. |
| **No browsing history** | Extension content script captures hostname only (no path, no query string). Service worker stores nothing about what was browsed — only the `TabFlag` (which flag is active for a tab) lives in memory, cleared on navigation/tab close. |
| **No support events** | `EntityAvoidEvent` and `PlatformAvoidEvent` are the only event types. There is no `EntityVisitEvent`, `EntitySupportEvent`, or equivalent. Never add one. |
| **No personal identifiers** | No account, no email, no device ID. No user ID of any kind in MVP. All data is local-only. |
| **No backend (MVP)** | All processing is on-device. The only outbound calls are to the FEC API (from device) and the GitHub CDN (for the entity list, drop schedule, and Info content). |

### The areaHash boundary

```
GPS coords  →  toAreaHash()  →  "34.05,-118.25"  →  cache key
                                     ↑
                              ~1km grid square
                    (rounds lat/lng to 2 decimal places)

Coordinates NEVER leave this boundary. They are display-only in MapPin.coords.
```

---

## 4. Data Model

### What IS stored (all local-only)

```typescript
// core/models/events.ts

EntityAvoidEvent {
  entityId: string   // references canonical entity id
  date: string       // YYYY-MM-DD — NO time, NO location
  count: number      // incremented on each tap
}

PlatformAvoidEvent {
  platformId: string // references static platform list
  weekOf: string     // YYYY-MM-DD (Monday of that week)
}
```

```typescript
// core/models/cache.ts

LocalCache {
  key: string              // normalized(name) + ":" + areaHash — NOT lat/lng
  fecCommitteeId: string
  donationSummary: DonationSummary
  confidence: number       // 0–1 numeric score
  fetchedAt: number        // epoch ms, checked against ENTITY_CACHE_TTL_DAYS
}
```

### Entity schema (canonical list + CDN)

```typescript
// core/models/entity.ts

Entity {
  id: string
  canonicalName: string        // matches FEC committee name
  aliases: string[]            // consumer brand names (for alias matching)
  domains: string[]            // for extension domain lookup
  categoryTags: string[]
  ceoName: string
  publicFigureName?: string
  parentEntityId?: string
  associatedPersonIds?: string[]
  fecCommitteeId?: string | null
  fecCommitteeRecords?: FecCommitteeRecord[]
  verificationStatus: 'manual' | 'pipeline' | 'unverified'
  donationSummary?: DonationSummary
  lastVerifiedDate: string
}
```

### What is NEVER stored
- Geolocation coordinates
- Browsing history or visited URLs
- Any record of visiting/using a flagged entity
- Personal identifiers
- Server-side anything (MVP has no backend)

---

## 5. Entity Matching Pipeline

Lives in `core/matching/`. Used identically by the mobile app and extension.
All dependencies are injected via `MatchingDeps` — fully testable without mocks
leaking into production.

```
matchEntity(rawInput, deps, areaHash?)
    │
    ├─ 1. normalize(rawInput)
    │      lowercase → strip possessives/joiners → strip punctuation → trim
    │      "AT&T"         → "att"
    │      "McDonald's"   → "mcdonalds"
    │      "Chick-fil-A"  → "chickfila"
    │
    ├─ 2. cache check (deps.getCache)
    │      key = normalized + ":" + areaHash
    │      hit within ENTITY_CACHE_TTL_DAYS → return cached result immediately
    │
    ├─ 3. alias match (findByAlias)
    │      exact match against entity.aliases[] / canonicalName
    │      hit → confidence = 1.0
    │      use bundled donationSummary when present + fresh
    │      otherwise resolve/fetch FEC committee data
    │
    ├─ 4. FEC fuzzy search (deps.fetchOrgs)
    │      searchCommittees(normalizedName) → FECCommittee[]
    │      each result scored with jaroWinkler(normalized, normalized(orgname))
    │
    ├─ 5. pick best match (pickBestMatch)
    │      score >= CONFIDENCE_THRESHOLD_HIGH (0.85) → HIGH, fetch orgSummary
    │      score >= CONFIDENCE_THRESHOLD_MEDIUM (0.60) → MEDIUM, fetch orgSummary
    │      score < 0.60 → unmatched (no flag, show FEC.gov search link)
    │
    └─ 6. cache write (deps.setCache)
           always written — even MEDIUM results are cached to avoid repeat calls

Return type: MatchResult (discriminated union — matched: true/false)
```

### Key files

| File | Exports |
|---|---|
| `core/matching/normalize.ts` | `normalize(input)` |
| `core/matching/jaroWinkler.ts` | `jaroWinkler(s1, s2)` |
| `core/matching/aliasMatch.ts` | `findByAlias(normalized, entities)` |
| `core/matching/scorer.ts` | `scoreAll(normalized, orgs)`, `pickBestMatch(scores)` |
| `core/matching/pipeline.ts` | `matchEntity(rawInput, deps, areaHash?)` |
| `core/matching/types.ts` | `MatchResult`, `MatchingDeps`, `FECCommittee` |
| `core/matching/index.ts` | re-exports all of the above |

### Extension domain matching (different from pipeline)

For the extension, matching happens via **exact domain lookup**, not fuzzy name
scoring:

```typescript
// extension/background/domainMatch.ts
findByDomain(hostname, entities)
```

`entity.domains[]` lists every domain variant for a brand (including subdomains).
`findByDomain` does a case-insensitive exact match, with a `www.` strip fallback.
This is faster and more reliable than fuzzy matching when the domain is known.

### App card / popup parity

The app business card (`features/Map/components/BusinessCard.tsx`) and the
extension popup (`extension/popup/`) are separate UI implementations, but they
must present the same underlying data truth:

- confidence labels are always shown
- medium-confidence matches always surface a verification warning
- donation data may be unavailable without suppressing the entity flag itself
- FEC filing links should be shown whenever a committee URL can be derived
- formatting and emphasis can vary by surface, but attribution rules should not

If one surface gets a material data-state fix and the other does not, treat that
as documentation/process debt and address it in the same workstream whenever
practical.

---

## 6. CDN-Fetch-with-Bundled-Fallback Pattern

Used in three places. Always the same shape:

```
app launch (or service worker init)
    │
    ├─ 1. render/use bundled content immediately (zero wait, works offline)
    │
    └─ 2. fetch CDN version in background
               │
               ├─ success + valid → silently replace bundled content
               └─ any failure   → keep bundled content, no error shown
```

| Usage | Bundled source | CDN URL constant |
|---|---|---|
| Entity list | `entities.json` (bundled at build) | `ENTITY_LIST_UPDATE_URL` |
| Drop schedule | inferred from current week | `DROP_SCHEDULE_URL` |
| Info content | `features/Info/data/content.ts` | `INFO_CONTENT_URL` |

**⚠️ These three URLs in `config/constants.ts` contain `[org]` placeholders.**
Replace with the actual GitHub org before any user-facing build:

```typescript
// BEFORE (placeholder)
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/entities.json';

// AFTER (real)
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/your-org/fuckfascists-data/main/entities.json';
```

---

## 7. Mobile App Architecture

### Feature module anatomy

Every feature in `features/` follows this structure:

```
features/Foo/
├── types.ts               ← feature-specific types (not shared with other features)
├── FooScreen.tsx          ← top-level screen component, wire props here
├── hooks/
│   └── useFoo.ts          ← state management, async data, side effects
├── components/
│   └── FooBar.tsx         ← presentational components
├── data/
│   └── fooData.ts         ← static data or CDN fetchers
└── utils/
    └── fooHelpers.ts      ← pure functions, no React
```

### Map feature (vertical slice)

The Map feature has two match paths that converge at `matchEntity`:

**Manual search** — user types a name and taps the search button:
```
useEntityScan(deps, areaHash)
    ├─ scan(businessName) → matchEntity() → ScanResult
    └─ state: idle | scanning | matched | unmatched | error
                                    │
                               BusinessCard + AvoidButton
                                    │
                          recordEntityAvoid(adapter, entityId)
                          └─ writes EntityAvoidEvent { entityId, date, count:1 }
                             NO location, NO time-of-day
```

**Tap-to-match** — user taps the map directly:
```
iOS  → MapView.onPress   → useTapSearch.handleMapPress(e.nativeEvent.coordinate)
           │                   ├─ leading-edge debounce (TAP_DEBOUNCE_MS = 500ms)
           │                   ├─ in-memory cell cache (TAP_CACHE_TTL_MS = 10min, ~111m grid)
           │                   └─ MapKitSearch.searchNearby(lat, lng, 50m)
           │                          └─ MKLocalPointsOfInterestRequest (native, no GPS, no key)
           │                               → string[] of POI names
           │
Android → MapView.onPoiClick → useTapSearch.handlePoiClick(e.nativeEvent)
           │                   └─ e.nativeEvent.name (NOT e.name — e returns undefined)
           │
           └─ matchEntity(name, deps, areaHash) for each name → FlagMarker at tap coordinate
```

**Native module:** `MapKitSearchModule` (iOS only) — Expo Modules API (`ExpoModulesCore.Module`).
Swift source: `ios/MapKitSearchModule.swift`. Active after `expo prebuild` + native build.
TS wrapper (`features/Map/nativeModules/MapKitSearch.ts`) returns `[]` silently when not linked.
Do not use `MKLocalSearch.Request` — it throws `MKErrorDomain error 4` without a `naturalLanguageQuery`.

`App.tsx` opens `SqliteAdapter`, loads bundled entities immediately, attempts a
CDN refresh in the background, and constructs a single `FECClient` for the app
lifetime. `MapScreen` receives `entities`, `adapter`, `fetchOrgs`, and
`fetchOrgSummary` as props to keep dependencies explicit and testable.

### Survey feature

Platforms are a **static list** in `features/Survey/data/platforms.ts` (12
curated platforms at MVP). The weekly reset is automatic — `getMondayOf(new Date())`
is called fresh each render, so the survey naturally empties itself on Mondays
without any scheduler.

```
useWeeklySurvey()
    ├─ weekOf = getMondayOf(new Date())  ← recomputed each render
    ├─ loads PlatformAvoidEvents for current weekOf
    └─ avoid(platformId) → recordPlatformAvoid(adapter, platformId)
                           └─ writes PlatformAvoidEvent { platformId, weekOf }
```

### Report card

`hasDropped` is computed as `Date.now() >= dropAt` on each render — no polling,
no `setInterval`. Re-evaluates naturally when the user opens the screen.

Preview cards (generated on-demand by the user) receive a `PREVIEW` pixel-art
stamp. Only the official weekly drop card is stamp-free.

`ReportCardView` wraps its root `<View>` in `forwardRef` — this is a pre-wire
for `react-native-view-shot` image capture in Phase 2 (sharing as an image).
Phase 1 shares as text via the native Share sheet.

### Onboarding

Stored in `expo-secure-store` as key `'onboarding_complete'`. The navigator reads
this flag on mount. `null` means loading (renders nothing). `false` means not
complete (renders `OnboardingNavigator`). `true` means complete (renders the main
app). Permission OS dialogs fire inline in `PermissionScreen` — the user advances
regardless of whether they grant or deny (permissions can be granted later in
Settings).

### Info

All content (tagline, description, FAQ entries, transparency points, links) is
stored in `BUNDLED_CONTENT` in `features/Info/data/content.ts`. The CDN version
at `INFO_CONTENT_URL` can replace this without an app release. The version number
visible in the page header updates live when CDN content loads, giving a visible
confirmation that the update worked.

---

## 8. Browser Extension Architecture

### Three-layer message flow

```
content/detector.ts   →  extension/background/service-worker.ts  →  popup/popup.ts
(every page load)            (message router + state)                  (on popup open)

Messages:
content → SW:   CHECK_DOMAIN { hostname, tabId: -1 }
                (SW uses sender.tab.id as authoritative tab ID)

popup  → SW:    GET_CURRENT_FLAG  { tabId }     → TabFlag | null
                AVOID_ENTITY      { tabId }     → { ok: boolean }
                SNOOZE_DOMAIN     { hostname, durationMs } → { ok: boolean }
                GET_WEEKLY_STATS  { weekOf }    → WeeklyStats
```

### Service worker state

```
In-memory (cleared when SW terminates — by spec):
  tabFlags:          Map<tabId, TabFlag>     ← what's flagged on each tab
  domainLastFlagged: Map<hostname, epoch>    ← for frequency throttling

Persisted in chrome.storage.local:
  cache:<key>                  ← LocalCache entries (shared with entity matching)
  avoid:entity:<id>:<date>     ← EntityAvoidEvent records
  avoid:platform:<id>:<week>   ← PlatformAvoidEvent records
  snooze:<hostname>            ← SnoozeRecord { hostname, until: epoch }
  fec_api_key                  ← optional FEC API key (never hard-coded)
  entity_list                  ← cached CDN entity list
```

### Domain detection flow

```
page loads → detector.ts sends CHECK_DOMAIN(hostname)
                │
                ▼
service-worker.ts:handleCheckDomain(hostname, tabId)
    │
    ├─ findByDomain(hostname, entities)  ← exact match, O(n) over entity list
    │   no match → return (icon stays default)
    │
    ├─ isSnoozed(hostname)  ← chrome.storage.local lookup
    │   snoozed → return
    │
    ├─ shouldFlag(hostname)  ← EXTENSION_FLAG_FREQUENCY gate
    │   'session': already in domainLastFlagged → return
    │   'daily': last < 24h ago → return
    │   'weekly': last < 7d ago → return
    │
    ├─ cache check  ← getCache('ext:' + entity.id)
    │   hit + within TTL → use cached DonationSummary
    │   miss → FECClient.fetchOrgSummary(fecCommitteeId)
    │
    ├─ setTabFlag(tabId, flag)    ← in-memory only
    ├─ recordFlagged(hostname)    ← in-memory only
    └─ setAmberIcon(tabId)        ← chrome.action.setIcon
```

### Icon states

| State | Icon | Trigger |
|---|---|---|
| Default | Standard pixel art | No match, or tab navigated away |
| Amber | Amber variant | `handleCheckDomain` matched a flagged entity |
| Resets to default | — | `tabs.onUpdated` (loading), `tabs.onRemoved` |

### Entity list refresh

The service worker creates a daily `chrome.alarms` alarm (`entity-list-refresh`)
on startup. On each alarm tick, `refreshEntityList()` fetches the CDN list and
writes it to `chrome.storage.local` as `entity_list`. The in-memory `entities`
array is also updated so subsequent domain checks use the new list without an
SW restart.

---

## 9. Report Card Drop Mechanics

```
Start of week (GitHub Action — not yet built):
    ├─ generates random drop time within REPORT_CARD_WINDOW (Fri 4pm–Sat 3pm ET)
    ├─ avoids the previous week's drop hour
    └─ publishes { dropAt: epoch, weekOf: 'YYYY-MM-DD' } to DROP_SCHEDULE_URL

Mobile app (useDropSchedule):
    ├─ fetches DROP_SCHEDULE_URL on mount
    ├─ if dropAt is in the future → schedules Expo local notification
    └─ hasDropped = Date.now() >= dropAt (re-evaluated on each render)

ReportCardScreen states:
    ├─ loading         → spinner
    ├─ hasDropped=true → generateReportCard(adapter, entities, platforms, weekOf, false)
    │                    → official card + SHARE button
    └─ hasDropped=false → PREVIEW button → generateReportCard(..., isPreview: true)
                          → card with PREVIEW pixel stamp
```

`generateReportCard` filters `EntityAvoidEvent[]` to `[weekOf, nextMonday)` and
`PlatformAvoidEvent[]` for `weekOf`. Groups entity avoids by `entityId`, sums
`count`, sorts descending by count.

---

## 10. Storage Adapters

The `StorageAdapter` interface in `core/data/adapters.ts` is the contract both
products implement. Never call `chrome.storage` or `expo-sqlite` directly from
feature code — always go through the adapter.

```typescript
interface StorageAdapter {
  getCacheEntry(key: string): Promise<LocalCache | null>
  setCacheEntry(entry: LocalCache): Promise<void>
  upsertEntityAvoid(event: EntityAvoidEvent): Promise<void>
  getEntityAvoids(entityId?: string): Promise<EntityAvoidEvent[]>
  upsertPlatformAvoid(event: PlatformAvoidEvent): Promise<void>
  getPlatformAvoids(weekOf?: string): Promise<PlatformAvoidEvent[]>
}
```

| Product | Implementation | Location |
|---|---|---|
| Mobile (iOS/Android) | `SqliteAdapter` | `app/storage/SqliteAdapter.ts` |
| Browser extension | `ChromeStorageAdapter` | `extension/storage/ChromeStorageAdapter.ts` |
| Tests | In-memory mock | Each test file's `beforeEach` |

`makeCacheDeps(adapter)` in `core/data/cacheStore.ts` converts an adapter into
the `{ getCache, setCache }` shape expected by `MatchingDeps`. Use it wherever
you need to pass the adapter to the matching pipeline.

`recordEntityAvoid` and `recordPlatformAvoid` in `core/data/eventStore.ts` are
the only two functions that should write avoid events. Never call
`adapter.upsertEntityAvoid` directly from feature code.

---

## 11. Build & Test

### Tests

```bash
npm test              # jest --all
npm run test:watch    # jest --watch
npm run typecheck     # tsc --noEmit (no emit)
```

Jest config (`jest.config.ts`) picks up all `**/__tests__/**/*.test.ts` files.
Test environment is `node` — React Native components are not yet under test
(Expo managed workflow testing requires additional setup).

**Mocks are for tests only.** Never use mock data in dev or prod. Use real FEC
API calls with a dev API key stored in `.env` (never committed).

### Extension

```bash
npm run build:ext         # one-shot build → dist/extension/
npm run build:ext:watch   # incremental watch mode
```

Load `dist/extension/` as an unpacked extension in Chrome
(`chrome://extensions` → Developer mode → Load unpacked).

Three bundles produced by `scripts/build-extension.mjs`:
- `background/service-worker.js` — ESM (required by MV3)
- `content/detector.js` — IIFE
- `popup/popup.js` — IIFE

Static assets (manifest, popup.html, popup.css, icons/) are copied to
`dist/extension/` on each build.

### Mobile app

```bash
npm run start      # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
```

`App.tsx` currently wires `SqliteAdapter` directly and renders a lightweight
manual tab shell instead of a navigation library. If navigation is introduced
later, preserve the existing onboarding gate and explicit screen dependencies.

---

## 12. Pre-Launch Checklist

These items are **incomplete or placeholder** in the current codebase:

- [ ] **Replace `[org]` placeholders** in `config/constants.ts` — three URLs
      need the real GitHub org name before any user-facing build.
- [ ] **Add extension FEC API key UX** — `service-worker.ts` reads optional
      `fec_api_key` from `chrome.storage.local`, but there is no options UI or
      install-time prompt yet for users to set or change it.
- [ ] **Create `fuckfascists-data` GitHub repo** — must contain:
      - `entities.json` — curated entity list
      - `drop-schedule.json` — weekly drop schedule (published by a GitHub Action)
      - `info.json` — Info screen content (FAQ, transparency points, links)
- [ ] **GitHub Action for drop schedule** — runs every Monday, generates a random
      drop time within `REPORT_CARD_WINDOW_*` constants, writes `drop-schedule.json`.
- [ ] **Expo EAS build config** — `eas.json` for `.ipa` and `.apk` production builds.
- [ ] **iOS native module activation** — run `expo prebuild --platform ios`, add
      `ios/MapKitSearchModule.swift` to the Xcode project target, then build. Until
      this is done, iOS tap-to-search silently returns no results (no crash, no error).
- [ ] **Add pixel art assets** to `assets/pixel/` — logo, CEO avatars, badges,
      map markers, report card frame, animated feedback sprites.
- [ ] **Extension options page** (optional) — for users to enter/change their
      FEC API key after install.

---

## 13. How to Add a Feature

### New screen (mobile)

1. Create `features/MyFeature/` following the anatomy in §7.
2. Add types to `features/MyFeature/types.ts` — keep them feature-local unless
   shared across features (in which case, add to `core/models/`).
3. Write the hook in `features/MyFeature/hooks/useMyFeature.ts`.
4. Write pure utils in `features/MyFeature/utils/` (these are unit-testable
   without React).
5. Compose the screen in `features/MyFeature/MyFeatureScreen.tsx`.
6. Add the screen to the tab/stack navigator in `app/navigation/`.
7. Write tests for pure utils and hooks in `features/MyFeature/__tests__/`.

### New entity field

1. Add to `Entity` in `core/models/entity.ts`.
2. Add to `isValidEntity` in `core/data/entityList.ts` (validation).
3. Update `features/Info/data/content.ts` and `features/Info/types.ts` if
   it's user-visible on the Info screen.
4. Update `entities.json` in the `fuckfascists-data` repo.

### New configurable value

Add it **only** to `config/constants.ts`. Export it. Import it wherever needed.
Never inline the literal value anywhere else.

### New storage method

1. Add the method signature to `StorageAdapter` in `core/data/adapters.ts`.
2. Implement it in `extension/storage/ChromeStorageAdapter.ts`.
3. Implement it in `app/storage/SqliteAdapter.ts`.
4. Add DDL to `core/data/schema.ts` if it needs a new table.

---

## 14. Out of Scope (MVP)

Do not build these. They are explicitly deferred.

| Feature | Phase |
|---|---|
| Background location tracking | — (never, by privacy contract) |
| Storage of browsing history | — (never, by privacy contract) |
| "Support" events (user visited/used flagged entity) | — (never, by product contract) |
| Safari extension | Phase 2 |
| Cross-device sync (extension ↔ mobile) | Phase 2 |
| Widgets / Watch integration | Phase 2 |
| Social features / leaderboards | — |
| Server-side analytics / telemetry | — |
| Donation processing | Phase 3 |
| Real-time backend services | Phase 3 |
| Extension data in mobile report card | Phase 2 |
| Owner-level donation inference | — |
