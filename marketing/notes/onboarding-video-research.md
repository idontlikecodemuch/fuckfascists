# Onboarding video — research and recommendation (Oct 27, 2026)

Scope: replace the static HOW TO: FCK memo with bundled Clark clips. No code changed. Facts: Expo SDK 52 / RN 0.76 new arch, portrait-only, iOS 15.1+, no video module installed; existing Remotion clips are H.264, 1080 wide, 30 fps, silent, 0.3–1.3 MB.

## TL;DR

- Tutorials are a cost, not a win: NN/g found they gave no task-success gain and made apps feel *harder*; Apple's HIG wants onboarding "fast, fun, and optional". So: short, skippable anywhere, never the only way to learn.
- Length: clips 3–6 s looping, four beats max, under 25 s of footage, onboarding under 60 s. Sub-1-minute videos get the highest watch-through (Wistia 2025: ~50%, ~82% for how-to); tour completion collapses past 4–5 steps (Chameleon 2025: 72% at 3 steps, 16% at 7+).
- Build a hybrid: Clark (sprite) and his lines (native `Text` from `copy/onboard.ts`) stay React Native; only app footage is video, muted, inside the pixel phone frame. Dynamic Type, VoiceOver, Reduce Motion and crispness come free; a video failure degrades to today's memo.
- Ship with `expo-video` (stable in SDK 52; `expo-av` Video deprecated there), H.264/yuv420p, silent, ≤1 MB per clip, bundled via `require()`: ~3–4 MB total against a 200 MB iOS cellular threshold.
- Permissions stay a separate last screen, primed in plain language, with Skip. No App Review rule blocks onboarding video; bundling keeps 4.2.3(ii) and the no-backend principle untouched.

## Recommendation for FCK

**Screen 1 — Welcome: keep static.** Logo, tagline, PRESS START. HIG separates launch from onboarding and warns against splash-like delays; the daily Launch screen is already the attract mode.

**Screen 2 — "Clark's window": four tap-through beats on one screen.** Models: Pokémon GO's Willow (one bubble at a time, tap at your pace) and Clash Royale's "five short tutorials", Apple's own example.

| Beat | Footage (existing clip, muted loop, 3–6 s) | Clark line (existing copy) |
|---|---|---|
| 1 MAP | `60_03_map_pins` → `60_04_map_card`: zoom, tap, file rises | `clarkIntro` + `howToMapBody` |
| 2 TRACK | `60_08_track_defeat`: AVOID, sprite defeated | `howToTrackBody` |
| 3 SCAN | `scan_clorox`: barcode lock → record | `howToScanBody` |
| 4 SCORECARD | `60_12_drop` trimmed ≤6 s: "Shredding the data" → card | `howToScorecardBody` + `howToPrivacy` + signature |

