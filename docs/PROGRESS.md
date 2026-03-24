# F*ck Fascists — Progress & Current State

This document is updated continuously. New instances should read this first — it tells you where we are, what was just done, and what needs to happen next.

---

## Current Sprint: MVP V1 — Core Vertical Slice

**Overall status:** Feature-complete. Device testing feedback addressed. Physical device re-test next.

---

## Recent Sessions (most recent first)

### Session: March 24, 2026 (device testing fixes — 10 issues)
**Focus:** Fix 10 issues found during physical device testing, spanning safe area handling, camera permissions, onboarding flow, map header sizing, sprite alignment, and copy consistency.

**What changed:**
1. **Safe area top constant** — added `SAFE_AREA_TOP_MIN` (52pt) in `config/constants.ts`. Applied to `BetaOverlay` (was hardcoded) and `BarcodeScannerSheet` (dynamic `Math.max(insets.top, SAFE_AREA_TOP_MIN)`). `ScanScreen` switched from RN `SafeAreaView` to `react-native-safe-area-context` `SafeAreaView` for proper inset handling.
2. **Camera permission eager request** — `BarcodeScannerSheet` now calls `requestPermission()` via `useEffect` on mount instead of showing an interstitial "Allow camera" button. Native OS dialog fires immediately when OPEN SCANNER is tapped.
3. **Map header reduced** — header bar backing shrunk to 75% of original aspect ratio; logo increased from 24pt to 28pt. Search bar top offset recalculated. More map visible behind the banner.
4. **FigureBadge fallback removed** — no more initials box when sprite is missing. Renders empty slot only. Cleaned up unused styles, imports, `getInitials()` function.
5. **Arena sprite flush** — `TRACK_ARENA_SINGLE_BOTTOM_INSET` set to 0 (was 6). Character sprites sit flush on arena bottom edge.
6. **Welcome + Launch logo responsive** — both screens now scale logo to ~22% of screen height (capped at 160pt) instead of fixed width. Prevents overflow on smaller screens.
7. **Onboarding reorder** — step order changed from welcome → permissions → privacy to welcome → **privacy** → **permissions**. YOUR DATA (privacy promise) now precedes SET UP (permission request). Step indices, navigator comments, copy comments, and test assertions all updated.
8. **Permissions confirmed state** — cards now show "GRANTED" text + green border when permission is granted (no button). Single bottom CTA only. Eliminates the three simultaneous LET'S GO buttons.
9. **YOUR DATA dead space** — privacy points list wrapped in a flex-centered container that fills the screen vertically.
10. **CTA reconciled** — launch screen "TAP TO START" changed to "PRESS START" to match onboarding welcome. Consistent 8-bit arcade reference across both surfaces.

**Verification:** 305 tests pass across 29 suites.

### Session: March 22, 2026 (barcode scan crash fix + runtime hardening)
**Focus:** Remove the Scan tab crash, keep the implementation lightweight, and document the final stable flow.

**What changed:**
1. **Crash root cause fixed** — added `NSCameraUsageDescription` to the native iOS app target so requesting camera access no longer risks an OS-level crash.
2. **Scanner mount path simplified** — `BarcodeScannerSheet` is now mounted only after the user taps `OPEN SCANNER`, which keeps camera setup contextual and avoids touching the preview while the Scan tab is idle.
3. **Native handling corrected** — removed the old `CameraView.isAvailableAsync()` gate from the native flow and switched to permission-state UI plus `onMountError`, matching Expo Camera’s documented surface more closely.
4. **Permission recovery improved** — when camera permission has already been denied, the scan sheet now offers an `Open settings` path instead of repeatedly prompting.
5. **Permission scope reduced** — set `recordAudioAndroid: false` for `expo-camera`, so the barcode feature does not request unnecessary microphone/audio access on Android.
6. **Documentation updated** — hardened [BARCODE_SCAN_V1.md](/Users/christophershannon/fuckfascists/docs/BARCODE_SCAN_V1.md), [SPEC_VS_CURRENT.md](/Users/christophershannon/fuckfascists/docs/SPEC_VS_CURRENT.md), and [ARCHITECTURE.md](/Users/christophershannon/fuckfascists/ARCHITECTURE.md) to reflect the final implementation rather than just the first rollout.
7. **Verification** — `npm run typecheck`, focused scan Jest tests, and `plutil -lint ios/FckFascists/Info.plist` passed. Full iOS simulator build verification remained partially blocked by the local Xcode/CoreSimulator/CocoaPods environment.

### Session: March 22, 2026 (barcode scanning v1 + dedicated Scan tab)
**Focus:** Add a product barcode scan flow that works in-store without shipping a massive bundled product database.

**What changed:**
1. **New top-level Scan destination** — added a dedicated `SCAN BETA` tab instead of hiding barcode scan inside Map. The flow is now a first-class product surface with its own CTA, permission timing, and result state, while staying clearly marked as test-only navigation for now.
2. **Camera scanner added** — installed `expo-camera`, configured the app plugin, and built `BarcodeScannerSheet` with `UPC-A`/`EAN-13` only, which keeps the scan path narrow and fast.
3. **Barcode resolution stays lightweight** — scan results normalize to GTIN-13, hit a local SQLite barcode cache first, and only call Open Food Facts on cache miss. Repeat scans stay local to the device.
4. **No giant product DB** — the implementation reuses bundled entity aliases as the brand-to-parent-company graph. No `product.json` or top-100 product bundle was added.
5. **Result flow reused, not duplicated** — once a brand resolves, the existing entity/FEC card path is reused. `BusinessCard` now shows a `SCANNED PRODUCT` context block so users can tell a shelf scan from a map match.
6. **Documentation added** — created [BARCODE_SCAN_V1.md](/Users/christophershannon/fuckfascists/docs/BARCODE_SCAN_V1.md) with architecture notes, source rationale, known risks, and explicit rollback steps.
7. **Verification** — `npx tsc --noEmit` passed and `npx jest --runInBand` passed with 320 tests across 30 suites.
8. **Tab bar bleed fixed** — removed the scaled repeat transform from the bottom-nav stone texture and clipped the tab bar bounds so the texture no longer paints upward over screen content.

### Session: March 21, 2026 (Track list visual hierarchy + sprite fallback polish)
**Focus:** Make grouped platform rows read more clearly as children and clean up the small platform-list sprite treatment.

**What changed:**
1. **Hierarchy styling improved** — child rows under group headers now use a deeper indent, smaller name/count type, a connector guide, and a softer nested background tint so they read as sub-items instead of peers.
2. **Platform busts simplified** — singleton platform rows now always use the neutral sprite bust, which avoids clipping defeated-state stars/halos inside tiny list crops.
3. **Bust crop relaxed** — shared platform-row bust crop constants were retuned slightly wider and less top-biased so faces sit more naturally in the small list tiles.
4. **Missing art fallback added** — introduced `FigureBadge` for Track. When a sprite is missing from the manifest, the UI now renders a monogram badge instead of a blank box. This fixes the visible YouTube/Sundar gap without needing new art immediately.
5. **Verification** — `npx tsc --noEmit` passed and `npx jest --runInBand` passed with 314 tests across 29 suites.

### Session: March 21, 2026 (Track pivot implementation — data-driven detail rows)
**Focus:** Implement the documented Track pivot so platform expansion stops depending on row-local animated height state.

**What changed:**
1. **Track state simplified** — `TrackContext` now separates `selectedPlatformId`, `openPlatformId`, and `focusedFigureName`, which removes the old overloaded focus token and the `expandedIds` set.
2. **List behavior rebuilt around data, not hidden animation state** — `TrackList` now inserts a real `dayCircles` item under the open platform row and uses `LayoutAnimation` for open/close transitions.
3. **Daily preview simplified** — the once-per-day ripple now lives locally in `TrackList` as a temporary set of open detail rows that collapse in sequence and cancel immediately on interaction.
4. **Day circles made presentational again** — `DayCircles` is now a plain detail row instead of an internally animated height container.
5. **Arena background direction aligned with the pivot** — `GameArena` is back on `cover` with the existing background color/overlay acting as the fallback layer; dynamic resize-mode switching was removed.
6. **Shared crop rule kept simple** — no per-sprite metadata was added. The same shared crop constants continue to drive both `2x2` and `2x1` sheets.
7. **Verification** — `npx tsc --noEmit` passed and `npx jest --runInBand` passed with 314 tests across 29 suites.

