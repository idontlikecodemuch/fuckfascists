# FEC Bulk Refresh - 2026-09-30

Incremental refresh for release 1.2.0, run 2026-09-30 to 2026-10-01 ET on `release/1.2.0`. Follows `tools/fec-bulk/README.md`; the previous full refresh is `FEC_BULK_REFRESH_2026-08-18.md`.

## Archive refresh

- Compared remote `Last-Modified` and byte size for all 36 archives against `manifests/2026-08-18.json`. 15 had changed: all six for 2022 and 2026, plus `cm24`, `cn24`, `ccl24`. The 2016-2020 cycles and 2024 `pas2`/`oth`/`indiv` were unchanged.
- Downloaded the 15 changed archives (`7.83 GB`) to `tools/fec-bulk/downloads-2026-09-30/`. All passed `unzip -tq`; sizes match the remote `Content-Length`; SHA-256 recorded.
- Installed 2026 and 2022 with `scripts/install-fec-bulk-cycle.mjs --apply` (2026 by_date shards: 18). Swapped the three 2024 masters in place with the same target mapping (`cm 5.txt`, `cn24/`, `ccl 5.txt`).
- New manifest: `tools/fec-bulk/manifests/2026-09-30.json` (36 archives, `21.97 GB` compressed; refreshed rows carry `downloadedOn`, unchanged rows `unchangedSince`).
- Disk: about 77 GB free before the refresh, 66-70 GB after. The Open Food Facts dump (77 GB raw BSON) does not fit alongside the FEC corpus, so `products.json` was not rescanned (see "Products" below).

## Entity and relationship review

- CEO names re-verified for all entities on 2026-09-27 (`tools/review/ceo-freshness-2026-09-27.json`); 182 applied, Apple held at Tim Cook.
- Household cleaning batch added before hydration: `sc-johnson`, `3m`, `reynolds-consumer-products` plus 31 brand aliases.
- `verify:entities:bulk --dry-run`: 164 entities selected, 12,120 committees loaded, 2 auto-verified (`sc-johnson` C00342246, `3m` C00084475), 157 near misses, 5 no-matches. Applied only the two auto-verifications plus manual review: `clorox` C00062224 (exact connected-organization match flagged as near miss), and confirmed no PAC (`null`) for `church-dwight`, `newell-brands`, `reynolds-consumer-products` (their near misses were Baptist PAC, an "Ellmers" committee, and Reynolds American). The other near misses and no-matches were left for later review.

## Entity hydration results

- Live entities: `757`; with committee IDs and donation summaries: `242`; non-empty active cycles: `232`.
- Hydrated with rows: `231`; known zero-row summaries: `11`.
- PAS2 matched rows: `234,918` (Aug: 232,142). OTH matched rows: `68,524` (Aug: 67,712).
- New: SC Johnson R $415,200 / D $176,100; 3M R $940,017 / D $572,000; Clorox R $91,000 / D $122,600 (inactive since 2022).

## People hydration results

- Top-donor match coverage: `992/1000` (`99.2%`), 6 missing, 2 ambiguous (Aug: 976/1000).
- Live people: `1,097` (2 duplicate donor keys collapsed); hydrated `1,097/1,097`, 0 missing.
- Raw classified rows: `268,247`. Live linked people after reconciliation: `110` across `80` live entity IDs.
- Runtime bundle: `23,181` retained linked raw rows, `4,904,177` bytes.

## Classification

Committee-beneficiary classification (`committee-beneficiary-classification-2026-09-30`): `46,804` committee-cycle entries (R 17,257 / D 15,676 / O 13,871).

People preview (`people-classification-preview-2026-10-01`), applied:

- Pre-classification `totalO`: $3,506,546,144 (24.40%).
- Reclassified to R $1,340,246,237; to D $1,180,912,074.
- Inherently partisan additions: R $24,575,000; D $6,435,283.20 (inaugural Form 13: 99 rows, $31,010,283.20).
- Final totals: R $7,463,805,944; D $5,954,523,630; O $985,387,833 (6.84%). Summary-vs-raw drift $0.

Entity preview (`entities-classification-preview-2026-10-01`), applied:

- Final totals: R $500,287,069.23; D $328,199,906.84; O $22,103,024 (2.60%) (Aug: R $495.1M; D $324.7M; O $21.9M).
- Inherently partisan additions: R $54,996,639.23; D $17,505,533.84; 80 entities (inaugural_f13 $75,851,085.85; party_account $12,618,900).

The Form 13 step used `FEC_API_KEY` for the F13 filings list, as in August.

## Products

`sync-products-from-off.py --rebuild-from-checkpoint` ran but was not kept: runtime producers were unchanged (111), the only gain was `sc-johnson` in the unused research layer, and the rebuild dropped a hand-added beta-feedback barcode (5201156250881, PepsiCo). Clorox (19 matched products), SC Johnson (17), and Church & Dwight (5) sit below the 20-product runtime threshold because the March scan seeded them with one brand each.

A fresh OFF scan would not close this gap. Open Food Facts carries few household products (2026-10-01 API counts: Windex 1, Ziploc 6, Clorox 14, OxiClean 0, Hefty 0; Open Products Facts and Open Beauty Facts are similar). Online lookups depend on the same database, so most household scans return no match offline or online. Brand names still match in search, on the map, and in the extension. A curated GS1 company-prefix layer is planned for a later release; it is not in 1.2.0.

## Verification

```bash
npm run download:openstates
node scripts/build-committee-beneficiary-map.mjs --basename=committee-beneficiary-classification-2026-09-30
npm run verify:entities:bulk -- --dry-run
npm run verify:entities:bulk -- --ids=sc-johnson,3m
npm run hydrate:entities:bulk
npm run build:people:bulk-top
npm run sync:people:bulk-top
npm run hydrate:people:bulk
node scripts/build-inherently-partisan-staging-report.mjs
node scripts/build-people-classification-preview.mjs --basename=people-classification-preview-2026-10-01
node scripts/build-entities-classification-preview.mjs --basename=entities-classification-preview-2026-10-01
npm run build:people:entity-review-queue
node scripts/build-people-discovered-committees.mjs
node scripts/reconcile-v1-entities.mjs --write
npm run strip:people:raw
npm run audit:aliases
node scripts/verify-data-integrity.mjs
npm run typecheck
```

- `audit:aliases`: 0 exact duplicates, 0 parent/child overlap, 82 single-word substring collisions (pre-existing class), 13 FEC canonical-name drift notes.
- `verify-data-integrity`: live checks clean (4 declared forward refs).
- Typecheck clean; Jest 51 suites / 523 tests; `npm run build:ext:all` built Chrome, Edge, Firefox, Safari.
- Step timings on this Mac: top-donor ranking ~53 min, people hydration ~8 min, entity hydration ~10 s.
