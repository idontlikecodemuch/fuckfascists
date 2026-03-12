# F*ck Fascists — Progress & Current State

This document is updated continuously. New instances should read this first — it tells you where we are, what was just done, and what needs to happen next.

---

## Current Sprint: MVP V1 — Core Vertical Slice

**Overall status:** Feature-complete. iOS app built and running on simulator. Physical device test next.

---

## Last 5 Sessions (most recent first)

### Session: March 12, 2026
**Focus:** iOS prebuild repair — mapkit-search local module wiring via `file:` reference

**Context:** Previous CC instance attempted to register `modules/mapkit-search/` as an Expo autolinking search path. This caused two cascading prebuild failures:
1. `expo.autolinking.searchPaths: ["./modules"]` replaces (not appends) the default paths → react-native not found → `reactNativePath` undefined → Ruby `Pathname.new(nil)` crash
2. Adding `"./node_modules"` to fix failure 1 → duplicate ExpoModulesCore pod installation → second crash

The same previous instance also had `"overrides": { "tar": "^7.0.0" }` in package.json (the original root cause it was trying to fix) still committed at HEAD.

**Completed:**
- Diagnosed full state: committed HEAD had tar override; working copy had autolinking.searchPaths; generated ios/ was from a broken/partial prebuild run
- Clean-up: `git checkout -- .` reverted all tracked changes; `git clean -fd -e modules/` removed the broken generated ios/ while preserving `modules/mapkit-search/` (the local Expo module package)
- Fixed `package.json`:
  - Removed `"overrides": { "tar": "^7.0.0" }` — this was blocking `@expo/cli`
  - Added `"mapkit-search": "file:./modules/mapkit-search"` to `dependencies` — the correct approach; normal node_modules resolution finds the module without any `searchPaths` override
  - Updated scripts: `expo start --android` → `expo run:android`, `expo start --ios` → `expo run:ios`
  - **Did not add `expo.autolinking` section** — hard constraint; this approach does not require it
- Fixed `app.json`: added `"ios": { "bundleIdentifier": "com.anonymous.fuckfascists" }` — required for `expo prebuild` to succeed
- `npm install` — picked up the `file:` reference cleanly
- `expo prebuild --platform ios --clean` — **succeeded end to end** (✅ Cleared ios, ✅ Created native directory, ✅ Finished prebuild, ✅ Installed CocoaPods)
- Confirmed MapKitSearch pod was auto-linked without any `searchPaths` config:
  - `MapKitSearchModule.swift` in Pods Sources
  - `libMapKitSearch.a` static library target created
  - Resolved path: `../../modules/mapkit-search/ios` (correct)
- `expo run:ios` — compiled with **0 errors, 0 warnings**; blocked only by environment: Xcode 16.4 ships with iOS 18.5 SDK, only iOS 18.3 simulator runtime is installed → no eligible destinations

**Architecture note — `ios/MapKitSearchModule.swift` (root-level):**
The Swift source now lives authoritatively at `modules/mapkit-search/ios/MapKitSearchModule.swift`. The root-level `ios/MapKitSearchModule.swift` committed in the prior session was a redundant copy added before the module package structure existed. It is removed in this commit. CocoaPods builds from the podspec path in `modules/`.

**Build result (confirmed after session):**
- `npx expo run:ios` completed successfully — `FckFascists.app` built and installed to iPhone 16 Pro simulator (`com.anonymous.fuckfascists`)
- App displays as "F*ck Fascists" in the simulator app list
- To launch: `xcrun simctl launch 445D6A63-7999-4272-970C-9E22FED529FA com.anonymous.fuckfascists` + run `npx expo start` for Metro

**Pending:**
- Physical device test remains outstanding
- Run `npx expo start` and launch from simulator to do a full interactive smoke test

---

### Session: March 11, 2026 (follow-up 2)
**Focus:** Map POI tap — coordinate-parameterized nearby search

