# Data Classification Staging

This document defines the safe workflow for the donation-classification cleanup on branch `codex/data-classification-staging`.

April 7, 2026 status:

- the reviewed `2026-04-07` preview artifacts have already been hydrated into:
  - `assets/data/people.json`
  - `assets/data/entities.json`
  - `assets/data/people.bundle.json`
- treat this document as the methodology and regeneration workflow reference
- do **not** rerun the legacy fetch/hydration scripts over the live files and assume they reproduce the reviewed totals

## Guardrails

- The reviewed April 7 hydration has already rewritten `assets/data/entities.json`, `assets/data/people.json`, and `assets/data/people.bundle.json` from the approved preview artifacts. Do **not** overwrite those files by rerunning the legacy fetch/hydration scripts.
- For any future refresh, rebuild staging outputs first, review them, then hydrate from the approved preview artifacts and regenerate `people.bundle.json`.
- Do not change TypeScript models, UI code, or extension rendering as part of this branch stage.
- Do not run `npm run fetch:donations` or `npm run verify:entities` without explicitly flagging the API usage first.
- Do not commit anything under `tools/fec-bulk/` except generated reports that are already meant to live in git.

## Verified Baseline

These findings were re-checked directly against the local files on April 6, 2026.

### People

- `assets/data/people.json` currently carries about `$831.76M` in `donationSummary.totalO`.
- About `$805.45M` of that bucket comes from rows where `committeeParty` is `null`.
- The remaining `O` dollars are mostly genuine non-R/non-D committee codes such as `IND`, `OTH`, `LIB`, `UN`, and similar minor-party or non-major-party values.
- Important constraint: the still-`null` committee IDs in `people.json` are also blank in the local `cm*.txt` committee master files. That means a simple committee-master join will **not** recover the remaining people-side bucket by itself.
- The existing manual verification report already appears to have moved the obvious `R` and `D` recommendations out of the unresolved bucket. The unresolved overlap with that report is now concentrated in committees that were intentionally left unclassified.

### Entities

- `assets/data/entities.json` currently stores about `$322.62M` in `donationSummary.raw[]`.
- The file does **not** currently persist `donationSummary.totalOther`, even though the UI/runtime code already knows how to read it.
- The PAC raw bucket is still dominated by line `23` and line `29`, with smaller line `21B` and `28A` slices that should be excluded from displayed political-donation totals.
- Critical storage gap: PAC raw rows are already collapsed to `{ lineNumber, description, amount, cycle }`. They no longer retain recipient committee IDs, so line `23` donations cannot be reclassified in place from `entities.json` alone.

## What This Means

We need two separate cleanup tracks:

1. **People cleanup**
   - Reuse the local `committeeId` already stored on each contribution row.
   - Classify committees from federal beneficiary evidence, not only from formal FEC party codes.
   - Preserve truly bipartisan or mixed committees as `O`.

2. **PAC cleanup**
   - Rehydrate from source disbursement records before recomputing totals.
   - Preserve recipient committee IDs in staging output so line `23` can be classified through committee lookup and beneficiary evidence.
   - Keep the eventual bundled `raw[]` shape compact: unresolved line `23` rows should keep `cycle` and `recipientCommitteeId`, but reclassified line `23` dollars should move into `R/D` totals instead of staying in `raw[]`.
   - Exclude non-donation line items such as `21B` and `28A` from displayed totals while optionally preserving them in raw audit output.

## Classification Spec

The active staging rule set is defined in [`docs/BENEFICIARY_CLASSIFICATION_SPEC.md`](/Users/christophershannon/fuckfascists/docs/BENEFICIARY_CLASSIFICATION_SPEC.md).

Key decisions:

- no minimum floor
- 80% beneficiary threshold
- classify per `committeeId + cycle`
- keep formal FEC major-party codes as a fallback for already-coded committees
- use the April 3, 2026 verification report as QA only, not as the decision engine

## Form 13 / Inaugural Add-On

