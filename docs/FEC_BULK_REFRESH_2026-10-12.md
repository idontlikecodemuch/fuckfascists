# FEC Bulk Refresh - 2026-10-12

Incremental refresh run 2026-10-12 ET on `data/fec-refresh-2026-10-12` (from `main` at `v1.2.0`). Follows `tools/fec-bulk/README.md`; the previous refresh is `FEC_BULK_REFRESH_2026-09-30.md`. Data only: no code or schema changes.

## Archive refresh

- Compared remote `Last-Modified` and byte size for all 36 archives against `manifests/2026-09-30.json`. The same 15 changed as last time (FEC republished them 2026-10-11/12): all six for 2022 and 2026, plus `cm24`, `cn24`, `ccl24`.
- Downloaded the 15 (`7.89 GB`) to `tools/fec-bulk/downloads-2026-10-12/`. All passed `unzip -tq`; sizes match the remote `Content-Length`; SHA-256 recorded.
- Installed 2026 and 2022 with `scripts/install-fec-bulk-cycle.mjs --archive-dir=tools/fec-bulk/downloads-2026-10-12 --apply`. Swapped the three 2024 masters in place (`cm 5.txt`, `cn24/cn.txt`, `ccl 5.txt`).
- New manifest: `tools/fec-bulk/manifests/2026-10-12.json` (36 archives, `22.03 GB` compressed).
- Run in the main checkout, which holds the corpus. Disk: 66 GB free before, 17 GB after. A stale second copy of the corpus (about 100 GB) from the 09-30 refresh sits in the `awesome-vaughan` worktree and can be removed with `git clean -fdX tools/fec-bulk` there.

## Entity results

- `verify:entities:bulk --dry-run`: 158 selected, 12,134 committees loaded, 0 auto-verified, 153 near misses, 5 no-matches. Nothing applied; no new entities since 1.2.0 need a committee.
- Hydrated with rows: `231`; zero-row summaries: `11`. PAS2 matched rows `235,072` (09-30: 234,918); OTH `68,549` (68,524).
- Entities with donation data now carry `lastVerifiedDate: 2026-10-12` (242), so bundled data stays fresh for the extension until about 2026-12-11.
- Classification preview (`entities-classification-preview-2026-10-12`), applied: R $500,520,069.23; D $328,421,406.84; O $22,123,524 (2.60%). 09-30: R $500.29M; D $328.20M; O $22.10M. Inherently partisan additions: 80 entities, $88,469,985.85.

## People results

- Top-donor match `993/1000` (99.3%), 3 missing, 4 ambiguous (09-30: 992). 4 duplicate donor keys collapsed.
- Live people `1,099` (09-30: 1,097), hydrated `1,099/1,099`.
- Classification preview (`people-classification-preview-2026-10-12`), applied: pre-classification O $3,511,183,542 (24.41%); reclassified to R $1,341,095,162 and to D $1,183,660,973; inaugural Form 13 additions R $24,575,000 and D $6,435,283.20 (99 rows, unchanged). Final O $986,427,407 (6.84%); people totals R $7.47B, D $5.96B. Summary-vs-raw drift $0.
- Linked people after reconciliation: `110` across `80` live entities. Runtime bundle: `23,187` retained raw rows, `4,906,869` bytes.

## Classification

Committee-beneficiary map `committee-beneficiary-classification-2026-10-12`: `46,892` committee-cycle entries (R 17,295 / D 15,711 / O 13,886).

The Form 13 step called the FEC API with `FEC_API_KEY` for the F13 filings list, as in previous refreshes.

## Verification

Same command order as `FEC_BULK_REFRESH_2026-09-30.md` (without the `--ids` verification step).

- `audit:aliases`: 0 exact duplicates, 0 parent/child overlap, 84 single-word substring collisions (pre-existing class), 13 FEC canonical-name drift notes.
- `verify-data-integrity`: live checks clean (4 declared forward refs).
- Shape check against `main`: same entity and people field sets; 761 entities (12 without a CEO name, as before), 1,099 people.
- Typecheck clean; Jest 51 suites / 523 tests.
- Step timings: top-donor ranking ~73 min, people hydration ~8 min, entity hydration ~10 s.