**Completed:**
- Introduced Expo Modules API native module pattern (first native module in repo)
- `modules/mapkit-search/ios/MapKitSearchModule.swift` — Swift Expo module using `MKLocalPointsOfInterestRequest` (NOT `MKLocalSearch.Request`). Auto-linked via `file:./modules/mapkit-search` dependency + expo-module.config.json. Module gracefully absent = iOS tap returns no results silently.
- `features/Map/nativeModules/MapKitSearch.ts` — TS wrapper; returns `[]` when module not linked (Expo Go, pre-prebuild). Uses `requireNativeModule` from expo-modules-core (transitive dep).
- `features/Map/hooks/useTapSearch.ts` — handles both platform paths:
  - iOS: `handleMapPress` → `MapKitSearch.searchNearby(lat, lng, 50m)` → `matchEntity` for each name
  - Android: `handlePoiClick` → `e.nativeEvent.name` (NOT `e.name`) → `matchEntity` direct
  - In-memory cell cache: 10min TTL, ~111m grid key, console.log on cache hit
  - `markTapPinAvoided` exposed so MapScreen can keep avoid state consistent across both pin arrays
- `config/constants.ts` — added `POI_SEARCH_RADIUS_METERS = 50` and `TAP_CACHE_TTL_MS = 10min`
- MapScreen refactored (was 259 lines, over limit): extracted `MapSearchBar`, `UnmatchedBanner`
- `features/Map/components/TapLoadingMarker.tsx` — pulsing amber dot at tap coordinate; respects system reduced-motion setting via `AccessibilityInfo.isReduceMotionEnabled()`
- `MapScreen.tsx` wired: `onPress` (iOS only), `onPoiClick` (Android), `allPins` merges search + tap pins, `resetTapPins` called on new search
- `tsc --noEmit` clean; 261 tests passing

**Pending (iOS):**
- ~~Run `expo prebuild --platform ios` to generate `/ios` directory~~ ✅ Done (March 12 session)
- ~~Add `ios/MapKitSearchModule.swift` to the Xcode project target~~ ✅ Auto-linked via modules/ package structure
- Build and test acceptance criteria on device (blocked on iOS 18.5 simulator runtime)

---

### Session: March 11, 2026 (follow-up)
**Focus:** entities.json review and commit

**Completed:**
- Verified --force fetch run complete: 153 entities with R donations, 155 with D donations
- Spot-checked Walmart ($3.65M R / $3.1M D), Amazon ($2.76M R / $2.79M D), and others — all correct
- Removed stale `donationSummary` from perdue-farms (fecCommitteeId: null — false-positive match to PERDUE FOR SENATE candidate committee from a prior pipeline run)
- Committed entities.json (aabe30d)
- entities.json now clean and ready for app/extension testing

**Pending:**
- sherwin-williams, baker-hughes, chick-fil-a — cleared lastVerifiedDate; run plain `fetch:donations` to retry

---

### Session: March 11, 2026
**Focus:** Schedule B attribution root-cause fix, pipeline performance, rate-limit rewrite

**Completed:**
- Diagnosed why partisan donation totals were $0 for all major entities (Walmart, Home Depot, Amazon, etc.):
  - `recipient_type=P` was not filtering to presidential candidates — it was returning all Schedule B disbursements (bank fees, merchant fees, nonfederal contributions leaked through)
  - `candidate_party_affiliation` is blank on FEC Schedule B responses even for legitimate candidate contributions
  - Result: 158 of 161 entities had zero partisan totals; all candidate contributions falling into `raw[]`
- Fixed Schedule B filter: `recipient_type=P` → `recipient_committee_type=H&recipient_committee_type=S&recipient_committee_type=P` (House, Senate, Presidential candidate committees only) in both `FECClient.ts` and `fetch-donation-data.mjs`
- Fixed party attribution: added `recipient_committee.party` as fallback when `candidate_party_affiliation` is blank — applied identically in both files
- Added test for `recipient_committee.party` fallback (24 tests total, all passing)
- Fixed `looksSuspiciouslyZeroed` bug in `pipeline.ts` — `rawItems.length >= 0` was always true, causing entities with non-empty `raw[]` (e.g. Walmart) to have their bundled summary rejected and fall back to a failing live API call, showing "donation data temporarily unavailable"
- Diagnosed persistent 429 cascades: fixed-delay approach (batch cooldowns, pre-pass cooldowns, `RETRY_DELAY_MS`) cannot correctly enforce a count-based rate limit — delays are added AFTER requests, so multiple entities' requests stack in the same 60s window regardless
- **Complete rewrite of `fetch-donation-data.mjs`** — replaced all ad-hoc delays with a proper sliding-window `RateLimiter` class:
  - `RateLimiter(maxPerMinute)` tracks request timestamps; `throttle()` called before every request; waits only as long as needed for oldest timestamp to exit 60s window
  - Two separate limiters: `COMMITTEE_RPM=30` for `/committee/*`, `SCHEDULE_B_RPM=8` for `/schedules/schedule_b/`
  - `apiFetch(url, limiter)`: rate-limited fetch with exponential backoff on 429 (60s→120s→240s, max 300s, 3 retries max), respects `Retry-After` header
  - Incremental save every 10 successes — interrupting and restarting is safe
  - Removed all `FETCH_DELAY_MS`, `FETCH_SCHEDULE_B_DELAY_MS`, `FETCH_BATCH_SIZE`, `FETCH_BATCH_COOLDOWN_MS`, `RETRY_DELAY_MS` — fixed delays removed from both script and `config/constants.ts`
  - Pre-pass and main loop now both run under the same limiter — no explicit cooldown needed between them
