# TestFlight Review — Active Feedback (95+)

Older beta feedback items 1-94 were removed after being resolved, superseded, or consolidated into the current beta TODO.

Screenshots remain in `cropped/` for visual reference.

---

## 95. Scorecard — Completely Wrong, Align with Test Pipeline
**Screenshot:** `cropped/phone_95.png`
**Screen:** Scorecard (PREVIEW stamp, 5x avoids THIS WEEK, rows: CHEW 2x, BEZOS 1x, ZUCKERBERG 1x, PICHAI 1x, broken/overlapping layout visible)

**Status:** RESOLVED

**Feedback:**
The score card is completely wrong. This needs to align with the test scorecard pipeline

---

## 96. Scorecard — Presentation Broken, No Image/Share
**Screenshot:** `cropped/phone_96.png`
**Screen:** Scorecard (same broken card layout — PREVIEW stamp, 5x, CHEW/BEZOS/ZUCKERBERG/PICHAI rows, "Past scorecards" link at bottom)

**Status:** RESOLVED

**Feedback:**
In fact even the presentation of the scorecard is broken. There is no image presented or share button. The preview on there - I think this is the preview cause it's scrollable.

---

# Round 8 — 2026-04-19

Screenshots captured from TestFlight Screenshot Feedback list view on Mac. Cropped phone images in `cropped/`.

---

## 97. Map — Festival Center False Positive (Matching Pipeline Broken)
**Screenshot:** `cropped/phone_97.png`
**Screen:** Map (business card open for THE FESTIVAL CENTER, donation data visible with R: $17.99K / D: $22.98K amounts, AVOID button)

**Status:** RESOLVED

**Feedback:**
The festival center, a non profit org is showing up as Facebook. The matching pipeline is broken

---

## 98. Track — Sprites Need Zoom Out + Move Down, Heads Cut Off
**Screenshot:** `cropped/phone_98.png`
**Screen:** Track (arena with CEO sprites in grid, heads visible at top, Meta Platforms + Alphabet groups visible)

**Status:** RESOLVED

