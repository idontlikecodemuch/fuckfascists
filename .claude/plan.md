# Screenshot Harness — Implementation Plan

## Architecture Overview

The harness renders each screen state as a standalone full-screen view using fixture data, captures it via the existing `captureScreen()` system, then advances to the next state. This avoids needing real GPS, real POI interactions, or navigating through gates.

**Key principle:** The harness does NOT navigate the live app. It renders mock screen compositions in sequence, each using fixture data and controlled props. This ensures deterministic, repeatable captures.

---

## Files to Create (7 new files)

### 1. `features/Dev/harnessFixtures.ts` (~200 lines)
Complete fixture data for every state. Extends `catalogMocks.ts` patterns with additional data:
- `harnessEntities`: Entity[] — walmart, amazon, meta for parent/child attribution
- `harnessHighConfResult` / `harnessMedConfResult` / `harnessAvoidedResult` — ScanResult variants
- `harnessChooserResults` — 3-result ScanResult[] for MatchChooser
- `harnessBarcodeScanResult` — ScanResult with `context: { kind: 'barcode' }`
- `harnessPlatformItems` — PlatformItem[] with realistic weekly avoids
- `harnessScorecardPopulated` / `harnessScorecardEmpty` — ScorecardViewData
- `harnessInfoContent` — about, transparency, faq, links
- Mock `TrackContextValue` factory function: `buildMockTrackContext(overrides)` — returns a full context value with controlled focus, expand, and todayActions state

### 2. `features/Dev/harnessSteps.ts` (~80 lines)
Step definitions array. Each step:
```typescript
interface HarnessStep {
  id: string;       // e.g. 'launch_default'
  surface: string;  // e.g. 'launch'
  state: string;    // e.g. 'default'
  label: string;    // human-readable for progress display
}
```
Exports `HARNESS_STEPS: HarnessStep[]` — all ~28 states from the spec.
Exports `filenameForStep(step, mode)` — returns `ff_launch_default.png` or `ff_launch_default_a11y.png`.

### 3. `features/Dev/harnessRenderers.ts` (~240 lines)
A function `renderHarnessStep(stepId, allEntities)` that returns a React element for each step. This is the core rendering logic — a big switch on `stepId` that mounts the appropriate components with fixture data and controlled props.

For each step group:
- **LAUNCH**: Renders `<LaunchScreen onDismiss={noop} />` — auto-dismiss disabled by wrapping
- **ONBOARDING**: Renders `<WelcomeScreen>`, `<PrivacyScreen>`, `<PermissionsScreen>` directly with noop callbacks. For "both granted" state: renders PermissionsScreen inside a wrapper that pre-sets `locGranted` and `notifGranted` (via a thin wrapper component `PermissionsScreenGranted`)
- **MAP**: Renders `<MapScreen>`-like compositions using the actual sub-components:
  - `map_default`: MapView placeholder + header bar + search bar + controls
  - `map_card_pre_avoid`: Above + backdrop + `<BusinessCard result={harnessHighConfResult} avoided={false} />`
  - `map_card_post_avoid`: Same but `avoided={true}`
  - `map_match_chooser`: `<MatchChooser results={harnessChooserResults} />`
  - `map_no_match_toast`: Map default + `<NoMatchToast />`
- **TRACK**: Renders `<TrackProvider>` wrapping with mock adapter, or renders using `TrackCtx.Provider` directly with mock context:
  - `track_collapsed`: Full track screen with all rows collapsed, no focus
  - `track_expanded`: One row expanded with day circles visible
  - `track_avoided`: Row with today avoided (green checkmarks in day circles)
  - `track_arena_neutral`: Arena with grid mode (no focus)
  - `track_arena_portrait`: Arena with single figure focused
  - `track_setup`: `<PlatformSetupScreen>` with partial selection
- **SCORECARD**: `<ScorecardView data={...} />` with populated/empty data
- **INFO**: `<InfoScreen>` — for expanded states, the harness renders InfoScreen subcomponents directly with transparency/FAQ pre-opened
- **SCAN**: Renders ScanScreen-like compositions:
  - `scan_default`: Hero + CTA button
  - `scan_scanner_open`: BarcodeScannerSheet overlay (mocked permission state)
  - `scan_result_pre_avoid`: Hero + BusinessCard (barcode context)
  - `scan_result_post_avoid`: Same, avoided
  - `scan_no_match`: Hero + BarcodeLookupBanner
- **TAB BAR**: Full map screen capture (tab bar always visible)

### 4. `features/Dev/ScreenshotHarness.tsx` (~180 lines)
The main harness component. Renders as a full-screen modal overlay in AppShell.

**UI:**
- Mode selector: three `Pressable` buttons (FULL SWEEP / A11Y PASS / NOTIFICATION)
- Progress bar + step counter during capture
- Current step label
- Cancel button

**Behavior:**
- On mode select → iterates `HARNESS_STEPS` (or notification-only step)
- For each step: render via `renderHarnessStep()`, wait 400ms settle, `captureScreen()`, wait 400ms
- For Dynamic Type mode: wraps content in a font-scaling context override
- For notification mode: schedules nudge notification for 2s from now, waits 3s, captures the NudgeBanner forced visible
- Shows completion alert with count

