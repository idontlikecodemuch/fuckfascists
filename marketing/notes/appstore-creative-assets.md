# App Store creative assets (iOS 27) — what Apple shipped, and our header (Oct 15, 2026)

Apple turned on the WWDC26 "creative assets" in App Store Connect on **October 5, 2026**
(Apple Developer news: "Showcase your apps with new assets on the App Store"). Three things:

1. **Product page header** — an image or video across the top of the product page, above the
   icon and name. Apple's framing: "go beyond showing your apps and games in use, highlighting
   things like your brand, seasonal offerings, exciting new content."
2. **Search results asset** — an image or video shown in the Search tab card (and Apple Games)
   instead of the first screenshots. Apple: "State the obvious… your app's purpose is obvious at
   a glance. Showcase the firsthand experience."
3. **Asset Library + Preview** — upload once, reuse on custom product pages and In-App Events,
   **submit standalone** (reviewed against the latest live version, no build needed), preview on
   iPhone/iPad, orientations, languages, dark mode before submitting. Apple Ads will use the same
   assets (Today tab + search); Apple Ads custom creative itself is "coming this fall".

Shows on **iOS 27 / iPadOS 27 and later**. Optional. Per-localization. Roles: Account Holder,
Admin, App Manager, Marketing.

## Specs (Apple, App Store Connect Help → Creative assets specifications)

| Placement | Image | Video |
|---|---|---|
| Header | **21:9, 3840×1646**, jpeg/jpg/png | 21:9, 3840×1646, 30 or 60 fps, **5–30 s**, mov/m4v/mp4; muted by default, can be unmuted; loops |
| Search results | **3:2, 1920×1280 to 3840×2560**, jpeg/jpg/png | 3:2 same range, 5–30 s; always muted; loops |
| Universal (both) | **16:9, 5244×2950, PNG only** | — |

No alpha channel. No price, discounts, URLs, copyright symbols, other platforms' logos, or
Apple recognitions. Must suit 4+. Text: "a short phrase that enhances your visual rather than
describes it", localized. "Focus on a single, clear idea." "Design with a first-time visitor in
mind." Keep the focal point central: the header and search card are **centre crops of the
universal file**, so the safe zone is the intersection, **x 410–4835 × y 351–2599** of 5244×2950.
Video: "avoid quick cuts and fast-moving visuals", must loop without a jump, must work silent,
pick a poster frame that stands alone. Templates: Figma/Photoshop/Pixelmator/Sketch on
developer.apple.com/app-store/asset-best-practices.

Also announced: **iPhone Duo** (ships Oct 23, 2026) screenshots become **mandatory from April
2027**; the templates already include Duo.

## What we made (`scripts/appstore.sh header` → `marketing/appstore/1.2.1/creative/`)

Two universal 16:9 PNGs plus their 21:9 and 3:2 crops, from `src/appstore/StoreHeader.tsx`:

