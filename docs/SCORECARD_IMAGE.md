# Scorecard Image — Rendering Spec

> How the shareable scorecard image is built, how the test pipeline works, and how to translate it into the React Native component.

---

## What This Is

The scorecard is a shareable weekly brag card. When a user taps Share, the app captures the scorecard view as a bitmap and shares it as an image. The image needs to work as a **standalone screenshot** — someone who has never heard of the app should understand it. (Voice Framework rule #8: "Write for the screenshot.")

This document covers:
1. The test image pipeline (Python, for design iteration)
2. The image spec (dimensions, layout, colors, fonts)
3. How to translate to React Native (for the actual app component)

---

## Source of Truth

The **canonical design** is the Claude Design bundle at
`tools/img-gen/reference/fck-scorecard claude design/project/scorecard/index.html`
(component: `ScorecardCard` in `card.jsx`, `fckStyle: "plain"`, `showFrame: true`).
Everything below describes how that design lands in code.

## Test Pipeline

**Current script:** `tools/img-gen/scripts/composite_scorecard.py`
Renders the new "polished main" design at 1080×1920 using PIL. Mirrors
`features/Scorecard/components/ScorecardImage.tsx`. Output is the visual
reference target; the RN component should produce an equivalent image when
captured via `react-native-view-shot`.

```bash
python3 tools/img-gen/scripts/composite_scorecard.py
# → tools/img-gen/output/scorecard/scorecard_test.png
```

**Legacy script:** `tools/img-gen/scripts/composite_scorecard_legacy.py`
Preserved unchanged for regression diffing. Do NOT extend — touch the new
script. This was the iteration target before the Claude Design mockup
became canonical.

**Dependencies:** Pillow, fonts from `assets/fonts/`, sprites from
`assets/pixel/sprites/`, scorecard art from `assets/pixel/scorecard/`
(`starbg.jpg`, `frame.png`, `power_idle/hot/fck/legendary.png`,
`scanlines.png`), brand logo from `assets/pixel/brand/FF_logo.png`.

---

## Canvas Spec

| Property | Value | Rationale |
|---|---|---|
| Dimensions | 1080 × 1920 px | 9:16 — Instagram/TikTok story native ratio |
| Format | **JPEG, q=0.88** | ~6× smaller than PNG (~500 KB vs. ~3.5 MB). Pixel-art sprites mask compression artifacts; A/B'd q=0.88 vs q=0.98 — visually indistinguishable |
| Background | `starbg.jpg` resized to fill | Cosmic theme, consistent with app bg |
| Frame | `frame.png` overlay (transparent interior, gold ornaments) | Renders on top so corner ornaments sit above content edges |
| Content insets | `top: 120, left: 140, right: 140, bottom: 130` | Outside the gold frame border; flexbox `space-between` lays out header / hero / footer inside |

---

## Layout Structure

The card composes top → bottom inside the content insets:

```
┌─────────────────────────────────────┐
│       FCK FASCISTS logo             │  ← Header (520px wide, gold drop)
│         SCORECARD                   │  ← Plex 600 32px, letterSpacing 14
│       ━━━ APR 4 — APR 10 ━━━        │  ← Beam — date — Beam (cyan rules)
│                                     │
│   I FCK'D 11×                       │  ← Hero (Bungee 120, 11× in gold w/ glow)
│   ┌───────────────────────────┐     │
│   │ ⌐                       ¬│     │  ← Cyan corner ticks (4 × 18×18)
│   │ [sprite]  NAME      5×   │     │  ← Person rows (sprite 180,
│   │           Detail            │     │     name 52, detail 26, count 104 gold)
│   │ [sprite]  NAME      3×   │     │
│   │ [sprite]  NAME      2×   │     │
│   │ + 1 MORE                 │     │
│   │ ⌐                       ¬│     │
│   └───────────────────────────┘     │
│                          THIS WEEK  │  ← Bungee 64, right-aligned
│                                     │
│       ━━━━━━━━━━━━━━━━━━━━━━        │  ← Footer beam (520 wide)
│   🤘 The fascists won't FCK… 🤘     │  ← Tagline, Plex 600 32, gold horns
│       FCKfascists.com               │  ← Bungee 58, cyan, strong glow
│       DATA: FEC.GOV                 │  ← Plex 600 22, dim
│                                     │
│ [power bar]                         │  ← Left slot, anchored bottom 520
└─────────────────────────────────────┘
```

### Headline ("I FCK'D N×")

The grand total now lives **with** "I FCK'D" at the top of the content
section — not at the bottom. Bungee 120px on both. The count is
`rewardYellow` with double-shadow (drop + glow); the prefix is
`scorecardCream` with a black drop. Closing beat at the bottom-right is
just **THIS WEEK** alone (Bungee 64px, cream).

### Data Panel

| Property | Value | Token |
|---|---|---|
| Background | Vertical gradient `rgba(10,16,28,0.55→0.70)` (RN approximation: solid `0.62`) | — |
| Border | `2px solid #2A2D30` | `panelBorder` |
| Inset blue glow | `rgba(40,120,200,0.12)` blurred 40px | matches GameArena |
| Inset cyan rim | `rgba(122,242,255,0.06)` 1px spread | matches GameArena |
| Corner radius | 0 (sharp) | columnar / arcade aesthetic |
| Corner ticks | 4 × `18×18px` cyan L-brackets, 2px borders, 8px cyan glow, 3px outside corners | new — frames the panel like a viewfinder |
| Padding | `top: 14, x: 24, bottom: 18` | — |

### Person Rows

| Element | Font / size | Color | Effect |
|---|---|---|---|
| Sprite slot | 200×180 | — | Defeated variant, face-anchored at viewport center (uses `SPRITE_FACE_*` constants) |
| Name | Plex SemiBold 52 | `scorecardCream` (#E8E0D0) | letterSpacing 2, drop shadow `0 2 0 rgba(0,0,0,0.8)` |
| Detail | Plex Medium 26 | `textSecondary` (#A8B4C8) | letterSpacing 0.5 |
| Count | Bungee 104 | `rewardYellow` | textShadow gold-glow (radius 18) + black drop (0,4,0) |
| × suffix | Plex SemiBold (0.65em) | `rewardYellow` | inline after count |

- Detail line collapses sources to "Meta · Instagram · Facebook"
- Subtle `rgba(255,255,255,0.07)` divider between rows
- "+ N MORE" overflow row: Bungee 36, `textSecondary`, padded top

### Power Bar

| Property | Value |
|---|---|
| Asset | `power_{tier}.png` — `idle / hot / fck / legendary` |
| Width | 70px (constant across tiers) |
| Anchor | `left: 22, bottom: 520` from canvas edges |
| Native PNG height | 1371 / 1473 / 1576 / 1580 — taller for higher tiers |
| Rendered height | `820 × (nativeH / 1371)` — bar TUBE stays the same physical place; the top decoration is what extends up further at higher tiers |
| Glow | Soft amber (`rgba(255,201,60,0.45)`), blur ~10 |
| Tier selection | `computePowerTier(grandTotal)` → `POWER_METER_TIERS` thresholds in `config/constants.ts` |

---

## Typography

All sizes are in design-space pixels (1080×1920 canvas). Bungee renders all-caps
natively; IBM Plex weights are explicit.

| Role | Font | Size (px) | Letter spacing |
|---|---|---|---|
| Header logo | (image asset, no text) | 520px wide | — |
| SCORECARD subtitle | IBMPlexSans-SemiBold (600) | 32 | 14 |
| Date range | IBMPlexSans-Medium (500) | 26 | 4 |
| Hero "I FCK'D" + count | Bungee-Regular | 120 | 2 |
| Hero "×" suffix | IBMPlexSans-SemiBold (700) | 84 (~0.7em of count) | — |
| Person name | IBMPlexSans-SemiBold (600) | 52 | 2 |
| Person detail | IBMPlexSans-Medium (500) | 26 | 0.5 |
| Person count | Bungee-Regular | 104 | — |
| Person "×" | IBMPlexSans-SemiBold (700) | 68 (~0.65em) | — |
| + N MORE | Bungee-Regular | 36 | 3 |
| THIS WEEK | Bungee-Regular | 64 | 6 |
| Tagline | IBMPlexSans-SemiBold (600) | 32 | 1 |
| CTA URL | Bungee-Regular | 58 | 6 |
| Attribution | IBMPlexSans-SemiBold (600) | 22 | 6 |

All fonts bundled in `assets/fonts/`; app loads them via Expo font loading.

---

## Color Palette

Every color resolves to a `design/tokens.ts` entry. The scorecard intentionally
uses a **warmer cream** (`scorecardCream`) than the in-app `textPrimary` — the
share image reads as a standalone artifact, and cream + gold + cyan plays
better than cool-blue-tinted white.

| Role | Hex | Token |
|---|---|---|
| Gold (counts, headline N×, horns) | `#FFC93C` | `rewardYellow` |
| Cream (names, hero prefix, THIS WEEK) | `#E8E0D0` | `scorecardCream` |
| Muted (detail, tagline) | `#A8B4C8` | `textSecondary` |
| Dim (date, DATA: FEC.GOV) | `#667788` | `scorecardDim` |
| Blue (beam glow, panel inset) | `#2878C8` | `focusAccent` |
| Highlight blue | `#5FAEFF` | `highlightBlue` |
| Glow cyan (URL, beams, corner ticks) | `#7AF2FF` | `glowCyan` |
| Panel border | `#2A2D30` | `panelBorder` |
| Panel background | `rgba(10,16,28,0.62)` | inline (gradient approximation) |

---

## Effects

### Light Beams (rules flanking date + footer)
Backed by a baked PNG gradient (`assets/pixel/scorecard/beam.png`, 520×4)
matching the design's CSS `linear-gradient(transparent → blue → cyan →
white core → cyan → blue → transparent)`. Rendered via `<Image
resizeMode="stretch">` so narrower beams (140 flanking the date) scale the
gradient down proportionally while keeping the white core. A subtle
cyan/blue `boxShadow` on the wrapper adds the surrounding glow the asset
alone can't carry.

### Text Glow
- **Headline gold count** — `textShadowColor: rgba(255,201,60,0.7)`, blur 22
- **CTA URL** — `textShadowColor: rgba(122,242,255,0.9)`, blur 20
- **Person count** — `textShadowColor: rgba(255,201,60,0.55)`, blur 18

RN's `<Text>` only takes one `textShadow*`, so design's multi-shadow stacks
are collapsed to the strongest glow + a black drop on the body where present.

### Sparkles
8 unicode glyphs (`✦` and `✧`) at fixed design positions — gold (rewardYellow)
on the four corners + 2 mid-card, plus 2 cyan (glowCyan) accents. Each
sparkle has a `textShadow` glow matching its color.

### Vignette
RN: a single inset boxShadow on a full-canvas overlay View
(`blur 220, spread −80, color rgba(0,0,0,0.55)`). Approximates the design's
`radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)`.

### Scanlines
1px-every-4px horizontal lines, `rgba(0,0,0,0.18)`. Implemented as a
`1080×4` PNG tile (`assets/pixel/scorecard/scanlines.png`) repeated
vertically via `<Image resizeMode="repeat">` at 60% opacity. Generated
once via PIL — see `tools/img-gen/scripts/composite_scorecard.py`.

---

## Sprites

Loaded from `assets/pixel/sprites/{name}.png`. Each is a 2×2 or 2×1 sprite sheet:

| Layout | Detection | Variants |
|---|---|---|
| 2×2 (e.g. 1456×1440) | `height > width/2 * 1.5` | top-left: neutral, top-right: defeated, bottom-left: alt neutral, bottom-right: alt defeated |
| 2×1 (e.g. 1456×720) | otherwise | left: neutral, right: defeated |

The scorecard uses the **defeated** variant (top-right or right half) — character with money pile and stars. Auto-cropped to content bounds, scaled to 200px height maintaining aspect ratio.

---

## Component map

| Concern | RN file |
|---|---|
| Top-level composition + canvas + sparkles + frame overlay | `features/Scorecard/components/ScorecardImage.tsx` |
| Header (logo + SCORECARD + beam-flanked date) | `features/Scorecard/components/ScorecardImageHeader.tsx` |
| Footer (beam + tagline + CTA + DATA: FEC.GOV) | `features/Scorecard/components/ScorecardImageFooter.tsx` |
| Beam, CornerTick, Sparkle helpers | `features/Scorecard/components/ScorecardImageDecorations.tsx` |
| Person row | `features/Scorecard/components/CardPersonRow.tsx` |
| Power bar | `features/Scorecard/components/PowerMeter.tsx` |

### Pre-wired infrastructure

- `ScorecardImage` is a `forwardRef<View>` — parent passes a ref for `react-native-view-shot` capture
- `allowFontScaling={false}` and `collapsable={false}` everywhere for bitmap fidelity (Android view-shot)
- `useScorecard()` aggregates the week's events into `ScorecardViewData`
- `computePowerTier(grandTotal)` selects the bar tier from `POWER_METER_TIERS` thresholds

### Differences vs. the test pipeline

- App renders **real `useScorecard` data**; Python uses a static sample (`DEFAULT_PERSONS`)
- App's vignette is an inset boxShadow; Python's is a per-pixel radial gradient
- App's beam glow is single-pass `boxShadow`; Python's is a multi-blur composite
- App's scanlines are a tiled `<Image>`; Python rasterizes the same pattern

---

## Week Boundary

The scorecard covers a **Saturday–Friday** week. `getLocalWeekStart()` in `core/utils/localDate.ts` returns the most recent Saturday. Avoid events are queried as `date >= weekStart AND date < weekStart + 7 days`. See CLAUDE.md "Scorecard — Drop Mechanics" for the full drop timing spec.

---

## Runtime Flow (capture → purge → present)

The app-side runtime flow for a real weekly drop is:

1. **Drop fires** (or first app open after a missed drop). Effect in `features/Scorecard/ScorecardScreen.tsx` runs.
2. **Aggregate** the scored week's events via `useScorecard` → `ScorecardViewData`.
3. **Check for existing PNG** via `findLatestCard()` (`features/Scorecard/data/cardArchive.ts`) — lists the scorecards directory, sorts by mtime descending, returns the top. Robust to `weekOf` rollover at Saturday local midnight; does NOT reconstruct the filename from `weekOf`.
4. **If no PNG:** show loader (`"Locking in my card.\nShredding the data."`), mount `ScorecardImage` off-screen, capture via `react-native-view-shot` → PNG saved as `Those-I-FCKd-{Month}-{DD}-{YY}.png`.
5. **Purge scoped events** via `purgeScoredWeekAvoidEvents(adapter, weekOf)` (`core/data/eventStore.ts`). Scope is strictly `[weekOf, weekOf+7)` so the live week can never be touched. Runs ONLY if capture succeeded.
6. **Present** if we're inside the 48h presentation window (`SCORECARD_PRESENTATION_WINDOW_MS` from drop moment). Past that, tab falls back to `LivePreview` for the new live week; PNG remains in archive.

**Capture failure semantics:** if `captureCard` returns `null` (disk full, render error, app killed), the effect sets state back to `'preview'` and the raw events are retained. Purge never runs. Next Scorecard tab visit retries. Under no circumstance is purge reached when capture failed — the "delete the data" promise requires we also keep the "save the card" promise.

See CLAUDE.md § "Scorecard capture-then-purge — privacy upgrade" and § "Scorecard — Drop Mechanics" for the full non-negotiables.

---

## Filename

Captured images are saved to `FileSystem.documentDirectory/scorecards/` as:

```
Those-I-FCKd-{Month}-{DD}-{YY}.jpg
```

e.g. `Those-I-FCKd-April-11-26.jpg`. Built by `buildCardFilename(weekOf)`
in `features/Scorecard/utils/formatters.ts`. Voice: Sh*tposter (user voice,
first-person), non-vulgar, FCK substitution. The prefix echoes the card's
hero sentence and reads like an inscription when the share receiver sees
it — riff on "To Those I Loved." Archive view renders a readable label
via `formatCardLabel()` → `"April 11, 2026"`.

`formatCardLabel` and the archive listing both accept `.png` for backward
compatibility — users upgrading from the pre-2026-04-30 PNG-only era keep
their archived cards visible. New captures only ever produce `.jpg`.

---

## PREVIEW Stamp Semantics

The captured PNG **never** carries a PREVIEW stamp — the bitmap is the
shareable artifact and the drop retains its specialness. Pre-drop "this
isn't the real drop" signaling lives in-app:

- `ScorecardScreen` shows `<PreviewStamp />` as a fixed overlay when
  `effectiveState === 'preview' || 'empty'`.
- `LivePreview` renders the live week with the same chrome but does not
  invoke `<ScorecardImage>` (no capture happens until the real drop).

---

## Open Decisions

| Decision | Options | Status |
|---|---|---|
| Image share UX | Replace text share / Add second button / Long-press option | ✅ Resolved — single SHARE button on presentation |
| Scanlines + vignette in RN | Replicate in RN / Image-only flair | ✅ Resolved (2026-04-30) — replicated. Vignette via inset boxShadow; scanlines via tiled `scanlines.png` |
| Power bar tier thresholds | What avoid counts map to idle/hot/fck/legendary | Tunable via `POWER_METER_TIERS` in `config/constants.ts` — current: 1 / 6 / 16 / 31 |
| Retina scaling | Capture at 1x / 2x / 3x | Resolved — view-shot handles native; layout uses `PixelRatio.get()` + `scale()` to render at 1080×1920 design space |
| Multi-line text shadow on RN headline / count | Stack two `<Text>` siblings vs single shadow | Single shadow approximation. Acceptable; revisit if device renders look thin |