### Session: March 21, 2026 (Track pivot planning — simplify list behavior and sprite crop)
**Focus:** Stop iterating on the fragile inline day-circle animation and document a simpler Track implementation path before another code pass.

**What changed:**
1. **Platform interaction pivot documented** — added [TRACK_PLATFORM_PIVOT.md](/Users/christophershannon/fuckfascists/docs/TRACK_PLATFORM_PIVOT.md) describing the move from row-local animated height to a data-driven `dayCircles` detail item inserted directly into `FlatList` data.
2. **Internet vetting recorded** — the pivot is now grounded in the official React batching docs, React Native `FlatList` and `LayoutAnimation` docs, Apple list/disclosure guidance, and the controlled accordion pattern.
3. **Sprite crop simplification validated** — visually sampled 10 random sprite sheets across both `2x2` and `2x1` tiers. All sampled sheets use the same `728x720` frame geometry, and the face anchor is consistent enough to justify one shared crop rule rather than per-sprite metadata.
4. **Arena background direction simplified** — the pivot note now keeps arena art on `cover` and recommends only a color/texture fallback layer underneath, matching the fact that the background assets were painted to crop well.

### Session: March 21, 2026 (Track follow-up — row tap expansion + crop alignment + arena background fit)
**Focus:** Fix the remaining Track complaints after the v3 rebuild: row taps still feeling non-responsive, faces still clipping inside the sprite crop, and arena backgrounds looking zoomed on narrower assets.

**What changed:**
1. **Row-body expansion made atomic** — added a reducer-level `press-expandable-row` action so row taps and `✓` taps do not branch on a render-time `focused` prop. A row tap now opens that row immediately and a second tap collapses it.
2. **Sprite crop corrected in both axes** — `SpriteView` now supports `cropOffsetX` in addition to `cropOffsetY`. Track bust/grid/single-character crops are nudged slightly left and up so the face stays inside the square window instead of clipping against the top/right edge of the frame.
3. **Arena background fit corrected** — `GameArena` now picks `cover` only when the selected arena asset aspect ratio is already close to the live arena ratio, and uses `contain` for squarer backgrounds so they stop appearing zoomed in.
4. **Regression expectations updated** — `trackUIState.test.ts` now reflects the one-tap row-open behavior and verifies that switching rows collapses the prior row while opening the newly selected one.

### Session: March 21, 2026 (Track screen rebuild v3 — reducer-driven focus + FlatList restore)
**Focus:** Re-architect the Track screen interaction model so focus, arena state, and day-circle expansion stay in sync. Fix the broken expand/collapse behavior, restore the spec'd `FlatList` layout, and enforce one platform avoid per day.

**Changes:**
1. **Track screen structure restored** — `TrackScreen` is back to `TrackProvider` → `TrackHeader` → `GameArena` → `TrackList` (`FlatList`, only scrollable element). Removed the stray main-screen `Clear data` action from the header.
2. **Reducer-driven Track UI state** — focus and expansion logic moved into `context/trackUIState.ts` so row focus, group focus, and `✓` expand/collapse happen through one state machine instead of competing `setState` calls. Added `focusedFigureName` + `arenaHitRequest` bridge in `TrackContext`.
3. **List components made prop-driven again** — `TrackList.tsx` now owns `FlatList` render branching and passes explicit props into `PlatformGroupHeader` and `PlatformRow`. Day circles expand correctly on focused-row body taps and `✓` taps, and previous expansions collapse on focus shifts.
4. **Daily open animation fixed** — first visit to Track each calendar day now checks a persisted SecureStore date (`track_daily_open_last_visit`), opens all rows once, then stagger-collapses them. No AppState/focus/unfocus trigger.
5. **Arena rebuilt** — random background on mount, full tracked roster in the neutral character-select grid, larger/corrected sprite crop math via `SpriteView.cropRatio`, left-weighted single-character portrait, same-person sibling pulse instead of full transition, and coordinate-aware arena FX positioning.
6. **Platform avoid model corrected** — `recordPlatformAvoid*()` now no-op when a platform/date is already logged, platform weekly reads normalize legacy overcounted records to binary per day, and Track/Scorecard tests were updated to the new one-per-day semantics.

**Files created:** `features/Platforms/components/TrackList.tsx`, `features/Platforms/context/trackUIState.ts`, `features/Platforms/context/trackHelpers.ts`
**Files rebuilt:** `features/Platforms/TrackScreen.tsx`, `features/Platforms/context/TrackContext.tsx`, `features/Platforms/components/GameArena.tsx`, `features/Platforms/components/TrackHeader.tsx`, `features/Platforms/components/PlatformGroupHeader.tsx`, `features/Platforms/components/PlatformRow.tsx`
**Files modified:** `features/Platforms/components/ArenaFX.tsx`, `features/Platforms/components/AvoidButton.tsx`, `features/Platforms/components/DayCircles.tsx`, `features/Platforms/hooks/usePlatformAvoidance.ts`, `core/data/eventStore.ts`, `core/sprites/spriteLoader.tsx`, `config/constants.ts`, `design/tokens.ts`, `features/Scorecard/data/__tests__/aggregateScorecard.test.ts`, `docs/PROGRESS.md`
**Follow-up validation:** added user-flow regression coverage in `features/Platforms/__tests__/trackUIState.test.ts` and a rollback/architect note in `docs/TRACK_SCREEN_V3_NOTES.md` documenting the failure mode in prior commit `795e7d8`, the new pressure-test matrix, and exact rollback commands.

**Verification:** `npx tsc --noEmit` clean. `npx jest --runInBand` clean — 314 tests passing (29 suites).

### Session: March 20, 2026 (Track screen rebuild v2 — component extraction + todayActions)
**Focus:** Second-pass rebuild of the Track screen. Extracted monolithic TrackRow/TrackList into focused single-responsibility components. Defeated state now driven by todayActions (any avoid = defeated) instead of weekly threshold.

**Changes:**
1. **Deleted old files:** `TrackList.tsx`, `TrackRow.tsx` (both accumulated too many responsibilities in v1 rebuild)
2. **New component architecture:**
   - `components/AvoidButton.tsx` (75 lines) — ONE Pressable, TWO visual states. "AVOID" (green bg, white text) → "✓" (muted bg, green text). Driven by `avoidedToday` boolean prop.
   - `components/PlatformGroupHeader.tsx` (93 lines) — sprite bust (always neutral) + short parent name + roll-up avoid count. Tap focuses first child platform.
   - `components/PlatformRow.tsx` (220 lines) — handles both `childRow` and `platformRow` types via `isChild` prop. Two tap zones: row body (focus/expand/collapse cycle) and AvoidButton. DayCircles always mounted with animated height.
   - `components/ArenaFX.tsx` (107 lines) — extracted from GameArena: SpeechBubbleFX, FloatingMinusOneFX, `arenaFXRegistry`.
   - `utils/listData.ts` (62 lines) — extracted from TrackScreen: `TrackListItem` union type and `buildListData()` function.
   - `components/GameArena.tsx` (209 lines) — rebuilt. Grid sprites ALWAYS neutral. Single character uses `todayActions.has()` for defeated state. `fireHitFX` static property for parent communication.
   - `components/TrackHeader.tsx` (94 lines) — rebuilt. No screen title (tab says TRACK). Top row: week label + "Edit platforms" (underlined). Count area: avoid count when >0, "LET'S GO!!!!" pump-up when 0.
   - `TrackScreen.tsx` (195 lines) — rebuilt. Contains `TrackScreen` (root) and `TrackListInner`. Daily open animation with per-day tracking via `dailyOpenDateRef`.
