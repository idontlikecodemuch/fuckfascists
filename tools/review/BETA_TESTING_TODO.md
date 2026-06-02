# Beta Testing TODO

Sources reviewed:
- `CLAUDE.md`
- `docs/PROGRESS.md`
- `tools/review/TESTFLIGHT_REVIEW.md`
- Current screenshots in `tools/review/cropped/`
- Current app code in `features/`, `core/`, `copy/`, `config/`

This list collapses the TestFlight review rounds into current work. Items already marked fixed in `docs/PROGRESS.md` are not repeated unless the latest screenshots show the issue still present.

## P0 - Launch Blockers

### 1. Map POI matching safety and "not on file" taxonomy

Review refs: #86, #87, #97, #105, #109, #115, #117, #121, #122, #136, #138, #139, #141, #142, #143, #149.

Current diagnosis:
- The worst fuzzy false positives are mostly addressed in current code: POI taps call `matchEntity(..., { allowFecFallback: false })`, third-party hosts like `google.com` / `facebook.com` are guarded, and regression tests cover Discount Locksmith -> Alphabet and American Association of Teachers of German -> American Airlines.
- The remaining risk is coverage/taxonomy, not just fuzzy matching. A tap can produce several different user-facing "not on file" meanings: no POI found, POI found but no entity match, entity matched but no PAC, dissolved PAC, or lookup unavailable. The UI currently collapses too many of those into "Not on file."
- First-party domain coverage is incomplete. Example: Whole Foods has `wholefoods.com`, but the tester noted `wholefoodsmarket.com`; that should be an Amazon/Whole Foods domain alias.
- Some no-PAC entities are intentionally present and should be matchable but need clearer flag/color semantics: Apple, AMC Theatres, Subway, Sephora, Match Group, Trader Joe's.
- Some entities are missing aliases/domains or entity records: Navy Federal Credit Union, Washington Plaza Hotel, Hotel AKA Washington, Grindr.

Recommended work:
- Build a Map POI regression fixture suite with the exact screenshot cases: Festival Center, Beauty Island, Northern Liberty, Discount Locksmith, American Association of Teachers of German, Whole Foods Market NOLA, AMC Courthouse Plaza 8, Apple Federal Credit Union, Sephora Clarendon, Navy Federal Credit Union.
- Split user-facing states into distinct copy and marker colors: unmatched POI, matched no-PAC entity, dissolved/inactive PAC, lookup unavailable, avoided.
- Add missing first-party domains/aliases before another device build: `wholefoodsmarket.com`, practical AMC theater names, Sephora retail location names, Navy Federal, Hotel AKA, Washington Plaza.
- Keep FEC fuzzy fallback disabled for POI taps. Manual search and barcode can remain broader.

### 2. Scorecard presentation and empty-state visual regressions

Review refs: #95, #96, #100, #107, #108, #129, #130, #145.

