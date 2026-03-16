# F*ck Fascists — Progress & Current State

This document is updated continuously. New instances should read this first — it tells you where we are, what was just done, and what needs to happen next.

---

## Current Sprint: MVP V1 — Core Vertical Slice

**Overall status:** Feature-complete. iOS app built and running on simulator. Physical device test next.

---

## Last 5 Sessions (most recent first)

### Session: March 16, 2026 (follow-up 4)
**Focus:** Replace [org] placeholder URLs, data repo seed files

**Completed:**
- **Replaced all `[org]` placeholder URLs** across 6 files with real GitHub org (`idontlikecodemuch`):
  - `config/constants.ts` — `ENTITY_LIST_UPDATE_URL` and `INFO_CONTENT_URL` → `idontlikecodemuch/fckfascists-data`
  - `copy/infoContent.ts` — 5 URLs (source code, data repo, issues, privacy)
  - `CLAUDE.md` — 2 URL examples in configurable variables
  - `ARCHITECTURE.md` — replaced warning block, checked off pre-launch checklist item
  - `docs/PROGRESS.md` — marked URL as resolved
  - `docs/SPEC_VS_CURRENT.md` — marked URL as resolved
- **Created `data-repo-seed/`** — seed files for the `fckfascists-data` GitHub repo:
  - `entities.json` (686K) — copied from `assets/data/entities.json` (448 entities, 161 with verified FEC data)
  - `info.json` (6.1K) — generated from `copy/infoContent.ts` (about, transparency, FAQ, links)
  - `README.md` (3.2K) — documents files, schema, fetch behavior, contributing guidelines

