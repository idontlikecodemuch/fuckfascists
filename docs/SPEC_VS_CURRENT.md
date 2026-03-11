# F*ck Fascists — Spec vs. Current State

This document tracks where the current implementation aligns with, deviates from, or has deliberately evolved beyond the original product spec. It is a living document — update it when decisions are made.

---

## ✅ Aligned — Implemented as Specced

| Feature | Spec | Current State |
|---|---|---|
| Avoids only — no "support" events | No support events in data model | `EntityAvoidEvent` only, no support equivalent |
| No geolocation storage | Session only | Geolocation used in-session, never persisted |
| No browsing history in extension | Extension never logs URLs | Confirmed — no history stored |
| No accounts in MVP | No backend, no server | Fully on-device, no backend |
| Cross-platform (iOS + Android) | React Native + Expo | React Native + Expo SDK 52 |
| Browser extension | MV3, Chrome + Firefox | MV3 implemented, tested on Chrome |
| Shared core | TypeScript package shared by app + extension | Shared core implemented |
| Open source | Full codebase public | GitHub repo public |
| Sideload/PWA stability | First-class concern | APK sideload path confirmed |
| Confidence levels always shown | Never claim certainty data doesn't support | Confidence labels in UI |
| Data links to source | All data cites FEC.gov | Attribution standardized to FEC.GOV |
| Configurable variables in constants.ts | No hardcoded thresholds | All values in `config/constants.ts` |
| Gamified report card | Weekly drop, shareable | Weekly report card implemented |
| Platform avoidance survey | Daily checklist for social/streaming/delivery | Weekly survey implemented |

---

## 🔄 Evolved — Intentional Deviations from Original Spec

| Feature | Original Spec | Current State | Reason |
|---|---|---|---|
| Data source | OpenSecrets API | FEC.gov API directly | OpenSecrets rate limits too tight for bulk lookups; FEC is the primary source anyway and more transparent |
| Confidence field | String labels ('HIGH', 'MEDIUM') | Numeric 0–1 confidence values with thresholds in `config/constants.ts` | More precise, pipeline-friendly, easier to tune thresholds while keeping display labels derived at render time |
| Report card timing | Random drop Friday 12PM–Sunday 8PM (BeReal model) | Friday 4PM–Saturday 3PM ET window | Narrowed window for consistency; BeReal model preserved |
| Donation data attribution | `openSecretsOrgId` | `fecCommitteeId` | Migration to FEC-native identifiers after OpenSecrets pivot |
| Partisan attribution method | Committee-level party data | Schedule B disbursements by `candidate_party_affiliation` | Corporate SSF PACs have no party affiliation at committee level; per-disbursement attribution is accurate |
| Entity verification status | Not in original spec | `verificationStatus: 'manual' \| 'pipeline' \| 'unverified'` | Needed to distinguish human-verified vs. script-verified vs. unreviewed entities |
| PAC history tracking | Not in original spec | `fecCommitteeRecords[]` for dissolved/active PAC history | Necessary for entities with dissolved PACs that were renamed or replaced |
| Cross-device sync | QR code scan to bridge extension → app | Deferred to V2 | Complexity too high for MVP; extension and app remain separate |
| Extension trigger frequency | Session-based or daily reset | Session-based (configurable) | Most conservative privacy-respecting default |

---

## ⏳ Specced But Not Yet Built

| Feature | Spec | Status |
|---|---|---|
| Map POI tap → entity matching | Tap a business on the map, get instant donation data | Greenfield — V1 priority |
| Report card sharing | Shareable card image, social-ready | Not yet implemented |
| Leaderboard / high scorers | Weekly top avoiders visible to community | Deferred — V2 |
| People.json individual donor data | Executive/founder donation lookup (Musk, Bezos, Zuckerberg) | Deferred — V1.5 |
| Donation infrastructure | Phase 3 — ActBlue or equivalent, quarterly payouts | Not started — Phase 3 |
| Cause voting | Users vote on 25% allocation | Not started — Phase 3 |
| Transparency dashboard | Donation pool, past distributions, cause allocations | Not started — Phase 3 |
| Apple Watch / widgets | Native watch complication, home screen widget | Deferred — post-launch |
| Cross-device sync | Optional, user-initiated | Deferred — V2 |
| "Data nerd" toggle | Detailed breakdown view for power users | Deferred — V2 |
| Independent Expenditure tracking | Schedule E — IE data for non-PAC political spend | Deferred — V3 |
| Safari extension | Safari MV3 | Deferred — post-launch |
| Android-specific distribution | F-Droid, sideload APK | Planned — post-iOS launch |

---

## ⚠️ Open Decisions Not Yet Resolved

| Decision | Options | Status |
|---|---|---|
| Map POI tap scope | Full pipeline match vs. curated list only for V1 | **Pending** — needs architect decision before implementation |
| App Store name | "F*ck Fascists" vs. clean public name | Not resolved — App Store submission will force this |
| Uber entity | No PAC found, name-based match failing | `fecCommitteeId: ""` — needs manual research |
| ENTITY_LIST_UPDATE_URL | Placeholder `[org]` | Replace when CDN / data repo is live |
| Extension + report card unification | QR code bridge or keep separate forever | Deferred to V2 but needs a final answer |

---

## 🚫 Explicitly Out of Scope (Do Not Build)

- No support event tracking — ever
- No server-side data storage in MVP
- No ad network integrations
- No tracking pixels or analytics SDKs
- No features that require a user account in MVP
- No data on platforms/entities outside US political donation system