3. **TrackContext rebuilt** (161 lines) — `isDefeated()` now returns `todayActions.has(figureName)` instead of `personWeeklyAvoids() >= SPRITE_DEFEATED_THRESHOLD`. `avoidForDate()` adds to todayActions for any date including past-day backfills.
4. **DayCircles rebuilt** (140 lines) — uses `TRACK_DAY_CIRCLE_SIZE` and `TRACK_DAY_CIRCLES_GAP` constants.
5. **Copy updates:** removed old keys (`title`, `score`, old `avoidedBtn`/`avoidedLabel`/`notAvoidedLabel`/`editBtn`/`editLabel`/`groupHeader`/`arenaTitle`). Added: `editPlatforms`, `editPlatformsA11y`, `avoidCountLabel`, `pumpUp`, new `avoidedBtn` (✓), `avoidBtnA11y`, `avoidedBtnA11y`, `countDash`, `expandIndicator`, `collapseIndicator`, `groupHeaderA11y`. Changed `countLabel` format from `×${n}` to `${n}×`.
6. **Constants updates:** renamed `ARENA_MAX_HEIGHT` → `ARENA_HEIGHT = 200`. Removed `SPRITE_DEFEATED_THRESHOLD`. Added 16 `TRACK_*` layout tuning constants.

**Screen layout:** Plain flex column. TrackHeader (auto height) → GameArena (fixed 200pt) → FlatList (flex: 1, only scrollable element). No sticky headers, no nested scrolling.

**Files created:** features/Platforms/components/AvoidButton.tsx, features/Platforms/components/PlatformGroupHeader.tsx, features/Platforms/components/PlatformRow.tsx, features/Platforms/components/ArenaFX.tsx, features/Platforms/utils/listData.ts
**Files rebuilt:** features/Platforms/TrackScreen.tsx, features/Platforms/context/TrackContext.tsx, features/Platforms/components/TrackHeader.tsx, features/Platforms/components/GameArena.tsx, features/Platforms/components/DayCircles.tsx
**Files modified:** copy/platforms.ts, config/constants.ts, docs/PROGRESS.md, CLAUDE.md
**Files deleted:** features/Platforms/components/TrackList.tsx, features/Platforms/components/TrackRow.tsx

**Kept unchanged:** hooks (usePlatformAvoidance, usePlatformRoster, useNudgeNotification), utils (weekDates, platformHelpers), types.ts, platformList.ts, PlatformSetupScreen.tsx, NudgeBanner.tsx, all tests

**Verification:** 295 tests pass (27 suites). 1 pre-existing failure in personList.test.ts (PoliticalPerson type mismatch, unrelated to Track rebuild). All files under 250-line limit.

### Session: March 19, 2026 (Shared FX system + App.tsx extraction + people.json docs)
**Focus:** Three infrastructure tasks — no UI changes.

**Changes:**
1. **Shared FX system (`core/fx/`)** — replaces CelebrationOverlay with a generic, extensible effects system.
   - `types.ts` — FXEntry, FXScope ('point'|'area'|'full'), FXComponentProps, FXRegistration
   - `useFX.ts` — fire-and-forget hook: `fire(type, scope, meta?)`, `remove(id)`, `entries[]`, `active`, `reducedMotion`
   - `FXLayer.tsx` — host component that renders active effects from a registry
   - `registry.ts` — default registry with built-in `avoid` effect
   - `effects/AvoidCelebration.tsx` — migrated from CelebrationOverlay (scale+fade, reduced motion support)
   - `index.ts` — barrel export
   - `config/constants.ts` — added `FX_AVOID_DURATION_MS = 3000`, `FX_AVOID_FADE_MS = 400`
   - **MapScreen.tsx** — replaced `CelebrationOverlay` imports + `celebrations[]` state + `reducedMotionRef` with `useFX()` + `<FXLayer>`. Removed `AccessibilityInfo` import.
   - **Deleted** `features/Map/components/CelebrationOverlay.tsx`

2. **App.tsx extraction** — split monolithic App.tsx into gate components.
   - `app/gates/OnboardingGate.tsx` — wraps `useOnboarding` + conditional `OnboardingNavigator`
   - `app/gates/LaunchGate.tsx` — wraps `shouldShowLaunchScreen()` + conditional `LaunchScreen`
   - `app/gates/AppShell.tsx` — tab navigation, screen rendering, beta overlay, FEC client
   - **App.tsx** reduced from 226 to 112 lines: fonts → data init → splash → gate chain

3. **People.json architecture documentation**
   - **CLAUDE.md** — expanded Entity Relationships: bidirectional linkage model, full PoliticalPerson schema with all fields, integrity rules, getPersonDisplayName. Updated repo structure (added `app/gates/`, `core/fx/`). Updated sprint focus table.
   - **SPEC_VS_CURRENT.md** — people.json row updated from "Deferred — V1.5" to "In progress" with current state. 8-bit design system entry updated to reflect FXLayer.

**Files created:** core/fx/types.ts, core/fx/useFX.ts, core/fx/FXLayer.tsx, core/fx/registry.ts, core/fx/effects/AvoidCelebration.tsx, core/fx/index.ts, app/gates/OnboardingGate.tsx, app/gates/LaunchGate.tsx, app/gates/AppShell.tsx
**Files modified:** App.tsx, features/Map/MapScreen.tsx, features/Map/components/BusinessCard.tsx (comment), config/constants.ts, CLAUDE.md, docs/SPEC_VS_CURRENT.md, docs/PROGRESS.md
**Files deleted:** features/Map/components/CelebrationOverlay.tsx

**Verification:** 307 tests pass (28 suites).

### Session: March 19, 2026 (AIRMap.m post_install patch hook)
**Focus:** Automate the AIRMap.m nil guard patch so it survives `pod install`.

**Changes:**
- **ios/Podfile** — added `post_install` hook that reads `node_modules/react-native-maps/ios/AirMaps/AIRMap.m` and injects nil guards on `insertReactSubview:atIndex:`, `removeReactSubview:`, and `addSubview:` if missing. Idempotent — detects existing guards and skips. Prints confirmation via `Pod::UI.puts` when patch is applied.
- **CLAUDE.md** — updated Modern Code Standards bullet (native guard is now auto-applied by Podfile hook). Updated Known Limitations section: AIRMap.m nil guard patch marked as ✅ Resolved.

**Files modified:** ios/Podfile, CLAUDE.md, docs/PROGRESS.md

**Verification:** 295 tests pass (27 suites). Patch idempotency confirmed via Ruby dry-run against both patched and simulated unpatched sources.

### Session: March 18, 2026 (BusinessCard rebuild + component extraction)
**Focus:** Complete BusinessCard rebuild — deleted old component, split into clean composable pieces, moved celebration to screen level, extracted map controls hook.

**Changes:**
- **Deleted** old `BusinessCard.tsx` (accumulated ad hoc patches, broken view hierarchy, celebration code mixed in)
- **Created `DataZone.tsx`** — self-contained donation data display: total since 2016 (GOP/DEM), recent cycle, active cycles, PAC attribution, FEC link. Three states: real donations, no donations on file, data unavailable.
- **Created `DetailSheet.tsx`** — placeholder for future expanded data view (no-op for V1)
- **Rebuilt `BusinessCard.tsx`** (168 lines) — clean three-section layout: sprite perch above card (overflow visible, marginBottom -40, zIndex 20), name section (brand + parent attribution + confidence badge), DataZone, AvoidButton + dismiss. `accessibilityViewIsModal`, post-avoid screen reader announcement via `AccessibilityInfo.announceForAccessibility`.
- **Created `BusinessBanner.tsx`** (114 lines) — lightweight banner for non-card states. `resolveCardMode()` function determines card vs banner: checks entity presence, fecCommitteeId, donationSummary all-zeros. Four banner variants: no_match, lookup_failed, no_pac, dissolved.
- **Created `CelebrationOverlay.tsx`** (66 lines) — screen-level celebration effect extracted from old card. Respects reduced motion (static checkmark vs animated scale+fade). `CELEBRATION_DURATION_MS = 3000`. Array-based registry in MapScreen for extensibility.
- **Extracted `useMapControls.ts`** (73 lines) — zoom in/out, region tracking, initial centering, recenter-on-me. Keeps MapScreen focused on data flow.
- **Rewrote `MapScreen.tsx`** (217 lines) — celebration registry (`CelebrationEffect[]`), card/banner routing via `resolveCardMode()`, `handleNewResult()` for second-tap-replaces-card, `pointerEvents='none'` during celebration, `maxHeight: '65%'` on card container.
- **Updated `copy/map.ts`** — added banner strings (bannerNoMatch, bannerLookupFailed, bannerNoPac, bannerDissolved, bannerDismissLabel), DataZone strings (dataZoneDetail, dataZoneDetailLabel), card accessibility strings (cardAvoidedAnnouncement, cardModalLabel), parent attribution string.
- **Updated `MapSections.tsx`** — new BusinessCard API + BannerNoMatch, BannerNoPac, BannerDissolved catalog sections.
- **Updated `CatalogScreen.tsx`** — banner variants added to SECTIONS array, slice indices adjusted.