- Updated CLAUDE.md: rate-limit architecture documented, removed stale batch-cooldown references

**Pending:**
- Run `npm run fetch:donations -- --force` to repopulate all 161 entities with corrected partisan totals

---

### Session: March 10, 2026
**Focus:** Extension hardening, app/extension data parity, documentation cleanup

**Completed:**
- Serialized `FECClient.ts` details → totals calls to match the data pipeline rate-limit fix
- Reconciled stale architecture/docs references from OpenSecrets-era internals to current FEC-native architecture
- Fixed extension service-worker nullability bug — flagged domains now render safely even when donation data is unavailable
- Brought extension popup data behavior closer to the mobile BusinessCard:
  confidence labels preserved, medium-confidence warning preserved, donation-unavailable state surfaced, FEC link fallback added, active-cycle context shown when available
- Fixed extension/browser TypeScript coverage so `npm run typecheck` is meaningful again
- Added cross-surface data parity rule to `CLAUDE.md` and `ARCHITECTURE.md` so material business-card/popup data changes must be carried to both surfaces unless a V2 divergence is explicitly documented

### Session: March 10, 2026
**Focus:** Data pipeline stabilization, documentation

**Completed:**
- Fixed Schedule B field name mapping (`line_number` was hardcoded as empty string)
- Fixed raw[] aggregation — now one FECLineItem per unique `line_number:cycle` pair
- Added `FETCH_SCHEDULE_B_DELAY_MS: 2000` for Schedule B-specific rate limiting
- Added per-minute rate limit protection in `fetch-donation-data.mjs` — serialized details + totals calls (removed Promise.all), increased `FETCH_DELAY_MS` to 1000ms, retry backoff increased to 5000ms (note: `FECClient.ts` runtime client still had Promise.all at end of session — serialized in follow-up commit)
- Fixed freshness bug — failed entities now have `lastVerifiedDate` cleared so they retry on next plain run
- Manually cleared `lastVerifiedDate` for 54 entities that failed before the fix landed
- Fetch run result: 107/161 fetched clean, 54 failed (rate limiting) — retry in progress
- Created PROJECT_SYSTEM_PROMPT.md, CODEX_ONBOARDING.md, WORKING_WITH_CHRISTOPHER.md for agent onboarding
- Created README.md (public-facing), SPEC_VS_CURRENT.md (deviation tracking)
- Added Project Documentation section to CLAUDE.md (pending CC commit)
- Added Progress doc to CLAUDE.md (pending CC commit)

**In progress:**
- Fetch retry run for 54 failed entities — running now

**Pending CC commits:**
- CLAUDE.md Project Documentation section
- CLAUDE.md Progress doc reference
- Batch cooldown (FETCH_BATCH_SIZE: 40, FETCH_BATCH_COOLDOWN_MS: 60000) — not yet sent to CC

### Session: March 9, 2026
**Focus:** Entity data cleaning, schema evolution, bug fixes

**Completed:**
- Full 449-entity audit — 161 pipeline, 274 manual, 14 unverified
- 13 FEC committee ID corrections with fecCommitteeRecords for dissolved PACs
- verificationStatus schema added ('manual' | 'pipeline' | 'unverified')
- matchScore removed from Entity type and all entities.json entries
- DonationSummary refactored — removed nonpartisan fields, added raw: FECLineItem[]
- Refactored donation attribution from committee totals to Schedule B disbursements
- Fixed async error handling (useWeeklySurvey, useReportCard, PlatformRow)
- Fixed avoid tap — gated to curated entities only, AvoidButton optimistic recovery
- Removed redundant pre-read from recordEntityAvoid
- Vertical slice tested end-to-end on device