**Feedback:**
Sprites need to zoom out and move down (their head is being cut off). In rows sprites need to center heads (looks like it's using original pre fizzed styling)

**Resolution:**
- Arena: `531ae65` — removed `paddingBottom: 2` on `gridCell` so sprite art sits flush against the yellow cell border.
- Rows: `531ae65` — `TRACK_ROW_FACE_ANCHOR_Y` 0.5 → 0.42 so heads land in the upper third of the sprite-screen viewport.

---

## 99. Track — Dario Looks Too Much Like Zuckerberg
**Screenshot:** `cropped/phone_99.png`
**Screen:** Track (arena with DC cherry blossom background, CEO sprite visible, Netflix/Uber/ChatGPT/Claude AI rows, day circles)

**Status:** RESOLVED

**Feedback:**
Dario looks too much like Zuckerberg

---

## 100. Scorecard — Sprite Alignment + Fix Preview Label
**Screenshot:** `cropped/phone_100.png`
**Screen:** Scorecard (PREVIEW stamp, 9x avoids THIS WEEK, rows: ZUCKERBERG 2x, KHOSROWSHAHI 2x, ALTMAN 2x, McMULLEN 1x, FAILS 1x, PETERS 1x with no sprite)

**Status:** RESOLVED

**Feedback:**
When there isn't a sprite it should remain aligned with type. "Preview" should be fixed

---

## 101. Scan — Scanning Square Centering + Decoration
**Screenshot:** `cropped/phone_101.png`
**Screen:** Scan (barcode scanner open, camera view with scan guide frame offset, "Center a UPC or EAN code inside the frame.")

**Status:** RESOLVED

**Feedback:**
Scanning square inside camera view needs to be centered. Add decoration to the edge of the camera view

---

## 102. Scan — Error Code API Check + Search for "dismiss"
**Screenshot:** `cropped/phone_102.png`
**Screen:** Scan (SCAN A PRODUCT screen with OPEN SCANNER button, "Peppered Beef Jerky" was identified message at bottom with DISMISS link)

**Status:** RESOLVED — `0349e68` series + this sprint. (a) Audited copy: only `dismissLabel` (a11y) + `dismissIcon` (×) remain; no literal "DISMISS" buttons. (b) OFF lookup now hands the brand name down to the full entity-match pipeline (FEC fuzzy fallback) before showing the toast — `features/Map/barcode/openFoodFacts.ts`.

**Feedback:**
Check out this error code - shouldn't it check the API? Also search the code base for "dismiss" - we are using just the x now

---

## 103. Scan — Close-Up Focus + Florida's Natural Not Found
**Screenshot:** `cropped/phone_103.png`
**Screen:** Scan (barcode scanner with close-up view of product labels, scan guide visible)

**Status:** RESOLVED — expo-camera's `autofocus` prop is counter-named: `on` = lock-once, `off` = continuous AF. We were stuck on `on` since launch. Switched to `off` so close-up scans refocus continuously. `features/Map/components/BarcodeScannerSheet.tsx`.

**Feedback:**
Close up focus still not working which is how peoples an UPC. Florida's natural not showing up?

---

## 104. Scan — Red Bull Not Showing
**Screenshot:** `cropped/phone_104.png`
**Screen:** Scan (SCAN A PRODUCT screen with OPEN SCANNER button, "Red Bull Sugarfree" was identified but not in entity list message at bottom)

**Status:** RESOLVED

**Feedback:**
Red Bull not showing up when scanned

---

## 105. Map — No PAC = Grey Flag + Remove Dismiss + Center Type
**Screenshot:** `cropped/phone_105.png`
**Screen:** Map (business card visible for "Trader Joe's has no corporate PAC on file", DISMISS button, red flag markers on map)

**Status:** RESOLVED — inline × dismiss button removed from `BusinessBanner`; text was already `textAlign: center`; tap-outside dismiss already provided by `MapScreen`'s backdrop `Pressable` (line 383). Auto-dismiss timer (5s) preserved.

**Feedback:**
If it has no corporate PAC on file shouldn't it be a grey flag? And it's "not on file". Also remove dismiss across the board. Also center type

---

## 106. Map — Trader Joe's Leadership Question
**Screenshot:** `cropped/phone_106.png`
**Screen:** Map (same Trader Joe's no PAC card visible, map with multiple flag markers)

**Status:** RESOLVED

**Feedback:**
Also what about Trader Joe's leadership?

---

## 107. Scorecard — Shareable Card Not Presenting
**Screenshot:** `cropped/phone_107.png`
**Screen:** Scorecard (PREVIEW stamp, 12x avoids, rows: ZUCKERBERG 2x, KHOSROWSHAHI 2x, ALTMAN 2x, McMULLEN 1x, FAILS 1x, WOOD 1x, "Past scorecards" link)

**Status:** RESOLVED

**Feedback:**
Tapping to show my card still doesn't present the shareable card

---

## 108. Scorecard — No Past Share Cards Generated
**Screenshot:** `cropped/phone_108.png`
**Screen:** Scorecard (PAST SCORECARDS screen — "No past scorecards yet." empty state, back button, beta overlay visible)

**Status:** RESOLVED

**Feedback:**
No past share are generated

---

## 109. Map — Beauty Island Shows Facebook/Meta
**Screenshot:** `cropped/phone_109.png`
**Screen:** Map (business card open for BEAUTY ISLAND, donation data R: $17.99K / D: $22.98K amounts, AVOID button)

**Status:** RESOLVED

**Feedback:**
Beauty island is also showing Facebook/meta

---

## 110. Map — Parent Company Display + Lookup Error Cause
**Screenshot:** `cropped/phone_110.png`
**Screen:** Map (same Beauty Island card, same false-positive Facebook data)

**Status:** RESOLVED

**Feedback:**
We need to show the parent company - is this a lookup error based on Domain?

---

# Round 9 — 2026-04-21

Screenshots captured from TestFlight Screenshot Feedback list view on Mac. Cropped phone images in `cropped/`.

---

## 111. Map — Search Tap Doesn't Dismiss Keyboard
**Screenshot:** `cropped/phone_111.png`
**Screen:** Map (search active with "Whole" typed, autocomplete suggestions: "Whole", "Wholesome", "Wholeheartedly", keyboard visible, Whole Foods Market card behind)

**Status:** RESOLVED

**Feedback:**
When search is active tap doesn't dismiss search functionality and pop up

---

## 112. Map — Can't Exit Search
**Screenshot:** `cropped/phone_112.png`
**Screen:** Map (search bar active, caps-lock keyboard visible, PLNT Burger/Wren DC/Nail Bar DC POIs visible on map)

**Status:** RESOLVED

**Feedback:**
CANT exit search

---

## 113. Map — Chipotle Spot Check (second sighting — see also #89)
**Screenshot:** `cropped/phone_113.png`
**Screen:** Map (notification banner from +1 (240) 350-1500 visible, Nailsaloon/Lovesac/Flow Yoga Center POIs, red flag marker)

**Status:** RESOLVED — `chipotle` is in `entities.json` with `fecCommitteeId: null` (confirmed no PAC). Post-`2b0c8de` it now drops a grey ghost flag and shows the "{name} has no donations on file." banner. Chooser also filters it out of multi-match disambiguation.

**Feedback:**
Spot check chipotle

---

## 114. Onboarding — Make Text Bigger (related to #79)
**Screenshot:** `cropped/phone_114.png`
**Screen:** Onboarding (WHAT WE DON'T DO screen, "No accounts. No tracking. No servers." privacy card, NEXT button)

**Status:** RESOLVED — `PrivacyScreen` body bumped one type token (bodyM → uiLabel) with `lineHeight: 26` override for multi-line legibility. `features/Onboarding/screens/PrivacyScreen.tsx`.

**Feedback:**
Please make text bigger

---

## 115. Map — Northern Liberty False Match (not Facebook) (matching pipeline — see also #97, #109, #110)
**Screenshot:** `cropped/phone_115.png`
**Screen:** Map (business card open for NORTHERN LIBERTY, R: $17.9M / D: $10.9M / O: $129K donation data, PAC: Meta, AVOID button)

**Status:** RESOLVED

**Feedback:**
This isn't Facebook

---

## 116. Map — Washington Plaza Hotel and Hilton Not Showing
**Screenshot:** `cropped/phone_116.png`
**Screen:** Map (Massachusetts Ave NW / M St NW area, Strayer University, The Commons DC, Franklin Park visible, no flags on hotels)

**Status:** WONTFIX (independent hotels skipped per session decision) — Washington Plaza is an independent property, not a Hilton/Marriott/etc. brand, so it doesn't fit our chain coverage. Hilton itself is well covered (35 aliases incl. DoubleTree, Hampton, Embassy Suites, Waldorf Astoria, Curio, Tapestry, Conrad, Tru, Canopy, Motto, Tempo, Spark, Signia, LXR, Graduate, Hilton Garden Inn, Homewood Suites, Home2 Suites, Hilton Grand Vacations); the specific hotel that didn't flag was likely a local-flavored POI name (e.g. "Capital Hilton") that single-word-alias matching can't prefix-match. Single-word alias prefix limitation is a documented matching-pipeline tradeoff — see "Prefix matching — multi-word aliases only" in CLAUDE.md.

**Feedback:**
Washington Plaza hotel and Hilton hotel not showing up

---

## 117. Map — Discount Locksmith Shows Alphabet (matching pipeline bug)
**Screenshot:** `cropped/phone_117.png`
**Screen:** Map (business card open for DISCOUNT LOCKSMITH, D: $17.5M / R: $5.3M / O: $2.1M donations, PAC: Alphabet, Schmidt/Page/Brin donations links, AVOID button)

**Status:** RESOLVED

**Feedback:**
Discount locksmith shows alphabet. Also these numbers don't look right

---

## 118. Map — Hotel AKA Washington Spot Check
**Screenshot:** `cropped/phone_118.png`
**Screen:** Map (L St NW area, "Not on file." card visible for tapped location, K Street Dental visible)

**Status:** WONTFIX (boutique chain, skipped per session decision). Hotel AKA is a small boutique hotel chain — independent properties not under our covered chains. Outside the consumer-brand scope for V1.

**Feedback:**
Hotel AKA Washington spot check

---

## 119. Map — Went In Not Tapping At All
**Screenshot:** `cropped/phone_119.png`
**Screen:** Map (24th St NW area, Westin marker visible with P icon, zoomed in street view, no active card)

**Status:** REMOVED — out of scope

**Feedback:**
Went in not tapping at all

---

## 120. Map — Cyan Bar Below Header (related to #61)
**Screenshot:** `cropped/phone_120.png`
**Screen:** Map (Kaiser Permanente area, cyan bar visible below header above search, CVS Pharmacy/OVME markers)

**Status:** RESOLVED — glow bar relocated to above the tab bar (now brand yellow per direction in this session, not cyan)

**Feedback:**
Cyan bar below header - remove Cyan bar with glow should be above menu at bottom

**Resolution:**
- `bd1e1a2` — `app/navigation/TabBar.tsx` `topGlow` now renders above the tab bar with a 2px brand-yellow line + multi-layer boxShadow halo. Color shifted from cyan to `theme.colors.rewardYellow` per session direction (the cyan strip didn't match any other surface palette).

---

## 121. Map — AMC Not on File
**Screenshot:** `cropped/phone_121.png`
**Screen:** Map (Georgetown / West End area, Rock Creek and Potomac Parkway, no flags visible)

**Status:** RESOLVED — `amc-theatres` is in `entities.json` with `fecCommitteeId: null` (confirmed no PAC). Post-`2b0c8de` it now drops a grey ghost flag and shows the "{name} has no donations on file." banner. See also #143 (same intent).

**Feedback:**
AMC not on file

---

## 122. Map — Different Flag Indicator for No PAC on File (related to #105)
**Screenshot:** `cropped/phone_122.png`
**Screen:** Map (business card visible: "The Spa at Four Seasons Hotel Washington, DC has no corporate PAC on file.", DISMISS button)

**Status:** RESOLVED

**Feedback:**
If it's not on file we need to have a different flag indicator

---

## 123. Map — Hospitals/Medical Centers Coverage Question
**Screenshot:** `cropped/phone_123.png`
**Screen:** Map (GW University / Foggy Bottom area, Washington Circle Park, Sixty Vines, Bank of America, Whole Foods Market visible)

**Status:** PARTIAL — `one-medical` added with `parentEntityId: amazon` so its locations now ladder up to Amazon's PAC + Bezos / Amazon-leadership donations via the people-side signal (matches the Whole Foods / Twitch / Ring pattern). University-affiliated and standalone hospitals (GW Hospital etc.) intentionally deferred — the consumer-avoidance frame doesn't fit non-profit health systems for V1.

**Feedback:**
GW hospital. - do we have hospitals and medical centers? Like one medical etc.

---

## 124. Map — Bank of America Leadership No Donations?
**Screenshot:** `cropped/phone_124.png`
**Screen:** Map (business card open for BANK OF AMERICA, R: $2.7M / D: $1.7M / O: $630 donations, PAC: Bank of America, AVOID button)

**Status:** RESOLVED

**Feedback:**
Bank of America leadership no donations?

---

## 125. Map — 7-Eleven CEO No Donations
**Screenshot:** `cropped/phone_125.png`
**Screen:** Map (business card open for 7-ELEVEN, R: $25K / D: $1K donations, PAC: 7-Eleven, AVOIDED state)

**Status:** RESOLVED

**Feedback:**
711 CEO no donations?

---

## 126. Map — R/D Count Up Animation
**Screenshot:** `cropped/phone_126.png`
**Screen:** Map (business card open for CAPITAL HILTON, R: $547K / D: $464K / O: $213K donations, AVOIDED state)

**Status:** RESOLVED

**Feedback:**
We should do a little count up animation for R and D

---

## 127. Track — Arena Glow + Cyan Highlight + Flicker
**Screenshot:** `cropped/phone_127.png`
**Screen:** Track (arena with CEO sprite grid, Meta Platforms expanded with Instagram 2x, WhatsApp 2x, YouTube 1x, Amazon 1x, X/Twitter rows)

**Status:** RESOLVED

**Feedback:**
Arena scene - the diffuse glow around the edge is nice but can we add a bit of a cyan highlight? Thoughts on adding a rare subtly flicker - like randomly every few - many seconds?

**Resolution:**
- `531ae65` — `arenaFrame` gets a 1px `focusBevelLight` outer outline; `gameArenaWrap` gets a 2px top + 1px other-sides cyan border framing the arena "screen."
- `531ae65` — Pumped flicker constants: `ARENA_FLICKER_DIP_OPACITY` 0.35 → 0.10, `ARENA_FLICKER_MIN/MAX_INTERVAL_MS` 4000–14000 → 2500–8000, `ARENA_FLICKER_DIP_MS` 90 → 120, `ARENA_FLICKER_RECOVER_MS` 140 → 180.

---

# Round 10 — 2026-04-22 to 2026-04-28

TestFlight Feedback Detail views from the user's review session. Cropped phone images in `cropped/`.

Note: phone_128 through phone_136 are reference screenshots only (no embedded feedback) and are not numbered as review items. They are kept in `cropped/` for visual reference.

---

## 128. Info — Top Bar / Bottom Bar Match
**Screenshot:** `cropped/phone_128.png`
**Screen:** Info (top of Info screen with thin blue bar visible under header)

**Status:** RESOLVED — Info `pageHeader` now mirrors the TabBar yellow-glow strip (2px line + three-stop boxShadow halo) at the bottom of the header. Bonus: removed the `bgNav` background fill so the title sits directly on the StarField.

**Feedback:**
Info top blue bar should match bottom cyan bar.

Bottom cyan bar should be a little thinner and a lkttle glow-yer

**Resolution (bottom bar half):**
- `bd1e1a2` — Bottom bar height 3px → 2px (thinner). Replaced legacy single-shadow stack with RN 0.76 boxShadow three-layer halo (blur 12 / 24 / 36 with descending alpha). Result is a clearly visible glow vs. the previous near-imperceptible one. Color is brand yellow now per session-level redirection in #120.

**Outstanding:**
- Info top blue bar to match the bottom (now-yellow) bar treatment.

---

## 129. Scorecard — Milky Way Not Full Width
**Screenshot:** `cropped/phone_129.png`
**Screen:** Scorecard (empty state with "Hit the {map}. Hit {track}." broken template visible, milky way starfield background)

**Status:** RESOLVED

**Feedback:**
Milky Way isn't full width

---

## 130. Scorecard — No Preview Stamp on Empty
**Screenshot:** `cropped/phone_130.png`
**Screen:** Scorecard (empty state, PREVIEW-style stamp visible top-right despite no avoids)

**Status:** RESOLVED

**Feedback:**
Preview shouldn't exist on zero hit version of scorecard

---

## 131. Track — Increase Active Row Highlight
**Screenshot:** `cropped/phone_131.png`
**Screen:** Track (NOTHING AVOIDED YET, single sprite arena Walmart Doug McMillon, day circles row visible with subtle T highlight)

**Status:** RESOLVED

**Feedback:**
Increase highlight on active row

**Resolution:**
- `531ae65` — Track row rebuild adds a cyan dimensional bevel that wraps the entire panel containing the focused row (panelTopCapFocused / panelSidesFocused / panelBottomCapFocused), plus a solid `trackFocusBg` (#15243A) row fill, a 2-step gradient overlay for the curved/raised feel, and `SparkleDecoration` on focused rows. Sub-rows in the focused panel use the slightly darker `trackFocusBgDeep` (#0B1422) so the parent reads as raised in front of recessed children.

---

## 132. Track — Generate More Arena Backgrounds (related to #4)
**Screenshot:** `cropped/phone_132.png`
**Screen:** Track (NOTHING AVOIDED YET, single sprite arena with DC cherry blossom background, Sundar Pichai sprite)

**Status:** RESOLVED

**Feedback:**
Generate 3-5 new sprite backgrounds

---

## 133. Track — Compress Sub-Row Sizing + Padding (re-iteration of #34)
**Screenshot:** `cropped/phone_133.png`
**Screen:** Track (full sprite grid, Meta Platforms + Alphabet expanded with child rows visible)

**Status:** RESOLVED

**Feedback:**
Compress vertical sizing on sub rows.

Reduce padding all around

**Resolution:**
- `531ae65` — `TRACK_GROUP_HEADER_PADDING_VERTICAL` 5 → 0, `TRACK_CHILD_ROW_PADDING_VERTICAL` 4 → 0, `TRACK_ROW_PADDING_VERTICAL` 5 → 0, `TRACK_ROW_PADDING_HORIZONTAL` 12 → 0. Sprite + AVOID button + row all share `TRACK_ROW_SPRITE_SIZE` (48pt) for one uniform slice height. Children stack flush with the parent group header inside the cyan bevel frame.

---

## 134. Platform Setup — Add Grindr (data ask)
**Screenshot:** `cropped/phone_134.png`
**Screen:** Platform Setup (CHOOSE PLATFORMS grid)

**Status:** RESOLVED — entity + platform data shipped earlier; George Arison CEO sprite shipped on `claude/epic-boyd-26b705` (`3ecf6cd`).

**Feedback:**
Spot add - Grindr

---

## 135. Map — Chase Leadership Donations (related to #91, #106, #124, #125 — Batch H)
**Screenshot:** `cropped/phone_135.png`
**Screen:** Map (business card open for CHASE-ATM, Jamie Dimon sprite, donation data)

**Status:** RESOLVED

**Feedback:**
Chase leadership donation spot check

---

## 136. Map — Whole Foods Not Tapping (matching/coverage bug)
**Screenshot:** `cropped/phone_136.png`
**Screen:** Map (NOLA area, Whole Foods location visible, "Not on file." card visible)

**Status:** RESOLVED — Whole Foods domain alias added for POI matching

**Feedback:**
Whole Foods market not tapping / showing a flag / business card "not found" has wholefoodsmarket.com domain and "Whole foods market" in NOLA

---

## 137. Track — Match Group Has No CEO Sprite
**Screenshot:** `cropped/phone_137.png`
**Screen:** Track (4x THIS WEEK arena with nighttime city background, MATCH GROUP row with empty sprite slot)

**Status:** RESOLVED

**Feedback:**
Match no CEO sprite

---

## 138. Map — Match Chooser → Subway "Not on File" Flow Confusing
**Screenshot:** `cropped/phone_138.png`
**Screen:** Map (SEVERAL ON FILE chooser showing 7-ELEVEN and SUBWAY rows)

**Status:** RESOLVED — `2b0c8de`. Three changes that share one root: stop pretending no-signal entities are actionable. (1) MatchChooser now filters to candidates where `resolveCardMode === 'card'` so picking always lands on a real card, not a banner. The chooser auto-opens when only one match is actionable and silently clears when none are. (2) `FlagMarker` accepts `hasSignal` and renders no-signal pins as a grey ghost flag (mirrors the existing `NoMatchMarker` style: `tintColor: textSecondary` + `opacity: 0.8`) so the map visually distinguishes "we know this place but no donations" from "matched + has political activity." (3) `bannerNoPac` copy "{name} has no corporate PAC on file." → "{name} has no donations on file." — more accurate (the banner already requires both PAC AND linked-donor activity to be empty), and parallels the existing "Not on file." no-match toast without conflating the two states. Also: chooser heading "SEVERAL ON FILE" → "SEVERAL HERE" so the loud header stops claiming every candidate has data. New `mapCopy.markerNoSignal` a11y string for screen readers. copy-preview tool synced.

**Feedback:**
Asking if I want to check then subway says not on file? Weird user flow

---

## 139. Map — Navy Federal Credit Union Not Tappable
**Screenshot:** `cropped/phone_139.png`
**Screen:** Map (N RANDOLPH ST area, Navy Federal Credit Union POI visible, no flag, no card)

**Status:** WONTFIX (credit unions skipped per session decision). Credit unions are member-owned non-profits with limited federal political-donation activity; they fall outside the consumer-corporate avoidance frame for V1.

**Feedback:**
Navy federal credit union not tappable

---

## 140. Map — Chick-fil-A Owners Question (Batch H)
**Screenshot:** `cropped/phone_140.png`
**Screen:** Map (Chick-fil-A area, "Chick-fil-A's PAC is dissolved. No recorded activity." card visible)

**Status:** RESOLVED

**Feedback:**
Chic fil a owners?

---

## 141. Map — Apple Clarendon Flag Not Dropping When Map is Crowded
**Screenshot:** `cropped/phone_141.png`
**Screen:** Map (business card open for APPLE CLARENDON, donation data, AVOID button, multiple flags on map)

**Status:** RESOLVED — `7088bc8` — pin dedupe in `processTapResults` was id-only (`new Set(prev.map(p => p.id))`), so once any Apple Store had been tapped and pinned, every subsequent Apple location's pin silently dropped because the entity ID `apple` was already in `tapPins`. Same root affected every chain (Subway, Walmart, etc). Switched to a composite key `${id}-${ghostKey(coords)}` (rounded ~11m so GPS jitter at the same spot still collapses). Append-only invariant for Fabric stability preserved.

**Feedback:**
Apple Clarendon not dropping flag when there are a lot of flags on the map

---

## 142. Map — Sephora Not Tapping
**Screenshot:** `cropped/phone_142.png`
**Screen:** Map (Crossing Clarendon area, Sephora POI visible)

**Status:** RESOLVED — `sephora` is in `entities.json` with `fecCommitteeId: null` and `parentEntityId: lvmh`. Post-`2b0c8de` it now drops a grey ghost flag and shows the "{name} has no donations on file." banner; chooser filters it out of multi-match disambiguation. If a specific Sephora POI in MapKit comes back with a longer name (e.g. "Sephora Inside JCPenney"), single-word alias prefix matching can't catch it — that's the documented "Prefix matching — multi-word aliases only" tradeoff in CLAUDE.md, and would need a longer alias added per device-side report.

**Feedback:**
Sephora not tapping

---

## 143. Map — AMC Search Targeting Wrong Match (related to #121)
**Screenshot:** `cropped/phone_143.png`
**Screen:** Map (Court House area, "AMC Courthouse Plaza 8 has no corporate PAC on file." card visible)

**Status:** RESOLVED — closes alongside #121. `amc-theatres` matches as expected; the screenshot shows the no-PAC banner correctly fired for AMC Courthouse. Post-`2b0c8de` the wording reads "AMC Theatres has no donations on file." with a grey ghost flag and the chooser skips it as non-actionable.

**Feedback:**
Word that it's searching that whole thing and not AMC

---

## 144. Scan — Shorter Focal Length for Closer Scanning (DUPLICATE of #103)
**Screenshot:** `cropped/phone_144.png`
**Screen:** Scan (barcode scanner active, close-up view of fingers/palm visible, scan reticle)

**Status:** RESOLVED — fixed via `autofocus="off"` on `CameraView`. See #103.

**Feedback:**
Can we make the focal length shorter for closer scanning?

---

## 145. Scorecard — Redesign Share Screen Presenter (Batch B)
**Screenshot:** `cropped/phone_145.png`
**Screen:** Scorecard (PRESENTATION view — "I FCKd" header with rendered card showing ZUCKERBERG 4x, BEZOS 2x, JOYNER 1x, +7 MORE, 14x THIS WEEK, SHARE button)

**Status:** RESOLVED

**Feedback:**
Need to redesign share screen presenter

---

## 146. Track — Arena Flicker, StarBG Bleed, Cyan Edge (related to #127 — Batch G)
**Screenshot:** `cropped/phone_146.png`
**Screen:** Track (3x THIS WEEK arena with SF background, defeated Zuckerberg sprite with X-eyes and stars, Meta Platforms + Alphabet rows)

**Status:** RESOLVED

**Feedback:**
Make flickering more visible. StarBG showing under edge of arena. The glow needs to align with edge not be bigger. Need a cyan edge for the arena

**Resolution:**
- `531ae65` — Pumped flicker: `ARENA_FLICKER_DIP_OPACITY` 0.35 → 0.10 (rim drops to 10% during dip), intervals 4–14s → 2.5–8s, `DIP_MS` 90 → 120, `RECOVER_MS` 140 → 180. Flicker now reads as a CRT pulse instead of a near-imperceptible dim.
- `039d784` / `531ae65` — StarBG bleed traced to the `glowDividerLine` separator under the arena (rgba bg let the StarField's animated stars show through). Separator simplified to an empty 8pt spacer; `gameArenaWrap` View added with `bgVoid` solid bg as defensive layer behind GameArena.
- `531ae65` — Cyan arena edge: `arenaFrame` gets a 1px `focusBevelLight` outer outline; `gameArenaWrap` gets a 2px top + 1px other-sides border framing the arena content as a "screen."

---

## 147. Track — Faces Not Centered in Rows (DUPLICATE of #52, #92, #98, #63)
**Screenshot:** `cropped/phone_147.png`
**Screen:** Track (NOTHING AVOIDED YET, full sprite grid)

**Status:** RESOLVED

**Feedback:**
Faces not centered in rows

**Resolution:**
- `531ae65` — `TRACK_ROW_FACE_ANCHOR_Y` 0.5 → 0.42. The face-anchor pipeline (added earlier) computes `cropOffsetY` so the sprite's face center lands at this fraction of the viewport — 0.5 was reading as "head sitting low." 0.42 puts the eyes near the upper third without clipping.

---

## 148. Track — Sprites Cut Off / Heads Cut Off (DUPLICATE of #98 — STILL NOT FIXED)
**Screenshot:** `cropped/phone_148.png`
**Screen:** Track (NOTHING AVOIDED YET, full sprite grid showing heads close to top edge of cells)

**Status:** RESOLVED

**Feedback:**
Sprites are still cut off a little at bottom of square and heads cut off, need to position down and zoom out a touch?

**Resolution:**
- See #98. Same fixes apply.

---

## 149. Map — Toast Not Dismissing on Outside Tap
**Screenshot:** `cropped/phone_149.png`
**Screen:** Map (search active for "Apple federal credit union", "Couldn't reach FEC.gov for 'Apple federal credit union'. Try again later." toast visible, "Not on file." card also visible)

**Status:** RESOLVED

**Feedback:**
Toast not dismissing on outside tap.

---

# Round 11 — 2026-04-29

TestFlight Feedback Detail views. Cropped phone images in `cropped/`.

---

## 150. Track — Discord CEO Looks Too Much Like Zuck (sprite)
**Screenshot:** `cropped/phone_150.png`
**Screen:** Track (NOTHING AVOIDED YET, full sprite grid with 12+ CEOs, Meta Platforms expanded with Facebook/Instagram/YouTube/Amazon/TikTok rows)

**Status:** RESOLVED

**Feedback:**
Discord CEO looks too much like Zuck

**Resolution:**
- `4e72618` — Updated `tools/img-gen/characters.json` likeness for `jason-citron` to push his identifying features (full beard, rectangular black-framed glasses, dark brown eyes, longer wavy hair, longer oval face). Re-ran the Gemini sprite pipeline (`generate.py --force` → `compose.py` → `remove_magenta.py` → `normalize_sprites.py` → `optimize_sprites.py`). New sprite at `assets/pixel/sprites/jason-citron.png` (728×720 P-mode, 92.5 KB). Both variants (t-shirt + hoodie) now read clearly as Citron, not Zuck.

---

## 151. Track — Phantom Animation Half-Second on Screen Load (bug)
**Screenshot:** `cropped/phone_151.png`
**Screen:** Track (sprite grid + Meta Platforms / YouTube / Amazon / TikTok rows, AVOID buttons visible)

**Status:** RESOLVED — root cause was not a global blanket animation. Track's intended daily row animation uses Reanimated `itemLayoutAnimation`; the bug was loose first-layout sizing inside animated list rows, so some child fills/buttons painted at intrinsic width before stretching to final width. Fix keeps the daily open/stagger-collapse animation and the existing list structure, but locks Track list items/rows/buttons to stretch/fixed geometry (`alignSelf: 'stretch'`, `minWidth: 0`, `flexShrink: 0`) and uses the existing `DAY_CIRCLES_ANIMATE_MS` constant for detail-row fade/layout timing. Scan/Map CTA wrappers now also stretch deterministically so Fabric/RN 0.76 first paint does not show a partial panel/button fill.

**Feedback:**
There is a weird maybe half second / 1 second effect when a screen comes live and some fills animate in. Here I caught it on the "avoid" buttons. Is there a blanket animation ease or something on a parent element somewhere? I've noticed it on the avoid buttons (before avoiding) on the business card and the scan box on the scan section before pressing the button

---

## 152. Scan — Goslings Ginger Beer Spot Test (data)
**Screenshot:** `cropped/phone_152.png`
**Screen:** Scan (SCAN A PRODUCT panel, OPEN SCANNER button, error toast: "Couldn't reach Open Food Facts for '7210942005577'. Check your connection and try again.")

**Status:** WONTFIX (V1) — barcode `7210942005577` is a Bermuda EAN-13 (`721` country prefix); not in our bundled `products.json` exact-product list (1,000 rows; OFF coverage skews US/EU). The toast accurately reports OFF as unreachable for that UPC. Goslings (Bermuda brand) is a niche scan not worth bundling for V1. If repeat reports come in for non-US scans, revisit with a wider OFF bulk pass or a fallback that resolves brand from the EAN-13 GS1 prefix.

**Feedback:**
Spot test Goslings ginger beer

---

## 153. Scan — Toast Text Centering + Dismiss X Position
**Screenshot:** `cropped/phone_153.png`
**Screen:** Scan (SCAN A PRODUCT panel with OPEN SCANNER button, info toast: "Found 'Premium Tonic Water' on Open Food Facts, but its parent company isn't in our database yet. Coverage is growing." with × dismiss)

**Status:** RESOLVED — `BarcodeLookupBanner` rebuilt: text centered, × moved to absolute top-right, transparent backdrop `Pressable` catches outside taps. `features/Map/components/BarcodeLookupBanner.tsx`.

**Feedback:**
Center toast text and move dismiss X to top make sure outside tap dismisses

---

## 154. Map — Scorecard Incoming Alert: Swap Wiggle for Size Pulse
**Screenshot:** (no screenshot)
**Screen:** Map / global — "SCORECARD INCOMING" AlertBanner (Thursday nudge)

**Status:** RESOLVED — `AlertBanner` swapped `useWiggleAnimation` for a local scale-only pulse (1.0 ↔ 1.04, `ALERT_BANNER_PULSE_MS` cycle). Tooltip keeps the wiggle.

**Feedback:**
Wiggle on scorecard incoming alert is too much. A size pulse is fine but the wiggle feels weird for a UI alert. (It's the same wiggle as the usage tips.)

---

## 155. Map — Alphabet Donation Spot Check (data hydration)
**Screenshot:** (no screenshot)
**Screen:** Map — Alphabet / Google business card

**Status:** RESOLVED — people hydration round 3 (`9c29500`). Re-ran the bulk-first people chain with FEC-fuzz contributor matching and per-person row de-dupe, added current platform leadership seeds, applied the May 7 people classification preview, reconciled V1 entity links, and regenerated `people.bundle.json`. Alphabet now has current-leadership people coverage through `sundar-pichai`; the broad fuzzy-name and multi-PAC matching bug that triggered this spot check is fixed in `scripts/hydrate-people-from-bulk.mjs` and `scripts/lib/inherentlyPartisanSources.mjs`.

**Feedback:**
Spot check Alphabet — coming up as super democratic. Suspect the people-side donation hydration needs to be rerun with our new name-check pattern for individuals who donate to multiple PACs.

---

## 156. Map — PayPal Donation Spot Check + Thiel Link
**Screenshot:** (no screenshot)
**Screen:** Map — PayPal business card

**Status:** RESOLVED WITH POLICY DECISION — people hydration round 3 (`9c29500`). PayPal now has current/recent leadership person links through `alex-chriss` and `enrique-lores`, and the people file was rehydrated from bulk data. Peter Thiel was intentionally **not** linked to PayPal under the current person-to-entity matching policy because his PayPal stake and board role ended with/after the 2002 eBay acquisition; his personal donations remain represented through his live Palantir link. Revisit only if the policy later adds a "founder/cultural identity" carve-out.

**Feedback:**
Spot check PayPal — showing up as D but doesn't have any people-related donations. Thiel is super R. Likely Thiel isn't linked to PayPal as a co-founder/board member, or the people-side donations aren't surfacing on the card.

---

## 157. Onboarding — Add Icon+Label Row for Map / Track / Scan on Welcome Screen
**Screenshot:** (no screenshot)
**Screen:** Onboarding — Welcome (first screen)

**Status:** RESOLVED — `WelcomeScreen` now renders a horizontal feature row with `[map / track / scan]` Ionicons + short labels (cyan icons, `bodyS` labels) below the tagline. Reuses `TAB_ICON_NAMES` glyphs (map-outline, checkmark-done-outline, barcode-outline). Copy keys in `copy/onboard.ts`.

**Feedback:**
Add a row below the subhead on the first onboarding screen showing each functionality surface with its icon + label:

  [map icon] Map     [track icon] Track     [scan icon] Scan

Reuse the tab bar icons. So users see at a glance what the app does.

---

## 158. Onboarding — Welcome Tagline: "FCK" not "F*CK"
**Screenshot:** (no screenshot)
**Screen:** Onboarding — Welcome (tagline area)

**Status:** RESOLVED — `copy/onboard.ts` tagline: "f*ck themselves" → "FCK themselves". Per FCK substitution rule.

**Feedback:**
Tagline currently reads "F*CK" — change to "FCK" per the brand FCK substitution rule (no asterisk).

---

## 159. Onboarding — Remove Void Background
**Screenshot:** (no screenshot)
**Screen:** Onboarding (all screens)

**Status:** RESOLVED — `OnboardingSlide` container background dropped (was `bgVoid`); `StarFieldBg` now shows through directly across all 3 onboarding screens.

**Feedback:**
Remove the bgVoid layer on onboarding — let the StarField show through directly without the dark fill on top.

---

# Round 11 — 2026-05-05

---

## 160. Map — Uber CEO + Founder (Kalanick) Personal Donations Audit
**Screenshot:** `cropped/phone_160.png`
**Screen:** Map (business card open for UBER TECHNOLOGIES INC, Khosrowshahi sprite, R: $122K / D: $122K, recent cycle $0/$0, AVOID button)

**Status:** RESOLVED WITH POLICY DECISION — people hydration round 3 (`9c29500`). The audit was broadened across the 19 platform entities, adding/hydrating current platform leadership seeds including `dara-khosrowshahi` for Uber. Travis Kalanick was intentionally **not** linked to Uber under the current matching policy because public evidence shows he sold ~90% of his Uber stake in 2019 and left the board on 2019-12-31. Revisit only after a deeper SEC 13D/13G review or if the policy changes to allow former-founder cultural attribution.

**Feedback:**
Check on CEO and founder (Kalanick) for personal contributions and make sure they are attached and selectively hydrate.

Let's do this for all platforms - make sure there aren't people missing and missing money on the table.

---

## 161. Scan — Peanut M&Ms Result Audit + Pull TikTok-Style Card
**Screenshot:** `cropped/phone_161.png`
**Screen:** Scan (SCAN A PRODUCT panel + post-scan toast: "Unilever has no corporate PAC on file." × dismiss)

**Status:** PARTIAL / NEEDS-BARCODE for the data audit; UX ask intentionally deferred. Audit of `products.json`: there's exactly one exact-product M&M row (`0040000494836` "Crispy Chocolate Candies" → `mars`, correct), and the bundled `mars` producer entry covers UPC prefixes `040000`/`047100`/etc. — so an exact Peanut M&M scan should resolve to Mars, not Unilever. The user-reported Unilever attribution is unexpected; without the actual barcode (the screenshot doesn't include the UPC string) it can't be reproduced. Re-test path: Beta overlay → screenshot of the successful scan → barcode value → fix the specific row in `products.json` if mismapped. **TikTok-style scan-card UX** intentionally deferred to V1.5 — meaningful redesign work, not a beta blocker.

**Feedback:**
This scan was peanut M&Ms. Is that accurate? And for these do we pull a card like tiktok in track? A bit more of an experience.

---

## 162. Onboarding — iOS Permission Prompt Says "F*ck Fascists"
**Screenshot:** `cropped/phone_162.png`
**Screen:** Permission prompt — iOS native dialog: "'FCK' would like to access the Camera. F*ck Fascists uses your camera to scan product barcodes and match brands to corporate donation records."

**Status:** RESOLVED — `app.json` (`expo-camera.cameraPermission` + `ios.infoPlist.NSLocationWhenInUseUsageDescription`) and `ios/FckFascists/Info.plist` (`NSCameraUsageDescription` + `NSLocationWhenInUseUsageDescription`) now read "FCK uses your camera/location ..." per the FCK substitution rule (#158). Shipped on `claude/epic-boyd-26b705` (`c1a7163`).

**Feedback:**
When asking for permissions it still calls it F*ck Fascists.

---

## 163. Track — Add + Optimize New Arena Backgrounds from img-gen Reference
**Screenshot:** (no screenshot)
**Screen:** Track — arena backgrounds

**Status:** RESOLVED — three GPT-named PNGs in `tools/img-gen/reference/` resized to 1536px wide, converted JPEG q=85 progressive, and deployed: `arena_dc_mall.jpg` (DC National Mall — Capitol + Washington Monument + Lincoln Memorial), `arena_la_rodeo.jpg` (Beverly Hills / Rodeo Drive — Gucci, LV, Cartier), `arena_la_mansion.jpg` (Hollywood Hills mansion — infinity pool, LA skyline, Hollywood sign). Follow-up added `arena_st_barts.jpg` from the Jun 2 St. Barts reference with the same 1536px/progressive JPEG pipeline. `node scripts/generate-arena-assets.mjs` regenerated `core/arena/arenaAssets.ts`; arena pool is now 8 entries.

**Feedback:**
Add and optimize for the app the new arena backgrounds in `tools/img-gen/reference/`. Run them through the standard processing pipeline (resize, optimize, deploy to `assets/pixel/arena/`), then regenerate `core/arena/arenaAssets.ts` via `node scripts/generate-arena-assets.mjs`. Extends the existing 4-bg pool used by GameArena randomization.

---

## 164. Track — Sprite Coverage Audit Across All Person Entries
**Screenshot:** (no screenshot)
**Screen:** Track — all person/CEO sprites

**Status:** PARTIAL — initial audit covered the 19 platforms in `platforms.json` and surfaced 3 missing sprites: George Arison (Grindr), Spencer Rascoff (Match Group), and Zhang Yiming (ByteDance/TikTok parent). All three shipped on `claude/epic-boyd-26b705` (`3ecf6cd`) at the standard 728×720 / ~86% body-fill, alongside a fix to `analyze_sprites.py` + `normalize_sprites.py` (the hardcoded `CELL_HEIGHT=720` produced a silent 43%-fill bug on post-`84d701e` hires sheets — see `0b7fcc6` commit prose). Pending follow-up: re-audit beyond the platform list (full entity coverage incl. parents and Map-only figures) once the branch lands.

**Feedback:**
Check every person entry in track and make sure they have a sprite. Generate any that are missing via the standard pipeline (`tools/img-gen/`).

Implementation note: walk every `platforms.json` entity, resolve to its `ceoName` / `publicFigureName`, check if a sprite exists in `assets/pixel/sprites/`, build the missing list, then run the sprite generation pipeline (Gemini + reference image) to fill gaps. Update `core/sprites/spriteAssets.ts` after deployment.

---

# Round 12 — 2026-05-24

Imported via `npm run feedback:apple -- --since=2026-05-08 --download-screenshots --download-crash-logs`.

Local import directory: `tools/review/store-feedback/2026-05-24T18-05-37-554Z/` (gitignored; contains tester metadata and raw attachments).

---

## 165. Cross-Surface Haptics Pass
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AGSKJOGxscDeECkpMYDu9KQ-1.jpg`
**Screen:** Feedback note only / general app interaction

**Status:** PARTIAL / IN CURRENT WORKTREE — `core/fx/haptics.ts` and haptic calls are present in current dirty worktree for Avoid buttons, archive interactions, share presentation dismiss/share paths, and scorecard reveal. Needs one final cross-surface audit before closing.

**Feedback:**
We should add stronger haptics to the avoids and make sure they are there across all surfaces. Really maybe subtle on every button press that feels like a click then big in avoids then full crazy town on scorecard presentation.

---

## 166. Map — Hilton Family Donations
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/APZdTsU67gbbXYTjMsb7ZXY-1.jpg`
**Screen:** Map / Hilton card data

**Status:** OPEN — data audit. Need identify accepted Hilton-linked family/leadership person records and apply the current person/entity linking policy before hydration.

**Feedback:**
Hilton fam donations - add

---

## 167. Scan — Check Open Food Facts Connection
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AISgoAPUSwWBSkcuYlgZ9n0-1.jpg`
**Screen:** Scan

**Status:** OPEN — connectivity / fallback audit. Check OFF request path, timeout/failure copy, and whether failures are network, parsing, or product-not-found.

**Feedback:**
Check OFF connection

---

## 168. Scorecard — Saturday 1PM, Tracked Avoids Not Previewing or Presenting
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AN2NZ8kOf1mV-Jmj7GDwAD4-1.jpg`
**Screen:** Scorecard empty state with PREVIEW stamp despite 4 tracked avoids

**Status:** RESOLVED IN CURRENT SESSION — Scorecard display state now derives from facts (`cardUri`, presentation window, live total, user nav) instead of being driven by the capture effect. Added `deriveScorecardScreenState()` test coverage for the "card exists but live week is empty" case and preview-stamp suppression on zero-avoid states.

**Feedback:**
Have 4 tracked avoids but scorecard not showing preview or presenting card. Saturday 1PM

---

## 169. Map/Data — Default to Most Recent Major Cycle
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AFBtCJ2nnhNgpBcjUpUzkfQ-1.jpg`
**Screen:** Map business card / donation cycle label

**Status:** OPEN — copy/data-display decision. Current 2025-2026 cycle label can mislead when the current cycle is sparse; likely should default the visible "recent" emphasis to the latest major complete cycle while still preserving current-cycle transparency.

**Feedback:**
Should default to the most recent major cycle. This 25-26 is a little misleading

---

## 170. Track — Scorecard Incoming Alert Should Route to Scorecard
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AKXrlA1c8o7sEDT9-OhXyAs-1.jpg`
**Screen:** Track with SCORECARD INCOMING banner

**Status:** OPEN — UI routing audit. Notification tap routing exists for scorecard-drop notifications, but the in-app Scorecard Incoming banner must also route directly to the Scorecard tab.

**Feedback:**
Scorecard incoming should take you to scorecard

---

## 171. Track — Tap Feedback Should Originate at Tapped Person
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AIyclDNDWUV24uYbz079Dz4-1.jpg`
**Screen:** Track arena

**Status:** OPEN — FX positioning polish. The `-1` / `ow!` hit feedback should be anchored at the tap target, not a generic arena position.

**Feedback:**
When tapping on a person on the arena the -1 and ow! Should be at your tap point (the person you are tapping)

---

## 172. Scan — Background Swipe Regression
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/ACXs5suhyiyHVceHuD8Y6D0-1.jpg`
**Screen:** Scan

**Status:** OPEN — visual regression. The scan tab background swipe/slide artifact has reappeared.

**Feedback:**
The swipe of the BG is back in the scan tab

---

## 173. Scorecard — Prior Week Card Should Present When Current Week Is Empty
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AKgYtVhInANG9YtC69xt5co-1.jpg`
**Screen:** Scorecard empty state with PREVIEW stamp

**Status:** RESOLVED IN CURRENT SESSION — exact root case covered by `deriveScorecardScreenState()`: if a scored-week card exists and the presentation window is active, presentation wins even when `liveData.grandTotal` is zero. This keeps the just-finished week from being hidden by the newly-started empty live week.

**Feedback:**
I have no avoids this week but did last week. The scorecard should have been presented to me

---

## 174. Scorecard — Empty Scorecard Needs Past Scorecards Access
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AKh9QAvRtbiMPnrSKQyOm5s-1.jpg`
**Screen:** Scorecard empty state

**Status:** RESOLVED IN CURRENT SESSION — `EmptyWeek` now receives `onOpenArchive` and renders the same Past scorecards link available on the live preview path.

**Feedback:**
Should be able to see past scorecards on empty scorecards

---

## 175. Map/Scan — Multiple Toasts Visible at Once
**Screenshot:** `store-feedback/2026-05-24T18-05-37-554Z/screenshots/AGDwU46U80mc8teTMZ0nxPA-1.jpg`
**Screen:** Map/Scan overlay state

**Status:** OPEN — toast lifecycle/state coordination. Need ensure only one transient banner/toast owns the bottom HUD lane at a time.

**Feedback:**
Multiple toasts visible at the same time

---

# Round 13 — 2026-05-29

Imported via `npm run feedback:apple -- --since=2026-05-24 --download-screenshots --no-apple-crashes`.

Local import directory: `tools/review/store-feedback/2026-05-29T22-37-26-815Z/` (gitignored; contains tester metadata and raw attachments).

Crash-feedback split pull returned 0 records. The combined screenshot+crash pull hit an Apple API 500, so crash feedback was checked separately.

---

## 176. Track/Map — Scorecard Incoming Alert Jiggle + Smooth Dismiss
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/AKAiAB1mCk3YArwMJvn4ey8-1.jpg`
**Screen:** Map / shell-level Scorecard Incoming banner

**Status:** PARTIAL / IN CURRENT WORKTREE — banner was already moved to a full-width top strip, made swipe-up dismissible, routed to Scorecard, and given a short vertical jiggle. Remaining audit: make the search-bar offset animate smoothly during dismiss instead of jumping, and decide whether the jiggle should stretch to the requested 3-5s or keep the current shorter 3-beat treatment.

**Feedback:**
Make the alert jiggle 3 times over 3-5 sec. Make dismiss smooth (incl the search move)

---

## 177. Map/Data — "Most Recent" Should Mean Most Recent Major Cycle
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/ABen-whdA39icJL6ITfDWg8-1.jpg`
**Screen:** Map business card / donation cycle label

**Status:** RESOLVED IN CURRENT WORKTREE — duplicate/confirmation of #169. Added compact `cycleTotals: [[cycle, R, D, O], ...]` to entity and people donation summaries, rehydrated entities/people from local FEC bulk, applied the existing people classification pass, and rebuilt `people.bundle.json`. `deriveDonationSummary()` now uses the latest completed major FEC cycle when per-cycle totals are present, so during 2026 it displays `2023-24` when that cycle has data, while falling back to the current active cycle for entities with no completed-cycle history.

**Feedback:**
"Most recent" should be the most recent major cycle

---

## 178. Track — Arena Row Sprite Heads Need Slight Upward Shift
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/AE6kBlrrdCJ4jQ1CCROBV_Y-1.jpg`
**Screen:** Track / arena rows

**Status:** RESOLVED IN CURRENT WORKTREE — `TRACK_ROW_FACE_ANCHOR_Y` moved `0.42 → 0.37`, shifting row/group-header sprite faces up by about 2-3px in the 48px sprite screen without changing arena grid anchors or sprite assets.

**Feedback:**
In the arena rows - move the sprite heads up like 2/3 px

---

## 179. Info — Copy Wall Needs More Hierarchy / Negative Space
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/AB3Vkf6CA-ye97x3mZ-sN1o-1.jpg`
**Screen:** Info / transparency copy section

**Status:** NEEDS DISCUSSION — user explicitly requested discussion before changing. Direction: preserve the copy, split dense paragraphs into clearer modules, add section hierarchy, and increase vertical breathing room.

**Feedback:**
I think we need a bit more negative space here. And more hierarchy. The copy is really good but it's a wall of type. Let's discuss

---

## 180. Cross-Surface — First-Paint Width Expansion Regression
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/APLu8c_1g8JZAdAYoulc8gQ-1.jpg`
**Screen:** General / first-frame load artifact

**Status:** RESOLVED IN CURRENT WORKTREE — hardened the #151 first-paint sizing path again. `TrackList` now wraps every FlatList item in a fixed-stretch shell, group headers and day strips stretch explicitly, and the Scan standby panel layers use fixed-stretch geometry so RN/Fabric does not briefly paint intrinsic-width fills.

**Feedback:**
An old bug is back. The background or some element expands to the edge on load. Only a frame or two. Research and (hopefully) a fix should be in docs or history. Was also affecting arena rows

---

## 181. Track — Arena Row AVOID Buttons Also Affected By Width Flash
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/AGcSJG1QKmGffJl2xLZOOvA-1.jpg`
**Screen:** Track / platform rows

**Status:** RESOLVED IN CURRENT WORKTREE — same fix as #180. The extra first-frame fill beside row AVOID buttons is guarded by the fixed-stretch Track list item shell plus explicit group/day row stretch; existing fixed-width `AvoidButton` geometry is unchanged.

**Feedback:**
Yes - arena rows "avoid" button are also affected. See the first two. I think it was a non defined width thing but look back.

---

## 182. Scan — UPC Scanner Still Blurry Close-Up
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/AKgIADulMHeUT-wfkB9wP6A-1.jpg`
**Screen:** Scan / barcode scanner sheet

**Status:** PARTIAL / IN CURRENT WORKTREE — continuous autofocus (`autofocus="off"`) was already present from #103/#144. Updated Scan standby + active scanner guidance to tell testers to back up until bars are sharp and hold 6-10 inches away. Documented the camera-stack fallback in `docs/BARCODE_SCAN_V1.md`: first test a small Expo Camera default zoom, then move to VisionCamera/native scanner support if real-device close-focus remains poor. Needs real-device confirmation because Expo Camera SDK 52 does not expose macro/near-focus controls.

**Feedback:**
UPC scanner is still blurry when close up. Thought this was fixed?

---

## 183. Track — Characters Should Reset To Undefeated Daily
**Screenshot:** `store-feedback/2026-05-29T22-37-26-815Z/screenshots/AJXKZ5rgsnHv2A_91z-63Sk-1.jpg`
**Screen:** Track / arena characters

**Status:** RESOLVED / SUPERSEDED BY #198-#199 — the old weekly-count fallback remains removed and local-day refresh still clears visual defeats. The later interaction decision fully separates the systems: recorded avoids no longer drive defeated sprites at all; only a successful 50% arena-hit roll registers a visual defeat.

**Feedback:**
Characters are supposed to reset back to undefeated each day. Only if that day is avoided.

---

# Round 14 — 2026-06-03

Imported via `npm run feedback:apple -- --since=2026-05-29 --download-screenshots`.

Local import directory: `tools/review/store-feedback/2026-06-04T03-05-50-828Z/` (gitignored; contains tester metadata and raw attachments).

The import returned 11 records: 8 already-catalogued May 29 records plus 3 new records below.

---

## 184. App Shell — Randomize Initial Launch Tab
**Screenshot:** `store-feedback/2026-06-04T03-05-50-828Z/screenshots/AAm9a9ZqvL3Ud0PPWRQFOPs-1.jpg`
**Screen:** App shell / cold launch

**Status:** RESOLVED IN CURRENT WORKTREE — non-notification cold starts now choose a weighted initial tab across Map, Track, Scorecard, and Scan. Scan is intentionally weighted lower. Scorecard-drop notification launches still override randomization and route directly to Scorecard. If the app cold-starts during an active, unarchived drop window with scored-week avoids, Scorecard gets first launch so the capture/presentation flow can run; after the card is archived, launches return to weighted random.

**Feedback:**
Have the app open randomly on map, track, scan(weighted less), or scorecard when it launches

---

## 185. Scorecard — Alert Tap Opened Empty Archive Despite Multiple Avoids
**Screenshot:** `store-feedback/2026-06-04T03-05-50-828Z/screenshots/AJve2_X3IaPh_NuaZEiXu_I-1.jpg`
**Screen:** Scorecard / Past scorecards

**Status:** STALE BUILD 4 FEEDBACK / COVERED — paired with #186. This report predates the May 31 startup-retention fixes (`0b88e0c`, `c4d349d`) that preserve the just-finished scored week on launch until capture can save the card. Current pass keeps the solution simple: AppShell routes the first cold launch inside an active, unarchived drop window to Scorecard when scored-week avoids exist, and `ScorecardScreen` checks for the exact scored-week archived card before treating the drop as empty.

**Feedback:**
I had multiple avoids logged

---

## 186. Scorecard — Notification Tap Did Not Present Card
**Screenshot:** `store-feedback/2026-06-04T03-05-50-828Z/screenshots/ALS1-k2uZ14szFlXzuJ4XYY-1.jpg`
**Screen:** Scorecard / empty state after notification tap

**Status:** STALE BUILD 4 FEEDBACK / COVERED — notification cold-start routing was already fixed after Build 4 by using the stable `scorecard-drop` notification data key and holding the shell blank until initial routing resolves. Current pass adds the non-notification backup path described in #185: if the app opens during an active, unarchived drop window with scored-week avoids, Scorecard mounts first and runs the existing capture/presentation flow.

**Feedback:**
I got an alert to see my scorecard and tapped it and got the start screen but when I went to scorecard it's empty. "Past scorecard" is also empty. The presentation of the card didn't happen

---

# Round 15 — 2026-06-15

Imported via `npm run feedback:apple -- --since=2026-06-04 --download-screenshots`.

Local import directory: `tools/review/store-feedback/2026-06-16T00-14-51-261Z/` (gitignored; contains tester metadata and raw attachments).

The import returned 3 new records.

---

## 187. Scorecard — Past Card Screenshot Included App Chrome
**Screenshot:** `store-feedback/2026-06-16T00-14-51-261Z/screenshots/ANu6s0FNgGtcAVpYG5ac6J8-1.jpg`
**Screen:** Scorecard / Past scorecard presentation

**Status:** RESOLVED IN CURRENT WORKTREE — archive-selected cards now report presentation-active state through `ScorecardScreen`, matching the live drop path. `AppShell` hides bottom chrome while a past card is open, so screenshots/share captures do not include the tab bar.

**Feedback:**
When tapping on past scorecard and screenshotting the menu is visible

---

## 188. Scorecard — Past Screen Needs Date Organization
**Screenshot:** `store-feedback/2026-06-16T00-14-51-261Z/screenshots/AEe3wLZimjh6RbCa12A7HTE-1.jpg`
**Screen:** Scorecard / Past scorecards archive

**Status:** RESOLVED IN CURRENT WORKTREE — the archive now uses a compact dated list instead of a grid: each row has a small scorecard thumbnail, a `Week of ...` label, a LATEST tag on the newest card, enough bottom padding for the persistent tab bar, and a lightweight Newest/Oldest segmented sorter at the top.

**Design notes:** Checked Apple HIG list/table guidance and Material list/segmented-control guidance. Because date is the primary scanning signal, the small archive is best treated as a metadata-first list with secondary thumbnails, stable tap rows, and an explicit sort control.

**References:** `https://developer.apple.com/design/human-interface-guidelines/lists-and-tables`, `https://m3.material.io/components/lists/overview`, `https://m3.material.io/components/segmented-buttons/overview`

**Feedback:**
We should improve the past screen card moment. With dates and some kind of organization. Look at best practice

---

## 189. Scan — Pepsi Product Coverage Gap
**Screenshot:** `store-feedback/2026-06-16T00-14-51-261Z/screenshots/AI4QvqOZoacSJWn_gFS9JhM-1.jpg`
**Screen:** Scan / barcode result

**Status:** RESOLVED IN CURRENT WORKTREE — added exact runtime product coverage for barcode `5201156250881` to resolve to Pepsico. This barcode appears in the local OFF checkpoint under Pepsico evidence, but the `520115` producer prefix only had 3 observed rows and stayed below the runtime prefix threshold of 5, so an exact override is safer than broadening the prefix.

**Feedback:**
Part of Pepsi family

---

# Round 16 — 2026-06-18

Imported via `npm run feedback:apple -- --since=2026-06-15 --download-screenshots`.

Local import directory: `tools/review/store-feedback/2026-06-18T22-11-21-342Z/` (gitignored; contains tester metadata and raw attachments).

The import returned 4 new Build 6 records.

---

## 190. App Shell — Thursday Alert Should Push Page Content Down
**Screenshot:** `store-feedback/2026-06-18T22-11-21-342Z/screenshots/AJysJZMFLmWaU2YY-MYwBJk-1.jpg`
**Screen:** Track setup / scorecard incoming banner

**Status:** RESOLVED — `NudgeBanner` now reports its rendered height and `AppShell` reserves that top padding above the active tab. Removed the old Map-only `topContentOffset` path so Map, Track, Scan, Scorecard, and Info all get the same push-down behavior when the Thursday banner is visible.

**Feedback:**
I think the alert should probably push down all the pages now that we are going to random ones

---

## 191. Scan — First-Frame Background Width Regression Still Present
**Screenshot:** `store-feedback/2026-06-18T22-11-21-342Z/screenshots/AKcAJvZvBw81pNv0ARkDPgk-1.jpg`
**Screen:** Scan standby panel

**Status:** RESOLVED — `ScanStandbyPanel` now renders inside a non-collapsible full-width root and pins the nested panel/content/CTA layers to `width: '100%'`, preventing the first-frame intrinsic-width paint before the layout settles.

**Feedback:**
The growing background bug is still not fixed

---

## 192. Track — AVOID Button Column Still Grows / Overpaints
**Screenshot:** `store-feedback/2026-06-18T22-11-21-342Z/screenshots/AI9UgOv4kdtXDa4hx9agpEA-1.jpg`
**Screen:** Track list / expanded and collapsed rows

**Status:** RESOLVED — `PlatformRow` now wraps `AvoidButton` in a fixed-width, fixed-height, clipped action column (`TRACK_BUTTON_WIDTH` x `TRACK_ROW_SPRITE_SIZE`) so row focus fills and bevels cannot overpaint beyond the intended button slice.

**Feedback:**
Growing avoid button bug still not fixed. We've fixed this a bunch find the regression

---

## 193. Scorecard — Share Background Needs Vertical Centering
**Screenshot:** `store-feedback/2026-06-18T22-11-21-342Z/screenshots/AAM2DCNdgAvh_KWXjULfL1c-1.jpg`
**Screen:** Scorecard full-screen presentation / screenshot-share background

**Status:** RESOLVED — iOS `CardPresentation` keeps the live secure overlay unchanged, but applies a small downward optical-centering offset to the hidden screenshot backing image used by the screenshot/share trigger.

**Feedback:**
This needs to be vertically centered to properly share on social (the screenshot bg trigger)

---

# Round 17 — 2026-07-01

Imported via `npm run feedback:apple -- --since=2026-06-18 --download-screenshots`.

Local import directory: `tools/review/store-feedback/2026-07-01T12-48-27-984Z/` (gitignored; contains tester metadata and raw attachments).

The import returned 6 records: 2 new Build 7 records plus 4 Build 6 records already catalogued as #190-#193.

Duplicate Build 6 records in this import:
- `AJysJZMFLmWaU2YY-MYwBJk` — duplicate of #190, already resolved by app-wide banner padding.
- `AKcAJvZvBw81pNv0ARkDPgk` — duplicate of #191, already resolved by full-width Scan standby layout.
- `AI9UgOv4kdtXDa4hx9agpEA` — duplicate of #192, already resolved by fixed/clipped Track action column.
- `AAM2DCNdgAvh_KWXjULfL1c` — duplicate of #193, already resolved by iOS share backing-image centering.

---

## 194. Scorecard — Single-Person Card Captured Without Image Assets
**Screenshot:** `store-feedback/2026-07-01T12-48-27-984Z/screenshots/ACHHf9SivaAXdpxWxN5Xf-E-1.jpg`
**Screen:** Scorecard share/presentation image
**Build:** 7

**Status:** RESOLVED IN CURRENT WORKTREE — `useCardCapture` now preloads the exact scorecard image sources before `react-native-view-shot` captures: background, logo, frame, scanlines, beam, active power meter, and the visible defeated person sprites. It then waits two paint frames before capture. This addresses the observed failure mode where text rendered but native image assets (brand logo + sprite) were blank in the saved card.

**Feedback:**
Single person scorecard is malformed. Where is the sprite?! Where is the branding?! It looks like all the pixel assets aren’t loading

---

## 195. Track — Checked Day Circles Should Be Removable
**Screenshot:** `store-feedback/2026-07-01T12-48-27-984Z/screenshots/ACEzNcp8OosjpnHlnu08uIo-1.jpg`
**Screen:** Track expanded platform row / day circles
**Build:** 7

**Status:** RESOLVED IN CURRENT WORKTREE — checked past/today day tiles are now tappable. Tapping a checked day removes that platform/date avoid event from local storage and updates the weekly row/scorecard totals; future days remain disabled. The visible UI stays the same, and accessibility copy now says checked days can be tapped to remove.

**Feedback:**
You can’t uncheck a box - not. A locker but we should allow the user to uncheck if they mistakenly check. Doesn’t need to affect the sprite

---

# Round 18 — 2026-07-03

Imported via `npm run feedback:apple -- --since=2026-07-01 --download-screenshots`.

Local import directory: `tools/review/store-feedback/2026-07-03T15-11-30-616Z/` (gitignored; contains tester metadata and raw attachments).

The import returned 6 new Build 7 records.

---

## 196. Info — Accordion Background Grows During Expansion
**Screenshot:** `store-feedback/2026-07-03T15-11-30-616Z/screenshots/APIYydFxwvQQTU9G4pIDpWM-1.jpg`
**Screen:** Info / FAQ accordion
**Build:** 7

**Status:** RESOLVED IN CURRENT WORKTREE — `FaqItem` now uses a non-collapsible full-width outer shell plus clipped full-width wrapper/question/answer layers. Sparkles remain outside the clipped panel shell, while the accordion background no longer paints at intrinsic width before expanding.

**Feedback:**
The background growing box at load issue from scan and track is present on the info boxes as well when you expand

---

## 197. Visual System — Glowing Lines Should Flicker
**Screenshot:** `store-feedback/2026-07-03T15-11-30-616Z/screenshots/AJykZJFESXr32tmYHBKkBy8-1.jpg`
**Screen:** Map / bottom tab chrome
**Build:** 7

**Status:** NEW DESIGN REQUEST — inventory glowing rule/beam usages before implementation so the flicker treatment is consistent and does not add noise to text-heavy panels.

**Feedback:**
Let’s make all the glowing lines (example the yellow line above menu) flicker randomly but noticeably. Let’s identify all of them in the app first

---

## 198. Track — Current-Day Avoid Should Sometimes Recover
**Screenshot:** `store-feedback/2026-07-03T15-11-30-616Z/screenshots/AKi5-s3NdMOC5M8PIzb4GD4-1.jpg`
**Screen:** Track / arena + expanded platform row
**Build:** 7

**Status:** CORE MECHANIC RESOLVED IN CURRENT WORKTREE — avoid actions still record the selected platform/date exactly once, while every queued arena hit now gets an independent 50% defeat roll. Defeated figures are visual local-day/session state and are no longer inferred from avoid history. The larger `RECOVERED` overlay, `FCK again` tooltip, and follow-up money shower remain visual polish follow-ups.

**Feedback:**
When tapping a past day they get hit but come back. Tapping the current day keeps them “hit”

But I kind of like the dynamic - let’s make half the time it doesn’t fully take them down. And shows a “RECOVERED” big across the screen. With a “FCK again” tool tip over. Again 50% chance of getting “hit mode” when. You do get a hit after this mode you get a money shower.

Research and write out the sample dynamics before implementing

---

## 199. Track — Non-Avoid Taps Should Momentarily Hit Then Recover
**Screenshot:** `store-feedback/2026-07-03T15-11-30-616Z/screenshots/AEGkLWlUWW_Bfg-nQFdaIG0-1.jpg`
**Screen:** Track / arena + expanded platform row
**Build:** 7

**Status:** CORE MECHANIC RESOLVED IN CURRENT WORKTREE — pair with #198. Focused and grid sprite taps now queue the same 50% visual defeat roll and hit FX without calling any avoid API. Recorded avoids and scorecard counts cannot be changed by direct arena taps.

**Feedback:**
Similarly to the previous - tapping them when not avoiding should momentarily put them in “hit” mode and they come back - not recording any avoids or the “recovered” mechanic but still satisfying

---

## 200. Map — Homewood Suites / Westin Not Dropping Pins
**Screenshot:** `store-feedback/2026-07-03T15-11-30-616Z/screenshots/AAtjvit-pZ3NofoC3bQbfb0-1.jpg`
**Screen:** Map / Apple Maps hotel POIs
**Build:** 7

**Status:** RESOLVED IN CURRENT WORKTREE — Homewood Suites by Hilton and Westin both exact-match bundled aliases. iOS user taps now keep the strict dynamic radius first, then run one broader 45m MapKit POI pass only if the first pass finds no curated match. This gives large hotel/property labels a second chance without widening every tap or enabling fuzzy FEC fallback.

**Feedback:**
Bug: home wood inn and suites and the Westin aren’t dropping any pins at all. Multiple taps tried was able to drop a grey pin before and after

---

## 201. Map — Sprite Tap Should Not Dismiss Open Business Card
**Screenshot:** `store-feedback/2026-07-03T15-11-30-616Z/screenshots/AHFPVPd8DN52LTKX-YfyZUU-1.jpg`
**Screen:** Map / business card with entity sprite
**Build:** 7

**Status:** PARTIAL RESOLVED IN CURRENT WORKTREE — the bug is fixed: the business-card sprite is now its own no-op `Pressable`, so tapping it no longer falls through to the dim backdrop and dismisses the card. The arena-style tap-to-hit dynamic remains a design follow-up paired with #198/#199.

**Feedback:**
When a card comes up tapping the sprite should not dismiss the card. Also bring the arena tap to hit brt bring back dynamic here

---

# Round 19 — 2026-08-15

Imported via `npm run feedback:apple -- --since=2026-07-03 --no-apple-crashes`.

Local metadata import directory: `tools/review/store-feedback/2026-08-15T15-28-34-109Z/` (gitignored; contains tester metadata and attachment URLs).

The import returned 2 new records. An attachment-enabled pull downloaded the scorecard screenshot to `tools/review/store-feedback/2026-08-15T15-28-15-349Z/`, but Apple's attachment server returned HTTP 500 for the cosmetics screenshot.

---

## 202. Scan/Data — Audit Cosmetics Company UPC Coverage
**Screenshot:** Unavailable from Apple during this pull (HTTP 500)
**Screen:** Scan / product data
**Build:** 7

**Status:** RESEARCH BACKLOG — the note does not identify a particular barcode, company, or incorrect result. Scope this as a coverage report against the bundled product and producer-research data, followed by a small fixture set of representative cosmetics UPCs. Do not add broad producer aliases without evidence because that can create false parent-company matches.

**Feedback:**
Look into a deep dive of cosmetics companies for the UPC

---

## 203. Scorecard — Reported Missing Week Was Checked Before Its Scheduled Drop
**Screenshot:** `store-feedback/2026-08-15T15-28-15-349Z/screenshots/AH3F3I4rhJ5aZ7TcXbrAkoo-1.jpg`
**Screen:** Past scorecards
**Build:** 8

**Status:** UX CLARIFIED IN CURRENT WORKTREE; VERIFY AFTER DROP — feedback was submitted at 10:26 AM CDT on Saturday, August 15. The deterministic Build 8 schedule placed that week's drop at 2:00 PM CDT, so the screenshot correctly still showed `Week of August 1, 2026` as the newest archived card. Avoids recorded around 6 PM Friday belong to `Week of August 8, 2026` and occurred before its drop.

Current code refreshes scorecard notification scheduling after an avoid write, preserves the just-completed week until capture, and routes an app launch within 48 hours after the drop to an uncaptured scorecard. No regression is established by this report. The confusing Saturday bridge now has an explicit in-app state: when the active slate has rolled to the new week but the completed week has a real card pending, Live Preview shows `LAST WEEK'S SCORECARD / DROPPING SOON` plus `NEW WEEK` above the fresh date range. It does not reveal the secret drop time and cannot appear for an empty completed week, before rollover, or after the drop. Verify that `Week of August 8, 2026` appears after 2:00 PM CDT; reopen as a defect only if it remains absent after launching the app during the pending-drop window.

**Feedback:**
Somehow the most recent week didn’t fire. I had avoids but didn’t get presented a card or see it in the history. I did it later (6ish) on Friday. What could cause it? Possible it was being presented as I was adding avoids? When was it presented this week? How can we fix this?

---

# Round 20 — 2026-08-26

Imported via `npm run feedback:apple -- --since=2026-08-15 --download-screenshots`.

Local import directory: `tools/review/store-feedback/2026-08-27T02-28-46-803Z/` (gitignored; contains tester metadata and raw attachments).

The import returned 3 records: 2 new Build 8 notes plus the already-catalogued #203 duplicate.

---

## 204. Scorecard — Historical Single-Person Card Has No Sprite
**Screenshot:** `store-feedback/2026-08-27T02-28-46-803Z/screenshots/AKY_Ge-rMByLyupQVSQirYQ-1.jpg`
**Screen:** Past scorecard for June 13–19
**Build:** 8

**Status:** ALREADY RESOLVED FOR NEW CAPTURES; HISTORICAL JPG CANNOT BE REBUILT — the screenshot is the same missing-native-image failure catalogued as #194. `useCardCapture` now preloads the logo, frame, beam, scanlines, power meter, and visible defeated sprites before capture, then waits two paint frames. The June card was captured before that fix and is a saved derivative; its raw avoid events were intentionally purged after capture, so the old image cannot be regenerated without inventing data. No new capture regression is established.

**Feedback:**
Sick isn’t showing up on the single avoid style

---

## 205. Scorecard — Historical Single-Person Card Missing Multiple Art Layers
**Screenshot:** `store-feedback/2026-08-27T02-28-46-803Z/screenshots/ABKqqjjDu20V8RC5hopZCtE-1.jpg`
**Screen:** Past scorecard for June 13–19
**Build:** 8

**Status:** DUPLICATE OF #194/#204 — the screenshot is the same already-saved June card and shows the same pre-fix capture missing the sprite, brand logo, frame, and power meter. Current capture preloading covers all of those sources. Verify the next newly generated single-person scorecard on-device; reopen only if a new post-fix card drops image layers.

**Feedback:**
And actually a LOT of stuff isn’t showing up

---

# Round 21 — 2026-08-31

Imported via `npm run feedback:apple -- --since=2026-08-27 --download-screenshots`.

Local import directory: `tools/review/store-feedback/2026-08-31T14-22-12-325Z/` (gitignored; contains tester metadata and raw attachments).

The import returned 3 records: 1 new Build 8 note plus the already-catalogued #204–#205 duplicates.

---

## 206. Beta — Public Install Inherited Beta Mode
**Screenshot:** `store-feedback/2026-08-31T14-22-12-325Z/screenshots/AK5cw45zmEtw3OxoFyDf__M-1.jpg`
**Screen:** Info with BETA/SHOTS/RESET/BUG overlay
**Build:** 8

**Status:** RESOLVED IN CURRENT WORKTREE — beta state no longer reads the legacy migratable `ff_beta_mode` Keychain item. It uses a versioned `ff_beta_mode_device_v2` item with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, preventing backup/device migration. Activation now requires seven version-label taps within three seconds plus an explicit `Enable beta tools?` confirmation. Upgrading clears/ignores the old state, so existing accidental beta installs return to production mode by default.

**Feedback:**
A friend downloaded the app and it started in beta mode
