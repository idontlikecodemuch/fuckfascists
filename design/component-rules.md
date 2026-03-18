# Component Design Rules

All components reference tokens from `design/tokens.ts`. Never hardcode hex values, pixel measurements, or font names.

---

## Global Rules

- No gradients, rounded corners, or soft shadows anywhere
- All tap targets minimum `theme.a11y.minTapTarget` (44pt)
- All animations/sparks/flashes must respect system reduced-motion setting — static fallback required
- Focus ring for VoiceOver: `theme.a11y.focusRing` around interactive elements
- `textSecondary` is only for decorative or supplementary text — all informational text must use `textPrimary` for WCAG AA compliance
- Map stays native; shell elements carry the visual style
- **Coded in React:** layout, text, buttons, rows, sheets, tabs, state logic
- **Rendered as assets:** markers, corner brackets, spark FX, scorecard frame, topbands, texture tiles

---

## 1. Business Card

**Purpose:** Entity detail sheet shown after map tap match or search match.

| Property | Token |
|---|---|
| Background (body) | `colors.surface1` |
| Hero band (top) | `colors.surface2` |
| Border | `borders.hero` in `colors.frameBlue` |
| Brand name | `type.displayM` / `colors.textPrimary` |
| Parent attribution | `type.uiLabel` / `colors.textSecondary` |
| PAC data line | `type.caption` / `colors.textSecondary` |
| GOP total | `type.displayS` / `colors.dangerRed` |
| DEM total | `type.displayS` / `colors.highlightBlue` |
| Disclaimer + FEC link | `type.bodyS` / `colors.highlightBlue` |

**Spacing:** `space.lg` padding body, `space.md` between sections.

**States:**
- **Neutral:** default sprite, no CTA.
- **Confirmed (avoided):** defeated sprite, `colors.rewardYellow` CTA, reward spark overlay.
- **Medium confidence:** `colors.rewardYellow` accent line below hero band + disclaimer text.
- **High confidence:** no badge shown (silence = confidence).

**Layout:** Card uses `overflow: 'visible'` so sprite perch extends above card border. Sprite: 120pt, `marginTop: -60`, `zIndex: 5` — stands ON TOP of the card edge. WHY section divider: 1px `surface2` (subtle).

**Reward overlay:** `business_card_reward_overlay.png` fades in to 0.6 opacity over 400ms when `avoided` state is true. Covers full card area at `zIndex: 4` (below sprite perch).

**Rendered assets:** topband asset (full-width x 64h), corner brackets top-left + top-right (32x32), reward overlay on confirm.

**Accessibility:** VoiceOver reads brand name, parent, donation totals, confidence level as one accessible group. FEC link is a separate focusable element.

---

## 2. Match Chooser

**Purpose:** Bottom sheet shown when a single map tap returns 2+ matched entities.

| Property | Token |
|---|---|
| Sheet background | `colors.surface1` |
| Row background | `colors.surface2` |
| Sheet border | `borders.hero` in `colors.frameBlue` |
| Title | `type.displayS` / `colors.rewardYellow` |
| Row name | `type.uiLabel` / `colors.textPrimary` |
| Row subtitle | `type.bodyS` / `colors.textSecondary` |

**Spacing:** `space.lg` sheet padding, `space.sm` between rows, `space.md` row internal padding.

**States:**
- All rows get `colors.highlightBlue` left accent bar (`borders.hero` width).

**Decoration:** Depth borders — `borderTopColor: highlightBlue`, `borderBottomColor: bgVoid` on sheet container.

**Accessibility:** Each row is a focusable button. VoiceOver reads name + confidence level.

---

## 3. Avoid Button

**Purpose:** Primary CTA to record an avoidance action.

| Property | Token |
|---|---|
| Default fill | `colors.rewardYellow` |
| Confirmed fill | `colors.successGreen` |
| Error fill | `colors.dangerRed` |
| Border | `borders.hero` in `colors.bgVoid` |
| Depth top border | `borders.standard` in `colors.bgVoid` |
| Depth bottom border | `borders.standard` in `colors.highlightBlue` |
| Label | `type.displayS` / `colors.bgVoid` |

