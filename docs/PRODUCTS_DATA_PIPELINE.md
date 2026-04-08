# Products Data Pipeline

Last updated: March 24, 2026

## Purpose

This document explains how the barcode/products data layer works today, how `products.json` is generated, how the Open Food Facts bulk archive is used, what cleanup rules were added, and where the current gaps still are.

This is the canonical deep-dive for the products functionality. It is intentionally separate from:

- `entities.json` — parent-company source of truth
- `people.json` — unrelated to barcode scanning
- app/runtime docs — which describe product behavior, not the data pipeline internals

## Scope And Guardrails

The products pass was done under these constraints:

1. Keep all producer/UPC work inside the products layer.
2. Do not mutate `entities.json` or `people.json` as part of barcode/product expansion.
3. Treat the local Open Food Facts bulk dump as the only reliable source for prefix discovery.
4. Use public web research only to seed candidate producers and obvious flagship brands.
5. Keep runtime lookup conservative; broader observations can live in research/reference fields.

## Key Files

- `assets/data/products.json`
- `scripts/sync-products-from-off.py`
- `tools/off-bulk/openfoodfacts-mongodbdump`
- `tools/off-bulk/checkpoints/products-off-sync.checkpoint.json`
- `tools/off-bulk/checkpoints/products-off-sync.partial.json`
- `tools/off-bulk/checkpoints/products-off-sync.results.json`

## Current `products.json` Shape

`products.json` has two layers:

### 1. `producers`

This is the runtime lookup layer used by `features/Map/barcode/productIndex.ts`.

Each entry contains:

- `canonicalProducerName`
- `entityId`
- `entityMatchType`
- `matchedProductCount`
- `prefixThreshold`
- `prefixes`
- `observedBrands`
- `source`

This layer is intentionally conservative. It only includes producers that:

- already map to an existing entity ID
- have repeated OFF evidence
- retain at least one filtered prefix after thresholding

### 2. `producerResearch`

This is the broader research/reference layer.

Each entry keeps the original producer seed and adds OFF-backed evidence:

- `dbMatchedProductCount`
- `dbObservedPrefixes`
- `dbObservedBrands`
- `dbConfirmedAliases`
- `dbSuggestedAliases`

This layer is allowed to be broader and noisier than runtime `producers`.

## Seed Inputs

The pipeline starts from `producerResearch`.

Each producer seed contributes:

- `canonicalProducerName`
- `observedBrands` from public research
- existing entity coverage signals:
  - `entityIdExists`
  - `entityId`
  - `entityMatchType`
  - `missingEntityCandidate`

The seed list was built around UPC-heavy consumer product producers, not general retailers. The intent is shelf-product ownership: `Doritos -> Pepsico`, not store chains.

## OFF Bulk Archive

The bulk source is the local Open Food Facts Mongo dump at:

- `tools/off-bulk/openfoodfacts-mongodbdump`

The archive is a large raw binary dump, not line-delimited JSON. The sync script:

1. Locates the first BSON product document inside the archive.
2. Parses BSON directly in Python without adding a project dependency.
3. Reads only the fields needed for this pass:
   - `code`
   - `brands`
   - `brands_tags`
   - `brand_owner`
   - `brand_owner_imported`

The completed scan processed:

- `4,403,001` product documents
- `76,657,007,358` bytes scanned from the archive
- `0` parse errors

## Matching Strategy

Each producer seed becomes a term set built from:

- normalized canonical producer name
- canonical producer variants with suffix stripping
- normalized seed brands from `observedBrands`

The sync pass then inspects each OFF document and collects normalized terms from:

- `brand_owner`
- `brand_owner_imported`
- comma-split `brands`
- `brands_tags`

Rules:

- exact normalized term matches only
- ambiguous terms that map to more than one producer are dropped from the lookup map
- producer matching is parent-company oriented, but seed brands can also trigger the match

This lets things like `Doritos`, `Lay's`, and `Pepsi` all roll up into `Pepsico` if they were seeded there.

## Prefix Extraction

Prefixes are derived only from the OFF `code` field.

Rules:

- strip non-digits
- if 13 digits and leading digit is `0`, drop the leading `0` to recover UPC-A form
- require at least 12 digits after normalization
- keep the first 6 digits as the working prefix

This is a practical UPC-prefix heuristic for runtime matching, not a claim that all producer ownership is globally resolved by a fixed 6-digit GS1 prefix.

## Aggregation Per Producer

For each matched producer, the scan accumulates:

- `matchedProductCount`
- `prefixCounts`
- `dbBrandCounts`
- `termHits`

`termHits` is especially important because it tells us whether a seeded alias was actually observed in OFF, not just suggested by web research.

## Runtime Prefix Thresholds

Prefix retention is intentionally stricter for producers with more matched products:

- `matched >= 1000` -> keep prefixes observed at least `5` times
- `matched >= 250` -> keep prefixes observed at least `3` times
- otherwise -> keep prefixes observed at least `2` times

This keeps runtime lookup from overfitting to one-off documents or stray imported products.

## Alias And Brand Cleanup Rules

The broad OFF observations were useful, but raw brand strings were noisy. The sync script now cleans labels before they reach runtime `observedBrands` or `dbSuggestedAliases`.

The main cleanup buckets are:

### Producer self-name variants

Examples:

- `The Coca-Cola Company`
- `Hormel Foods Corporation`
- `Kraft Heinz`
- `Mars, .`

These are dropped because they are corporate self-labels, not helpful shelf-brand aliases.

### Legal-entity labels

Examples:

- `Bimbo Bakeries Usa Inc.`
- `T. Marzetti Company`
- `Monster Energy Company`

These are usually manufacturer or corporate forms, not user-facing brand aliases.

### Generic descriptor labels

Examples:

- `Latte`
- `Colombia`
- `White`
- `Restaurant Item`
- `Italian Roast`

These are often product descriptors that leaked into OFF brand fields.

### Partner-company contamination

Examples seen during cleanup:

- Starbucks entries picking up `Nescafé`, `Nespresso`, `Dolce Gusto`
- Pepsi entries picking up `Unilever`
- various co-packed or distribution labels under the wrong parent

These remain visible in broader OFF observation history when useful, but are filtered out of runtime brand suggestions when they appear to belong to another producer.

### Low-confidence suggestions

If a producer has no confirmed seeded aliases, suggested aliases are only kept when they still look identity-linked to the producer’s own seeded names. This prevents partner ecosystems from taking over sparse producers.

## Checkpointing And Resume

The OFF archive is large enough that resumability is mandatory.

The sync script writes progress to:

- `tools/off-bulk/checkpoints/products-off-sync.checkpoint.json`
- `tools/off-bulk/checkpoints/products-off-sync.partial.json`
- `tools/off-bulk/checkpoints/products-off-sync.results.json`

What is saved:

- byte offset inside the OFF archive
- documents scanned
- parse error count
- per-producer aggregate counts
- partial rebuilt products snapshot

Behavior:

- normal runs resume from the saved byte offset
- `--fresh` starts from the first BSON document
- `--rebuild-from-checkpoint` rebuilds `products.json` from saved aggregates without rescanning the archive

That rebuild mode is what made later cleanup passes cheap.

## Script Usage

Full scan:

```bash
python3 scripts/sync-products-from-off.py
```

Fresh rescan:

```bash
python3 scripts/sync-products-from-off.py --fresh
```

Checkpoint-only rebuild:

```bash
python3 scripts/sync-products-from-off.py --rebuild-from-checkpoint
```

Limited dry run:

```bash
python3 scripts/sync-products-from-off.py --limit 100 --fresh --no-final-write
```

## Current Results

### Research coverage

- `206` total `producerResearch` entries
- `184` matched at least one OFF product
- `174` retained at least one OFF-derived prefix
- `144` have at least one OFF-confirmed alias
- `90` have cleaned suggested aliases

### Entity coverage

- `19` producerResearch entries currently map to existing entities
- all `19` of those now have OFF-derived prefixes
- `187` are still marked `missingEntityCandidate`
- `155` missing-entity candidates already have OFF-derived prefixes

### Runtime producer coverage

`18` producers currently land in runtime `producers`:

1. `Pepsico`
2. `Coca-Cola`
3. `Starbucks`
4. `Conagra Brands`
5. `General Mills`
6. `Mondelez International`
7. `Mars, Inc.`
8. `Kellanova`
9. `Hormel Foods`
10. `Campbell's`
11. `Kraft Heinz`
12. `Tyson Foods`
13. `Brown Forman`
14. `Anheuser-Busch Inbev`
15. `Constellation Brands`
16. `Kenvue`
17. `Philip Morris International`
18. `Altria Group`

### Top runtime producers by matched OFF products

- `Pepsico` — `7,597` matched products, `121` kept prefixes
- `Coca-Cola` — `5,404` matched products, `73` kept prefixes
- `Starbucks` — `2,650` matched products, `38` kept prefixes
- `Conagra Brands` — `2,615` matched products, `35` kept prefixes
- `General Mills` — `2,436` matched products, `20` kept prefixes
- `Mondelez International` — `2,373` matched products, `35` kept prefixes
- `Mars, Inc.` — `1,933` matched products, `32` kept prefixes
- `Kellanova` — `1,429` matched products, `14` kept prefixes

### Highest-value missing-entity candidates

These are not runtime-active yet because they do not currently resolve to existing entity IDs, but the OFF data is already strong:

- `Nestlé` — `16,767` matched products, `156` prefixes
- `Danone` — `7,105` matched products, `76` prefixes
- `Chocoladefabriken Lindt & Sprüngli` — `5,641` matched products, `22` prefixes
- `Unilever` — `4,102` matched products, `83` prefixes
- `Ferrero Group` — `1,848` matched products, `17` prefixes
- `Grupo Bimbo` — `1,375` matched products, `24` prefixes
- `Simply Good Foods` — `1,347` matched products, `15` prefixes
- `JDE Peet's` — `1,076` matched products, `17` prefixes

## Category Coverage

- `consumer_goods` — `42` seeded, `38` matched, `32` with prefixes
- `beverages` — `51` seeded, `43` matched, `42` with prefixes
- `food` — `96` seeded, `87` matched, `86` with prefixes
- `tobacco` — `12` seeded, `12` matched, `10` with prefixes
- `manual_priority` — `5` seeded, `4` matched, `4` with prefixes

## Verification

After the products rebuild and cleanup passes:

```bash
npm test -- --runTestsByPath features/Map/__tests__/barcodeHelpers.test.ts
```

Result:

- `1` suite passed
- `7` tests passed

## Known Caveats

1. Prefixes are OFF-derived heuristics for runtime producer matching, not a global GS1-ownership truth table.
2. OFF brand fields are useful but imperfect; even after cleanup, research-layer observations will remain broader than runtime brands.
3. Some runtime brand lists still contain borderline labels if they behave like real shelf brands in OFF, for example `Conagra` or `Hormel`.
4. Missing entity coverage, not OFF coverage, is now the largest structural limitation.

## Recommended Next Pass

If product scan coverage needs to improve further without touching unrelated systems:

1. Add high-value missing entity candidates to `entities.json` in a separate data-quality pass.
2. Re-run `scripts/sync-products-from-off.py --rebuild-from-checkpoint`.
3. Review any newly activated runtime producers for alias cleanup.

This keeps product expansion incremental, reversible, and isolated from unrelated entity/people cleanup work.
