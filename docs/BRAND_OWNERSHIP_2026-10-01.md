# Brand Ownership Corrections - 2026-10-01

Release 1.2.0, branch `release/1.2.0`. Brands that had been sold or spun off were still credited to the seller in `entities.json` (aliases and domains) and `products.json` (exact product rows and barcode prefixes). This pass moves them to their current owners where the owner is confirmed, and removes them where it is not.

## The rule

- A brand follows its current owner. Once a sale or spin-off has closed, the brand, its domains and its barcode prefixes move to the new owner.
- If the seller keeps a minority stake, the stake is noted on the new owner's entity. The brand is still credited to the new owner.
- If the current owner can't be confirmed, or the owner is not a tracked entity, the brand returns no match instead of a guess.
- Shown to users in the Info screen entry `brand-ownership` ("What happens when a brand changes owners?", `copy/infoContent.ts`).

## How the errors got in

- Brand aliases were added from brand lists that predate recent deals (Unilever's ice cream demerger, Reckitt's Essential Home sale, Church & Dwight's vitamin sale). Two came from the 1.2.0 household batch itself (Vitafusion, Spinbrush).
- `products.json` is built from Open Food Facts brand-owner text (`scripts/sync-products-from-off.py`). That text lags behind sales, so products and prefixes were assigned to former owners (French's under Reckitt nine years after McCormick bought it).

## New entities

All four were checked against the local FEC committee masters for 2016-2026 (`verify:entities:bulk --dry-run --ids=...`, plus a direct name search of `tools/fec-bulk/cm*.txt` for each company and its owners). None has a committee, so `fecCommitteeId` is `null` (confirmed no PAC).

| Entity | Brands | Owner and deal | CEO | Sources |
|---|---|---|---|---|
| `magnum-ice-cream-company` | Magnum, Ben & Jerry's, Breyers, Klondike, Talenti, Good Humor, Popsicle, Cornetto, Yasso | Demerged from Unilever 2025-12-06; listed in Amsterdam, London, New York. Unilever retains about 19.9% and plans to sell it within five years. | Peter ter Kulve | unilever.com/investors/the-magnum-ice-cream-company-demerger; foodbusinessnews.net (brand list) |
| `vestacy` | Air Wick, Woolite, Resolve, Easy-Off, Calgon | Reckitt's Essential Home business, sold to Advent International 2025-12-31. Reckitt keeps a 30% stake in Advent's acquisition vehicle. | Marcello Bottoli | reckitt.com (agreement and completion releases); vestacy.com |
| `thriving-brands` | Right Guard, Dry Idea | Formed by Trive Capital in 2021 to buy the brands from Henkel. | Craig Cappozzo (per the 2021 formation release) | trivecapital.com; openFDA NDC labeler 82699 |
| `piping-rock-health-products` | Vitafusion, L'il Critters | Bought from Church & Dwight; closed 2025-12-31 per Church & Dwight's FY2025 10-K. | Scott Rudolph | Church & Dwight 8-K (2025-12-09); drugstorenews.com |

## Aliases and domains removed from former owners

| Entity | Removed | Now |
|---|---|---|
| `unilever` | Breyers, Ben & Jerry's, Magnum; `benjerry.com` | `magnum-ice-cream-company` |
| `reckitt` | Air Wick, Woolite, Resolve, Easy-Off, Calgon; `airwick.us` | `vestacy` |
| `reckitt` | Spray 'n Wash | No match. Not named by Reckitt or Vestacy as sold or kept; its US barcodes share Vestacy's 062338 block, so it likely moved, but this is unconfirmed. |
| `henkel` | Right Guard | `thriving-brands` |
| `church-dwight` | Vitafusion | `piping-rock-health-products` |
| `church-dwight` | Spinbrush | No match. Church & Dwight exited the brand by the end of 2025; the buyer is not named. |

Each affected entity's `notes` field records the change.

## Product index changes (`products.json`)

These edits are manual. `sync-products-from-off.py` does not produce them, so a `--rebuild-from-checkpoint` run will undo them (as it already undoes the beta-feedback barcode 5201156250881). Reapply them after any rebuild until the curated prefix layer planned for 1.2.1 exists. The full list of moved and removed rows is in `tools/off-bulk/research-2026-10-01/product-ownership-changes.json` (local).

Runtime prefixes:

- `077567` (Breyers) and `076840` (Ben & Jerry's) moved from `unilever` to a new `magnum-ice-cream-company` producer entry (`source: manual-ownership-2026-10-01`).
- `027400` (Country Crock), `011115` (Brummel & Brown) and `040600` (I Can't Believe It's Not Butter) removed from `unilever`. Unilever sold its spreads business to KKR (now Upfield) in 2018. Upfield is not a tracked entity.
- `041500` (French's) removed from `reckitt`. McCormick bought French's, Frank's RedHot and Cattlemen's in 2017 and already carries `041500`.

Exact product rows (2,001 to 1,977):

- 23 French's, Frank's RedHot and Cattlemen's rows moved from `reckitt` to `mccormick`.
- 1 Maxwell House row (French barcode 3014680041618) moved from `mondelez` to `jde-peets`.
- 24 rows removed: Country Crock, I Can't Believe It's Not Butter and Brummel & Brown (Upfield); Ragu (Mizkan since 2014); Lipton tea bags (LIPTON Teas and Infusions since 2022); a licensed Klondike candy (maker unconfirmed); and five rows mapped to unrelated companies (Very Lazy and Ricola under P&G, an Olds mustard under Colgate, a cookie under Mars, a water under Dabur).

## Verified after the change

- French's barcode resolves to McCormick; Breyers and Ben & Jerry's prefixes resolve to The Magnum Ice Cream Company; Country Crock returns no match; the French Maxwell House row resolves to JDE Peet's.
- `verify-data-integrity`: live checks clean (4 declared forward refs). `audit:aliases`: 0 exact duplicates, 0 parent/child overlap; 84 single-word substring collisions (82 before; the two new ones are "ICE" inside "Magnum Ice Cream Company", harmless because one-word aliases only match exactly).
- Typecheck clean; Jest 51 suites / 523 tests; `build:ext:all` rebuilt all four extension packages.

## Known issues left for the full audit (1.2.1)

Not changed, because the right owner is not confirmed:

- Shared prefixes, where the app picks the first producer in file order: `041000` (Knorr, Unilever, and Lipton tea bags, now LIPTON Teas and Infusions); `040600` (I Can't Believe It's Not Butter now falls through to `lindt-sprungli`, which looks wrong); `036200` (Ragu resolves to `deoleo`, which owns Bertolli olive oil but not Ragu); `048001` (Hellmann's under Unilever and Skippy under Hormel); `012000` (PepsiCo's block, also listed under Unilever, Starbucks and Dole).
- Lipton ready-to-drink tea rows stay under `unilever`: the Pepsi Lipton joint venture is shared by PepsiCo and Unilever, which kept its interest in it.
- Store brands credited to the manufacturer: Weis rows and the `041497` prefix sit under `utz-brands` (likely Weis Markets' own prefix); Brookshire's and Clover Valley bread under `flowers-foods`.
- Rows to confirm: Corona with a Mexican barcode under `constellation-brands` (AB InBev owns Corona outside the US); Milk 2 Go and Betin under `saputo`; Tosfrit under `vitasoy`.
- Only 12 companies were researched for ownership changes. The other producers in `products.json` have not been checked against recent deals.

## Research files

The barcode-prefix research (232 brands across 12 companies, 88 verified new prefixes, a survey of 21 barcode sources) is saved locally in `tools/off-bulk/research-2026-10-01/` (`prefix-research.json`). It feeds the curated household-prefix layer planned for 1.2.1.
