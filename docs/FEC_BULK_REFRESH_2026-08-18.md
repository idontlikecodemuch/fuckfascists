# FEC Bulk Refresh - 2026-08-18

This is the August 18, 2026 six-cycle FEC refresh record. Corporate/entity and individual-donor hydration used complete local FEC bulk archives for `2016, 2018, 2020, 2022, 2024, 2026`; no broad FEC API hydration was used.

August 20 Form 13 addendum: targeted API access was restored and the previously cached April inaugural data was replaced with a fresh Form 13 pull covering the 2017, 2021, and 2025 presidential inaugural committees. Both people and entity previews were regenerated and applied with replacement semantics, so prior additive rows were not double-counted.

## Archive refresh

- Downloaded `36/36` core archives: `cm`, `cn`, `ccl`, `pas2`, `oth`, and `indiv` for all six cycles.
- Total compressed size: `21,847,952,078` bytes (`21.85 GB`).
- Every remote byte size matched and every ZIP passed decompression validation.
- SHA-256, remote `Last-Modified`, and size are recorded in `tools/fec-bulk/manifests/2026-08-18.json`.
- All six cycles were installed through `scripts/install-fec-bulk-cycle.mjs`, which extracts and validates one cycle before swapping its canonical paths.
- Validated ZIPs were removed after installation because retaining both the `106 GB` extracted corpus and all archives exceeded safe local disk headroom. They remain recoverable from FEC using the manifest.
- Downloaded a `24`-file QA set containing candidate summaries, PAC summaries, committee summaries, and leadership-PAC sponsor files for all six cycles.

The reusable workflow is documented in `tools/fec-bulk/README.md`.

## Entity and relationship review

The lightweight web corroboration audit covered `754` live entities, `121` accepted relationships at the audit snapshot, and the four declared V2 forward references.

- Entities corroborated from official-domain evidence: `568`.
- Entities changed: `5`.
- Entities still evidence-limited after the shallow sweep: `185`.
- Relationships corroborated: `44`.
- Relationships changed: `2`.
- Relationships still evidence-limited: `75`.

Applied high-confidence corrections:

- Hess is historical under Chevron; John B. Hess is a former CEO as of the 2025 acquisition.
- Pilot is 100% Berkshire Hathaway-owned and Adam L. Wright is CEO; Jim Haslam is retained as historical founder.
- TD Ameritrade is historical under Charles Schwab.
- FTX and Sam Bankman-Fried are historical; the founder/CEO role ended in 2022.
- Saban Entertainment is historical under Disney; Haim Saban's founder role ended in 2001.
- Anysphere/Cursor is modeled under SpaceX after the August 14, 2026 acquisition, with Michael Truell as operating CEO and no current FEC committee match.

The four V2 forward references remain deferred because they do not have a material direct consumer footprint:

- `baupost-group`
- `bigelow-aerospace`
- `jw-childs-associates`
- `pritzker-group`

## Platform additions

Added three opt-in platform rows:

- Cursor (`anysphere`, parent `spacex`)
- Google Workspace (`google-alphabet`)
- Microsoft 365 (`microsoft`)

The platform file now contains `21` parent/singleton entries and `33` trackable leaves.

## Entity hydration results

- Live entities: `754`.
- Entities with confirmed committee IDs: `239`.
- Entities with donation summaries: `239`.
- Entities with non-empty active cycles: `228`.
- Known zero-row committee summaries retained: `11`.
- PAS2 matched rows: `232,142`.
- OTH matched rows: `67,712`.
- OTH rows skipped as PAS2 duplicates: `232,142`.

## People hydration results

- Bulk donor keys aggregated: `5,929,406`.
- Top-donor match coverage: `976/1000` (`97.6%`), with `22` missing and `2` ambiguous review cases.
- Live people: `1,091`.
- Hydrated people: `1,091/1,091`.
- Raw classified rows: `266,728`.
- Live linked people after V1 reconciliation: `107`, across `78` live entity IDs.
- Runtime bundle: `1,091` people, `22,803` retained linked raw rows, `4,833,610` bytes.

Two matching defects were fixed during the refresh:

1. `sam-bankman-fried` and `samuel-bankman-fried` represented one person. A configured person merge now retains one record and both FEC search forms.
2. Overlapping search names could attribute one bulk row to the same person more than once. Hydration now deduplicates attribution by person ID per raw row.

Helen O'Neill Schwab was the only initial missing hydration. Curated punctuation/name variants now cover the FEC forms `SCHWAB, HELEN`, `SCHWAB, HELEN O'NEILL`, and `O'NEILL SCHWAB, HELEN`.

## Classification

Fresh committee-beneficiary classification:

