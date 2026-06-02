# Scorecard — Design Spec

> Status: Updated from UX/UI session April 13, 2026. Canonical reference.
> Replaces: All previous scorecard specs.
> Session changes: Rendered card hierarchy/sentence structure, tab states, preview design, card presentation as full-screen takeover, timing variables, archive, drop mechanics, week boundary alignment.

---

## Identity

- Tab label: **SCORECARD**
- Screen header: **SCORECARD**
- Two distinct objects share this tab: the **in-app interactive preview** (live during the week, scrollable, detailed) and the **rendered shareable card** (generated once at drop time, cached as PNG, poster format).
- The preview is the detailed ledger. The card is the poster. "The game art on the cartridge vs the game."

---

## Week Boundary & Timing

The week runs **Saturday → Friday**, aligned with Track's SSMTWTF grid and the existing `getLocalWeekStart()` implementation in `core/utils/localDate.ts`.

### Configurable Variables (config/constants.ts)

```typescript
export const WEEK_START_DAY = 6;              // Saturday (0 = Sunday)
export const WEEK_START_HOUR = 0;             // 12:00am local time

export const DROP_WINDOW_START_DAY = 5;       // Friday
export const DROP_WINDOW_START_HOUR = 18;     // 6pm ET
export const DROP_WINDOW_END_DAY = 6;         // Saturday
export const DROP_WINDOW_END_HOUR = 16;       // 4pm ET
export const SCORECARD_QUIET_NOTIFICATION_FROM_HOUR = 23; // 11pm local
export const SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR = 9;

export const MIN_AVOIDS_FOR_DROP = 1;         // suppress card + notification below this
```

### Drop Timing

- Deterministic weighted time within the Friday evening → Saturday afternoon US window
- Every hour in the broad window remains possible; Friday evening and Saturday daytime are more likely
- Local notification scheduled on-device from app startup and after avoid writes
- Drop notification schedules only when the scored week has enough avoids to render a card
- From 11pm through 8:59am local device time, the drop notification is quiet
- Drop time is NOT displayed to the user — no countdown, no specific time shown. The randomness is the point (BeReal model).
- Header reads: **"DROPS THIS FRIDAY"**

---

## Scorecard Tab States

### State 1: Live Preview (Saturday → Friday drop)

The preview is a scrollable, interactive breakdown of the user's week across **all surfaces** — Map, Track, and Scan. It is the only unified view of total weekly impact. This is the reason to visit the tab mid-week.

**Header:** "SCORECARD" with "DROPS THIS FRIDAY" subtext and "PREVIEW" stamp.

**Background:** StarBackground component (same as Info, Onboarding, Scan).

**Not shareable.** No share button. The drop is the reward.

**Utilitarian gold frame** — thin border, warm gold, clearly not the ornate rendered card frame. "PREVIEW" stamp on the top edge. No power meter, no poster layout. This is a standard app screen, not a rendered image.

**Content:**

**Hero count** at the top of the scroll content: large gold number + "×" (e.g. "8×") with "avoids" label beneath, muted, and "THIS WEEK" below that, smallest.

**Scrollable list** below the hero count, grouped by `publicFigureName` / CEO, sorted by total avoids descending. Each row shows:

- Defeated sprite (small)
- **LAST NAME** — large, prominent. Extracted from `publicFigureName` (last name only, or full if single word).
- Parent company name — muted, below name
- Total avoid count — gold, right-aligned
- Surface icon(s) — small glyphs from tab bar iconography (map pin, checkmarks, barcode) indicating which surfaces contributed. No text labels.

**Expandable rows:** When a CEO has multiple child entities contributing avoids, the row expands to show the brands the user actually interacted with:

```
BEZOS · Amazon · 3×                    [map pin] [checkmark]
  ↳ Whole Foods · 1×                  [map pin]
  ↳ Amazon Fresh · 1×                 [map pin]
  ↳ Amazon Prime · 1×                 [checkmark]
```

Child entities use `parentEntityId` to ladder up. `getDisplayFigure()` provides the CEO name. Surface icons show provenance without labels. The user sees brands they recognize, not surfaces they used.

**Non-expandable rows:** When only one child entity contributed (e.g. JOYNER · CVS · 1×), the row does not expand — expanding would show redundant information.

