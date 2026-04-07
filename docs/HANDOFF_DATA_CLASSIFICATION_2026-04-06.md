# Data Classification Handoff - April 6, 2026

This handoff is for the staging branch `codex/data-classification-staging`.

It is specifically for the donation-classification cleanup across `people.json` and `entities.json`, using local FEC bulk data under `tools/fec-bulk/`.

## April 7 Update

This handoff remains useful for workflow/history, but the authoritative current methodology and totals now live in:

1. `docs/BENEFICIARY_CLASSIFICATION_SPEC.md`
2. `docs/DATA_CLASSIFICATION_STAGING.md`
3. `docs/PROGRESS.md`

Important superseding changes from the April 7 review:

- fallback-only committee cycles already present in `people.json` are now retained in the committee map even with zero beneficiary evidence
- final people hydration should use raw-normalized summaries rather than preserve legacy summary-only drift
- final PAC displayed `totalOther` / `recentOther` exclude lines `21B` and `28A`, while those rows remain in `raw[]` for audit
- the current reviewed preview totals are the `2026-04-07` report numbers after those fixes, not the earlier figures quoted below

## Read This First

1. `docs/PROGRESS.md`
2. `docs/DATA_CLASSIFICATION_STAGING.md`
3. `docs/BENEFICIARY_CLASSIFICATION_SPEC.md`
4. `scripts/build-data-classification-staging-report.mjs`
5. `scripts/build-committee-beneficiary-map.mjs`
6. `scripts/build-people-classification-preview.mjs`
7. `scripts/build-pac-line23-rehydration-preview.mjs`
8. `scripts/build-entities-classification-preview.mjs`
9. `scripts/build-inherently-partisan-staging-report.mjs`
10. `scripts/lib/inherentlyPartisanSources.mjs`

## Branch + Guardrails

- Branch: `codex/data-classification-staging`
- Keep this work isolated until final verification.
- The reviewed April 7 hydration has already overwritten:
  - `assets/data/people.json`
  - `assets/data/entities.json`
  - `assets/data/people.bundle.json`
  from the approved `2026-04-07` preview artifacts.
- Do not rerun the legacy fetch/hydration scripts over those live files and assume they will reproduce the same reviewed totals.
- Do not modify TypeScript types, UI code, or extension copy as part of this cleanup.
- Do not run live API workflows like `npm run fetch:donations` or `npm run verify:entities` without explicitly flagging that first.
- Do not commit bulk data files under `tools/fec-bulk/`.

## Important Context

There are many unrelated user changes already in the worktree. Do not revert or clean them up. This branch contains broader in-flight work outside this data-classification track.

The data-classification staging work in this session is concentrated in:

- `docs/DATA_CLASSIFICATION_STAGING.md`
- `docs/BENEFICIARY_CLASSIFICATION_SPEC.md`
- `scripts/build-data-classification-staging-report.mjs`
- `scripts/build-committee-beneficiary-map.mjs`
- `scripts/build-people-classification-preview.mjs`
- `scripts/build-pac-line23-rehydration-preview.mjs`
- `scripts/build-entities-classification-preview.mjs`
- `scripts/build-inherently-partisan-staging-report.mjs`
- `scripts/lib/inherentlyPartisanSources.mjs`

Generated reports were written under:

- `tools/fec-bulk/reports/data-classification-staging-2026-04-06.md`
- `tools/fec-bulk/reports/data-classification-staging-2026-04-06.json`
- `tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-06.md`
- `tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-06.json`
- `tools/fec-bulk/reports/people-classification-preview-2026-04-06.md`
- `tools/fec-bulk/reports/people-classification-preview-2026-04-06.json`
- `tools/fec-bulk/reports/people-classification-preview-2026-04-06.people.json`
- `tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.md`
- `tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.json`
- `tools/fec-bulk/reports/pac-line23-rehydration-preview-2026-04-06.rows.json`
- `tools/fec-bulk/reports/entities-classification-preview-2026-04-06.md`
- `tools/fec-bulk/reports/entities-classification-preview-2026-04-06.json`
- `tools/fec-bulk/reports/entities-classification-preview-2026-04-06.entities.json`
- `tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.md`
- `tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.json`
- `tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.people.rows.json`
- `tools/fec-bulk/reports/inherently-partisan-staging-2026-04-07.entities.rows.json`
- `tools/fec-bulk/reports/people-classification-preview-2026-04-07.md`
- `tools/fec-bulk/reports/people-classification-preview-2026-04-07.json`
- `tools/fec-bulk/reports/people-classification-preview-2026-04-07.people.json`
- `tools/fec-bulk/reports/entities-classification-preview-2026-04-07.md`
- `tools/fec-bulk/reports/entities-classification-preview-2026-04-07.json`
- `tools/fec-bulk/reports/entities-classification-preview-2026-04-07.entities.json`