This branch is also preparing to add inaugural-committee donations.

The agreed shape is intentionally minimal:

- Discover inaugural committees generically from `GET /filings?form_type=F13`.
- Do **not** hardcode inauguration committee names.
- Do **not** require `cycle` for committee discovery unless it is only being used as an optional batching or spot-check filter.

What the live API tests showed:

- `form_type=F13` works reliably on the `filings` endpoint and returns inaugural committee filings.
- `schedule_a` donation rows are available when queried by inaugural `committee_id`.
- A global `schedule_a?filing_form=F13` shortcut was not reliable enough to use as the primary pipeline.
- Inaugural committee metadata often leaves `party` blank, so committee-master party alone is not sufficient.
- Filing CSVs are available for some inaugural committees and are preferable when present because they are much faster and simpler than paginating all of `schedule_a`.
- The current weird-case fallback is the 2018 inaugural committee, which still needs `schedule_a` API pagination because the current filing records do not expose usable CSV coverage.

Current implementation guidance:

- Treat inaugural ingestion as a separate additive pass, not as part of the beneficiary classifier itself.
- Use this fetch order:
  - discover inaugural `committeeId`s from `F13` filings
  - prefer filing CSVs when a discovered filing exposes them
  - fall back to `schedule_a` rows by committee ID only when CSV coverage is missing
- Assign `R` / `D` from the inaugural cycle decision, not from `committee.party`.
- Keep the shipped raw data compact:
  - move fully classified inaugural dollars into summary totals instead of leaving bulky donor-level audit rows in `raw[]`
  - people-side staging may append compact row-level evidence for verification, but entity-side shipped data should stay summary-first
  - if any inaugural raw evidence must ship, keep only the minimum needed for attribution and review, with `cycle` preserved
- Include ongoing cycles in the final hydration pass because the app data is "since 2016", not frozen at `2024`

Current known gap in the existing scripts:

- [`scripts/fetch-donation-data.mjs`](/Users/christophershannon/fuckfascists/scripts/fetch-donation-data.mjs) currently filters recipient committees to `H`, `S`, and `P`, so inaugural recipients are excluded today.
- [`scripts/fetch-people-data.mjs`](/Users/christophershannon/fuckfascists/scripts/fetch-people-data.mjs) may already pick up some inaugural donations indirectly through contributor-name searches, but it does not run a dedicated `F13` pass or keep inaugural provenance separate.

## National Party Accounts

Current branch status for national party committees and their special accounts is split:

- **People:** included today.
  - The bulk hydrator scans individual contribution rows broadly and classifies them from committee master party data.
  - That means receipts to clearly partisan national-party committees already land in `R` / `D` when the committee master carries `REP` or `DEM`.
  - Spot checks against the current `people.json` found live rows for:
    - `C00003418` / `REPUBLICAN NATIONAL COMMITTEE`
    - `C00010603` / `DNC SERVICES CORP / DEMOCRATIC NATIONAL COMMITTEE`
    - `C00827022` / `2024 DEMOCRATIC NATIONAL CONVENTION COMMITTEE`
- **Entities:** not included today in the PAC totals pipeline.
  - [`scripts/fetch-donation-data.mjs`](/Users/christophershannon/fuckfascists/scripts/fetch-donation-data.mjs) fetches donor-side Schedule B only for `recipient_committee_type=H|S|P`, so party committees and special party accounts are excluded from current `entities.json` partisan totals.
  - If national party account giving is added to entities, it should be treated as inherently partisan and folded in through a separate explicit pass rather than assumed to already exist in the PAC candidate-recipient data.

### Better bulk-first identification method

Do **not** rely on committee-name search like `RNC` / `DNC` as the primary identification rule.

The local bulk files already expose better schema signals:

- [`tools/fec-bulk/indiv_header_file.csv`](/Users/christophershannon/fuckfascists/tools/fec-bulk/indiv_header_file.csv) and [`tools/fec-bulk/oth_header_file.csv`](/Users/christophershannon/fuckfascists/tools/fec-bulk/oth_header_file.csv) both include:
  - `TRANSACTION_TP`
  - `MEMO_TEXT`
  - committee IDs