**Scan avoids:** Roll up to parent entity. Show product count, not individual SKUs. "PepsiCo · Ramon Laguarta · 2 products scanned [barcode icon]"

**No daily grids in the preview.** Daily breakdown is Track's job. The preview shows counts only.

**No "+N vs last week" comparison.** Killed for privacy — would require persisting behavioral history.

### State 2: Loader (drop window reached, user opens app, no cached PNG)

App detects: current time is past drop time AND no cached PNG exists for this week AND avoid count >= MIN_AVOIDS_FOR_DROP.

- StarBackground with "Creating your scorecard..." centered
- ScorecardImage component mounts, composites layers, react-native-view-shot captures PNG
- PNG cached locally
- Estimated time: 3-5 seconds worst case (cold start + image decode + capture)
- On completion: transitions to State 3

### State 3: Card Presentation (full-screen takeover)

**The card takes over the screen.** Full-screen, edge-to-edge, on top of the preview. This is the trophy moment — the key engagement moment for the app and how it grows.

- Rendered PNG displayed at full resolution
- **SHARE button** prominent at the bottom
- **Dismiss:** swipe down gesture + a visible UI affordance (X button or "Done" in corner). Both dismiss the card.
- On dismiss: returns to the preview view beneath

**Timing:** The full-screen takeover is waiting whenever the user opens the Scorecard tab post-drop, until dismissed. If they don't open the app until Tuesday, the card is still there, patient. The notification is a nudge to open the app, not the render trigger.

**After dismissal:** The card is accessible from the archive affordance at the bottom of the tab.

### State 4: Empty Week (zero avoids at drop time)

- No card generated
- No notification fired
- Tab stays in State 1 showing empty state copy: **"Hit the Map. Hit Track. Make them feel it."** — amber, centered, no person rows
- Saturday morning: resets cleanly to new week preview

---

## The Rendered Card (Shareable Image)

A composed poster-format image generated weekly via react-native-view-shot. Fixed 9:16 aspect ratio (1080×1920). Designed to be shared on Instagram, iMessage, etc. This is the Sh*tposter's surface — confrontational, personal, celebratory.

### Sentence Structure

The card reads as **one sentence split across three zones**: "I FCKd [grid] 15× this week"