**Dimensions:** Min height 56pt. Full width of parent container.

**Depth:** Top shadow (`bgVoid`) + bottom highlight (`highlightBlue`) at `standard` width give embossed 8-bit button feel.

**States:**
- **Default:** "AVOID" label, `rewardYellow` fill.
- **Confirmed:** "AVOIDED" label, `successGreen` fill, spark overlay.
- **Error:** brief `dangerRed` flash, resets to default.

**Rendered assets:** reward spark overlay on confirmed state only (64x64).

**Accessibility:** Min tap target met by 56pt height. State change announced to VoiceOver ("Avoided, confirmed").

---

## 4. Map Search Bar

**Purpose:** Text input for manual entity search on the map screen.

| Property | Token |
|---|---|
| Shell background | `colors.bgNav` |
| Input background | `colors.surface1` |
| Shell border | `borders.hero` in `colors.frameBlue` |
| Input border | `borders.standard` in `colors.highlightBlue` |
| Input text | `type.bodyM` / `colors.textPrimary` |
| Placeholder text | `type.bodyM` / `colors.textSecondary` |

**States:**
- **Scanning:** input border changes to `colors.glowCyan`.

**Accessibility:** Search field labeled with hint text. Results announced on completion.

---

## 5. Map Controls

**Purpose:** Zoom and location utility buttons overlaid on the map.

| Property | Token |
|---|---|
| Button background | `colors.bgNav` |
| Button border | `borders.standard` in `colors.frameBlue` |

**Dimensions:** 48x48pt buttons.

**Decoration:** Utility only — no ornament, no textures. Icon-only buttons.

**Accessibility:** Each button labeled ("Zoom in", "Zoom out", "Center on location"). Min 44pt tap target exceeded at 48pt.

---

## 6. Map Marker

**Purpose:** Pin rendered on the native map to indicate a flagged entity.

**Implementation:** Rendered asset only — not a coded React component.

**Dimensions:** 96x96 source, displayed at 24-32pt on map.

**States:**
- **Default:** red flag marker.
- **Selected:** blue/cyan glow treatment around marker.

**Fallback:** If custom marker asset missing, use platform default map pin.

---

## 7. Bottom Nav

**Purpose:** App-level tab bar for switching between main screens.

| Property | Token |
|---|---|
| Shell background | `colors.bgNav` |
| Active tab plate | `colors.surface1` |
| Shell border (top) | `borders.standard` in `colors.frameBlue` |
| Labels | `type.displayS` |
| Label color (default) | `colors.textSecondary` |
| Label color (active) | `colors.rewardYellow` |

**Decoration:** Optional pixel-grid texture in shell only (rendered tile asset). Solid `bgNav` fallback.

**Accessibility:** Each tab has `accessibilityRole="tab"`, `accessibilityState={{ selected }}`. Min 44pt tap target per tab.

---

## 8. Platform Row

**Purpose:** Single row in the Platforms (TRACK) screen showing a tracked platform and avoid count.

| Property | Token |
|---|---|
| Background (default) | `colors.surface1` |
| Background (active/heavy) | `colors.surface2` |
| Border (default) | `borders.standard` in `colors.frameBlue` |
| Border (heavy/active) | `borders.hero` in `colors.highlightBlue` |
| Name | `type.uiLabel` / `colors.textPrimary` |
| Count (when active) | `type.displayS` / `colors.rewardYellow` |

**Decoration:** Left edge accent line in `colors.highlightBlue` (2px). Reward flash on tap (<500ms, respects reduced-motion).

**Props:**
- `hideSprite?: boolean` — hides the sprite when row is inside a group that already shows the figure in its header.
- `compact?: boolean` — reduces vertical padding and adds left indent for grouped child rows.