- FEC transaction-type descriptions explicitly reserve:
  - `30*` for Convention Account receipts
  - `31*` for Headquarters Account receipts
  - `32*` for Recount Account receipts
- Local bulk spot checks already show those markers in practice, including rows whose `MEMO_TEXT` contains:
  - `CONVENTION ACCOUNT`
  - `HEADQUARTERS ACCOUNT`
  - `RECOUNT ACCOUNT`

Recommended implementation:

1. Build a `partyAccountCommitteeMap` from bulk, not names.
   - Discover national-party recipients from `indiv*/by_date/*.txt` using account text such as `CONVENTION ACCOUNT`, `HEADQUARTERS ACCOUNT`, `RECOUNT ACCOUNT`, `BUILDING FUND`, and `HQ ACCOUNT`.
   - Require `CMTE_TP=Y` plus major-party affiliation from `cm*.txt` so candidate committees do not leak into the map.
   - Treat `30* / 31* / 32*` as corroboration when present, not as the only admissible discovery signal.
2. Use that discovered committee map as the canonical inherently-partisan recipient set.
   - `REP` -> Republican bucket
   - `DEM` / `DFL` -> Democratic bucket
3. For people:
   - fold these rows in directly from `indiv` bulk
   - no API or committee-name search required
4. For entities:
   - scan `oth*/itoth.txt`
   - match rows where `OTHER_ID` is in the `partyAccountCommitteeMap`
   - detect the account type from `MEMO_TEXT` and, when memo is blank, the raw `NAME` field
   - treat `BUILDING FUND` / `HQ ACCOUNT` as headquarters-account variants
5. Keep the shipped data compact.
   - Once the recipient committee is mapped, roll the dollars into `totalRepubs` / `totalDems`
   - avoid storing verbose account descriptions in shipped `raw[]` unless needed for unresolved audit residue

Verification rule for the full run:

- Treat `MEMO_TEXT` as gold for spotting party-account rows and subtypes.
- Also allow the raw `NAME` field to corroborate the account type on `oth*.txt` rows when memo is blank.
- But do not classify from free text alone.
- Require structural confirmation:
  - recipient committee ID discovered in the `partyAccountCommitteeMap`
  - recipient committee party from `cm*.txt`
  - `CMTE_TP=Y` on the recipient committee
- Use `30* / 31* / 32*` as an additional check when those prefixes appear.
- If a row explicitly carries a `30* / 31* / 32*` prefix that contradicts the detected account type, keep it in staged QA instead of silently classifying it.

Important nuance:

- these accounts are broader than only the base `RNC` / `DNC` committee IDs
- the local bulk already shows separate committee IDs for convention and headquarters-account recipients
- convention, headquarters, and recount accounts should therefore be discovered from transaction-code families and committee IDs, not assumed from top-level committee names

## Current Staging Outputs

These reports and preview files now exist under `tools/fec-bulk/reports/`:

- `committee-beneficiary-classification-2026-04-06.*`
  - committee-cycle classifier + people projection
  - now includes committee names and all April 3 recommendation mismatches, not only `leave unclassified -> R/D`
- `people-classification-preview-2026-04-06.*`
  - staging-only `people.json` rewrite preview
  - projected `totalO`: `$245,691,585` (`4.24%`)
- `pac-line23-rehydration-preview-2026-04-06.*`
  - compact aggregated line `23` recipient recovery from `oth*.txt`
  - identifies `$170.83M` raw-equivalent line `23` plus `$20.77M` in ongoing cycle `2026`
- `entities-classification-preview-2026-04-06.*`
  - staging-only `entities.json` rewrite preview
  - preview totals:
    - `totalRepubs`: `$325,776,575.65`
    - `totalDems`: `$228,311,813.12`
    - `totalOther`: `$187,756,224.63`
  - preview stores `totalOther` / `recentOther` on all donation summaries
  - preview `raw[]` remains unresolved / excluded remainder only
  - preview byte size: `732,800 -> 1,210,184`