- **file** — the record card on the phone (the McDonald's business card capture, NYC map) with "Financial
  contributions, on file." / "Tap a business. Scan a barcode. Track the platforms you skip." /
  NO ACCOUNTS · NO TRACKING. Clark's voice, matches the store listing, "states the obvious" for
  the search card. **Recommended.**
- **brand** — the logo and "SEE WHERE THE MONEY GOES." Stronger brand, but the asterisked logo
  sits in front of App Review in a new, large slot; the icon and screenshots already passed with
  it, so it's a judgement call, not a rule.

Upload: App Store Connect → the app → iOS 1.2.1 → Product Page Information → **Header and
Search Results** tab → drag the universal PNG into Header, tick "use header asset in search
results" (or drop the dedicated crops) → **Preview** → submit standalone from Asset Library or
with the 1.2.1 submission. A header video (5–30 s, 21:9, calm, looping, silent-first) is a
separate build: the kinetic cut is the opposite of Apple's advice for this slot.

Sources: developer.apple.com/news/?id=ljpl7kyn · developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications/ · developer.apple.com/app-store/asset-best-practices/ · developer.apple.com/wwdc26/guides/app-store/ · developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets · adapty.io/blog/app-store-asset-library/ · aso.dev/app-store-connect/placements/

## Round 2 (Oct 15, afternoon) — the creator's brief

"We need the name FCK, Financial Contribution Kit. Way more aesthetic — more stars or blurred
map? Falling money? Don't target any specific company. For sure want a video. Navigating
screenshots? Pan in space? Clark?" Four stills, each one frame of the loop it would become
(`StoreHeader` variants, `scripts/appstore.sh header`, files `*-space|screens|clark|map-*`):

- **space** — the name in deep space, bills drifting. Video: slow star parallax, bills in zero-G.
- **screens** — three generic screens (map with pins, Scan tab, Clark's memo; no record on any)
  fanned beside the name. Video: the screens scroll slowly, the fan drifts, stars move.
- **clark** — Clark with the name, faint blurred map behind, money. Video: stars + money drift,
  Clark idles (blink / folder shuffle if we cut a Veo take).
- **map** — the NYC map blurred into the backdrop, the name over it. Video: slow pan across the
  map, money falling.

Header video constraints (Apple): 21:9 3840×1646, 5–30 s, loops, silent-first, "avoid quick
cuts and fast-moving visuals" — so slow drift, one idea, seamless loop. Search-results video is
3:2 and always muted; the universal still is image-only.

## Round 3 (Oct 15, 4 pm) — mixes of screens + Clark + map, name re-weighted

Creator: "I like 2, 3, and 4… use a scanning UPC screenshot… add a track screenshot… more
weight to Financial Contribution Kit so FCK stands out a little less." Lockup is now `Name2`:
FCK small (cyan or gold), FINANCIAL CONTRIBUTION KIT as the display line. New frames: `scan_upc`
(R11 at 5.9 s, a barcode filling the guide) and the Track tab (`track`). Screens clip above the
Debug tab bar (`cut`). Files `*-mix-a|b|c|d-*`:

- **mix-a** Clark at the desk — name left, Clark centre-right in front of the map, UPC scan + Track beside him.
- **mix-b** name over the fan — name centred up top, map / UPC / Track fanned along the bottom, Clark looking in from the right.
- **mix-c** Clark presents — Clark big at left, the name in three rows, UPC scan + Track at right, map strong behind.
- **mix-d** wide fan — memo / map / UPC / Track fanned across the width, darkened, name centred over them, Clark low left.

## Round 4 (Oct 15, evening) — B2 and C2

Creator liked B and C: "use the Coke scan, don't let Clark overlap the screenshots, weird drop
shadow on C at right." The shadow was each phone's full-height black body (so it could bleed off
the bottom) swinging out when rotated; `Phone` is now sized to its screen with a tight contact
shadow. Scan frame is `scan_coke` (R6 at 17.1 s, the bottle in the guide). Files `*-mix-b2|c2-*`:
- **mix-b2** Clark far left, name centred over a fan of map / Coke scan / Track along the bottom.
- **mix-c2** Clark big left, name in three rows, Coke scan + Track at right, map strong behind.
Next: the 15 s header loop from whichever he picks (21:9 3840×1646, slow drift, silent, seamless).

## Round 5 (Oct 15, evening) — copy options

Creator: "a little more copy, and the secondary copy can be a little larger." `COPY` in
StoreHeader.tsx: a larger uppercase secondary line plus a sentence-case third line. Rendered as
`*-mix-b2-c1..c4-*` and `*-mix-c2-c1|c3-*`:
- **c1** SEE WHERE THE MONEY GOES. / Tap a business. Scan a barcode. Track the platforms you skip.
- **c2** FINANCIAL CONTRIBUTIONS, ON FILE. / Every dollar, straight from the FEC. No accounts. No tracking.
- **c3** EVERY AVOID COUNTS. / Tap, scan, track. Random drop between Friday and Saturday.
- **c4** NO ACCOUNTS. NO TRACKING. / Public records on your phone. Nothing leaves it.
Rules kept: no price, no URL, no party words, the drop line verbatim, 4+ safe.

## Round 6 (Oct 15, night) — copy locked, four layouts

Copy: **SEE WHERE THE MONEY GOES.** / Tap a business. Scan a barcode. Track the platforms you
skip. (c1), third line 74–80 px ("the map/track copy is too small"). Layouts `*-l1..l4-*`:
- **L1** fan under the name: Clark far left, name centred, map / Coke / Track along the bottom (B2 refined, fan lowered).
- **L2** name left with Clark under it, the three screens fanned at right.
- **L3** symmetric: map at far left, Coke + Track at far right, name centred, Clark centred under it.
- **L4** fan at left under the name, bigger screens, Clark at right.

## Round 7 (Oct 15, night) — F1/F2, map and intense stars

Creator: keep 1 and 2; Clark higher (F1) and much higher + left of the copy (F2); sub copy
"Tap a business. Scan a product. Track the platforms you use." separated on a bottom bar; the
Track screen with every sprite in the grid (R5 at 2.0 s, "NOTHING AVOIDED YET"); money may
cover the headline but not the subheads (layer order headline → money → secondary → bar); a
starfield-only twin of each. The Coke lookup never shows the bottle and the folder in one frame
(the camera closes first), so the scan phone stays the bottle-in-the-guide. The search card is
now its own render (`StoreHeader-<v>-search`, `HEADER_SEARCH_TARGET=1`) so the bar sits at the
3:2 bottom. Files `*-f1|f1s|f2|f2s-*`.

## Round 10 (Oct 16) — review agent + fixes, G1/G2 over map + intense stars

A separate reviewer (Opus) read both headers at full size and at 390 px wide. Its verdict: G1
stronger for a first-time visitor (reads in one pass, all three screens whole, survives the 3:2
crop); G2's column is the more elegant third-line treatment but had structural errors. Applied:
- G1: bar opaque (phone UI and bills no longer show under the copy), bar copy on the headline's
  axis, "FCK," 240 → 170, secondary 96 → 124, Coke screenshot lifted 200 px, phone rims lighter
  with a faint cyan glow, Clark inside the 3:2 crop (x 420), map readable behind the phones
  (dark gradient at the top, lit at the bottom), a keep-out so no bill lands on the name in the
  poster frame.
- G2: fan sunk (no tab bar, no DEV) and scaled so Track sits inside the 3:2 edge, column moved
  down and off Clark with a dark radial scrim, secondary as "SEE WHERE / THE MONEY GOES.", rule
  spaced, third line as three short lines at 92 px, keep-out over the name.
Review flags for App Review: none for price/URL; the in-app "FCK★FASCISTS" header art, named
executives on the Track screen and the Coke mark are the only things a reviewer might weigh —
all already in the approved screenshots.

## Round 11 (Oct 16) — the loops

Creator picked G1 and G2 and asked for both animated. Rendered with `SEARCH_VIDEO=1
HEADER_VARIANTS="g1 g2" scripts/appstore.sh headervideo` → in `marketing/appstore/1.2.1/creative/`:
`header-video-g1|g2-3840x1646.mp4` (21:9 header, 35–36 MB) and `search-video-g1|g2-3840x2560.mp4`
(3:2 search card, 48–50 MB). 15.0 s, 30 fps, H.264, bt709, no audio. Motion: a slow periodic
pan (±34 px, ±16 px), phones bobbing ±10 px on three phases, deep stars and the map drifting over
a frozen base starfield, money falling on whole cycles. Seam check: SSIM last→first frame
0.953–0.958 against 0.966–0.968 for a normal one-frame step, so the loop closes without a jump.
Poster frame = the matching still (`header-g1|g2-3840x1646.png`, `search-*`).

Upload: App Store Connect → iOS 1.2.1 → Product Page Information → Header and Search Results:
drop the header video into Header and the search video into Search Results (or the stills),
Preview, then submit standalone from the Asset Library or with the 1.2.1 submission.

## Round 12 (Oct 16) — footage in the phones

Creator: "either place the Coke scan in the starfield area where the scan section starts, or use
short slow video clips for the screenshots in the video." Took the second: in loop mode the map
phone plays `clips/loop_map.mp4` (the pins zoom-and-tap at ~0.5×) and the scan phone plays
`clips/loop_scan.mp4` (the Coke bottle drifting into the guide at ~0.2×), both 450 frames,
forward then reversed so they close on themselves (`scripts/prep-header-loops.sh`). Track keeps
the sprite-grid still. Stills unchanged. Seam SSIM last→first 0.953–0.959 vs 0.966–0.969 for a
one-frame step. Review copies (1920 wide, 4–6 MB) in `creative/review/`.

## Round 13 (Oct 16) — G1 base, two moving backgrounds

Creator: "Better without [footage in the phones]. Use G1 as the base. Clark up a bit and bigger.
More movement in the money. Backgrounds need movement — one version slowly panning or twinkling
stars, one panning map." Variants `g1s` (stars only: each deep star breathes on its own
whole-cycle rate, the layer pans ±70/±40 px) and `g1m` (blurred map pans ±150/±60 px at 1.08×
under the same stars). Clark 1250 → 1420 wide, top 780 → 600. Money 12 → 20 bills, 2–3 falls per
loop, wider sway; still never over the subheads. Phones back to screenshots. Files
`header-video-g1s|g1m-3840x1646.mp4`, `search-video-g1s|g1m-3840x2560.mp4`, stills
`header-g1s|g1m-*.png`, review copies in `creative/review/`. Seam SSIM 0.937–0.949 vs 0.951–0.962
adjacent (the busier money and twinkle lower both numbers together; no visible jump).

## Round 14 (Oct 16) — lockup final

Creator: "FCK's font size is smaller than the full name. They should be equal. And add a little
glow to FCK." `Headline` fck 170 → 200 (= the name's 200) with a three-stop cyan halo
(`fckGlow`). Stills and all four loops re-rendered: `header-video-g1s|g1m-3840x1646.mp4`,
`search-video-g1s|g1m-3840x2560.mp4`; review copies in `creative/review/`. Seam SSIM 0.938–0.950
vs 0.951–0.962 adjacent. These are the deliverables; the creator picks stars or map (or runs both
as a product-page optimization test).

**Chosen (Oct 16):** the map + stars version, `g1m`. Header: `header-video-g1m-3840x1646.mp4` (poster `header-g1m-3840x1646.png`); search card: `search-video-g1m-3840x2560.mp4` (poster `search-g1m-3840x2560.png`). The stars-only `g1s` set stays on disk as the alternate for a product-page optimization test.