- Committee-cycle entries: `46,598`.
- R: `17,194`.
- D: `15,556`.
- O: `13,848`.
- PAS2 scoreable amount: `$16,415,678,821`.
- OTH candidate-committee proxy scoreable amount: `$6,885,184,213`.

Final people classification preview, applied after zero-drift reconciliation:

- Current pre-classification `totalO`: `$3,483,465,351` (`24.50%`).
- Reclassified to R: `$1,350,350,057`.
- Reclassified to D: `$1,159,475,237`.
- Refreshed inherently partisan additions to R: `$22,575,000`.
- Refreshed inherently partisan additions to D: `$6,435,283.20`.
- Final totals: R `$7,431,546,520`; D `$5,842,224,264.20`; O `$973,640,057` (`6.83%`).
- Summary-vs-raw drift: `$0`.

Fresh Form 13 and national-party-account entity additions:

- Form 13 people matches: `98` rows, `96` people, `$29,010,283.20`.
- Form 13 entity matches: `135` rows, `87` entities, `$75,851,085.85`.
- National party special-account entity matches: `316` rows, `36` entities, `$12,611,400`.
- Entity additions applied: R `$54,989,139.23`; D `$17,505,533.84`; `80` committee-backed entities affected.
- Final entity totals: R `$495,056,620.23`; D `$324,677,418.84`; O `$21,888,347`.
- The 2017 inaugural committee required the documented Schedule A API fallback because its filing CSV coverage was incomplete.

The people preview now removes prior rows from the same additive `sourceKind` before adding refreshed rows. Replacing the `88` cached rows with `98` current rows produced a net increase of `10` and zero summary drift.

## Review outputs

- `committee-beneficiary-classification-2026-08-18.*`
- `people-classification-preview-2026-08-18.*`
- `inherently-partisan-staging-2026-08-20.*`
- `people-classification-preview-2026-08-20.*`
- `entities-classification-preview-2026-08-20.*`
- `entity-relationship-web-corroboration-audit-2026-08-18.*`
- `top-donors-bulk-1000.json`
- `top-donors-bulk-1000-merge-summary.json`
- `people-entity-review-queue.json` (`200` rows)
- `people-discovered-committees-2026-08-18.json` (`11,146` uncovered committees; `990` entity candidates)
- `people-v2-deferred-entity-links.json`

Generated review files under `tools/fec-bulk/reports/` are local/ignored audit artifacts.

## Verification

Passed:

```bash
npm run verify:entities:bulk -- --dry-run
npm run hydrate:entities:bulk
npm run build:people:bulk-top
npm run sync:people:bulk-top
npm run hydrate:people:bulk
npm run build:people:entity-review-queue
node scripts/build-people-discovered-committees.mjs
node scripts/reconcile-v1-entities.mjs --write
npm run strip:people:raw
node scripts/build-inherently-partisan-staging-report.mjs
node scripts/build-people-classification-preview.mjs --basename=people-classification-preview-2026-08-20
node scripts/build-entities-classification-preview.mjs
npm run audit:aliases
node scripts/verify-data-integrity.mjs
npm run typecheck
npm test -- --runInBand --silent
node --test scripts/__tests__/fecNameFuzz.test.mjs scripts/__tests__/peopleMergeOverrides.test.mjs scripts/__tests__/peopleClassificationAdditiveRows.test.mjs scripts/__tests__/entityClassificationAdditiveTotals.test.mjs
```

- Data integrity exits `0`; only the four declared V2 forward references remain.
- Alias audit exits `0`; warnings remain in the known broad-alias and historical committee-name drift classes.
- Typecheck exits `0`.
- Jest: `45` suites, `481` tests passed.
- Script tests: `20` passed.

## Browser extensions

- Bumped `extension/manifest.json` to `1.0.1`.
- Rebuilt Chrome, Edge, Firefox, and Safari WebExtension packages with `npm run build:ext:all` after the final people/entity refresh.
- Packaged `entities.json` and `people.bundle.json` SHA-256 values match their runtime sources exactly.
- Packaged data contains `754` entities and `1,091/1,091` hydrated people; Cursor resolves through Anysphere to SpaceX.
- Google Workspace resolves through `google.com`; Microsoft 365 detection includes `microsoft365.com`, `office.com`, and `outlook.com`.
- Extension JavaScript syntax checks pass.
- Firefox uses its required Manifest V3 background-script model, `browser.*` promises, Gecko ID, and no-data-collection declaration; Mozilla lint is clean.
- Safari WebExtension conversion is warning-free, and unsigned Release builds pass for macOS and generic iOS/iPadOS.
- Extension tests: `4` suites, `39` tests passed.
- The local packages are current. Chrome Web Store, Edge Add-ons, Firefox AMO, and Apple App Store publication remain separate external release steps.
