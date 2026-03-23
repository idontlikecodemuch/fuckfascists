# Barcode Scan V1

Last updated: March 22, 2026 (stability hardening)

## Why this exists

The existing app can flag a store on the map, but it cannot answer the in-aisle question: "What company is behind this product on the shelf?"

V1 closes that gap with a dedicated `SCAN BETA` tab.

## What shipped

- A new top-level `SCAN BETA` section in the app tab bar.
- Camera-based barcode scanning using `expo-camera`.
- Support limited to retail product barcodes we actually care about: `UPC-A` and `EAN-13`.
- One-step product resolution via Open Food Facts on cache miss.
- On-device persistent cache of barcode resolutions so repeat scans stop hitting the network.
- Reuse of the existing entity/FEC card flow once a brand is resolved.
- Follow-up UI fix: clipped the tab bar texture layer and removed its scaled repeat transform so the stone background does not bleed upward over screen content on iOS.

## Stability correction after first pass

The first pass had the right product shape, but one iOS integration detail was unsafe:

- The native iOS app target was missing `NSCameraUsageDescription`, which can cause an immediate OS-level crash when camera permission is requested.

The final implementation fixes that and simplifies the scanner surface:

- `NSCameraUsageDescription` now exists in the native iOS `Info.plist`.
- The scanner is lazy-mounted only after the user taps `OPEN SCANNER`.
- We rely on permission state + `onMountError` instead of `CameraView.isAvailableAsync()` for native runtime handling.
- If permission was previously denied, the sheet offers a Settings path instead of looping on requests.
- Android no longer requests audio permission for the barcode feature (`recordAudioAndroid: false`).

## What did not ship

- No giant bundled `product.json`.
- No attempt to decode a company from the first 2 digits.
- No use of `people.json` in this flow.
- No new repository yet.

## Data model decision

The correct long-term data shape is:

1. `entities.json` stays the parent-company source of truth.
2. `people.json` remains unrelated to barcode scanning.
3. If curated scan data is needed, add a `brands.json` or `barcode-brands.json` file to the existing data repo, not a massive product catalog.

Why:

- GS1 documentation says the complete GTIN does not carry standalone meaning without a database lookup.
- GS1 company prefixes are variable-length, so "first 2 digits" is not a reliable product/company rule.
- Open Food Facts is a better fit for live product lookup than shipping millions of items in-app.
- Open Food Facts brand strings can be matched into our existing bundled entity alias graph, which means we already have most of the "brand -> parent company" layer.

## Runtime flow

1. User opens `SCAN BETA`.
2. User taps `OPEN SCANNER`.
3. Scanner sheet mounts only at that point, which keeps camera setup and permission timing contextual.
4. If camera permission is not granted, the sheet shows an allow-camera action.
5. If permission was denied earlier, the sheet offers `Open settings`.
6. If the camera preview cannot start, the sheet shows a non-crashing unavailable state via `onMountError`.
7. Camera reads `UPC-A` or `EAN-13`.
8. Barcode is normalized to GTIN-13 for lookup/caching.
9. App checks local barcode cache in SQLite.
10. On cache miss, app calls Open Food Facts with only the fields needed for brand resolution.
11. Returned brand/owner strings are matched against bundled entity aliases.
12. On match, the existing business card flow renders with a `SCANNED PRODUCT` context block.
13. On miss, the user sees a dismissible barcode-specific banner instead of a generic FEC failure state.

## Why this is lightweight

- We do not ship a national product database.
- We do not ship a "top 100 products" list that will go stale fast.
- We only cache barcodes the user has actually scanned.
- We only ask Open Food Facts for brand-level fields.
- We only hit the existing FEC flow after a brand is confidently mapped into the bundled entity list.
- We do not request microphone/audio permission for this feature.

## UX decision

This is a top-level destination, not a hidden button inside Map.

The current navigation label is intentionally `SCAN BETA` so we can test the feature in live builds without committing it as permanent V1 navigation yet.

Reasoning:

- Product scanning is a distinct user job from "scan nearby businesses."
- Barcode scan is a camera-first flow and deserves its own permission prompt timing.
- Bottom navigation is appropriate for core peer destinations, and this is now one of them.
- The scanner opens only after user intent, which keeps camera permission contextual.
- The camera surface unmounts when dismissed, which follows Expo guidance to avoid leaving previews active off-screen.

## Source notes checked during planning and hardening

- Expo Camera docs (SDK 52): `CameraView`, `useCameraPermissions`, `barcodeScannerSettings`, `onBarcodeScanned`, `onMountError`, config plugin camera usage strings, and the note that only one camera preview should be active at a time.
- Expo Camera docs (SDK 52): `CameraView.isAvailableAsync()` is documented as web-only, so it is not the right native availability gate here.
- GS1 support/docs: GTIN/company-prefix structure is variable-length; the code is not meaningfully self-decoding without a database.
- Open Food Facts API docs: product lookup by barcode is a normal public flow.
- Google ML Kit barcode guidance: narrow supported formats and use a clear framing target for faster real-time scanning.
- Apple VisionKit/Data Scanner guidance: camera features need a clear privacy usage description and unsupported states should be hidden or handled gracefully instead of failing at runtime.

## Files added/changed for V1

Core app changes:

- `app/navigation/TabBar.tsx`
- `app/gates/AppShell.tsx`
- `app.json`
- `ios/FckFascists/Info.plist`
- `package.json`
- `package-lock.json`

Barcode-specific implementation:

- `features/Scan/ScanScreen.tsx`
- `features/Map/hooks/useBarcodeSearch.ts`
- `features/Map/components/BarcodeScannerSheet.tsx`
- `features/Map/components/BarcodeLookupBanner.tsx`
- `features/Map/barcode/normalizeBarcode.ts`
- `features/Map/barcode/openFoodFacts.ts`
- `features/Map/barcode/barcodeCacheStore.ts`

Shared UI/result plumbing:

- `features/Map/types.ts`
- `features/Map/hooks/useEntityScan.ts`
- `features/Map/utils/buildScanResult.ts`
- `features/Map/components/BusinessCard.tsx`
- `copy/map.ts`
- `copy/scan.ts`
- `config/constants.ts`

Tests:

- `features/Map/__tests__/barcodeHelpers.test.ts`
- `features/Map/__tests__/buildScanResult.test.ts`

## Rollback plan

If this feature needs to be reverted quickly:

1. Remove the `scan` tab from `app/navigation/TabBar.tsx`.
2. Remove the `ScanScreen` case from `app/gates/AppShell.tsx`.
3. Remove `expo-camera` from `package.json` and `package-lock.json`.
4. Remove the `expo-camera` plugin block from `app.json`.
5. Delete:
   - `features/Scan/`
   - `features/Map/hooks/useBarcodeSearch.ts`
   - `features/Map/components/BarcodeScannerSheet.tsx`
   - `features/Map/components/BarcodeLookupBanner.tsx`
   - `features/Map/barcode/`
   - `copy/scan.ts`
6. Optionally remove the barcode context block from `BusinessCard.tsx`.

Notes:

- The local SQLite barcode cache table is created lazily. Leaving it behind does not break the app after rollback; the reverted app will simply ignore it.
- No backend migration is required because this feature stores data only on-device.

## Known risks

- Open Food Facts coverage is good for grocery scanning, but not universal.
- Brand strings returned by a product database will never perfectly align with parent-company aliases without continued curation.
- The current repo has an existing Expo dependency mismatch: `@expo/vector-icons@15.1.1` expects a newer `expo-font` than this SDK 52 app currently pins. `expo-camera` was installed with legacy peer resolution to avoid rewriting unrelated dependencies during this feature pass.
- Full iOS simulator build verification is still partially environment-sensitive in this repo right now because the local Xcode/CoreSimulator/CocoaPods setup can fail before app code is fully evaluated. The scan flow itself is covered by TypeScript, focused Jest tests, plist validation, and the native permission fix.

## Recommended next step

If scan coverage needs a real boost without bloating the app, add a curated `brands.json` file to the existing `fckfascists-data` repo and fetch/bundle it the same way we already handle `entities.json`.
