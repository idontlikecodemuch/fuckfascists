# Clark explainer — Remotion build

Vertical 1080×1920 @ 30 fps. One build, three cuts driven by the storyboard script:
`Master60`, `Cut30`, `Cut15`, plus `Wide60` (1920×1080 restage of the 60: phone frame
center-right at 90% height, full-body Clark on the left, box with a stepped tail).
Renders go to `marketing/video/renders/`.

```
npm install                 # once (remotion 4.0.529)
npx remotion browser ensure # once: Chrome Headless Shell (~95 MB) into node_modules/.remotion
npm run sync-script         # copies ../script.json → src/data/script.json
npm run prep:clips          # ffmpeg pre-trims captures → ../clips/*.mp4 (see ../clips/CLIPS.md)
npm run render:preview      # half-scale 60 + contact sheet (renders/preview-60-half.mp4, -sheet.jpg)
npm run render              # 60 + 30 + 15 at full size (vertical = full-bleed since Sep 29)
npm run render:60|30|15     # one cut
npm run render:wide         # Wide60 → renders/fck-explainer-60-16x9.mp4
npm run render:shorts       # one per tab → renders/fck-short-{map,track,scan,card}-9x16.mp4
```

Renders use Remotion's **Chrome Headless Shell** (`--chrome-mode headless-shell`),
codec h264, crf 18, `--color-space bt709` (standard limited-range tags). **Never
render with the installed Google Chrome** (`--browser-executable`): Chrome 132+
dropped the old headless mode, so Remotion screenshots a GPU-rasterized page and a
few frames per render come back tiled (a top-left crop repeated), blank, or
half-painted — remotion-dev/remotion#11428; Remotion's 4.0.527 fix is Lambda-only.
Measured Sep 28 on the hook: local Chrome 12 corrupt frames in 300, the shell 0 in
300, and the shell was faster. `scripts/render.sh` runs `scripts/framecheck.py` on
every output and fails on a flagged frame. Do not start Remotion Studio for
renders; `scripts/render.sh` is the path.

## Sep 30: App Store 1.1 screenshots + app preview (`scripts/appstore.sh`)

Same captures the videos were cut from (`marketing/video/captures/`, v1.1.0 build 9
code), no new recording. `scripts/appstore.sh prep` pulls seven frames into
`marketing/video/appstore/frames/` and cuts two phone-crop scorecard clips into
`marketing/video/appstore/clips/`; `tiles` renders `Tile-01…07` (`<Still>`s,
1320×2868 = 6.9" iPhone) to `marketing/appstore/1.1/screenshots-6.9/`; `preview`
renders `AppPreview` (886×1920, 30 fps, ~19.5 s, punk 30 s bed) next to them.
Design: `src/appstore/tiles.ts` holds the seven captions; `Tile.tsx` is a caption
band over a CSS bezel that bleeds off the bottom exactly at the tab bar's yellow line
(`CUT_Y` 2319 of 2622) — the Debug build's DEV tab and the SCAN (BETA) label never
show. The Scan frame is the real-phone take with a simulator 9:41 strip pasted over
its clock/recording dot. The preview is app footage only (phone-crop clips, caption
band, logo strip, no Clark, no device frame, no price) per Apple's preview rules; the
drop beat starts on the loader (94.15 s) because the frame before it shows DEV TOOLS.

## Sep 29: full-bleed is the vertical format; slam open on every cut

The creator approved the full-bleed proof and made it the format for **every vertical
cut** (60, 30, 15, the four shorts); the wide keeps the device frame. Every cut with a hook
opens on the **slam** (card drops onto the screen, flash, ring, shake, rain on impact,
caption at 1 s). `Phone60` keeps the old device-frame vertical for reference only.

- **It's about the gameplay.** Captures fill the canvas at native scale (never zoomed or
  stretched), one `align` per feature so footage never moves between beats, and Clark
  gets out of the way: `CLIPS[key].full` = `report` (file up all beat: no box, no Clark),
  `reportAt` (file comes up mid-beat: Clark glitches out, box leaves, and only the
  sentences that finish typing before it are shown), `clarkOpacity: 0` (track),
  `startFrom` (skip the head of a clip so the payoff lands sooner). Consecutive report
  beats never re-glitch (`clarkWasOn`). Drop: Clark and his pile are off; share: he's back.
