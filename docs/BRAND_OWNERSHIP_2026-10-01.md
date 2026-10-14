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

Since 2026-10-14 these edits, and the beta-feedback barcode 5201156250881, live in the reviewed curated layer `scripts/data/curated-prefixes.json` (rows with `origin: manual-ownership-2026-10-01` or `beta-feedback`). `sync-products-from-off.py` merges that file on every build, including `--rebuild-from-checkpoint`, so rebuilds no longer undo them and nothing has to be reapplied by hand. A checkpoint rebuild plus the curated layer was checked to reproduce the shipped `products.json` exactly. The original list of moved and removed rows is in `tools/off-bulk/research-2026-10-01/product-ownership-changes.json` (local).

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

## Follow-up 2026-10-14 (1.2.1 build 13, branch `fix/barcode-attribution`)

Phase 0 of `docs/HOUSEHOLD_BARCODES_PLAN_2026-10-14.md` (branch `data/household-barcodes-plan`). Every row below is in `scripts/data/curated-prefixes.json` with its evidence, ownership check date and source.

- **Walmart store brands.** `681131` (Equate, Parent's Choice, Spring Valley, Ol' Roy) moved from `maple-leaf-foods` and `078742` (Great Value, Member's Mark) from `b-g-foods` to `walmart`. FDA labels and GUDID filings name Wal-Mart Stores Inc / WALMART INC as labeler; no other company appears under either block in the local evidence (FDA, GUDID, CA WIC, Open*Facts, Kroger). The exact row 078742153865 ("Bee Proud Clover Honey" credited to P&G from a bad OFF brand field) was removed so the prefix decides it.
- **Kenvue.** J&J has held no Kenvue stock since 2024-05-17, and there is no `kenvue` entity yet, so all ten prefixes from the OFF "Kenvue" seed were removed from `johnson-and-johnson`: `300450`, `312547`, `086800`, `070501` (US), `062600` (Aveeno), `357466` (France), `789101`, `501012`, `841210`, `890101`. Tylenol, Listerine, Neutrogena and Aveeno now return no bundled match. A junk exact row (Neutrogena "tea bags", 8712100712494) was removed too. Adding a Kenvue entity, or mapping to Kimberly-Clark once that deal closes, is a 1.2.2 decision. The entity aliases (`johnson-and-johnson` still lists Kenvue, Band-Aid, Tylenol) were not changed, so the Open Food Facts network fallback can still resolve a Kenvue brand name to J&J.
- **Shared GS1 US blocks.** Six digits is too short in the 81, 84, 85, 86 and 19 blocks. Of the 124 runtime prefixes there, 14 have US barcodes from other companies under them and were removed: `850005` (asahi-group), `850004` and `810057` (beyond-meat), `850028` (ottogi), `810020` (brown-forman), `810022` (honest-company), `850006` (utz-brands), `850016` (diageo), `850026` and `850043` (simply-good-foods), `850027` (keurig-dr-pepper), `860002` (philip-morris-international), `860003` (pepsico), `860010` (anheuser-busch-inbev). Two verified longer prefixes were added: `850028448` Touchland to `church-dwight` and `81016080` First Aid Beauty to `procter-gamble` (23 and 15 FDA labels from the owner, 2026). Beyond Meat's own exact rows (`850004207…`) still match. The other 110 have no contrary evidence and were kept.
- **Matcher.** `productIndex.ts` no longer compares a UPC-A scan through its `0` + UPC-A form (that caught Barbasol as Campbell and O'Keeffe's as PepsiCo). Curated prefixes carry `prefixSpace` (`upcA` or `ean13`) and are compared only against that form.

## Known issues left for the full audit (1.2.2)

Not changed, because the right owner is not confirmed:

- Suave products with older codes in Unilever's `079400` block still resolve to Unilever (plan Decision 2). Suave Brands' own 2026 block `383711` returns no match.
- OFF-derived six-digit prefixes in the 84 and 86 ranges that look like Spanish, Serbian or Turkish EAN-13 prefixes (`841000` Mondelez, `869063` Nestlé and others) still match US UPC-As in the same digits. No US evidence showed a wrong hit, but the checkpoint cannot tell the two spaces apart (plan Problem 6).
- Equal-length prefixes listed under two OFF entities (146 after this change) still go to the first producer in file order.

- Shared prefixes, where the app picks the first producer in file order: `041000` (Knorr, Unilever, and Lipton tea bags, now LIPTON Teas and Infusions); `040600` (I Can't Believe It's Not Butter now falls through to `lindt-sprungli`, which looks wrong); `036200` (Ragu resolves to `deoleo`, which owns Bertolli olive oil but not Ragu); `048001` (Hellmann's under Unilever and Skippy under Hormel); `012000` (PepsiCo's block, also listed under Unilever, Starbucks and Dole).
- Lipton ready-to-drink tea rows stay under `unilever`: the Pepsi Lipton joint venture is shared by PepsiCo and Unilever, which kept its interest in it.
- Store brands credited to the manufacturer: Weis rows and the `041497` prefix sit under `utz-brands` (likely Weis Markets' own prefix); Brookshire's and Clover Valley bread under `flowers-foods`.
- Rows to confirm: Corona with a Mexican barcode under `constellation-brands` (AB InBev owns Corona outside the US); Milk 2 Go and Betin under `saputo`; Tosfrit under `vitasoy`.
- Only 12 companies were researched for ownership changes. The other producers in `products.json` have not been checked against recent deals.

## Research files

The barcode-prefix research (232 brands across 12 companies, 88 verified new prefixes, a survey of 21 barcode sources) is saved locally in `tools/off-bulk/research-2026-10-01/` (`prefix-research.json`). Its 88 `new` brand rows (62 distinct prefixes) ship in 1.2.1 build 13 through `scripts/data/curated-prefixes.json`, after a 2026-10-14 ownership re-check and a check against the 2026-10-14 evidence (`tools/off-bulk/research-2026-10-14/`, local). One changed shape: Unilever's `859581` sits in a shared 85 block, so it ships as `859581006`, the longest prefix common to all its barcodes; Batiste `5010724` ships as an EAN-13 prefix. The `conflict`, `unverified` and `divested` rows were not added.
