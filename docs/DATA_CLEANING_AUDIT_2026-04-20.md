# Data Cleaning Audit Handoff - 2026-04-20

This is the audit packet for the April 20, 2026 data-cleaning pass. It covers entity coverage, aliases, product scan coverage, POI matching, local FEC bulk hydration, the OpenStates state/local classifier, people hydration, and remaining audit findings.

This work is local and uncommitted.

## Executive Status

The important correction from this pass is that hydration is now bulk-first.

The old API-oriented plan was useful when raw data was not staged, but it is no longer the right default. The FEC individual, committee master, candidate master, committee-candidate linkage, PAS2, and OTH bulk files are present locally, and the app can hydrate entity and people donation summaries from those files without live FEC API calls. API scripts still exist for targeted discovery or fallback verification, but they are no longer the preferred hydration path for this batch.

Current top-level state:

- Live entities: `557`
- Entities with `fecCommitteeId`: `190`
- Entities with `donationSummary`: `190`
- Entities with non-empty `activeCycles`: `180`
- Zero-cycle entity summaries retained for known committee IDs: `10`
- Entities with `associatedPersonIds`: `72`
- Live people: `1046`
- People with `donationSummary`: `1027`
- People linked to at least one entity: `91`
- Bundled people: `1046`
- Bundled people with `donationSummary`: `1027`
- Runtime product producers: `87`
- Runtime exact product barcode rows: `1000`
- Product `producerResearch` rows: `206`
- Product `producerResearch` rows mapped to live entity IDs: `89`

This data is neutral by design. The pipeline classifies and presents evidence from public records; it does not optimize for a party, ideology, or desired outcome.

## Why Bulk First

We should not run broad API hydration when the raw bulk data is local.

Reasons:

- Bulk gives repeatable local runs and avoids rate limits.
- Bulk can include the freshest quarter once local archives are refreshed.
- Bulk allows full-cycle scans across 2016, 2018, 2020, 2022, 2024, and 2026 without hundreds of live requests.
- Bulk keeps the audit surface clearer: inputs are files under `tools/fec-bulk/`, not transient API responses.
- Bulk prevents accidental loss from partial API failures.

What API scripts are still for:

- `npm run verify:entities` can discover or verify committee IDs when local evidence is not enough. It hits the FEC API and must be flagged before running.
- `npm run fetch:donations` is retained as a legacy/fallback entity donation path. It hits the FEC API, modifies `entities.json`, and must be flagged before running.
- API scripts should not be used as the default hydration step while local bulk files are staged.

One API attempt did happen earlier in this session: `npm run fetch:donations -- --force` was started, then stopped when the user correctly challenged the need for API calls. The run had network failures and did not reach a 10-success progress save. Treat the resulting `assets/data/entities.pre-line29.json` as a backup artifact from the interrupted attempt, not as the source of this final state.

## Local Source Data

### FEC bulk

The 2026 individual contribution archive was already downloaded locally and was checked against the remote archive metadata during this pass. The local `indiv26.zip` size is `1,499,782,071` bytes; the remote `Last-Modified` observed during the check was `Sun, 19 Apr 2026 16:20:42 GMT`. The archive was not redownloaded because the local size matched.

The smaller 2026 FEC files were refreshed and wired into the paths expected by the scripts:

| File | Rows / Size | SHA-256 where applicable |
|---|---:|---|
| `tools/fec-bulk/cm 6.txt` | `19,351` rows | from refreshed `cm26.zip` |
| `tools/fec-bulk/cn26/cn.txt` | `7,804` rows | from refreshed `cn26.zip` |
| `tools/fec-bulk/ccl 6.txt` | `7,424` rows | from refreshed `ccl26.zip` |
| `tools/fec-bulk/downloads-2026-refresh/cm26.zip` | `813,725` bytes | `5c14a284ff3f808ff33001d6aa81018c72436df6d14ed769097d63a537e84d25` |
| `tools/fec-bulk/downloads-2026-refresh/cn26.zip` | `284,594` bytes | `7051d37c45495f174e96af3dce443d126402f82e54c83f2a31ca8f0973d1c5cc` |
| `tools/fec-bulk/downloads-2026-refresh/ccl26.zip` | `81,257` bytes | `83b8da58297764883f101f3083026eb78f51e1ff98ebf660165007aac095f5f3` |