Note: the `2026-04-07` filenames are UTC date stamps from `toISOString()`. The local work session was still April 6, 2026 ET.

## Bulk Data Now Present Locally

The user added and/or unpacked local FEC data under the gitignored bulk-data tree:

- `cm*.txt`
- `ccl*.txt`
- `itpas2*.txt`
- `cn16/cn.txt` through `cn26/cn.txt`
- `oth16/itoth.txt` through `oth26/itoth.txt`
- header reference files including:
  - `cm_header_file.csv`
  - `ccl_header_file.csv`
  - `cn_header_file.csv`
  - `indiv_header_file.csv`
  - `oth_header_file.csv`
  - `pas2_header_file.csv`

These are local-only and must stay out of git.

## What Has Been Decided

### Core classification rule

Use a no-floor beneficiary system.

- Classify each `committeeId + cycle` independently.
- If `R_share >= 80%`, classify `R`.
- If `D_share >= 80%`, classify `D`.
- Otherwise classify `O`.
- If there are zero scoreable beneficiary rows, classify `O`.

### Important design choice

There is no minimum dollar floor or row floor.

Instead, classification and review are separated:

- the classifier uses the uniform no-floor rule above
- thin-evidence or high-impact outcomes are surfaced in QA output
- QA flags do not silently change the rule

### Form 13 / inaugural decision

The user wants inaugural donations added as part of this pipeline.

Keep that implementation simple and repeatable:

- discover inaugural committees from `GET /filings?form_type=F13`
- do not hardcode inauguration committee names
- do not make `cycle` a required discovery filter

Important nuance:

- keep `cycle` in the final hydrated data where needed for attribution, because the app ships "since 2016" data and the final pass should include ongoing cycles
- but do not over-engineer discovery around cycle-specific lookups if `form_type=F13` already gives the committee set

The tested reliable fetch shape is:

1. `filings?form_type=F13`
2. collect unique inaugural `committee_id`s
3. prefer filing CSVs when they exist
4. `schedule_a?committee_id=...` only as the fallback for weird missing-CSV cases

Do **not** rely on a global `schedule_a?filing_form=F13` query as the primary source.

Also note:

- inaugural committees are inherently partisan for this project
- committee metadata often leaves `party` blank, so do not rely on `committee.party` to classify them
- for shipped data, keep any inaugural raw shape as compact as possible while still preserving the attribution fields we need

### Fallback order

1. Formal major-party code from `cm*.txt`
2. Candidate-committee party from `ccl*.txt` + `cn*.txt`
3. Beneficiary classification from `PAS2` and `OTH`

### April 3 manual report

`tools/fec-bulk/reports/committee-party-verification-2026-04-03.md` is now QA-only.

It is not the decision engine anymore.

The new generator flags disagreements with that report for review.

The committee-beneficiary output was later tightened so it now:

- flags **all** mismatches with the April 3 manual recommendation, not only `leave unclassified -> R/D`
- carries `committeeName` through the finalized committee-cycle output
- prints committee names directly in the markdown QA sections

## What The Scripts Currently Do

### `scripts/build-data-classification-staging-report.mjs`

Non-mutating baseline audit.

It measures the current bundled data and confirms the core gaps:

- people-side unresolved dollars are concentrated in `committeeParty: null`
- committee master alone does not recover those committees
- PAC `raw[]` is dominated by line `23` and line `29`
- PAC line `21B` and `28A` are non-donation rows that should be excluded from display totals
- current PAC `raw[]` shape no longer preserves recipient committee IDs

### `scripts/build-committee-beneficiary-map.mjs`

Staging-only committee-cycle classifier and people-side projection.

It reads:

- `cm*.txt`
- `ccl*.txt`
- `cn*/cn.txt`
- `itpas2*.txt`
- `oth*/itoth.txt`
- `assets/data/people.json`
- the April 3 manual verification report

It writes:

- committee-cycle classifications
- classification method counts
- QA conflict list
- thin-evidence review list
- projected people-side movement from `O` into `R/D`

It does not rewrite app data.

### `scripts/build-people-classification-preview.mjs`

Staging-only `people.json` rewrite preview.

It reads:

- `assets/data/people.json`
- the latest committee beneficiary report
- the latest inherently partisan staging people-row output

It writes:

- before/after people totals
- movement-by-method summaries
- inherently partisan additions
- donor spot-checks
- a full preview file outside the live bundle path

### `scripts/build-pac-line23-rehydration-preview.mjs`

Staging-only PAC `line 23` source recovery from `oth*.txt`.

It reads:

- `assets/data/entities.json`
- `cm*.txt`
- `ccl*.txt`
- `cn*/cn.txt`
- `oth*/itoth.txt`
- the latest committee beneficiary report

It writes:

- current bundled line `23` / `29` / excluded totals
- raw-equivalent line `23` source totals
- projected PAC movement into `R/D/O`
- a compact aggregated recipient-level row file

### `scripts/build-entities-classification-preview.mjs`

Staging-only `entities.json` rewrite preview.

It reads:

- `assets/data/entities.json`
- the latest PAC line `23` preview outputs
- the latest inherently partisan staging entity-row output

It writes:

- before/after PAC totals
- inherently partisan additions
- a compact `raw[]` preview candidate
- a full preview `entities.json` outside the live bundle path

The current preview shape:

- moves reclassified line `23` dollars into `totalRepubs` / `totalDems`
- folds inherently partisan entity additions into `totalRepubs` / `totalDems` and cycle stats
- keeps `raw[]` as unresolved / excluded remainder only
- preserves `cycle` and `recipientCommitteeId` on unresolved line `23` rows
- includes ongoing cycle `2026` source rows in the staging preview

### `scripts/build-inherently-partisan-staging-report.mjs`

Staging-only inherently partisan additive pass.

It reads:

- `assets/data/people.json`
- `assets/data/entities.json`
- local bulk under `tools/fec-bulk/`
- live FEC inaugural discovery only where needed for Form 13 data

It writes:

- inaugural people rows
- inaugural entity rows
- entity-side national party account rows
- QA counts and top matches

Important implementation notes:

- bulk-first by default
- use filing CSVs for `F13` when present
- use `schedule_a` API only for weird cases like the 2018 inaugural committee with no usable CSV coverage

## Current Form 13 Research

Official sources checked:

- [FEC Form 13 PDF](https://www.fec.gov/pdf/forms/fecfrm13.pdf)
- [FEC inaugural committee funding guidance](https://www.fec.gov/help-candidates-and-committees/presidential-transition-and-inauguration/funding-inaugural-committee-activities/)
- [FEC receipts data overview](https://www.fec.gov/campaign-finance-data/about-campaign-finance-data/about-receipts-data/)

Live API behavior already verified:

- `GET /filings?form_type=F13` returns inaugural committee filings generically
- `GET /filings?committee_id=<id>&form_type=F13` works for spot checks
- `GET /schedules/schedule_a?committee_id=<id>` returns incoming donation rows for those inaugural committees
- filing CSVs are available for some committees and should be preferred when present
- the current weird fallback is the 2018 inaugural committee, which still needs `schedule_a` API pagination because usable CSV coverage is missing

Current implementation gap:

- the legacy live hydration scripts still exclude inaugural committees today
- the staging-only gap is now closed via `scripts/build-inherently-partisan-staging-report.mjs`
- `scripts/fetch-donation-data.mjs` still excludes inaugural committees because it filters recipient committee types to `H`, `S`, and `P`
- `scripts/fetch-people-data.mjs` may incidentally pick up some inaugural donations by donor-name search, but it still does not run the explicit staged `F13` logic used in the new reports

## Current National Party Account Research

The user does **not** want this identified by name-search heuristics like `RNC` / `DNC`.

The better local-bulk method is now established:

- discover special-account recipients from local bulk text first, not committee-name search
- use `MEMO_TEXT` and, when needed on `oth*.txt`, the raw `NAME` field to detect:
  - `CONVENTION ACCOUNT`
  - `HEADQUARTERS ACCOUNT`
  - `RECOUNT ACCOUNT`
  - `BUILDING FUND`
  - `HQ ACCOUNT`
- require recipient committee structure:
  - `CMTE_TP=Y`
  - major-party affiliation from `cm*.txt`
- use `30* / 31* / 32*` as corroboration when present, but not as the only admissible signal
- only kick a row to QA when an explicit `30* / 31* / 32*` prefix contradicts the detected account type

Why this is better:

- it is schema-driven, not name-driven
- it already works from local bulk without depending on the live API
- local spot checks confirm `MEMO_TEXT` values such as `CONVENTION ACCOUNT`, `HEADQUARTERS ACCOUNT`, and `RECOUNT ACCOUNT`

Verification rule:

- Memo is valuable and should be used.
- `NAME` is also useful on `oth*.txt` when memo is blank.
- But the final classifier should still require structural confirmation:
  - recipient committee ID in the discovered party-account committee map
  - recipient committee party from `cm*.txt`
  - `CMTE_TP=Y`
- If an explicit `30* / 31* / 32*` prefix disagrees with the detected account type, surface the row in staged review instead of auto-classifying it.

Current state:

- people-side national-party receipts are already present in `people.json`
- entity-side party-account giving is now folded into both the reviewed staging previews and the live `entities.json` hydration
- when this moves into the final live hydration, keep it aggregated directly into `R/D` totals instead of bloating shipped `raw[]`

## Current Verified Results

### Baseline

- `people.json` current `totalO`: `$831,755,875` (`14.36%`)
- `entities.json` PAC raw amount: `$322,623,757.63`
- PAC line `23`: `$168,861,676.01`
- PAC line `29`: `$146,439,819.01`
- PAC excluded `21B + 28A`: `$4,627,172.41`

### Beneficiary projection

From `committee-beneficiary-classification-2026-04-06.*`:

- projected move to `R`: `$285,278,285`
- projected move to `D`: `$300,786,005`
- projected people `totalO`: `$245,691,585`
- projected people `O` share: `4.24%`

This hits the user target on paper.

### People rewrite preview

From `people-classification-preview-2026-04-07.*`:

- beneficiary reclass to `R`: `$285,334,834`
- beneficiary reclass to `D`: `$300,853,668`
- inherently partisan add to `R`: `$18,775,000`
- inherently partisan add to `D`: `$6,334,995.20`
- preview `totalO`: `$243,407,302`
- preview `O` share: `4.19%`

This is the beneficiary projection plus the inaugural add-on.

### Inherently partisan staging report

From `inherently-partisan-staging-2026-04-07.*`:

- inaugural people matched: `$25,109,995.20` across `89` rows / `88` people
- inaugural entities matched: `$71,618,222.54`
- entity-side party accounts matched: `$11,947,900`
- combined inherently partisan entity additions: `$83,566,122.54`
- party-account QA mismatches after the rule tighten: `89`

### PAC line 23 source preview

From `pac-line23-rehydration-preview-2026-04-06.*`:

- OTH `24K` line `23` total: `$632,270,581`
- raw-equivalent line `23`: `$170,833,963`
- projected move to `R`: `$90,209,827`
- projected move to `D`: `$67,421,956`
- projected stay `O`: `$13,202,180`
- ongoing cycle `2026` source in that total: `$20,765,335`

### Entities rewrite preview

From `entities-classification-preview-2026-04-07.*`:

- preview `totalRepubs`: `$378,495,714.88`
- preview `totalDems`: `$245,517,046.96`
- preview `totalOther`: `$183,129,052.22`
- inherently partisan add to `R`: `$52,719,139.23`
- inherently partisan add to `D`: `$17,205,233.84`
- ongoing inherently partisan `2026` source: `$46,952,927.41`
- `raw[]` row count: `1,897 -> 3,975`
- preview file bytes: `732,800 -> 1,210,184`
- `donationSummary.totalOther` is populated on all `190` entities with summaries

### Jeff Bezos edge case

Jeff Bezos remains unresolved in the projection:

- current `O`: `$10,129,170`
- projected `R`: `$0`
- projected `D`: `$0`
- projected `O`: `$10,129,170`

This is desirable under the current rules because `WITH HONOR FUND` should only move if the evidence clearly supports it.

## Important Risks Already Identified

### 1. Thin evidence can still classify under a no-floor system

This is expected, not a bug.

The mitigation is QA visibility, not a hidden floor.

The report already flags high-impact / low-evidence outcomes, including examples like:

- `TEAM KENNEDY`
- `MISSOURI STANDS UNITED`
- `FAIR FIGHT`

### 2. PAC line 23 still requires source rehydration

The current `entities.json` `raw[]` entries do not preserve recipient committee IDs.

That means the beneficiary map alone is not enough to safely rewrite PAC totals from the bundled file.

Use `oth*.txt` as the PAC rehydration source.

### 2b. OTH does not fully backfill every historic bundled line 23 dollar

The staged entity preview still preserves:

- `$21,009,748.01` as legacy residual line `23` with no recipient mapping
- `$1,822,700` of historic source rows ignored because the current bundle has no matching control row

That is an expected current limitation, not automatically a blocker, but it should be reviewed before any future live overwrite.

### 3. State/local line 29 is still a separate problem

Federal FEC bulk data is not enough to classify most state/local spending.

More FEC federal files are unlikely to solve that on their own.

Likely future sources:

- FollowTheMoney / OpenSecrets state-level data
- official state campaign-finance datasets
- a later curated/manual description layer

For now, most of line `29` should remain `O` unless a defensible external source is added.

### 4. Inherently partisan staging is in place and the reviewed live hydration is complete

The staging scripts fold inaugural and party-account rows into the preview files, and the reviewed April 7 hydration has already copied those approved preview outputs into the live bundle files.

Recommended implementation order from here:

1. treat the hydrated live assets as the source of truth for the app/runtime integration work
2. keep the compact shipped shape unchanged unless a new reviewed staging pass justifies another rewrite
3. harden or deprecate the legacy fetch/hydration scripts so they cannot silently overwrite the reviewed methodology

## Recommended Next Steps

### Next step 1: treat the hydrated assets as authoritative

Use the current reviewed preview outputs and the live hydrated assets as the handoff baseline:

- `inherently-partisan-staging-2026-04-07.*`
- `people-classification-preview-2026-04-07.*`
- `pac-line23-rehydration-preview-2026-04-06.*`
- `entities-classification-preview-2026-04-07.*`
- `assets/data/people.json`
- `assets/data/entities.json`
- `assets/data/people.bundle.json`

Questions to answer before any future live overwrite:

- Is the compact unresolved-line-`23` raw shape small enough to ship?
- Is the `$21.01M` legacy residual line `23` bucket acceptable for a first live rewrite?
- Are the ongoing-cycle `2026` additions acceptable in the final hydration pass?

### Next step 1b: preserve the current reviewed hydration posture

For any future refresh:

- keep the inaugural discovery path simple: `form_type=F13`, then filing CSV or `schedule_a` fallback
- keep the party-account rule bulk-first and structure-verified
- preserve `cycle` where it materially affects shipped attribution
- keep entity `raw[]` compact by folding resolved inherently partisan rows into summary totals instead of storing them as shipped audit rows

### Next step 2: app integration and legacy-path hardening

Before touching live data files again, review:

- QA conflicts with the April 3 report
- thin-evidence / high-impact committee outcomes
- donor spot-checks for:
  - Jeff Bezos
  - Richard Uihlein
  - Reid Hoffman
  - Miriam Adelson
  - Michael Bloomberg
- PAC top movers and unresolved recipients from the staged entity preview

For the current app work:

- treat the hydrated live assets as authoritative for people/entity donation summaries
- audit runtime fallback paths and legacy fetch scripts so they cannot silently reintroduce pre-review totals
- prefer adding one canonical reviewed-hydration/apply path over continuing to use the older live fetch scripts as a rewrite mechanism

## Commands Already Run Successfully

```bash
node --check scripts/build-data-classification-staging-report.mjs
node scripts/build-data-classification-staging-report.mjs
node --check scripts/build-committee-beneficiary-map.mjs
node scripts/build-committee-beneficiary-map.mjs
node --check scripts/build-people-classification-preview.mjs
node scripts/build-people-classification-preview.mjs
node --check scripts/build-pac-line23-rehydration-preview.mjs
node scripts/build-pac-line23-rehydration-preview.mjs
node --check scripts/build-entities-classification-preview.mjs
node scripts/build-entities-classification-preview.mjs
node --check scripts/lib/inherentlyPartisanSources.mjs
node --check scripts/build-inherently-partisan-staging-report.mjs
node scripts/build-inherently-partisan-staging-report.mjs
```

## Notes For The Next Instance

- Keep the solution centered on the no-floor system. Do not reintroduce a minimum floor unless the user explicitly changes direction.
- Treat classification and confidence as separate concepts.
- Prefer staging outputs and auditability over silent mutation.
- For the final PAC hydration pass, include ongoing cycles such as `2026`; do not freeze the logic at `2024`.
- Keep the eventual shipped PAC `raw[]` compact: unresolved line `23` rows should keep `cycle` plus `recipientCommitteeId`, while richer rationale stays in staging reports.
- Keep the Form 13 inauguration pass equally simple: discover committees from `form_type=F13`, then fetch `schedule_a` by committee ID, and only preserve `cycle` where it matters in the final shipped data.
- Assume the user wants this very well documented.
- If the next step needs live API calls, pause and flag that first.
