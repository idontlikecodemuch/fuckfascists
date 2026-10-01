# iOS 1.1.0 (9) release QA — September 1, 2026

## Result

The current production behavior passed simulator QA. The installed simulator bundle reported `1.1.0 (9)`. All 49 Jest suites (507 tests) passed and TypeScript reported no errors.

## Native scorecard path

- Forced a just-completed drop through the real `ScorecardScreen` using isolated QA storage.
- Generated and found `Those-I-FCKd-August-29-26.jpg` in the native card archive.
- Presented the generated card and captured the presentation screen.
- Confirmed the scored week's raw entity and platform events were purged after capture.
- Confirmed the saved card is a complete 1080×1920 JPEG with the expected artwork.

The machine-readable results are in `scorecard-report.json`. Its `scheduledWithRoutingType: false` value reflects missing simulator notification authorization, not a scheduling exception (`error` is `null`). The notification's exact drop date, stable identifier, routing type, and scoped cancellation passed the deterministic notification tests.

## Visual states

- `../../screenshots/release-qa/ff_scorecard_populated.png`
- `../../screenshots/release-qa/ff_scorecard_pending.png`
- `../../screenshots/release-qa/ff_scorecard_empty.png`
- `../../screenshots/release-qa/scorecard-presentation-native.png`
- `../../screenshots/release-qa/scorecard-card-native.jpg`
- `../../screenshots/upc-toasts/ff_scan_toast_try_again.png`
- `../../screenshots/upc-toasts/ff_scan_toast_upc_not_file.png`
- `../../screenshots/upc-toasts/ff_scan_toast_product_found.png`
- `../../screenshots/upc-toasts/ff_scan_toast_lookup_paused.png`

## Remaining manual check

On TestFlight or a notification-authorized simulator/device, allow notifications, background the app, and confirm that tapping the scorecard-drop notification opens the Scorecard tab. This is the only release path that could not be driven end-to-end by the simulator command line.