- `inherently-partisan-staging-2026-04-07.*`
  - staging-only inherently partisan additive pass
  - inaugural people matched: `$25,109,995.20` across `89` rows / `88` people
  - inaugural entities matched: `$71,618,222.54`
  - entity-side party accounts matched: `$11,947,900`
  - combined entity inherently partisan additions: `$83,566,122.54`
  - reports are stamped `2026-04-07` because the scripts use UTC `toISOString()` dates
- `people-classification-preview-2026-04-07.*`
  - beneficiary reclassification plus inherently partisan additions
  - preview `totalO`: `$243,407,302` (`4.19%`)
  - inherently partisan add to `R`: `$18,775,000`
  - inherently partisan add to `D`: `$6,334,995.20`
  - current legacy summary-vs-raw drift surfaced in report: `$2,160,071` across `328` people
  - preview now normalizes people summaries back to raw rows consistently, leaving drift at `0`
  - fallback-only formal / candidate committee cycles observed in `people.json` are now retained in the committee map even with zero beneficiary evidence
- `entities-classification-preview-2026-04-07.*`
  - line `23` rehydration plus inherently partisan additions
  - preview totals:
    - `totalRepubs`: `$378,495,714.88`
    - `totalDems`: `$245,517,046.96`
    - `totalOther`: `$183,129,052.22`
  - inherently partisan additions:
    - to `R`: `$52,719,139.23`
    - to `D`: `$17,205,233.84`
  - ongoing inherently partisan `2026` source: `$46,952,927.41`
  - preview `raw[]` still remains unresolved / excluded remainder only
  - preview `totalOther` / `recentOther` now exclude PAC lines `21B` and `28A`, while those rows remain in `raw[]` for audit

## Staging Workflow

### Stage 1: Measure without mutating

- Run a staging-only report script that reads:
  - `assets/data/people.json`
  - `assets/data/entities.json`
  - local `tools/fec-bulk/cm*.txt`
  - `tools/fec-bulk/reports/committee-party-verification-2026-04-03.md`
- Write markdown + JSON reports into `tools/fec-bulk/reports/`.
- Confirm the baseline, top unresolved committees, exclusion totals, and storage gaps before any rewrite.

### Stage 2: Define reusable classification inputs

- Move beneficiary-classification logic into staging helpers first, not runtime code.
- Keep explicit sources separate:
  - formal committee party from `cm*.txt`
  - candidate party from `cn*.txt`
  - candidate-committee linkages from `ccl*.txt`
  - direct candidate spending from `itpas2*.txt`
  - committee-to-committee transactions from `oth*.txt`
- Track provenance for every classification so we can tell whether a dollar came from:
  - formal FEC party
  - candidate committee linkage
  - PAS2 direct candidate evidence
  - OTH candidate-committee proxy evidence
  - intentional exclusion
  - intentional remainder

### Stage 3: People reclassification pass

- Build a staging rewrite path for `people.json` only after the beneficiary map confirms the target committees and totals.
- The current staging script is [`scripts/build-people-classification-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-people-classification-preview.mjs).
- It now also consumes the latest inherently partisan people-row staging output.
- It now explicitly reports current summary-vs-raw drift and normalizes preview summaries back to raw rows so the final hydration decision is no longer hidden in mixed legacy totals.
- Final people hydration should write those raw-normalized summaries directly.
- Do **not** preserve the legacy summary-only `totalO` drift in the live file.
- Recompute:
  - `totalR`
  - `totalD`
  - `totalO`
  - `recentCycleR`
  - `recentCycleD`
  - `recentCycleO`
- Spot-check known edge cases such as Jeff Bezos / WITH HONOR FUND before any final write.

### Stage 4: PAC rehydration pass

- Do not try to patch PAC `raw[]` from the already-collapsed file.
- Instead, build a staging pipeline from `oth*.txt` that preserves recipient committee identifiers and exclusion metadata.
- The current staging scripts are:
  - [`scripts/build-pac-line23-rehydration-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-pac-line23-rehydration-preview.mjs)
  - [`scripts/build-entities-classification-preview.mjs`](/Users/christophershannon/fuckfascists/scripts/build-entities-classification-preview.mjs)
