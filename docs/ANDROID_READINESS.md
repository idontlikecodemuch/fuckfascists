# Android Readiness

Use this before simulator or friend-device testing.

## Current Posture

- The app runtime does **not** require `FEC_API_KEY`. `FECClient` runs in anonymous mode when no key is present.
- Android Google Maps is separate from FEC/OpenFEC. With no `GOOGLE_MAPS_ANDROID_API_KEY`, Android renders a mapless search fallback instead of mounting the native map.
- Set `GOOGLE_MAPS_ANDROID_API_KEY` only when you need native map tiles, location centering, and Google POI tap QA.
- Native maps use a dark presentation on both OSs. Android gets the Google Maps dark style only when the native map is enabled; the no-key fallback is already dark.
- There is no committed `android/` directory yet. `npm run android` / `expo prebuild --platform android` will generate it locally.
- The iOS-only `MapKitSearch` module is safe on Android: the JS wrapper returns `[]`, and Android POI matching uses `react-native-maps` `onPoiClick`.

## Local Simulator

1. Install Android Studio and an emulator image.
2. Leave `FEC_API_KEY` and `GOOGLE_MAPS_ANDROID_API_KEY` unset to test the no-API/no-map-key path.
3. Run `npm run android`.
4. Add `GOOGLE_MAPS_ANDROID_API_KEY` later only when you need to verify native Map tab rendering.
5. If native files are stale, regenerate with `npx expo prebuild --platform android --no-install`, then rerun `npm run android`.

## Friend APK

Use the internal APK profile:

```sh
eas build --platform android --profile android-preview
```

The existing `device` profile also produces an Android APK now:

```sh
eas build --platform android --profile device
```

## Smoke Checklist

- Launch and onboarding complete.
- With no `GOOGLE_MAPS_ANDROID_API_KEY`, Map tab shows the map-off fallback and does not request location.
- Manual business search works from the Map tab fallback.
- With `GOOGLE_MAPS_ANDROID_API_KEY`, location permission prompt appears and Map centers after grant.
- With `GOOGLE_MAPS_ANDROID_API_KEY`, dark map tiles render. If the map is blank, check the Google Maps Android key and package restriction for `com.fckapp.fck`.
- Search a known bundled business from the Map search bar.
- On a physical device, tapping empty map space gives a light haptic.
- With `GOOGLE_MAPS_ANDROID_API_KEY`, tap a Google Maps POI and confirm a matched business card or no-match state. Matched entities should add a stronger haptic after the tap.
- Scan tab opens camera permission and scanner sheet.
- Track tab records an avoid and updates day circles.
- Scorecard tab opens; Past scorecards link works on empty state.
- Beta screenshot button saves to Photos / media library.

## Known Differences From iOS

- Android POI taps provide name + coordinate only; iOS can also use MapKit URL/domain hints.
- No-key Android builds are search-only on the Map tab. That is intentional for early simulator/friend testing without a Google Maps SDK key.
- Android scorecard screenshot parity is post-capture: screenshot detection opens share with the clean cached card, but the original screenshot still lands in Photos.