**Files created:** BusinessBanner.tsx, CelebrationOverlay.tsx, DataZone.tsx, DetailSheet.tsx, useMapControls.ts
**Files rewritten:** BusinessCard.tsx, MapScreen.tsx
**Files modified:** copy/map.ts, MapSections.tsx, CatalogScreen.tsx

**Architecture:** BusinessCard.tsx re-exports `BusinessBanner` and `resolveCardMode` from BusinessBanner.tsx so existing import paths continue to work. All files under 250-line limit.

**Verification:** tsc clean, 295 tests pass (27 suites)

### Session: March 18, 2026 (map polish + launch screen fix + no-match toast)
**Focus:** Header bar transparent ridge, header-to-search spacing, launch screen auto-dismiss timing, tap no-match feedback

**Changes:**
- **MapScreen.tsx** — added `backgroundColor: bgVoid` to `headerBarOverlay` style so transparent pixels in header_bar.png show the dark background instead of the map bleeding through. Increased header-to-search-bar gap from `theme.space.xs` (4pt) to `theme.space.md` (12pt).
- **LaunchScreen.tsx** — fixed 5s auto-dismiss firing early. Root cause: `onDismiss` prop was an inline arrow function in App.tsx, creating a new reference on every parent re-render. The auto-dismiss `useEffect` depended on `[onDismiss]`, so every parent re-render cleared and restarted the 5s timer. Fix: store `onDismiss` in a ref and run the timer effect once on mount with an empty dependency array.
- **App.tsx** — stabilized `onDismiss` callback with `useCallback` (`dismissLaunch`), providing a stable reference as a belt-and-suspenders complement to the ref fix in LaunchScreen.
- **useTapSearch.ts** — added `tapNoMatch` state: set to `true` for 2s when a map tap finds POI names but none match any entity. Exposed in return value.
- **NoMatchToast.tsx** — new component: brief absolutely-positioned toast ("No match found") shown when `tapNoMatch` is true and no card is active. Uses `accessibilityRole="alert"` for VoiceOver.
- **copy/map.ts** — added `tapNoMatch` copy key.
- **MapScreen.tsx** — wired `tapNoMatch` from `useTapSearch` to render `<NoMatchToast />`.

**Verification:** tsc clean, 295 tests pass

