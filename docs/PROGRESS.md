# F*ck Fascists — Progress & Current State

This document is updated continuously. New instances should read this first — it tells you where we are, what was just done, and what needs to happen next.

---

## Current Sprint: MVP V1 — Core Vertical Slice

**Overall status:** Feature-complete. Running on physical iOS device. Continuing device testing and polish.

---

## Recent Sessions (most recent first)

### Session: April 8, 2026 ET — First-use tooltip system (Map screen)
**Focus:** Replace flat HintBanner with reusable Tooltip speech-bubble component for first-use map hints.

**What changed:**

1. **`core/ui/Tooltip.tsx`** (NEW) — Reusable speech-bubble tooltip with Mario-cloud depth effect (warm grey shape offset behind white face), optional directional tail (up/down), and wiggle animation.
2. **`core/ui/useWiggleAnimation.ts`** (NEW) — Extracted wiggle animation hook: gentle vertical drift (~2.5px), slight rotation (~0.4deg), scale pulse (~1.02). 2.4s loop cycle. Respects reduced motion via `AccessibilityInfo.isReduceMotionEnabled()`.
3. **`design/tokens.ts`** — Added `tooltipFace` (#FFFFFF), `tooltipShadow` (#C8C4B8) colors and `radii.tooltip` (14).
4. **`features/Map/MapScreen.tsx`** — Swapped HintBanner for Tooltip. Per-hint positioning: search (below search bar, tail up), tap (map area offset right, no tail), barcode (bottom right, tail down toward SCAN tab). Tap-anywhere dismiss overlay reuses existing backdrop pattern.
5. **`features/Map/components/HintBanner.tsx`** (DELETED) — Replaced by Tooltip.

**Hint sequence unchanged:** search → tap → barcode, one at a time, persisted via SecureStore. Hints wait for business card dismissal before appearing.

**Tests:** All 353 tests pass (31 suites). `tsc --noEmit` clean (1 pre-existing unrelated warning in StarFieldBg).

---

### Session: April 7-8, 2026 (Animated star field background — StarFieldBg polish)
**Focus:** Shooting streaks, milky way full-width fix, more twinkle stars with edge bias, increased parallax effect.

**What changed:**
1. **ShootingStreak component** (`core/starbg/ShootingStreak.tsx`) — Electric-blue shooting stars, fully declarative reanimated (no setTimeout). 2 independent streaks per screen, ~6s interval.
2. **Milky way full-width** — Changed from `resizeMode="contain"` + constrained height to `absoluteFill` + `resizeMode="cover"`. Now fills the entire screen.
3. **More twinkle stars** — 36 (up from 28). 40% biased toward screen edges where user will notice them. Low-perf devices get 18.
4. **Increased parallax** — Tilt max offset 8→16px, scroll rates doubled, tilt rates increased across all layers.
5. **Milky way improvements** — Blue-tinted star colors, wider brightness variation, reduced band glow (stars build brightness, not glow). JPG format with baked bgVoid background (51% less GPU memory vs RGBA PNG).

### Session: April 7, 2026 ET — OFF data pipeline integration (products/barcode prefix matching)
**Focus:** Port the Open Food Facts data pipeline from `codex/data-products-off-pipeline` branch and wire in the prefix-based barcode matching that was built but never connected.

**What changed:**

1. **`assets/data/products.json`** (243 KB) — Bundled producer-prefix index with 18 runtime producers (Pepsico, Coca-Cola, Starbucks, General Mills, Mars, Kraft Heinz, Tyson, etc.) derived from scanning 4.4M OFF products. All 18 entity IDs validated against current `entities.json`.
2. **`features/Map/barcode/productIndex.ts`** — Prefix-based barcode → producer matching module. Parses bundled products.json, normalizes prefixes, matches against barcode candidates (UPC-A, GTIN-13, display code). Returns best match (longest prefix wins).
3. **Wired prefix fast path into `useBarcodeSearch`** — NEW: After barcode normalization, checks bundled prefix index *before* cache or network. Instant match for 18 major CPG producers' products with zero async work. Unknown barcodes fall through to existing cache → OFF API → entity matching flow.
4. **`ScanContext.source`** — Added `'bundled_prefix'` to source union in `features/Map/types.ts`.
5. **`copy/scan.ts`** — Added `prefixMatchSource` label for bundled prefix matches.
6. **`scripts/sync-products-from-off.py`** — Pipeline script (from OFF branch) that processes the OFF MongoDB bulk dump into products.json with resumable checkpoints.
7. **`docs/PRODUCTS_DATA_PIPELINE.md`** — Full pipeline documentation (from OFF branch).
8. **CLAUDE.md** — Updated: removed "on codex branch" notes, added pipeline script docs, updated repo structure, added sprint status entry.
9. **Tests** — 6 new tests for `productIndex` (prefix matching, longest-prefix priority, orphan entity skip, GTIN-13 fallback). All 353 tests pass (31 suites).

**Key architectural note:** The OFF branch had `productIndex.ts` built but never imported anywhere — the prefix lookup was not wired into `useBarcodeSearch`. This session completed that integration. The scan flow is now: normalize → prefix index (instant) → cache → OFF API → entity matching.

**Tests:** All 353 tests pass (31 suites). `tsc --noEmit` clean (1 pre-existing unrelated warning in StarFieldBg).

---

### Session: April 7, 2026 ET — P2 Track polish, StarFieldBg, beta testing fixes, map auto-scan
**Focus:** Track screen UX polish batch, replace GIF star background with StarFieldBg parallax system, beta testing fixes (scan copy, tab label, nudge layout, ghost markers), map proximity auto-scan.

**What changed:**

**P2 Track screen polish:**
1. **Saturday week start + current day highlight** — `getLocalWeekStart()` returns Saturday (was Monday). Day labels S S M T W T F. Current day column shaded background. Fixed latent UTC date bug in `isToday`.
2. **Arena background randomizes per platform** — Per-figure arena background cached for the session. Arena helpers extracted to `arenaHelpers.ts`.
3. **Past day avoid triggers defeated sprite** — `recentlyDefeated` Set in TrackContext flashes defeated state for `ARENA_HIT_FX_MS` on any avoid.
4. **Remove branch symbol, tighten child row padding** — Removed `childGuide` L-shape. Child row padding 4px (parent 8px).

**StarFieldBg parallax system (replaces bg_stars.gif):**
5. **`core/starbg/`** — 6 files: `StarFieldBg.tsx` (4-layer parallax: base texture, milky way, galaxies/rocks, twinkle stars), `useStarLayout.ts` (seeded PRNG), `useParallax.ts` (tilt + scroll), `starbgAssets.ts`, `starbgConstants.ts`, `index.ts`.
6. **`assets/pixel/starbg/`** — 23 assets (5 galaxies, 5 rocks, 6 milky ways, 1 base texture).
7. **InfoDecorations** re-exports `StarFieldBg as StarField`. Old GIF-based `StarField` deleted.
8. **OnboardingSlide** uses `StarFieldBg` directly with per-step seed. Hardcoded STARS array removed.
9. All consumers get unique seeds: `"info"`, `"track"`, `"platform-setup"`, `"onboard-{N}"`.
10. `STARBG_PARALLAX_ENABLED` added to `config/constants.ts`.

**Beta testing fixes:**
11. **Scan error copy — Clark voice pass** — Each error state (not in database, no entity match, network failure, unreadable barcode) now has distinct, actionable messaging per the Voice Framework.
12. **Tab label** — `"SCAN BETA"` → `"SCAN"` with `"(BETA)"` qualifier beneath.
13. **Nudge banner z-order** — Now position absolute + zIndex 10 + safe area inset, overlays map content instead of displacing viewport.
14. **No-match ghost marker** — Removed 2.5s fade-out. Grey marker persists until tab switch / unmount. Not tappable. Component state only — no coordinate storage.

**Map:**
15. **Auto-scan on map open** — POI search at user's coordinates when location resolves. Session-only. **Copy update needed:** Info/FAQ should disclose auto-scan behavior.

**Tests:** All 347 tests pass (30 suites).

---

### Session: April 6, 2026 ET (inherently partisan staging pass integrated; reports stamped 2026-04-07 UTC)
**Focus:** Finish the staging-only inherently partisan pass, keep the implementation bulk-first and compact, fold the new rows into the people/entities preview outputs, and hydrate the reviewed live files only after the final pass cleared review.

**What changed:**
1. **A dedicated inherently partisan staging helper/report landed** — added [`scripts/lib/inherentlyPartisanSources.mjs`](/Users/christophershannon/fuckfascists/scripts/lib/inherentlyPartisanSources.mjs) plus [`scripts/build-inherently-partisan-staging-report.mjs`](/Users/christophershannon/fuckfascists/scripts/build-inherently-partisan-staging-report.mjs). This is the shared staging source for:
   - inaugural Form `F13` receipts
   - entity-side national party special-account giving
2. **The Form 13 pass now follows the bulk-light / API-fallback rule the user wanted** — inaugural discovery starts from `GET /filings?form_type=F13`, prefers filing CSVs when they exist, and only falls back to `schedule_a` API pagination for weird cases like the 2018 inaugural committee, whose current filings do not expose usable CSV coverage.
3. **The national party-account rule was tightened around real bulk behavior** — after checking local `oth*.txt` shapes, the branch no longer assumes one clean transaction-code family for all special-account rows. The current staging rule is:
   - use `MEMO_TEXT` and, when needed, the raw `NAME` field to detect `CONVENTION ACCOUNT`, `HEADQUARTERS ACCOUNT`, `RECOUNT ACCOUNT`, `BUILDING FUND`, and `HQ ACCOUNT`
   - verify with recipient committee structure (`CMTE_ID` / `OTHER_ID`, `CMTE_TP=Y`, major-party affiliation from `cm*.txt`)
   - only treat `30* / 31* / 32*` codes as a hard stop when they explicitly contradict the detected account type
4. **False-positive party-account committees were eliminated** — candidate committees were being picked up early on because memo text alone was too loose. Requiring `CMTE_TP=Y` for discovered party-account recipients removed those false positives and left the national party committees only.
5. **The inherently partisan staging report is now populated with real results** — generated:
   - [`tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.json)
   - [`tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.md)
   - [`tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.people.rows.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.people.rows.json)
   - [`tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.entities.rows.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.entities.rows.json)
   with:
   - inaugural people matched: `$25,109,995.20` across `89` rows / `88` people
   - inaugural entities matched: `$71,618,222.54`
   - entity-side party accounts matched: `$11,947,900`
   - combined entity inherently partisan additions: `$83,566,122.54`
   - party-account QA noise reduced from `329` mismatches down to `89`
6. **People preview now consumes inherently partisan rows directly** — updated [`scripts/build-people-classification-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-people-classification-preview.mjs) so it:
   - still reclassifies `O -> R/D` committee-cycle rows from the beneficiary map
   - also appends compact inherently partisan rows from the staged F13 report
   - rebuilds donation summaries from raw rows so `recentCycle`, `activeCycles`, and ongoing-cycle totals stay correct when `2026` inaugural rows are introduced
7. **People preview now reflects the inaugural add-on** — regenerated [`tools/fec-bulk/reports/people-classification-preview-2026-04-07.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/people-classification-preview-2026-04-07.md) and companions with:
   - reclassified move to `R`: `$285,334,834`
   - reclassified move to `D`: `$300,853,668`
   - inherently partisan add to `R`: `$18,775,000`
   - inherently partisan add to `D`: `$6,334,995.20`
   - preview `totalO`: `$243,407,302` (`4.19%`)
   - current people summary-vs-raw drift now surfaced explicitly: `$2,160,071` across `328` people, with preview drift reduced to `0`
   - fallback-only formal / candidate committee cycles observed in `people.json` are now seeded into the committee map, so zero-evidence fallback rows no longer disappear before hydration
   - raw shape stays compact on the people side: `145,451 -> 145,540` rows, about `+40,858` compact/minified bytes
   - donor spot-checks are now row-identity based, so added / reclassified spotlight rows no longer depend on raw-array sort order
8. **Entities preview now consumes inherently partisan rows without bloating `raw[]`** — updated [`scripts/build-entities-classification-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-entities-classification-preview.mjs) so the staged entity preview:
   - still uses the compact line-`23` rehydration flow for PAC movement
   - folds inherently partisan entity rows into `totalRepubs` / `totalDems`, `recentCycle`, `recentRepubs`, `recentDems`, and `activeCycles`
   - deliberately keeps `raw[]` as unresolved / excluded remainder only
9. **Entities preview now includes inaugural + party-account additions** — regenerated [`tools/fec-bulk/reports/entities-classification-preview-2026-04-07.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/entities-classification-preview-2026-04-07.md) and companions with:
   - preview `totalRepubs`: `$378,495,714.88`
   - preview `totalDems`: `$245,517,046.96`
   - preview `totalOther`: `$183,129,052.22`
   - inherently partisan add to `R`: `$52,719,139.23`
   - inherently partisan add to `D`: `$17,205,233.84`
   - ongoing inherently partisan `2026` source: `$46,952,927.41`
   - `71` entities affected by inherently partisan additions
   - display totals now exclude PAC lines `21B` / `28A` while keeping those rows in `raw[]` for audit
10. **Final review tightened entity inaugural name coverage without bloating shipped raw** — expanding the inherently partisan org-name normalizer to treat generic corporate tails like `SERVICES`, `PRODUCTS`, `FINANCIAL`, `MANAGEMENT`, and `COMPANIES` as strip-safe suffixes recovered another `$9.01M` of inaugural entity matches, including tracked rows for:
   - `AT&T`
   - `Chevron`
   - `Anheuser-Busch InBev`
   - `BlackRock`
   while leaving the shipped entity `raw[]` plan unchanged: inherently partisan dollars still stay summary-first and unresolved PAC remainder still stays compact
11. **Live data hydration completed from the reviewed staging previews** — rewrote:
   - [`assets/data/people.json`](/Users/christophershannon/fuckfascists/assets/data/people.json)
   - [`assets/data/entities.json`](/Users/christophershannon/fuckfascists/assets/data/entities.json)
   - [`assets/data/people.bundle.json`](/Users/christophershannon/fuckfascists/assets/data/people.bundle.json)
   using the reviewed `2026-04-07` preview artifacts, not the legacy live fetch scripts.
   - hydrated people totals: `R $2,747,853,244`, `D $2,824,724,839.20`, `O $243,407,302`
   - hydrated entity totals: `R $378,495,714.88`, `D $245,517,046.96`, `O $183,129,052.22`
   - `people.bundle.json` was regenerated via [`scripts/strip-people-raw.mjs`](/Users/christophershannon/fuckfascists/scripts/strip-people-raw.mjs) in default `linked-only` mode after the live people rewrite
   - live `people.json` / `entities.json` now match the reviewed preview files byte-for-byte at the JSON object level
12. **Low-risk script refactor pass completed for handoff cleanliness** — extracted shared helper/report modules under [`scripts/lib/data-classification/`](/Users/christophershannon/fuckfascists/scripts/lib/data-classification/common.mjs), brought the simple top-level report entry scripts back under the 250-line rule, and documented a narrow [`CLAUDE.md`](/Users/christophershannon/fuckfascists/claude.md) exception for maintainers-only bulk/report scripts whose auditability would be hurt by forced fragmentation.

**Verification:**
- `node --check scripts/lib/inherentlyPartisanSources.mjs`
- `node --check scripts/build-inherently-partisan-staging-report.mjs`
- `node scripts/build-inherently-partisan-staging-report.mjs`
- `node --check scripts/build-people-classification-preview.mjs`
- `node scripts/build-people-classification-preview.mjs`
- `node --check scripts/build-entities-classification-preview.mjs`
- `node scripts/build-entities-classification-preview.mjs`

**Next likely step:** treat the hydrated `2026-04-07` assets as the app/source-of-truth data for this methodology, harden the legacy fetch/hydration paths so they cannot silently overwrite these reviewed totals, and leave the remaining unmatched inaugural aliases (for example `PILGRIM'S PRIDE`, `RIPPLE LABS`, and `THE DOW CHEMICAL COMPANY`) as a later follow-up.

### Session: April 6, 2026 (Form 13 inaugural donation research + branch docs update)
**Focus:** Verify how inaugural-committee donations should enter the data pipeline, keep the approach repeatable without hardcoded inauguration names, and record the decision path in the staging docs before the full run.

**What changed:**
1. **Official FEC sources were checked for the right reporting surface** — confirmed via the [FEC Form 13 PDF](https://www.fec.gov/pdf/forms/fecfrm13.pdf) and [FEC inaugural-funding guidance](https://www.fec.gov/help-candidates-and-committees/presidential-transition-and-inauguration/funding-inaugural-committee-activities/) that inaugural committees file `F13`, and political-committee donations to them are disclosed on Schedule B line `29`.
2. **Live API tests confirmed the minimal discovery path** — the reliable generic entry point is `GET /filings?form_type=F13`, which returns inaugural committee filings without knowing the committee names ahead of time. The user explicitly chose this simpler route instead of making `cycle` part of the required discovery query.
3. **Recipient-side donation rows were verified** — `GET /schedules/schedule_a?committee_id=...` for an inaugural committee returns the actual incoming donation rows with `filing_form: F13`. That gives a repeatable source for donor-level inauguration receipts after committee discovery.
4. **One tempting shortcut was ruled out** — a global `schedule_a?filing_form=F13` query was not reliable enough in testing, so the agreed shape is:
   - discover inaugural committees from `filings?form_type=F13`
   - then fetch `schedule_a` by those committee IDs
5. **Party assignment needs a deliberate rule** — inaugural committees are inherently partisan, but FEC committee metadata often leaves their `party` blank. The branch docs now treat party assignment as an inaugural-cycle decision, not a committee-master-party decision.
6. **Current pipeline gap is now documented** — [`scripts/fetch-donation-data.mjs`](/Users/christophershannon/fuckfascists/scripts/fetch-donation-data.mjs) currently filters PAC recipients to `H/S/P`, so it excludes inaugural committees entirely. [`scripts/fetch-people-data.mjs`](/Users/christophershannon/fuckfascists/scripts/fetch-people-data.mjs) may incidentally catch some inaugural donations by contributor-name search, but it does not run an explicit auditable `F13` pass today.
7. **Compact shipped-data guidance was clarified** — discovery should stay minimal, but the final hydrated data should still preserve `cycle` for inaugural rows because the app is "since 2016" and the full run needs ongoing cycles kept distinct. The rule is: do not require `cycle` to discover `F13`, but do preserve `cycle` in the shipped compact raw shape when it is needed for attribution.
8. **Branch docs were refreshed for handoff and parallel work** — updated [`docs/DATA_CLASSIFICATION_STAGING.md`](/Users/christophershannon/fuckfascists/docs/DATA_CLASSIFICATION_STAGING.md) and [`docs/HANDOFF_DATA_CLASSIFICATION_2026-04-06.md`](/Users/christophershannon/fuckfascists/docs/HANDOFF_DATA_CLASSIFICATION_2026-04-06.md) so another agent can pick this up without redoing the API research.

**Verification:**
- Official web verification:
  - [FEC Form 13 PDF](https://www.fec.gov/pdf/forms/fecfrm13.pdf)
  - [FEC inaugural committee funding guidance](https://www.fec.gov/help-candidates-and-committees/presidential-transition-and-inauguration/funding-inaugural-committee-activities/)
  - [FEC receipts data overview](https://www.fec.gov/campaign-finance-data/about-campaign-finance-data/about-receipts-data/)
- Live FEC API checks:
  - `GET /filings?form_type=F13`
  - `GET /filings?committee_id=<inaugural_committee_id>&form_type=F13`
  - `GET /schedules/schedule_a?committee_id=<inaugural_committee_id>`

**Next likely step:** implement a staging-only inaugural pass that:
- discovers inaugural committees from `F13` filings
- pulls donation receipts from `schedule_a` by committee ID
- assigns partisan totals by inaugural cycle
- keeps any shipped raw evidence compact and cycle-aware

### Session: April 6, 2026 (staged preview passes for people + PAC entities)
**Focus:** Turn the beneficiary map into reviewable staging previews for `people.json` and `entities.json`, tighten the QA reporting, and keep the PAC raw shape compact enough for eventual app bundling.

**What changed:**
1. **Committee QA output made materially more reviewable** — updated [`scripts/build-committee-beneficiary-map.mjs`](/Users/christophershannon/fuckfascists/scripts/build-committee-beneficiary-map.mjs) so it now:
   - flags **all** April 3 manual recommendation mismatches, not only `leave unclassified -> R/D`
   - carries `committeeName` through the finalized committee-cycle output
   - prints names and mismatch types directly in the markdown QA sections
2. **People rewrite preview added** — created [`scripts/build-people-classification-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-people-classification-preview.mjs), which rewrites `people.json` into a staging-only preview under `tools/fec-bulk/reports/` without touching the live bundled file.
3. **People preview matches the earlier projection** — generated:
   - [`tools/fec-bulk/reports/people-classification-preview-2026-04-06.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/people-classification-preview-2026-04-06.json)
   - [`tools/fec-bulk/reports/people-classification-preview-2026-04-06.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/people-classification-preview-2026-04-06.md)
   - [`tools/fec-bulk/reports/people-classification-preview-2026-04-06.people.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/people-classification-preview-2026-04-06.people.json)
   with:
   - move to `R`: `$285,278,285`
   - move to `D`: `$300,786,005`
   - preview `totalO`: `$245,691,585` (`4.24%`)
   - Jeff Bezos still fully unresolved to `WITH HONOR FUND`
4. **PAC line 23 rehydration preview added** — created [`scripts/build-pac-line23-rehydration-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-pac-line23-rehydration-preview.mjs), which uses `oth*.txt` plus the committee-cycle map to recover recipient-level line `23` rows in a compact aggregated form.
5. **PAC source picture is now quantified** — generated:
   - [`tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.json)
   - [`tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.md)
   - [`tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.rows.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.rows.json)
   with:
   - OTH `24K` total: `$632,270,581`
   - raw-equivalent line `23`: `$170,833,963`
   - projected move to `R`: `$90,209,827`
   - projected move to `D`: `$67,421,956`
   - projected stay `O`: `$13,202,180`
6. **Compact staged entities rewrite preview added** — created [`scripts/build-entities-classification-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-entities-classification-preview.mjs), which:
   - moves reclassified line `23` dollars into `totalRepubs` / `totalDems`
   - preserves `raw[]` as unresolved / excluded remainder only
   - keeps `cycle` plus `recipientCommitteeId` on unresolved line `23` rows
   - stores `totalOther` / `recentOther` directly in the preview summaries
   - includes ongoing cycle `2026` source rows as staging additions instead of throwing them away
7. **Entity preview stays reasonably compact** — generated:
   - [`tools/fec-bulk/reports/entities-classification-preview-2026-04-06.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/entities-classification-preview-2026-04-06.json)
   - [`tools/fec-bulk/reports/entities-classification-preview-2026-04-06.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/entities-classification-preview-2026-04-06.md)
   - [`tools/fec-bulk/reports/entities-classification-preview-2026-04-06.entities.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/entities-classification-preview-2026-04-06.entities.json)
   showing:
   - preview `totalRepubs`: `$325,776,575.65`
   - preview `totalDems`: `$228,311,813.12`
   - preview `totalOther`: `$187,756,224.63`
   - ongoing-cycle `2026` line `23` added: `$20,765,335`
   - `raw[]` rows: `1,897 -> 3,975`
   - `entities.json` bytes: `732,800 -> 1,210,184`
   - `134` entities now surface `recentCycle: 2026` in the preview
8. **Important PAC caveat is now explicit** — the staged entity preview still needs to preserve about `$21.01M` in legacy unresolved line `23` rows because `oth*.txt` `24K` evidence does not yet fully backfill every historical bundled line `23` dollar. Another `$1.82M` of historic source rows lacks a matching current control row and is intentionally not forced into the preview.

**Verification:**
- `node --check scripts/build-committee-beneficiary-map.mjs`
- `node scripts/build-committee-beneficiary-map.mjs`
- `node --check scripts/build-people-classification-preview.mjs`
- `node scripts/build-people-classification-preview.mjs`
- `node --check scripts/build-pac-line23-rehydration-preview.mjs`
- `node scripts/build-pac-line23-rehydration-preview.mjs`
- `node --check scripts/build-entities-classification-preview.mjs`
- `node scripts/build-entities-classification-preview.mjs`

**Next likely step:** review the staged `people` and `entities` previews as the write gate, decide whether the remaining PAC legacy-residual line `23` bucket is acceptable for a first live rewrite, then only after that overwrite `assets/data/people.json`, `assets/data/entities.json`, and regenerate `assets/data/people.bundle.json`.

### Session: April 6, 2026 (data-classification handoff prepared)
**Focus:** Package the staging-branch setup, rules, and current findings into a clean handoff for a fresh instance without redoing the setup work.

**What changed:**
1. **Dedicated handoff doc added** — created [`docs/HANDOFF_DATA_CLASSIFICATION_2026-04-06.md`](/Users/christophershannon/fuckfascists/docs/HANDOFF_DATA_CLASSIFICATION_2026-04-06.md) with:
   - the branch and guardrails
   - the files and scripts that belong to this data-classification track
   - the current verified baseline and beneficiary-projection numbers
   - the no-floor classification rule and QA posture
   - the next recommended steps for staged `people.json` preview and PAC `line 23` rehydration
2. **Fresh-context pickup path clarified** — the handoff explicitly tells the next instance which docs and scripts to read first, and warns about the unrelated dirty worktree so the cleanup work stays scoped and non-destructive.

**Verification:**
- Handoff content was reconciled against:
  - [`docs/DATA_CLASSIFICATION_STAGING.md`](/Users/christophershannon/fuckfascists/docs/DATA_CLASSIFICATION_STAGING.md)
  - [`docs/BENEFICIARY_CLASSIFICATION_SPEC.md`](/Users/christophershannon/fuckfascists/docs/BENEFICIARY_CLASSIFICATION_SPEC.md)
  - [`scripts/build-data-classification-staging-report.mjs`](/Users/christophershannon/fuckfascists/scripts/build-data-classification-staging-report.mjs)
  - [`scripts/build-committee-beneficiary-map.mjs`](/Users/christophershannon/fuckfascists/scripts/build-committee-beneficiary-map.mjs)

**Next likely step:** have the fresh instance read the new handoff doc, then build the staged `people.json` rewrite preview before touching any live bundled data files.

### Session: April 6, 2026 (beneficiary classification spec + staged committee-cycle map)
**Focus:** Turn the beneficiary-lens idea into a documented rule set and a staging-only committee-cycle classifier using the newly added FEC bulk files, without rewriting `people.json` or `entities.json`.

**What changed:**
1. **Beneficiary spec added** — created [`docs/BENEFICIARY_CLASSIFICATION_SPEC.md`](/Users/christophershannon/fuckfascists/docs/BENEFICIARY_CLASSIFICATION_SPEC.md) to define the active staging rules:
   - classify by `committeeId + cycle`
   - no minimum floor
   - `>= 80%` beneficiary threshold
   - formal FEC major-party codes and candidate-committee links remain fallback sources
   - April 3, 2026 manual verification remains QA-only, not the decision engine
2. **Staging workflow doc updated** — updated [`docs/DATA_CLASSIFICATION_STAGING.md`](/Users/christophershannon/fuckfascists/docs/DATA_CLASSIFICATION_STAGING.md) to reflect the beneficiary approach, the new federal input files, and the PAC rehydration plan via `oth*.txt`.
3. **New bulk files integrated locally** — unpacked the downloaded `cn*.zip` candidate masters into `tools/fec-bulk/cn16/` through `cn26/` and unpacked `oth*.zip` into `tools/fec-bulk/oth16/` through `oth26/` for local staging use. These remain under the gitignored bulk-data tree.
4. **Committee-cycle classifier added** — created [`scripts/build-committee-beneficiary-map.mjs`](/Users/christophershannon/fuckfascists/scripts/build-committee-beneficiary-map.mjs), which streams:
   - `cn*/cn.txt`
   - `ccl*.txt`
   - `cm*.txt`
   - `itpas2*.txt`
   - `oth*/itoth.txt`
   and builds committee-cycle classifications plus a projected `people.json` reclassification summary without mutating app data.
5. **Beneficiary report generated** — wrote:
   - [`tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-06.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-06.json)
   - [`tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-06.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-06.md)
6. **People-side projection now hits the target on paper** — the staged classifier projects:
   - current `totalO`: `$831,755,875`
   - projected move to `R`: `$285,278,285`
   - projected move to `D`: `$300,786,005`
   - projected `totalO`: `$245,691,585` (`4.24%`)
7. **Jeff Bezos edge case still preserved** — the staged projection leaves Jeff Bezos’s `$10,129,170` to `WITH HONOR FUND, INC.` in `O`, matching the intended “classify correctly or leave `O`” rule.
8. **New QA risk layer added** — the beneficiary report now includes:
   - **QA conflicts** where the new system disagrees with prior “leave unclassified” calls
   - **Thin evidence review** where a committee reclassifies large unresolved dollars from small scoreable federal evidence (for example `TEAM KENNEDY` and `MISSOURI STANDS UNITED`)
9. **PAC input picture clarified** — the staged classifier sees:
   - `$15.81B` PAS2 scoreable beneficiary evidence
   - `$6.58B` OTH candidate-committee proxy evidence
   - `$21.55B` OTH committee-to-committee edge dollars still unscored because the recipient is not a candidate committee
   This confirms `OTH` is the right PAC rehydration source, but also that a large non-candidate committee graph remains outside the first-pass beneficiary scorer.

**Verification:**
- `node --check scripts/build-committee-beneficiary-map.mjs`
- `node scripts/build-committee-beneficiary-map.mjs`

**Next likely step:** use the generated committee-cycle map to build a staging-only rewrite preview for `people.json`, then design the PAC `line 23` rehydration pass from `oth*.txt`, while keeping thin-evidence committees and old manual conflicts in a mandatory review queue before any final overwrite.

### Session: April 6, 2026 (data classification staging branch + non-destructive audit)
**Focus:** Isolate the PAC/people classification cleanup on its own branch, document the verified constraints, and measure the current buckets without rewriting the live data files.

**What changed:**
1. **Dedicated staging branch created** — started `codex/data-classification-staging` so the cleanup work can stay isolated from unrelated feature work until the final verification pass is ready.
2. **Workflow documented** — added [`docs/DATA_CLASSIFICATION_STAGING.md`](/Users/christophershannon/fuckfascists/docs/DATA_CLASSIFICATION_STAGING.md) with the branch guardrails, staged workflow, and the current verified constraints:
   - people-side `committeeParty: null` rows are also blank in local `cm*.txt`, so committee-master lookup alone will not recover the remaining `$805.45M`
   - PAC `raw[]` rows no longer retain recipient committee IDs, so line `23` cannot be reclassified in place from `entities.json`
   - line `21B` and `28A` should be excluded from displayed political-donation totals
3. **Staging-only audit script added** — created [`scripts/build-data-classification-staging-report.mjs`](/Users/christophershannon/fuckfascists/scripts/build-data-classification-staging-report.mjs), which reads the current bundled data plus local committee masters and the April 3 verification report, then writes markdown + JSON reports without mutating `assets/data/*.json`.
4. **Baseline report generated** — wrote:
   - [`tools/fec-bulk/reports/data-classification-staging-2026-04-06.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/data-classification-staging-2026-04-06.md)
   - [`tools/fec-bulk/reports/data-classification-staging-2026-04-06.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/data-classification-staging-2026-04-06.json)
5. **Verified current baseline** — the staging report confirms:
   - `people.json` current `totalO`: `$831,755,875` (`14.36%`)
   - people unresolved overlap already covered by the April 3 manual report is now concentrated in committees intentionally left unclassified
   - `entities.json` PAC raw amount: `$322,623,757.63`
   - PAC excluded non-donation lines `21B + 28A`: `$4,627,172.41`
   - stored PAC `totalOther` count: `0 of 190` entities with donation summaries
6. **Jeff Bezos spot-check preserved** — current staging report shows Jeff Bezos with `$10,129,170` unresolved to `WITH HONOR FUND, INC.`, which remains an intentional `O` candidate unless new evidence justifies a different classification.

**Verification:**
- `node --check scripts/build-data-classification-staging-report.mjs`
- `node scripts/build-data-classification-staging-report.mjs`

**Next likely step:** build staging-only committee override inputs for the still-unresolved people committees, then design the PAC rehydration path that preserves recipient committee IDs before any final rewrite of `entities.json` or `people.json`.

### Session: April 3, 2026 (P1 device testing fixes batch)
**Focus:** Five device-testing bugs: Track screen CEO names, arena sprites, map avoid state, barcode scanner, entity alias gaps.

**What changed:**

1. **P1-A: CEO name on parent company group headers** — `PlatformGroupHeader` now shows the CEO/public figure name as a subtitle beneath the company short name, matching how singleton `PlatformRow` displays it. Uses same font/color tokens.

2. **P1-B: Arena sprite filtering** — `GameArena` grid mode now filters out figures without sprites; grid cell sizing uses the filtered count. Single-character mode skips the `Pressable` when no sprite exists. Added `hasSprite()` utility to `core/sprites/spriteLoader.tsx`.

3. **P1-C: Map avoid state — one avoid per entity per day** — Added `entity_avoid_pins` SQLite table to persist avoided pin coordinates locally (encrypted, auto-purged daily). Map hydrates today's avoided markers on mount. `handleAvoid` checks `avoidedTodayRef` to prevent duplicate avoids. `handleNewResult` opens card in post-avoid state for already-avoided entities. Tap pins inherit avoided state from today's avoids. **PRIVACY RELAXATION:** Coordinates now stored locally for avoided entities only — see Known Limitations in CLAUDE.md.

4. **P1-D: Barcode scanner error messaging + autofocus** — Distinguished "product not in database" (`not_in_database`) from "product found but no entity match" (`no_match`) and "network error" (`lookup_unavailable`). Added `barcodeNotInDatabase` copy key. Added `autofocus="on"` to `CameraView` for close-range scanning.

5. **P1-E: Shell and Sunoco entity fixes** — Added `"Shell Gas Station"`, `"Shell Station"`, `"Shell Service Station"` aliases to Shell entity. Added new `sunoco` entity (Sunoco LP, `parentEntityId: "energy-transfer"`, `fecCommitteeId: ""` — needs `verify:entities` run).

**Pipeline tasks needed:**
- Run `npm run verify:entities` for Sunoco to find FEC committee ID
- Run `npm run fetch:donations` for Sunoco after verification

**Files changed:**
- `features/Platforms/components/PlatformGroupHeader.tsx` (P1-A)
- `core/sprites/spriteLoader.tsx` (P1-B)
- `features/Platforms/components/GameArena.tsx` (P1-B)
- `core/data/schema.ts`, `core/data/adapters.ts`, `core/data/eventStore.ts`, `core/data/index.ts` (P1-C)
- `core/models/events.ts`, `core/models/index.ts` (P1-C)
- `app/storage/SqliteAdapter.ts`, `extension/storage/ChromeStorageAdapter.ts` (P1-C)
- `features/Map/MapScreen.tsx`, `features/Map/types.ts`, `features/Map/components/MapMarker.tsx` (P1-C)
- `features/Map/hooks/useTapSearch.ts` (P1-C)
- `copy/map.ts` (P1-D)
- `features/Map/hooks/useBarcodeSearch.ts`, `features/Map/barcode/openFoodFacts.ts` (P1-D)
- `features/Map/components/BarcodeLookupBanner.tsx`, `features/Map/components/BarcodeScannerSheet.tsx` (P1-D)
- `assets/data/entities.json` (P1-E)
- `CLAUDE.md` (privacy relaxation docs)
- Test mocks updated: `core/data/__tests__/cacheStore.test.ts`, `core/data/__tests__/eventStore.test.ts`, `features/Scorecard/data/__tests__/aggregateScorecard.test.ts`

### Session: April 3, 2026 (PlatformSetupScreen visual redesign)
**Focus:** Redesign platform setup/selection screen to match game UI design language.

**What changed:**

1. **PlatformSetupScreen — 2-column grid layout:** Replaced single-column FlatList of full-height cards with a compact 2-column grid (`numColumns={2}`). Each cell shows only a checkbox and platform name — removed parent company line, CEO name, and category tags. Selected platforms sort to the top by `sortOrder`.
2. **Star field background:** Added `StarField` (from InfoDecorations) behind the grid. Cells have opaque backgrounds so stars show in the gaps.
3. **Neon rule:** Added blue `NeonRule` divider below the header subtitle.
4. **Beveled grid cells:** Unselected cells use grey `bevelRaised` with `panelInner` background and `textSecondary` name. Selected cells use green `bevelGreenRaised` with `successGreenDeep` background, 4px `successGreenText` left accent bar, and `textPrimary` name.
5. **Beveled checkboxes:** Unselected: `bevelInset` with dark fill. Selected: `bevelGreenInset` with green checkmark.
6. **Amber DONE button:** `bevelAmberRaised` with `rewardYellow` fill, `theme.radii.button` corners, `SparkleDecoration` (default variant, 3 sparks top-right) when enabled.
7. **New bevel style:** Added `bevelGreenRaised` export to `design/bevel.ts` — `successGreenBright` top/left, `successGreenDeep` bottom/right.

**What did NOT change:** Selection logic, persistence, data flow, copy strings, navigation, accessibility roles/labels.

**Files changed:**
- `features/Platforms/components/PlatformSetupScreen.tsx` — full visual rewrite
- `design/bevel.ts` — added `bevelGreenRaised`

### Session: April 3, 2026 (people entity override workflow + review queue)
**Focus:** Make `people.json` maintainable for entity-link review by separating human-reviewed link decisions from generated donor data and creating a triage queue for unresolved high-priority donors.

**What changed:**
1. **Accepted-link source file added** — created [`scripts/data/people-entity-overrides.json`](/Users/christophershannon/fuckfascists/scripts/data/people-entity-overrides.json) as the human-reviewed source of truth for person→entity relationship overrides, including `role`, `benefitBasis`, `isCurrent`, optional `ownershipPct`, `confidence`, and `notes`.
2. **Shared override normalizer added** — created [`scripts/lib/peopleEntityOverrides.mjs`](/Users/christophershannon/fuckfascists/scripts/lib/peopleEntityOverrides.mjs) so both sync pipelines normalize relationship records the same way and infer `benefitBasis` / `isCurrent` consistently.
3. **Bulk-top sync now uses override data** — updated [`scripts/sync-people-from-bulk-top.mjs`](/Users/christophershannon/fuckfascists/scripts/sync-people-from-bulk-top.mjs) to load curated overrides from the new source file instead of relying only on hardcoded relationship maps.
4. **Legacy API sync kept aligned** — updated [`scripts/fetch-people-data.mjs`](/Users/christophershannon/fuckfascists/scripts/fetch-people-data.mjs) to honor the same override file, so the API path and bulk path no longer drift on relationship metadata.
5. **Manual review queue added** — created [`scripts/build-people-entity-review-queue.mjs`](/Users/christophershannon/fuckfascists/scripts/build-people-entity-review-queue.mjs) plus `npm run build:people:entity-review-queue` to produce [`tools/fec-bulk/reports/people-entity-review-queue.json`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/people-entity-review-queue.json), ordered by top unlinked donors first.
6. **Queue heuristics tightened** — refined the candidate-matching pass to prefer exact or distinctive employer/entity alias overlap and stop surfacing junk one-token matches like `america`, `general`, or `florida`.
7. **Generated donor file refreshed** — reran the bulk-top sync so [`assets/data/people.json`](/Users/christophershannon/fuckfascists/assets/data/people.json) now reflects the override workflow and enriched relationship records. Current summary: `997` people, `86` linked people, `72` unique linked entities, `4` declared forward refs, and `976` hydrated people.
8. **First manual curation wave landed** — added high-confidence reviewed links for Isaac Perlmutter → Disney, Seth Klarman → Baupost Group, J.B. Pritzker → Pritzker Group, John W. Childs → J.W. Childs Associates, and Robert Bigelow → Bigelow Aerospace, with relationship `confidence` and `notes` captured in the override source.
9. **Bundled people file slimmed for app use** — added [`scripts/strip-people-raw.mjs`](/Users/christophershannon/fuckfascists/scripts/strip-people-raw.mjs) and `npm run strip:people:raw`. The full source-of-truth file remains [`assets/data/people.json`](/Users/christophershannon/fuckfascists/assets/data/people.json) with all `145,451` raw rows intact. The script writes a separate bundled copy at [`assets/data/people.bundle.json`](/Users/christophershannon/fuckfascists/assets/data/people.bundle.json), keeping `raw` only for `82` people linked to live entities and reducing retained line items to `9,911` (`2,319,869` bytes, about `2.3 MB`).
10. **Workflow documented for future instances** — updated [`CLAUDE.md`](/Users/christophershannon/fuckfascists/CLAUDE.md) so future sessions know the correct maintenance order: edit overrides, regenerate `people.json`, regenerate the review queue, build `people.bundle.json`, then inspect outputs.

**Verification:**
- `node --check scripts/lib/peopleEntityOverrides.mjs`
- `node --check scripts/sync-people-from-bulk-top.mjs`
- `node --check scripts/fetch-people-data.mjs`
- `node --check scripts/build-people-entity-review-queue.mjs`
- `npm run sync:people:bulk-top`
- `npm run build:people:entity-review-queue`

**Next likely step:** review the top rows in `tools/fec-bulk/reports/people-entity-review-queue.json`, add accepted manual calls into `scripts/data/people-entity-overrides.json`, and rerun the two generation commands until the entity-linked donor set is strong enough to wire into the UI.

### Session: April 3, 2026 (committee verification pass for people R/D totals)
**Focus:** Deep web-verify the highest-dollar still-unclassified committees in `people.json`, document the evidence, and only promote high-confidence committees into `R` / `D` buckets.

**What changed:**
1. **Verification report added** — created [`tools/fec-bulk/reports/committee-party-verification-2026-04-03.md`](/Users/christophershannon/fuckfascists/tools/fec-bulk/reports/committee-party-verification-2026-04-03.md) with source-backed findings for the biggest unresolved committees, including which ones should remain intentionally unclassified.
2. **First-pass committee overrides expanded** — added high-confidence overrides for obvious Republican / Democratic committees such as `RIGHT FOR AMERICA`, `OPPORTUNITY MATTERS FUND`, `MAHA PAC`, `SAVING ARIZONA PAC`, `PERSIST PAC`, `MOVEMENT VOTER PAC`, `GEORGIA UNITED VICTORY`, `FAIR COURTS AMERICA`, `PROTECT THE HOUSE 2024`, `TECH FOR CAMPAIGNS`, and others.
3. **Second-pass obvious committees resolved** — after rerunning hydration and re-ranking the unknowns, added another wave of overrides for committees like `MAGA INC.`, `PACRONYM`, `BIDEN ACTION FUND`, `ONE FOR ALL COMMITTEE`, `REBUILDING AMERICA NOW`, `TOM STEYER PAC`, and `REFORM AMERICA FUND`.
4. **Third-pass obvious committees resolved** — added another smaller verification wave for `DMFI PAC`, `MCCARTHY VICTORY FUND`, `WORKING FAMILIES PARTY PAC`, `GROW THE MAJORITY`, and `CLEARPATH ACTION FUND`, while continuing to leave anti-Trump or clearly cross-partisan committees unclassified.
5. **Beneficiary-lens pass completed** — revisited the remaining big unknowns from a second perspective: not how the committee brands itself, but who the spending actually helps electorally. That moved committees such as `REPUBLICAN ACCOUNTABILITY PAC`, `THE LINCOLN PROJECT`, `DEMOCRACY PAC`, `PROTECT THE HOUSE`, and `AMERICAN EXCEPTIONALISM PAC`, then a final obvious follow-on group including `HILLARY ACTION FUND`, `COMMUNITY CHANGE VOTERS`, `GREAT AMERICA PAC`, and `SWING LEFT`.
6. **Cross-partisan / independent edge cases still preserved as unknowns** — even after the beneficiary pass, I deliberately kept committees such as `WITH HONOR FUND`, `UNITE AMERICA PAC`, `TEAM KENNEDY`, `OUR PRINCIPLES PAC`, `DEMOCRACYFIRST PAC`, `AMERICAN-DNA PAC, INC.`, and `BETTER FUTURE MI FUND` unclassified because the evidence still points to bipartisan / independent / anti-Trump protest politics or remains too thin to assign a fair label.
7. **Live donor file rehydrated five times from bulk** — reran `npm run hydrate:people:bulk` after each verification wave so [assets/data/people.json](/Users/christophershannon/fuckfascists/assets/data/people.json) reflects the curated decisions rather than just the report.
8. **Coverage materially improved** — the hydrated file remains `976 / 997` people matched, but the resolved share of all raw committee dollars increased from `75.23%` to `85.67%`. Unclassified dollars dropped from `24.35%` to `14.33%`.
9. **Current top unknowns are now mostly true edge cases** — the remaining biggest unresolved committees are `WITH HONOR FUND`, `UNITE AMERICA PAC`, `TEAM KENNEDY`, `AMERICAN-DNA PAC, INC.`, `BETTER FUTURE MI FUND`, `OUR PRINCIPLES PAC`, `DEMOCRACYFIRST PAC`, and a smaller set like `MISSOURI STANDS UNITED`, `THE IMPACT FUND`, `JSTREETPAC`, and `TRUST IN THE MISSION PAC`.

**Verification:**
- `node --check scripts/hydrate-people-from-bulk.mjs`
- `node --check scripts/fetch-people-data.mjs`
- `npm run hydrate:people:bulk`
- Local raw-row recomputation of `R/D/unknown` coverage after each pass

**Next likely step:** keep the verification report as the evidence log, then continue one committee at a time only when the remaining unknowns are either large enough or obvious enough to justify another curated override.

### Session: April 2, 2026 (people bulk hydration + R/D naming alignment)
**Focus:** Hydrate `people.json` from downloaded FEC bulk files, align the people schema on `R` / `D` naming, and leave the branch in a usable donor-data state without relying on live API calls.

**What changed:**
1. **People schema aligned to current donor shape** — rebuilt `core/models/person.ts`, refreshed `core/models/__tests__/person.test.ts`, and added `core/data/personList.ts` plus `core/data/__tests__/personList.test.ts` so the app now understands wrapped `people.json`, role records, `commonName`, and `donationSummary.totalR/totalD/recentCycleR/recentCycleD`.
2. **Bulk hydrator added** — created `scripts/hydrate-people-from-bulk.mjs` and `npm run hydrate:people:bulk`. It scans local `tools/fec-bulk/indiv*/by_date/*.txt` files with exact donor-name matching, joins committee metadata from local `cm*.txt` files, aggregates `raw` by `committeeId:cycle`, and writes hydrated Schedule A-style summaries back into `assets/data/people.json`.
3. **Legacy API script kept compatible** — updated `scripts/fetch-people-data.mjs` to use schema version `1.3`, preserve `commonName`, normalize older `totalGOP/totalDEM` payloads into `R/D`, and emit the new field names going forward. `scripts/sync-people-from-bulk-top.mjs` now also writes `formatVersion: 1.3`.
4. **Hydration completed for the live donor file** — `assets/data/people.json` is now `formatVersion: 1.3`, `41 MB`, with `976 / 997` people hydrated from bulk data, `145,451` aggregated committee-cycle rows, and `75.23%` of total dollars currently resolved into `R/D` buckets. The remaining `24.35%` stays unclassified rather than being guessed.
5. **Curated committee party resolution added** — bulk hydration now uses `committee.party` when present, then a maintained committee-ID override list for obvious partisan PACs (for example `SMP`, `HMP`, `Harris Victory Fund`, `Priorities USA Action`, `America PAC`, `Trump Victory`, `Senate Majority PAC`, `House Majority PAC`, `ACTBLUE` / `WINRED`-style cases). This materially improved the usefulness of `R/D` totals while keeping `raw[]` intact for auditability.
6. **Known remaining gaps documented by the data itself** — `21` donor records still missed bulk hydration due to unresolved name variants / edge-case contributor labels. The largest remaining unclassified committees are mostly independent or ideologically obvious but not yet explicitly curated (for example `Republican Accountability PAC`, `MAHA PAC`, `Unite America PAC`, `With Honor Fund`, `Jefferson Rising`, `Movement Voter PAC`).

**Verification:**
- `node --check scripts/hydrate-people-from-bulk.mjs`
- `node --check scripts/fetch-people-data.mjs`
- `npx jest core/models/__tests__/person.test.ts core/data/__tests__/personList.test.ts --runInBand`
- `npm run hydrate:people:bulk`
- `npm run compare:people:bulk -- --ids=miriam-adelson,michael-r-bloomberg,richard-uihlein,timothy-mellon,kenneth-c-griffin --cycles=2016,2018,2020,2022,2024`

**Next likely step:** recover the remaining 21 unmatched donors with better alias/nickname variants, then keep expanding the committee-party override list only where the partisan alignment is genuinely obvious.

### Session: April 1, 2026 (Bundle ID, onboarding swipe, arena grid, file cleanup, sprite audit)
**Focus:** Four implementation tasks + sprite gap analysis audit.

**What changed:**

1. **Bundle ID:** `app.json` updated — iOS `bundleIdentifier` → `com.fckapp.fck`, Android `package` → `com.fckapp.fck` (added android section).
2. **Onboarding swipe gestures:** `OnboardingNavigator.tsx` now wraps screens in a `PanResponder` view. Swipe left to advance, swipe right to go back. Existing button navigation unchanged. Uses velocity + distance thresholds (50px / 0.3 velocity). No new dependencies.
3. **Arena grid responsive sizing:** Grid cell size now computed dynamically from figure count and available arena dimensions via `computeGridCellSize()` (extracted to `platformHelpers.ts`). Pure math — tries every column count, picks the layout that maximizes cell size. No hardcoded min/max pixel constants. Prevents overflow when many platforms are tracked.
4. **File cleanup:** Moved `assets/pixel/old/` (35 legacy files) to `tools/reference/pixel-old/`. Moved `bill-gates_gpt.png` and `jay-schottenstein_redo.png` to `tools/reference/renamed-sprites/`. Added `tools/reference/` to `.gitignore`.

**Audit — Sprite gap analysis:**
- 505 unique figure names referenced across entities.json + platforms.json
- 102 have sprites (~20% coverage)
- 403 missing sprites
- 10 of 18 platform parent figures missing sprites (Andy Jassy, Sundar Pichai, Shou Zi Chew, Greg Peters, Dara Khosrowshahi, Alex Chriss, Steve Huffman, Bill Ready, Jason Citron, Dario Amodei)
- Bug found: `daniel-ervr.png` sprite exists but H&M entity has `ceoName: "Daniel Ervér"` (accent) — `nameToSpriteId()` produces `daniel-ervér`, not `daniel-ervr`. Sprite won't resolve at runtime.

**Simplification pass:** Onboarding swipe refactored — dropped `useCallback`/`stepRef` sync-ref pattern in favor of `setStepIndex` functional updaters (stable in PanResponder's stale closure). Arena grid dropped `TRACK_ARENA_GRID_CELL_MIN`/`_MAX` constants in favor of pure computation.

**Flags:**
- `GameArena.tsx` is 291 lines — pre-existing violation (was 281), noted in known debt.
- `daniel-ervr.png` sprite filename mismatch — needs rename to `daniel-ervér.png` or entity data fix.

**Files modified:** `app.json`, `features/Onboarding/OnboardingNavigator.tsx`, `features/Platforms/components/GameArena.tsx`, `features/Platforms/utils/platformHelpers.ts`, `config/constants.ts`, `.gitignore`

**Tests:** 340 tests pass (30 suites). No failures.

---

### Session: March 31, 2026 (Six fixes + two audits)
**Focus:** Six independent bug fixes across Track, Scorecard, BusinessCard, Map, and Launch screens. Two read-only audits (asset bundling, file cleanup).

**What changed:**

1. **FIX 1 — Track screen infinite FX loop:** `FXLayer.tsx` created a new inline callback per entry on every render, triggering useEffect re-fires in all FX effect components. Extracted `FXEntryRenderer` wrapper that memoizes the callback via `useCallback`. Also fixed `GameArena.tsx` `fireHitFX` dependency from `[fx]` (unstable object) to `[fx.fire]` (stable callback).
2. **FIX 2 — Scorecard platform figure name:** `aggregateScorecard.ts` used `platform.ceoName` for platform avoids instead of `publicFigureName ?? ceoName`. Amazon showed "Andy Jassy" instead of "Jeff Bezos". Fixed to match entity avoid path which already uses `getDisplayFigure()`. Added test.
3. **FIX 3 — BusinessCard sprite breakout:** Sprite was contained inside card. Changed `spriteSide` from `paddingTop: sm` to `marginTop: -40` so sprite floats above card frame, overlapping the map behind it. Card already has `overflow: 'visible'`.
4. **FIX 4 — Map banners auto-dismiss:** `BusinessBanner` now auto-dismisses after 5 seconds via `useEffect` timer. DISMISS label moved below message text (column layout). Added backdrop `Pressable` in `MapScreen` for tap-outside dismissal.
5. **FIX 5 — Map no-match ghost marker:** New `NoMatchMarker` component — greyed-out fading dot at tap location when no entity match found. Added `tapNoMatchCoord` state to `useTapSearch`. Ghost marker fades over 2.5s. Removed `console.log` statements from useTapSearch (production path cleanup).
6. **FIX 6 — Launch screen random message:** Changed from deterministic day-of-year rotation to `Math.random()` per app open, wrapped in `useState` initializer for stability.

**Audits:**
- **AUDIT A (Asset Bundling):** All image assets use local `require()` paths. No remote image URLs. No issues found.
- **AUDIT B (File Cleanup):** 35 legacy files in `assets/pixel/old/` (duplicates, unreferenced). 2 unused sprite variants (`bill-gates_gpt.png`, `jay-schottenstein_redo.png`). ~25 potentially unused pixel art files (corners, fx_money_drop, faq_link_icon, business_card, onboarding, search_shell_caps, bottom_nav_shell, bg_tile_pixel_grid, scorecard_preview_stamp). No broken require() references.

**Flags:**
- `console.log` removed from `useTapSearch.ts` production paths.
- `GameArena.tsx` `fireHitFX` had unstable `[fx]` dep — secondary FX loop contributor, fixed.

**Files modified:** `core/fx/FXLayer.tsx`, `features/Platforms/components/GameArena.tsx`, `features/Scorecard/data/aggregateScorecard.ts`, `features/Scorecard/data/__tests__/aggregateScorecard.test.ts`, `features/Map/components/BusinessCard.tsx`, `features/Map/components/BusinessBanner.tsx`, `features/Map/MapScreen.tsx`, `features/Map/hooks/useTapSearch.ts`, `features/Map/components/NoMatchMarker.tsx` (new), `features/Launch/LaunchScreen.tsx`

**Tests:** 340 tests pass (30 suites). +1 new test for platform publicFigureName resolution.

---

### Session: March 31, 2026 (Onboarding + MapSearchBar visual restyle)
**Focus:** Visual styling pass on the three onboarding screens and the map search bar. No changes to component hierarchy, navigation logic, permission handling, search execution, copy strings, or accessibility attributes.

**What changed:**

1. **OnboardingSlide.tsx** — Star field background (12 scattered white View dots, 1-2px, low opacity). Neon bar under header (3-segment row: dim focusAccent edges, bright highlightBlue center). CTA button restyled: amber raised bevel (`bevelAmberRaised`), `rewardYellow` fill, dark text, `theme.radii.button` corners, `SparkleDecoration` on CTA. SKIP remains plain `textSecondary`.
2. **ProgressDots.tsx** — Restyled as beveled squares (10px). Upcoming: grey inset bevel (`bevelInset`) + `panelOuter` fill. Active: amber raised bevel (`bevelAmberRaised`) + `rewardYellow` fill. Completed: blue raised bevel (`bevelFocusRaised`) + `focusAccent` fill.
3. **WelcomeScreen.tsx** — Centered content. Feature items: green checkmark (`successGreenText`) + Bungee function label (`successGreenText`) + em-dash + description in `textSecondary`. Parsed from existing copy strings.
4. **PrivacyScreen.tsx** — Privacy guarantees: inset-bevel panels (`bevelInset`, `panelInner` bg). 6px `focusAccent` vertical accent bar on left. Labels in Bungee / `highlightBlue`. "Check it yourself" link in `highlightBlue` (was `rewardYellow`).
5. **PermissionsScreen.tsx** — Permission cards: grey raised-bevel (`bevelRaised`). Status indicator: small dot + OFFLINE/ONLINE text. Granted state: green left accent bar, `successGreenText` title, green inset-bevel GRANTED badge. ALLOW buttons: amber raised bevel (same as CTA). Sparkles render on both cards when both granted. Auto-advance label in `highlightBlue` at reduced opacity.
6. **MapSearchBar.tsx** — Full bevel restyle with three states. Default: 2px blue bevel outer frame + 1px subtler inner frame, `panelInner` bg, drop shadow (iOS: black, offset 6, opacity 0.6, radius 12; Android: elevation 8), `SparkleDecoration` near icon. Focused: outer brightens to `highlightBlue`/`focusAccent`, inner bg shifts to saturated blue (#112244), 3px `highlightBlue` left accent bar, shadow picks up blue tint. Scanning: outer/inner shift to `glowCyan` tones, dark cyan bg, no sparkles.

**Files modified:** `features/Onboarding/components/OnboardingSlide.tsx`, `features/Onboarding/components/ProgressDots.tsx`, `features/Onboarding/screens/WelcomeScreen.tsx`, `features/Onboarding/screens/PrivacyScreen.tsx`, `features/Onboarding/screens/PermissionsScreen.tsx`, `features/Map/components/MapSearchBar.tsx`

**Tests:** 339 tests pass (30 suites). TypeScript clean (pre-existing Dev/catalogMocks errors only).

---

### Session: March 31, 2026 (Data-driven platform roster — platforms.json)
**Focus:** Replace the hardcoded platform array in `platformList.ts` with a data-driven roster loaded from `assets/data/platforms.json`.

**What changed:**
- `assets/data/platforms.json` — NEW. 18 top-level entries (5 groups + 13 singletons), 28 leaf platforms total. Groups: Meta, Alphabet, Amazon, Match Group, Microsoft. Covers major social, streaming, shopping, AI, and dating platforms.
- `features/Platforms/types.ts` — Added 5 new raw JSON types (`RawPlatformChild`, `RawPlatformGroup`, `RawPlatformSingleton`, `RawPlatformEntry`, `PlatformFile`). Updated `Platform` interface with 3 new required fields: `entityId` (links to entities.json), `sortOrder` (display order), `defaultSelected` (setup screen pre-check).
- `features/Platforms/data/platformList.ts` — Completely rewritten. Exports `parsePlatformFile`, `flattenPlatforms`, and `TRACKED_PLATFORMS` (computed synchronously at module load from bundled JSON + entity enrichment). Groups are expanded to their children; children inherit parent's `entityId`. Entity enrichment populates `parentCompany`, `ceoName`, `publicFigureName`, `categoryTags` from entities.json. Fallback: if entity not found, `parentCompany` = entityId, `ceoName` = ''.
- `config/constants.ts` — Removed `DEFAULT_SELECTED_PLATFORM_IDS` (now derived from platforms.json `defaultSelected` flags, exported from `platformList.ts`).
- `features/Platforms/__tests__/platformList.test.ts` — Fully rewritten: 26 tests covering `parsePlatformFile`, `flattenPlatforms`, and `TRACKED_PLATFORMS` singleton.
- `features/Dev/harnessFixtures.ts` — Fixture Platform objects updated with new required fields (`entityId`, `sortOrder`, `defaultSelected`).
- `features/Scorecard/data/__tests__/aggregateScorecard.test.ts` — Fixture Platform objects updated with new required fields.

**All 339 tests passing (30 suites).**

**Known flags:**
1. `match-group` entityId not found in entities.json — Tinder/Hinge/OkCupid render with `ceoName: ''` and no sprite. Add at next entities review.
2. `tiktok` uses `entityId: "tiktok"` (product-level entity, CEO: Shou Zi Chew). Parent company `bytedance` is linked via `parentEntityId` in entities.json.

---

### Session: March 31, 2026 (Info screen game UI restyle)
**Focus:** Bring the Info screen into the game UI design language — star field background, beveled panels, amber-framed about section, blue-highlighted accordions.

**What changed:**
1. **InfoScreen.tsx** — complete visual restyle. About section extracted from InfoSection wrapper into standalone amber plaque (3px amber bevel, 1px inner border, `#050810` opaque background, corner brackets, neon rule divider). "Built to Last" ethos panel uses inset bevel (`#080a0e` background). Transparency and FAQ use beveled accordion panels. Version label moved from header to below links. Star field background via `bg_stars.gif`.
2. **InfoDecorations.tsx** — new file. `StarField` (ImageBackground with bg_stars.gif), `CornerBrackets` (four 2px amber L-brackets at plaque corners), `NeonRule` (3px focusAccent bar with 1px highlightBlue highlight and 5px endpoint dots).
3. **InfoSection.tsx** — simplified to standalone Bungee/highlightBlue label above children. Removed container borders and dark header strip.
4. **FaqItem.tsx** — grey bevel panels (`bevelRaised`), ▼/▲ chevrons (from `infoCopy`), expanded state: 3px focusAccent left accent bar, focusTint header bg, focusText question text, highlightBlue chevron, focusTint answer area. `SparkleDecoration` (default variant) renders on expanded items.
5. **LinkRow.tsx** — plain text links in highlightBlue with ↗ suffix. Removed category color coding, underlines, panel borders.
6. **SparkleDecoration.tsx** — added `'info'` variant: 5 sparks at 10–14px spread across all four edges of parent (for about plaque).
7. **design/bevel.ts** — added `bevelAmberPlaque` (3px thick amber bevel for Info about section).
8. **assets/pixel/bg/bg_stars.gif** — star field background asset.

**Known limitation:** `SparkleDecoration` `info` variant uses hardcoded pixel `right` values (200, 220) to approximate left-edge placement. Works well on ~375pt phones but drifts on wider screens. Documented in CLAUDE.md Known Limitations for V1.5 fix.

**Files modified:** `design/bevel.ts`, `core/fx/SparkleDecoration.tsx`, `features/Info/InfoScreen.tsx`, `features/Info/components/InfoDecorations.tsx` (new), `features/Info/components/InfoSection.tsx`, `features/Info/components/FaqItem.tsx`, `features/Info/components/LinkRow.tsx`, `assets/pixel/bg/bg_stars.gif` (new)

**Tests:** 320 tests pass. TypeScript clean.

---

### Session: March 30, 2026 (LayoutAnimation → reanimated migration)
**Focus:** Replace `LayoutAnimation` with `react-native-reanimated` to fix persistent SIGABRT/SIGKILL crashes on the Track screen and on app launch.

**Root cause:** `LayoutAnimation.configureNext` is broken on RN 0.76 + `newArchEnabled: true` (known regression facebook/react-native#47617). Also: `babel.config.js` was in a worktree subdirectory — Metro couldn't find it when building from Xcode → reanimated worklet runtime hung on startup → OS watchdog SIGKILL.

**What changed:**
- `features/Platforms/components/TrackList.tsx` — removed `LayoutAnimation`/`Platform`/`UIManager`; removed `animateNextLayout` + all 7 call sites; `FlatList` → `Animated.FlatList` with `itemLayoutAnimation={LinearTransition.duration(250)}`; dayCircles wrapped in `Animated.View entering={FadeIn.duration(200)}`
- `babel.config.js` — created at project root with `react-native-reanimated/plugin`
- `package.json` + `package-lock.json` — `react-native-reanimated@3.16.7` added
- `ios/Podfile.lock` + `project.pbxproj` — reanimated native pod integrated
- `CLAUDE.md` — LayoutAnimation RN 0.76 rule + infinite render loop / SIGABRT pattern documented

**Commit:** `7b1deb3`

---

### Session: March 30, 2026 (Stabilize array deps in useScorecard + useBarcodeSearch)
**Focus:** Preventive fix — eliminate unstable array prop references as `useEffect`/`useCallback` dependencies in two hooks identified during a render-loop audit.

**What changed:**
1. **`useScorecard.ts`** — `entities` and `platforms` moved from `useEffect` dep array to refs (`entitiesRef`, `platformsRef`), synced synchronously on every render. Effect now deps on `[adapter, weekOf, isPreview]` only. Prevents `aggregateScorecard` (async DB read) from re-running on any parent re-render that produces a new array reference — which would cause a loading flash and unnecessary DB churn.
2. **`useBarcodeSearch.ts`** — `entities` moved to `entitiesRef`, `resolveBarcode` dep array is now `[]`. Callback is called on demand, never a downstream effect dep, so recreating it on array reference churn was unnecessary. Now fully stable.

**Pattern used:** sync-ref — `const ref = useRef(val); ref.current = val;` on every render keeps the value current without listing it as a reactive dep.

**No functional change.**

**Files modified:** `features/Scorecard/hooks/useScorecard.ts`, `features/Map/hooks/useBarcodeSearch.ts`

**Commit:** `b04a27d`

---

### Session: March 30, 2026 (Track screen crash fix — infinite render loop)
**Focus:** Diagnose and fix a SIGABRT crash triggered by tapping platform rows or group headers on the Track screen.

**Root cause:** Two bugs compounding:
1. `usePlatformAvoidance` computed `items` inline in the hook body (not memoized) — producing a new array reference on every render.
2. `TrackContext` derived `todayActions` via `useState + useEffect([avoidance.items])` — since `avoidance.items` was always a new reference, the effect fired on every render, calling `setTodayActions`, triggering another render, ad infinitum.
3. Every tap also called `LayoutAnimation.configureNext`. Rapid-fire state updates mid-animation caused Fabric's C++ view-list sort to receive inconsistent data → `SIGABRT: _LIBCPP_ASSERT_SEMANTIC_REQUIREMENT "Your comparator is not a valid strict-weak ordering"`.

**Fix:**
1. `usePlatformAvoidance.ts` — wrapped `items` and `totalAvoids` in `useMemo([events, platforms])`. Reference is now stable unless events or platforms actually change.
2. `TrackContext.tsx` — replaced `todayActions` `useState + useEffect` with `useMemo([avoidance.items])`. Removed manual `setTodayActions` calls from `avoid`, `avoidForDate`, and `clearAll` — `todayActions` now updates reactively in the same render pass as the event state change.

**No functional change** — same computed values, same user-visible behavior.

**Files modified:** `features/Platforms/hooks/usePlatformAvoidance.ts`, `features/Platforms/context/TrackContext.tsx`

**Tests:** 64 tests pass. TypeScript clean.

**CLAUDE.md:** Added note on unmemoized hook return values as `useEffect` dependencies causing infinite loops + Fabric SIGABRT.

**Commits:** `a5de7eb` (business card) → `6492097` (docs) → this fix

---

### Session: March 30, 2026 (Business card visual upgrade)
**Focus:** Bring BusinessCard, BusinessBanner, DataZone, and AvoidButton into the same visual language as the Track screen — blue chrome bevel, amber actions, sprite-left layout, post-avoid sparkles.

**What changed:**
1. **BusinessCard** — blue focus bevel (`focusBevelLight`/`focusBevelDark`) replaces old `frameBlue` hero border; `panelInner` background replaces `surface1`. Sprite moved inside card to left side (no frame, no centered perch above); brand name + parent attribution left-aligned beside sprite. `⚠ MATCHED` confidence badge is now tappable — shows Alert with explanation; amber border (`amberActionLight`) on `panelInner` background; inline medium-confidence disclaimer removed. `SparkleDecoration variant="large"` (5 sparks, 12–18px) renders top-right when `avoided === true`. DISMISS is stacked below AVOID button with `focusBevelDark` top border.
2. **AvoidButton** — AVOID state: `amberAction` bg + `bevelAmberRaised`, white (`textPrimary`) label, `radii.button` corners. AVOIDED state: `successGreenDeep` bg + `bevelGreenInset`, `successGreenText` label.
3. **DataZone** — section divider updated from `surface2` → `focusBevelDark`.
4. **BusinessBanner** — blue focus bevel frame (`bevelFocusRaised`), `panelInner` background. Left accent bar distinguishes variant: amber (`amberActionLight`) for dissolved, red (`dangerRed`) for lookup_failed, neutral grey (`panelBorder`) for no_match/no_pac.
5. **SparkleDecoration** — added `variant?: 'default' | 'large'` prop. Large: 5 sparks at 12–18px, staggered delays. Backwards-compatible default unchanged.
6. **copy/map.ts** — added `confidenceBadgeHint`, `confidenceAlertTitle`, `confidenceAlertBody` for tappable badge.
7. **copy-preview tool** — `copy-all.json` + `copy-all.js` regenerated with new map keys.

**Files modified:** `copy/map.ts`, `core/fx/SparkleDecoration.tsx`, `features/Map/components/BusinessCard.tsx`, `features/Map/components/BusinessBanner.tsx`, `features/Map/components/DataZone.tsx`, `features/Map/components/AvoidButton.tsx`, `tools/copy-preview/copy-all.json`, `tools/copy-preview/copy-all.js`

**Tests:** 104 tests pass. TypeScript clean.

**Commit:** `a5de7eb`

---

### Session: March 30, 2026 (Track screen visual upgrade)
**Focus:** Bring the Track screen into the 8-bit cockpit visual language — beveled panels, blue focus chrome, amber AVOID actions, sparkle decoration.

**What changed:**
1. **Bevel system** — `design/bevel.ts` added with `bevelRaised`, `bevelInset`, `bevelFocusRaised`, `bevelGreenInset`, `bevelAmberRaised` per-side border style objects.
2. **Token additions** — `design/tokens.ts` expanded: panel system (`panelOuter`, `panelInner`, `panelBorder`, `bevel*`), focus system (`focusAccent`, `focusBevelLight`, `focusBevelDark`, `focusTint`, `focusText`), amber action system (`amberAction`, `amberActionLight`, `amberActionDark`), additional radii/constants.
3. **SparkleDecoration** — `core/fx/SparkleDecoration.tsx` added, exported from `core/fx/index.ts`. 3 animated gold stars positioned top-right of parent, reduced-motion safe.
4. **PlatformGroupHeader** — blue focus bevel on focused group header; `panelOuter`/`panelInner` double-frame background; `focusText` label color on focus.
5. **PlatformRow** — `panelInner` background; focused row gets blue left border + `focusTint` bg; `SparkleDecoration` renders on focused row.
6. **AvoidButton (Track)** — amber raised bevel (`bevelAmberRaised`); AVOIDED state uses green inset bevel (`bevelGreenInset`) + `successGreenDeep` bg.
7. **DayCircles** — inset bevel on day tiles; blue today indicator.
8. **config/constants.ts** — `TRACK_ROW_FOCUS_BG_COLOR`, `TRACK_ROW_FOCUS_BORDER_COLOR`, and 30+ `TRACK_*` sizing constants added.

**Commit:** `6d16507`

---

### Session: March 30, 2026 (Copy rewrite + structural follow-ups)
**Focus:** Complete copy rewrite across all 11 copy files and 9+ component files based on the Voice & Ethos Framework v3.2. Then implement 6 structural follow-up tasks flagged during the rewrite.

**What changed:**

**Copy rewrite (11 files):**
1. `copy/shared.ts` — brand name "FCK FASCISTS" (no asterisk), party labels `R:`/`D:` replacing `GOP`/`DEM`, app-wide URL variables (`siteUrl`, `repoUrl`, `dataRepoUrl`, `issuesUrl`, `privacyUrl`, `contactEmail`, extension URLs), site URL `fckfascists.com`
2. `copy/onboard.ts` — voice rewrite, renamed variables, added `featureScan`, `privacySubhead`, `openSourceLink`. Removed `note`, `ourPromise`, `done`
3. `copy/map.ts` — voice fixes, first-use hint copy added, `cardAvoidedAnnouncement` changed from function to static string
4. `copy/platforms.ts` — voice updates, added `perfectWeek*` copy, `shortParentNames` moved out to config
5. `copy/scorecard.ts` — collapsed 4 source verbs into single `sourceLine`, new tokenized empty state, imports `sharedCopy` for CTA URL
6. `copy/info.ts` — "HOW IT WORKS" → "THE DATA"
7. `copy/infoContent.ts` — full rewrite, imports `sharedCopy` for URLs, added ethos section, new FAQ/transparency entries
8. `copy/launch.ts` — all 7 rotating messages replaced
9. `copy/scan.ts` — body and footnote rewritten
10. `copy/beta.ts` — no changes needed
11. `extension/copy.ts` — `gopPrefix` → `rPrefix`, `demSep` → `dSep`, content voice updates

**Component updates (10 files):**
- `App.tsx`, `DataZone.tsx`, `BusinessCard.tsx`, `WelcomeScreen.tsx`, `PrivacyScreen.tsx`, `PermissionsScreen.tsx`, `ScorecardView.tsx`, `extension/popup/popup.ts`, `Dev/harnessRenderers/gateStates.tsx`
- Key changes: R:/D: labels everywhere, tokenized scorecard empty state, tappable open-source link, actual OS permission result checking

**Structural follow-ups (6 tasks):**
1. Info ethos section — `InfoScreen.tsx` renders `ethosTitle` + `ethos`. Validation + types updated.
2. Map first-use hints — `useMapHints` hook + `HintBanner` component + `MapScreen` integration
3. PrivacyScreen tappable link — "Check it yourself." opens GitHub repo
4. `shortParentNames` moved from copy to `config/constants.ts` as `SHORT_PARENT_NAMES`
5. PermissionsScreen checks actual `{ granted }` from OS dialog
6. dSep V2 flag added to CLAUDE.md Known Limitations

**Pending:**
- TBD copy placeholders (`contactEmail`, extension URLs) still `"[need to change!!]"`
- Map hints need device testing
- `about.ethos` needs CDN JSON update when info.json is next deployed

---

### Session: March 24, 2026 (OFF products sync + cleanup)
**Focus:** Turn the modular `products.json` layer into a real UPC-focused producer dataset by scanning the local Open Food Facts bulk archive, checkpointing the work, and tightening alias quality without touching `entities.json` or `people.json`.

**What changed:**
1. **Checkpointed OFF sync script added** — introduced `scripts/sync-products-from-off.py`, a resumable products-only importer that parses the local OFF Mongo dump directly, checkpoints progress under `tools/off-bulk/checkpoints/`, and can rebuild `products.json` from checkpointed results without rescanning the archive.
2. **Full OFF pass completed** — scanned `4,403,001` OFF product documents with `0` parse errors and wrote the final products snapshot back into `assets/data/products.json`.
3. **Research layer expanded and grounded in DB evidence** — `producerResearch` now contains `206` seeded producer entries with OFF-backed `dbMatchedProductCount`, `dbObservedPrefixes`, `dbObservedBrands`, `dbConfirmedAliases`, and `dbSuggestedAliases`.
4. **Runtime producer lookup now uses repeated OFF prefix evidence** — `products.json` now exposes `18` entity-linked runtime producers with filtered prefix sets, including high-coverage parents like Pepsico, Coca-Cola, Conagra Brands, General Mills, Mondelez International, Mars, and Kellanova.
5. **Alias cleanup rules added** — runtime brands now strip producer self-names, legal-entity labels, generic descriptor junk, and obvious partner-company contamination so `observedBrands` stays closer to real shelf brands.
6. **Coverage is now mostly blocked by missing entities, not missing OFF data** — `184/206` research entries matched OFF, `174/206` retained prefixes, and `155` missing-entity candidates already have OFF-derived prefixes waiting on a future entity pass.
7. **Deep documentation added** — [PRODUCTS_DATA_PIPELINE.md](/Users/christophershannon/fuckfascists/docs/PRODUCTS_DATA_PIPELINE.md) now documents the full products/OFF workflow, checkpointing model, cleanup heuristics, current coverage, and next-step queue.
8. **Verification** — `npm test -- --runTestsByPath features/Map/__tests__/barcodeHelpers.test.ts` passes after the products rebuild.

### Session: March 24, 2026 (producer-prefix scan layer)
**Focus:** Add a modular, local producer-prefix index so product scans can degrade gracefully to likely parent-company matches without touching `entities.json`.

**What changed:**
1. **Modular products index added** — introduced `assets/data/products.json`, a separate file that references existing entity IDs only and keeps producer expansion out of `entities.json` for now.
2. **Scan flow now prefers local producer hints** — barcode scans now check cache first, then the bundled producer-prefix index, and only call Open Food Facts on remaining misses.
3. **Confidence is explicit** — producer-prefix hits render as `LIKELY PRODUCER` and use a medium-confidence score instead of pretending to be exact product matches.
4. **Graceful degradation improved** — common producer-family hits can now resolve locally even if the network is unavailable or OFF is rate-limited.
5. **Documentation updated** — [BARCODE_SCAN_V1.md](/Users/christophershannon/fuckfascists/docs/BARCODE_SCAN_V1.md) and [SPEC_VS_CURRENT.md](/Users/christophershannon/fuckfascists/docs/SPEC_VS_CURRENT.md) now describe the modular `products.json` layer and the rule that future entity additions happen in a separate clean data pass.

### Session: March 24, 2026 (repo cleanup & consolidation)
**Focus:** Audit and clean up accumulated git state from multiple agents/worktrees. Consolidate branches, remove dead worktrees, fix .gitignore, sync lockfiles, add git workflow rules.

**What changed:**
1. **Branch consolidation** — merged `claude/model-implementation-tWWD2` data work (expo-file-system dep, data pipeline updates) into `main`. Deleted stale branches: `claude/lucid-bassi`, `claude/model-implementation-tWWD2`, `claude/nice-cori`.
2. **Worktree cleanup** — removed 4 orphaned worktrees (`.claude/worktrees/lucid-bassi`, `nice-cori`, `model-implementation-tWWD2`, `inspiring-lamport`). Only the main working tree remains.
3. **.gitignore hardened** — added `tools/fec-bulk/data/` and `tools/fec-bulk/reports/` (91GB of bulk FEC data was unignored). Added `.claude/worktrees/` to prevent worktree artifacts from being tracked.
4. **Lockfiles synced** — ran `npm install` to regenerate `package-lock.json` after `expo-file-system` was added on a feature branch.
5. **CLAUDE.md updated** — added Git Workflow Rules section: branch naming, worktree cleanup, merge-to-main policy, bulk data exclusion, lockfile hygiene. Updated script execution rule from blanket ban to "flag before running."
6. **expo-file-system added** — dependency merged from data branch (needed for file operations in data pipeline work).
7. **Verification** — 320 tests pass (30 suites), `tsc --noEmit` clean, all lockfiles in sync.
8. **Producer-prefix scan layer added modularly** — scan now checks a separate `products.json` file that points into existing entity IDs before calling Open Food Facts. This keeps product-producer expansion isolated from later `entities.json` / FEC / people cleanup work.

### Session: March 24, 2026 (device testing fixes — 10 issues)
**Focus:** Fix 10 issues found during physical device testing, spanning safe area handling, camera permissions, onboarding flow, map header sizing, sprite alignment, and copy consistency.

**What changed:**
1. **Safe area top constant** — added `SAFE_AREA_TOP_MIN` (52pt) in `config/constants.ts`. Applied to `BetaOverlay` and `BarcodeScannerSheet`.
2. **Camera permission eager request** — `BarcodeScannerSheet` now calls `requestPermission()` via `useEffect` on mount. Native OS dialog fires immediately when OPEN SCANNER is tapped.
3. **Map header reduced** — header bar backing shrunk to 75% of original aspect ratio; logo increased from 24pt to 28pt.
4. **FigureBadge fallback removed** — no more initials box when sprite is missing. Renders empty slot only.
5. **Arena sprite flush** — `TRACK_ARENA_SINGLE_BOTTOM_INSET` set to 0. Character sprites sit flush on arena bottom edge.
6. **Welcome + Launch logo responsive** — both screens scale logo to ~22% of screen height (capped at 160pt) instead of fixed width.
7. **Onboarding reorder** — welcome → **privacy** → **permissions**. YOUR DATA now precedes SET UP.
8. **Permissions confirmed state** — cards show "GRANTED" text + green border when permission is granted. Single bottom CTA only.
9. **YOUR DATA dead space** — privacy points list wrapped in a flex-centered container.
10. **CTA reconciled** — launch screen "TAP TO START" changed to "PRESS START" to match onboarding.

**Verification:** 305 tests pass across 29 suites.

### Session: March 23, 2026 (accessibility audit & fix)
**Focus:** Full-codebase accessibility audit — labels, hints, roles, states, tap targets — across all surfaces. Cross-referenced against copy/ layer. Fixed all actionable issues.

**What changed:**
1. **Copy keys added** — `scan.ts` (+2: `primaryActionLabel`, `busyActionLabel`), `map.ts` (+5: `tabLabel`, `barcodePermissionActionLabel`, `barcodeSettingsActionLabel`, `barcodeCameraLabel`, `chooserModalLabel`), `platforms.ts` (+1: `tabLabel`), `info.ts` (+3: `tabLabel`, `transparencyToggleLabel`, `versionLabel`).
2. **Critical fixes — missing all a11y on interactive elements:** ScanScreen CTA (added `accessibilityRole`, `accessibilityLabel`, `accessibilityState`), BarcodeScannerSheet permission buttons (added role + label), ScanScreen heading (added `accessibilityRole="header"`).
3. **Modal focus trapping added:** BarcodeScannerSheet root (`accessibilityViewIsModal`), MatchChooser card (`accessibilityViewIsModal` + label).
4. **Missing `accessibilityState` added:** MapControls location button (`disabled`), PlatformRow body (`expanded`), PlatformGroupHeader (`expanded`), Platforms AvoidButton (`selected`).
5. **Tap target fixes:** UnmatchedBanner FEC link (added `hitSlop` + `minHeight: 44`), BarcodeScannerSheet close button (added `minHeight: 44` + `hitSlop`), DayCircles `hitSlop` increased 4→8.
6. **Decorative elements hidden:** PlatformRow expand indicator (`accessible={false}`), BarcodeScannerSheet scan guide (`accessible={false}`), BarcodeScannerSheet camera (`accessibilityLabel`).
7. **InfoScreen fixes:** Transparency toggle (added `accessibilityLabel`), version tap (added `accessibilityRole="button"` + `accessibilityLabel`).
8. **Tab bar hardcoded labels extracted** — all 4 hardcoded tab labels replaced with imports from respective copy files.
9. **BarcodeScannerSheet title** — added `accessibilityRole="header"`.
10. **Verification** — 320 tests, 30 suites, all pass.

**Follow-up fixes (human decisions resolved):**
11. **ScorecardView inline links** — accepted as intentional 44pt exception; added code comment documenting rationale (empty-state reading flow, VoiceOver reachable).
12. **ScorecardView allowFontScaling={false}** — accepted for V1; added docblock comment explaining why (react-native-view-shot bitmap capture requires fixed layout).
13. **GameArena reduced motion** — added `AccessibilityInfo.isReduceMotionEnabled()` check; pulse and cross-fade animations gated on `!reducedMotion`. Decorative background hidden from screen readers.
14. **Map AvoidButton console.log** — removed leftover `console.log('[AvoidButton] Firing haptic feedback')` from production path.
15. **InfoScreen page title** — changed `allowFontScaling={false}` to `allowFontScaling` (Dynamic Type enabled).
16. **Copy naming cleanup** — deferred to pre-1.0 pass (no runtime impact, cosmetic only). Logged in "What's Not Working" table below.

### Session: March 23, 2026 (entity/person reconciliation + V1/V2 split)
**Focus:** Reconcile `entities.json` against the new people pass without letting V2-only donor/company links pollute the live V1 entity graph.

**What changed:**
1. **Repeatable verification added** — created `scripts/verify-data-integrity.mjs` to audit duplicate IDs, forward refs, reverse-link gaps, role mismatches, GPT pass integrity, and stale docs.
2. **V1/V2 crossover cleaned up** — created `scripts/reconcile-v1-entities.mjs`, added reverse `associatedPersonIds` to live entities, and kept `entities.json` aligned only to live V1 IDs.
3. **Deferred V2 links preserved, not lost** — kept non-live people→entity links in `people.json` as declared forward refs and mirrored them into `tools/fec-bulk/reports/people-v2-deferred-entity-links.json` so the data stays recoverable and reviewable.
4. **Live entity collisions reduced** — trimmed parent-child alias/domain duplication for existing child entities (for example Microsoft/LinkedIn/GitHub, Amazon/Twitch/Ring, Recruit/Indeed/Glassdoor, LVMH/Sephora, Shell/Jiffy Lube) and removed a few web-verified stale overlaps such as Marathon→Speedway, Verizon→Yahoo/AOL, and Adobe→Figma.
5. **Docs/memory synced** — updated `CLAUDE.md` and `SPEC_VS_CURRENT.md` so they match the current live rule set and `PoliticalPerson` schema.
6. **Verification** — `node scripts/verify-data-integrity.mjs`, `npx jest --runInBand core/data/__tests__/personList.test.ts`, `npx jest --runInBand core/models/__tests__/person.test.ts`, and `npm run typecheck` rerun after reconciliation.

### Session: March 22, 2026 (barcode scan crash fix + runtime hardening)
**Focus:** Remove the Scan tab crash, keep the implementation lightweight, and document the final stable flow.

**What changed:**
1. **Crash root cause fixed** — added `NSCameraUsageDescription` to the native iOS app target so requesting camera access no longer risks an OS-level crash.
2. **Scanner mount path simplified** — `BarcodeScannerSheet` is now mounted only after the user taps `OPEN SCANNER`, which keeps camera setup contextual and avoids touching the preview while the Scan tab is idle.
3. **Native handling corrected** — removed the old `CameraView.isAvailableAsync()` gate from the native flow and switched to permission-state UI plus `onMountError`, matching Expo Camera's documented surface more closely.
4. **Permission recovery improved** — when camera permission has already been denied, the scan sheet now offers an `Open settings` path instead of repeatedly prompting.
5. **Permission scope reduced** — set `recordAudioAndroid: false` for `expo-camera`, so the barcode feature does not request unnecessary microphone/audio access on Android.
6. **Documentation updated** — hardened BARCODE_SCAN_V1.md, SPEC_VS_CURRENT.md, and ARCHITECTURE.md to reflect the final implementation rather than just the first rollout.
7. **Verification** — `npm run typecheck`, focused scan Jest tests, and `plutil -lint ios/FckFascists/Info.plist` passed. Full iOS simulator build verification remained partially blocked by the local Xcode/CoreSimulator/CocoaPods environment.

### Session: March 22, 2026 (barcode scanning v1 + dedicated Scan tab)
**Focus:** Add a product barcode scan flow that works in-store without shipping a massive bundled product database.

**What changed:**
1. **New top-level Scan destination** — added a dedicated `SCAN BETA` tab instead of hiding barcode scan inside Map. The flow is now a first-class product surface with its own CTA, permission timing, and result state, while staying clearly marked as test-only navigation for now.
2. **Camera scanner added** — installed `expo-camera`, configured the app plugin, and built `BarcodeScannerSheet` with `UPC-A`/`EAN-13` only, which keeps the scan path narrow and fast.
3. **Barcode resolution stays lightweight** — scan results normalize to GTIN-13, hit a local SQLite barcode cache first, and only call Open Food Facts on cache miss. Repeat scans stay local to the device.
4. **No giant product DB** — the implementation reuses bundled entity aliases as the brand-to-parent-company graph. No `product.json` or top-100 product bundle was added.
5. **Result flow reused, not duplicated** — once a brand resolves, the existing entity/FEC card path is reused. `BusinessCard` now shows a `SCANNED PRODUCT` context block so users can tell a shelf scan from a map match.
6. **Documentation added** — created BARCODE_SCAN_V1.md with architecture notes, source rationale, known risks, and explicit rollback steps.
7. **Verification** — `npx tsc --noEmit` passed and `npx jest --runInBand` passed with 320 tests across 30 suites.
8. **Tab bar bleed fixed** — removed the scaled repeat transform from the bottom-nav stone texture and clipped the tab bar bounds so the texture no longer paints upward over screen content.

### Session: March 21, 2026 (Track list visual hierarchy + sprite fallback polish)
**Focus:** Make grouped platform rows read more clearly as children and clean up the small platform-list sprite treatment.

**What changed:**
1. **Hierarchy styling improved** — child rows under group headers now use a deeper indent, smaller name/count type, a connector guide, and a softer nested background tint so they read as sub-items instead of peers.
2. **Platform busts simplified** — singleton platform rows now always use the neutral sprite bust, which avoids clipping defeated-state stars/halos inside tiny list crops.
3. **Bust crop relaxed** — shared platform-row bust crop constants were retuned slightly wider and less top-biased so faces sit more naturally in the small list tiles.
4. **Missing art fallback added** — introduced `FigureBadge` for Track. When a sprite is missing from the manifest, the UI now renders a monogram badge instead of a blank box. This fixes the visible YouTube/Sundar gap without needing new art immediately.
5. **Verification** — `npx tsc --noEmit` passed and `npx jest --runInBand` passed with 314 tests across 29 suites.

### Session: March 21, 2026 (Track pivot implementation — data-driven detail rows)
**Focus:** Implement the documented Track pivot so platform expansion stops depending on row-local animated height state.

**What changed:**
1. **Track state simplified** — `TrackContext` now separates `selectedPlatformId`, `openPlatformId`, and `focusedFigureName`, which removes the old overloaded focus token and the `expandedIds` set.
2. **List behavior rebuilt around data, not hidden animation state** — `TrackList` now inserts a real `dayCircles` item under the open platform row and uses `LayoutAnimation` for open/close transitions.
3. **Daily preview simplified** — the once-per-day ripple now lives locally in `TrackList` as a temporary set of open detail rows that collapse in sequence and cancel immediately on interaction.
4. **Day circles made presentational again** — `DayCircles` is now a plain detail row instead of an internally animated height container.
5. **Arena background direction aligned with the pivot** — `GameArena` is back on `cover` with the existing background color/overlay acting as the fallback layer; dynamic resize-mode switching was removed.
6. **Shared crop rule kept simple** — no per-sprite metadata was added. The same shared crop constants continue to drive both `2x2` and `2x1` sheets.
7. **Verification** — `npx tsc --noEmit` passed and `npx jest --runInBand` passed with 314 tests across 29 suites.

### Session: March 21, 2026 (Track pivot planning — simplify list behavior and sprite crop)
**Focus:** Stop iterating on the fragile inline day-circle animation and document a simpler Track implementation path before another code pass.

**What changed:**
1. **Platform interaction pivot documented** — added TRACK_PLATFORM_PIVOT.md describing the move from row-local animated height to a data-driven `dayCircles` detail item inserted directly into `FlatList` data.
2. **Internet vetting recorded** — the pivot is now grounded in the official React batching docs, React Native `FlatList` and `LayoutAnimation` docs, Apple list/disclosure guidance, and the controlled accordion pattern.
3. **Sprite crop simplification validated** — visually sampled 10 random sprite sheets across both `2x2` and `2x1` tiers. All sampled sheets use the same `728x720` frame geometry, and the face anchor is consistent enough to justify one shared crop rule rather than per-sprite metadata.
4. **Arena background direction simplified** — the pivot note now keeps arena art on `cover` and recommends only a color/texture fallback layer underneath, matching the fact that the background assets were painted to crop well.

### Session: March 21, 2026 (Track follow-up — row tap expansion + crop alignment + arena background fit)
**Focus:** Fix the remaining Track complaints after the v3 rebuild: row taps still feeling non-responsive, faces still clipping inside the sprite crop, and arena backgrounds looking zoomed on narrower assets.

**What changed:**
1. **Row-body expansion made atomic** — added a reducer-level `press-expandable-row` action so row taps and checkmark taps do not branch on a render-time `focused` prop. A row tap now opens that row immediately and a second tap collapses it.
2. **Sprite crop corrected in both axes** — `SpriteView` now supports `cropOffsetX` in addition to `cropOffsetY`. Track bust/grid/single-character crops are nudged slightly left and up so the face stays inside the square window instead of clipping against the top/right edge of the frame.
3. **Arena background fit corrected** — `GameArena` now picks `cover` only when the selected arena asset aspect ratio is already close to the live arena ratio, and uses `contain` for squarer backgrounds so they stop appearing zoomed in.
4. **Regression expectations updated** — `trackUIState.test.ts` now reflects the one-tap row-open behavior and verifies that switching rows collapses the prior row while opening the newly selected one.

### Session: March 21, 2026 (Track screen rebuild v3 — reducer-driven focus + FlatList restore)
**Focus:** Re-architect the Track screen interaction model so focus, arena state, and day-circle expansion stay in sync. Fix the broken expand/collapse behavior, restore the spec'd `FlatList` layout, and enforce one platform avoid per day.

**Changes:**
1. **Track screen structure restored** — `TrackScreen` is back to `TrackProvider` → `TrackHeader` → `GameArena` → `TrackList` (`FlatList`, only scrollable element). Removed the stray main-screen `Clear data` action from the header.
2. **Reducer-driven Track UI state** — focus and expansion logic moved into `context/trackUIState.ts` so row focus, group focus, and checkmark expand/collapse happen through one state machine instead of competing `setState` calls. Added `focusedFigureName` + `arenaHitRequest` bridge in `TrackContext`.
3. **List components made prop-driven again** — `TrackList.tsx` now owns `FlatList` render branching and passes explicit props into `PlatformGroupHeader` and `PlatformRow`. Day circles expand correctly on focused-row body taps and checkmark taps, and previous expansions collapse on focus shifts.
4. **Daily open animation fixed** — first visit to Track each calendar day now checks a persisted SecureStore date (`track_daily_open_last_visit`), opens all rows once, then stagger-collapses them. No AppState/focus/unfocus trigger.
5. **Arena rebuilt** — random background on mount, full tracked roster in the neutral character-select grid, larger/corrected sprite crop math via `SpriteView.cropRatio`, left-weighted single-character portrait, same-person sibling pulse instead of full transition, and coordinate-aware arena FX positioning.
6. **Platform avoid model corrected** — `recordPlatformAvoid*()` now no-op when a platform/date is already logged, platform weekly reads normalize legacy overcounted records to binary per day, and Track/Scorecard tests were updated to the new one-per-day semantics.

**Files created:** `features/Platforms/components/TrackList.tsx`, `features/Platforms/context/trackUIState.ts`, `features/Platforms/context/trackHelpers.ts`
**Files rebuilt:** `features/Platforms/TrackScreen.tsx`, `features/Platforms/context/TrackContext.tsx`, `features/Platforms/components/GameArena.tsx`, `features/Platforms/components/TrackHeader.tsx`, `features/Platforms/components/PlatformGroupHeader.tsx`, `features/Platforms/components/PlatformRow.tsx`
**Files modified:** `features/Platforms/components/ArenaFX.tsx`, `features/Platforms/components/AvoidButton.tsx`, `features/Platforms/components/DayCircles.tsx`, `features/Platforms/hooks/usePlatformAvoidance.ts`, `core/data/eventStore.ts`, `core/sprites/spriteLoader.tsx`, `config/constants.ts`, `design/tokens.ts`, `features/Scorecard/data/__tests__/aggregateScorecard.test.ts`, `docs/PROGRESS.md`
**Follow-up validation:** added user-flow regression coverage in `features/Platforms/__tests__/trackUIState.test.ts` and a rollback/architect note in `docs/TRACK_SCREEN_V3_NOTES.md` documenting the failure mode in prior commit `795e7d8`, the new pressure-test matrix, and exact rollback commands.

**Verification:** `npx tsc --noEmit` clean. `npx jest --runInBand` clean — 314 tests passing (29 suites).

### Session: March 20, 2026 (Track screen rebuild v2 — component extraction + todayActions)
**Focus:** Second-pass rebuild of the Track screen. Extracted monolithic TrackRow/TrackList into focused single-responsibility components. Defeated state now driven by todayActions (any avoid = defeated) instead of weekly threshold.

**Changes:**
1. **Deleted old files:** `TrackList.tsx`, `TrackRow.tsx` (both accumulated too many responsibilities in v1 rebuild)
2. **New component architecture:**
   - `components/AvoidButton.tsx` (75 lines) — ONE Pressable, TWO visual states. "AVOID" (green bg, white text) → checkmark (muted bg, green text). Driven by `avoidedToday` boolean prop.
   - `components/PlatformGroupHeader.tsx` (93 lines) — sprite bust (always neutral) + short parent name + roll-up avoid count. Tap focuses first child platform.
   - `components/PlatformRow.tsx` (220 lines) — handles both `childRow` and `platformRow` types via `isChild` prop. Two tap zones: row body (focus/expand/collapse cycle) and AvoidButton. DayCircles always mounted with animated height.
   - `components/ArenaFX.tsx` (107 lines) — extracted from GameArena: SpeechBubbleFX, FloatingMinusOneFX, `arenaFXRegistry`.
   - `utils/listData.ts` (62 lines) — extracted from TrackScreen: `TrackListItem` union type and `buildListData()` function.
   - `components/GameArena.tsx` (209 lines) — rebuilt. Grid sprites ALWAYS neutral. Single character uses `todayActions.has()` for defeated state. `fireHitFX` static property for parent communication.
   - `components/TrackHeader.tsx` (94 lines) — rebuilt. No screen title (tab says TRACK). Top row: week label + "Edit platforms" (underlined). Count area: avoid count when >0, "LET'S GO!!!!" pump-up when 0.
   - `TrackScreen.tsx` (195 lines) — rebuilt. Contains `TrackScreen` (root) and `TrackListInner`. Daily open animation with per-day tracking via `dailyOpenDateRef`.
3. **TrackContext rebuilt** (161 lines) — `isDefeated()` now returns `todayActions.has(figureName)` instead of `personWeeklyAvoids() >= SPRITE_DEFEATED_THRESHOLD`. `avoidForDate()` adds to todayActions for any date including past-day backfills.
4. **DayCircles rebuilt** (140 lines) — uses `TRACK_DAY_CIRCLE_SIZE` and `TRACK_DAY_CIRCLES_GAP` constants.
5. **Copy updates:** removed old keys (`title`, `score`, old `avoidedBtn`/`avoidedLabel`/`notAvoidedLabel`/`editBtn`/`editLabel`/`groupHeader`/`arenaTitle`). Added: `editPlatforms`, `editPlatformsA11y`, `avoidCountLabel`, `pumpUp`, new `avoidedBtn` (checkmark), `avoidBtnA11y`, `avoidedBtnA11y`, `countDash`, `expandIndicator`, `collapseIndicator`, `groupHeaderA11y`. Changed `countLabel` format from `x{n}` to `{n}x`.
6. **Constants updates:** renamed `ARENA_MAX_HEIGHT` to `ARENA_HEIGHT = 200`. Removed `SPRITE_DEFEATED_THRESHOLD`. Added 16 `TRACK_*` layout tuning constants.

**Screen layout:** Plain flex column. TrackHeader (auto height) → GameArena (fixed 200pt) → FlatList (flex: 1, only scrollable element). No sticky headers, no nested scrolling.

**Files created:** features/Platforms/components/AvoidButton.tsx, features/Platforms/components/PlatformGroupHeader.tsx, features/Platforms/components/PlatformRow.tsx, features/Platforms/components/ArenaFX.tsx, features/Platforms/utils/listData.ts
**Files rebuilt:** features/Platforms/TrackScreen.tsx, features/Platforms/context/TrackContext.tsx, features/Platforms/components/TrackHeader.tsx, features/Platforms/components/GameArena.tsx, features/Platforms/components/DayCircles.tsx
**Files modified:** copy/platforms.ts, config/constants.ts, docs/PROGRESS.md, CLAUDE.md
**Files deleted:** features/Platforms/components/TrackList.tsx, features/Platforms/components/TrackRow.tsx

**Kept unchanged:** hooks (usePlatformAvoidance, usePlatformRoster, useNudgeNotification), utils (weekDates, platformHelpers), types.ts, platformList.ts, PlatformSetupScreen.tsx, NudgeBanner.tsx, all tests

**Verification:** 295 tests pass (27 suites). All files under 250-line limit.

### Session: March 19, 2026 (Shared FX system + App.tsx extraction + people.json docs)
**Focus:** Three infrastructure tasks — no UI changes.

**Changes:**
1. **Shared FX system (`core/fx/`)** — replaces CelebrationOverlay with a generic, extensible effects system.
   - `types.ts` — FXEntry, FXScope ('point'|'area'|'full'), FXComponentProps, FXRegistration
   - `useFX.ts` — fire-and-forget hook: `fire(type, scope, meta?)`, `remove(id)`, `entries[]`, `active`, `reducedMotion`
   - `FXLayer.tsx` — host component that renders active effects from a registry
   - `registry.ts` — default registry with built-in `avoid` effect
   - `effects/AvoidCelebration.tsx` — migrated from CelebrationOverlay (scale+fade, reduced motion support)
   - `index.ts` — barrel export
   - `config/constants.ts` — added `FX_AVOID_DURATION_MS = 3000`, `FX_AVOID_FADE_MS = 400`
   - **MapScreen.tsx** — replaced `CelebrationOverlay` imports + `celebrations[]` state + `reducedMotionRef` with `useFX()` + `<FXLayer>`. Removed `AccessibilityInfo` import.
   - **Deleted** `features/Map/components/CelebrationOverlay.tsx`

2. **App.tsx extraction** — split monolithic App.tsx into gate components.
   - `app/gates/OnboardingGate.tsx` — wraps `useOnboarding` + conditional `OnboardingNavigator`
   - `app/gates/LaunchGate.tsx` — wraps `shouldShowLaunchScreen()` + conditional `LaunchScreen`
   - `app/gates/AppShell.tsx` — tab navigation, screen rendering, beta overlay, FEC client
   - **App.tsx** reduced from 226 to 112 lines: fonts → data init → splash → gate chain

3. **People.json architecture documentation**
   - **CLAUDE.md** — expanded Entity Relationships: bidirectional linkage model, full PoliticalPerson schema with all fields, integrity rules, getPersonDisplayName. Updated repo structure (added `app/gates/`, `core/fx/`). Updated sprint focus table.
   - **SPEC_VS_CURRENT.md** — people.json row updated from "Deferred — V1.5" to "In progress" with current state. 8-bit design system entry updated to reflect FXLayer.

**Files created:** core/fx/types.ts, core/fx/useFX.ts, core/fx/FXLayer.tsx, core/fx/registry.ts, core/fx/effects/AvoidCelebration.tsx, core/fx/index.ts, app/gates/OnboardingGate.tsx, app/gates/LaunchGate.tsx, app/gates/AppShell.tsx
**Files modified:** App.tsx, features/Map/MapScreen.tsx, features/Map/components/BusinessCard.tsx (comment), config/constants.ts, CLAUDE.md, docs/SPEC_VS_CURRENT.md, docs/PROGRESS.md
**Files deleted:** features/Map/components/CelebrationOverlay.tsx

**Verification:** 307 tests pass (28 suites).

### Session: March 19, 2026 (AIRMap.m post_install patch hook)
**Focus:** Automate the AIRMap.m nil guard patch so it survives `pod install`.

**Changes:**
- **ios/Podfile** — added `post_install` hook that reads `node_modules/react-native-maps/ios/AirMaps/AIRMap.m` and injects nil guards on `insertReactSubview:atIndex:`, `removeReactSubview:`, and `addSubview:` if missing. Idempotent — detects existing guards and skips. Prints confirmation via `Pod::UI.puts` when patch is applied.
- **CLAUDE.md** — updated Modern Code Standards bullet (native guard is now auto-applied by Podfile hook). Updated Known Limitations section: AIRMap.m nil guard patch marked as Resolved.

**Files modified:** ios/Podfile, CLAUDE.md, docs/PROGRESS.md

**Verification:** 295 tests pass (27 suites). Patch idempotency confirmed via Ruby dry-run against both patched and simulated unpatched sources.

### Session: March 18, 2026 (BusinessCard rebuild + component extraction)
**Focus:** Complete BusinessCard rebuild — deleted old component, split into clean composable pieces, moved celebration to screen level, extracted map controls hook.

**Changes:**
- **Deleted** old `BusinessCard.tsx` (accumulated ad hoc patches, broken view hierarchy, celebration code mixed in)
- **Created `DataZone.tsx`** — self-contained donation data display: total since 2016 (GOP/DEM), recent cycle, active cycles, PAC attribution, FEC link. Three states: real donations, no donations on file, data unavailable.
- **Created `DetailSheet.tsx`** — placeholder for future expanded data view (no-op for V1)
- **Rebuilt `BusinessCard.tsx`** (168 lines) — clean three-section layout: sprite perch above card (overflow visible, marginBottom -40, zIndex 20), name section (brand + parent attribution + confidence badge), DataZone, AvoidButton + dismiss. `accessibilityViewIsModal`, post-avoid screen reader announcement via `AccessibilityInfo.announceForAccessibility`.
- **Created `BusinessBanner.tsx`** (114 lines) — lightweight banner for non-card states. `resolveCardMode()` function determines card vs banner: checks entity presence, fecCommitteeId, donationSummary all-zeros. Four banner variants: no_match, lookup_failed, no_pac, dissolved.
- **Created `CelebrationOverlay.tsx`** (66 lines) — screen-level celebration effect extracted from old card. Respects reduced motion (static checkmark vs animated scale+fade). `CELEBRATION_DURATION_MS = 3000`. Array-based registry in MapScreen for extensibility.
- **Extracted `useMapControls.ts`** (73 lines) — zoom in/out, region tracking, initial centering, recenter-on-me. Keeps MapScreen focused on data flow.
- **Rewrote `MapScreen.tsx`** (217 lines) — celebration registry (`CelebrationEffect[]`), card/banner routing via `resolveCardMode()`, `handleNewResult()` for second-tap-replaces-card, `pointerEvents='none'` during celebration, `maxHeight: '65%'` on card container.
- **Updated `copy/map.ts`** — added banner strings (bannerNoMatch, bannerLookupFailed, bannerNoPac, bannerDissolved, bannerDismissLabel), DataZone strings (dataZoneDetail, dataZoneDetailLabel), card accessibility strings (cardAvoidedAnnouncement, cardModalLabel), parent attribution string.
- **Updated `MapSections.tsx`** — new BusinessCard API + BannerNoMatch, BannerNoPac, BannerDissolved catalog sections.
- **Updated `CatalogScreen.tsx`** — banner variants added to SECTIONS array, slice indices adjusted.

**Files created:** BusinessBanner.tsx, CelebrationOverlay.tsx, DataZone.tsx, DetailSheet.tsx, useMapControls.ts
**Files rewritten:** BusinessCard.tsx, MapScreen.tsx
**Files modified:** copy/map.ts, MapSections.tsx, CatalogScreen.tsx

**Architecture:** BusinessCard.tsx re-exports `BusinessBanner` and `resolveCardMode` from BusinessBanner.tsx so existing import paths continue to work. All files under 250-line limit.

**Verification:** tsc clean, 295 tests pass (27 suites)

### Session: March 18, 2026 (map polish + launch screen fix + no-match toast)
**Focus:** Header bar transparent ridge, header-to-search spacing, launch screen auto-dismiss timing, tap no-match feedback

**Changes:**
- **MapScreen.tsx** — added `backgroundColor: bgVoid` to `headerBarOverlay` style so transparent pixels in header_bar.png show the dark background instead of the map bleeding through. Increased header-to-search-bar gap from `theme.space.xs` (4pt) to `theme.space.md` (12pt).
- **LaunchScreen.tsx** — fixed 5s auto-dismiss firing early. Root cause: `onDismiss` prop was an inline arrow function in App.tsx, creating a new reference on every parent re-render. The auto-dismiss `useEffect` depended on `[onDismiss]`, so every parent re-render cleared and restarted the 5s timer. Fix: store `onDismiss` in a ref and run the timer effect once on mount with an empty dependency array.
- **App.tsx** — stabilized `onDismiss` callback with `useCallback` (`dismissLaunch`), providing a stable reference as a belt-and-suspenders complement to the ref fix in LaunchScreen.
- **useTapSearch.ts** — added `tapNoMatch` state: set to `true` for 2s when a map tap finds POI names but none match any entity. Exposed in return value.
- **NoMatchToast.tsx** — new component: brief absolutely-positioned toast ("No match found") shown when `tapNoMatch` is true and no card is active. Uses `accessibilityRole="alert"` for VoiceOver.
- **copy/map.ts** — added `tapNoMatch` copy key.
- **MapScreen.tsx** — wired `tapNoMatch` from `useTapSearch` to render `<NoMatchToast />`.

**Verification:** tsc clean, 295 tests pass

### Session: March 18, 2026 (UI kit revert + header bar fix + sprite overflow)
**Focus:** Partial revert of UI kit wiring (assets don't fit at current sizes), header bar sizing fix, sprite overflow fix

**Changes:**
- **Reverted UI kit wiring** from 6 components — sliced assets remain in `assets/pixel/ui/` but are no longer wired into BusinessCard, AvoidButton, MapSearchBar, TabBar, MapControls, or ScorecardView. All components restored to pre-UI-kit coded borders/styling. `core/ui/uiAssets.ts` and header bar wiring in MapScreen retained.
- **MapScreen.tsx** — header bar height now derived from screen width via `useWindowDimensions` + aspect ratio (1482/153) instead of hardcoded 60px. Image uses `resizeMode="stretch"` for full-width fill. Logo vertically centered within the stone area above the crumbling edge.
- **BusinessCard.tsx** — explicit `overflow: 'visible'` on `whoSection`, `whoRow`, and `spriteHero` styles to ensure the sprite perch renders outside the card's top edge without clipping. Corner brackets restored.
- Renamed `assets/pixel/UI/` to `assets/pixel/ui/` (lowercase) to fix Metro bundler case-sensitive resolution.

**Verification:** tsc clean, 295 tests pass

### Session: March 18, 2026 (UI kit slicing + component wiring)
**Focus:** UI kit sprite sheet slicing pipeline + wiring pixel art assets into 7 components

**Changes:**
- Created `tools/img-gen/scripts/slice_ui_kit.py` — auto-detects connected non-transparent regions via flood-fill BFS, extracts each as individual transparent PNG. Reusable for any sprite sheet.
- Sliced `ui_kit.png` into 30 elements, saved to `assets/pixel/ui/` with semantic names (frames, buttons, bars, badges, input fields, panels, dividers)
- Created `core/ui/uiAssets.ts` — static require() map for all 30 UI kit elements + header bar
- **MapScreen.tsx** — header bar replaced with `header_bar.png` pixel art asset, overlaid on map with logo on top. Irregular bottom edge is transparent (map visible through gaps). Full SafeAreaView layout restructured.
- **BusinessCard.tsx** — `ImageBackground` with `frame_card_wide.png` replaces coded borders + corner brackets. Corner bracket images removed.
- **AvoidButton.tsx** — `ImageBackground` with `btn_start.png` replaces coded yellow/green background. Frame image hidden on confirmed/error states (solid colors remain).
- **MapSearchBar.tsx** — `ImageBackground` with `input_field.png` wraps TextInput. Search button uses `btn_circle_search.png` Image.
- **TabBar.tsx** — `bar_tab.png` replaces stone tile repeat texture. resizeMode stretch, higher opacity.
- **MapControls.tsx** — `ImageBackground` with circle button assets (`btn_circle_plus`, `btn_circle_arrow`, `btn_circle_target`) replace coded dark square buttons.
- **ScorecardView.tsx** — `ImageBackground` with `frame_scorecard.png` replaces coded hero border.
- Documented `slice_ui_kit.py` in `tools/img-gen/USAGE.md`
- Updated CLAUDE.md repo structure tree (core/ui/, assets/pixel/ui/, slice_ui_kit.py)

**Verification:** tsc clean, 295 tests pass, copy audit clean (dev fixtures only)

### Session: March 18, 2026 (arena assets pattern)
**Focus:** Arena background asset management — arenaAssets.ts require map + build script

**Changes:**
- Created `core/arena/arenaAssets.ts` — static `require()` map for arena backgrounds, following the `spriteAssets.ts` pattern
- Created `scripts/generate-arena-assets.mjs` — scans `assets/pixel/arena/` for PNGs and regenerates `arenaAssets.ts`. Run after adding or removing arena backgrounds.
- Updated `GameArena.tsx` — imports from `arenaAssets` instead of inline `require()` calls; `ARENA_BACKGROUNDS` built via `Object.values(arenaAssets)`
- Documented script in CLAUDE.md (repo structure tree + data pipeline section)

**Verification:** tsc clean, 295 tests pass, copy audit clean (dev fixtures only)

### Session: March 18, 2026 (follow-up — img-gen pipeline + device testing)
**Focus:** Physical device build fix, ornamental asset pipeline, magenta keying overhaul

**Physical device (iOS):**
- Diagnosed map freeze on physical device: `MKLocalSearch.start()` was called from Expo Modules background queue — MapKit silently hangs off main thread; completion handler never fires; JS promise never resolves; loading state stuck permanently
- Fix: wrapped `MKLocalSearch` creation and `.start()` in `DispatchQueue.main.async {}` in `MapKitSearchModule.swift`
- iOS build: provisioning failure with `expo run:ios --device` — fixed by opening `FckFascists.xcworkspace` directly in Xcode; Xcode handles device registration and provisioning profile updates interactively
- CLAUDE.md updated with MKLocalSearch main-thread rule (do not remove dispatch wrapper)

**Ornamental asset pipeline (tools/img-gen/):**
- Created `scripts/generate_assets.py` — generates UI ornament assets via Gemini API from `asset-prompts.json`. Same API pattern as `generate.py`. CLI: `--all`, `--asset <id>`, `--dry-run`, `--force`. Prompts reference image before generation (y/n).
- Created `scripts/process_assets.py` — reads `asset-prompts.json` processing config, applies keying + slicing + nearest-neighbor scaling. Handles `grid_2x2` (4 files), `split_horizontal` (left/right), `auto_crop`, `crop_center`, `horizontal_band`. Output: `output/new/`. Raw input: `output/raw/UI Elements/`.
- Created `scripts/deploy_assets.py` — copies processed assets to `assets/pixel/`. Handles multi-file outputs via glob. Never deletes from target.
- `config.json` — cleared `reference_images` (was `["reference/ref1.png"]`); reference images now opt-in per run

**Magenta keying overhaul (`remove_magenta.py`):**
- Full rewrite with HSV-based detection (replaces RGB Euclidean distance). Candidate = hue 285-345deg, saturation >=0.35, value >=0.25, red-minus-green >=26, blue-minus-green >=13
- Border-connected BFS flood fill (pure Python + PIL, no numpy/scipy required)
- Large interior region removal (`--interior-min-size`, default 250px) — catches magenta trapped inside closed shapes
- Optional conservative defringe pass (`--defringe`) — strips leftover pink edge pixels using 8-neighbor adjacency check
- Single-file mode: `remove_magenta.py input.png [output.png] [flags]`; `--output-dir` flag for batch and single-file mode
- Tuning flags exposed on CLI: `--hue-min`, `--hue-max`, `--min-sat`, `--min-val`, `--interior-min-size`
- Key tuning insight: to preserve dark purple clothing while removing bright magenta, raise `--min-val` (e.g. 0.65) — value (brightness) is the discriminator, not hue

**`process_assets.py` keying:**
- Removed scipy dependency; now delegates to `remove_magenta.remove_magenta()` via importlib (single source of keying logic)

**`gpt_image.py` updates:**
- Model updated to `gpt-image-1.5`
- Added `background="transparent"` and `output_format="png"` to `images.edit()` calls
- Fixed subcommand names (`--generate`/`--process` to `generate`/`process`) — argparse subparsers don't support `--` prefix names
- Fixed Python 3.9 compatibility: `Path | None` type annotation removed

**Files modified:**
- `modules/mapkit-search/ios/MapKitSearchModule.swift` — DispatchQueue.main.async wrapper
- `tools/img-gen/scripts/remove_magenta.py` — full rewrite (HSV flood-fill)
- `tools/img-gen/scripts/process_assets.py` — delegates keying to remove_magenta, output/new/, UI Elements input dir
- `tools/img-gen/scripts/gpt_image.py` — model 1.5, transparent bg, subcommand fix, Python 3.9 compat

**Files created:**
- `tools/img-gen/scripts/generate_assets.py`
- `tools/img-gen/scripts/deploy_assets.py`

---

### Session: March 18, 2026
**Focus:** Physical device visual refinement pass — 8 UI changes across 9 files

**Completed:**

**Launch screen:**
- Auto-dismiss increased from 3s to 5s for title screen feel
- Logo now 60% of screen width (was fixed 200pt) — more prominent on device
- Added subtle breathing scale animation on logo (1.0 to 1.04 to 1.0 loop, 3s period) — respects reduced motion
- Uses `Animated.Image` + `useWindowDimensions` for dynamic sizing

**Map screen:**
- Increased spacing between branded header bar and search bar — `paddingVertical: md` on header, `topOffset` uses `md` gap

**Business card:**
- Corner brackets repositioned: now sit ON the card border (top: -4, left/right: -4) with larger 36pt size
- Vertical padding compressed: WHO section `paddingBottom: sm`, WHY section `paddingBottom: sm`, `paddingTop: sm` on total label
- Reward overlay z-index raised to 10 (was 4) — now renders in front of sprite (z-index 5)
- Sprite increased from 120pt to 150pt; marginTop -80 (was -60) so sprite still stands on topband; marginLeft negative to encroach left

**Track screen:**
- "Edit platform selection" text now underlined (`textDecorationLine: 'underline'`) to read as tappable

**SpriteView:**
- New `headOnly` prop — clips to top 38% of sprite frame (head/face crop) via reduced container height
- No asset changes — same sprite sheet, overflow:hidden handles the crop

**GameArena:**
- Full bleed: removed `marginHorizontal`, arena now edge-to-edge
- Increased background opacity from 0.25 to 0.3
- `minHeight: 120` for taller arena section
- All sprites use `headOnly` — cell height adapted to cropped head proportion
- Arena roster now shows ALL tracked platforms (full `TRACKED_PLATFORMS` list), not just user's current selection — rogues' gallery, not a mirror of user choices

**Platform Row:**
- Grouped child rows indent deeper: `paddingLeft: 3xl` (was `xl`) — tree structure visual
- Row content (everything except avoid button) wrapped in a single `Pressable` for expand/collapse — not just the + icon
- Removed separate `chevronBtn` `Pressable` — chevron is now inside the row content touchable
- Second-tap auto-expand: if today already has count > 0 when avoid button is pressed, row auto-expands to show day circles, teaching the backfill mechanic organically

**Tab Bar:**
- Stone texture scaled up 2x via `transform: [{ scale: 2 }]` on `imageStyle` — pattern now visible at device resolution

**Files modified:**
- `features/Launch/LaunchScreen.tsx` — breathing logo animation, 5s dismiss, dynamic width
- `features/Map/MapScreen.tsx` — header bar padding, search bar gap
- `features/Map/components/BusinessCard.tsx` — corners, z-index, sprite size, tighter padding
- `features/Platforms/PlatformsScreen.tsx` — edit underline, arena all-platforms roster
- `core/sprites/spriteLoader.tsx` — `headOnly` prop on SpriteView
- `features/Platforms/components/GameArena.tsx` — full bleed, headOnly, taller, 0.3 bg opacity
- `features/Platforms/components/PlatformRow.tsx` — row tap target, indent, auto-expand
- `app/navigation/TabBar.tsx` — texture scale 2x

**Build:** tsc clean. 295 tests passing (27 suites). audit-copy.sh clean (dev-only fixtures only).

---

### Session: March 17, 2026 (follow-up 2)
**Focus:** Brand assets wired + GPT image pipeline tool

**Completed:**

**Brand logo wiring:**
- **Map header** — replaced text-based `{sharedCopy.appName}` with `<Image>` rendering `FF_logo_horizontal.png` (1536x322). Height 28pt, aspect ratio preserved. `accessibilityLabel={sharedCopy.appName}`.
- **Launch screen** — replaced text-based `appName` with `FF_logo.png` (1466x827) as hero image. Width 200pt, aspect ratio preserved, centered.
- **Onboarding welcome** — replaced text-based `appDisplay` with `FF_logo.png` as hero image. Same dimensions as launch screen. Added `sharedCopy` import for accessibility label.
- **App icon + splash** — `app.json` updated with `icon` and `splash` fields pointing to `FF_logo.png`. Splash background `#070B12` matches `theme.colors.bgVoid`.

**Arena backgrounds:**
- **GameArena** — replaced single tiled `bg_tile_dark_stone.png` with 4 arena scene backgrounds (`arena_sf`, `arena_byc_street`, `arena_nyc_penthouse`, `arena_dc`). Random selection via `useMemo` on mount. Changed `resizeMode` from `repeat` to `cover`.

**Asset manifest:**
- Added 6 new entries with status `"ready"`: `brand-logo-stacked`, `brand-logo-horizontal`, `arena-bg-sf`, `arena-bg-nyc-street`, `arena-bg-nyc-penthouse`, `arena-bg-dc`. Each includes dimensions, usage context, and fallback.

**GPT image pipeline (tools/img-gen/):**
- Created `scripts/gpt_image.py` — general-purpose GPT image tool using `gpt-image-1`. Two modes: `--generate` (text prompt to PNG, optional reference image) and `--process` (batch edit existing PNGs with natural-language instructions). Reads `OPENAI_API_KEY` from repo root `.env` via python-dotenv. Batch support with `[N/total]` progress, skip-on-error.
- Created `USAGE.md` — full documentation for all 8 scripts in the pipeline (generate, generate_assets, compose, remove_magenta, process_assets, deploy_assets, manifest, gpt_image). Pipeline overview section, all CLI flags, 2+ examples per script.
- Updated `requirements.txt` — added `openai`, `python-dotenv`, `scipy` (was imported but missing).

**Files created:**
- `tools/img-gen/scripts/gpt_image.py`
- `tools/img-gen/USAGE.md`

**Files modified:**
- `features/Map/MapScreen.tsx` — Image import, horizontal logo in header, headerLogo style
- `features/Launch/LaunchScreen.tsx` — Image import, stacked logo hero, heroLogo style
- `features/Onboarding/screens/WelcomeScreen.tsx` — Image import, sharedCopy import, stacked logo hero, heroLogo style
- `app.json` — icon and splash configuration
- `features/Platforms/components/GameArena.tsx` — arena backgrounds array, random selection, cover resize
- `design/asset-manifest.json` — 6 new asset entries
- `tools/img-gen/requirements.txt` — 3 new dependencies

**Build:** tsc clean. 295 tests passing (27 suites). audit-copy.sh clean.

---

### Session: March 17, 2026 (follow-up)
**Focus:** Device-testing-driven visual refinement pass

**Completed:**

**Map screen:**
- Search bar safe area fix — added `insets.top` to search bar offset so it clears the status bar on device
- Tap-to-dismiss backdrop — added `Pressable` overlay behind BusinessCard for dismissing by tapping the map
- Card container `overflow: 'visible'` to allow sprite perch to extend above card bounds

**Business card:**
- Sprite perch enlarged — 100 to 120pt, `marginTop: -60` + `zIndex: 5` so sprite stands ON TOP of card border
- WHY section divider softened — `hero` width `frameBlue` to 1px `surface2` (less visual noise)
- Reward overlay wired — `business_card_reward_overlay.png` fades in to 0.6 opacity over 400ms during 3s celebration
- Card `overflow: 'visible'` for sprite perch

**Avoid button:**
- Added debug `console.log` before haptic feedback call
- Visual depth — `bgVoid` top border + `highlightBlue` bottom border (2px each)

**Platforms screen (TRACK):**
- Removed "THE ARENA" title label from GameArena
- Arena padding reduced — `margin: md` to `marginHorizontal: sm, marginTop: sm`, `padding: md` to `sm`
- Arena background — `ImageBackground` with `bg_tile_dark_stone.png` at 25% opacity
- Sprite cells — `rewardYellow` 2px borders, `surface1` background, centered grid
- Short parent names — added `shortParentName()` to strip Inc/Corp/Platforms/.com and uppercase (e.g. "META" not "META PLATFORMS")
- Group header is ONLY sprite for grouped platforms — child rows hide sprites via `hideSprite` prop
- Grouped child rows compact — reduced vertical padding, left indent via `compact` prop
- Edit button restyled — bordered box to plain text link

**Info screen:**
- Tagline centered (`textAlign: 'center'`)
- Collapse indicator changed from triangle/triangle to +/- (matches FaqItem pattern)

**Global highlight line reduction:**
- TabBar top border: `hero` (4px) to `standard` (2px)
- InfoSection top border: `hero` to `standard`
- PlatformGroup top border: `hero` to `standard`

**Files modified:**
- `features/Map/MapScreen.tsx` — safe area offset, backdrop, overflow
- `features/Map/components/BusinessCard.tsx` — sprite perch, reward overlay, divider, overflow
- `features/Map/components/AvoidButton.tsx` — haptics debug log, depth borders
- `features/Platforms/PlatformsScreen.tsx` — shortParentName, grouped rows hideSprite+compact, edit button restyle
- `features/Platforms/components/GameArena.tsx` — removed title, ImageBackground, cell borders, padding
- `features/Platforms/components/PlatformGroup.tsx` — top border standard
- `features/Platforms/components/PlatformRow.tsx` — hideSprite, compact props
- `features/Info/InfoScreen.tsx` — centered tagline, +/- indicator
- `features/Info/components/InfoSection.tsx` — top border standard
- `app/navigation/TabBar.tsx` — top border standard

**Build:** Xcode build clean (0 errors).

---

### Session: March 17, 2026
**Focus:** Design refinement — 8-bit game energy across all screens, bug fixes, sprite halo removal

**Completed:**

**Bug fixes (7 fixes from device testing):**
- **Launch screen gate** — `shouldShowLaunchScreen()` was marking today as "seen" during onboarding before `isComplete` was true. Fixed: launch check deferred until `isComplete === true`. Loading guard also updated so onboarding renders without waiting for `showLaunch`.
- **Avoid dismiss timing** — business card dismissed instantly on avoid tap. Added 3s celebration delay with fade+shrink animation (`Animated.parallel` opacity/scale, 400ms ease-out, respects reduced-motion). `avoidedResult` state drives defeated sprite/topband during delay.
- **Multi-match re-tap** — tapping a pin at shared coordinates jumped to single card instead of showing chooser. Fixed: pin `onPress` now checks for colocated pins and routes to `setLatestTapBatch` when >=2.
- **Search pin drop** — text search was dropping map pins for businesses that might not be nearby. Added `isTextSearch` ref guard: pin effect skips when `isTextSearch.current === true`.
- **Chick-fil-A zeros** — entities with all-zero donation data (dissolved PACs) showed "$0 / $0". Added `hasRealDonations` guard; shows "No donation data on file." when all amounts are zero.
- **Day circles future style** — future day circles used `surface2` fill (identical to past unchecked). Changed to `transparent` background with `textSecondary` border, `opacity: 0.3`.
- **Corner brackets** — business card had only TL+TR corners. Not a bug but noted for future asset wiring.

**Design refinement — Steps 1-5 (from approved plan):**
- **Copy updates** — `copy/info.ts`: "HOW THE DATA WORKS" to "HOW IT WORKS". `copy/platforms.ts`: added `groupHeader`, `arenaTitle`. `copy/shared.ts`: added `totalSince2016`, `recentCycleShort`, `donationNoneOnFile`.
- **Map header bar** — branded "F*CK FASCISTS" header in `displayS` above the map, `surface1` background, `frameBlue` bottom border. Search bar repositioned below.
- **Search bar depth** — `highlightBlue` top border + `bgVoid` bottom border on container for embossed/inset look.
- **Tab bar texture** — `ImageBackground` with `bg_tile_dark_stone.png` tiled at 30% opacity behind tab bar. Icon size 22 to 26.
- **Business card layout rethink** — sprite LEFT at 100pt with name RIGHT (flexDirection: row). Donation hierarchy flipped: total since 2016 as primary (big, GOP red / DEM blue), recent cycle as secondary below. All-zero guard. `highlightBlue` top edge + `bgVoid` bottom edge ornamentation.

**Design refinement — Steps 6-9:**
- **MatchChooser visual upgrade** — heading color to `rewardYellow`. Row left accent: `highlightBlue` 2px border. Card depth: `highlightBlue` top border + `bgVoid` bottom border.
- **PlatformsScreen major restructure** — replaced `FlatList` with `ScrollView` for mixed arena+grouped content. New `GameArena.tsx` component (static sprite grid with cosmetic tap FX). New `PlatformGroup.tsx` component (parent company grouping with sprite bust + rolled-up total). Platforms grouped by `parentCompany` with group headers; singletons render without headers.
- **GameArena cosmetic tap interaction** — tapping any sprite triggers floating "-1" FX (fade+translate up, 600ms) + speech bubble with random reaction ("ow!", "stop!", "no!", "hey!" from `platformsCopy.spriteReactions`). Bubble fades after 1s. Per-cell animated values via `useRef(new Map<string, TapFx>())`. Reduced-motion: static bubble for 1s, no animation. Purely cosmetic — no data logged.
- **InfoScreen refinements** — transparency section now collapsible (default: collapsed) with toggle. Thicker dividers between transparency points (`hero` width). InfoSection ornamentation: `highlightBlue` top border + `bgVoid` bottom border on body.

**Sprite pipeline — 1px alpha erosion:**
- Added `_erode_alpha_1px()` to both `remove_magenta.py` and `process_assets.py` — removes the anti-aliased fringe halo that survives keying + binarization. For every opaque pixel, if any of its 4 cardinal neighbors is transparent, make it transparent. Vectorized numpy implementation.
- Processing order now: flood fill, global magenta pass, alpha binarization, 1px alpha erosion.
- Reprocessed all 124 PNGs via `remove_magenta.py`, 17/18 assets via `process_assets.py`, deployed 35 non-sprite assets + 107 sprite sheets to `assets/pixel/`.

**Files created:**
- `features/Platforms/components/GameArena.tsx` — sprite grid with cosmetic tap FX
- `features/Platforms/components/PlatformGroup.tsx` — parent company group header

**Files modified:**
- `App.tsx` — launch screen gate fix (deferred until `isComplete`)
- `app/navigation/TabBar.tsx` — `ImageBackground` texture, icon size 26
- `copy/info.ts` — "HOW IT WORKS" rename
- `copy/platforms.ts` — `groupHeader`, `arenaTitle`, `spriteReactions`
- `copy/shared.ts` — `totalSince2016`, `recentCycleShort`, `donationNoneOnFile`
- `features/Info/InfoScreen.tsx` — collapsible transparency, thicker dividers
- `features/Info/components/InfoSection.tsx` — `highlightBlue` top + `bgVoid` bottom borders
- `features/Map/MapScreen.tsx` — header bar, avoid dismiss animation, search pin guard, colocated pin routing
- `features/Map/components/BusinessCard.tsx` — sprite-left layout, donation hierarchy flip, all-zero guard, depth borders
- `features/Map/components/MapSearchBar.tsx` — depth borders
- `features/Map/components/MatchChooser.tsx` — `rewardYellow` heading, row left accent, depth borders
- `features/Map/hooks/useTapSearch.ts` — exposed `setLatestTapBatch`
- `features/Platforms/PlatformsScreen.tsx` — arena + grouping restructure
- `features/Platforms/components/DayCircles.tsx` — future circle style fix
- `tools/img-gen/scripts/process_assets.py` — `_erode_alpha_1px` step 4
- `tools/img-gen/scripts/remove_magenta.py` — `_erode_alpha_1px` step 3
- 107 sprite PNGs + 35 asset PNGs reprocessed with erosion

**Build:** Xcode build clean (0 errors).

---

> **Older sessions (March 9-16, 2026) archived to [`docs/PROGRESS_ARCHIVE.md`](./PROGRESS_ARCHIVE.md).**


---

## Test Status

| Suite | Count | Status |
|---|---|---|
| Total passing | 320 | All 30 suites green |
| Last tsc run | March 24, 2026 | Clean |

---

## Data Status

| Metric | Count |
|---|---|
| Total entities | 448 |
| Verified PAC (pipeline) | 161 |
| Confirmed no PAC (manual) | ~274 |
| Unverified | ~14 |
| Last fetch: --force run complete (March 11, 2026) | 161 entities, corrected attribution |
| Entities with R donations > 0 | 153 |
| Entities with D donations > 0 | 155 |
| Retry pending (cleared lastVerifiedDate) | 3 (sherwin-williams, baker-hughes, chick-fil-a) |
| Data integrity fix | perdue-farms stale donationSummary removed (was false-positive match to PERDUE FOR SENATE) |

---

## What's Working

- Full vertical slice: map scan → flag → business card → avoid tap → platforms → scorecard
- iOS app built and running on simulator (FckFascists.app on iPhone 16 Pro)
- Browser extension built and tested on walmart.com (Chrome)
- Entity matching pipeline with confidence labels, FEC API integration (anonymous mode)
- Design system: `design/tokens.ts` + all 26 components migrated to theme tokens
- Pixel art assets: 107 CEO sprites + 35 UI assets deployed, 4-step keying pipeline (flood fill, global magenta, binarization, 1px alpha erosion)
- Track screen: reducer-driven focus, FlatList layout, GameArena with 4 arena backgrounds, parent company grouping, day circles
- Shared FX system (`core/fx/`): FXLayer + useFX + effect registry with avoid celebration
- App architecture: App.tsx (112 lines) → OnboardingGate → LaunchGate → AppShell; all files under 250 lines
- Barcode scan (beta): dedicated Scan tab, UPC-A/EAN-13, Open Food Facts resolution, SQLite cache
- AIRMap.m nil guard patch automated via Podfile `post_install` hook

## What's Not Working / Not Yet Built

| Item | Status | Priority |
|---|---|---|
| Physical device geolocation test | Done — works, continuing testing | V1 ✅ |
| 3 entities pending retry (sherwin-williams, baker-hughes, chick-fil-a) | Run plain fetch:donations | Nice to have |
| people.json individual donor data | Generated (22K-line people.json with bulk donor data), not yet surfaced in UI | V1.5 |
| Copy naming cleanup (Label suffix inconsistencies) | Deferred | Pre-1.0 |
| Scorecard sharing / social export | Not built | V2 |
| Repo hygiene automation (pre-commit hooks, branch protection) | Not set up | Nice to have |

---

## Immediate Next Steps (in order)

1. **Continue physical device testing** — ongoing polish pass, testing full vertical slice on hardware
2. **Wire remaining pixel art assets** — `marker_flag_selected.png` (selected state), `corners_yellow_reward_0-3.png` (reward corners), `bottom_nav_shell.png`, `search_shell_caps`, `scorecard_preview_stamp`, `onboarding_hero_welcome`, FX animation frames. `business_card_reward_overlay.png` already wired.
3. **Surface people.json donor data in UI** — V1.5: individual Schedule A contributions in DataZone

---

## Open Architectural Decisions

| Decision | Context | Status |
|---|---|---|
| Map POI tap scope | Full pipeline match used (alias first, FEC fuzzy fallback) | Resolved — full pipeline |
| Extension + scorecard unification | QR code bridge or permanently separate | Deferred V2 |
| App Store name | "F*ck Fascists" will be rejected — need clean submission name | Not resolved |
| Uber entity | No PAC found, name-based match failing | Needs manual research |

---

## Agent Roster

| Agent | Current task |
|---|---|
| Lead Architect | Documentation, decisions, CC prompt generation |
| Claude Code | Implementation — awaiting next prompt |

---

## Recently Resolved Decisions

- OpenSecrets → FEC.gov as primary data source
- Schedule B disbursements for partisan attribution (not committee totals)
- fecCommitteeId three-state schema (string / null / "")
- verificationStatus numeric migration
- matchScore removed from Entity type
- App / extension material data-state changes must stay in parity unless explicitly deferred to V2
- Tesla → null (no corporate PAC, Musk donates personally)
- Patagonia → removed (IE filer only, no Republican history)