**Files modified:**
- `config/constants.ts`, `copy/infoContent.ts`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/PROGRESS.md`, `docs/SPEC_VS_CURRENT.md`

**Files created:**
- `data-repo-seed/entities.json`, `data-repo-seed/info.json`, `data-repo-seed/README.md`

**Build:** tsc clean.

---

### Session: March 16, 2026 (follow-up 3)
**Focus:** Full component migration to design tokens — 26 files

**Completed:**
- **All 26 component files migrated** to import from `design/tokens.ts` and follow `design/component-rules.md` specs. Every hardcoded color, spacing, typography, border, and tap target value replaced with theme token references.
- **Root:** `App.tsx` — removed `BLACK`/`AMBER`/`MONO` constants. Tab bar: `bgNav` bg, `hero` border `frameBlue`, `surface1` active tab, `caption` + `rewardYellow`/`textSecondary` labels.
- **Map (8 files):** `BusinessCard` (surface1, hero border, displayM name), `AvoidButton` (rewardYellow/successGreen/dangerRed states, hero border bgVoid), `MatchChooser` (surface1 sheet, surface2 rows), `MapSearchBar` (bgNav shell, surface1 input, highlightBlue border), `MapControls` (bgNav 48×48, standard border frameBlue), `MapMarker` (dangerRed/rewardYellow/successGreen), `TapLoadingMarker` (glowCyan, frameBlue border), `UnmatchedBanner` (surface1, standard border rewardYellow).
- **Platforms (4 files):** `PlatformRow` (surface1/surface2 states, displayS count rewardYellow), `PlatformSetupScreen` (bgVoid page, hero border, rewardYellow selected), `PlatformsScreen` (bgVoid, bgNav header), `DayCircles` (surface1, successGreen checked).
- **Scorecard (3 files):** `ScorecardView` (surface1 card, rewardYellow totals, standard border rewardYellow accent), `ScorecardScreen` (bgVoid, bgNav topBar, dangerRed buttons), `PreviewStamp` (standard border + text rewardYellow).
- **Onboarding (6 files):** `OnboardingSlide` (bgVoid, bgNav header, dangerRed nextButton), `WelcomeScreen` (headline 48pt dangerRed, displayS tagline), `HowItWorksScreen` (surface2 cards, rewardYellow kickers), `PermissionScreen` (rewardYellow icon, surface1 promiseBox), `PrivacyScreen` (dangerRed bullet, caption label), `ProgressDots` (standard border, rewardYellow active).
- **Info (4 files):** `InfoScreen` (bgVoid, bgNav header, uiLabel rewardYellow tagline), `InfoSection` (surface1 header, hero border frameBlue), `FaqItem` (surface1 question, surface2 answer, highlightBlue borders), `LinkRow` (token-based category colors).

**Verification:**
- `tsc --noEmit` — clean, zero errors
- `jest` — 27 suites, 296 tests, all passing
- `audit-copy.sh` — only flags in `features/Dev/` (mock data, pre-existing)

**Files modified (26):**
- `App.tsx`
- `features/Map/components/` — BusinessCard, AvoidButton, MatchChooser, MapSearchBar, MapControls, MapMarker, TapLoadingMarker, UnmatchedBanner
- `features/Platforms/` — PlatformsScreen, PlatformRow, PlatformSetupScreen, DayCircles
- `features/Scorecard/` — ScorecardScreen, ScorecardView, PreviewStamp
- `features/Onboarding/` — OnboardingSlide, ProgressDots, WelcomeScreen, HowItWorksScreen, PermissionScreen, PrivacyScreen
- `features/Info/` — InfoScreen, InfoSection, FaqItem, LinkRow

**No copy files, data layer, native modules, extension, scripts, or design/ files changed.**

**Build:** tsc clean. 296 tests passing (27 suites). audit-copy.sh clean (dev-only hits only).

---

### Session: March 16, 2026 (follow-up 2)
**Focus:** Design system foundation — tokens, component rules, asset manifest, font setup

**Completed:**
- **`design/tokens.ts`** — theme object with colors (13), fonts (4 families), type scale (7 levels), spacing (8 steps), borders (3 styles), effects, and a11y constants. All values exported as `const` for type safety.
- **`design/component-rules.md`** — per-component spec for 14 components documenting background, border, text hierarchy, spacing, states, decorative rules, and accessibility notes. All references use token names, not raw values.
- **`design/asset-manifest.json`** — manifest of 12 pixel art asset slots with dimensions, required/optional status, current availability, and fallback behavior. All marked "planned" (assets/pixel/ is empty).
- **Font setup** — installed `expo-font`, downloaded Bungee-Regular, IBMPlexSans-Regular/SemiBold/Medium to `assets/fonts/`. Registered via expo-font plugin config in `app.json`. Added `useFonts` loading guard in `App.tsx` — app shows splash until all 4 fonts are loaded.
- **CLAUDE.md** — added `design/` and `assets/fonts/` to repository structure. Added "All visual constants from design tokens" rule to Code Quality Rules.
- **PROGRESS.md** — this session.

**Files created:**
- `design/tokens.ts`
- `design/component-rules.md`
- `design/asset-manifest.json`
- `assets/fonts/Bungee-Regular.ttf`
- `assets/fonts/IBMPlexSans-Regular.ttf`
- `assets/fonts/IBMPlexSans-SemiBold.ttf`
- `assets/fonts/IBMPlexSans-Medium.ttf`

**Files modified:**
- `App.tsx` — `useFonts` import + hook call + loading guard
- `app.json` — expo-font plugin config with font paths
- `package.json` — expo-font dependency added
- `CLAUDE.md` — repo structure + code quality rule
- `docs/PROGRESS.md` — this session

**Scope:** Foundation only. No existing component styles were changed — migration to design tokens happens in follow-up batches.

---

### Session: March 16, 2026 (follow-up)
**Focus:** Scorecard UI redesign — entity-centric → CEO-centric ("I f*cked...")

**Completed:**
- **`copy/scorecard.ts`** — replaced all copy with CEO-centric strings. New verb-specific source functions (`sourceSkipped`, `sourceAvoided`, `sourceWalkedPast`, `sourceStayedOff`), framing line ("I f*cked..."), person count (`{N}×`), total count, others line, tagline, CTA. Removed old entity/platform count copy.
- **`features/Scorecard/types.ts`** — replaced `ScorecardData` / `EntityAvoidSummary` with `ScorecardViewData { weekOf, persons: ScorecardPerson[], grandTotal, isPreview }`. `DropSchedule` unchanged.
- **`features/Scorecard/hooks/useScorecard.ts`** — now calls `aggregateScorecard()` instead of old `generateScorecard()`. Returns `ScorecardViewData` with computed `grandTotal`.
- **`features/Scorecard/components/ScorecardView.tsx`** — full rewrite. Person-centric layout with heavy/light/empty variants. Heavy: big total + "I f*cked..." + top 3 persons + overflow count. Light: all persons, no total. PersonRow sub-component with last name prominent (uppercase), verb-specific source breakdown. Dark card (BLACK bg, RED borders, AMBER overflow).
- **`features/Scorecard/ScorecardScreen.tsx`** — new share logic generates "I f*cked {Name} {N}× · {Name} {N}×" format with tagline + CTA. Dark background. SHARE button only visible when persons exist. `loadingLabel` on ActivityIndicator. Removed `sharedCopy` import (share text now self-contained via `scorecardCopy`).
- **Removed `generateScorecard.ts` + test** — old aggregation function + 12 tests. Fully superseded by `aggregateScorecard.ts` (27 tests). No production code imported it.
- **Dev catalog mocks** — `catalogMocks.ts` updated from `ScorecardData` to `ScorecardViewData` with rich person data (Walton Family, Zuckerberg, Jassy, Decker with verb-specific sources).

**Files modified:**
- `copy/scorecard.ts` — full rewrite
- `features/Scorecard/types.ts` — ScorecardViewData replaces ScorecardData
- `features/Scorecard/hooks/useScorecard.ts` — calls aggregateScorecard
- `features/Scorecard/components/ScorecardView.tsx` — full rewrite
- `features/Scorecard/ScorecardScreen.tsx` — share logic + dark theme
- `features/Dev/catalogMocks.ts` — ScorecardViewData mocks

**Files removed:**
- `features/Scorecard/utils/generateScorecard.ts` (dead code)
- `features/Scorecard/__tests__/generateScorecard.test.ts` (dead tests)

**Build:** tsc clean. 296 tests passing (27 suites). Net -12 tests (removed old generateScorecard tests; aggregateScorecard's 27 tests already counted).

---

### Session: March 16, 2026
**Focus:** Scorecard aggregation layer — person-grouped avoidance data

**Completed:**
- **`aggregateScorecard.ts`** — new pure data function that rolls up both entity and platform avoids for a week, grouped by public figure name (e.g. Walmart + Sam's Club → McMillon, Instagram + Facebook platform → Zuckerberg).
- **`ScorecardPerson` / `ScorecardSource` types** — `ScorecardPerson { figureName, totalCount, sources[] }`, `ScorecardSource { name, count, verb }`.
- **`verbForCategory()`** — derives display verb from categoryTags: social/platform/messaging → "stayed off", ecommerce/streaming/shopping → "skipped", retailer/restaurant/grocery → "walked past", default → "avoided".
- **Person resolution** — uses `getDisplayFigure()` for entities (handles `publicFigureName`, `ceoName` fallback, `parentEntityId` laddering). Platforms resolve to `ceoName`.
- **Display names** — entities use first alias (fallback: canonicalName, then entityId). Platforms use `name` (fallback: platformId).
- **27 new tests** — covers verb mapping (all 9 tags, empty/unknown, multi-tag priority), empty week, single entity, publicFigureName vs ceoName, parentEntityId merging, mixed entity+platform, multi-platform same person, sort order, week boundaries, multi-day summing, unknown entity/platform fallback.

**Files created:**
- `features/Scorecard/data/aggregateScorecard.ts`
- `features/Scorecard/data/__tests__/aggregateScorecard.test.ts`

**Build:** tsc clean. 308 tests passing (28 suites).

---

### Session: March 15, 2026 (follow-up 9)
**Focus:** Platforms feature — setup screen, day circles, Thursday nudge notification

**Completed:**
- **Platform Setup Screen** — new `PlatformSetupScreen.tsx` component: character-select style dark screen with FlatList of all 8 platforms, checkbox affordances (green ✓ when selected, empty box when not), pre-checks 5 defaults (Twitter, Instagram, Facebook, Amazon, YouTube). DONE button disabled when no selection. Accepts `initialSelection` prop for edit mode.
- **Platform Roster Persistence** — new `usePlatformRoster` hook: three-state pattern (null=loading, undefined=no selection→show setup, string[]=saved). Persists JSON array of platform IDs in SecureStore under `'platform_roster'` key. `getDefaultSelectedIds()` helper for setup screen defaults.
- **PlatformsScreen Rewrite** — orchestrates setup flow: loading→setup (first use)→main list. Integrates `usePlatformRoster` for roster persistence. Filters `TRACKED_PLATFORMS` to user's roster via `useMemo`. EDIT button in header reopens setup with current selection.
- **Day Circles** — new `DayCircles.tsx` component: 7 day circles (M–S) for the current week. Green ✓ for avoided days, empty tappable circles for past/current days, faint disabled circles for future days. 36×36 circle size, chunky 3px borders, 8-bit aesthetic.
- **Expandable PlatformRow** — added chevron toggle (▶/▼) to expand/collapse day circles per row. New props: `weekOf`, `onAvoidDate`. Row wraps into outer View containing row + optional DayCircles.
- **Date-Specific Avoids** — new `recordPlatformAvoidForDate(adapter, platformId, date)` in eventStore for logging avoids on specific past dates via day circles.
- **usePlatformAvoidance Rewrite** — now stores raw `PlatformAvoidEvent[]` instead of aggregated totals, computes per-platform `dayCounts: Map<string, number>` and `weeklyCount` from events. Exposes both `avoid(platformId)` and `avoidForDate(platformId, date)` actions.
- **Week Utilities** — new `utils/weekDates.ts`: `getWeekDates(weekOf)` returns 7 YYYY-MM-DD strings Mon–Sun, `isFutureDate(date)` compares against today.
- **Thursday Nudge Notification** — new `useNudgeNotification` hook: schedules weekly Thursday 7pm local notification via expo-notifications `SchedulableTriggerInputTypes.WEEKLY`. Cancels previous by identifier before rescheduling. Silently catches permission/scheduling failures.
- **Copy Updates** — added 12 new entries to `copy/platforms.ts`: setupTitle, setupSubhead, setupDone, editBtn, editLabel, dayLabels, dayCheckedLabel, dayUncheckedLabel, dayFutureLabel, expandLabel, collapseLabel, nudgeTitle, nudgeBody.
- **Constants** — added `NUDGE_DAY` (4=Thursday), `NUDGE_HOUR` (19=7pm), `DEFAULT_SELECTED_PLATFORM_IDS` to `config/constants.ts`.
- **Dev Catalog** — updated `catalogMocks.ts` with `dayCounts` field on all PlatformItem mocks. Updated `PlatformsSections.tsx` with `weekOf` and `onAvoidDate` props on all PlatformRow usages.

**Files created:**
- `features/Platforms/hooks/usePlatformRoster.ts`
- `features/Platforms/hooks/useNudgeNotification.ts`
- `features/Platforms/components/PlatformSetupScreen.tsx`
- `features/Platforms/components/DayCircles.tsx`
- `features/Platforms/utils/weekDates.ts`

**Files modified:**
- `copy/platforms.ts` — 12 new copy entries
- `config/constants.ts` — NUDGE_DAY, NUDGE_HOUR, DEFAULT_SELECTED_PLATFORM_IDS
- `core/data/eventStore.ts` — recordPlatformAvoidForDate
- `core/data/index.ts` — new barrel export
- `features/Platforms/types.ts` — dayCounts on PlatformItem
- `features/Platforms/hooks/usePlatformAvoidance.ts` — rewritten for day-level data
- `features/Platforms/components/PlatformRow.tsx` — expandable with chevron + DayCircles
- `features/Platforms/PlatformsScreen.tsx` — rewritten for setup flow + roster + edit + nudge
- `features/Dev/catalogMocks.ts` — dayCounts on all PlatformItem mocks
- `features/Dev/sections/PlatformsSections.tsx` — weekOf + onAvoidDate props

**Build:** tsc clean. 308 tests passing (28 suites). audit-copy.sh pending.

---

### Session: March 15, 2026 (follow-up 8)
**Focus:** Comprehensive rename pass — Report Card→Scorecard, Survey→Platforms, badge language, AVOIDED→AVOID

**Completed:**
- **REPORT CARD → SCORECARD** — renamed directories (`features/ReportCard/` → `features/Scorecard/`, `copy/report.ts` → `copy/scorecard.ts`), all types (`ReportCardData` → `ScorecardData`, `ReportCardView` → `ScorecardView`, etc.), all functions (`generateReportCard` → `generateScorecard`, `useReportCard` → `useScorecard`), all imports, all constants (`REPORT_CARD_WINDOW_*` → `SCORECARD_WINDOW_*`), copy string values (`"REPORT CARD"` → `"SCORECARD"`, etc.), and comments/docs throughout.
- **SURVEY → PLATFORMS** — caught remaining references from prior feature replacement: `SurveyPartial/Full/Empty` → `PlatformsPartial/Full/Empty` in dev catalog, `surveyTitle/Desc/Icon` → `platformsTitle/Desc/Icon` in onboard copy, deleted dead `copy/survey.ts` file, updated ARCHITECTURE.md section to reflect current Platforms data model.
- **Badge language** — corrected docs from "VERIFIED/MATCHED badge" to "MATCHED badge (medium confidence only; high confidence shows no badge)".
- **AVOIDED → AVOID** — fixed comments in `AvoidButton.tsx` and `popup.ts` to accurately describe "AVOID" as the button label, "✓ AVOIDED" as the confirmed state.
- **Copy string values** — updated `copy/scorecard.ts` user-facing strings: title, subtitle, shareHeader, shareLabel, previewLabel, emptyState ("Hit the Survey" → "Hit Track").
- **Documentation** — CLAUDE.md (12+ edits), ARCHITECTURE.md (10+ edits including full Platforms section rewrite), README.md, SPEC_VS_CURRENT.md, PROGRESS.md, visual-catalog.md all updated.
- **Core comments** — `core/data/eventStore.ts` and `core/models/entity.ts` comments updated.

**Verification:** tsc clean. 281 tests passing (27 suites). audit-copy.sh clean (dev-only hits only).

**Files renamed (git mv):**
- `features/ReportCard/` → `features/Scorecard/` (all files within)
- `copy/report.ts` → `copy/scorecard.ts`
- `features/Dev/sections/SurveySections.tsx` → `PlatformsSections.tsx`
- `features/Dev/sections/ReportSections.tsx` → `ScorecardSections.tsx`

**Files modified (~30 files):** App.tsx, config/constants.ts, core/dropSchedule/computeDropTime.ts, core/data/eventStore.ts, core/models/entity.ts, copy/scorecard.ts, copy/onboard.ts, features/Scorecard/* (8 files), features/Dev/* (3 files), features/Onboarding/screens/HowItWorksScreen.tsx, extension/popup/popup.ts, features/Map/components/AvoidButton.tsx, CLAUDE.md, ARCHITECTURE.md, README.md, docs/PROGRESS.md, docs/SPEC_VS_CURRENT.md, docs/visual-catalog.md

**Files deleted:** `copy/survey.ts` (dead file, no imports)

---

### Session: March 15, 2026 (follow-up 7)
**Focus:** Thread matched alias through pipeline; redesign business card display hierarchy

**Completed:**
- **matchedAlias field on MatchSuccess** — new required `matchedAlias: string` field carries the specific alias/search term that triggered a match through the entire pipeline to the UI.
- **findByAlias return type change** — now returns `AliasMatchResult | null` (entity + matchedAlias) instead of `Entity | null`. Alias match returns the original un-normalized alias string (e.g. `"Target"` not `"target"`). Cache hit and fuzzy match paths use `rawInput`.
- **ScanResult expanded** — added `matchedAlias: string` and `committeeName: string | null` fields. Both threaded through `buildScanResult()`.
- **BusinessCard redesign** — new display hierarchy:
  1. **Primary name (large):** `matchedAlias` — the name the user recognizes ("Target", "Best Buy"); falls back to `canonicalName`
  2. **Parent attribution (small):** shows `canonicalName` when different from primary, or `"via {parent.canonicalName}"` when entity has `parentEntityId`
  3. **PAC data line (small, above FEC link):** `"Data: {committeeName}"` — grounds donation data to its source PAC
- **MatchChooser updated** — rows now show `matchedAlias` as primary name instead of `canonicalName`.
- **MapPin names** — `useTapSearch.ts` and `MapScreen.tsx` pin effect both use `matchedAlias` for map marker labels.
- **MapScreen** — now passes `allEntities={entities}` to `BusinessCard` (was previously omitted).
- **Copy strings** — added `pacDataLine` and `parentAttribution` to `copy/map.ts`.
- **Dev catalog mocks fixed** — `catalogMocks.ts` had pre-existing `DonationSummary` schema errors (`rawLineItems` → `raw`, missing `committeeId`/`committeeName`/`lastUpdated`). Fixed and added `matchedAlias`/`committeeName` to all `ScanResult` mocks.

**Files changed:**
- `core/matching/types.ts` — `matchedAlias: string` on `MatchSuccess`
- `core/matching/aliasMatch.ts` — new `AliasMatchResult` type, return type change
- `core/matching/index.ts` — export `AliasMatchResult`
- `core/matching/pipeline.ts` — `matchedAlias` populated in all 3 match paths (cache, alias, fuzzy)
- `features/Map/types.ts` — `matchedAlias` + `committeeName` on `ScanResult`
- `features/Map/utils/buildScanResult.ts` — threads new fields
- `features/Map/components/BusinessCard.tsx` — redesigned header hierarchy + PAC data line
- `features/Map/components/MatchChooser.tsx` — `matchedAlias` as row label
- `features/Map/hooks/useTapSearch.ts` — pin name uses `matchedAlias`
- `features/Map/MapScreen.tsx` — pin name, `allEntities` prop on BusinessCard
- `copy/map.ts` — `pacDataLine`, `parentAttribution`
- `features/Dev/catalogMocks.ts` — fixed DonationSummary schema + new ScanResult fields
- `core/matching/__tests__/aliasMatch.test.ts` — updated for `AliasMatchResult` return type
- `features/Map/__tests__/buildScanResult.test.ts` — `matchedAlias` in fixture + 3 new tests

**Build:** tsc clean. 281 tests passing (27 suites).

---

### Session: March 15, 2026 (follow-up 6)
**Focus:** Replace Weekly Survey with Platform Avoidance feature

**Completed:**
- **Full feature replacement** — deleted `features/Survey/` and `copy/survey.ts`. Created `features/Platforms/` with per-day increment data model (matching entity avoids pattern).
- **Data model change:** `PlatformAvoidEvent` changed from `{platformId, weekOf}` (binary per-week) to `{platformId, date, count}` (per-day increment, DB-owned via `ON CONFLICT DO UPDATE SET count = count + 1`).
- **Schema migration:** `SCHEMA_VERSION` bumped from 1 to 2. Platform avoid events table DROP+CREATE (pre-launch, no user data to migrate).
- **StorageAdapter interface:** Added `getPlatformAvoidsForWeek(weekStart, weekEnd)` for half-open date range queries. Both `SqliteAdapter` and `ChromeStorageAdapter` updated.
- **New eventStore functions:** `recordPlatformAvoid` (increment today), `getPlatformWeeklyTotal`, `getAllPlatformWeeklyTotals` (Map<platformId, total>), updated `getPlatformAvoidsForWeek` for `[weekStart, weekEnd)` range.
- **New Platforms UI:** `PlatformsScreen`, `PlatformRow` component (AVOID button never locks — can tap multiple times per day), `usePlatformAvoidance` hook, `platformHelpers.ts`, `platformList.ts` (8 platforms: X/Twitter, Instagram, Facebook, Amazon, Amazon Prime, YouTube, WhatsApp, Threads).
- **Cross-references updated:** `App.tsx` (survey→platforms tab), `ReportCard` imports (Platform type path), `generateReportCard.ts` (aggregates per-day counts into per-platform weekly totals), Dev catalog (catalogMocks, SurveySections, CatalogScreen).
- **Tests:** New `platformList.test.ts` and `platformHelpers.test.ts`. Updated `eventStore.test.ts`, `generateReportCard.test.ts`, `cacheStore.test.ts`, `ChromeStorageAdapter.test.ts`.
- **Copy:** Created `copy/platforms.ts` with typed `as const` object.

**Files created:**
- `features/Platforms/types.ts`
- `features/Platforms/data/platformList.ts`
- `features/Platforms/components/PlatformRow.tsx`
- `features/Platforms/hooks/usePlatformAvoidance.ts`
- `features/Platforms/utils/platformHelpers.ts`
- `features/Platforms/PlatformsScreen.tsx`
- `features/Platforms/__tests__/platformList.test.ts`
- `features/Platforms/__tests__/platformHelpers.test.ts`
- `copy/platforms.ts`

**Files deleted:**
- `features/Survey/` (entire directory)
- `copy/survey.ts`

**Files modified:**
- `core/models/events.ts` — PlatformAvoidEvent: weekOf→date+count
- `core/data/schema.ts` — DDL: (platform_id, week_of)→(platform_id, date, count)
- `core/data/adapters.ts` — StorageAdapter: new getPlatformAvoidsForWeek, changed getPlatformAvoids filter
- `core/data/eventStore.ts` — new platform avoid functions
- `core/data/index.ts` — new barrel exports
- `app/storage/SqliteAdapter.ts` — schema v2, upsert, date range query
- `extension/storage/ChromeStorageAdapter.ts` — date-based keys, range filtering
- `App.tsx` — survey→platforms tab
- `features/ReportCard/ReportCardScreen.tsx` — Platform import path
- `features/ReportCard/hooks/useReportCard.ts` — Platform import path
- `features/ReportCard/utils/generateReportCard.ts` — Platform import, aggregation logic
- `features/Dev/CatalogScreen.tsx` — comment + header text
- `features/Dev/catalogMocks.ts` — PlatformItem type, weeklyCount mocks
- `features/Dev/sections/SurveySections.tsx` — uses Platforms components
- `core/data/__tests__/eventStore.test.ts` — updated platform avoid tests
- `core/data/__tests__/cacheStore.test.ts` — mock adapter updated
- `features/ReportCard/__tests__/generateReportCard.test.ts` — updated fixtures + new test
- `extension/storage/__tests__/ChromeStorageAdapter.test.ts` — rewritten platform tests
- `CLAUDE.md` — repo structure, data model, copy structure, sprint status

**Build:** tsc clean. 281 tests passing (27 suites). audit-copy.sh clean (dev-only hits only).

---

### Session: March 15, 2026 (follow-up 5)
**Focus:** Suppress confidence badge on high-confidence matches

**Completed:**
- **BusinessCard.tsx** — `ConfidenceBadge` now only renders when `confidence < CONFIDENCE_THRESHOLD_HIGH`. High-confidence matches show no badge (silence means confidence). Doc comment updated.
- **MatchChooser.tsx** — `ConfidenceTag` conditionally rendered only for medium-confidence rows.
- **extension/popup/popup.ts** — Badge element hidden for high-confidence matches; medium-confidence still shows badge + disclaimer. Cross-surface parity maintained.

**Files changed:**
- `features/Map/components/BusinessCard.tsx` — conditional badge render
- `features/Map/components/MatchChooser.tsx` — conditional tag render
- `extension/popup/popup.ts` — badge hidden for high confidence
- `docs/PROGRESS.md` — this session

**Build:** tsc clean (pre-existing catalogMocks errors only). 282 tests passing.

---

### Session: March 15, 2026 (follow-up 4)
**Focus:** Copy rewrite — tone, clarity, and tab renames

**Completed:**
- **copy/onboard.ts** — 12 changes: new tagline ("The fascists won't f*ck themselves."), shorter body, "PRESS START" button, "No tracking" note, renamed survey→TRACK and report→SCORECARD, mapDesc AVOIDED→AVOID, shorter notifWhy, onDeviceDesc removes "v1" language, new `welcomeKicker` field
- **copy/map.ts** — 4 changes: avoidLabel AVOIDED→AVOID, rewritten noMatch/lookupFailed messages referencing FEC filings, searchHint updated to "FEC donation record"
- **copy/infoContent.ts** — 10 editorial changes: new about tagline/description matching onboarding, fec-filings body uses 'See full FEC record' instead of "VIEW FEC FILING", confidence section rewritten around MATCHED badge (not HIGH/MEDIUM), no-server removes "Not in v1." prefix, storage body uses "tapped Avoid" and "platform avoid events", trust FAQ rewritten, medium-confidence FAQ renamed to matched-badge with new q/a, extension-sync FAQ removes "in v1" and "planned for v2" language, two new FAQs added (internet connectivity, edit platform list)
- **App.tsx** — tab bar labels: WEEKLY→TRACK, CARD→SCORECARD. Final set: MAP · TRACK · SCORECARD · INFO

**Files changed:**
- `copy/onboard.ts` — 12 field updates + 1 new field
- `copy/map.ts` — 4 field updates
- `copy/infoContent.ts` — 10 editorial changes + 2 new FAQ entries
- `App.tsx` — 2 tab label renames
- `docs/PROGRESS.md` — this session

**No component logic changes.** All changes are copy file edits and tab label renames.

---

### Session: March 15, 2026 (follow-up 3)
**Focus:** Copy externalization — extract all hardcoded strings into centralized copy files

**Completed:**
- **Created 7 copy files** extracting all user-facing strings from components into typed `as const` objects:
  - `copy/shared.ts` — cross-feature strings (app name, GOP/DEM labels, donation formatting)
  - `copy/map.ts` — Map feature (markers, search, business card, avoid button, match chooser)
  - `copy/survey.ts` — Survey feature (title, score, platform row labels)
  - `copy/report.ts` — Report Card feature (titles, tiles, empty state, footer)
  - `copy/onboard.ts` — Onboarding feature (welcome, privacy, how-it-works, permissions)
  - `copy/info.ts` — Info feature (section titles, FAQ a11y, link formatting)
  - `extension/copy.ts` — Extension popup (all popup text, donation prefixes, error messages)
- **Updated 24 component files** to import from copy files, replacing all hardcoded user-facing strings
- **CLAUDE.md updates:** Added `copy/` to Repository Structure, added Copy Management Rules section
- **Created `scripts/audit-copy.sh`** — grep-based audit script to detect hardcoded strings in components

**Files created:**
- `copy/shared.ts`, `copy/map.ts`, `copy/survey.ts`, `copy/report.ts`, `copy/onboard.ts`, `copy/info.ts`
- `extension/copy.ts`
- `scripts/audit-copy.sh`

**Files modified:**
- `features/Map/MapScreen.tsx` — mapCopy import
- `features/Map/components/BusinessCard.tsx` — sharedCopy + mapCopy imports
- `features/Map/components/AvoidButton.tsx` — mapCopy import
- `features/Map/components/MapControls.tsx` — mapCopy import
- `features/Map/components/MapSearchBar.tsx` — mapCopy import
- `features/Map/components/UnmatchedBanner.tsx` — mapCopy import
- `features/Map/components/MatchChooser.tsx` — sharedCopy + mapCopy imports
- `features/Map/components/MapMarker.tsx` — mapCopy import
- `features/Map/components/TapLoadingMarker.tsx` — mapCopy import
- `features/Survey/SurveyScreen.tsx` — surveyCopy import
- `features/Survey/components/PlatformRow.tsx` — surveyCopy + sharedCopy imports
- `features/ReportCard/ReportCardScreen.tsx` — reportCopy + sharedCopy imports
- `features/ReportCard/components/ReportCardView.tsx` — reportCopy + sharedCopy imports
- `features/ReportCard/components/PreviewStamp.tsx` — reportCopy import
- `features/Onboarding/OnboardingNavigator.tsx` — onboardCopy import
- `features/Onboarding/screens/WelcomeScreen.tsx` — onboardCopy import
- `features/Onboarding/screens/PrivacyScreen.tsx` — onboardCopy import
- `features/Onboarding/screens/HowItWorksScreen.tsx` — onboardCopy import
- `features/Onboarding/screens/PermissionScreen.tsx` — onboardCopy import
- `features/Onboarding/components/OnboardingSlide.tsx` — onboardCopy import
- `features/Onboarding/components/ProgressDots.tsx` — onboardCopy import
- `features/Info/InfoScreen.tsx` — infoCopy import
- `features/Info/components/FaqItem.tsx` — infoCopy import
- `features/Info/components/LinkRow.tsx` — infoCopy import
- `extension/popup/popup.ts` — extCopy import
- `CLAUDE.md` — copy/ in repo structure, Copy Management Rules section

**Design decisions:**
- `popup.html` NOT modified — HTML cannot import TS modules; hardcoded strings there are fallback defaults overwritten by `popup.ts` at runtime
- Dynamic strings use arrow functions with typed parameters (e.g. `markerFlagged: (name: string, confidenceLabel: string) => ...`)
- Extension copy is separate from RN copy since extension is vanilla TS, not React Native

---

### Session: March 15, 2026 (follow-up 2)
**Focus:** POI tap radius too wide + map snap-back during exploration

**Completed:**
- **Tap radius reduction:** `computeSearchRadius()` multiplier reduced from 5% to 2% of visible span, min clamp lowered from 25m to 15m. At street-level zoom (`latitudeDelta: 0.005`), radius drops from ~28m to ~11m (clamped to 15m). At auto-center zoom (`latitudeDelta: 0.02`), radius drops from ~111m to ~44m. Added diagnostic `console.log` printing computed radius in meters on every tap.
- **Map snap-back fix:** The `location.coords` effect in MapScreen was unconditionally calling `animateToRegion` every time coords updated — including when the user tapped the location button, which created a new coords object and snapped the map back. Split into two guarded paths: (1) initial-center effect fires once via `hasInitiallyCentered` ref, (2) explicit re-center via `handleLocationPress` + `pendingRecenter` ref flag. Panning, zooming, and exploring the map no longer triggers any snap-back.

**Files changed:**
- `config/constants.ts` — `POI_SEARCH_RADIUS_MIN_METERS` 25→15, comment updated
- `features/Map/hooks/useTapSearch.ts` — `computeSearchRadius()` multiplier 0.05→0.02, diagnostic log
- `features/Map/MapScreen.tsx` — `hasInitiallyCentered` ref guard on initial coords effect, `handleLocationPress` + `pendingRecenter` for explicit re-center, MapControls wired to new handler

**Build:** Clean (Xcode, 0 errors)

---

### Session: March 15, 2026 (follow-up)
**Focus:** MatchChooser — multi-match POI tap selection

**Completed:**
- **MatchChooser component:** New `features/Map/components/MatchChooser.tsx` — bottom-anchored overlay shown when a single map tap returns 2+ matched entities. 8-bit pixel art aesthetic matching BusinessCard (same palette, monospace font, thick borders, confidence badges). FlatList of results with business name + MATCHED badge (medium confidence only; high confidence shows no badge) per row. DISMISS button at bottom. 44pt minimum tap targets.
- **useTapSearch batch tracking:** Added `latestTapBatch: ScanResult[]` state to `useTapSearch` hook. `processTapNames` now populates it with the scan results from each tap (in addition to creating pins). Exposed `latestTapBatch` and `clearLatestTapBatch` in the hook's return value. `resetTapPins` also clears the batch.
- **MapScreen integration:** Added tap batch effect — when `latestTapBatch.length === 1`, auto-selects it (shows BusinessCard directly, same as before). When `latestTapBatch.length >= 2`, renders MatchChooser instead. User selects a business → BusinessCard opens for that result. DISMISS closes the chooser. All markers still render on the map regardless of chooser state. Manual search and card dismiss both clear the batch.

**Files changed:**
- `features/Map/components/MatchChooser.tsx` — **new file**
- `features/Map/hooks/useTapSearch.ts` — `latestTapBatch` state, `clearLatestTapBatch`, updated return value
- `features/Map/MapScreen.tsx` — import MatchChooser, destructure new hook values, tap batch effect, chooser callbacks, render MatchChooser

**Build:** Clean (Xcode, 0 errors)

---

### Session: March 15, 2026
**Focus:** Map crash fixes + four physical-device map improvements

**Completed:**
- **Native nil guard (defense-in-depth):** Patched `AIRMap.m` (react-native-maps pod) with `if (subview == nil) return` at the top of `insertReactSubview:atIndex:`, `removeReactSubview:`, and `addSubview:`. The JS-level guards (falsy `key` prevention) were already in place from March 14, but the crash still occurred — Fabric reconciler can pass nil subviews for reasons beyond just falsy keys (e.g., custom `View` children inside `Marker` failing to materialize native backing views). The native guard prevents the `NSInvalidArgumentException` regardless of cause.
- **Region render loop fix:** `MapScreen.tsx` stored the map region in `useState` and passed `setCurrentRegion` directly to `onRegionChangeComplete`. Every region change triggered a re-render, which could trigger another region change — infinite loop → app freeze. Replaced `useState<Region>` with `useRef<Region>`. The region is only consumed by zoom callbacks (never rendered), so no state needed. `handleZoomIn`/`handleZoomOut` now have empty dependency arrays and read from the ref.
- **MKLocalSearch main-thread fix (critical):** `MapKitSearchModule.swift` `AsyncFunction` body already wrapped `MKLocalSearch` creation and `.start()` in `DispatchQueue.main.async { }`. Expo Modules `AsyncFunction` runs on a background queue, but `MKLocalSearch` silently hangs if started off the main thread — the completion handler never fires, the JS promise never resolves, and the app appears frozen on physical devices. Confirmed the dispatch wrapper was already in place; documented as a hard constraint in CLAUDE.md.
- **Auto-center on user location:** `useLocation` now auto-requests foreground permission and current position once on mount (via `useEffect` + `didAutoRequest` ref guard). Map centers on the user's actual location instead of SF default. Falls back to SF if permission denied or location unavailable.
- **Dynamic POI search radius:** Replaced fixed `POI_SEARCH_RADIUS_METERS` (50m) with zoom-proportional computation: ~5% of the shorter visible span dimension, clamped to 25m–200m. `computeSearchRadius()` in `useTapSearch.ts` converts region deltas to meters using `111,320m/deg × cos(lat)`. `regionRef` passed from `MapScreen` to the hook. Constants `POI_SEARCH_RADIUS_MIN_METERS` (25) and `POI_SEARCH_RADIUS_MAX_METERS` (200) added to `config/constants.ts`.
- **Duplicate marker key fix:** `FlagMarker` React key changed from `pin.id` to `${pin.id}-${pin.coords.latitude}-${pin.coords.longitude}`. When multiple nearby POIs match the same entity (e.g. two Best Buy locations), they now have unique keys. `allPins` dedup updated to use the same composite key. V2 note added to `useTapSearch.ts`: when >5 POI matches from a single tap, show a scrollable bottom-sheet chooser.
- Updated CLAUDE.md: MKLocalSearch main-thread rule, POI search constants, dynamic radius documentation
- Updated PROGRESS.md (this file)

**Files changed:**
- `features/Map/MapScreen.tsx` — regionRef moved up for useTapSearch, composite marker keys, composite dedup
- `features/Map/hooks/useTapSearch.ts` — `computeSearchRadius()`, `regionRef` param, V2 bottom-sheet comment
- `features/Map/hooks/useLocation.ts` — auto-request on mount
- `config/constants.ts` — `POI_SEARCH_RADIUS_MIN_METERS`, `POI_SEARCH_RADIUS_MAX_METERS`
- `modules/mapkit-search/ios/MapKitSearchModule.swift` — confirmed main-thread dispatch (no code change needed)
- `AIRMap.m` (Pods) — nil guards (from earlier in session)
- `CLAUDE.md` — MKLocalSearch rule, POI constants, dynamic radius docs
- `docs/PROGRESS.md` — this session

**Build:** Clean (Xcode, 0 errors)

**Note:** The `AIRMap.m` patch lives in Pods source and will be overwritten by `pod install`. If it recurs, add a `post_install` hook in the Podfile.

**Pending:**
- Podfile `post_install` hook for the AIRMap.m patch (V1 hardening)
- iOS simulator interactive smoke test
- Physical device geolocation test

---

### Session: March 14, 2026 (follow-up)
**Focus:** UX/UI audit + visual pass

**Audit findings (all fixed this session):**
- `MapScreen.tsx:90` — removed stale `console.log` diagnostic (marked "remove before ship")
- `ReportCardView` — removed `overflow: 'hidden'` on card; was clipping `PreviewStamp` (positioned `right: -10` with 12deg rotation)
- `BusinessCard` — GOP and DEM donation amounts both rendered in same RED; added `recentGOP` (red) and `recentDEM` (blue `#0044AA`) styles
- Splash screen — just an amber spinner on black; added `F*CK FASCISTS` title in monospace RED with proper letterSpacing
- Tab bar — `paddingBottom: 20` hardcoded; replaced with `useSafeAreaInsets()`. Extracted `TabBar` component (must be inside `SafeAreaProvider` to call hook). Added text-art icons (`[ + ]`, `[ ✓ ]`, `[ ★ ]`, `[ ? ]`). Active tab now has `backgroundColor: '#2A2A2A'` highlight. Colors: `#f5a623` → `#CC7A00`, `borderTopColor: '#333'` → `#CC7A00`
- `SurveyScreen` score text — `#3CB371` (non-palette) → `#CC7A00` (amber)
- `ReportCard` empty state — bland copy → confrontational: "YOUR MONEY IS STILL FUNDING FASCISTS. Hit the Map. Hit the Survey. Make them feel it." styled in RED bold
- `HowItWorksScreen` — emoji icons (🗺, 📋) → text-art (`[+]`, `[✓]`, `[★]`) styled in RED monospace; `accessible={false}` preserved on all icon nodes
- `OnboardingNavigator` — emoji icon props (📍, 🔔) → text-art (`[PIN]`, `[!]`)
- `PermissionScreen` — `fontSize: 64` emoji icon → bordered monospace box with `RED` text, thick border, letterSpacing
- `AvoidButton` — immediate state change on confirm → scale animation (1 → 1.12 → 1, 80+120ms) via `Animated.View`. Respects `AccessibilityInfo.isReduceMotionEnabled()`. Error state resets scale immediately.