- **Lines on report beats (Sep 29, later):** the creator wanted "Tap avoid" and the
  "pull the file" language back, so while the file is up the box moves to the TOP of the
  screen (`reportBox`, over the app header) and the line types there; Clark stays gone.
  Combined beats (30/15) show the first sentences in the bottom box, the rest up top.
  Scene 2 holds on the Welcome screen only (the memo, "Clark about Clark", was cut).
- **Footage size (fixed Sep 29):** full-bleed footage is sized from each clip's real
  pixels (`scripts/probe-clips.sh` → `src/data/clipDims.json`), width-fit, aspect kept.
  The first build assumed a 1206x2268 capture; phone clips are 1206x2150 crops (almost
  exactly 9:16), so everything was over-scaled 5% and the app's title bar was cropped.
  Clips are now cut at 1080 wide (were 800) so full-screen text is sharp. Run
  `prep-clips.sh`, `prep-map.sh`, then `probe-clips.sh` after any re-cut. The top box on
  report beats sits just under the title bar (`reportBox.top` 182).
- **Copy rules (creator, Sep 29):** no lead words ("Map." "Track." "Scan." "Clark.") on
  any cut, the title cards say them; "Scan a barcode" stays (common vernacular); the 60
  says "Straight from FEC.gov", the 30 says "pulled from FEC data", anything shorter than
  30 carries no FEC reference. The 30 opens on the first sentence of Clark's office take
  (scene row `c30-02-1`, source 0.90–3.55 s, a clean pause) then "No accounts. No tracking."
  over the Welcome screen.
- **Pacing:** box-less beats are paced by footage (`FULL_OVERRIDES_S` in `timing.ts`);
  the map section went from 11.7 s to 9.5 s. `SLAM_EXTRA_S` is per cut (the 30 and 15
  have no slack). VO lines type with the voice (`VO_TYPE_TAIL_S`).
- **Scene 2** plays over the app's opening screens (`scripts/prep-intro.sh` →
  `clips/intro_opening.mp4` Welcome → Clark's memo, `intro_welcome.mp4`), and "That card?"
  over the card itself (`INTRO_BG` in `clips.ts`; `clark: false` where the memo shows him).
- **Copy:** "Between Friday and Saturday, your scorecard drops." on every cut.
- **End card:** Clark 0.8× at the far left with most of his body in frame, the pile as a
  mound at his feet.

## Sep 28 evening pass (creator notes)

- **URL on screen is `FCKapp.com`** (persistent brand line, every outro): easier to spell
  than fckfascists.com; it 301s to the site. The in-app share card keeps FCKFASCISTS.COM.
- **Vertical intro** now plays the office "in context" take centre-cropped to 9:16 (same
  scene + audio as the wide) instead of the keyed green take; `probeScene` runs on every
  layout and a scene line takes the wide VO so lips match.
- **Skin grade**: the live Clark was lighter and pinker than the pixel Clark. The scene
  map's 5th column (`R,G,B@gamma`, currently `1.05,0.95,0.76@0.91`) drives
  `scripts/grade-scene.py`, which grades skin hues only (HSV window, feathered mask), so the
  office stays as shot. Re-run `prep-scene.sh` to regenerate + regrade.
- **Vertical Clark** is the full-body asset standing left, legs behind the box
  (`VERTICAL_CLARK_MODE = 'body'` in `layout.ts`; `'bust'` keeps the old bust, feathered).
  Phone column is 70% tall. The outro keeps the bust behind the pile (`CLARK_OUTRO`).
