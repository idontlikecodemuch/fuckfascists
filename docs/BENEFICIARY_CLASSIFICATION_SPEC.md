# Beneficiary Classification Spec

This document defines the committee-classification rules for the staging branch `codex/data-classification-staging`.

The goal is to classify committees by **who their money helped elect**, not by branding or by whether the FEC committee master happens to carry a party code.

## Scope

- This spec is for **classification only**.
- It does **not** add independent expenditure or Schedule E tracking as an app feature.
- It does **not** change the runtime data model or UI.
- It is used first in staging reports and only later, after verification, in data rewrites.

## Core Decision Rule

Classify each `committeeId + cycle` independently.

- If `R_share >= 80%`, classify `R`.
- If `D_share >= 80%`, classify `D`.
- Otherwise classify `O`.
- If the committee reaches the beneficiary-scoring step with zero scoreable beneficiary rows, classify `O`.

There is **no minimum floor**. The system uses the same threshold rule for every committee.

## Inputs

### Formal committee / candidate data

- `cm*.txt`
  - committee master
  - used for formal committee-party audit only
- `cn*/cn.txt`
  - candidate master
  - provides candidate party
- `ccl*.txt`
  - candidate-committee linkage
  - maps candidate committees back to candidates and party

### Beneficiary evidence

- `itpas2*.txt`
  - direct committee-to-candidate contributions and candidate-directed spending
- `oth*/itoth.txt`
  - committee-to-committee transactions
  - used both for PAC row rehydration and for candidate-committee proxy classification

## Classification Order

### 1. Formal party fallback

If the committee already has a formal major-party code in the committee master:

- `REP` -> `R`
- `DEM` or `DFL` -> `D`

This remains the first fallback because the filer is already explicitly coded by FEC.

### 2. Candidate-committee fallback

If the committee is an authorized candidate committee linked through `CCL` to a candidate with a major-party code:

- candidate party `REP` -> `R`
- candidate party `DEM` or `DFL` -> `D`

### 3. Beneficiary classification

If the committee is still unresolved after the two fallbacks above, compute beneficiary shares from scoreable federal evidence and apply the 80% rule.

## Observed Committee-Cycle Coverage

When this classification system is used to rewrite `people.json`, the generator must not limit committee-cycle output only to committees that happened to appear in PAS2 or OTH evidence.

If a `committeeId + cycle` already appears in the current people raw rows and can be resolved by:

- formal committee party fallback, or
- candidate-committee fallback

then that committee-cycle should still be materialized in the classifier output even when scoreable beneficiary evidence is `0`.

Reason:

- otherwise fallback-only rows disappear from the committee map
- the people rewrite preview then silently leaves those donor rows in `O`
- that behavior contradicts the classification order above

## Scoreable Evidence

### A. PAS2 direct candidate evidence

Each PAS2 row is scored against the candidate party from `CAND_ID`.

Opposition codes invert the candidate party:

- `24A`
- `24N`

All other candidate-specific PAS2 codes are treated as helping the candidate's own party:

- `24C`
- `24E`
- `24F`
- `24H`
- `24K`
- `24P`
- `24R`
- `24Z`

Rows with no major-party candidate match are unscored.

### B. OTH candidate-committee proxy evidence

An OTH row is scoreable only when:

- `OTHER_ID` is another committee ID, and
- that recipient committee is linked through `CCL` to a candidate committee with a major-party candidate.

For those rows:

- `24A`
- `24N`

count as helping the **opposite** party.

The following codes count as helping the recipient candidate's own party:

- `22H`
- `24G`
- `24H`
- `24K`
- `24P`
- `24R`
- `24T`
- `24Z`

Other OTH transaction types are left unscored and reported for audit.

## Cycle Assignment

The classifier uses election-cycle years, not just calendar years.

- A row dated in an odd year maps to the next even-numbered federal cycle.
- Example:
  - `2015` -> `2016`
  - `2023` -> `2024`

This applies to PAS2 and OTH rows alike.

## Memo Rows

Memo rows are **not excluded** from beneficiary scoring.

Reason:

- the classifier is using the FEC bulk files as an evidence source, not as a cash-total replacement for the runtime data
- memo usage is tracked in audit output so we can inspect whether it changes classification outcomes materially

## What Is Not Scoreable Yet

- State and local candidates outside the federal FEC candidate universe
- Committee-to-committee transfers where the recipient is not a candidate committee and the final beneficiary cannot be identified from federal data alone
- Rows with missing committee IDs, candidate IDs, or major-party mappings

These remain `O` until we have a defensible external source.

## April 3, 2026 Verification Report

The report at `tools/fec-bulk/reports/committee-party-verification-2026-04-03.md` is retained as a **QA artifact**, not as the decision engine.

The beneficiary system does **not** automatically defer to those prior manual calls.

Instead, the generator flags disagreements so we can manually inspect them.

## State / Local Boundary

Federal FEC files are not enough to classify most state/local `line 29` spending.

Those rows need one of:

- a separate national state-election data source, such as FollowTheMoney / OpenSecrets state data
- state-by-state official campaign-finance datasets
- a later curated/manual description layer

Until then, the PAC state/local remainder should stay `O`.
