# FEC bulk refresh runbook

The runtime donation pipeline is rebuilt from six complete FEC bulk datasets for each cycle `2016, 2018, 2020, 2022, 2024, 2026`:

- committee master (`cmYY.zip`)
- candidate master (`cnYY.zip`)
- candidate–committee linkage (`cclYY.zip`)
- committee-to-candidate contributions and included independent expenditures (`pas2YY.zip`)
- committee-to-committee transactions (`othYY.zip`)
- individual contributions (`indivYY.zip`)

Do not append transactions to an earlier extract. FEC archives can change through amendments, late filings, and metadata corrections. Download complete archives, validate them, replace the extracts, and rehydrate from scratch.

## Disk and network

The August 18, 2026 six-cycle download was `21.85 GB` compressed and approximately `106 GB` extracted. Keep at least one large cycle of temporary headroom. Install cycles sequentially; do not extract the complete archive set beside the existing corpus.

Raw archives and extracts are gitignored. Dated manifests under `manifests/` are tracked. Archives may be removed after their hashes, sizes, ZIP integrity, and successful installation are recorded; they remain recoverable from FEC.

## Safe installation

1. Download every `cm`, `cn`, `ccl`, `pas2`, `oth`, and `indiv` ZIP for all six cycles into a dated staging directory.
2. Record remote `Last-Modified` and byte size.
3. Run `unzip -tq` on every archive and calculate SHA-256.
4. Review entity ownership/CEO and accepted person relationships before hydration.
5. Preview a cycle's targets:

   ```bash
   node scripts/install-fec-bulk-cycle.mjs --cycle=2026
   ```

6. Install one validated cycle at a time:

   ```bash
   node scripts/install-fec-bulk-cycle.mjs --cycle=2026 --apply
   ```

The installer extracts into a temporary directory, verifies the six required files and individual `by_date` shards, swaps only that cycle, and rolls back installed targets if a swap fails. Legacy root filenames map cycles to suffixes `""`, `" 2"`, `" 3"`, `" 4"`, `" 5"`, and `" 6"`; the installer owns that mapping.

## Rehydration order

After all cycles are installed:

```bash
npm run download:openstates
node scripts/build-committee-beneficiary-map.mjs --basename=committee-beneficiary-classification-YYYY-MM-DD
npm run verify:entities:bulk -- --dry-run
npm run hydrate:entities:bulk
npm run build:people:bulk-top
npm run sync:people:bulk-top
npm run hydrate:people:bulk
node scripts/build-inherently-partisan-staging-report.mjs
node scripts/build-people-classification-preview.mjs --basename=people-classification-preview-YYYY-MM-DD
node scripts/build-entities-classification-preview.mjs --basename=entities-classification-preview-YYYY-MM-DD
npm run build:people:entity-review-queue
node scripts/build-people-discovered-committees.mjs
node scripts/reconcile-v1-entities.mjs --write
npm run strip:people:raw
npm run audit:aliases
node scripts/verify-data-integrity.mjs
npm run typecheck
```

Review classification totals before copying generated `*.people.json` and `*.entities.json` previews over the runtime files. The preview scripts replace prior additive Form 13/source ledgers, so rerunning the same snapshot is idempotent. Do not use `sync:people:bulk-top --drop-extra` unless intentionally discarding people outside the current top-donor merge.

## Other FEC bulk files

Committee/PAC summaries, leadership-PAC sponsors, and current header files are useful QA inputs. Operating expenditures, dedicated Schedule E reports, electioneering communications, communication costs, raw `.fec` filings, and database dumps are outside the current donor/contribution model and require separate attribution and deduplication work before use.
