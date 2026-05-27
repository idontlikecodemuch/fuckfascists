# FEC Bulk Refresh - 2026-05-27

This is the May 27, 2026 local FEC refresh record. No broad FEC API hydration was used; the refresh was built from local FEC bulk files plus OpenStates CSV data.

## Source Files

Refreshed 2026 FEC archives were downloaded into `tools/fec-bulk/downloads-2026-05-27/` and copied/extracted into the canonical local bulk paths expected by scripts.

| Archive | Remote last-modified observed | Bytes | SHA-256 |
|---|---:|---:|---|
| `cm26.zip` | 2026-05-27 05:42 GMT | `830,107` | `14ae6c601ec21f464bf8400bf0685ea5d4eadcf2e84c78eb4bd54473555fbe7f` |
| `cn26.zip` | 2026-05-27 05:42 GMT | `290,255` | `9ff20f5f84a6cd6b30d794b353f996ae138defa8ff945e88ac32592931ae6f53` |
| `ccl26.zip` | 2026-05-27 05:42 GMT | `82,762` | `33792f80fdba1cff597fa4b4ed56fa5c5449bca43e58a339788ab9e2669fc5d4` |
| `pas226.zip` | 2026-05-24 15:02 GMT | `5,491,591` | `1197a64b530192acb8b9940199872410ed1780c187c7dbf3ac7a0749309b5fab` |
| `oth26.zip` | 2026-05-24 15:04 GMT | `172,666,538` | `9f35fd69dbbd8631f0a0adcc8ec7b2f2317eafded36462c38e164d88dc4e1a19` |
| `indiv26.zip` | 2026-05-24 15:04 GMT | `1,694,308,836` | `004d8463b064cd3e16b2e1c260acfc73d4ccf261130831afc6c6b40e76a2cd9a` |

Extracted current 2026 row counts:

- `cm 6.txt`: `19,737`
- `cn26/cn.txt`: `7,958`
- `ccl 6.txt`: `7,563`
- `itpas2 6.txt`: `142,022`
- `oth26/itoth.txt`: `8,077,198`
- `indiv26/itcont.txt`: `24,676,851`

OpenStates was refreshed with `npm run download:openstates`: `52` downloads succeeded, `0` failed, `7,449` legislators plus header were written to `data/openstates/all-legislators.csv`.

## Hydration Results

Entity bulk hydration:

- `assets/data/entities.json`: `753` live entities.
- Entities with `fecCommitteeId`: `239`.
- Entities with `donationSummary`: `239`.
- Entities with non-empty `activeCycles`: `227`.
- Matched bulk rows: `224,474` PAS2 and `65,490` OTH.
- OTH rows skipped as PAS2 duplicates: `224,474`.
- Zero-row known committee summaries retained: `12`.

People bulk hydration:

- Top donor rebuild scanned `137` individual-contribution shard files across cycles `2016, 2018, 2020, 2022, 2024, 2026`.
- Top donor report matched `982/1000` donor keys to existing people, with `16` missing and `2` ambiguous for review.
- `assets/data/people.json`: `1,071` people.
- People with `donationSummary`: `1,070`.
- People linked to at least one entity: `111`.
- Full people raw rows after classification additions: `256,418`.
- `assets/data/people.bundle.json`: `1,071` people, `1,070` with `donationSummary`, `21,958` linked raw rows retained.

People classification preview applied:

- Current pre-classification `totalO`: `$3,234,537,194` (`23.84%`).
- Reclassified move to R: `$1,252,074,326`.
- Reclassified move to D: `$1,093,357,636`.
- Inherently partisan add to R: `$18,675,000`.
- Inherently partisan add to D: `$6,334,995.20`.
- Final preview `totalO`: `$889,105,232` (`6.54%`).
- Summary-vs-raw drift: `$0`.

## Review Outputs

Generated local review reports:

- `tools/fec-bulk/reports/committee-beneficiary-classification-2026-05-27.*`
- `tools/fec-bulk/reports/entity-bulk-verification-review.json`
- `tools/fec-bulk/reports/top-donors-bulk-1000.json`
- `tools/fec-bulk/reports/top-donors-bulk-1000-merge-summary.json`
- `tools/fec-bulk/reports/people-classification-preview-2026-05-27.*`
- `tools/fec-bulk/reports/people-entity-review-queue.json`
- `tools/fec-bulk/reports/people-discovered-committees-2026-05-27.json`
- `tools/fec-bulk/reports/people-v2-deferred-entity-links.json`

People/entity review queues are leads, not accepted links. The discovered-committees report found `10,808` uncovered committees, including `887` `entity_candidate` committees for future review.

## Verification

Commands run:

```bash
npm run verify:entities:bulk -- --dry-run
npm run hydrate:entities:bulk
npm run build:people:bulk-top
npm run sync:people:bulk-top
npm run hydrate:people:bulk
node scripts/build-people-classification-preview.mjs --basename=people-classification-preview-2026-05-27
npm run build:people:entity-review-queue
node scripts/build-people-discovered-committees.mjs
node scripts/reconcile-v1-entities.mjs --write
npm run strip:people:raw
npm run audit:aliases
node scripts/verify-data-integrity.mjs
npm run typecheck
npm test -- --runInBand --silent features/Scorecard/data/__tests__/aggregateScorecard.test.ts
node --test scripts/__tests__/fecNameFuzz.test.mjs
```

Validation notes:

- `audit:aliases` exits `0`; warnings are the known broad single-word and canonical-drift classes.
- `verify-data-integrity` exits `0`; remaining missing entity links are declared V2 forward refs: `baupost-group`, `bigelow-aerospace`, `jw-childs-associates`, and `pritzker-group`.
- Typecheck exits `0`.
- Scorecard aggregate test passes: `28` tests.
- FEC name fuzz test passes: `17` tests.

## Future Refresh Policy

FEC can change older years through amended filings, late filings, and metadata corrections. Future updates should therefore be file-version aware, not append-only by transaction date.

Routine refreshes should:

1. Track each downloaded archive's remote `Last-Modified`, byte size, and local SHA-256 in a generated manifest.
2. Redownload and extract only archives whose metadata or hash changed.
3. Rehydrate a rolling window from scratch rather than trying to append rows.
4. Use the current even-year cycle plus the previous three even-year cycles as the default app window. In 2026, that is `2020, 2022, 2024, 2026`.
5. Run older cycles only for explicit deep audits or historical-baseline refreshes.

This May 27 pass used the deeper `2016-2026` continuity window because it was the first full pull from freshly downloaded 2026 archives.
