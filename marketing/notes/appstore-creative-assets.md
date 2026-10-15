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