- The entities preview script now also consumes the latest inherently partisan entity-row staging output.
- Current best candidate shape for the eventual bundled PAC `raw[]` is:
  - keep current non-line `23` rows such as line `29`, `21B`, and `28A`
  - move reclassified line `23` dollars into `totalRepubs` / `totalDems`
  - keep unresolved line `23` rows only, aggregated by `recipientCommitteeId + cycle`
  - include ongoing cycles such as `2026` in the final hydration pass
  - keep richer confidence / rationale detail in staging reports rather than in the shipped `raw[]`
- Final displayed PAC totals must exclude non-donation lines `21B` and `28A` even though those rows remain in `raw[]` for audit.
- Recompute PAC totals from staged data, compare against the current bundled file, and preserve legacy residual line `23` rows when `oth*.txt` does not fully backfill the historic bundle.

### Stage 4b: Inaugural Form 13 pass

- Build this as a separate staging pass before the final live rewrite.
- The current staging scripts for this are:
  - [`scripts/lib/inherentlyPartisanSources.mjs`](/Users/christophershannon/fuckfascists/scripts/lib/inherentlyPartisanSources.mjs)
  - [`scripts/build-inherently-partisan-staging-report.mjs`](/Users/christophershannon/fuckfascists/scripts/build-inherently-partisan-staging-report.mjs)
- Keep the discovery logic simple:
  - page through `GET /filings?form_type=F13`
  - collect unique inaugural `committeeId`s
  - prefer filing CSVs where they exist
  - fetch `schedule_a` rows by `committeeId` only for weird missing-CSV cases
- Do not depend on inauguration names in code or docs.
- Do not depend on a global `schedule_a?filing_form=F13` filter as the primary source.
- Classify these donations as inherently partisan by inaugural cycle.
- Preserve `cycle` in any shipped inaugural raw shape so ongoing cycles remain distinguishable in the final bundle.
- Prefer compact aggregation for any entity-side shipped raw evidence rather than storing full donor-level inauguration receipts in app data.

### Stage 5: Final write gate

For any future refresh, only after the staged outputs look correct:

- hydrate from the reviewed staging preview artifacts, not by rerunning the legacy live fetch scripts
- rewrite `assets/data/entities.json`
- rewrite `assets/data/people.json`
- regenerate `assets/data/people.bundle.json`
- run verification checks
- document the exact before/after totals

## Verification Gates

Before any final data rewrite, we should be able to answer all of these from staged output:

- How much of people `totalO` remains `null` after beneficiary classification?
- Which unresolved committees are intentionally left as `O`, and why?
- How much PAC raw value is actually line `23` vs line `29` vs excluded non-donation lines?
- How many PAC dollars are blocked only because the stored raw shape lost recipient committee IDs?
- How much ongoing-cycle PAC activity is being added beyond the current `2024` bundle horizon?
- Is the compact unresolved-line-`23` raw shape still small enough to ship comfortably?
- Is the planned inaugural raw shape still compact enough to ship comfortably while keeping `cycle` and required attribution fields?
- Does Jeff Bezos still show WITH HONOR FUND as `O`, or does new evidence justify a different treatment?

## Barcode Follow-On

The barcode/entity expansion should happen **after** the donor cleanup stabilizes.

- Treat it as a separate pass against producer/brand gaps.
- Use the existing OFF-derived producer research as the candidate list.
- Prefer adding missing parent entities first, then letting the scan layer pick them up, rather than mixing product-coverage edits into the donor-classification work.