**Accessibility:** Row is a pressable element. VoiceOver reads platform name + avoid count + "tap to avoid".

---

## 9. Platform Setup

**Purpose:** Character-select style screen for choosing which platforms to track.

| Property | Token |
|---|---|
| Page background | `colors.bgVoid` |
| Card background | `colors.surface1` |
| Card border (default) | `borders.hero` in `colors.frameBlue` |
| Card border (selected) | `borders.hero` in `colors.rewardYellow` |
| Title | `type.displayL` / `colors.textPrimary` |

**Spacing:** `space.lg` between cards, `space.3xl` page margins.

**Feel:** Character-select grid — each platform is a selectable card.

**Accessibility:** Each card is a toggle button with selected/unselected state.

---

## 10. Scorecard View

**Purpose:** Weekly scorecard displaying aggregated avoidance data grouped by person.

| Property | Token |
|---|---|
| Page background | `colors.bgVoid` |
| Shell background | `colors.surface1` |
| Shell border | `borders.hero` in `colors.frameBlue` |

**Variants:**
- **Heavy (has data + total):** `type.displayL` title in `colors.rewardYellow`, `type.displayL` total count.
- **Light (has data, no total):** `type.displayM` title, person rows only.
- **Empty:** `borders.dashed` border, `type.displayS` CTA in `colors.rewardYellow`.

**Spacing:** `space.lg` internal padding, `space.md` between person rows.

**Accessibility:** Card is an accessible group. Total and person names read in order.

---

## 11. Scorecard Person Row

**Purpose:** Single person entry within the scorecard showing avoidance count and sources.

| Property | Token |
|---|---|
| Background | `colors.surface2` |
| Border (default) | `borders.standard` in `colors.frameBlue` |
| Border (featured/top) | `borders.hero` in `colors.rewardYellow` |
| Name | `type.displayS` / `colors.textPrimary` |
| Count | `type.displayS` / `colors.rewardYellow` |
| Sources | `type.bodyS` / `colors.textSecondary` |

**Spacing:** `space.md` internal padding.

**States:** Top/featured row gets `borders.hero` in `colors.rewardYellow` instead of standard border.

**Accessibility:** Row reads as "{name}, {count} times, {source list}".

---

## 12. Onboarding

**Purpose:** First-run flow introducing the app's purpose and requesting permissions.

| Property | Token |
|---|---|
| Page background | `colors.bgVoid` |
| Hero bands | `colors.surface1` |
| Cards | `colors.surface2` |
| Card border | `borders.hero` in `colors.frameBlue` |
| Headlines | `type.displayL` / `colors.textPrimary` |
| Kickers | `type.displayS` / `colors.rewardYellow` |
| Body text | `type.bodyM` / `colors.textSecondary` |

**Decoration:** Rendered hero art assets per screen (optional, fallback: none).

**Spacing:** `space.3xl` between sections, `space.lg` card padding.

**Accessibility:** VoiceOver reads headline, body, and action button in sequence. Progress dots announce current step.

---

## 13. Info Screen

**Purpose:** Transparency, about, FAQ, and methodology content.

| Property | Token |
|---|---|
| Page background | `colors.bgVoid` |
| Section background | `colors.surface1` |
| Expanded FAQ background | `colors.surface2` |
| Section border | `borders.standard` in `colors.frameBlue` |
| Section ornamentation | `borders.standard` top in `colors.highlightBlue`, `borders.standard` bottom in `colors.bgVoid` |
| Expanded border | `borders.standard` in `colors.highlightBlue` |
| Section headers | `type.displayS` / `colors.rewardYellow` |
| Question text | `type.uiLabel` / `colors.textPrimary` |
| Answer text | `type.bodyM` / `colors.textSecondary` |
| Transparency toggle | `type.caption` / `colors.highlightBlue` on `colors.surface1` background |

**Spacing:** `space.lg` between sections, `space.md` internal section padding.