**Dynamic Type approach:** Uses `<Text>` default props override in `__DEV__` to multiply all font sizes. Wraps the rendered step in a provider that sets `PixelRatio` simulation via a scaling transform on the root view + `maxFontSizeMultiplier` removal. Most practical: uses `AccessibilityInfo.announceForAccessibility` + forces `allowFontScaling={true}` + applies a `fontScale` multiplier context that components read.

Actually, simplest viable approach: The Dynamic Type pass wraps each rendered screen in a `<View style={{ transform: [{ scale: 0.7 }] }}>` — no, that scales everything including non-text.

**Revised Dynamic Type approach:** Provide a `HarnessFontScaleContext` that the harness sets to `3.5` (xxxLarge). Patch `Text.render` in __DEV__ during the a11y pass to respect this scale. Since this is dev-only and temporary (only during capture), it's acceptable. OR: simply check `PixelRatio.getFontScale()` and if not at max, show a pre-flight alert telling the user to set Dynamic Type to largest in Settings, then run the sweep. The screenshots auto-label with the font scale value. This is the honest approach that tests REAL Dynamic Type behavior.

### 5. `features/Dev/HarnessFontScale.tsx` (~40 lines)
A dev-only context + wrapper that intercepts all `Text` components' styles and multiplies `fontSize` by a scale factor. Uses React's `createContext` + a wrapping component that clones children with scaled styles. Only used during Dynamic Type harness pass.

### 6. `copy/harness.ts` (~40 lines)
Copy strings for the harness UI:
- Mode labels, progress text, completion messages, pre-flight alerts, step labels

### 7. `tools/copy-preview/screenshots/manifest.json`
Static JSON mapping every step to its expected filename:
```json
{
  "steps": [
    { "id": "launch_default", "surface": "launch", "state": "default", "filename": "ff_launch_default.png", "a11yFilename": "ff_launch_default_a11y.png" },
    ...
  ]
}
```

---

## Files to Modify (3 files)

### 1. `features/Beta/BetaOverlay.tsx`
Add a "SHOTS" button above the existing RESET button. On press, calls `onOpenHarness()` callback prop.

New prop: `onOpenHarness?: () => void`

### 2. `app/gates/AppShell.tsx`
- Add `harnessOpen` state
- Pass `onOpenHarness={() => setHarnessOpen(true)}` to `BetaOverlay`
- Conditionally render `<ScreenshotHarness>` as a full-screen modal when `harnessOpen && __DEV__`
- Conditional import (same pattern as CatalogScreen)

### 3. `config/constants.ts`
Add:
```typescript
export const HARNESS_STEP_SETTLE_MS = 400;
export const HARNESS_CAPTURE_DELAY_MS = 400;
export const HARNESS_NOTIFICATION_DELAY_MS = 3000;
export const HARNESS_FONT_SCALE = 3.5; // xxxLarge equivalent
```

---

## State Rendering Strategy

The harness does NOT modify production screen components. Instead:
- Gate screens (Launch, Onboarding) are rendered directly as standalone components
- Map states are composed by rendering the actual sub-components (BusinessCard, MatchChooser, etc.) on top of a static map placeholder
- Track states use `TrackCtx.Provider` with mock context values to control focus/expand/avoid state without needing a real StorageAdapter
- Scorecard/Info/Scan states use the actual screen components with controlled props

For the TrackScreen specifically: instead of trying to puppet the real TrackProvider + StorageAdapter, the harness renders `TrackHeader` + `GameArena` + `TrackList` wrapped in a `TrackCtx.Provider` with a fully mocked context value. This gives complete control over focus state, expanded rows, and avoid counts without any database interaction.

---

## Notification Preview Mode

1. Cancel any existing Thursday nudge: `Notifications.cancelScheduledNotificationAsync('platform-nudge-thursday')`
2. Schedule immediate notification: `Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null })` (null trigger = fire immediately)
3. Force-render `NudgeBanner` by wrapping it with `isNudgeDay=true` override (thin wrapper that patches `new Date().getDay()`)
4. Wait `HARNESS_NOTIFICATION_DELAY_MS`
5. Capture screen showing the in-app NudgeBanner
6. Alert user that the OS notification is in the shade for manual capture

---

## Production Safety

- `ScreenshotHarness` is conditionally imported via `__DEV__ ? require(...)` pattern (same as CatalogScreen)
- "SHOTS" button in BetaOverlay only renders when `onOpenHarness` prop is provided (which only happens when `__DEV__`)
- All harness files live in `features/Dev/` — same quarantine as CatalogScreen
- No production screen components are modified
- `copy/harness.ts` is only imported by dev files

---

## File Size Compliance

All new files target ≤250 lines:
- `harnessFixtures.ts`: ~200 lines (fixture data)
- `harnessSteps.ts`: ~80 lines (step definitions)
- `harnessRenderers.ts`: ~240 lines (render functions — may need split if over 250)
- `ScreenshotHarness.tsx`: ~180 lines (UI + automation loop)
- `HarnessFontScale.tsx`: ~40 lines (font scale context)
- `copy/harness.ts`: ~40 lines (copy strings)

If `harnessRenderers.ts` exceeds 250, split into `harnessRenderers/map.tsx`, `harnessRenderers/track.tsx`, etc.