2026-05-24 update: New TestFlight refs #168, #173, and #174 confirmed the
same root bug: a newly-started empty live week could hide the just-finished
scored week's card. Current worktree fix extracts pure scorecard screen-state
derivation, presents an existing scored-week card even when live week is empty,
hides PREVIEW on zero-avoid empty states, and exposes Past scorecards from
`EmptyWeek`. Remaining presenter-design work (#145) is separate.

Current diagnosis:
- The capture-then-purge flow and archive exist now, so the early "no share card generated" issue should be functionally fixed.
- Latest presentation screenshot still shows the rendered card too large/left-clipped inside `CardPresentation`: `Image resizeMode="contain"` fills the host, but the captured 9:16 PNG plus absolute share button/dismiss controls need a designed presenter layout.
- `ScorecardScreen` currently shows the fixed PREVIEW stamp for both `preview` and `empty`; screenshot #130 says empty zero-avoid state should not show it.
- The empty-state starfield width issue is likely `StarField` / scorecard container sizing and should be verified on device after the presenter work.

Recommended work:
- Redesign `CardPresentation` as a centered 9:16 preview surface with explicit max width/height, safe-area padding, and share/dismiss controls outside the image bounds.
- Change `showPreviewStamp` so zero-avoid empty state does not render PREVIEW.
- Add a screenshot harness state for empty scorecard and card presentation and compare against `docs/SCORECARD_IMAGE.md`.

### 3. Beta/dev overlays interfere with screenshots and controls

Review refs: #145, #148, #149 and many feedback-detail shots.

Current diagnosis:
- The beta overlay is useful, but it covers app content in screenshots and occasionally blocks visual QA around lower-left UI.
- Toast/banner dismissal paths are inconsistent: manual `UnmatchedBanner` and business/no-PAC banners use different component paths and outside-tap behavior.

Recommended work:
- Add a beta overlay collapsed mode or move SHOTS/RESET/BUG into a small rail that avoids blocking primary content.
- Make all toast/banner/sheet surfaces dismiss on outside tap and expose one shared dismiss behavior.

## P1 - High Priority Polish

### 4. Track sprite crop, row density, and arena frame

Review refs: #52, #63, #77, #92, #93, #94, #98, #127, #131, #133, #137, #146, #147, #148, #178, #180, #181, #183.

Current diagnosis:
- Current grid cells bottom-align sprites with `justifyContent: 'flex-end'`, `TRACK_GRID_SPRITE_SCALE = 1.0`, and `TRACK_ARENA_GRID_CROP_RATIO = 0.65`. Latest screenshots still show heads close to the top edge and feet/bottoms clipped.
- Match Group now exists as an entity, but it has no associated sprite/person art path, so the row can still show an empty slot.
- Arena flicker/cyan edge is implemented, but latest feedback says the effect is too subtle and starfield/background bleed is visible around the arena edge.
- Latest Round 13 fixes in current worktree: row/group-header sprite heads moved up, defeated sprite state now resets daily, and the #151 first-paint sizing path was rehardened with fixed-stretch Track list item shells plus explicit group/day row stretch.

Recommended work:
- Reduce grid sprite scale to about `0.90-0.94`, increase top breathing room, and stop bottom-aligning grid portraits so both head and feet survive the crop.
- Add a focused Track harness screenshot for full grid and row busts, then tune constants from screenshots instead of device anecdotes.
- Add or intentionally suppress the Match Group sprite slot until an associated public figure sprite exists.
- Tighten arena frame clipping so the glow aligns to the edge and background bleed cannot show.

### 5. Scan camera close-focus limitation

Review refs: #18, #56, #85, #101, #103, #144, #182.

Current diagnosis:
- Current code already documents the limitation: Expo Camera SDK 52 exposes continuous autofocus but not macro/near-focus controls.
- The active scanner styling and centered reticle are implemented, but close-up barcode focus remains a device-camera limitation.
- Latest current-worktree copy now tells users to back up until bars are sharp and hold 6-10 inches away.
- Documented fallback path in `docs/BARCODE_SCAN_V1.md`: test a small default Expo Camera zoom first; if real-device scans are still blurry, move to a native scanner path, preferably VisionCamera for custom UI or Expo `launchScanner()` / Google Code Scanner if native scanner UI is acceptable.

Recommended work:
- Real-device test the current copy plus a small `CameraView` default zoom (`0.08`-`0.12`) before changing camera stacks.
- If close-up scanning is still a blocker, migrate the barcode sheet to VisionCamera plus its barcode scanner package so we can keep the custom HUD and gain tap-to-focus/focus metering and better zoom control.

### 6. Leadership/person donation coverage

Review refs: #86, #91, #106, #124, #125, #135, #140.

Current diagnosis:
- People-side data was improved by the April 20-22 bulk/fuzz rebuild. Tim Cook is linked to Apple and has a donation summary.
- Several entities still have no accepted `associatedPersonIds`: Trader Joe's, Bank of America, 7-Eleven, Chick-fil-A, Match Group. These are data-review tasks, not UI bugs.

Recommended work:
- Create a "Batch H leadership links" data review queue for the entities above.
- Keep owner/founder links manual-review only unless the benefit basis is clear and documented.
- After accepted links, run reconcile, people hydration, and integrity checks before testing the cards again.

## P2 - Product/Design Backlog

### 7. Map flag key and visual semantics

Review refs: #88, #105, #122, #126, #141.

Recommended work:
- Define the map key before more flag tuning:
  - Red: entity on file with donation signal.
  - Grey: matched entity, no PAC/person donation signal on file.
  - Purple/amber or outline: medium confidence / several on file.
  - Green/check: avoided today.
  - Hollow grey: unmatched tapped POI.
- Only persist avoided entity pins; keep unmatched/no-PAC ghosts session-only unless explicitly approved.
- Preserve the R/D count-up animation already implemented.

### 8. Data additions and spot checks

Review refs: #89, #91, #102, #104, #113, #116, #118, #121, #123, #134, #139, #140, #142.

Recommended work:
- Add Grindr.
- Add or verify Navy Federal Credit Union.
- Decide hospital/medical center coverage scope.
- Spot-check Chipotle, McDonald's ownership/franchise data, Red Bull/Florida's Natural scan coverage, AMC no-PAC handling, Washington Plaza/Hotel AKA coverage.
- Rebuild products after any alias/entity changes.

### 9. Onboarding / Info / Launch polish

Review refs: #46, #58, #59, #67, #78, #79, #80, #81, #114, #128.

Recommended work:
- Info copy full pass for current privacy/data behavior, especially auto-scan and avoided-pin local storage.
- Align top/bottom cyan bars and standardize header/menu divider treatment.
- Increase privacy screen text size and vertically center permissions.
- Revisit launch decoration/timing after the critical Map/Scorecard fixes.

## Done / Superseded Clusters

- Portrait orientation lock: done April 15.
- Tooltip width/progress/tail direction and beta reset replay: done April 14-15.
- Scorecard capture/archive/share mechanics: rebuilt April 14-18; current work is presenter design, not missing architecture.
- Fuzzy false-positive guard for American Airlines and third-party domain guard for Google/Facebook profile URLs: present in current tests.
- Platform setup no live reorder plus preselected-at-top behavior: implemented.
- Track week start Saturday and past-day defeated state: implemented.
- Map avoid-state daily persistence and duplicate avoid guard: implemented.
