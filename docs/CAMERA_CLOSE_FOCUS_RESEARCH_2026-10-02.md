# Close-range barcode scanning on Pro iPhones: research report

Date: 2 October 2026. Scope: FCK Fascists Scan tab (Expo SDK 52, RN 0.76, expo-camera 16.0.18, new architecture). Research only. No repository files were changed.

Labels used below:
- **Source:** what a linked source says.
- **Code:** what I read in this repo or in `node_modules/expo-camera/ios`.
- **Inference:** my own reasoning. Treat it as unproven until tested on a device.

---

## 1. Short answer: does the candidate fix work?

**Probably yes on the phones that have the problem: iPhone 13 Pro and later Pros, plus iPhone 16 and 16 Plus and later. It does nothing on other phones, and it should do no harm there. Confidence: moderate, about 70%.**

Why I think it works:
- Apple's header and Apple DTS engineers say the same thing. A virtual device that contains the ultra-wide (`.builtInTripleCamera`, `.builtInDualWideCamera`) defaults to `.auto` switching. It falls back to the ultra-wide when the subject is closer than the wide lens can focus. The header also says that in an `AVCaptureSession` "the primary constituent device produces for all outputs", and that includes `AVCaptureMetadataOutput`.
- Apple's own WebKit team shipped the same two-part design in iOS 16.4: prefer the virtual cameras, then apply a zoom factor of 2 so the default framing is the normal wide view. A web developer then reported that close focus works on an iPhone 14 Pro Max. The Flutter `mobile_scanner` package also uses the same design.

What stops me going higher than moderate:
1. **No public source shows macro switching while `AVCaptureMetadataOutput` is attached.** One developer (Apple forum, January 2024) said that switching to the triple and dual cameras gave "no luck", but gave no details.
2. **The starting zoom may not survive expo-camera's setup order.** expo-camera sets the zoom in `updateDevice()` (Code). It then changes the session preset to `.photo` in `startSession()`. Apple's header does not say whether `videoZoomFactor` survives a preset or format change. If it is reset to 1.0, the preview opens at the 0.5x ultra-wide framing. Macro focus would still work in that case, but normal-distance scans would suffer.
3. Lens switching causes a visible perspective "jump" (Lux/Halide), and switching may add delay. No source measures either effect for barcode scanning.

All three can only be settled on a real Pro iPhone. The test is in section 8.

---

## 2. What the app does today

- **Code:** `features/Map/components/BarcodeScannerSheet.tsx` renders `<CameraView facing="back" autofocus="off" barcodeScannerSettings={{ barcodeTypes: ['upc_a','upc_e','ean13'] }} onBarcodeScanned={busy ? undefined : handler} />`. In expo-camera, `autofocus="off"` means continuous autofocus. The `zoom` prop is not set, so it stays at the default of 0.
- **Code:** `ExpoCameraUtils.device(with:preferring:)` always returns `.builtInWideAngleCamera`. `CameraView.updateZoom()` sets `videoZoomFactor = 1.0 * pow(videoMaxZoomFactor / 1.0, zoom)`, so 1.0 when zoom is 0.
- **Code: barcode path.** `BarcodeScanner.addOutputs()` adds **both** an `AVCaptureMetadataOutput` (the Apple detector, used for UPC/EAN) **and** an `AVCaptureVideoDataOutput` (32BGRA, used for ZXing PDF417/Code39/Codabar only). An `AVCapturePhotoOutput` is also attached. In picture mode the session preset is `.photo`.
- **Code: reconfiguration points that touch the session.** Several things reconfigure the session:
  - `updateDevice()` adds the input and calls `updateZoom()` inside a begin/commit block, before `startSession()`.
  - `startSession()` sets `sessionPreset = .photo` and commits.
  - When `busy` toggles, `onBarcodeScanned` becomes undefined and then defined again. That calls `setIsEnabled(false/true)`, which removes and re-adds both outputs in a new begin/commit.
  - Background and foreground events stop and start the session.
