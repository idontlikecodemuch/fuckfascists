# Onboarding video clips — spec for the dev lead (Oct 27, 2026)

Owner ask: replace the static HOW TO memo with short video clips from Clark. Research:
`marketing/notes/onboarding-video-research.md` (TL;DR: tutorials cost attention, so keep it short,
skippable, optional; 3–6 s loops, four beats, under 25 s of footage; hybrid build with Clark and
his words native and only app footage as video). Ships in 1.2.3 (needs expo-video, a native build).

## Shape (recommended: hybrid)
- **Welcome (screen 1):** unchanged, static.
- **Clark's window (screen 2, replaces the HOW TO memo):** one screen, four beats, NEXT advances
  (never a timer), SKIP always visible, a "1 of 4" counter, each beat = Clark bust + his line as
  native `Text` from `copy/onboard.ts` + a muted looping footage clip inside the pixel phone frame.
  Tapping the frame toggles play/pause (44 pt, labelled). Beats stay reachable later from Info.
- **Permissions (screen 3):** untouched.

## Beats
| # | Title | Clip (muted loop) | Clark line (existing copy keys) |
|---|---|---|---|
| 1 | MAP | `onb-map.mp4` 6.0 s: pins → tap → the file rises | `clarkIntro` then `howToMapBody` |
| 2 | TRACK | `onb-track.mp4` 3.8 s: AVOID tap → sprite defeated, held | `howToTrackBody` |
| 3 | SCAN | `onb-scan.mp4` 4.1 s: barcode lock → Clorox record | `howToScanBody` |
| 4 | SCORECARD | `onb-card.mp4` 4.5 s: "Shredding the data" → card → money | `howToScorecardBody` + `howToPrivacy` + `howToSignature` |

## Files (delivered; copy into `assets/video/onboarding/`)
`/Users/christophershannon/fuckfascists/marketing/video/onboarding/`
- onb-map.mp4 1.14 MB · onb-track.mp4 0.19 MB · onb-scan.mp4 1.13 MB · onb-card.mp4 1.02 MB (3.5 MB total)
- onb-{map,track,scan,card}-poster.jpg (first frame, 1080×1920, 0.12–0.29 MB each)
- Encode: 1080×1920, H.264 High, yuv420p, 30 fps, `-tune animation -crf 24`, `+faststart`, no audio track.
  Footage cropped from the 1080×1926 captures (3 px off the top) and the 1080×2220 drop capture (centre).
  Re-cut whenever bundled FEC figures change so the loops never contradict the live app.

## Copy additions for `copy/onboard.ts` (Clark; VoiceOver carries the same information as the clip)
- `clipCounter: (n, total) => \`${n} of ${total}\``
- `clipPlayLabel: "Play the clip"`, `clipPauseLabel: "Pause the clip"`
- `clipMapLabel: "Map demo: tap a business near you and the file rises with its contributions."`
- `clipTrackLabel: "Track demo: tap AVOID on a platform you skipped and the figure is defeated."`
- `clipScanLabel: "Scan demo: a barcode locks and the parent company's record appears."`
- `clipCardLabel: "Scorecard demo: the week's data is shredded into one card, ready to share."`
- `clipReplayLabel: "Replay"` (if a replay affordance is shown when paused)

## Fallbacks (all must exist)
- Reduce Motion on → poster image + the same text (the clip never autoplays; optional PLAY button).
- Clip fails to load / decode → poster + text; if the poster fails too → today's static memo.
- Low Power Mode → still fine (loops are tiny); no special case.
- VoiceOver: the frame is an accessibility element with the clip label above; NEXT/SKIP unchanged.
- Dynamic Type: the lines are native text; the frame shrinks before the text does.
- Interruption/background: player pauses; on return it resumes the loop.
- Landscape/iPad: portrait-only app; nothing extra.
- No network, no analytics (local-only counters at most, shown in beta UI).

## Option B, if the owner prefers Clark inside the video
Render the four beats from the Remotion explainer (Clark bust + dialogue box + footage baked in),
5–6 s each, ~1.5 MB each. Costs: words become pixels (no Dynamic Type, no VoiceOver without a
duplicate label), pixel edges soften under 4:2:0, and copy changes need a re-render and a release.
The research recommends against it; the pipeline can produce it in an hour if chosen.
