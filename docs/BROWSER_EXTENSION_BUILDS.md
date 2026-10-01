# Browser extension builds

The extension shares TypeScript, popup assets, icons, and the refreshed `entities.json` / `people.bundle.json` across browsers. Browser-specific builds differ only where WebExtension implementations require it.

## Build all browsers

```bash
npm run build:ext:all
```

Outputs:

| Browser | Unpacked build | Upload package |
|---|---|---|
| Chrome | `dist/extension/` | `dist/packages/fck-fascists-chrome-1.0.1.zip` |
| Microsoft Edge | `dist/extension-edge/` | `dist/packages/fck-fascists-edge-1.0.1.zip` |
| Firefox | `dist/extension-firefox/` | `dist/packages/fck-fascists-firefox-1.0.1.zip` |
| Safari WebExtension source | `dist/extension-safari/` | `dist/packages/fck-fascists-safari-1.0.1.zip` |

Individual commands are `npm run build:ext`, `npm run build:ext:edge`, `npm run build:ext:firefox`, and `npm run build:ext:safari`.

Chrome and Edge use the Chromium Manifest V3 service worker and `chrome.*` namespace. Edge uses the same extension APIs and manifest keys as Chrome.

Firefox uses a Manifest V3 non-persistent background script, the promise-based `browser.*` namespace, and a required Gecko extension ID/privacy declaration. The minimum version is Firefox 142 because that is the first shared desktop/Android baseline accepted by Mozilla's current privacy-declaration linter.

## Safari project

Generate both macOS and iOS/iPadOS Safari extension targets:

```bash
npm run build:ext:safari-project
```

The generated Xcode project is under `dist/safari-extension/`. Override its base bundle identifier when necessary:

```bash
SAFARI_EXTENSION_BUNDLE_ID=com.example.fck.safari npm run build:ext:safari-project
```

Unsigned verification builds:

```bash
xcodebuild -project 'dist/safari-extension/FCK FASCISTS/FCK FASCISTS.xcodeproj' -scheme 'FCK FASCISTS (macOS)' -configuration Release CODE_SIGNING_ALLOWED=NO build
xcodebuild -project 'dist/safari-extension/FCK FASCISTS/FCK FASCISTS.xcodeproj' -scheme 'FCK FASCISTS (iOS)' -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
```

Signing, notarization, and App Store submission require the team's Apple Developer account. Store publication for Chrome, Edge, and Firefox likewise remains an external release step.

## Validation performed on 2026-08-21

- All four ZIPs pass archive integrity checks.
- All packaged entity and people data hashes match the runtime sources exactly.
- Firefox's package passes Mozilla lint with no extension warnings after removing dynamic `innerHTML` and declaring no data collection.
- Safari conversion reports no unsupported manifest keys.
- Safari macOS and generic iOS/iPadOS Release builds succeed with signing disabled.
- Chrome/Edge use `chrome.*`; Firefox/Safari use `browser.*`.