- **Dialogue type (Sep 29):** vertical/full 58 px (was 50; box min height 340), wide 48
  (was 42; box top 380, intro box top 700). Typing speed unchanged, so boxes just grow.
- **Full-bleed rule (creator): the alt is about the gameplay.** One `align` per feature so
  the footage never moves between beats; when the file comes up, Clark glitches away
  (10 frames) and the box goes with him, the capture just keeps playing.
- **Full-bleed track beats:** capture flush to the top edge (`align: 'top'`) and Clark at
  10% (`full.clarkOpacity`) so the list and arena read.
- **End card, every layout** (creator: the vertical one "isn't great"): the wide lockup
  stacked — logo, tagline, OUT NOW · $1.99, FCKapp.com · @fckfascists.app, then
  "IT'S YOUR MOVE 🤘🏽" in white — and Clark standing under it at 1.45× with the pile at
  his feet. No dialogue box on any layout (`outro.box` omitted → `Boxes` not rendered; the
  script line still times the panel and would carry VO). `outro.move` positions the line;
  `outro.clark` / `outro.pile` override the placements; the Clark clip is lifted to full
  height there (`clipBottom={L.h}`).
- **Alts (proofs first, separate compositions):** `Wide60Slam` — the card slams onto the
  screen in the first 0.5 s (scale 3.2→1, flash, ring, shake, rain on impact), caption at
  1 s; hook is 0.8 s longer. `Full60` — the 'full' layout, reworked Sep 29 per the creator:
  the capture fills the canvas at native scale (no zoom, no stretch; only the 5% aspect
  sliver is cropped, from the edge each beat can spare: `CLIPS[key].full.align`), Clark is
  the full body BEHIND the box with his head where the first proof's bust sat (face ≈ 200,
  1285) and the body running on behind the box so no cut edge shows, and **report beats**
  (`full.report`: map card, avoid, scan card) drop the box and Clark **glitches out** over
  `REPORT_GLITCH_FRAMES` (12: three bands slide apart, flicker, fade to nothing) so the
  card reads. (`clark.front` + box `padLeft` remain available for an in-front variant.)
  Each scene is staged for what the viewer needs to see.

## Shorts (one per tab) — added Sep 28