**tsc clean. No tests changed.**

**Pending:**
- iOS simulator interactive smoke test (MapKit POI tap, full vertical slice) — run manually
- Physical device geolocation test

---

### Session: March 14, 2026
**Focus:** iOS Map crash fix + sprite generation tool (tools/img-gen/)

**Completed:**
- Fixed `[AIRMap insertReactSubview:atIndex:]: object cannot be nil` crash on POI tap match:
  - Root cause: `id = entityId ?? fecCommitteeId` — when `entityId` is `null` and `fecCommitteeId` is `""` (unverified entity state), `id` is `""`. A `Marker` with `key=""` causes Fabric reconciler to pass nil native view to `AIRMap`
  - Fix 1 — `features/Map/hooks/useTapSearch.ts` `processTapNames`: added `if (!id) continue` guard before pushing to `newPins`
  - Fix 2 — `features/Map/MapScreen.tsx` pin effect: added `if (!id) return` guard before constructing `newPin`
- Added `NSLocationWhenInUseUsageDescription` to `app.json` → ran `expo prebuild --platform ios --clean` → `expo run:ios` — build succeeded, installed on iPhone 16 Pro simulator
- Built and ran full batch of ~80 characters through `tools/img-gen/` sprite generation pipeline (Gemini API, 8-bit pixel art CEO sprites)
  - Per-variant generation (neutral + defeated side-by-side per API call), chroma-key pipeline, compose.py stacks variant rows
  - `--redo` workflow: flagged files regenerated to clean name, originals preserved as reference
  - Batch mode: configurable delay, N/total progress, auto-compose at end