Rules: NEXT advances beats (user-initiated, no timers); SKIP always visible; a "1/4" counter in the dialogue box; loop = replay; same beats reachable from Info (HIG: skipped tutorials must stay "easy to find"; Apple's games page: let players replay). Re-capture footage when bundled FEC figures change (Principle #6).

**Screen 3 — permissions, unchanged.** HIG permits permission requests inside onboarding when the reason is obvious; the "why" + "never sent anywhere" line is the priming opt-in benchmarks support. Keep Skip. HIG nit: pre-alert buttons should say "Continue", not "Allow".

**Sound/captions/frame.** No audio track (sidesteps WCAG 1.4.2 and HIG "avoid mixing audio"; words are native text, so no burned-in captions). Muted autoplay is fine, but WCAG 2.2.2 wants a pause control for auto-starting motion over 5 s: tapping the frame toggles play/pause (44 pt, labelled). Footage sits inside the pixel device frame, not full-bleed: HIG says "always display video content at its original aspect ratio", 9:16 clips would be cover-cropped on 19.5:9 phones, and the frame reads as footage, not live UI.

## Fallbacks checklist

- **Reduce Motion** (`AccessibilityInfo.isReduceMotionEnabled` + `reduceMotionChanged`; Android "animation off" maps to it): poster PNG instead of `VideoView`, same text, optional PLAY button. Read iOS "Auto-Play Video Previews" (`UIAccessibility.isVideoAutoplayEnabled`, iOS 13+) via a tiny Expo module later.
- **Low Power Mode**: Apple's list (brightness, Auto-Lock, background refresh, auto-downloads) doesn't touch in-app playback; don't gate on it. Optional: `expo-battery` `useLowPowerMode` → play once.
- **Decode failure / missing asset**: on `statusChange` `error`, or no `readyToPlay` within ~2 s, show the poster, which always sits under the `VideoView` (expo #39962: view occasionally stays black). NEXT/SKIP never wait on video.
- **Slow first launch**: assets are in the binary; one active player plus one preloaded (`useVideoPlayer(null)` then `replace()`; a detached player still buffers), never four views.
- **VoiceOver/TalkBack**: footage is decorative (`accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`); Clark's text is the content; announce beat changes; play/pause labelled with state.
- **Dynamic Type**: dialogue box grows, frame shrinks to a minimum, body scrolls (OnboardingSlide already scrolls); test at AX5.
- **Landscape/iPad**: portrait-locked; iPad compatibility mode; frame scales by width with a max, `contentFit="contain"`.
- **Interruptions / background**: AVPlayer pauses on calls; resume on `AppState` active unless reduced motion; `staysActiveInBackground` false.
- **Old devices / memory**: clips ≤1 MB; `useVideoPlayer` auto-releases (`createVideoPlayer` needs `release()`); use expo-video ≥2.0.6 (fixes AVPlayer dealloc and observer leaks).
- **Text without video**: every line already lives in `copy/onboard.ts`; Info hosts the replay.

## Implementation notes (Expo SDK 52 / RN 0.76)

- **Module**: `npx expo install expo-video` (2.0.x; plugin `supportsBackgroundPlayback: false`, `supportsPictureInPicture: false`), `pod install`, commit `Podfile.lock` + `project.pbxproj`.
- **Format**: H.264 High, `yuv420p`, `-tune animation -crf 23..28`, 30 fps (24 judders real-time scrolls), `+faststart`, `-an`, nearest-neighbour scaling, pixel art at integer scale before encode so 4:2:0 chroma doesn't smear 1-px edges. Keep 1080 px wide (frame ≈1000 px on 3× screens). HEVC (A9+ hardware; CDD MUST on Android) would save <2 MB; skip it.
- **Size**: 4 × 5 s ≈ 2–3 MB at today's bitrates; budget ≤1 MB per clip, ≤5 MB total plus posters. Video isn't thinned, so it counts in every variant; iOS asks for Wi-Fi above 200 MB.
- **Bundling**: `require('assets/video/onboarding/map.mp4')`; Metro's default `assetExts` include mp4/m4v/mov/webm and Expo embeds required assets in production builds. Posters via `ffmpeg -frames:v 1`.
- **Player**: setup `player.loop = true; player.muted = true; if (!reduceMotion) player.play()`. `VideoView` with `nativeControls={false}`, `contentFit="contain"`, `allowsFullscreen={false}`.
- **Pitfalls**: don't subscribe to `mutedChange` on iOS 2.0.x (reported feedback loop); Android uses SurfaceView (no `surfaceType` in 2.0.x), so the video can't be faded or corner-clipped — draw the pixel frame as a sibling overlay; one `VideoView` per player on Android; the TextureView opacity bug (expo #51672) is post-upgrade only.
- **Sprite/Lottie instead?** Lottie is vector and pins RN versions (7.3.x below RN 0.84); it buys nothing for raster pixel art. Use the existing `SpriteView` for Clark (3-frame talk + blink, a few KB, crisp), native `Text` for words, video only for app footage, which is cheap to re-capture.

## Measurement without analytics

Local-only counters (completed / skipped at beat N / replayed from Info) in SQLite, visible only in the dev catalog or beta overlay, never transmitted. TestFlight feedback for qualitative reads. App Store Connect metrics cover only opted-in users (sessions, crashes, no funnel); watch crashes on the first video build.

## Examples

| App | What they do | Lesson |
|---|---|---|
| Pokémon GO (Willow) | Guide speaks one bubble at a time, tap to advance | User-paced beats |
| Clash Royale | Five short in-play tutorials (Apple's example) | ≤5 beats, one idea each |
| Duolingo (Duo) | Mascot, delayed sign-up, progress bars; 25–38 interactive screens | Length only works when interactive |
| Finch (Birb) | Hatch/name the bird, progress bar, "No thanks" on every upsell | Opt-outs everywhere |
| Arc (iOS) | Employee intro video on first run | Memorable but not skimmable |
| Headspace | 38% drop-off → exitable intros, video swapped for GIFs; +10% week-2 | Loops beat sit-through video |
| Nike Run Club (bad) | Account creation first, no feature intro | Don't front-load asks |
| Forced tutorials (bad) | "Unskippable tutorial" recurs in 1-star review analyses | Always skippable |

## Sources

- Apple: [HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy), [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [HIG Playing video](https://developer.apple.com/design/human-interface-guidelines/playing-video), [Onboarding for games](https://developer.apple.com/app-store/onboarding-for-games/), [App Review](https://developer.apple.com/app-store/review/guidelines/), [isVideoAutoplayEnabled](https://developer.apple.com/documentation/UIKit/UIAccessibility/isVideoAutoplayEnabled), [Low Power Mode](https://support.apple.com/en-us/101604), [200 MB limit](https://www.idownloadblog.com/2019/05/31/app-store-cellular-download-limit-200-mb/)
- Research/vendor: [NN/g tutorials](https://www.nngroup.com/articles/mobile-tutorials/), [Chameleon 2025](https://www.chameleon.io/blog/mastering-product-tours), [Wistia](https://wistia.com/blog/optimal-video-length), [Appcues](https://www.appcues.com/blog/mobile-app-onboarding), [Pushwoosh/Airship opt-in](https://www.pushwoosh.com/blog/ios-push-notifications/), [WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- Platform: [SDK 52 changelog](https://expo.dev/changelog/2024-11-12-sdk-52), [expo-video](https://docs.expo.dev/versions/latest/sdk/video/), [expo-video changelog](https://github.com/expo/expo/blob/sdk-52/packages/expo-video/CHANGELOG.md), [expo #39962](https://github.com/expo/expo/issues/39962), [expo #51672](https://github.com/expo/expo/issues/51672), [Expo assets](https://docs.expo.dev/develop/user-interface/assets/), [Metro assetExts](https://github.com/facebook/metro/blob/main/packages/metro-config/src/defaults/defaults.js), [expo-battery](https://docs.expo.dev/versions/latest/sdk/battery/), [RN AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo), [lottie-react-native](https://github.com/lottie-react-native/lottie-react-native), [Android CDD](https://source.android.com/docs/compatibility/15/android-15-cdd), [HEVC on A9+](https://blog.addpipe.com/heif-hevc-ios-11-quick-overview/), [ASC opt-in](https://developer.apple.com/documentation/analytics-reports/app-store-opt-in.md)
- Examples: [Pokémon GO](https://www.gamedeveloper.com/business/what-pokemon-go-can-teach-about-ux-design), [Clash Royale](https://medium.com/@Matthewwspencerr/clash-royale-creating-a-sticky-first-time-user-experience-113e17b18f36), [Duolingo](https://goodux.appcues.com/blog/duolingo-user-onboarding), [Finch](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/), [Arc](https://medium.com/@bastiaanrudolf/my-first-thoughts-and-experiences-with-the-arc-browser-97e3a3a3f6e1), [Headspace](https://raw.studio/blog/how-headspace-designs-for-mindfulness/), [Nike Run Club](https://screensdesign.com/showcase/nike-run-club-running-coach), [Unstar reviews](https://unstar.app/blog/app-onboarding-mistakes-users-hate-2026)
