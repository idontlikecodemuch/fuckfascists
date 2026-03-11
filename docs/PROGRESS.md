# F*ck Fascists — Progress & Current State

This document is updated continuously. New instances should read this first — it tells you where we are, what was just done, and what needs to happen next.

---

## Current Sprint: MVP V1 — Core Vertical Slice

**Overall status:** Feature-complete, stabilizing data pipeline, map POI tap pending.

---

## Last 5 Sessions (most recent first)

### Session: March 11, 2026
**Focus:** Schedule B attribution root-cause fix, pipeline performance, rate-limit rewrite

**Completed:**
- Diagnosed why partisan donation totals were $0 for all major entities (Walmart, Home Depot, Amazon, etc.):
  - `recipient_type=P` was not filtering to presidential candidates — it was returning all Schedule B disbursements (bank fees, merchant fees, nonfederal contributions leaked through)
  - `candidate_party_affiliation` is blank on FEC Schedule B responses even for legitimate candidate contributions
  - Result: 158 of 161 entities had zero partisan totals; all candidate contributions falling into `raw[]`
- Fixed Schedule B filter: `recipient_type=P` → `recipient_committee_type=H&recipient_committee_type=S&recipient_committee_type=P` (House, Senate, Presidential candidate committees only) in both `FECClient.ts` and `fetch-donation-data.mjs`
- Fixed party attribution: added `recipient_committee.party` as fallback when `candidate_party_affiliation` is blank — applied identically in both files
- Added test for `recipient_committee.party` fallback (24 tests total, all passing)
- Fixed `looksSuspiciouslyZeroed` bug in `pipeline.ts` — `rawItems.length >= 0` was always true, causing entities with non-empty `raw[]` (e.g. Walmart) to have their bundled summary rejected and fall back to a failing live API call, showing "donation data temporarily unavailable"
- Diagnosed persistent 429 cascades: fixed-delay approach (batch cooldowns, pre-pass cooldowns, `RETRY_DELAY_MS`) cannot correctly enforce a count-based rate limit — delays are added AFTER requests, so multiple entities' requests stack in the same 60s window regardless
- **Complete rewrite of `fetch-donation-data.mjs`** — replaced all ad-hoc delays with a proper sliding-window `RateLimiter` class:
  - `RateLimiter(maxPerMinute)` tracks request timestamps; `throttle()` called before every request; waits only as long as needed for oldest timestamp to exit 60s window
  - Two separate limiters: `COMMITTEE_RPM=30` for `/committee/*`, `SCHEDULE_B_RPM=8` for `/schedules/schedule_b/`
  - `apiFetch(url, limiter)`: rate-limited fetch with exponential backoff on 429 (60s→120s→240s, max 300s, 3 retries max), respects `Retry-After` header
  - Incremental save every 10 successes — interrupting and restarting is safe
  - Removed all `FETCH_DELAY_MS`, `FETCH_SCHEDULE_B_DELAY_MS`, `FETCH_BATCH_SIZE`, `FETCH_BATCH_COOLDOWN_MS`, `RETRY_DELAY_MS` — fixed delays removed from both script and `config/constants.ts`
  - Pre-pass and main loop now both run under the same limiter — no explicit cooldown needed between them
- Updated CLAUDE.md: rate-limit architecture documented, removed stale batch-cooldown references

**Pending:**
- Run `npm run fetch:donations -- --force` to repopulate all 161 entities with corrected partisan totals

---

### Session: March 10, 2026
**Focus:** Extension hardening, app/extension data parity, documentation cleanup

**Completed:**
- Serialized `FECClient.ts` details → totals calls to match the data pipeline rate-limit fix
- Reconciled stale architecture/docs references from OpenSecrets-era internals to current FEC-native architecture
- Fixed extension service-worker nullability bug — flagged domains now render safely even when donation data is unavailable
- Brought extension popup data behavior closer to the mobile BusinessCard:
  confidence labels preserved, medium-confidence warning preserved, donation-unavailable state surfaced, FEC link fallback added, active-cycle context shown when available
- Fixed extension/browser TypeScript coverage so `npm run typecheck` is meaningful again
- Added cross-surface data parity rule to `CLAUDE.md` and `ARCHITECTURE.md` so material business-card/popup data changes must be carried to both surfaces unless a V2 divergence is explicitly documented

### Session: March 10, 2026
**Focus:** Data pipeline stabilization, documentation

**Completed:**
- Fixed Schedule B field name mapping (`line_number` was hardcoded as empty string)
- Fixed raw[] aggregation — now one FECLineItem per unique `line_number:cycle` pair
- Added `FETCH_SCHEDULE_B_DELAY_MS: 2000` for Schedule B-specific rate limiting
- Added per-minute rate limit protection in `fetch-donation-data.mjs` — serialized details + totals calls (removed Promise.all), increased `FETCH_DELAY_MS` to 1000ms, retry backoff increased to 5000ms (note: `FECClient.ts` runtime client still had Promise.all at end of session — serialized in follow-up commit)
- Fixed freshness bug — failed entities now have `lastVerifiedDate` cleared so they retry on next plain run
- Manually cleared `lastVerifiedDate` for 54 entities that failed before the fix landed
- Fetch run result: 107/161 fetched clean, 54 failed (rate limiting) — retry in progress
- Created PROJECT_SYSTEM_PROMPT.md, CODEX_ONBOARDING.md, WORKING_WITH_CHRISTOPHER.md for agent onboarding
- Created README.md (public-facing), SPEC_VS_CURRENT.md (deviation tracking)
- Added Project Documentation section to CLAUDE.md (pending CC commit)
- Added Progress doc to CLAUDE.md (pending CC commit)