**Pending:**
- iOS simulator interactive smoke test (MapKit POI tap, full vertical slice)
- Physical device geolocation test

---

### Session: March 12, 2026 (follow-up)
**Focus:** Extension — remove FEC API key, bundled donationSummary as primary data path

**Completed:**
- Removed `fec_api_key` read from `chrome.storage.local` in `init()` — no options UI existed; nothing else to delete
- Replaced nullable `FECClient | null` with always-on anonymous client (`apiKey: ''` — safely avoids `process.env` access in browser context, no `api_key` param appended to requests)
- Added `isBundledDataFresh(entity)` helper — checks `entity.lastVerifiedDate` against `ENTITY_CACHE_TTL_DAYS`
- Rewrote `handleCheckDomain()` data-fetch priority: (1) fresh local extension cache, (2) fresh bundled `entity.donationSummary` — primary, no API call, (3) anonymous live FEC call for absent/stale bundled data, (4) stale bundled data as live-call fallback, (5) null
- Added `noBundledData: boolean` to `TabFlag` to distinguish structural data gap from transient failure
- `popup.ts` sets message text based on `noBundledData`: "No bundled donation data." vs "Donation data temporarily unavailable."
- `tsc --noEmit` clean; test fixture updated for new `TabFlag` field
- Committed `e6976fb`, pushed