1. **"I FCKd"** — left-aligned, large, white (#e8e0d0). No colon, no ellipsis. The layout gap is the pause.
2. **Count grid** — person rows in a bounded zone (see Count Grid Zone)
3. **"15× this week"** — right-aligned, same size/weight as "I FCKd". "15×" in gold (celebration color), "this week" in white.

**Color system in the sentence:**
- White = the sentence frame ("I FCKd ... this week")
- Gold = the data (5×, 3×, 2×, 15×)

Two number systems, two colors, no collision.

### Layout (top to bottom)

1. **FCK FASCISTS logo** — existing pixel art asset, centered
2. **"SCORECARD"** — Bungee, white/light, centered
3. **Date range** — "APR 4 — APR 10", muted, with neon rule accents flanking
4. **"I FCKd"** — left-aligned, large, white. The opening bookend.
5. **Count grid zone** — person rows in cyan-washed bounded area (see below)
6. **"15× this week"** — right-aligned, large. Gold number + white text. The closing bookend.
7. **Power meter** — vertical bar, left edge (see Power Meter section)
8. **Footer:**
   - Tagline: "The fascists won't f\*ck themselves." (asterisk version)
   - CTA: "fckfascists.org" — sized prominently (~16px on canvas), this is the acquisition hook
   - Attribution: "DATA: FEC.GOV" — smallest, most muted
   - Sparkle/star decorations scattered

### Count Grid Zone

The person rows sit inside a bounded visual zone:

- **Background wash:** focusAccent/cyan at ~0.05 opacity
- **Box-shadow gradient glow:** same treatment as panels elsewhere in the app
- **Subtle border-radius** consistent with other panel treatments
- **Contains:** all person rows, dividers, "+ N more" overflow line
- **"I FCKd" and "15× this week" sit OUTSIDE this zone** — they are the sentence, not the data

### Person Row Detail

Top 3 by total count. Each row:

```
[defeated sprite]  ZUCKERBERG    5×
                   Meta · Instagram · Facebook
```

- Last name from `publicFigureName` (last name extracted, or full name if single word)
- Company from entity's parent/canonical name
- Platforms: child entity names that contributed avoids, joined with " · " — **one muted line** (company + platforms collapsed together)
- Count: **gold**, right-aligned. Not red.
- Sort descending by total count. Top 3 shown.
- All avoids for a given `publicFigureName` roll up into one count (all surfaces combined)
- Sprites: ~15-20% smaller than initial render. Contained within row height. Money piles should not overflow left content margin.
- "+ N more" — if more than 3 people, collapsed line below last row

### Adaptive Layout

- **Heavy user (4+ avoids, 3+ people):** Full sentence bookend structure. "I FCKd" → top 3 rows in grid zone → "15× this week" right-aligned.
- **Light user (1-3 avoids):** Same sentence structure, all person rows shown. No hero count drawn separately — the total in the closing bookend IS the number.
- **Empty state:** No card generated (suppressed at MIN_AVOIDS_FOR_DROP).

### Share

- **SHARE button** triggers native share sheet with the cached PNG
- **PNG only** — no share text is generated or cached alongside the image. The card is self-contained. Instagram Stories (the primary share target) doesn't support text sharing easily. In messaging contexts, the card has enough visual context. Revisit share text in V1.5.
- Shareable from the full-screen takeover AND from the archive gallery — no expiration

---

## Power Meter

A vertical bar on the left edge of the card. Visualizes the week's avoid count as energy/power, not as progress toward a goal. Think fighting game super meter. Uses **original amber/gold** from Powerbars.png assets — no color transformation.

### Tiers (configurable in config/constants.ts)

```typescript
export const POWER_METER_TIERS = [
  { min: 1,  fill: 0.25, label: 'warming-up' },
  { min: 6,  fill: 0.55, label: 'powered' },
  { min: 16, fill: 0.80, label: 'charged' },
  { min: 31, fill: 1.00, label: 'overflowing' },
] as const;
```

All tier thresholds are variables so they can be tuned based on real usage data. If most users consistently avoid 3 things per week, the first tier threshold drops so they're not stuck on "warming up" — demotivating.

### Visual Treatment Per Tier

- **Warming up (1-5):** Bar fills ~25%. Steady amber. No animation. Reduced opacity (~0.7-0.8) — atmospheric, not pulling focus.
- **Powered (6-15):** Bar fills ~55%. Amber brightens. Subtle pulse. Reduced opacity (~0.7-0.8).
- **Charged (16-30):** Bar fills ~80%. Bright gold. Steady pulse. Sparkles at top edge. Full intensity — earned visual presence.
- **Overflowing (31+):** Bar is FULL. Glow bleeds out the top. Sparkles above the bar. Fill is animated. Full intensity. This is the max visual state — someone with 40 avoids and someone with 134 avoids both see this. The hero NUMBER tells them the actual count.

### Design Rules

- The bar never implies a ceiling or a goal. "Full + overflowing" IS the top state.
- The hero number is the precise count. The bar is the vibe.
- Deterministic: same count = same bar, every time. No randomness.
- Bar width: ~20-24px on the rendered card. Narrow enough to not eat into person rows.
- Bar uses the bevel system (raised, amber tones). Pixel art asset from Powerbars.png.

---

## Card Archive

**Location:** A low-key affordance at the bottom of the Scorecard tab — "Past scorecards" link or subtle indicator. Not tabs-in-tabs.

**Gallery:** Tapping opens a reverse-chronological grid of card thumbnails. Tap a thumbnail → full-screen view with SHARE button active. Every card is shareable at any time. No expiration on sharing.

**Storage:** Cached PNGs stored locally via expo-file-system. ~200-400KB per card. Ceiling: 104 cards (2 years) — oldest dropped if exceeded.

**Privacy:** The rendered PNG is less granular than the raw EntityAvoidEvent data that generated it. Users are already encouraged to share these publicly. Cannot reverse-engineer specific dates, times, or locations from the rendered image.

---

## Drop Mechanics

- Deterministic weighted time within configured Friday/Saturday window (Friday evening → Saturday afternoon US time)
- Local notification at drop time via Expo local notifications
  - From 11pm through 8:59am local device time: quiet delivery, no sound/vibration
  - iOS: reliable, near-zero drift
  - Android: 0-9 minute drift possible due to Doze mode. Acceptable for a weekly drop.
- Notification is a nudge to open the app, not the render trigger
- Render trigger: user opens app + current time past drop time + no cached PNG + avoid count >= MIN_AVOIDS_FOR_DROP
- If user never opens app that week: card renders next time they open post-drop
- If notifications disabled: card takeover is waiting when user opens the Scorecard tab
- On-demand preview during the week shows the interactive breakdown, NOT the rendered card
- Extension data NOT included in V1 — extension has its own popup summary

### Suppress on Empty Weeks

If avoid count < MIN_AVOIDS_FOR_DROP at drop time:
- No notification fired
- No card rendered
- Tab shows empty state

### Edge Cases

**Friday post-drop avoids:** If the card drops at 9pm Friday and the user avoids something at 10pm Friday, that avoid is in the current week's data range but not on the rendered card. The card captures avoids up to the moment of render. This is a known edge case, not a bug — the user doesn't know the exact drop time. Post-drop avoids before Saturday 12am are in the old week's data range but not on the card. Saturday avoids land in the new week's preview.

**Missed weeks:** If the user doesn't open the app for multiple weeks, only render the **most recent completed week's** card on next open. Do not queue or back-fill missed weeks. The avoid event data is still stored locally — V1.5 archive/gallery can back-fill retroactively if needed.

**Preview reset:** The preview follows the data boundary. When `getLocalWeekStart()` rolls to the new Saturday at 12:00am local time, the data query returns the new week's events, and the preview reflects that automatically. No special transition logic — the preview is just a view of the current week's data.

**Card takeover vs new week:** If the user opens the app Saturday morning and the card takeover is showing (from Friday's drop), the preview beneath it is already the new week (empty or with Saturday avoids). Dismissing the card reveals the fresh start.

---

## Rendering Approach — Shareable Card Only

The rendered card is built as a dedicated `ScorecardImage` component using absolute-positioned layers in a fixed-aspect-ratio View, captured via react-native-view-shot. This component is used ONLY for the weekly shareable card generation — not for the in-app preview.

### Output

Always 1080×1920 PNG regardless of device. An SE and a Pro Max generate the identical image file. No @1x/@2x/@3x variants needed — these are render assets, not UI assets.

### PixelRatio Handling

The `captureRef` call must account for device pixel density:

```typescript
const targetWidth = 1080;
const targetHeight = 1920;
const pixelRatio = PixelRatio.get();

const result = await captureRef(viewRef, {
  width: targetWidth / pixelRatio,
  height: targetHeight / pixelRatio,
  format: 'png',
  quality: 1,
  result: 'tmpfile',
});
```

All views in the ScorecardImage component must have `collapsable={false}` set. Use a solid background color (not transparent) to avoid rendering artifacts around text.

### Layer Stack (back to front)

1. **Background** — pixel art starfield asset (full bleed, 1080×1920, JPEG ~80KB, no transparency needed)
2. **Frame** — pixel art gold border (9-slice assembly: 4 corners + 4 tiling edges, ~60-80KB total, transparent interior)
3. **Power meter** — pixel art asset, one of 4 tier variants (positioned left edge inside frame, ~5-15KB each, amber/gold)
4. **Header text** — logo asset + "SCORECARD" + date range (Text components, rendered live)
5. **"I FCKd"** — Text component, left-aligned, large, white
6. **Count grid zone** — cyan wash background + person rows + dividers + overflow text
7. **"N× this week"** — Text component, right-aligned, gold number + white text
8. **Footer text** — tagline, CTA, attribution (Text components)
9. **Sparkle decorations** — ✦✧ characters as Text components, positioned to match poster layout

### Performance

- **Render cost:** One-time composite per week. Modern phones handle this in 50-100ms. The loader hides any render delay.
- **Memory:** Two 1080×1920 images decoded = ~16MB bitmaps. Manageable on all target devices. Use JPEG for the background (no alpha needed, smaller decode). Release images from memory after capture.
- **Storage:** The cached PNG is the only ongoing cost. ~200-400KB per week.
- **GPU:** Minimal. This is not continuous rendering. `react-native-view-shot` composites once and captures a bitmap.
- **Cold start to capture:** 3-5 seconds worst case (app cold start + image decode + text render + capture). Hidden by loader.

### Pixel Art Assets — Bundled With App

| Asset | Dimensions | Est. Size | Format | Notes |
|---|---|---|---|---|
| Starfield BG | 1080×1920 | ~80KB | JPEG | No transparency needed. Stars + nebula wash. |
| Gold frame corners ×4 | ~200×200 each | ~40KB total | PNG alpha | Ornate corner details. |
| Gold frame edges ×4 | ~200×24 tiling | ~20KB total | PNG alpha | Repeating edge texture. |
| Power meter: warming | ~24×(frame height) | ~8KB | PNG alpha | Bar ~25% filled, steady amber. |
| Power meter: powered | same | ~10KB | PNG alpha | Bar ~55% filled, brighter amber. |
| Power meter: charged | same | ~12KB | PNG alpha | Bar ~80% filled, gold, sparkles at edge. |
| Power meter: overflowing | same | ~15KB | PNG alpha | Bar 100%, glow bleeding above, energy. |
| **Total bundled** | | **~185KB** | | Light. Ships with the app. |

All sprites (defeated poses) are existing assets. Logo is existing. All text is rendered live. Sparkles are text characters.

### Frame Content Zone

The frame has a known border width. The content zone (where text and sprites render) is defined as a constant:

```typescript
export const SCORECARD_CONTENT_ZONE = {
  top: 40,    // below frame top border
  left: 56,   // inside frame left (accounting for power meter width)
  right: 40,  // inside frame right border
  bottom: 40, // above frame bottom border
} as const;
```

All text and sprite positioning references this zone, not the full 1080×1920 dimensions.

---

## Copy File: copy/scorecard.ts

```typescript
export const scorecardCopy = {
  tabLabel: "SCORECARD",
  title: "SCORECARD",
  dateRange: (start: string, end: string) => `${start} — ${end}`,
  dropsLabel: "DROPS THIS FRIDAY",
  heroLabel: "avoids",
  heroWeek: "THIS WEEK",
  previewStamp: "PREVIEW",
  framingOpen: "I FCKd",
  framingClose: (n: number) => `${n}× this week`,
  personCount: (n: number) => `${n}×`,
  platformList: (platforms: string[]) => platforms.join(' · '),
  othersLine: (n: number) => `+ ${n} more`,
  shareBtn: "SHARE",
  shareLabel: "Share your scorecard",
  dismissLabel: "Done",
  loaderText: "Creating your scorecard...",
  pastCardsLabel: "Past scorecards",
  previewA11y: "Preview — this is not the official weekly drop",
  emptyState: "Hit the Map. Hit Track.\nMake them feel it.",
  tagline: "The fascists won't f*ck themselves.",
  cta: "fckfascists.org",
  dataAttribution: "DATA: FEC.GOV",
} as const;
// NOTE: No shareText. The PNG is the share payload — no text metadata
// is cached or generated alongside it. The card is self-contained.
// Revisit in V1.5 if platform-specific share text is needed.
```

---

## Verify With CC Before Build

These questions need answers from the current codebase before writing build prompts:

- Is the gold frame interior knocked out to transparent, or overlaid on top of the starfield with the black center hidden behind content? Confirm which approach is implemented.
- Does `aggregateScorecard()` walk `parentEntityId` → `getDisplayFigure()` to group child entities under a single CEO for cross-surface rollup? Or are entities listed flat without parent resolution?
- Is `collapsable={false}` set on all Views in the ScorecardImage component tree? Flag as mandatory Android test requirement — missing this produces silent blank/partial captures.

---

## Not Covered in This Spec

- Preview detailed visual design (row components, expand/collapse animation, surface icon glyphs) — needs CC prompt
- Full-screen takeover component (presentation, share button, dismiss gesture + UI affordance) — needs CC prompt
- Card archive gallery visual design (thumbnail grid layout, navigation) — V1.5
- Card reveal animation beyond loader → takeover — V1.5
- Share text generation — deferred to V1.5. PNG is the share payload, no text metadata cached. Revisit if platform-specific share text is needed.
- Perfect week achievement in Track — V1.5
- 1:1 and 4:5 aspect ratio variants for different social platforms — V1.5
- SFW version of the card — V2
- Extension data inclusion — V2 (extension has its own popup summary)
- Scorecard notification copy and deep-link behavior
- GPT prompts for pixel art asset generation (separate deliverable)
- `nextMonday` naming inconsistency in week boundary code (correct math, misleading name — cleanup task)
