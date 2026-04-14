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

## Test Pipeline

**Script:** `tools/img-gen/scripts/composite_scorecard.py`

**Purpose:** Generate a 1080×1920 test composite for design iteration. This is the visual reference target — the app-side `ScorecardView` should produce an image that matches this layout when captured via `react-native-view-shot`.

**Run:**
```bash
python3 tools/img-gen/scripts/composite_scorecard.py
```

**Output:**
```
tools/img-gen/output/scorecard/
├── scorecard_test.jpg    # Layout test (quality 95)
├── scorecard_test.png    # Lossless reference
├── idle.png              # Extracted power bar — idle state
├── hot.png               # Extracted power bar — hot state
├── fck.png               # Extracted power bar — FCK state
└── legendary.png         # Extracted power bar — legendary/overflow state
```

**Dependencies:** Pillow, NumPy, fonts from `assets/fonts/`, sprites from `assets/pixel/sprites/`, reference assets from `tools/img-gen/reference/` (Powerbars.png, frame2_sized.png, starbg.png).

---

## Canvas Spec

| Property | Value | Rationale |
|---|---|---|
| Dimensions | 1080 × 1920 px | 9:16 — Instagram/TikTok story native ratio |
| Format | PNG (primary), JPEG fallback (quality 95) | PNG for lossless share; JPEG if file size is a concern |
| Background | Starfield (`starbg.png` resized to fill) | Cosmic theme, consistent with app bg |
| Frame | `frame2_sized.png` overlay (transparent interior) | Gold border with corner ornaments |

---

## Layout Structure

The card reads as one sentence split across three zones:

```
┌─────────────────────────────────┐
│  FCK FASCISTS                   │  ← Brand (centered, gold)
│  SCORECARD                      │  ← Subtitle (centered, muted)
│  — APR 4 — APR 10 —            │  ← Date range (centered, dim, blue beam flankers)
│                                 │
│  I FCKd                         │  ← Left-aligned bookend (white)
│  ┌─────────────────────────┐    │
│  │  [sprite] NAME      5×  │    │  ← Count grid zone
│  │  [sprite] NAME      3×  │    │    (panel bg + inset glow)
│  │  [sprite] NAME      2×  │    │
│  │  + 4 MORE                │    │
│  └─────────────────────────┘    │
│                 15× THIS WEEK   │  ← Right-aligned bookend (15× gold, rest white)
│                                 │
│  ─── beam separator ───         │
│  🤘 The fascists won't f*ck... │  ← Tagline
│  FCKFASCISTS.ORG                │  ← CTA (glowCyan, neon glow)
│  DATA: FEC.GOV                  │  ← Attribution
│                                 │
│ [power bar]                     │  ← Left slot, inside frame gap
└─────────────────────────────────┘
```

### Sentence: "I FCKd [grid] 15× this week"

- **"I FCKd"** — left-aligned above the grid. "I FCK" in Bungee (renders uppercase), "d" in IBM Plex SemiBold (renders lowercase). Same font size.
- **Count grid** — person rows in a bounded panel zone (see Panel Zone below).
- **"15× this week"** — right-aligned below the grid. "15×" in gold with glow, "THIS WEEK" in white. Same font size as "I FCKd".

### Panel Zone (Count Grid)

The person rows sit inside a visually bounded zone that matches the app's GameArena panel styling:

| Property | Value | Token |
|---|---|---|
| Background | `rgba(10, 16, 28, 0.5)` | Dark wash, starfield peeks through |
| Cyan wash | `rgba(40, 120, 200, 0.05)` | `focusAccent` at 5% |
| Border | 2px solid `#2A2D30` | `panelBorder` |
| Inset glow | `rgba(40, 120, 200, 0.12)` on all edges, blurred 8px | Matches GameArena inset shadow |
| Corner radius | 0 (sharp) | Consistent with GameArena panels |

### Person Rows

Each row contains:

| Element | Font | Color | Token |
|---|---|---|---|
| Sprite | Defeated variant, 200px tall | — | — |
| Name | IBM Plex SemiBold 40px | `#DCE7F6` | `textPrimary` |
| Detail | IBM Plex Medium 24px | `#A8B4C8` | `textSecondary` |
| Count | Bungee 80px | `#FFC93C` | `rewardYellow` |

- **Detail line** is company + platforms collapsed to one line: "Meta · Instagram · Facebook"
- **Counts are gold**, not red — they're achievements, not warnings
- Subtle 1px white divider (`rgba(255,255,255,0.06)`) between rows
- "+ N MORE" at bottom of grid zone, Bungee 32px, `textSecondary`

### Power Bar

| Property | Value |
|---|---|
| Asset | Original amber/gold from `Powerbars.png` — no color transformation |
| Position | Left slot, inside the frame's transparent gap between corner ornaments |
| Size | Stretched to fill gap (130px wide × gap height) |
| Glow | Subtle amber, radius 12px, alpha 20–50 |
| Tier | FCK state (3rd bar) for the test; app selects based on avoid count |

---

## Typography