`ShortMap`, `ShortTrack`, `ShortScan`, `ShortCard` are vertical cuts of 10–15 s:
title card (tab icon + word) → two or three beats reusing the 60's clips
(`CLIPS['map-02']` … in `clips.ts`) → the outro ("Your move. 🤘🏽", brand card
reading OUT NOW · $1.99). Script cuts `map` / `track` / `scan` / `card` in
`script.json` (source: `marketing/video/script.json`; these four are not in the
storyboard artifact's db yet, so edit the file directly). Pacing: 0.3 s/word +
0.8 s, min 2.2 s; the map's zoom-and-tap beat is pinned to 4.0 s. Music is the
15 s punk edit, so keep every short at or under 15 s.

## Inputs

| What | Where |
|---|---|
| Script (lines, panels, order) | `../script.json` → `src/data/script.json` (run `npm run sync-script` after editing the storyboard) |
| Captures | `../captures/` (read only; `public/media` is a symlink to `../`) |
| Pre-trimmed clips | `../clips/` — manifest in `src/clips.ts`, table in `../clips/CLIPS.md` |
| Clark bust | `../clark/clark_bust_2x.png` (static v1) |
| Music bed | `../music/fck_chiptune_bed_64s.mp3` — ducked −14 dB under VO, 1.5 s fade-out |
| Fonts | `public/fonts/` (Bungee, IBM Plex Sans) — loaded with `@font-face` + `delayRender` |
| App pixel assets | `public/assets/` (cash sprites, starfield, logo, app icon — copied from `assets/pixel/`) |

## Dropping in VO

Put one MP3 per line at `../vo/<lineId>.mp3` (ids from `script.json`, e.g. `c60-02-1.mp3`).
`calculateMetadata` probes for them at render time: a line with VO gets
`duration = audio length + 0.4 s` and plays the file; lines without VO keep the
text formula. The music bed ducks automatically under any VO. No code change.

## Dropping in animated Clark (Veo)

Put green-screen bust clips at `../clark/veo/<lineId>.mp4`, run `npm run prep:clark`
(chroma key → `../clips/clark/<lineId>.webm`, VP9 with alpha). Any line with a keyed
clip uses it as the Clark layer; the others keep the static bust. The intro pull-back
(`kind: clark`) always uses the static bust.

## Timing

Box duration without VO: `max(min, words × perWord + base)` seconds, per cut
(`src/timing.ts`):

| Cut | perWord | base | min | Hook | Result |
|---|---|---|---|---|---|
| 60 | 0.31 | 0.8 | 2.2 | 2.0 s | 59.6 s |
| 30 | 0.28 | 0.7 | 2.2 | 2.0 s | 29.9 s |
| 15 | storyboard panel times (3.0 / 3.0 / 4.5 / 0.9+2.1) | | | 1.5 s | 15.0 s |

Outro adds 0.6 s (🤘🏽 lands) + 1.5 s hold. Typing runs at 28 chars/s. Transitions are
overlays and add no time: CRT blink (3 frames) hook→next and →outro; folder-handoff
wipe (12 frames lead + 14 frames wipe-off) whenever `feature` changes; the drop panel
does its own environmental switch (frame dissolves over 0.3 s).

## Layout (`src/layout.ts`, `src/LayoutContext.tsx`)

All staging numbers live in `LayoutContext.tsx` (`VERTICAL` and `WIDE`); components
read them through `useLayout()`, so a panel restages itself per composition.
Vertical: phone frame top-right at 78% height (797×1498, radius 64, 6 px black border, cyan
glow), Clark bust bottom-left at 0.6875× the 2× asset (654 px tall), dialogue box
in the bottom 17% with 24 px side margins. Clark's close-up in the intro is 2× that
scale, pulled back in four nearest-neighbour steps with short cross-dissolves.

## Files

```
src/Root.tsx            compositions + calculateMetadata (VO/Veo probing → timeline)
src/Explainer.tsx       assembles panels, transitions, VO, music
src/LayoutContext.tsx   VERTICAL / WIDE staging geometry
src/timing.ts           script types, formulas, buildTimeline
src/clips.ts            clip manifest (file, crop kind, shake/reveal/rain/notification times)
src/panels/*            Hook, ClarkIntro, Feature, Drop, Share, Outro
src/components/*        Starfield, Clark, DialogueBox, PhoneFrame, MoneyRain, CashPile,
                        FolderWipe, CrtBlink, Notification, Music
scripts/prep-clips.sh   ffmpeg trims (edit the table there to change in/out points)
scripts/prep-clark.sh   Veo chroma key → WebM alpha
scripts/render.sh       renders (all | wide | preview | 60 | 30 | 15 | check), frame-checks each output
scripts/framecheck.py   flags tiled / blank / half-painted frames in a render (any tile period)
scripts/probe-clips.sh  measures every clip → src/data/clipDims.json (full-bleed sizing)
scripts/prep-intro.sh   opening-screen clips for the intro's second scene
scripts/upload-site.sh  FTPS upload to fckfascists.com/<subdir>/ (creds from the main checkout's .env; default subdir video)
scripts/grade-scene.py  skin-only colour grade for a scene JPEG sequence (gains@gamma column in clark-scene-map.tsv)
```

## Animated Clark (Veo clips) — updated Sep 27

Remotion's transparent-video decode mangled the alpha WebM (only saturated
colors survived), so animated Clark is a **PNG frame sequence**:
`marketing/video/clips/clark/<lineId>/NNNN.png` + `manifest.json` (frame count).
`scripts/prep-clark.sh` builds it from `scripts/clark-veo-map.tsv`, one row per
line: source file (in `marketing/video/clark/generated video/`), key type
(`chroma` for green, `color` for flat light backgrounds), key color, similarity,
blend, a crop `w:h:x:y` in source pixels chosen so the face lands where the
static bust's face is (bust 994x952, face at 500,330; the crop is scaled to
exactly 994x952 with nearest-neighbour), video in/out seconds, and the audio
out second. The script also writes the clip's own speech to
`marketing/video/vo/<lineId>.mp3` (loudnorm -18 LUFS), which the build then
uses as that line's VO, so mouth and voice stay in sync.

