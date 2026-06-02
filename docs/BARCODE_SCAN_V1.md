# Barcode Scan V1

Last updated: May 26, 2026 (OFF-backed products data layer)

## Why this exists

The existing app can flag a store on the map, but it cannot answer the in-aisle question: "What company is behind this product on the shelf?"

V1 closes that gap with a dedicated `SCAN BETA` tab.

## What shipped

- A new top-level `SCAN BETA` section in the app tab bar.
- Camera-based barcode scanning using `expo-camera`.
- Support limited to retail product barcodes we actually care about: `UPC-A` and `EAN-13`.
- A bundled `products.json` file that maps known producer-family prefixes to existing entity IDs before any network lookup happens.
- Open Food Facts resolution on remaining misses after local cache + producer-prefix checks.
- On-device persistent cache of barcode resolutions so repeat scans stop hitting the network.
- Reuse of the existing entity/FEC card flow once a brand is resolved.
- A checkpointed OFF bulk-data pipeline that can rebuild `products.json` without touching `entities.json` or rescanning the full archive every time cleanup rules change.
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

- No giant bundled product catalog.
- No attempt to decode a company from the first 2 digits.
- No use of `people.json` in this flow.
- No new repository yet.

## Data model decision

The correct long-term data shape is:

1. `entities.json` stays the parent-company source of truth.
2. `products.json` is a separate modular file that references existing entity IDs without mutating `entities.json`.
3. `people.json` remains unrelated to barcode scanning.
4. If curated scan data is needed, add a `brands.json` or `barcode-brands.json` file to the existing data repo, not a massive product catalog.

Why:

- GS1 documentation says the complete GTIN does not carry standalone meaning without a database lookup.
- GS1 company prefixes are variable-length, so "first 2 digits" is not a reliable product/company rule.
- Producer-family prefix hints are still useful when the real question is "who likely made this?" rather than "what exact SKU is this?"
- Open Food Facts is a better fit for live product lookup than shipping millions of items in-app.
- Open Food Facts brand strings can be matched into our existing bundled entity alias graph, which means we already have most of the "brand -> parent company" layer.
- Keeping product-producer data in a separate file lets us expand product coverage now without mixing in a larger `entities.json` / FEC / people-data cleanup at the same time.

## Current products data status

The local `products.json` file is no longer a tiny hand-curated placeholder.

Current state:

- `209` `producerResearch` entries seeded from public producer/brand research
- OFF bulk archive scanned locally and checkpointed
- `4,403,001` OFF product documents processed with `0` parse errors
- `2,000` exact barcode product rows exposed in `products`
- `5,000` exact barcode product candidates retained in the local checkpoint
- exact product rows currently represent `94` entity IDs
- `111` runtime producer rows exposed in `producers` after the May 26, 2026 product entity-coverage batch
- `115` `producerResearch` rows currently mapped to live entity IDs; `94` still need entity coverage before they can become runtime producers
- the May 25 batch activated Pernod Ricard, Lifeway Foods, Zevia, Fever-Tree Drinks, AG Barr, Tootsie Roll Industries, The Vita Coco Company, and High Liner Foods through producer-prefix matching
- the follow-up product-seed pass activated Red Bull, Perdue Farms, and Florida's Natural Growers; WW/Weight Watchers was left out because the OFF reverse audit showed heavy co-brand contamination
- the May 26 entity batch activated Seneca Foods, Universal Robina, Japan Tobacco, The Honest Company, Premium Brands, Marico, Patanjali Foods, Gruma/Maseca, Ambev, Imperial Brands, Rémy Cointreau, BIC, and Kao through producer-prefix matching
- Church & Dwight, Clorox, and Newell Brands now have live entity shells but remain research-only in the current runtime bundle pending stronger retained-prefix evidence or fresh rehydration
- Philip Morris International and Altria now resolve to distinct runtime entity IDs
- research entries now carry OFF-backed:
  - `dbObservedPrefixes`
  - `dbObservedBrands`
  - `dbConfirmedAliases`
  - `dbSuggestedAliases`

The runtime exact `products` layer is checked first:

- only exact 12- or 13-digit barcode matches qualify
- the OFF product row must resolve to exactly one producer seed
- that producer seed must resolve to a current entity ID
- duplicate runtime barcodes are not allowed

The runtime `producers` layer is the conservative fallback:

- only existing entity IDs are activated
- prefixes must survive repeated-evidence thresholds
- runtime `observedBrands` are cleaned to remove producer self-labels, legal-entity strings, obvious descriptor junk, and partner-company contamination
- product-side `entityIdExists`, `entityId`, `entityMatchType`, and `missingEntityCandidate` fields are refreshed against current `entities.json` during checkpoint rebuilds; stale product-side entity IDs are cleared when aliases no longer resolve

Deep reference:

- `docs/PRODUCTS_DATA_PIPELINE.md`
- `docs/DATA_CLEANING_AUDIT_2026-04-20.md`

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
10. On cache miss, app checks the bundled producer-prefix index for a likely parent-company hit.
11. If a producer-prefix hit is found, the existing entity/FEC flow runs locally and the UI labels it as a likely producer match.
12. On remaining miss, app calls Open Food Facts with only the fields needed for brand resolution.
13. Returned brand/owner strings are matched against bundled entity aliases.
14. On match, the existing business card flow renders with a `SCANNED PRODUCT` or `LIKELY PRODUCER` context block.
15. On miss, the user sees a dismissible barcode-specific banner instead of a generic FEC failure state.