**Architecture note:**
`service-worker.ts` is 393 lines (over the 250-line limit). Pre-existing violation; flagged for a future refactor session — extract `handleCheckDomain` + `isBundledDataFresh` into `domainCheck.ts`.

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
| Total passing | 296 | ✅ Clean (27 suites) |
| Last tsc run | March 16, 2026 | ✅ Clean |

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

- Avoid tap → platforms → scorecard vertical slice ✅
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
- Design system: `design/tokens.ts` foundation + all 26 components migrated to theme tokens ✅

## What's Not Working / Not Yet Built

| Item | Status | Priority |
|---|---|---|
| Donation amounts showing in BusinessCard | Verified working (Walmart: $3.65M R / $3.1M D) | ✅ Resolved |
| Map POI tap → entity matching | Built, linked, running on simulator — AIRMap nil crash fixed (native guard + JS guard), region render loop fixed | 🟡 Smoke test needed |
| Physical device geolocation test | Not done | 🟡 V1 needed |
| 3 entities pending retry (sherwin-williams, baker-hughes, chick-fil-a) | Run plain fetch:donations | 🟡 Nice to have |
| people.json individual donor data | Not started | 🟠 V1.5 |
| Scorecard sharing / social export | Not built | 🟠 V2 |
| ENTITY_LIST_UPDATE_URL | ✅ Resolved — `idontlikecodemuch/fckfascists-data` | ✅ Done |

---

## Immediate Next Steps (in order)

1. **Rebuild iOS** — `expo prebuild --platform ios --clean && expo run:ios` to verify design token changes render correctly on simulator.
2. **Podfile `post_install` hook** — automate the `AIRMap.m` nil guard patch so it survives `pod install`. See Known Limitations in CLAUDE.md.
3. **iOS simulator smoke test** — launch from simulator, walk the full vertical slice (map scan → flag → business card → avoid tap → platforms → scorecard). Verify the new dark palette, Bungee/IBMPlexSans typography, and token-based spacing render correctly.
4. **Physical device geolocation** — test on hardware, not simulator
5. **Pixel art assets** — integrate generated sprites from `tools/img-gen/` into the asset pipeline per `design/asset-manifest.json`

---

## Open Architectural Decisions

| Decision | Context | Status |
|---|---|---|
| Map POI tap scope | Full pipeline match used (alias first, FEC fuzzy fallback) | ✅ Resolved — full pipeline |
| Extension + scorecard unification | QR code bridge or permanently separate | ❓ Deferred V2 |
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
