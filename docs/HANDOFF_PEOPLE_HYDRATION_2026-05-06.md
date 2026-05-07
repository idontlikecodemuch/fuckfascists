# Handoff — People Hydration Round 3, 2026-05-06

**Branch:** `claude/intelligent-shannon-2760a4`
**Worktree:** `/Users/christophershannon/fuckfascists/.claude/worktrees/intelligent-shannon-2760a4`
**Goal of this round:** Address TestFlight #155 (Alphabet skewing too D), #156 (PayPal missing Thiel), #160 (Uber missing Kalanick — broaden to all 19 platforms). Add platform-leadership person seeds, run the bulk-first hydration chain.

## Read this first

1. This doc — current state + open decisions
2. `CLAUDE.md` "Person ↔ entity matching algorithm" + "Known Limitations" (has Round 3 additions not yet committed)
3. `scripts/data/people-entity-overrides.json` `_meta.changelog` (latest 2026-05-06 entry summarizes this round's additions)
4. `tools/data-backups/round3-2026-05-06/` for pre/post snapshots of every step

## Status summary

### Codex completion update — 2026-05-07

This handoff is no longer paused. Codex resumed the branch, kept Claude's targeted people/override work, and completed the remaining chain.

- Chose Option D for Hole #2: `scripts/data/people-entity-overrides.json` now has auditable `manualMergePairs`, and `scripts/sync-people-from-bulk-top.mjs` applies them after sync.
- Fixed a second rehydration bug in `scripts/hydrate-people-from-bulk.mjs`: if multiple `fecSearchNames` for the same person match one FEC row, the row is now counted once for that person using the most-specific query.
- Re-ran sync + hydrate on the merged 1,058-person set. Known split IDs such as `ken-griffin`, `tom-steyer`, `steve-mandel`, `sue-mandel`, `andrew-beal`, `daniel-a-beal`, `andy-beal`, and `thomas-campion` no longer survive as separate people.
- Generated and applied `people-classification-preview-2026-05-07.people.json`.
- Verified the inherent-partisan API hydration path: the May 7 staging run used `schedule_a_api` fallback for the 2018 `58TH PRESIDENTIAL INAUGURAL COMMITTEE` (`C00629584`, `90D/90S`) while newer inaugural filings came from filing CSVs.
- Ran review queue, discovered committees, V1 reconcile, and raw stripping. `assets/data/entities.json`, `assets/data/people.json`, and `assets/data/people.bundle.json` are all updated.
- Verification: `node scripts/verify-data-integrity.mjs` passes live integrity checks; `node --test scripts/__tests__/fecNameFuzz.test.mjs` passes 17 tests; `npm run audit:aliases` reports only the existing alias/FEC drift watchlist.

### Completed steps

| Step | Action | Outcome | Backup snapshot |
|---|---|---|---|
| 1 | Edit `scripts/data/people-entity-overrides.json` | +25 entries (21 person seeds + 4 Walton entityLinks). `_meta.updatedAt = 2026-05-06`. People block alphabetized. | n/a (in git) |
| 1b | CLAUDE.md "Known Limitations" | Added 2 entries: deferred-review founders (Thiel/Kalanick/Gates) + Walton dedup task | n/a (in git) |
| 1c | Worktree symlinks + backup dir | `tools/fec-bulk/*` symlinked from parent; `data/` symlinked; `.env` symlinked. `tools/data-backups/` added to `.gitignore` | n/a |
| 2 | First `sync:people:bulk-top` | 1056 → 1077 people (+21 manual seeds). Found Ricketts dedup collision (Pete↔J.Joe). | `02-after-sync/people.json` |
| 3 | First `hydrate:people:bulk` | 14 min runtime. Confirmed Ricketts contamination ($13.35M attributed to wrong person). | (overwritten by 3c) |
| 3a | Patched Ricketts in baseline + restored live | Cleaned `pete-ricketts.fecSearchNames` to `["RICKETTS, PETE"]`; merged `john-joe-ricketts` into `j-joe-ricketts`; consolidated FEC name variants | n/a (script in `/tmp/patch-ricketts.py`) |
| 3b | Re-ran `sync:people:bulk-top` | `duplicateKeysCollapsed: 0`. People count 1077. Ricketts clean. | `02b-after-resync/people.json` |
| 3c | Re-ran `hydrate:people:bulk` | Pete $25.6M R / Joe $17.5M R / no overlap on top contributions. Clean. | `03-after-hydrate-v2/people.json` |
| 3d | Initial `inherent-partisan-staging` | 95 rows / $27.4M. **Missed Sam Altman's $1M Trump-Vance Inaugural** because script used exact-string match instead of FEC-fuzz | (artifact at `tools/fec-bulk/reports/inherently-partisan-staging-2026-05-06.*`, since overwritten by 3e) |
| Hole #1 fix | Refactored `scripts/lib/inherentlyPartisanSources.mjs` IND matching to use `scripts/lib/fecNameFuzz.mjs` | New `findPersonForContributor` function with most-specific-wins + tie→null semantics. Entity branch unchanged. | (uncommitted edit; see `git diff scripts/lib/inherentlyPartisanSources.mjs`) |
| 3e | Re-ran `inherent-partisan-staging` post-fix | **137 rows / $36.8M (+42 rows / +$9.4M).** Sam Altman now captured at $1M Trump-Vance Inaugural Committee, 2024-12-13. No regressions on prior 95 captures. | (current state of `tools/fec-bulk/reports/inherently-partisan-staging-2026-05-06.*`) |

### Pending steps

| Step | Action | Notes |
|---|---|---|
| Hole #2 fix scope | **OPEN DECISION** — see "Open decisions" below | Blocks Steps 4+ |
| 4 | `node scripts/build-committee-beneficiary-map.mjs --basename=committee-beneficiary-classification-2026-05-06` | Refresh classifier with current data |
| 5 | `node scripts/build-people-classification-preview.mjs --basename=people-classification-preview-2026-05-06` | Apply beneficiary + inherent-partisan to staging |
| 6 | `cp tools/fec-bulk/reports/people-classification-preview-2026-05-06.people.json assets/data/people.json` | Apply preview → live |
| 7 | `npm run build:people:entity-review-queue` | Refresh review queue |
| 8 | `node scripts/build-people-discovered-committees.mjs` | Discovered committees report |
| 9 | `node scripts/reconcile-v1-entities.mjs --write` | Reverse-link people → entities, write back to entities.json + people.json |
| 10 | `npm run strip:people:raw` | Regenerate `assets/data/people.bundle.json` slim copy |
| 11 | Verification | `node scripts/verify-data-integrity.mjs`, `npm run audit:aliases`, spot-check Alphabet/PayPal/Uber/Microsoft + Altman inaugural on a clean cache |

## Open decisions

### Hole #2 — top-donor name-variant splits

Audit found ~25 confirmed same-person-split pairs in the top-1000 donor ranking, including:
- `kenneth-c-griffin` + `ken-griffin` (Citadel)
- `jeff-yass` + `jeffrey-s-yass` (Susquehanna)
- `thomas-f-steyer` + `tom-steyer`
- `stephen-mandel` + `steve-f-mandel` (Lone Pine)
- `susan-mandel` + `sue-mandel`
- `christian-larsen` + `chris-larsen` (Ripple)
- `geoffrey-h-palmer` + `geoff-palmer`
- `timothy-dunn` + `tim-dunn` (CrownQuest)
- `jeffrey-lawson` + `jeff-lawson` (Twilio)
- `tom-campion` + `thomas-campion` (Zumiez)
- `timothy-disney` + `tim-disney`
- `pat-stryker` + `patricia-stryker`
- `d-andrew-beal` + `andrew-beal` + `daniel-a-beal` (Beal Bank — split THREE ways)
- `fredric-n-eshelman` + `fred-eshelman`
- `phil-ruffin` + `phillip-ruffin`
- `marcy-carsey` + `marcia-carsey`

**Root cause:** `build-bulk-top-donors.mjs` aggregates donors by `donorKey = LAST | FIRST_TOKEN` (a coarse hash). Same person under multiple first-name forms (KEN/KENNETH, TIM/TIMOTHY, etc.) becomes 2+ ranked entries → 2+ records in `people.json` → double-counting at hydrate time (each duplicate record's FEC-fuzz query matches the same FEC contribution rows).

**Card surface impact:** LOW for V1 — none of the 19 platform CEOs are split (they're all freshly-added single records). Affected donors (Griffin, Yass, etc.) are not currently linked to V1 entities. But the underlying data files are **publicly reviewable** and the duplicates would look unprofessional.

**Three options discussed (Claude's framing — engineering tradeoff):**

- **Option A — One-shot manual dedup of `people.json`** (~30 min): Edit `people.json` directly to merge the ~20 known pairs. Re-run hydrate. Doesn't fix the root cause; recurs on next data refresh.
- **Option C — Within-group dedup pass in `build-bulk-top-donors.mjs`** (~1.5 hr): Heuristic clustering by first-name-prefix overlap + state + employer. Risk of over-merging spouses/siblings (DeVos brothers, Eli/Edythe Broad).
- **Option D — Curated merge list in overrides JSON** (~30-45 min): Add `mergePairs` block to `scripts/data/people-entity-overrides.json` (mirrors the existing override pattern). Small post-sync function in `sync-people-from-bulk-top.mjs` applies the merges. Each merge has a `notes` field explaining the call. Auditable, durable, easy to extend.

**Last user comment:** Option C and E (full FEC-fuzz clustering) felt over-engineered. Was about to greenlight D. Then user paused for the gym.

**Recommended path:** Option D. Reasoning is in last few messages — D mirrors the existing curated override pattern, doesn't try to algorithmically guess Tom=Thomas (where automated heuristics would inevitably get some wrong), and produces a publicly defensible audit trail.

**Pre-staged proposal for Option D** (not yet written to file):
- Add `mergePairs: [...]` block to `_meta` (or top-level) of `scripts/data/people-entity-overrides.json`
- ~20 entries, each with `keep`, `merge: []`, `notes`
- Implement `applyManualMerges` function in `sync-people-from-bulk-top.mjs` (after `manualPeopleFromOverrides` step)

If user picks A or D, the actual merge list to use is in this doc above.

### Other open items

- **Add CLAUDE.md "Modern Code Standards" rule:** "FEC contributor name matching MUST use `scripts/lib/fecNameFuzz.mjs`." Not yet added. Should sit alongside the existing Modern Code Standards section. Prevents future scripts from reintroducing exact-string or coarse-hash matchers.
- **Document Hole #2 in CLAUDE.md "Known Limitations"** with the chosen fix path (A or D) and the merge-pairs documented.
- **CLAUDE.md edit needed for Modern Code Standards section:** the bullet should reference `scripts/lib/fecNameFuzz.mjs` as the canonical FEC matcher. Search for "Modern Code Standards" section.

## Files mutated this session (uncommitted)

```
scripts/data/people-entity-overrides.json   (+25 entries, alphabetized, _meta updated)
scripts/lib/inherentlyPartisanSources.mjs   (FEC-fuzz refactor — Hole #1 fix)
CLAUDE.md                                    (+2 Known Limitations entries)
.gitignore                                   (+ tools/data-backups/)

assets/data/people.json                      (post-Ricketts-fix hydrate, 1077 people)
                                             (entities.json + people.bundle.json untouched from main)

tools/fec-bulk/reports/                      (new 2026-05-06 reports — files reachable
                                              via symlinks back to parent repo's reports dir,
                                              so writes landed in parent. New files:
                                              top-donors-bulk-1000-merge-summary.json (overwrote)
                                              inherently-partisan-staging-2026-05-06.{json,md,
                                                people.rows.json, entities.rows.json})
```

Worktree symlinks (gitignored, recreate after `git checkout` if needed):
```
.env                          → /Users/christophershannon/fuckfascists/.env
data                          → /Users/christophershannon/fuckfascists/data
tools/fec-bulk/<every item>   → /Users/christophershannon/fuckfascists/tools/fec-bulk/<item>
                                (preserved worktree's own tracked
                                tools/fec-bulk/reports/people-entity-review-queue.json
                                and tools/fec-bulk/reports/people-v2-deferred-entity-links.json)
```

## Backups (in `tools/data-backups/round3-2026-05-06/`)

```
00-baseline/             pre-Round-3 (matches main): people.json, entities.json, people.bundle.json
02-after-sync/           after first sync (with Ricketts collision)
02b-after-resync/        after Ricketts patch + re-sync (clean)
03-after-hydrate-v2/     after Ricketts patch + re-hydrate (clean Pete/Joe totals)
```

To revert any single file: `cp tools/data-backups/round3-2026-05-06/<step>/<file> assets/data/<file>`
To revert everything: `cp tools/data-backups/round3-2026-05-06/00-baseline/* assets/data/`
The override file edits + CLAUDE.md edits + script edits are reverted via `git checkout -- <path>`.

## Verification spot-checks

These should pass after Round 3 completes (currently passing on the post-3e state):

- `sam-altman.donationSummary`: includes 1 row in `tools/fec-bulk/reports/inherently-partisan-staging-2026-05-06.people.rows.json` for Trump-Vance Inaugural $1M, 2024-12-13. (Will be folded into his `donationSummary.totalR` after Step 5+6 apply the classification preview.)
- `pete-ricketts.donationSummary`: should NOT include the $13.35M "CITIZENS FOR FREE ENTERPRISE" row — that's Joe's contribution, attributed to `j-joe-ricketts` only.
- `j-joe-ricketts.donationSummary`: SHOULD include the $13.35M row.
- 21 new platform CEO seeds present in `people.json` with hydrated `donationSummary`. Reference list: alex-chriss, andy-jassy, ben-silbermann, bernard-kim, bill-ready, bobby-murphy, daniel-ek, daniela-amodei, dara-khosrowshahi, dario-amodei, doug-mcmillon, enrique-lores, evan-spiegel, jason-citron, mark-zuckerberg, sam-altman, satya-nadella, shou-chew, steve-huffman, sundar-pichai, ted-sarandos.
- 4 Walton heir entityLinks present: alice-l-walton, christy-walton, lukas-t-walton, sam-rawlings-walton all linked to `walmart` with `family_control` benefitBasis.

## Notes for the next instance

1. **Don't re-run** anything that's already complete. The chain is at a known checkpoint after Hole #1 fix + 3e re-run.
2. **Hole #2 needs a decision before Step 4.** Without dedup, Steps 4-11 will produce reports/preview against duplicate records. The classifier itself isn't broken; it just operates on duplicates.
3. **`build-bulk-top-donors.mjs` was NOT re-run** this session. The current `top-donors-bulk-1000.json` was generated by the prior April 2026 batch. If user wants a refreshed top-1000 with newer FEC data, that script needs running too — but it scans 1.5GB+ of indiv files and likely takes 10-30 min. Out of scope for this round unless user requests.
4. **Sam Altman's $1M Trump-Vance contribution** is the canonical test case for Hole #1 fix. Future contributor-matching changes should regress-test against this.
5. **The Ricketts patch was a one-time data fix**, not a code fix. The underlying `normalizeDonorKey` collision risk is still present in `sync-people-from-bulk-top.mjs`. Documented in Round 3 CLAUDE.md additions but not yet fixed at the code level.
6. **All `/tmp/` scripts have been cleaned up** EXCEPT `/tmp/patch-ricketts.py`, `/tmp/check-hydrate.py`, `/tmp/check-altman.py`, and the FEC CSV download `/tmp/fec-csv/1910509.csv`. These are useful debugging artifacts but not committed anywhere. Safe to delete or keep.

## Time spent

~4 hours of investigation + decision gates + 2 hydrate runs (~30 min total subprocess time) + 2 inherent-partisan runs (~25 sec total) + the Ricketts patch + the FEC-fuzz refactor.

## What's NOT done that was originally planned

- Did not run Step 4 (committee-beneficiary refresh) — needs current 2026-05-06 stamp
- Did not run Step 5 (classification preview) — depends on Step 4 + post-Hole-#2 people.json
- Did not run Step 6 (apply preview → live)
- Did not run Steps 7-11
- Did not commit any changes to git (waiting on user for direction at each gate)
- Did not document Hole #2 in CLAUDE.md Known Limitations (waiting on fix-path decision)
- Did not add the "FEC contributor matching MUST use fecNameFuzz" rule to CLAUDE.md Modern Code Standards (would naturally accompany the Hole #2 fix commit)