## Why this is lightweight

- We do not ship a national product database.
- We do not ship a "top 100 products" list that will go stale fast.
- We only cache barcodes the user has actually scanned.
- We resolve many common producer-family hits from a bundled modular prefix file before hitting any network.
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
- Expo Camera docs (SDK 52): `zoom` is available, but SDK 52 does not expose manual focus distance, macro lens selection, or tap-to-focus/focus-metering controls for this barcode sheet. Current code keeps `autofocus="off"` because in Expo Camera this is the continuous-autofocus path.
- Expo Camera latest docs: newer Expo Camera versions add more native-scanner affordances, including iOS lens selection and `launchScanner()` support that routes to Apple DataScannerViewController on iOS and Google Code Scanner on Android.
- VisionCamera docs: VisionCamera is the stronger fallback if close-range UPC focus remains a blocker. It exposes tap-to-focus/focus metering, native tap-to-focus gesture support, zoom/zoom gesture control, and barcode-scanner outputs on both iOS and Android through its barcode scanner package.
- Google Code Scanner docs: Android native code scanning supports optional auto-zoom in the Play Services scanner API.
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
- `assets/data/products.json`

Barcode-specific implementation:

- `features/Scan/ScanScreen.tsx`
- `features/Map/hooks/useBarcodeSearch.ts`
- `features/Map/components/BarcodeScannerSheet.tsx`
- `features/Map/components/BarcodeLookupBanner.tsx`
- `features/Map/barcode/normalizeBarcode.ts`
- `features/Map/barcode/productIndex.ts`
- `features/Map/barcode/openFoodFacts.ts`
- `features/Map/barcode/barcodeCacheStore.ts`

Products data pipeline:

- `scripts/sync-products-from-off.py`
- `tools/off-bulk/checkpoints/`
- `docs/PRODUCTS_DATA_PIPELINE.md`

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
- The local OFF-derived producer layer is much stronger now, but runtime quality still depends on the current entity coverage in `entities.json`. The biggest remaining gains are still large UPC pools with clean brand/producer evidence.
- The current data set now has `2,000` exact product barcodes, but those rows are OFF-derived coverage, not a verified "most-shopped" ranking.
- Close-up UPC blur is a physical minimum-focus problem more than a "focal length" setting. Expo Camera SDK 52 gives us continuous autofocus and zoom, but not macro/near-focus controls. V1 should first test backing the phone up, clearer copy, and a small default zoom so the barcode still fills the reticle from farther away.
- The current repo has an existing Expo dependency mismatch: `@expo/vector-icons@15.1.1` expects a newer `expo-font` than this SDK 52 app currently pins. `expo-camera` was installed with legacy peer resolution to avoid rewriting unrelated dependencies during this feature pass.
- Full iOS simulator build verification is still partially environment-sensitive in this repo right now because the local Xcode/CoreSimulator/CocoaPods setup can fail before app code is fully evaluated. The scan flow itself is covered by TypeScript, focused Jest tests, plist validation, and the native permission fix.

## Close-focus fallback path

Keep `expo-camera` for V1 unless device testing proves the blur is still a blocker. The least invasive next test is a small default `CameraView` zoom, roughly `0.08` to `0.12`, paired with the current instruction to back up until bars are sharp. This does not change native dependencies and works with the existing scanner sheet.

If that still fails on real devices, the preferred V1.5 direction is a native scanner path rather than more copy changes:

- First option after an Expo SDK upgrade: try Expo Camera `launchScanner()` for the scan sheet. It delegates to platform-native scanner UI and may benefit from Apple/Google scanner behavior, but it gives us less custom HUD control.
- Stronger custom-UI option: migrate the barcode sheet to VisionCamera plus its barcode scanner package. That keeps our custom reticle/sheet design while adding tap-to-focus, focus metering, native zoom gestures, explicit zoom bounds, and barcode scanning on both iOS and Android.
- Android-specific native option: Google Code Scanner with auto-zoom is useful if we accept a platform scanner UI rather than our custom camera view.

Do not rehydrate product or FEC data for this issue. This is scanner optics/native-camera capability work only.

## V2 expansion: barcode FEC fallback

V1 keeps FEC fuzzy fallback disabled for barcode-derived scans. OFF product strings can be product labels, importers, distributors, co-packers, or sub-brands, and sending those directly into FEC committee search is likely to create noisy or false parent-company matches.

For V2, revisit a narrow fallback only when OFF supplies a clean owner-style identity. The promising fields are `brand_owner`, `brand_owner_imported`, and the live API `owner` field. Do not use `product_name` or raw `brands` alone as FEC fallback input. A safe version should require an unambiguous normalized owner term, avoid generic brand labels, and prefer adding reviewed entity/alias/product coverage over making live FEC guesses during scan.

## Recommended next step

Continue with the highest-value OFF producer pools that have clean brand or producer evidence. Current next candidates include Uni-President, ORION, Valsoia, Cloetta, Mayora, Thai Beverage, Royal Unibrew, Wawel, Lion Corp, Kirin, HiteJinro, Yakult, and Baladna, with extra review for brand contamination before adding aliases. Any entity/alias path can use a checkpoint rebuild, but brand-new product seeds require a fresh OFF sync so their aggregates are actually collected.

Before adding many more bundled rows, split the product payload into a runtime-only file. The app only needs exact `products` and runtime `producers`; `producerResearch` should remain available for data work and docs, but it does not need to ship with the scanner.