### Session: March 18, 2026 (UI kit revert + header bar fix + sprite overflow)
**Focus:** Partial revert of UI kit wiring (assets don't fit at current sizes), header bar sizing fix, sprite overflow fix

**Changes:**
- **Reverted UI kit wiring** from 6 components — sliced assets remain in `assets/pixel/ui/` but are no longer wired into BusinessCard, AvoidButton, MapSearchBar, TabBar, MapControls, or ScorecardView. All components restored to pre-UI-kit coded borders/styling. `core/ui/uiAssets.ts` and header bar wiring in MapScreen retained.
- **MapScreen.tsx** — header bar height now derived from screen width via `useWindowDimensions` + aspect ratio (1482/153) instead of hardcoded 60px. Image uses `resizeMode="stretch"` for full-width fill. Logo vertically centered within the stone area above the crumbling edge.
- **BusinessCard.tsx** — explicit `overflow: 'visible'` on `whoSection`, `whoRow`, and `spriteHero` styles to ensure the sprite perch renders outside the card's top edge without clipping. Corner brackets restored.
- Renamed `assets/pixel/UI/` → `assets/pixel/ui/` (lowercase) to fix Metro bundler case-sensitive resolution.

**Verification:** tsc clean, 295 tests pass

### Session: March 18, 2026 (UI kit slicing + component wiring)
**Focus:** UI kit sprite sheet slicing pipeline + wiring pixel art assets into 7 components

**Changes:**
- Created `tools/img-gen/scripts/slice_ui_kit.py` — auto-detects connected non-transparent regions via flood-fill BFS, extracts each as individual transparent PNG. Reusable for any sprite sheet.
- Sliced `ui_kit.png` into 30 elements, saved to `assets/pixel/ui/` with semantic names (frames, buttons, bars, badges, input fields, panels, dividers)
- Created `core/ui/uiAssets.ts` — static require() map for all 30 UI kit elements + header bar
- **MapScreen.tsx** — header bar replaced with `header_bar.png` pixel art asset, overlaid on map with logo on top. Irregular bottom edge is transparent (map visible through gaps). Full SafeAreaView layout restructured.
- **BusinessCard.tsx** — `ImageBackground` with `frame_card_wide.png` replaces coded borders + corner brackets. Corner bracket images removed.
- **AvoidButton.tsx** — `ImageBackground` with `btn_start.png` replaces coded yellow/green background. Frame image hidden on confirmed/error states (solid colors remain).
- **MapSearchBar.tsx** — `ImageBackground` with `input_field.png` wraps TextInput. Search button uses `btn_circle_search.png` Image.
- **TabBar.tsx** — `bar_tab.png` replaces stone tile repeat texture. resizeMode stretch, higher opacity.
- **MapControls.tsx** — `ImageBackground` with circle button assets (`btn_circle_plus`, `btn_circle_arrow`, `btn_circle_target`) replace coded dark square buttons.
- **ScorecardView.tsx** — `ImageBackground` with `frame_scorecard.png` replaces coded hero border.
- Documented `slice_ui_kit.py` in `tools/img-gen/USAGE.md`
- Updated CLAUDE.md repo structure tree (core/ui/, assets/pixel/ui/, slice_ui_kit.py)

**Verification:** tsc clean, 295 tests pass, copy audit clean (dev fixtures only)

### Session: March 18, 2026 (arena assets pattern)
**Focus:** Arena background asset management — arenaAssets.ts require map + build script

**Changes:**
- Created `core/arena/arenaAssets.ts` — static `require()` map for arena backgrounds, following the `spriteAssets.ts` pattern
- Created `scripts/generate-arena-assets.mjs` — scans `assets/pixel/arena/` for PNGs and regenerates `arenaAssets.ts`. Run after adding or removing arena backgrounds.
- Updated `GameArena.tsx` — imports from `arenaAssets` instead of inline `require()` calls; `ARENA_BACKGROUNDS` built via `Object.values(arenaAssets)`
- Documented script in CLAUDE.md (repo structure tree + data pipeline section)

**Verification:** tsc clean, 295 tests pass, copy audit clean (dev fixtures only)

### Session: March 18, 2026 (follow-up — img-gen pipeline + device testing)
**Focus:** Physical device build fix, ornamental asset pipeline, magenta keying overhaul

**Physical device (iOS):**
- Diagnosed map freeze on physical device: `MKLocalSearch.start()` was called from Expo Modules background queue — MapKit silently hangs off main thread; completion handler never fires; JS promise never resolves; loading state stuck permanently
- Fix: wrapped `MKLocalSearch` creation and `.start()` in `DispatchQueue.main.async {}` in `MapKitSearchModule.swift`
- iOS build: provisioning failure with `expo run:ios --device` — fixed by opening `FckFascists.xcworkspace` directly in Xcode; Xcode handles device registration and provisioning profile updates interactively
- CLAUDE.md updated with MKLocalSearch main-thread rule (do not remove dispatch wrapper)

**Ornamental asset pipeline (tools/img-gen/):**
- Created `scripts/generate_assets.py` — generates UI ornament assets via Gemini API from `asset-prompts.json`. Same API pattern as `generate.py`. CLI: `--all`, `--asset <id>`, `--dry-run`, `--force`. Prompts reference image before generation (y/n).
- Created `scripts/process_assets.py` — reads `asset-prompts.json` processing config, applies keying + slicing + nearest-neighbor scaling. Handles `grid_2x2` (4 files), `split_horizontal` (left/right), `auto_crop`, `crop_center`, `horizontal_band`. Output: `output/new/`. Raw input: `output/raw/UI Elements/`.
- Created `scripts/deploy_assets.py` — copies processed assets to `assets/pixel/`. Handles multi-file outputs via glob. Never deletes from target.
- `config.json` — cleared `reference_images` (was `["reference/ref1.png"]`); reference images now opt-in per run

**Magenta keying overhaul (`remove_magenta.py`):**
- Full rewrite with HSV-based detection (replaces RGB Euclidean distance). Candidate = hue 285–345°, saturation ≥ 0.35, value ≥ 0.25, red-minus-green ≥ 26, blue-minus-green ≥ 13
- Border-connected BFS flood fill (pure Python + PIL, no numpy/scipy required)
- Large interior region removal (`--interior-min-size`, default 250px) — catches magenta trapped inside closed shapes
- Optional conservative defringe pass (`--defringe`) — strips leftover pink edge pixels using 8-neighbor adjacency check
- Single-file mode: `remove_magenta.py input.png [output.png] [flags]`; `--output-dir` flag for batch and single-file mode
- Tuning flags exposed on CLI: `--hue-min`, `--hue-max`, `--min-sat`, `--min-val`, `--interior-min-size`
- Key tuning insight: to preserve dark purple clothing while removing bright magenta, raise `--min-val` (e.g. 0.65) — value (brightness) is the discriminator, not hue

**`process_assets.py` keying:**
- Removed scipy dependency; now delegates to `remove_magenta.remove_magenta()` via importlib (single source of keying logic)

**`gpt_image.py` updates:**
- Model updated to `gpt-image-1.5`
- Added `background="transparent"` and `output_format="png"` to `images.edit()` calls
- Fixed subcommand names (`--generate`/`--process` → `generate`/`process`) — argparse subparsers don't support `--` prefix names
- Fixed Python 3.9 compatibility: `Path | None` type annotation → untyped

**Files modified:**
- `modules/mapkit-search/ios/MapKitSearchModule.swift` — DispatchQueue.main.async wrapper
- `tools/img-gen/scripts/remove_magenta.py` — full rewrite (HSV flood-fill)
- `tools/img-gen/scripts/process_assets.py` — delegates keying to remove_magenta, output/new/, UI Elements input dir
- `tools/img-gen/scripts/gpt_image.py` — model 1.5, transparent bg, subcommand fix, Python 3.9 compat

**Files created:**
- `tools/img-gen/scripts/generate_assets.py`
- `tools/img-gen/scripts/deploy_assets.py`

---

### Session: March 18, 2026
**Focus:** Physical device visual refinement pass — 8 UI changes across 9 files

**Completed:**

**Launch screen:**
- Auto-dismiss increased from 3s to 5s for title screen feel
- Logo now 60% of screen width (was fixed 200pt) — more prominent on device
- Added subtle breathing scale animation on logo (1.0→1.04→1.0 loop, 3s period) — respects reduced motion
- Uses `Animated.Image` + `useWindowDimensions` for dynamic sizing

**Map screen:**
- Increased spacing between branded header bar and search bar — `paddingVertical: md` on header, `topOffset` uses `md` gap

**Business card:**
- Corner brackets repositioned: now sit ON the card border (top: -4, left/right: -4) with larger 36pt size
- Vertical padding compressed: WHO section `paddingBottom: sm`, WHY section `paddingBottom: sm`, `paddingTop: sm` on total label
- Reward overlay z-index raised to 10 (was 4) — now renders in front of sprite (z-index 5)
- Sprite increased from 120pt to 150pt; marginTop -80 (was -60) so sprite still stands on topband; marginLeft negative to encroach left

**Track screen:**
- "Edit platform selection" text now underlined (`textDecorationLine: 'underline'`) to read as tappable

**SpriteView:**
- New `headOnly` prop — clips to top 38% of sprite frame (head/face crop) via reduced container height
- No asset changes — same sprite sheet, overflow:hidden handles the crop

**GameArena:**
- Full bleed: removed `marginHorizontal`, arena now edge-to-edge
- Increased background opacity from 0.25 to 0.3
- `minHeight: 120` for taller arena section
- All sprites use `headOnly` — cell height adapted to cropped head proportion
- Arena roster now shows ALL tracked platforms (full `TRACKED_PLATFORMS` list), not just user's current selection — rogues' gallery, not a mirror of user choices

**Platform Row:**
- Grouped child rows indent deeper: `paddingLeft: 3xl` (was `xl`) — tree structure visual
- Row content (everything except avoid button) wrapped in a single `Pressable` for expand/collapse — not just the + icon
- Removed separate `chevronBtn` `Pressable` — chevron is now inside the row content touchable
- Second-tap auto-expand: if today already has count > 0 when avoid button is pressed, row auto-expands to show day circles, teaching the backfill mechanic organically

**Tab Bar:**
- Stone texture scaled up 2x via `transform: [{ scale: 2 }]` on `imageStyle` — pattern now visible at device resolution

**Files modified:**
- `features/Launch/LaunchScreen.tsx` — breathing logo animation, 5s dismiss, dynamic width
- `features/Map/MapScreen.tsx` — header bar padding, search bar gap
- `features/Map/components/BusinessCard.tsx` — corners, z-index, sprite size, tighter padding
- `features/Platforms/PlatformsScreen.tsx` — edit underline, arena all-platforms roster
- `core/sprites/spriteLoader.tsx` — `headOnly` prop on SpriteView
- `features/Platforms/components/GameArena.tsx` — full bleed, headOnly, taller, 0.3 bg opacity
- `features/Platforms/components/PlatformRow.tsx` — row tap target, indent, auto-expand
- `app/navigation/TabBar.tsx` — texture scale 2x

**Build:** tsc clean. 295 tests passing (27 suites). audit-copy.sh clean (dev-only fixtures only).

---

### Session: March 17, 2026 (follow-up 2)
**Focus:** Brand assets wired + GPT image pipeline tool

**Completed:**

**Brand logo wiring:**
- **Map header** — replaced text-based `{sharedCopy.appName}` with `<Image>` rendering `FF_logo_horizontal.png` (1536×322). Height 28pt, aspect ratio preserved. `accessibilityLabel={sharedCopy.appName}`.
- **Launch screen** — replaced text-based `appName` with `FF_logo.png` (1466×827) as hero image. Width 200pt, aspect ratio preserved, centered.
- **Onboarding welcome** — replaced text-based `appDisplay` with `FF_logo.png` as hero image. Same dimensions as launch screen. Added `sharedCopy` import for accessibility label.
- **App icon + splash** — `app.json` updated with `icon` and `splash` fields pointing to `FF_logo.png`. Splash background `#070B12` matches `theme.colors.bgVoid`.

**Arena backgrounds:**
- **GameArena** — replaced single tiled `bg_tile_dark_stone.png` with 4 arena scene backgrounds (`arena_sf`, `arena_byc_street`, `arena_nyc_penthouse`, `arena_dc`). Random selection via `useMemo` on mount. Changed `resizeMode` from `repeat` to `cover`.

**Asset manifest:**
- Added 6 new entries with status `"ready"`: `brand-logo-stacked`, `brand-logo-horizontal`, `arena-bg-sf`, `arena-bg-nyc-street`, `arena-bg-nyc-penthouse`, `arena-bg-dc`. Each includes dimensions, usage context, and fallback.

**GPT image pipeline (tools/img-gen/):**
- Created `scripts/gpt_image.py` — general-purpose GPT image tool using `gpt-image-1`. Two modes: `--generate` (text prompt → PNG, optional reference image) and `--process` (batch edit existing PNGs with natural-language instructions). Reads `OPENAI_API_KEY` from repo root `.env` via python-dotenv. Batch support with `[N/total]` progress, skip-on-error.
- Created `USAGE.md` — full documentation for all 8 scripts in the pipeline (generate, generate_assets, compose, remove_magenta, process_assets, deploy_assets, manifest, gpt_image). Pipeline overview section, all CLI flags, 2+ examples per script.
- Updated `requirements.txt` — added `openai`, `python-dotenv`, `scipy` (was imported but missing).

**Files created:**
- `tools/img-gen/scripts/gpt_image.py`
- `tools/img-gen/USAGE.md`

**Files modified:**
- `features/Map/MapScreen.tsx` — Image import, horizontal logo in header, headerLogo style
- `features/Launch/LaunchScreen.tsx` — Image import, stacked logo hero, heroLogo style
- `features/Onboarding/screens/WelcomeScreen.tsx` — Image import, sharedCopy import, stacked logo hero, heroLogo style
- `app.json` — icon and splash configuration
- `features/Platforms/components/GameArena.tsx` — arena backgrounds array, random selection, cover resize
- `design/asset-manifest.json` — 6 new asset entries
- `tools/img-gen/requirements.txt` — 3 new dependencies

**Build:** tsc clean. 295 tests passing (27 suites). audit-copy.sh clean.

---

### Session: March 17, 2026 (follow-up)
**Focus:** Device-testing-driven visual refinement pass

**Completed:**

**Map screen:**
- Search bar safe area fix — added `insets.top` to search bar offset so it clears the status bar on device
- Tap-to-dismiss backdrop — added `Pressable` overlay behind BusinessCard for dismissing by tapping the map
- Card container `overflow: 'visible'` to allow sprite perch to extend above card bounds

**Business card:**
- Sprite perch enlarged — 100→120pt, `marginTop: -60` + `zIndex: 5` so sprite stands ON TOP of card border
- WHY section divider softened — `hero` width `frameBlue` → 1px `surface2` (less visual noise)
- Reward overlay wired — `business_card_reward_overlay.png` fades in to 0.6 opacity over 400ms during 3s celebration
- Card `overflow: 'visible'` for sprite perch

**Avoid button:**
- Added debug `console.log` before haptic feedback call
- Visual depth — `bgVoid` top border + `highlightBlue` bottom border (2px each)

**Platforms screen (TRACK):**
- Removed "THE ARENA" title label from GameArena
- Arena padding reduced — `margin: md` → `marginHorizontal: sm, marginTop: sm`, `padding: md` → `sm`
- Arena background — `ImageBackground` with `bg_tile_dark_stone.png` at 25% opacity
- Sprite cells — `rewardYellow` 2px borders, `surface1` background, centered grid
- Short parent names — added `shortParentName()` to strip Inc/Corp/Platforms/.com and uppercase (e.g. "META" not "META PLATFORMS")
- Group header is ONLY sprite for grouped platforms — child rows hide sprites via `hideSprite` prop
- Grouped child rows compact — reduced vertical padding, left indent via `compact` prop
- Edit button restyled — bordered box → plain text link

**Info screen:**
- Tagline centered (`textAlign: 'center'`)
- Collapse indicator changed from ▲/▼ to +/− (matches FaqItem pattern)

**Global highlight line reduction:**
- TabBar top border: `hero` (4px) → `standard` (2px)
- InfoSection top border: `hero` → `standard`
- PlatformGroup top border: `hero` → `standard`

**Files modified:**
- `features/Map/MapScreen.tsx` — safe area offset, backdrop, overflow
- `features/Map/components/BusinessCard.tsx` — sprite perch, reward overlay, divider, overflow
- `features/Map/components/AvoidButton.tsx` — haptics debug log, depth borders
- `features/Platforms/PlatformsScreen.tsx` — shortParentName, grouped rows hideSprite+compact, edit button restyle
- `features/Platforms/components/GameArena.tsx` — removed title, ImageBackground, cell borders, padding
- `features/Platforms/components/PlatformGroup.tsx` — top border standard
- `features/Platforms/components/PlatformRow.tsx` — hideSprite, compact props
- `features/Info/InfoScreen.tsx` — centered tagline, +/− indicator
- `features/Info/components/InfoSection.tsx` — top border standard
- `app/navigation/TabBar.tsx` — top border standard

**Build:** Xcode build clean (0 errors).

---

### Session: March 17, 2026
**Focus:** Design refinement — 8-bit game energy across all screens, bug fixes, sprite halo removal

**Completed:**

**Bug fixes (7 fixes from device testing):**
- **Launch screen gate** — `shouldShowLaunchScreen()` was marking today as "seen" during onboarding before `isComplete` was true. Fixed: launch check deferred until `isComplete === true`. Loading guard also updated so onboarding renders without waiting for `showLaunch`.
- **Avoid dismiss timing** — business card dismissed instantly on avoid tap. Added 3s celebration delay with fade+shrink animation (`Animated.parallel` opacity/scale, 400ms ease-out, respects reduced-motion). `avoidedResult` state drives defeated sprite/topband during delay.
- **Multi-match re-tap** — tapping a pin at shared coordinates jumped to single card instead of showing chooser. Fixed: pin `onPress` now checks for colocated pins and routes to `setLatestTapBatch` when ≥2.
- **Search pin drop** — text search was dropping map pins for businesses that might not be nearby. Added `isTextSearch` ref guard: pin effect skips when `isTextSearch.current === true`.
- **Chick-fil-A zeros** — entities with all-zero donation data (dissolved PACs) showed "$0 / $0". Added `hasRealDonations` guard; shows "No donation data on file." when all amounts are zero.
- **Day circles future style** — future day circles used `surface2` fill (identical to past unchecked). Changed to `transparent` background with `textSecondary` border, `opacity: 0.3`.
- **Corner brackets** — business card had only TL+TR corners. Not a bug but noted for future asset wiring.

**Design refinement — Steps 1-5 (from approved plan):**
- **Copy updates** — `copy/info.ts`: "HOW THE DATA WORKS" → "HOW IT WORKS". `copy/platforms.ts`: added `groupHeader`, `arenaTitle`. `copy/shared.ts`: added `totalSince2016`, `recentCycleShort`, `donationNoneOnFile`.
- **Map header bar** — branded "F*CK FASCISTS" header in `displayS` above the map, `surface1` background, `frameBlue` bottom border. Search bar repositioned below.
- **Search bar depth** — `highlightBlue` top border + `bgVoid` bottom border on container for embossed/inset look.
- **Tab bar texture** — `ImageBackground` with `bg_tile_dark_stone.png` tiled at 30% opacity behind tab bar. Icon size 22→26.
- **Business card layout rethink** — sprite LEFT at 100pt with name RIGHT (flexDirection: row). Donation hierarchy flipped: total since 2016 as primary (big, GOP red / DEM blue), recent cycle as secondary below. All-zero guard. `highlightBlue` top edge + `bgVoid` bottom edge ornamentation.

**Design refinement — Steps 6-9:**
- **MatchChooser visual upgrade** — heading color → `rewardYellow`. Row left accent: `highlightBlue` 2px border. Card depth: `highlightBlue` top border + `bgVoid` bottom border.
- **PlatformsScreen major restructure** — replaced `FlatList` with `ScrollView` for mixed arena+grouped content. New `GameArena.tsx` component (static sprite grid with cosmetic tap FX). New `PlatformGroup.tsx` component (parent company grouping with sprite bust + rolled-up total). Platforms grouped by `parentCompany` with group headers; singletons render without headers.
- **GameArena cosmetic tap interaction** — tapping any sprite triggers floating "-1" FX (fade+translate up, 600ms) + speech bubble with random reaction ("ow!", "stop!", "no!", "hey!" from `platformsCopy.spriteReactions`). Bubble fades after 1s. Per-cell animated values via `useRef(new Map<string, TapFx>())`. Reduced-motion: static bubble for 1s, no animation. Purely cosmetic — no data logged.
- **InfoScreen refinements** — transparency section now collapsible (default: collapsed) with ▲/▼ toggle. Thicker dividers between transparency points (`hero` width). InfoSection ornamentation: `highlightBlue` top border + `bgVoid` bottom border on body.

**Sprite pipeline — 1px alpha erosion:**
- Added `_erode_alpha_1px()` to both `remove_magenta.py` and `process_assets.py` — removes the anti-aliased fringe halo that survives keying + binarization. For every opaque pixel, if any of its 4 cardinal neighbors is transparent, make it transparent. Vectorized numpy implementation.
- Processing order now: flood fill → global magenta pass → alpha binarization → 1px alpha erosion.
- Reprocessed all 124 PNGs via `remove_magenta.py`, 17/18 assets via `process_assets.py`, deployed 35 non-sprite assets + 107 sprite sheets to `assets/pixel/`.

**Files created:**
- `features/Platforms/components/GameArena.tsx` — sprite grid with cosmetic tap FX
- `features/Platforms/components/PlatformGroup.tsx` — parent company group header

**Files modified:**
- `App.tsx` — launch screen gate fix (deferred until `isComplete`)
- `app/navigation/TabBar.tsx` — `ImageBackground` texture, icon size 26
- `copy/info.ts` — "HOW IT WORKS" rename
- `copy/platforms.ts` — `groupHeader`, `arenaTitle`, `spriteReactions`
- `copy/shared.ts` — `totalSince2016`, `recentCycleShort`, `donationNoneOnFile`
- `features/Info/InfoScreen.tsx` — collapsible transparency, thicker dividers
- `features/Info/components/InfoSection.tsx` — `highlightBlue` top + `bgVoid` bottom borders
- `features/Map/MapScreen.tsx` — header bar, avoid dismiss animation, search pin guard, colocated pin routing
- `features/Map/components/BusinessCard.tsx` — sprite-left layout, donation hierarchy flip, all-zero guard, depth borders
- `features/Map/components/MapSearchBar.tsx` — depth borders
- `features/Map/components/MatchChooser.tsx` — `rewardYellow` heading, row left accent, depth borders
- `features/Map/hooks/useTapSearch.ts` — exposed `setLatestTapBatch`
- `features/Platforms/PlatformsScreen.tsx` — arena + grouping restructure
- `features/Platforms/components/DayCircles.tsx` — future circle style fix
- `tools/img-gen/scripts/process_assets.py` — `_erode_alpha_1px` step 4
- `tools/img-gen/scripts/remove_magenta.py` — `_erode_alpha_1px` step 3
- 107 sprite PNGs + 35 asset PNGs reprocessed with erosion

**Build:** Xcode build clean (0 errors).

---

### Session: March 16, 2026 (follow-up 7)
**Focus:** CEO sprite system — process, deploy, utility, wire into 3 components + onboarding test fix

**Completed:**

**CEO sprite pipeline:**
- Ran `compose.py --all` → 107/115 characters composed into sprite sheets (8 skipped: `_flag`/`_redo` only files)
- Ran `remove_magenta.py` → 124 files chroma-keyed (107 characters + 17 assets)
- Ran `manifest.py` → `output/manifest.json` with 107 sprite entries (frame coordinates, tier, grid layout)
- Deployed 107 sprite PNGs + `manifest.json` to `assets/pixel/sprites/` (108 files total)

**Sprite utility (`core/sprites/`):**
- `spriteAssets.ts` — generated static `require()` map for all 107 sprites (Metro needs static string literals)
- `spriteLoader.tsx` — `nameToSpriteId()` (name→kebab-case), `pickVariant()` (deterministic djb2 hash for A/B), `getSpriteFrame()` (returns FrameInfo with offsets), `SpriteView` component (overflow-hidden container with offset Image, static frames only — no animation)

**Sprite wiring into 3 components:**
- **BusinessCard.tsx** — CEO sprite "standing" on topband via absolute-positioned `spritePerch` (top: 2, right-aligned, 72pt). Sprite straddles topband/WHO boundary. Topband switches between `TOPBAND_NEUTRAL` and `TOPBAND_DEFEATED` based on new `avoided` prop. `avoided` derived in MapScreen from `allPins.some(p => p.result === activeResult && p.avoided)`.
- **PlatformRow.tsx** — 36pt sprite between chevron and info section. State logic: 0 avoids = neutral + dimmed (0.4 opacity), 1-2 = neutral full, 3+ (`SPRITE_DEFEATED_THRESHOLD`) = defeated.
- **ScorecardView.tsx** — 44pt sprite in PersonRow, always defeated state, left of name/source text in flexRow layout.

**Onboarding test fix:**
- `features/Onboarding/__tests__/onboarding.test.ts` — updated from stale 5-screen flow references to current 3-screen flow (welcome, permissions, privacy). Removed tests for non-existent 'location' and 'notifications' steps. Fixed step progression assertion. All 7 tests passing.

**Files created:**
- `assets/pixel/sprites/` — 107 PNGs + `manifest.json`
- `core/sprites/spriteAssets.ts` — static require() map
- `core/sprites/spriteLoader.tsx` — sprite utility + SpriteView component

**Files modified:**
- `features/Map/components/BusinessCard.tsx` — sprite perch, avoided prop, topband state
- `features/Map/MapScreen.tsx` — passes `avoided` prop to BusinessCard
- `features/Platforms/components/PlatformRow.tsx` — sprite between chevron and info
- `features/Scorecard/components/ScorecardView.tsx` — sprite in PersonRow
- `features/Onboarding/__tests__/onboarding.test.ts` — updated for 3-screen flow

**Build:** tsc clean. 288 tests passing (all suites green, including previously-failing onboarding suite).

---

### Session: March 16, 2026 (follow-up 6)
**Focus:** Asset pipeline keying fix, reprocess/deploy, wire pixel art into components

**Completed:**
- **process_assets.py keying improvement** — three-step pipeline:
  1. Flood fill from corners (existing — removes border-connected magenta/white)
  2. **New global magenta pass** — keys any remaining pixel within Euclidean RGB distance 80 of #FF00FF regardless of connectedness. Catches magenta trapped inside closed shapes.
  3. Alpha binarization threshold lowered from ≥200 to ≥128
- **Reprocessed all assets** — `python3 scripts/process_assets.py --all` (17/18 processed; `bg_tile_pixel_grid` raw missing, pre-existing)
- **Redeployed all assets** — `python3 scripts/deploy_assets.py --all` → 35 files to `assets/pixel/`
- **FlagMarker.tsx wired to pixel art** — replaced coded View+Text (unicode ✓/⚑) with `<Image>` assets per component-rules §6:
  - High confidence / avoided: `marker_flag_default.png`
  - Medium confidence: `marker_warning_tile.png`
  - 32×32pt display, 96×96 source
- **BusinessCard.tsx wired to pixel art** — per component-rules §1:
  - Topband: `business_card_topband_neutral.png` (full-width × 64h, resizeMode cover)
  - Corner brackets: `corners_blue_standard_0.png` (TL) + `corners_blue_standard_1.png` (TR), positioned absolute 32×32
  - `overflow: 'hidden'` on card for clean topband clipping
  - `TOPBAND_DEFEATED` imported and ready for avoided state wiring

**Files modified:**
- `tools/img-gen/scripts/process_assets.py` — 3-step keying pipeline
- `features/Map/components/MapMarker.tsx` — Image-based markers
- `features/Map/components/BusinessCard.tsx` — topband + corner bracket assets

**35 pixel art assets deployed to `assets/pixel/`** (markers, topbands, corners, FX, scorecard stamp, onboarding, search shell, nav shell, FAQ icons, bg tiles).

---

### Session: March 16, 2026 (follow-up 5)
**Focus:** UI polish (Tasks 1-5) — visual pass, business card redesign, onboarding tightening, scorecard polish, beta/launch features

**Completed:**

**Task 1 — Visual polish pass:**
- Ionicons in TabBar (extracted to `app/navigation/TabBar.tsx`, kept App.tsx under 250 lines)
- Avoid celebration animation: 3-frame scale animation (1→1.15→1) with haptic feedback (expo-haptics), respects reduced motion
- Scorecard empty state: tappable "Map" and "Track" links that switch tabs
- Scorecard `displayM` framing, top person hero border (`rewardYellow`)
- Various token-based spacing and typography adjustments

**Task 2 — Business Card 3-beat redesign:**
- WHO/WHY/ACT three-beat layout with clear visual separation
- Medium confidence: `rewardYellow` left accent border
- `onSwitchTab` callback threaded through ScorecardScreen → ScorecardView → App.tsx

**Task 3 — Onboarding tightening (5→3 screens):**
- Combined Welcome + HowItWorks into single WelcomeScreen with three feature one-liners
- Combined Location + Notification permissions into single PermissionsScreen
- Tightened PrivacyScreen (5→4 bullets, removed fecData point)
- Deleted `HowItWorksScreen.tsx` and `PermissionScreen.tsx`
- Updated OnboardingNavigator, types, and Dev catalog

**Task 4 — Scorecard empty state + polish:**
- `copy/scorecard.ts`: split `emptyState` into tappable link parts (`emptyLine1`, `emptyMapLink`, `emptyLine2`, `emptyTrackLink`, `emptyLine3`)
- ScorecardView: tappable "Map" and "Track" links that switch tabs via `onSwitchTab`

**Task 5 — Beta mode + daily launch screen:**
- `features/Beta/useBetaMode.ts`: SecureStore-persisted triple-tap toggle (3 taps within 1.5s on version label)
- `features/Beta/BetaOverlay.tsx`: floating "BETA" badge + "BUG" screenshot button (react-native-view-shot + expo-media-library)
- `features/Launch/LaunchScreen.tsx`: daily launch screen (once per calendar day via SecureStore), rotating messages, pulsing "TAP TO START" (respects reduced motion), 3s auto-dismiss
- InfoScreen: `onVersionTap` prop wired to beta toggle
- App.tsx: beta overlay, launch screen flow, version tap handler

**Files created:**
- `app/navigation/TabBar.tsx`, `copy/beta.ts`, `copy/launch.ts`
- `features/Beta/useBetaMode.ts`, `features/Beta/BetaOverlay.tsx`
- `features/Launch/LaunchScreen.tsx`
- `features/Onboarding/screens/PermissionsScreen.tsx` (new combined)

**Files deleted:**
- `features/Onboarding/screens/HowItWorksScreen.tsx`
- `features/Onboarding/screens/PermissionScreen.tsx`

**Files modified:**
- `App.tsx`, `copy/onboard.ts`, `copy/scorecard.ts`
- `features/Map/components/AvoidButton.tsx`, `features/Map/components/BusinessCard.tsx`
- `features/Onboarding/OnboardingNavigator.tsx`, `features/Onboarding/types.ts`
- `features/Onboarding/screens/WelcomeScreen.tsx`, `features/Onboarding/screens/PrivacyScreen.tsx`
- `features/Scorecard/ScorecardScreen.tsx`, `features/Scorecard/components/ScorecardView.tsx`
- `features/Info/InfoScreen.tsx`
- `features/Dev/CatalogScreen.tsx`, `features/Dev/sections/OnboardingSections.tsx`
- Various token and minor alignment fixes across Platform, Info, Map components

---

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

> **Older sessions (March 9–11, 2026) archived to [`docs/PROGRESS_ARCHIVE.md`](./PROGRESS_ARCHIVE.md).**


---

## Test Status

| Suite | Count | Status |
|---|---|---|
| Total passing | 295 | ✅ Clean (all suites green) |
| Last tsc run | March 18, 2026 | ✅ Clean |

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
- Pixel art assets: 35 assets deployed to `assets/pixel/`, keyed with improved 3-step pipeline ✅
- FlagMarker uses pixel art marker assets (not coded View+Text) ✅
- BusinessCard has topband and corner bracket pixel art assets ✅
- CEO sprites: 107 sprites deployed, SpriteView utility, wired into BusinessCard (standing on topband), PlatformRow (state-driven), ScorecardView (defeated) ✅
- Sprite pipeline: 4-step keying (flood fill → global magenta → binarization → 1px alpha erosion) ✅
- Onboarding tightened to 3 screens (Welcome, Permissions, Privacy) ✅
- Beta testing mode with triple-tap toggle + BetaOverlay screenshot tool ✅
- Daily launch screen with rotating messages ✅
- Avoid celebration animation with haptic feedback + 3s dismiss delay ✅
- TabBar extracted with Ionicons + dark stone texture background ✅
- Map branded header bar (horizontal logo image) ✅
- GameArena: sprite grid with cosmetic tap FX (floating -1, speech bubbles) ✅
- PlatformGroup: parent company grouping with sprite bust headers ✅
- BusinessCard: sprite-left layout, flipped donation hierarchy, all-zero guard, reward overlay wired, sprite perch ON card ✅
- MatchChooser: rewardYellow heading, row accents, depth borders ✅
- InfoScreen: collapsible transparency, section ornamentation, centered tagline ✅
- Tap-to-dismiss backdrop behind BusinessCard ✅
- AvoidButton: visual depth borders, haptics debug log ✅
- GameArena: arena scene backgrounds (4 locations, random per mount), rewardYellow-bordered cells, no title label ✅
- PlatformRow: hideSprite + compact props for grouped child rows ✅
- Global highlight lines reduced from 4px to 2px (TabBar, InfoSection, PlatformGroup) ✅
- Brand logos deployed: stacked (FF_logo.png) wired into launch + onboarding + app icon + splash; horizontal (FF_logo_horizontal.png) wired into map header ✅
- GPT image pipeline tool (gpt_image.py) for generation and batch processing ✅
- Launch screen: 5s duration, 60% width logo, breathing scale animation (respects reduced motion) ✅
- Map header: increased spacing between logo bar and search bar ✅
- BusinessCard: corner brackets ON border, tighter padding, reward overlay z-index fix, 150pt sprite encroaching left ✅
- SpriteView: headOnly prop for head/face crop (38% frame height) ✅
- GameArena: full bleed, taller (minHeight 120), headOnly sprites, all-platforms roster (not just user selection) ✅
- PlatformRow: deeper grouped indent (3xl), full-row expand/collapse tap target, second-tap auto-expand ✅
- Track screen: "Edit" link underlined ✅
- TabBar: stone texture scaled 2x for device visibility ✅

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

1. **Rebuild iOS** — `expo prebuild --platform ios --clean && expo run:ios` to verify all recent changes (pixel art assets, onboarding, beta mode, launch screen) render correctly on simulator.
2. **Podfile `post_install` hook** — automate the `AIRMap.m` nil guard patch so it survives `pod install`. See Known Limitations in CLAUDE.md.
3. **iOS simulator smoke test** — launch from simulator, walk the full vertical slice (map scan → flag → business card with topband art → avoid tap with haptics → platforms → scorecard). Verify pixel art markers render on map, topband/corners render in business card, onboarding flows through 3 screens, launch screen appears once per day, beta mode toggle works.
4. **Physical device geolocation** — test on hardware, not simulator
5. **Wire remaining pixel art assets** — `marker_flag_selected.png` (selected state), `corners_yellow_reward_0-3.png` (reward corners), `bottom_nav_shell.png`, `search_shell_caps`, `scorecard_preview_stamp`, `onboarding_hero_welcome`, FX animation frames. `business_card_reward_overlay.png` ✅ wired.

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