| Role | Font | Size (px) | Weight |
|---|---|---|---|
| Brand title | Bungee-Regular | 60 | — |
| Subtitle | IBMPlexSans-SemiBold | 26 | 600 |
| Date | IBMPlexSans-Medium | 22 | 500 |
| Bookend text | Bungee-Regular | 56 | — |
| Bookend "d" | IBMPlexSans-SemiBold | 56 | 600 |
| Person name | IBMPlexSans-SemiBold | 40 | 600 |
| Person detail | IBMPlexSans-Medium | 24 | 500 |
| Person count | Bungee-Regular | 80 | — |
| + N MORE | Bungee-Regular | 32 | — |
| Tagline | IBMPlexSans-SemiBold | 28 | 600 |
| CTA (URL) | Bungee-Regular | 44 | — |
| Attribution | IBMPlexSans-SemiBold | 20 | 600 |

All fonts are bundled in `assets/fonts/`. The app already loads them via Expo font loading.

---

## Color Palette

Every color maps to `design/tokens.ts`. Three colors are used in the test pipeline but not yet in the token file — candidates to add.

| Role | Hex | Token | Status |
|---|---|---|---|
| Gold (title, counts, 15×) | `#FFC93C` | `rewardYellow` | ✅ exists |
| White (names, bookends) | `#DCE7F6` | `textPrimary` | ✅ exists |
| Muted (detail, subtitle) | `#A8B4C8` | `textSecondary` | ✅ exists |
| Blue (beams, panel glow) | `#2878C8` | `focusAccent` | ✅ exists |
| Highlight blue | `#5FAEFF` | `highlightBlue` | ✅ exists |
| Glow cyan (URL) | `#7AF2FF` | `glowCyan` | ✅ exists |
| Panel border | `#2A2D30` | `panelBorder` | ✅ exists |
| Panel background | `#0A0B0C` | `panelOuter` | ✅ exists |
| Dim (date, attribution) | `#667788` | — | ❌ add as `scorecardDim` |

---

## Effects

### Light Beams
Gradient-tapered beams used as decorative rules (flanking dates, section dividers, footer separator). Implementation: bright white-hot core that fades to cyan → blue at edges, with 25% horizontal taper at both ends. Gaussian blur radius 3.

### Text Glow
Gold glow on "15×" (double-layer: radius 18 + radius 40). Cyan glow on URL (double-layer: radius 18 + radius 30).

### Flair
- **Gold sparkles:** 35 tiny cross-shaped glints scattered randomly (seeded for reproducibility)
- **Vignette:** Dark fade at edges, 40% strength, Gaussian blur radius 40
- **Scanlines:** Horizontal lines every 4px at opacity 14 — retro CRT effect

---

## Sprites

Loaded from `assets/pixel/sprites/{name}.png`. Each is a 2×2 or 2×1 sprite sheet:

| Layout | Detection | Variants |
|---|---|---|
| 2×2 (e.g. 1456×1440) | `height > width/2 * 1.5` | top-left: neutral, top-right: defeated, bottom-left: alt neutral, bottom-right: alt defeated |
| 2×1 (e.g. 1456×720) | otherwise | left: neutral, right: defeated |

The scorecard uses the **defeated** variant (top-right or right half) — character with money pile and stars. Auto-cropped to content bounds, scaled to 200px height maintaining aspect ratio.

---

## Translating to React Native

The existing `ScorecardView` component (`features/Scorecard/components/ScorecardView.tsx`) is already pre-wired:

- **`forwardRef`** — parent can pass a ref for `react-native-view-shot` capture
- **`allowFontScaling={false}`** — fixed layout for bitmap fidelity
- **`useScorecard` hook** — aggregates the week's avoid data

### What needs to happen for image capture

1. **Library:** `react-native-view-shot` (already used by `BetaOverlay` screenshot tool in `features/Beta/betaScreenshot.ts` — proven pattern)
2. **Capture size:** Let view-shot capture at device native resolution; the RN layout should be designed to look correct at any phone width, and the captured image will be whatever the device renders
3. **Share flow:** Phase 1 shares text. Phase 2 adds "SHARE AS IMAGE" that captures `ScorecardView` via view-shot ref and passes the URI to the native Share sheet
4. **Panel zone:** Use the same styling as GameArena panels — `panelOuter` bg, `focusAccent` inset shadow (`boxShadow: inset 0 0 14px -4px rgba(40,120,200,0.12)`)
5. **Power bar:** Use the extracted bar PNGs from this pipeline, displayed as an `<Image>` component. Select tier based on weekly avoid count
6. **Bookend sentence:** "I FCKd" above grid, "15× this week" below — both rendered as `<Text>` with mixed Bungee/Plex fonts

### What the test script does that the app won't

- Starfield background resize (app uses `StarField` animated component or `bg_stars.gif`)
- Frame overlay (app renders its own border/chrome)
- Gold sparkles, vignette, scanlines (these are image-only flair — the app may or may not replicate them)
- Static test data (app uses real `useScorecard` data)

---

## Week Boundary

The scorecard covers a **Saturday–Friday** week. `getLocalWeekStart()` in `core/utils/localDate.ts` returns the most recent Saturday. Avoid events are queried as `date >= weekStart AND date < weekStart + 7 days`. See CLAUDE.md "Scorecard — Drop Mechanics" for the full drop timing spec.

---

## Open Decisions

| Decision | Options | Status |
|---|---|---|
| Image share UX | Replace text share / Add second button / Long-press option | Undecided |
| Scanlines/vignette in app | Replicate in RN / Image-only flair | Undecided |
| Power bar tier thresholds | What avoid counts map to idle/hot/fck/legendary | Undecided |
| Retina scaling | Capture at 1x / 2x / 3x | Undecided (view-shot handles natively) |