No older cycle files were deleted.

### FEC beneficiary classification

The local committee beneficiary classifier was rebuilt after refreshing the 2026 committee/candidate files.

Latest report:

- `tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-20.json`
- `tools/fec-bulk/reports/committee-beneficiary-classification-2026-04-20.md`

Summary:

- Committee-cycle entries: `44,868`
- Republican-classified entries: `16,530`
- Democratic-classified entries: `14,722`
- Other/unclassified entries: `13,616`
- Main classification methods: beneficiary 80 percent, beneficiary mixed, formal committee-master party, candidate-committee linkage, and no scoreable beneficiary data.

### OpenStates

OpenStates current-legislator CSV data was refreshed with `npm run download:openstates`.

Current output:

- `data/openstates/all-legislators.csv`
- `7,448` lines including the header
- `52` state/territory downloads succeeded
- `0` downloads failed
- `7,447` legislators represented after the header

This data feeds the Line 29 state/local classifier when direct FEC party fields are blank.

### Open Food Facts

The Open Food Facts work remains local-bulk based. No OFF API was needed for this pass.

Current product checkpoint facts:

- OFF archive path: `tools/off-bulk/openfoodfacts-mongodbdump`
- Documents scanned in the completed fresh scan: `4,403,001`
- Parse errors: `0`
- Exact product candidate pool retained in checkpoint: `5,000`
- Exact product rows shipped in runtime `products`: `1,000`
- Runtime producer rows: `87`

Useful commands:

```bash
python3 scripts/sync-products-from-off.py --fresh --checkpoint-every-docs 250000 --block-size-mb 16 --exact-product-limit 1000
python3 scripts/sync-products-from-off.py --rebuild-from-checkpoint --exact-product-limit 1000
```

The first command rescans the local OFF archive. The second command rebuilds `products.json` from saved aggregates and current `entities.json` without rescanning.

## Pipeline Changes

### Alias audit

Added:

- `scripts/audit-aliases.mjs`
- `npm run audit:aliases`

The audit checks:

- exact alias duplicates across entities
- single-word substring collisions
- parent/child alias overlap
- FEC canonical-name drift

It makes no API calls and does not modify data. Run it after every entity batch and before hydration.

### Entity bulk hydration

Added:

- `scripts/hydrate-entities-from-bulk.mjs`
- `npm run hydrate:entities:bulk`

This is the preferred entity hydration path for the current local setup.

Behavior:

- Scans local FEC PAS2 and OTH files with `rg --json --fixed-strings`.
- Uses cycles `2016, 2018, 2020, 2022, 2024, 2026`.
- Selects entities with `fecCommitteeId`.
- Classifies PAS2 rows using candidate, candidate-committee, committee master, and the local Line 29 beneficiary classifier.
- Reads OTH rows for Schedule-B-like transaction types that start with `2` or `3`.
- Dedupes OTH rows by FEC `SUB_ID` when the same source committee already appears through PAS2.
- Writes the existing `donationSummary` shape in `assets/data/entities.json`.
- Creates `assets/data/entities.pre-bulk-hydration.json` before writing.

Latest run summary:

- Selected committees: `190`
- PAS2 matched rows: `195,744`
- OTH matched rows: `59,281`
- OTH skipped as PAS2 duplicates: `195,744`
- Entities with non-empty `activeCycles`: `180`
- Zero-cycle summaries retained: `10`

### People bulk discovery and hydration

Updated:

- `scripts/build-bulk-top-donors.mjs`
- `scripts/sync-people-from-bulk-top.mjs`
- `scripts/hydrate-people-from-bulk.mjs`

Important behavior:

- Cycles now include `2026`.
- `npm run sync:people:bulk-top` is non-lossy by default with `keepExtra: true`.
- `--drop-extra` exists only for an intentional destructive reset.
- Tim Cook has targeted search names: `COOK, TIM`, `COOK, TIMOTHY`, `COOK, TIMOTHY D`.
- `npm run strip:people:raw` writes the slim app bundle to `assets/data/people.bundle.json`.

Latest people merge summary:

- Bulk donor target: `1000`
- Matched donors: `953`
- Missing donors: `47`
- Ambiguous donors: `0`
- Merged people: `1046`
- Kept extra pre-existing people: `46`
- Hydrated people: `1027`
- Linked people: `91`
- Unique linked entity IDs: `76`

Tim Cook is present in both `people.json` and `people.bundle.json` with a donation summary. His current active cycles are `2016, 2018, 2020, 2022, 2024, 2026`; raw bundled rows retained for him: `115`.

### Line 29 state/local classifier

Added/updated:

- `scripts/lib/line29Classifier.mjs`
- `scripts/lib/jaroWinkler.mjs`
- `scripts/lib/committeePartyOverrides.mjs`
- `scripts/download-openstates.mjs`
- `npm run download:openstates`

Classification priority:

1. Latest local `tools/fec-bulk/reports/committee-beneficiary-classification-*.json`
2. Local FEC committee master party
3. Curated committee-party overrides
4. OpenStates fuzzy match by candidate/legislator name plus state

Use `--no-classify` only when intentionally reproducing pre-classification behavior.

### Product cross-hydration

Updated:

- `scripts/sync-products-from-off.py`
- `features/Map/barcode/productIndex.ts`
- barcode hook/tests

Product rebuilds now re-resolve `producerResearch` against current `entities.json` before runtime producers are emitted. Stale product-side `entityId` values are derived fields and are no longer trusted blindly.

Current behavior:

- Exact barcode product rows are checked before producer-prefix fallback.
- `products.json` now ships `1,000` exact barcode rows.
- Runtime producer rows remain conservative and entity-backed.
- Philip Morris International and Altria now resolve to distinct entity IDs.
- The previous Helen of Troy/OXO -> Premier Foods stale mapping was caught and removed by recomputing entity resolution from current aliases.

### POI/domain matching hardening

The recent domain-based matching work was too trusting for POI taps. This pass narrowed it.

Current behavior:

- First-party domains remain high-confidence.
- Third-party profile hosts are ignored as definitive evidence unless the POI name itself also alias-matches that entity.
- Third-party profile hosts currently include Facebook, Instagram, LinkedIn, TikTok, Twitter, X, and YouTube.
- POI taps pass `{ allowFecFallback: false }` so random local organizations cannot drift into corporate PACs by fuzzy FEC similarity.
- Manual search and barcode/entity scan flows keep the normal FEC fallback.

This fix is not too aggressive for POI taps because it only removes a weak, high-risk fallback from automatic local POI matching. It does not remove manual search, first-party domain matching, exact barcode matching, or explicit entity scans.

## Entity Data Changes

### Coverage expansion

The entity set now covers `557` live entities, including:

- the initial CPG/platform batch
- deeper OFF-backed CPG producers
- hotel parents and practical sub-brand aliases
- 7-Eleven/Speedway aliases
- added scan-gap entities such as Procter & Gamble, Red Bull, and Florida's Natural
- high-value tobacco split between Altria and Philip Morris International

Hotel variants are present for Marriott, Hilton, Hyatt, Wyndham, IHG, Choice, Four Seasons, Accor, and Best Western. The intent is to match realistic POI names such as `[hotel sub-brand] [location]` without creating child entities for every property.

7-Eleven aliases include `7-Eleven`, `7 Eleven`, `7Eleven`, `Seven Eleven`, store-name variants, `Speedway`, `Stripes`, and `Laredo Taco`.

### False-positive donation summaries removed

Removed stale false-positive `donationSummary` blocks where there was no valid corporate PAC match:

- `michaels`
- `jo-ann`
- `ace-hardware`
- `american-eagle`
- `meijer`
- `columbia-sportswear`
- `burlington`
- `block`
- `midas`
- `ro-health`
- `calm`
- `sony-group`

`sony-group` then received a new high-confidence FEC ID and was hydrated from local bulk.

### FEC IDs added

Added high-confidence local-bulk FEC IDs:

- `philip-morris-international` -> `C00215053`
- `heineken` -> `C00358234`
- `suntory` -> `C00194126`
- `diageo` -> `C00034470`
- `flowers-foods` -> `C00033555`
- `sony-group` -> `C00282038`

### Selected hydrated examples