- **Code: expo-camera already ships a VisionKit path.** `CameraView.launchScanner()`, `dismissScanner()`, `onModernBarcodeScanned` and `isModernBarcodeScannerAvailable` present a `DataScannerViewController` modally (see section 7).
- **Code: upstream has not fixed this.** expo-camera `main` (58.x, September 2026) still uses `defaultBackCamera`, which is `.builtInWideAngleCamera` first, and still uses `minZoom = 1.0` in `CameraSessionManager.updateZoom()`. Since 16.1.4 (SDK 53), `selectedLens` can name a virtual device, and since 58.0.0 it accepts `deviceType` raw values ([CHANGELOG](https://github.com/expo/expo/blob/main/packages/expo-camera/CHANGELOG.md), [DeviceDiscovery.swift](https://github.com/expo/expo/blob/main/packages/expo-camera/ios/Common/DeviceDiscovery.swift)). But the zoom would still start at 1.0, which is the ultra-wide. Upgrading alone does not solve this.

---

## 3. Q1: Is this a widespread, documented problem?

**Yes.** It is a hardware change, and every app that hard-codes the wide camera has it.

### Sources

- **Apple, WWDC21 "What's new in camera capture" (session 10047).** It introduced `minimumFocusDistance` because small codes held close become blurry. It gives figures: 12 Pro wide 12 cm, 12 Pro Max wide 15 cm. https://developer.apple.com/videos/play/wwdc2021/10047/
- **Apple Developer Forums, "iPhone 14 Pro camera broke most ID verification frameworks"** (September 2022 onward, 22 replies, about 15k views). It covers ID, document and barcode apps and web `getUserMedia`. An Apple Frameworks Engineer (October 2022) pointed to the WWDC21 `minimumFocusDistance` zoom method. Reports continue into October 2023 on the iPhone 15 Pro. https://developer.apple.com/forums/thread/715568
- **Apple Developer Forums, "Scanning QR code with AVCaptureDevice issues on iPhone 14 Pro"** (December 2022). At 5–15 cm, an iPhone SE 2020 works and a 14 Pro does not. A reply says the 14 Pro wide is 200 mm versus about 150 mm before. Another reply (January 2024) says switching to the triple and dual cameras gave "no luck". https://developer.apple.com/forums/thread/721603
- **Apple Developer Forums, "Need the information of minimum focus distance…"**. Apple DTS says not to hard-code distances. Use `minimumFocusDistance` to pick a device, "or" use a virtual device such as `builtInTripleCamera`, which switches automatically. https://developer.apple.com/forums/thread/769268
- **Apple Community, "Apps that scan barcodes or IDs blurry on iPhone 14 Pro Max"** (October 2022). The stock Camera, Toast and Walmart Pay worked. MyFitnessPal, MacroFactor, Amazon and other scanners failed. https://discussions.apple.com/thread/254213411
- **Lux (Halide) reviews.** 13 Pro wide focuses to about 15 cm, ultra-wide to about 2 cm, tele 60 cm (https://www.lux.camera/iphone-13-pro-camera-app-intelligent-photography/). The 14 Pro main camera's minimum focus "changed to 20 cm" (https://www.lux.camera/iphone-14-pro-camera-review-a-small-step-a-huge-leap/).
- **GitHub, expo/expo.**
  - #19472 (October 2022): iPhone 13 Pro and 14 Pro cannot focus closer than about 16–19 cm with expo-camera and expo-barcode-scanner. Closed as stale. https://github.com/expo/expo/issues/19472
  - #25641: the iPhone 15 Pro is blurry, the iPhone 15 is fine. Closed as stale, never fixed. https://github.com/expo/expo/issues/25641
- **GitHub, react-native-vision-camera.**
  - #2246: an iPhone 15 Pro "can't focus close up". It led to PR #2392 (merged 15 January 2024), which exposes `minFocusDistance`. https://github.com/mrousavy/react-native-vision-camera/issues/2246, https://github.com/mrousavy/react-native-vision-camera/pull/2392
  - #4194 (21 September 2026, open): an **iPhone 18 Pro** cannot focus at about 10 cm, with a wide minimum focus of about 20 cm. An iPhone 12 Pro works. iOS 27, VisionCamera 5.1. https://github.com/margelo/react-native-vision-camera/issues/4194
- **Other libraries.**
  - CodeScanner (SwiftUI) #89 / #113 / #124: the iPhone 14 problem. https://github.com/twostraws/CodeScanner/issues/89
  - ZXingObjC PR #582: "won't focus close-in". https://github.com/zxingify/zxingify-objc/pull/582
  - CarBode #68. https://github.com/heart/CarBode-Barcode-Scanner-For-SwiftUI/issues/68
  - quagga2 discussion #504 (web). https://github.com/ericblade/quagga2/discussions/504
  - qr_code_scanner_plus #17 (Flutter). https://github.com/vespr-wallet/qr_code_scanner_plus/issues/17
  - fud-ai PR #421. https://github.com/apoorvdarshan/fud-ai/pull/421

### Models and iOS versions

| Model | Wide min. focus (reported) | Ultra-wide close focus (macro) | Source |
|---|---|---|---|
| 12 Pro / 12 Pro Max | 12 cm / 15 cm | No (fixed-focus UW) | WWDC21; ZXingObjC #582 says UW scanning fails on 11/12 Pro |
| 13 / 13 mini | n/a | No, UW reports no focus modes | [Forum 692049](https://developer.apple.com/forums/thread/692049) |
| 13 Pro / Pro Max | ~15 cm | Yes, ~2 cm | Lux |
| 14 Pro / Pro Max | ~20 cm | Yes | Lux; forum 721603 |
| 15 Pro / Pro Max | complaints continue | Yes | expo #25641, VC #2246, forum 715568 |
| 16 / 16 Plus | – | Yes, first non-Pro with UW autofocus and macro | Apple newsroom via search summary; not fetched directly |
| 18 Pro | ~20 cm | – | VisionCamera #4194 |

The reported figures vary. Sasquatch Studio gives 8–10 cm for the 13 Pro. So read `minimumFocusDistance` at runtime, as Apple DTS advises.

- **iOS versions:** this is not an OS bug. Reports run from iOS 16.0.x (September 2022) to iOS 27 (September 2026). The switching APIs exist from iOS 15.0. The app's deployment target is 15.1, so all of them are available.
- **One user claim to discard.** An Apple Community user speculated in October 2022 that Apple "disabled automatic camera-switching in third-party apps" in 16.0.2. Later Apple DTS statements (2024–2025) and the WebKit change in iOS 16.4 contradict this.

---

## 4. Q2: Does the candidate fix work?

### 4.1 What the sources say

- **Default behavior is `.auto` switching.**
  - Apple header (iOS 27 SDK `AVCaptureDevice.h`, read locally) on `primaryConstituentDeviceSwitchingBehavior`: "By default, this property is set to AVCapturePrimaryConstituentDeviceSwitchingBehaviorAuto for AVCaptureDevices that support it." `Auto` means "Automatically select the best camera for the current scene. In this mode there are no restrictions on when a camera switch can occur."
  - The header's discussion section: when focus or exposure would go beyond the active camera's limits, the virtual device switches to a "fallback primary constituent device" with a shorter focal length. Its example is a 40 cm tele falling back to the wide. The same mechanism lets the wide fall back to the ultra-wide.
  - Docs: https://developer.apple.com/documentation/avfoundation/avcapturedevice/primaryconstituentdeviceswitchingbehavior-swift.enum
- **All outputs get the switched camera.** Header: "For an AVCaptureSession, the primary constituent device produces for all outputs." That covers the metadata output, the video data output and the photo output alike.
- **Apple DTS says the same.**
  - Thread 772553 (2025): "If you are using a virtual device that includes the ultra-wide camera (i.e. the builtInDualWideCamera or the builtInTripleCamera), then the default behavior is that the virtual device will automatically switch-over to the ultra-wide camera". It also notes that `.builtInDualCamera` (wide + tele) has no ultra-wide and will not close-focus.
  - A developer in that thread confirmed macro works in a custom AVFoundation camera on an iPhone 15 Pro with iOS 18.3, using the triple → dual-wide → default order. https://developer.apple.com/forums/thread/772553
  - Apple Media Engineer, June 2024: "By default, Dual and Triple cameras should be set to 'Auto', so when the scene demands a camera switch (such as when you are in a macro focus situation), the virtual camera should auto switch from wide to ultrawide lens." https://developer.apple.com/forums/thread/756796
- **WebKit's identical fix.**
  - iOS 16.4 WebKit began preferring virtual cameras for `facingMode: environment`. Virtual cameras "start with videoZoomFactor set to 1", which is the ultra-wide FOV (bug 253186).
  - WebKit's fix (PR 11705) says: "For ultra wide back cameras, add a zoom factor of 2 so that a zoom of 1 corresponds to a standard FOV."
  - A quagga2 user (14 July 2023, iPhone 14 Pro Max) reported that the iOS 16.4 default "is the virtual camera that does auto-focus on iPhones that have 3 cameras".
  - Links: https://bugs.webkit.org/show_bug.cgi?id=253186, https://github.com/WebKit/WebKit/pull/11705, https://github.com/ericblade/quagga2/discussions/504
- **`mobile_scanner` (Flutter) does the same by default.** Its device order is `[.builtInTripleCamera, .builtInDualCamera, .builtInWideAngleCamera]`. It computes `standardZoomFactor` from `virtualDeviceSwitchOverVideoZoomFactors` for the first non-ultra-wide constituent and uses it as its reset zoom. https://github.com/juliansteenbakker/mobile_scanner
- **The switch-over factor matches the wide lens's framing.** Header on `virtualDeviceSwitchOverVideoZoomFactors`: these are the factors "at which one of the constituent device's field of view matches the next constituent device's full field of view". So `.first` on a triple or dual-wide device is the point where the virtual device's framing equals the wide lens's full framing. VisionCamera's v4 docs give 2 as the typical `neutralZoom` and recommend starting there.

### 4.2 Requirements and restrictions

Documented items (header):

| API | What it means here |
|---|---|
| `.auto` | The default where supported. `.unsupported` on single-lens devices. |
| `.restricted` + conditions (`videoZoomChanged`, `focusModeChanged`, `exposureModeChanged`) | Limits *fallback* switching to those events. Zoom-driven switching is always allowed. |
| `.locked` | Stops switching and raises `minAvailableVideoZoomFactor` to the active camera's switch-over. |
| `AVCaptureMovieFileOutput` | Can override the switching behavior while recording. expo-camera only adds it in video mode, so it does not apply here. |
| `fallbackPrimaryConstituentDevices` | Defaults to all `supportedFallbackPrimaryConstituentDevices`. Macro needs the ultra-wide in this list. |
| `activePrimaryConstituentDevice` | KVO-observable. `nil` until the session runs. Use it to verify switching on a device. |
| Depth data delivery | Snaps zoom to supported factors. expo-camera does not enable depth. |
| Continuous autofocus *tracking* | Runs only on the active primary. Not used by expo-camera. |
| `minimumFocusDistance` on a virtual device | "the smallest minimum focus distance of the auto-focus-capable cameras that it sources". Matters if you combine fixes (section 5). |
| New in the iOS 27 SDK | `setPrimaryConstituentDeviceSwitchingBehaviorLockedWithDevice:`. Not needed. |

**Not found:** I found no documented restriction tied to session preset, frame rate, video stabilization, or `AVCaptureMetadataOutput` versus `AVCaptureVideoDataOutput`.

### 4.3 Does it work with `AVCaptureMetadataOutput` attached?

- **Source:** the header's "primary constituent device produces for all outputs" applies. No public report confirms or refutes macro switching specifically while the metadata detector runs. The one negative report (forum 721603, January 2024) gives no details. It may have used `.builtInDualCamera`, which has no ultra-wide, or left the zoom at 1.0.
- **Inference:** likely to work. The switch happens in the capture device, before any output. expo-camera's metadata output does not set `rectOfInterest`, so the whole frame is searched. A barcode that moves in the frame after a lens switch is still found.

### 4.4 Side effects

| Effect | Status |
|---|---|
| **Perspective jump on switch** | **Source:** Lux/Halide on the 13 Pro: "when they are focusing on something nearby, switching between them creates a 'jump' in the image"; this parallax cannot be fixed in software. Users found it jarring, and Apple added a Camera-app "Auto Macro" / "Macro Control" toggle in iOS 15.1 ([9to5Mac](https://9to5mac.com/2021/10/06/iphone-13-auto-macro-ios-15-toggle-camera/)). Lux says the 14 Pro switches "much more often". |
| **Exposure or white-balance shift** | Not documented. **Inference:** some shift is likely, because the lenses use different sensors. Visible on a screen recording. |
| **Switch latency / slower first focus** | Not documented for `.auto`. The header says restricted-mode switching "waits for exposure and focus to stabilize". **Inference:** expect a short hunt, then the switch. Measure it. |
| **Low light** | **Inference:** the ultra-wide gathers less light, and exposure is one of the switching criteria. In dim light the device may stay on the wide, or produce a noisier macro image. Test in a dim room and at a fridge door. |
| **Zoom reset by expo-camera reconfiguration** | Not documented either way. The risk points are listed in section 2. Most important is the preset change in `startSession()`, which runs *after* `updateZoom()`. Test by logging. |
| **Does the system "Macro Control" toggle affect third-party apps?** | Unknown. Test with the toggle on and off. |
| **Older Pros (11 Pro, 12 Pro) and non-Pro dual-wide phones (11–15)** | **Inference:** the ultra-wide is fixed-focus, so it is probably not a supported fallback. At zoom 2.0 the wide stays primary, which is the same as today. One forum user said virtual devices on a 13/13 mini "do not support change focus mode". expo-camera checks `isFocusModeSupported`, so this would not crash, but verify that focus still works on one such phone. |

### 4.5 Problems in the candidate patch itself (Code)

1. **Order of operations.** The zoom is applied before the `.photo` preset is set. Harden it by calling `updateZoom()` again at the end of `startSession()` after the commit, or by observing `videoZoomFactor` with KVO. Then the result no longer depends on undocumented AVFoundation behavior.
2. **Device choice is unconditional.** It picks a virtual device even when its ultra-wide cannot close-focus. Low risk, but you could require `supportedFallbackPrimaryConstituentDevices` to be non-empty, and otherwise use the wide device (plus the section 5 zoom).
3. **Exact source-string patches.** If expo-camera changes, the hook prints a warning and the build ships unpatched without anyone noticing. Consider raising an error instead, or using `patch-package`.
4. **Comment numbers are wrong.** The patch comment says the wide focuses at about 10 cm. Sources say about 15 cm (13 Pro) and about 20 cm (14 Pro and later). Cosmetic.

---

## 5. Q3: Apple's recommendation (WWDC21 / AVCamBarcode)

**Source:** WWDC21 10047 transcript and code, also ported in CodeScanner with Apple's AVCamBarcode notice.
- https://developer.apple.com/videos/play/wwdc2021/10047/
- https://github.com/twostraws/CodeScanner/blob/main/Sources/CodeScanner/AVCaptureDevice%2BbestForBuiltInCamera.swift

**The method:**
1. Inputs:
   - `fieldOfView` = `device.activeFormat.videoFieldOfView`, the horizontal field of view in degrees.
   - `minimumCodeSize` = the smallest code you want to scan, in mm. Apple uses 20 mm for a QR code.
   - `previewFillPercentage` = the width of the rect of interest as a fraction of the preview width. CodeScanner's port uses `formatHeight / formatWidth`.
2. Minimum subject distance, in mm:
   `minSubjectDistance = (minimumCodeSize / previewFillPercentage) / tan(fieldOfView / 2)`
3. If `minSubjectDistance < device.minimumFocusDistance` (in mm; −1 means unknown, so skip), then
   `zoomFactor = minimumFocusDistance / minSubjectDistance`. Lock the device, set `videoZoomFactor = zoomFactor`, and unlock.
4. The intent, in Apple's words: "calculate a zoom factor large enough to guide the user to back away". The code fills the target area while the phone is at or beyond the minimum focus distance.

**Inference: the formula has no factor of 2.** The full visible width is `2·d·tan(FOV/2)`, but Apple's formula leaves out the 2. So `minSubjectDistance` is twice the true geometric value, and the zoom is half as much. At the minimum focus distance the code fills about half of `previewFillPercentage`. That is a gentler zoom. Keep Apple's formula but be aware of it.

**Inference: worked example for this app.** Assumptions: about 70° FOV, which is a guess (read it at runtime). Fill 0.72, which is the scan guide's width with 14% insets each side. A UPC-A at 100% size is 37.29 mm.

| Code | Fill | Min. subject distance | Zoom at 120 mm MFD | Zoom at 150 mm | Zoom at 200 mm (14 Pro+) |
|---|---|---|---|---|---|
| UPC-A 100% | 0.72 | 74 mm | 1.62× | 2.03× | 2.70× |
| UPC-A 80% | 0.72 | 59 mm | 2.03× | 2.54× | 3.38× |
| UPC-A 100% | 0.50 | 107 mm | 1.13× | 1.41× | 1.88× |

UPC-E is narrower, so it would need even more zoom. On a 14 Pro or later, the method alone gives a noticeably zoomed preview, and the user must scan from about 20 cm.

**Combining with the virtual device:** do not run the formula on the virtual device's own values. For a virtual device, `minimumFocusDistance` reports the ultra-wide's distance of about 20 mm, so the formula would compute "no zoom needed". At zoom 1.0 the FOV is also the ultra-wide's. If you combine the two, apply the formula only on the wide-only path (the fallback devices), or compute it from the wide constituent's values.

**Who uses this method:**
- An Apple Frameworks Engineer recommended it on forum 715568.
- CodeScanner adopted it in PR #127 (merged 23 February 2024) after its "ultra-wide by default" attempt (PR #102) broke Code 128 focus on the 12 Pro and 13 Pro. https://github.com/twostraws/CodeScanner/pull/102, https://github.com/twostraws/CodeScanner/pull/127

---

## 6. Q4: What the major libraries and apps do

| Library / app | iOS approach to close range | Source |
|---|---|---|
| **Scandit** | `CameraSettings.macroMode`: `auto` (default) / `on` / `off`. "Automatically enable macro mode depending on focus position, zoom factor, and light level." Also `Camera.isMacroModeAvailable`. Which lens or virtual device it uses is not documented. **Inference:** the `auto` wording matches Apple's constituent switching. | https://docs.scandit.com/data-capture-sdk/ios/core/api/camera-settings.html |
| **Yuka** | Uses the Scandit SDK. It rejected Apple's native and open-source scanners for low light and damaged codes. | https://www.scandit.com/resources/case-studies/yuka/ |
| **Dynamsoft** (Camera Enhancer) | Documents zoom, an `autoZoomRange`, focus APIs and "enhanced features". No macro or ultra-wide feature found. | https://www.dynamsoft.com/camera-enhancer/docs/mobile/programming/ios/primary-api/camera-enhancer.html |
| **ML Kit (iOS)** | Does not handle the camera; the app supplies frames. Guidance: an EAN-13 needs at least 190 px of width; poor focus hurts accuracy. | https://developers.google.com/ml-kit/vision/barcode-scanning/ios |
| **Google code scanner** | Android only (Play services UI), with optional auto-zoom. | https://developers.google.com/ml-kit/vision/barcode-scanning/code-scanner |
| **VisionKit `DataScannerViewController`** | Apple does not document which lens it uses or whether it falls back to the ultra-wide. Pinch-to-zoom and `zoomFactor` exist. A forum user found `minZoomFactor` returned 0 and zoom settings were ignored outside the zoom delegate callback; DTS said to file a bug. | https://developer.apple.com/forums/thread/770153 |
| **react-native-vision-camera** | v4: exposes multi-cam devices, `neutralZoom`, and `minFocusDistance` (added for the iPhone 15 Pro issue). Docs advise starting at `neutralZoom`. v5 (2026): zoom 1 = wide; code scanning via ML Kit, or native `AVCaptureMetadataOutput` (`CameraObjectOutput`). The iPhone 18 Pro issue #4194 is open. | https://visioncamera.margelo.com/docs/guides/zooming, https://margelo.com/blog/react-native-qr-barcode-scanner-visioncamera-v5 |
| **mobile_scanner** (Flutter) | Default triple → dual → wide and the switch-over "standard" zoom. 7.4.0 adds `getBestCloseRangeScanningLens()`, which returns the physical lens with the shortest `minimumFocusDistance` (usually the ultra-wide). Apple Vision on iOS. | https://github.com/juliansteenbakker/mobile_scanner |
| **Open Food Facts** (smooth-app) | Uses mobile_scanner 7.4.x (dependency bump merged 19 September 2026). I could not confirm whether it calls the close-range-lens API. | https://github.com/openfoodfacts/smooth-app/pull/7771 |
| **CodeScanner** (SwiftUI) | Wide camera plus the AVCamBarcode zoom (PR #127). | above |
| **ZXingObjC** | Open PR adding a `tryUseUltraWideCamera` flag. The author found it helps only on 13 Pro and later Pros and breaks scanning on 11/12 Pro. | https://github.com/zxingify/zxingify-objc/pull/582 |
| **WebKit / Safari `getUserMedia`** | Virtual camera plus zoom 2 (the candidate fix's design). | section 4.1 |

Summary:
- The ultra-wide switch through virtual devices: WebKit, mobile_scanner's default, and Scandit's "macro mode" (probably).
- The minimum-focus-distance zoom: Apple's sample, CodeScanner, and VisionCamera's guidance.
- Forcing the physical ultra-wide: ZXingObjC's PR and mobile_scanner's opt-in API. It breaks older Pros, whose ultra-wide is fixed-focus.

---

## 7. Q5: Is `DataScannerViewController` a realistic alternative?

**Availability (source):**
- iOS 16+ and `DataScannerViewController.isSupported`, which means "2018 and newer iPhone and iPad devices with the Apple Neural Engine" (A12+).
- `isAvailable` also requires camera permission and no Screen Time camera restriction.
- Sources: WWDC22 10025 (https://developer.apple.com/videos/play/wwdc2022/10025/) and the API docs (https://developer.apple.com/documentation/visionkit/datascannerviewcontroller).
- The app supports iOS 15.1, so iOS 15 users and A11 phones on iOS 16 (iPhone 8, 8 Plus, X) need the current `CameraView` path as a fallback.

**Bridging options:**
1. **expo-camera's built-in `CameraView.launchScanner({ barcodeTypes: ['upc_a','upc_e','ean13'] })`, plus `onModernBarcodeScanned` and `dismissScanner()`.** No native work. What the Code shows:
   - It presents a full-screen **modal** from the current view controller.
   - It maps `upc_a` to the `.ean13` symbology.
   - It does **not** check `isSupported` or `isAvailable`; `isModernBarcodeScannerAvailable` only checks iOS 16.
   - It calls `try? startScanning()`, so failures are silent.
   - It implements only `didUpdate`, not `didAdd`. **Inference:** a perfectly still code might be reported late. Test it.
   - It leaves `qualityLevel` at the default, with no `regionOfInterest` and no overlay.
2. **`react-native-data-scanner` (Margelo, Nitro Modules).** A one-shot API with `targetFormats`, `qualityLevel`, `enableHighFrameRateTracking` and `enableAutoZoom`. It needs a dev build and adds the Nitro dependency. https://github.com/mrousavy/react-native-data-scanner
3. **A custom local Expo module** (like `modules/mapkit-search`) that embeds the controller as a child view controller and uses `regionOfInterest` and `overlayContainerView`. This takes the most effort, and Fabric view lifecycle has to be handled with care.

**UI control lost (with 1 or 2):**
- The in-sheet camera frame, `CornerReticle`, `SweepLine`, `StarField` and the corner brackets. All of these are RN views over `CameraView`.
- Copy and styling of the guidance text: Apple's "Slow Down" style labels are system strings and cannot come from `copy/scan.ts`.
- Control of VoiceOver labels on the scanner surface.
- With option 3 you can keep RN overlays, but scanning and highlighting stay Apple's.

**Lens and focus:** the "handles lens choice and focus itself" premise **could not be verified**. No Apple document or third-party report I found says it switches to the ultra-wide for close codes.

**Verdict:** not a realistic replacement. It is worth a 30-minute device experiment through `CameraView.launchScanner`. If it scans close codes well on a 14 Pro or later, it could become a fallback button. Do not switch the main flow to it without that evidence.

---

## 8. Ranked recommendation

| Rank | Approach | Effort | Risk | What to test, on which devices |
|---|---|---|---|---|
| **1** | **Candidate fix, hardened**: re-apply the switch-over zoom after `startSession()` commits the `.photo` preset, or observe it with KVO; optionally pick the virtual device only when `supportedFallbackPrimaryConstituentDevices` is non-empty; fail loudly if a patch pattern is missing | Small: 2–3 more lines in the existing Podfile patch | Low to moderate. Untested publicly with the metadata output, and parallax jumps are possible | The full test in the plan below on a 13 Pro or later Pro (must have). A regression check on a non-Pro dual-wide phone (11–15) and a single-lens phone (SE, 16e or Air). An iPhone 16/16 Plus if available. |
| **2** | **Rank 1 plus Apple's minimum-focus-distance zoom on the wide-only fallback path** (devices without an ultra-wide fallback) | Small to moderate: about 25 lines of Swift in the patch, plus choosing a minimum code size and fill fraction | Low. On single-lens phones the zoom is about 1–2× and only applies where it is needed | The same as rank 1, plus check the preview framing and scan time on a non-Pro and a single-lens phone. Ship rank 1 first and add this if non-Pro users report problems. |
| 3 | **Apple's minimum-focus-distance zoom only**, keeping `.builtInWideAngleCamera` | Small | Low technical risk. UX risk on 14 Pro and later: about 2–3.4× zoom, so the user must hold the phone about 20 cm away, and the zoomed preview shakes. This is Apple's documented recommendation. | A 14 Pro or later with full-size and 80% UPC-A and a UPC-E. Time-to-scan versus today. |
| 4 | **`DataScannerViewController` through `CameraView.launchScanner`**, as an experiment or fallback | Very small to try; moderate to productize (UI, copy, iOS 15/A11 fallback, the `didAdd` gap) | Moderate: lens behavior is undocumented, the brand UI is lost, and the modal flow changes | The same distance test on a 14 Pro or later. Check UPC-A comes back as EAN-13 and UPC-E is reported correctly. |
| 5 | Upgrade expo-camera to use `selectedLens = AVCaptureDeviceTypeBuiltInTripleCamera` | Large: SDK 52 to 53+ (58 for stable IDs) | Moderate. The zoom still starts at the ultra-wide, so it still needs a patch or a computed `zoom` prop | Only worth doing as part of a planned SDK upgrade. Raise an upstream issue or PR for a switch-over default. |
| 6 | Change camera library (VisionCamera) or buy Scandit | Large, or licence cost | High churn for one bug; it touches the Android scan path too | Not recommended for this problem alone. |

### Device test plan (for ranks 1 and 2)

1. **Instrument a debug build.** After `onCameraReady`, log:
   - `deviceType`, `constituentDevices`, `virtualDeviceSwitchOverVideoZoomFactors`
   - `primaryConstituentDeviceSwitchingBehavior` (expect `.auto`), `supportedFallbackPrimaryConstituentDevices`
   - `videoZoomFactor` (expect 2.0, not 1.0), `minimumFocusDistance`
   - `metadataOutput.availableMetadataObjectTypes` (expect EAN-13 and UPC-E)

   Add KVO on `activePrimaryConstituentDevice` and `videoZoomFactor`, with timestamps.
2. **Framing.** The preview must match today's build, the 1x framing, not 0.5x.
3. **Distance sweep.** Use a full-size UPC-A, a small (about 80%) UPC-A and a UPC-E (for example, a 20 oz bottle). Test at 30, 20, 15, 10, 7, 5 and 3 cm.
   - Record time-to-scan, from sheet open or code entering the frame to `onBarcodeScanned`.
   - Record whether and when the active constituent becomes the ultra-wide.
   - Compare with the current build and with the stock Camera's code detection.
4. **Lighting.** Bright store light, a dim room, and glare at a fridge door.
5. **Lifecycle.**
   - Scan, wait for `busy` to clear, scan again: the outputs are removed and re-added, and the zoom must stay at 2.0.
   - Background and foreground the app.
   - Close and reopen the sheet.
   - Toggle Settings → Camera → Macro Control.
6. **Screen recording** at 7–15 cm, watching for perspective jumps, exposure or color shifts, and focus hunting.
7. **Devices:**
   - Must have: one 13 Pro or later Pro (the owner's phone, if Pro).
   - Should have: one non-Pro dual-wide phone (regression).
   - Nice to have: one single-lens phone (regression) and an iPhone 16/16 Plus (non-Pro macro).

---

## 9. Main sources

- Apple, WWDC21 10047 "What's new in camera capture": https://developer.apple.com/videos/play/wwdc2021/10047/
- Apple, WWDC22 10025 "Capture machine-readable codes and text with VisionKit": https://developer.apple.com/videos/play/wwdc2022/10025/
- Apple docs:
  - `PrimaryConstituentDeviceSwitchingBehavior`: https://developer.apple.com/documentation/avfoundation/avcapturedevice/primaryconstituentdeviceswitchingbehavior-swift.enum
  - Restricted conditions: https://developer.apple.com/documentation/avfoundation/avcapturedevice/primaryconstituentdevicerestrictedswitchingbehaviorconditions-swift.struct
  - `virtualDeviceSwitchOverVideoZoomFactors`: https://developer.apple.com/documentation/avfoundation/avcapturedevice/virtualdeviceswitchovervideozoomfactors
  - `DataScannerViewController`: https://developer.apple.com/documentation/visionkit/datascannerviewcontroller
- `AVCaptureDevice.h`, iOS 27 SDK (local Xcode), switching enum and `minimumFocusDistance` comments
- Apple forums: 715568, 721603, 756796, 769268, 772553, 690846, 692049, 709243, 770153
- Lux (Halide), 13 Pro and 14 Pro reviews (links above)
- WebKit bug 253186 and PR 11705 (links above)
- GitHub:
  - expo/expo #19472 and #25641, PR #36233, CHANGELOG
  - VisionCamera #2246, PR #2392, #4194
  - CodeScanner PR #102 and #127
  - ZXingObjC PR #582
  - mobile_scanner
  - fud-ai PR #421
  - quagga2 #504
- Scandit camera-settings docs and Yuka case study; Dynamsoft DCE docs; Google ML Kit docs (links above)