**In progress:**
- Fetch retry run for 54 failed entities — running now

**Pending CC commits:**
- CLAUDE.md Project Documentation section
- CLAUDE.md Progress doc reference
- Batch cooldown (FETCH_BATCH_SIZE: 40, FETCH_BATCH_COOLDOWN_MS: 60000) — not yet sent to CC

### Session: March 9, 2026
**Focus:** Entity data cleaning, schema evolution, bug fixes

**Completed:**
- Full 449-entity audit — 161 pipeline, 274 manual, 14 unverified
- 13 FEC committee ID corrections with fecCommitteeRecords for dissolved PACs
- verificationStatus schema added ('manual' | 'pipeline' | 'unverified')
- matchScore removed from Entity type and all entities.json entries
- DonationSummary refactored — removed nonpartisan fields, added raw: FECLineItem[]
- Refactored donation attribution from committee totals to Schedule B disbursements
- Fixed async error handling (useWeeklySurvey, useReportCard, PlatformRow)
- Fixed avoid tap — gated to curated entities only, AvoidButton optimistic recovery
- Removed redundant pre-read from recordEntityAvoid
- Vertical slice tested end-to-end on device

---

## Test Status

| Suite | Count | Status |
|---|---|---|
| Total passing | 258 | ✅ Clean |
| Last tsc run | March 10, 2026 | ✅ Clean |

---

## Data Status

| Metric | Count |
|---|---|
| Total entities | 448 |
| Verified PAC (pipeline) | 161 |
| Confirmed no PAC (manual) | ~274 |
| Unverified | ~14 |
| Last fetch: successful | 107 |
| Last fetch: failed (retry pending) | 54 |
| PAC review flagged (no activity) | 4–6 |

---

## What's Working

- Avoid tap → survey → report card vertical slice ✅
- Extension built and tested on walmart.com ✅
- Geolocation (simulator — SF drop) ✅ / physical device TBD
- Entity matching with confidence labels ✅
- Browser extension bundles entities.json at build time ✅
- Extension popup now mirrors app business-card data states more closely ✅
- Rate limiting with retry logic ✅
- Freshness cache with auto-retry on failure ✅

## What's Not Working / Not Yet Built

| Item | Status | Priority |
|---|---|---|
| Donation amounts showing in BusinessCard | $0 — fetch verification pending | 🔴 V1 blocker |
| Map POI tap → entity matching | Not built | 🔴 V1 needed |
| Physical device geolocation test | Not done | 🟡 V1 needed |
| Batch cooldown for --force runs | Not sent to CC yet | 🟡 Nice to have |
| people.json individual donor data | Not started | 🟠 V1.5 |
| Report card sharing / social export | Not built | 🟠 V2 |
| ENTITY_LIST_UPDATE_URL | Placeholder [org] | 🟠 Pre-launch |

---

## Immediate Next Steps (in order)

1. **Confirm donation amounts populate** — verify Walmart and Marriott show non-zero totalRepubs/totalDems in simulator after fetch completes
2. **Map POI tap** — architect decision needed first: full pipeline match vs. curated-only for V1, then greenfield build
3. **Physical device geolocation** — test on hardware, not simulator
4. **Batch cooldown CC prompt** — add FETCH_BATCH_SIZE/FETCH_BATCH_COOLDOWN_MS so --force runs are reliable
5. **UX/UI + Content pass** — new agent instance, full analysis, 8-bit design system, user journey, copy rewrite

---

## Open Architectural Decisions

| Decision | Context | Status |
|---|---|---|
| Map POI tap scope | Full FEC pipeline vs. curated list only for V1 | ❓ Pending |
| Extension + report card unification | QR code bridge or permanently separate | ❓ Deferred V2 |
| App Store name | "F*ck Fascists" will be rejected — need clean submission name | ❓ Not resolved |
| Uber entity | No PAC found, name-based match failing | ❓ Needs manual research |

---

## Agent Roster

| Agent | Current task |
|---|---|
| Lead Architect (this session) | Documentation, decisions, CC prompt generation |
| Claude Code | Implementation — awaiting next prompt |
| Codex | Not yet onboarded — use for data cleaning and pipeline work |
| Web Agent | Idle — next task: Hyatt subsidiary PAC verification |

---

## Recently Resolved Decisions

- OpenSecrets → FEC.gov as primary data source ✅
- Schedule B disbursements for partisan attribution (not committee totals) ✅
- fecCommitteeId three-state schema (string / null / "") ✅
- verificationStatus numeric migration ✅
- matchScore removed from Entity type ✅
- App / extension material data-state changes must stay in parity unless explicitly deferred to V2 ✅
- Tesla → null (no corporate PAC, Musk donates personally) ✅
- Patagonia → removed (IE filer only, no Republican history) ✅