Key thresholds matter: for the bright-green Veo background `chromakey
0x0F9749:0.10:0.04` keeps the gray hair and light-blue shirt; 0.22 keys them
out. Check a frame's alpha with PIL before rendering. To add a line: drop the
clip, add a TSV row, `npm run prep:clark`, `npm run render:60`.

## Sep 28 additions

- **Voice per layout.** `marketing/video/vo/<lineId>.mp3` is the default; `vo/wide/<lineId>.mp3`
  overrides it on the 16:9 comp. Box timing follows whichever file is used.
- **"In context" scene (wide intro).** A 16:9 take plays full-frame for that line
  on the wide layout (currently the office take for c60-02-1), then a CRT blink
  cuts to the counter. It is a **JPEG frame sequence**
  `marketing/video/clips/clark/scene/<lineId>/NNNN.jpg` + `manifest.json`, with
  the audio played from `vo/wide/<id>.mp3` (same window). Built by
  `scripts/prep-scene.sh` from `scripts/clark-scene-map.tsv`. (It was moved off
  `<OffthreadVideo>` when the office clip rendered 2x2-tiled; that turned out to be
  the local-Chrome GPU-raster bug above, not the video path. The sequence works,
  so it stays.)
- **Keyed Clark for the vertical** comes from the green 16:9 take via
  `scripts/clark-veo-map.tsv` (key 0x16B13D:0.10:0.04, crop 650:622:633:44).
  On the wide layout an animated bust is drawn over the static full body with the
  static head clipped away, so the two never double up.
- **Hook** caption is "WHAT THE FCK / IS THAT?", centred both ways on both layouts;
  the card is centred on the wide.
- **Branding** (wide only): `components/Brand.tsx` — horizontal logo with the URL
  centred under it in white, bottom-right under the phone column, on every panel
  except the hook, title cards and outro. The phone is 80% tall to leave room; the
  drop/share pillars match the phone rect (`FullBleed` `fullHeight` only on the hook). Logo file is served from
  `marketing/video/brand/FF_logo_horizontal.png`.
- **Title cards** replace the folder wipe (`components/TitleCard.tsx`; Ionicons
  glyph codes in `src/data/tabIcons.json`, font in `public/fonts/Ionicons.ttf`).
- **Music** is the punk bed (`musicSrc` in `src/clips.ts`); swap the filename
  there to A/B the hopeful one.
- **Map beats** come from the NYC capture via `scripts/prep-map.sh` (pinch-zoom →
  tap McDonald's → card → AVOID stamp); `c60-03-1` has a 4.0 s box override in
  `timing.ts` so the zoom-and-tap has room. `scripts/prep-clips.sh` still writes
  the old R3 versions of those clip names — run `prep-map.sh` after it.
- **Wide outro**: no dialogue box; "IT'S YOUR MOVE 🤘🏽" in white under the lockup
  (`OutroPanel.tsx`, `wide` branch); logo lower; sub line reads "OUT NOW · $1.99".
- **Frame check**: `scripts/framecheck.py` runs on every render (via
  `render.sh`) and flags tiled frames at any period, blank frames, and
  half-painted frames. The earlier 2x2-only detector passed renders that still had
  odd-period tiles at 1.07 s in the wide, which is how the Sep 28 corrupt frames
  reached the creator twice. Read its line before sending anything.