- `procter-gamble`: R `1,011,000`; D `851,960`; O `11,500`
- `philip-morris-international`: R `361,500`; D `158,500`; O `2,500`
- `hershey`: R `123,821`; D `111,586`; O `78,500`
- `keurig-dr-pepper`: R `265,500`; D `78,000`; O `37,500`
- `heineken`: R `108,000`; D `114,250`; O `38,500`
- `suntory`: R `346,646`; D `180,294`; O `41,027`
- `diageo`: R `223,850`; D `291,799`; O `77,342`
- `flowers-foods`: R `631,000`; D `25,000`; O `13,500`
- `haleon`: R `71,500`; D `80,500`; O `2,500`
- `7-eleven`: R `24,500`; D `1,000`; O `0`
- `sony-group`: R `372,500`; D `460,000`; O `55,500`

## Current Measurements

### Entity and people coverage

- Live entities: `557`
- Entities with `fecCommitteeId`: `190`
- Entities with `donationSummary`: `190`
- Entities with non-empty `activeCycles`: `180`
- Zero-cycle donation summaries: `10`
- Entities with `associatedPersonIds`: `72`
- Live people: `1046`
- People with `donationSummary`: `1027`
- People with at least one entity link: `91`
- Bundled people: `1046`
- Bundled people with `donationSummary`: `1027`
- Platform orphan entity IDs: none

Zero-cycle entity summaries retained for audit:

- `sherwin-williams`
- `shein`
- `baker-hughes`
- `pacific-gas-electric`
- `caesars-entertainment`
- `chick-fil-a`
- `sunoco`
- `susquehanna-international-group`
- `renaissance-technologies`
- `stephens-inc`

### Product coverage

- Exact runtime products: `1,000`
- Exact product candidates retained in checkpoint: `5,000`
- Runtime producers: `87`
- Runtime producer entity IDs: `87`
- Duplicate exact product barcodes: `0`
- `producerResearch` entries: `206`
- `producerResearch` entries matched to at least one OFF product: `184`
- `producerResearch` entries mapped to live entities: `89`
- Missing producer candidates remaining: `117`
- Missing producer candidates with OFF prefixes: `85`

Top runtime producers by matched OFF products:

| Producer | Entity ID | Matched OFF Products | Kept Prefixes |
|---|---:|---:|---:|
| Nestle | `nestle` | `16,767` | `156` |
| Pepsico | `pepsico` | `7,597` | `121` |
| Danone | `danone` | `7,105` | `76` |
| Lindt & Sprungli | `lindt-sprungli` | `5,641` | `22` |
| Coca-Cola | `coca-cola` | `5,404` | `73` |
| Unilever | `unilever` | `4,102` | `83` |
| Starbucks | `starbucks` | `2,650` | `38` |
| Conagra Brands | `conagra` | `2,615` | `35` |
| General Mills | `general-mills` | `2,436` | `20` |
| Mondelez International | `mondelez` | `2,373` | `35` |

## Verification Already Run

### Local data gates

```bash
node scripts/verify-data-integrity.mjs
npm run audit:aliases
```

Latest `verify-data-integrity` result:

- exit `0`
- live entities: `557`
- live people: `1046`
- duplicate entity IDs: none
- duplicate people IDs: none
- missing people from entities: none
- missing reverse people: none
- missing reverse entities: none
- invalid role links: none
- undeclared missing entities from people: none
- declared forward refs: `baupost-group`, `bigelow-aerospace`, `jw-childs-associates`, `pritzker-group`

Latest `audit:aliases` result:

- exit `0`
- entities: `557`
- exact alias duplicates: `0`
- single-word substring collision warnings: `60`
- parent/child overlap: `0`
- FEC canonical drift warnings: `6`

### Syntax and app tests

These passed after the final documentation refresh:

```bash
node --check scripts/sync-people-from-bulk-top.mjs
node --check scripts/hydrate-people-from-bulk.mjs
node --check scripts/hydrate-entities-from-bulk.mjs
npx tsc --noEmit
npm test -- --runTestsByPath features/Map/__tests__/productIndex.test.ts features/Map/__tests__/barcodeHelpers.test.ts core/matching/__tests__/domainMatch.test.ts core/matching/__tests__/pipeline.test.ts core/matching/__tests__/aliasMatch.test.ts
PYTHONPYCACHEPREFIX=/tmp/fuckfascists-pycache python3 -m py_compile scripts/sync-products-from-off.py
```

