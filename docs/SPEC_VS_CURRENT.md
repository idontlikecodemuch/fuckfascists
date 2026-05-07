# FCK FASCISTS — Spec vs. Current State

This document tracks where the current implementation aligns with, deviates from, or has deliberately evolved beyond the original product spec. It is a living document — update it when decisions are made.

---

## ✅ Aligned — Implemented as Specced

| Feature | Spec | Current State |
|---|---|---|
| Avoids only — no "support" events | No support events in data model | `EntityAvoidEvent` only, no support equivalent |
| Minimal geolocation storage | Session only | Geolocation used in-session and never transmitted. **Privacy relaxation (2026-04-03):** avoided-entity pin coordinates persisted locally in encrypted SQLite (`entity_avoid_pins`), auto-purged daily, so the map can rehydrate today's avoided markers on relaunch. Candidate for rewrite — see CLAUDE.md "Known Limitations." |
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
| Weekly scorecard | Weekly drop, shareable | Weekly scorecard implemented |
| Platform avoidance tracking | Daily checklist for social/streaming/delivery | Platform avoidance implemented |
| 8-bit visual design system | Pixel art aesthetic, dark palette, chunky borders | `design/tokens.ts` + `design/bevel.ts` (bevel system). All components on blue chrome / amber action / dark panel design language. 35 pixel art assets + 107 CEO sprite sheets deployed. Track screen: beveled panels, blue focus chrome, amber AVOID, SparkleDecoration. BusinessCard: blue focus bevel, sprite-left layout (no frame), tappable confidence badge, post-avoid large sparkles. AvoidButton: amber raised / green inset bevel. BusinessBanner: blue chrome bevel + variant accent bars. GameArena, MatchChooser, InfoScreen, map controls all on same visual language. 4-step keying pipeline with 1px alpha erosion. shared FX system (`core/fx/`). |
| Onboarding flow | Multi-screen first-run flow | 3 screens: Welcome, Privacy (WHAT WE DON'T DO), Permissions (BEFORE WE START) — with open-source tappable link and actual OS permission result checking |
| Map first-use hints | Onboarding tooltips for map features | Three-stage dismissable hints (search → tap → barcode) persisted via SecureStore |
| Beta testing mode | Hidden dev tools | Triple-tap version label → BetaOverlay with screenshot tool |

---

## 🔄 Evolved — Intentional Deviations from Original Spec

| Feature | Original Spec | Current State | Reason |
|---|---|---|---|
| Data source | OpenSecrets API | FEC.gov API directly | OpenSecrets rate limits too tight for bulk lookups; FEC is the primary source anyway and more transparent |
| Confidence field | String labels ('HIGH', 'MEDIUM') | Numeric 0–1 confidence values with thresholds in `config/constants.ts` | More precise, pipeline-friendly, easier to tune thresholds while keeping display labels derived at render time |
| Scorecard timing | Random drop Friday 12PM–Sunday 8PM (BeReal model) | Friday 6PM–Saturday 4PM ET window (22 hours) | Narrowed window for consistency; BeReal model preserved. `DROP_WINDOW_START_HOUR/END_HOUR` in `config/constants.ts` |
| Scorecard data lifecycle | Raw events persist until a week-rollover purge | **Capture-then-purge** — at drop, PNG is captured to disk and the scored week's raw events are purged immediately (scoped to `[weekOf, weekOf+7)`) | Net privacy upgrade: PNG is derivative (no timestamps/surfaces/per-day breakdown), raw event log cannot be reconstructed. Also fixes the "drop disappears at Saturday midnight" bug since presentation resolves the PNG by mtime, not by `weekOf` filename |
| Scorecard presentation persistence | Drop shows indefinitely on tab | Drop takes over the Scorecard tab for 48h (`SCORECARD_PRESENTATION_WINDOW_MS`), then tab returns to LivePreview for the new week; card reachable via "Past scorecards" | Clear end to the celebration window; PNG archive preserves history |
| Scorecard image filename | `{weekOf}.png` (ISO date) | `Those-I-FCKd-{Month}-{DD}-{YY}.jpg` — e.g. `Those-I-FCKd-April-11-26.jpg` (legacy `.png` accepted on read) | Sh*tposter voice on output surface; echoes card's hero sentence; reads like an inscription on share |
| Scorecard drop notification routing | Title string match (`'Your Scorecard Is Ready'`) | `content.data.type === 'scorecard-drop'`; title retained as one-release legacy fallback | Decouples routing from user-visible copy |
| Donation data attribution | `openSecretsOrgId` | `fecCommitteeId` | Migration to FEC-native identifiers after OpenSecrets pivot |
| Partisan attribution method | Committee-level party data | Schedule B disbursements by `candidate_party_affiliation` | Corporate SSF PACs have no party affiliation at committee level; per-disbursement attribution is accurate |
| Entity verification status | Not in original spec | `verificationStatus: 'manual' \| 'pipeline' \| 'unverified'` | Needed to distinguish human-verified vs. script-verified vs. unreviewed entities |
| PAC history tracking | Not in original spec | `fecCommitteeRecords[]` for dissolved/active PAC history | Necessary for entities with dissolved PACs that were renamed or replaced |
| Cross-device sync | QR code scan to bridge extension → app | Deferred to V2 | Complexity too high for MVP; extension and app remain separate |
| Extension trigger frequency | Session-based or daily reset | Session-based (configurable) | Most conservative privacy-respecting default |
| iOS native module packaging | Manual Xcode target addition | Expo Modules API package at `modules/mapkit-search/`, registered via `"mapkit-search": "file:./modules/mapkit-search"` in dependencies | CocoaPods autolinking discovers it automatically on prebuild — no Podfile edits, no `expo.autolinking.searchPaths` override required |
| Extension FEC API key | User-configured key stored in chrome.storage.local | No API key — anonymous mode only | Per-IP FEC rate limits are sufficient for individual users; shared key pooling is a scaling problem; bundled data makes live calls rare |
| Extension donation data source | Live FEC API call on every domain match | Bundled `entity.donationSummary` first; live call only when absent or stale | Bundled data (populated by `fetch:donations` pipeline) covers all 161 verified entities; live calls are rare fallbacks; popup distinguishes "No bundled donation data" from transient unavailability |
| Product scanning | Not in original spec | Dedicated `SCAN BETA` tab using `expo-camera`, a lazy-mounted scanner sheet, a modular local `products.json` producer index derived from checkpointed OFF bulk-data aggregation, Open Food Facts barcode lookup on remaining misses, and an on-device barcode cache | Product-level shelf scanning closes a major gap without shipping a giant product catalog; repeated OFF prefix evidence gives common producer-family hits a strong local fallback while keeping entity expansion isolated from unrelated data work |

---

## ⏳ Specced But Not Yet Built

| Feature | Spec | Status |
|---|---|---|
| Map POI tap → entity matching | Tap a business on the map, get instant donation data | ✅ Built, linked, and running — Android ready (onPoiClick); iOS module linked via `file:./modules/mapkit-search`; app installed on iPhone 16 Pro simulator; iOS tap path pending interactive smoke test |
| Scorecard sharing | Shareable card image, social-ready | ✅ Built — `ScorecardImage` renders to JPG via `react-native-view-shot`; `CardPresentation` is a runway-style trophy moment (card centered at native 9:16 with cyan/yellow halo + 4-corner MoneyParticles burst on reveal, ChevronRunway pulsing upward to a glowing cyan SHARE button). Two-path share: tap SHARE / swipe-up → OS share sheet with the cached JPG (iOS uses RN `Share.share`; Android uses `expo-sharing` since RN's `url` field is iOS-only). Privacy/screenshot behavior: iOS renders a full clean card under the full presentation and hides the presentation layer from capture via a scoped native secure overlay; `AppShell` hides tab/nudge/beta chrome during presentation so the base card centers in the full viewport; AppState swap still protects app-switcher/control-center snapshots. Android uses `expo-screen-capture`'s post-capture screenshot listener to auto-open the share sheet with the clean image (no Android pre-capture hook exists at the OS level), and does not render the hidden clean-card base during active presentation. Filename `Those-I-FCKd-April-11-26.jpg` for the share receiver (legacy `.png` accepted on read). |
| Leaderboard / high scorers | Weekly top avoiders visible to community | Deferred — V2 |
| People.json individual donor data | Executive/founder donation lookup (Musk, Bezos, Zuckerberg) | 🔄 In progress — `people.json` now contains 997 donor records with the current `PoliticalPerson` schema. The file remains V2-canonical, including declared forward refs for company IDs that are not live yet; `entities.json` is kept as the clean V1 source of truth, and the deferred forward-link set is mirrored in `tools/fec-bulk/reports/people-v2-deferred-entity-links.json`. Schedule A contributions are not yet surfaced in UI (V1.5/V2 target). |
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
| Map POI tap scope | Full pipeline match vs. curated list only for V1 | ✅ **Resolved** — full pipeline match (alias first, FEC fuzzy fallback) |
| App Store name | Clean store-listing name vs. branded in-app name | ✅ **Resolved** — store listing is `FCK, FinancialContributionKit` (iOS) and `FCK, Financial Contribution Kit` (Android, longer character limit). In-app brand mark is `FCK FASCISTS` standalone (launch screen, scorecard, share image) / `FCK Fascists` in body prose. Per `docs/FCK_VOICE_FRAMEWORK.md` v2.3 — the clinical store name next to the actual product experience is the joke. |
| Uber entity | No PAC found, name-based match failing | `fecCommitteeId: ""` — needs manual research |
| ENTITY_LIST_UPDATE_URL | Data repo URL | ✅ **Resolved** — `idontlikecodemuch/fckfascists-data` |
| Extension + scorecard unification | QR code bridge or keep separate forever | Deferred to V2 but needs a final answer |

---

## 🚫 Explicitly Out of Scope (Do Not Build)

- No support event tracking — ever
- No server-side data storage in MVP
- No ad network integrations
- No tracking pixels or analytics SDKs
- No features that require a user account in MVP
- No data on platforms/entities outside US political donation system