---

## Test Status

| Suite | Count | Status |
|---|---|---|
| Total passing | 261 | ✅ Clean |
| Last tsc run | March 11, 2026 | ✅ Clean |

---

## Data Status

| Metric | Count |
|---|---|
| Total entities | 448 |
| Verified PAC (pipeline) | 161 |
| Confirmed no PAC (manual) | ~274 |
| Unverified | ~14 |
| Last fetch: --force run complete (March 11, 2026) | 161 entities, corrected attribution ✅ |
| Entities with R donations > 0 | 153 |
| Entities with D donations > 0 | 155 |
| Retry pending (cleared lastVerifiedDate) | 3 (sherwin-williams, baker-hughes, chick-fil-a) |
| Data integrity fix | perdue-farms stale donationSummary removed (was false-positive match to PERDUE FOR SENATE) |

---

## What's Working

- Avoid tap → survey → report card vertical slice ✅
- Extension built and tested on walmart.com ✅
- Geolocation (simulator — SF drop) ✅ / physical device TBD
- Entity matching with confidence labels ✅
- Browser extension bundles entities.json at build time ✅
- Extension popup now mirrors app business-card data states more closely ✅
- Rate limiting with retry logic ✅
- Freshness cache with auto-retry on failure ✅
- entities.json clean and ready for testing — 161 entities with verified partisan totals, spot-checked ✅
- `expo prebuild --platform ios --clean` succeeds ✅ — ios/ generated and committed
- MapKitSearch auto-linked via `file:./modules/mapkit-search` — no `searchPaths` override needed ✅
- `expo run:ios` builds and installs to simulator ✅ — `FckFascists.app` confirmed installed on iPhone 16 Pro

## What's Not Working / Not Yet Built

| Item | Status | Priority |
|---|---|---|
| Donation amounts showing in BusinessCard | Verified working (Walmart: $3.65M R / $3.1M D) | ✅ Resolved |
| Map POI tap → entity matching | Built, linked, and running on simulator — iOS tap path pending interactive test | 🟡 Smoke test needed |
| Physical device geolocation test | Not done | 🟡 V1 needed |
| 3 entities pending retry (sherwin-williams, baker-hughes, chick-fil-a) | Run plain fetch:donations | 🟡 Nice to have |
| people.json individual donor data | Not started | 🟠 V1.5 |
| Report card sharing / social export | Not built | 🟠 V2 |
| ENTITY_LIST_UPDATE_URL | Placeholder [org] | 🟠 Pre-launch |

---

## Immediate Next Steps (in order)

1. **iOS simulator smoke test** — `npx expo start`, launch from simulator, walk the full vertical slice (map scan → flag → business card → avoid tap → survey → report card). Verify MapKit POI tap fires on iOS.
2. **Physical device geolocation** — test on hardware, not simulator
3. **UX/UI + Content pass** — new agent instance, full analysis, 8-bit design system, user journey, copy rewrite

---

## Open Architectural Decisions

| Decision | Context | Status |
|---|---|---|
| Map POI tap scope | Full pipeline match used (alias first, FEC fuzzy fallback) | ✅ Resolved — full pipeline |
| Extension + report card unification | QR code bridge or permanently separate | ❓ Deferred V2 |
| App Store name | "F*ck Fascists" will be rejected — need clean submission name | ❓ Not resolved |
| Uber entity | No PAC found, name-based match failing | ❓ Needs manual research |

---

## Agent Roster

| Agent | Current task |
|---|---|
| Lead Architect (this session) | Documentation, decisions, CC prompt generation |
| Claude Code | Implementation — awaiting next prompt |
| Codex | Not yet onboarded — use for data cleaning and pipeline work |
| Web Agent | Idle — next task: Hyatt subsidiary PAC verification |

---

## Recently Resolved Decisions

- OpenSecrets → FEC.gov as primary data source ✅
- Schedule B disbursements for partisan attribution (not committee totals) ✅
- fecCommitteeId three-state schema (string / null / "") ✅
- verificationStatus numeric migration ✅
- matchScore removed from Entity type ✅
- App / extension material data-state changes must stay in parity unless explicitly deferred to V2 ✅
- Tesla → null (no corporate PAC, Musk donates personally) ✅
- Patagonia → removed (IE filer only, no Republican history) ✅