Focused Jest result from that pass:

- `5` suites passed
- `69` tests passed

## Known Audit Findings

These are not hidden. They should be checked before this batch is considered release-ready.

### Zero-cycle entity summaries

Ten entities retain a `donationSummary` shell but have no non-empty `activeCycles` in the current staged cycles. This is useful because it preserves known committee IDs and committee names, but auditors should confirm each should remain in the live file.

### FEC canonical drift warnings

`npm run audit:aliases` reports six FEC canonical drift warnings:

- `hp-inc`
- `stephens-inc`
- `sunoco`
- `susquehanna-international-group`
- `warner-bros-discovery`
- `yahoo`

Some are expected predecessor/subsidiary/current-name differences. Some are local committee-master gaps where only the committee ID is available. Do not suppress these without documenting why.

### Single-word alias collision warnings

The alias audit reports 60 single-word substring warnings. These are warnings, not failures. Examples include:

- `ABC` vs `ABC Supply`
- `American` vs American Eagle / American Express
- `Ritz` vs Ritz-Carlton
- `United` vs United Healthcare / UPS / United Supermarkets
- `Elle` vs `Elle & Vire`
- `Ford` vs `Tom Ford Beauty`
- `SAM` vs `Sam Adams`
- `UPS` vs `Pull-Ups`

The exact duplicate alias count is zero. The warnings still deserve review because POI and barcode matching only stay good if ambiguous one-word aliases are treated carefully.

### People/entity review queue

`npm run build:people:entity-review-queue` currently outputs `200` review candidates. These are heuristic leads, not accepted links. Accepted person/entity links should be recorded through the overrides workflow, not by blindly accepting the queue.

### Product scan ranking limitation

The current runtime product file includes `1,000` exact barcode rows plus `87` producer-prefix rows. That satisfies the clarified goal that 1000 can mean exact products, not necessarily 1000 parent-company entities.

This is not a verified "top 1000 most-shopped" ranking. The local OFF dump gives product records, brands, owners, and barcodes; it does not provide shopping volume. A true shopping-volume ranking needs a separate source.

### GPT pass remains review-only

`entities_GPTpass.json` still contains proposed new/split entities and alias additions. The integrity script reports pass-level issues so they stay visible, but those rows are not live runtime entities unless they have been explicitly moved into `assets/data/entities.json`.

### Local data freshness is not automatic

The 2026 FEC and OpenStates files were refreshed or verified on April 20, 2026. They will not refresh themselves. Before a release candidate, recheck source files and rerun the bulk workflows if remote data changed.

## Reproduction Commands

Cheap local gates:

```bash
npm run audit:aliases
node scripts/verify-data-integrity.mjs
```

Local FEC bulk entity hydration:

```bash
npm run hydrate:entities:bulk
```

Local people discovery/hydration:

```bash
npm run build:people:bulk-top
npm run sync:people:bulk-top
npm run hydrate:people:bulk
npm run build:people:entity-review-queue
node scripts/reconcile-v1-entities.mjs --write
npm run strip:people:raw
```

OpenStates refresh:

```bash
npm run download:openstates
```

FEC local beneficiary report:

```bash
node scripts/build-committee-beneficiary-map.mjs --basename=committee-beneficiary-classification-2026-04-20
```

Product rebuild from saved OFF aggregates:

```bash
python3 scripts/sync-products-from-off.py --rebuild-from-checkpoint --exact-product-limit 1000
```

API scripts require explicit user flagging before use:

```bash
npm run verify:entities
npm run fetch:donations -- --dry-run --force
npm run fetch:donations -- --force
```

## Final Audit Checklist

Before release:

1. Rerun `npm run audit:aliases`.
2. Rerun `node scripts/verify-data-integrity.mjs`.
3. Review the 10 zero-cycle entity summaries.
4. Review the 6 FEC canonical drift warnings.
5. Review high-risk single-word aliases from the 60 warning set.
6. Decide whether any of the 200 people/entity queue candidates should become accepted overrides.
7. Confirm source freshness for FEC and OpenStates.
8. Rebuild products from checkpoint after any entity alias change.
9. Rerun TypeScript and focused matching/barcode tests.