**States:**
- Transparency section: collapsible (default collapsed). Pressable toggle with +/− indicator (matches FaqItem pattern).

**Accessibility:** FAQ items are collapsible — VoiceOver announces expanded/collapsed state. Answers become visible on expand. Transparency toggle has `accessibilityState={{ expanded }}` and descriptive hint.

---

## 14. Info Link Row

**Purpose:** Tappable row linking to external resources (FEC, GitHub, etc.).

| Property | Token |
|---|---|
| Background | `colors.surface1` |
| Border | `borders.standard` in `colors.frameBlue` |
| Title | `type.uiLabel` / `colors.textPrimary` |
| Sublabel | `type.bodyS` / `colors.textSecondary` |
| Icon | `colors.highlightBlue` |

**Decoration:** Minimal — border and icon only.

**Spacing:** `space.md` internal padding, `space.sm` between title and sublabel.

**Accessibility:** Entire row is a single pressable link. VoiceOver reads title + sublabel + "link".

---

## 15. Game Arena

**Purpose:** Static sprite grid at the top of the Platforms screen showing all tracked figures as bust sprites.

| Property | Token |
|---|---|
| Background | `colors.surface2` |
| Background texture | `bg_tile_dark_stone.png` via `ImageBackground`, 25% opacity (`overflow: 'hidden'`) |
| Border | `borders.standard` in `colors.frameBlue` |
| Border top highlight | `colors.highlightBlue` |
| Border bottom shadow | `colors.bgVoid` |
| Cell border | `borders.standard` in `colors.rewardYellow` |
| Cell background | `colors.surface1` |
| FX text (-1) | `type.displayS` (14pt) / `colors.dangerRed` |
| Speech bubble bg | `colors.surface1` |
| Speech bubble border | `borders.standard` in `colors.frameBlue` |
| Speech bubble text | `type.caption` (9pt) / `colors.textPrimary` bold |

**Spacing:** `space.sm` padding, `space.xs` grid gap between sprite cells. `marginHorizontal: sm`, `marginTop: sm`.

**Sprites:** 48pt per cell (cell size: 52×52 including 2px border). Neutral state at 0.4 opacity when 0 avoids, full opacity when >0. Defeated state after `DEFEATED_THRESHOLD` (3) avoids. Grid uses `flexWrap: 'wrap'` with `justifyContent: 'center'`.

**FX (cosmetic — no data logged):**
- **Avoid-triggered:** `lastAvoided` prop fires floating -1 on matching sprite (fade up 600ms).
- **Tap-triggered:** tapping any sprite shows -1 float + speech bubble with random reaction from `platformsCopy.spriteReactions`. Bubble fades after 1s.
- **Reduced-motion:** bubble shown statically for 1s, no animation.
- Per-cell animated values stored in `useRef(Map)` to avoid re-creating on render.

**Accessibility:** Each sprite cell is a Pressable with `accessibilityLabel={fig.name}` and `accessibilityRole="button"`. FX elements have `accessibilityElementsHidden`.

---

## 16. Platform Group

**Purpose:** Parent company group header for platforms sharing a `parentCompany` in the TRACK screen.

| Property | Token |
|---|---|
| Header background | `colors.surface1` |
| Header top border | `borders.standard` in `colors.highlightBlue` |
| Header bottom shadow | `borders.standard` in `colors.bgVoid` |
| Header text | `type.displayS` / `colors.rewardYellow` |

**Sprites:** 32pt sprite bust in header. Same state logic as arena (neutral/defeated based on total avoids).

**Copy:** Header text via `platformsCopy.groupHeader(parentCompany, totalAvoids)` — renders as "META — 5×". Parent names are shortened via `shortParentName()` in PlatformsScreen (strips Inc/Corp/Platforms/.com, uppercases).

**Children:** Individual `PlatformRow` components indented below the header with `hideSprite` and `compact` props. Standalone platforms (no siblings sharing parentCompany) render without a group header.

**Accessibility:** Header text includes parent name and rolled-up total.
