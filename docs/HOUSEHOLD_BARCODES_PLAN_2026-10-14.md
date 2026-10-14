# Household and Personal-Care Barcodes: Plan for 1.2.2

Date: 2026-10-14. Branch: `data/household-barcodes-plan`. Research and planning only: no app code or data files were changed.

This builds on the October 1 pass (`tools/off-bulk/research-2026-10-01/`, local): 232 brand rows for 12 companies, 88 verified new prefixes, a 21-source survey, and the evidence bar in its `BRIEF.md`. That work is reused here, not repeated. Rules this plan follows: `docs/PRODUCTS_DATA_PIPELINE.md` (exact rows first, then the longest matching producer prefix, all offline) and `docs/BRAND_OWNERSHIP_2026-10-01.md` (a brand follows its current owner; when the owner is unconfirmed or untracked, return no match).

## Summary

- **Best new sources are federal and public domain.** openFDA drug labels carry UPCs that FDA decodes from the barcode on the package label each company files. 15,464 OTC labels have one, which covers OTC medicine plus the drug-regulated personal care items: fluoride toothpaste, mouthwash, antiperspirant, dandruff shampoo, sunscreen, acne care, diaper cream and hand sanitizer. NIH's supplement label database (DSLD) covers vitamins, FDA's device database (GUDID) covers bandages, condoms, tampons and pregnancy tests, and USDA FoodData Central covers baby food and formula. All of these may be bundled in an AGPL app.
- **Open Beauty, Open Products and Open Pet Food Facts are small for the US.** Together they hold 4,683 US barcodes. They work as one corroborating source family and as a test set. Their ODbL license (share-alike) needs an owner decision, as it already does for `products.json`.
- **Archived Kroger product URLs are a scalable retailer source.** The Wayback Machine's URL index exposes them without touching kroger.com. 244 UPCs rebuilt from these URLs matched FDA label barcodes digit for digit, and none disagreed.
- **GS1 lookups and SmartLabel cannot feed the bundle.** Their terms forbid republishing.
- **Fix four problems before adding coverage.**
  - Walmart's store-brand prefixes are credited to food companies: `681131` (Equate) to Maple Leaf Foods and `078742` (Great Value, Member's Mark) to B&G Foods.
  - Six-digit prefixes are also compared against the 13-digit form of the scanned code, and 13 of the 14 matches found that way were wrong.
  - Six digits is too short in newer shared GS1 US blocks; Touchland hand sanitizer would scan as Ottogi, a Korean food company.
  - Kenvue and Suave products are credited to former owners: Tylenol, Listerine and Neutrogena to Johnson & Johnson, and Suave to Unilever.
- **Expected gain.** The test set is 7,616 in-scope products from archived Kroger URLs, not used to derive prefixes. Matches go from 36.7% today (336 to the wrong owner) to 48.0% with the fixes and the October 1 prefixes, and to 56.0% with every tier. OTC medicine goes from 14% to 65%, cleaning from 42% to 65%, paper goods and bags from 25% to 72%, and pet from 23% to 56%. Vitamins stay low (10% to 18%) because the shelf is a long tail of small brands.
- **Owner decisions** are listed at the end: Kenvue, mixed legacy blocks, store brands, new owner entities, the ODbL notice, and pending deals.

## Where things stand on `main` (2026-10-14)

- `assets/data/products.json` has 112 runtime producers with 1,799 six-digit prefixes and 1,977 exact rows. All come from the Open Food Facts (OFF) bulk scan plus the manual 2026-10-01 ownership edits.
- 147 of those prefixes are listed under more than one entity. On a tie, `productIndex.ts` keeps the first producer in file order.
- The 88 prefixes verified on October 1 (Windex `019800`, Clorox `044600`, Zicam `732216`, Vicks `323900` and others) are not shipped. They moved from 1.2.1 to 1.2.2 (`docs/releases/1.2.1.md` on `release/1.2.1`).
- Of the October 1 rows, 54 are unverified and 14 are in conflict. The new sources below can settle many of them; for example, Vicks `328785` turns out to be Kaz's licensed device line (see Problem 5).

## Problems found in this pass

The checks below ran a copy of `findBundledProductByBarcode` (exact rows, then the longest prefix over the UPC-A and its 13-digit form) against real US barcodes.

1. **Walmart store brands are credited to food companies.**
   - `681131` maps to `maple-leaf-foods`, but it is Walmart's Equate block. FDA GUDID lists Equate bandages `681131006767` under WAL-MART STORES, INC., and FDA labels from Walmart carry it too.
   - `078742` maps to `b-g-foods`, but it is Walmart's Great Value and Member's Mark block. Open*Facts shows bleach and napkins there.
   - That is 96 of 4,683 US Open*Facts barcodes (2%), and every Equate OTC product, scanned as a food company.
2. **The 13-digit form causes false matches.** For a UPC-A scan, `buildBarcodeCandidates` also tries `0` + UPC, so a prefix such as `005100` (Campbell) catches Barbasol `051009009341`.
   - Other examples: O'Keeffe's `722510026003` to PepsiCo, and a Trader Joe's hand cream to General Mills.
   - There were 14 such matches in the 4,683 US rows, and 13 were wrong.
3. **Six digits is too short in newer GS1 US blocks.**
   - GS1 US company prefixes run from 6 to 10 digits. Blocks starting `81`, `84`, `85`, `86` and `19` are shared by many small companies.
   - Today `850005` is credited to Asahi but holds Curlsmith and So Good So You. `850004` is credited to Beyond Meat but holds P&G items. `850028` is credited to Ottogi, so Church & Dwight's Touchland hand sanitizer would scan as a Korean noodle maker.
   - Real owners in these blocks need 8 or 9 digits, for example Touchland (Church & Dwight) `850028448` and First Aid Beauty (P&G) `81016080`.
4. **Brands are credited to former owners.**
   - Kenvue: `300450`, `312547`, `086800` and `070501` map to `johnson-and-johnson`. J&J has held no Kenvue stock since its debt-for-equity exchange on 2024-05-17 (J&J FY2024 10-K). Kimberly-Clark's acquisition of Kenvue has shareholder approval and US antitrust clearance and was still pending on 2026-10-13: Kenvue filed an 8-K that day for Kimberly-Clark's note-exchange consents, and Kimberly-Clark's 10-Q for the quarter to 2026-06-30 gave "second half of 2026" for completion.
   - Suave: Unilever sold the brand to Yellow Wood's Suave Brands Company in 2023. On the Kroger shelf sample, 147 Suave products still carry Unilever's `079400` block, mixed into the same 7-digit sub-blocks as Dove and Degree. Suave's 2026 FDA labels moved to its own block, `383711` (labeler 83711).
   - Entity aliases outside barcodes: `haleon` lists ChapStick (sold to Suave Brands 2024-05-31), and `dollar-tree` lists Family Dollar (sold 2025-07-07).
5. **The barcode owner is not always the brand owner.**
   - Vicks humidifiers and thermometers are made by Kaz USA (Helen of Troy) under license and use `328785`.
   - Travel-size Advil comes from Select Consumer Group (`655708`) and Lil' Drug Store (`366715`).
   - Kroger's marketplace adds third-party seller barcodes such as `723651` and `601957`. 918 of the 8,534 shelf-sample barcodes sit in 12 such blocks, each carrying four or more brand owners.
   - Prefix matching handles all of these correctly only if each prefix maps to whoever owns the block.
6. **Prefix spaces are mixed.** The sync script's `prefix_from_code` keeps the first six digits whether the code was a 12-digit UPC-A or a 13-digit EAN.
   - A US prefix such as `305730` is therefore also the start of French EANs (GS1 France is 300 to 379), and `757037` of Latin American ones.
   - Observed impact on US data is low (no wrong hits in the Open Beauty Facts check), but the checkpoint cannot tell the two cases apart, and the raw OFF dump was deleted in June.

## Source comparison

Coverage figures were measured on 2026-10-14 unless marked "(Oct 1)". In the license column, "bundle?" asks whether the AGPL app may ship prefixes derived from the source.

| Source | Category coverage | License (bundle?) | Access, cost, limits | Update cadence |
|---|---|---|---|---|
| **openFDA drug labels, field `openfda.upc`** | OTC medicine and OTC-monograph personal care: fluoride toothpaste, mouthwash, antiperspirant, dandruff shampoo, sunscreen, acne care, diaper cream, sanitizer, SPF lip balm. 15,464 of 48,343 OTC labels carry a UPC. UPCs by labeler: Kenvue 371, P&G 207, Bayer 113, Reckitt 76, Unilever 75, Church & Dwight 68, Beiersdorf 63, Colgate 36, Edgewell 35, Haleon only 1. About 21% of UPC-bearing OTC labels belong to store-brand labelers (Walgreens, CVS, Walmart, Target, Kroger). | CC0 (open.fda.gov/license). **Yes.** | JSON API, no key: 240 requests per minute and 1,000 per day per IP. `count=openfda.upc.exact` returns up to 1,000 UPCs per labeler in one call. Bulk is 1.77 GB in 14 zips (not needed; over the 200 MB limit). | Weekly |
| **openFDA NDC directory** (`drug/ndc`) | Maps OTC brands to labeler code and labeler name: 57,178 OTC products, 3,792 labeler codes. No UPC field. | CC0. **Yes.** | 27 MB zip, or the API. | Daily |
| **DailyMed** (NLM) | Same filings as openFDA, with label images and a page per set id. | US government; no reuse restriction found (Oct 1). **Yes.** | Web services, no key. Full SPL releases are several GB (not needed). | Daily; monthly full release |
| **FDA GUDID** (openFDA `device/udi`, AccessGUDID) | Consumer medical devices. Trojan 176 records (`022600`), Tampax 532 (`073010`), Durex 112 (`302340`), Kotex 303 (`036000`), Playtex 93 (`078300`), Waterpik 453 (`073950`), Sonicare (`075020`), Equate (`681131` Walmart), Vicks devices (`328785` Kaz). | CC0 except GMDN terms on device-type fields (not needed). **Yes.** | API, no key, same limits. Bulk is 1.9 GB in 52 zips (not needed). | Daily |
| **NIH DSLD** | Vitamins and supplements, with `upcSku`. Nature Made 145 of 200 records have a UPC (`031604`), One A Day 130 (`016500`), Centrum 139, Nature's Bounty 190 (`074312`), Emergen-C 86, Airborne 104 (`647865`), Vitafusion 194 (`027917`). Olly and SmartyPants use several `8x` blocks. | US government; API spec CC0; ODS does not verify label data. **Yes.** | JSON API, no key, no stated limit (stay at 1 per second). A full download exists, but the site is behind a Cloudflare check. | Continuous |
| **USDA FoodData Central, Branded** | Food only, with `gtinUpc` and `brandOwner`. Crossover items: baby food, infant formula (Enfamil `300871`), Hidden Valley, KC Masterpiece, Arm & Hammer baking soda. No household cleaners (Oct 1). | CC0. **Yes.** | Bulk 427 MB zip (over 200 MB, needs approval). The API needs a key; DEMO_KEY allows 30 per hour. | April and October |
| **Open Beauty Facts** | Personal care: 64,237 products, of which 4,197 are US-tagged and 2,717 are valid US UPC-As (cosmetics 572, skin/body/soap 343, hair 290, toothpaste 85, deodorant 83). | ODbL plus DbCL. Yes, if the derived database is offered under ODbL with attribution. | CSV 17.9 MB gz. | Nightly |
| **Open Products Facts** | Household: 41,133 products, 1,864 US, 1,140 US UPC-As (cleaning 157, vitamins 78, OTC 49). | Same as above. | CSV 6.1 MB gz. | Nightly |
| **Open Pet Food Facts** | Pet: 15,136 products, 943 US, 826 US UPC-As. Purina `017800`/`038100` and Blue Buffalo are not in runtime today. | Same as above. | CSV 3.3 MB gz. | Nightly |
| **Open Food Facts** (current source) | Food; household is thin (Windex 1, OxiClean 0; Oct 1). | ODbL. Already shipped, so the obligation already applies. | CSV 1.28 GB; Mongo dump about 80 GB (over the limit). | Nightly |
| **State WIC lists** (California on data.gov) | Infant cereal, baby food and formula: 6,808 UPC rows, 384 of them in infant categories. Gerber `015000`, Beech-Nut `052200`, plus store brands. | CC-BY. **Yes, with attribution.** | 0.9 MB CSV. Nebraska and Minnesota publish Excel files; terms vary by state. | Periodic (last update 2026-09-07) |
| **Archived Kroger product URLs** (Wayback CDX) | Every category Kroger sells. The URL ends in the UPC body; we recompute the check digit. 8,534 in-scope UPCs came from 38 index queries. | We use only URL strings (facts) under the Internet Archive's terms; no retailer page content. **Yes, as evidence.** | Free, no key; 1 query per 1.5 to 2 seconds. Common Crawl's index failed (502) on Oct 1 and again today. | Irregular |
| **Manufacturer sites** (where-to-buy widget IDs, SmartLabel-hosted pages) | Official, but brand by brand (oxiclean.com, zicam.com and others; Oct 1). | Facts read one page at a time while respecting robots.txt; no bulk harvest. | Manual | Live |
| **GS1 US Company Database / Verified by GS1** | The registry of who licenses a prefix. | Terms: 30 queries per day; results are for internal use only and may not be published or distributed. **No.** | Data Hub from about $500 per year, with an account. | Live |
| **SmartLabel** | Official pages from about 1,000 brands. | Terms (June 2022) forbid scraping and republishing without permission from the Consumer Brands Association and the company. **No.** | Web only | Live |
| **Aggregators** (UPCitemdb, Barcode Lookup, EAN-Search, Go-UPC, upcdatabase.org) | Large but noisy (reseller bundles). | Unclear or paid. Leads only, and all together count as one family. | Trial quotas, keys, or blocked | n/a |
| **Kaggle "Universal Product Code Database"** (about 1M UPCs and names, no manufacturer field), Hugging Face commercial CPG data, Product Open Data (OKFN, 2014), Wikidata P3193 (34 items) | Weak or stale. | Unclear provenance or license, paid, or near-empty. **No.** | n/a | n/a |
| **Retailer APIs** (Kroger developer, Walmart affiliate, Best Buy) | Kroger and Walmart would help. | Need an account and key; Best Buy forbids caching and is the wrong category. **No.** | n/a | n/a |
| **EPA PPLS** | Disinfectant registrants; no UPCs. | Public. Ownership signal only. | Web | Live |

### Notes on the FDA sources

- `openfda.upc` holds the EAN-13 symbols that FDA's openFDA pipeline decodes from the package-label images in each SPL filing (`openfda/spl/process_barcodes.py` in FDA's GitHub repo). It is the company's own label, so it counts as an official source. Always validate the check digit and drop placeholder values (`000000000000`, `012345678905`).
- Do not compute UPCs from NDC arithmetic. For Advil (`305730150200` against NDC 0573-0165), Tylenol (`300450297211` against NDC 50580-576), Mucinex (`363824834368` against NDC 72854-218) and Claritin (`041100595416` against labeler 11523), the barcode carries a legacy labeler or product code. The NDC directory identifies the company; only observed barcodes give the prefix.
- Some labelers are distributors or repackagers whose own prefixes cover other companies' brands: Lil' Drug Store, Select Consumer Group, A-S Medication Solutions, Navajo, and Cardinal Health (Leader). Keep a short exclusion list.

## Recommended pipeline

### Phase 0: fixes that ship in 1.2.2 regardless (small, high value)

1. **Matcher** (`features/Map/barcode/productIndex.ts`):
   - For a 12-digit UPC-A scan, test prefixes against the UPC-A only and drop the `0` + UPC candidate.
   - Curated rows carry an explicit prefix space (`upcA` or `ean13`) and are tested only against that form.
   - On an equal-length tie, a curated row beats an OFF row. Two OFF entities tied on the same prefix return no match instead of the first in file order.
   - Add the end-to-end barcodes below as Jest cases.
2. **Block wrong prefixes:** `681131 → maple-leaf-foods` and `078742 → b-g-foods`. Re-point them to `walmart` or leave them unmatched (Decision 3).
3. **Curated layer:** add `scripts/data/curated-prefixes.json`, the reviewed source of truth, alongside `people-entity-overrides.json`. `sync-products-from-off.py` merges it on every run, including `--rebuild-from-checkpoint`. The October 1 manual edits move into this file, so rebuilds stop undoing them. Each row:
   ```json
   {"prefix": "019800", "space": "upcA", "entityId": "sc-johnson", "brands": ["Windex", "Drano"],
    "action": "add | block | exact", "evidence": [{"gtin": "019800701956", "family": "kroger", "url": "..."}],
    "ownershipCheckedAt": "2026-10-xx", "ownershipSource": "...", "pendingOwner": null, "notes": "..."}
   ```
   - `action: "block"` removes an OFF-derived prefix.
   - `action: "exact"` adds per-UPC overrides inside a mixed block, for example Suave products under `079400`.
4. **Ship the 88 verified October 1 prefixes** through this file, after a same-week ownership re-check. The 12 companies show no new deals since October 1.

### Phase 1: collect evidence (scripted, polite, no keys, no large downloads)

Run one maintainer script, `scripts/collect-household-evidence.py`. It writes raw evidence to `tools/off-bulk/household/evidence/`, which is already gitignored through `tools/off-bulk/`.

| Step | Source | Calls | Output |
|---|---|---|---|
| a | openFDA `drug/label`, `count=openfda.upc.exact` per labeler | 2 per labeler; about 300 labelers takes about 10 minutes at 1 per second | UPCs per labeler, plus set ids for citations |
| b | openFDA NDC zip (27 MB) | 1 | brand to labeler code to labeler name |
| c | openFDA `device/udi` by `company_name` or brand | about 50 | device UPCs per company |
| d | NIH DSLD `browse-products` by brand | about 100 | supplement UPCs per brand |
| e | OBF, OPF and OPFF CSVs (27 MB total) | 3 | US rows with brand, name and categories |
| f | Wayback CDX for `www.kroger.com/p/<brand-slug>` | 1 per brand at 2 seconds or slower | UPC (check digit computed) plus slug |
| g | California WIC list CSV | 1 | baby food and formula UPCs |
| h | Optional, needs approval: FDC Branded bulk (427 MB) | 1 | food crossover with `brandOwner` |

Keep a hand-reviewed table in `scripts/data/household-owners.json` that maps labeler names, brands and slugs to entity ids, with the date ownership was checked. Steps a, c and d attribute through it.

### Phase 2: derive candidates

Run `scripts/build-household-prefix-candidates.py`. It writes `tools/off-bulk/household/reports/candidates-YYYY-MM-DD.{json,md}`.

1. Group attributed barcodes by owner and 6-digit block.
2. **Length.** Keep 6 digits only when every barcode seen in the block belongs to one owner and the block is a legacy one, not starting with `1`, `6` or `8`. Otherwise use the longest common prefix of the owner's barcodes, from 7 to 10 digits, and check that no other owner's barcode starts with it.
3. **NDC-style codes** (leading `3`). The prefix is `3` plus the labeler digits as they appear in observed barcodes. Split further when a labeler's lines were sold: `30573` holds Haleon's Advil (`305730`) and Centrum (`305731`), but ChapStick's legacy codes also sit in `305731`.
4. **Dominance.** If at least 20 barcodes are 95% or more one owner, flag the block for review. Do not auto-accept it. The minority is usually a misread, a licensee, or a carve-out that needs exact overrides.
5. **Mixed blocks.** Record each with both owners' counts and route it to Decision 2.
6. **Compare** with runtime and October 1 rows and tag each candidate `new`, `alreadyCovered`, `extends`, `conflict` or `ownerMissing` (no entity yet).

### Phase 3: review and ship

- A maintainer, or an agent with the October 1 brief, reviews each candidate against the evidence bar below, checks current ownership, and writes accepted rows into `curated-prefixes.json` with citations.
- Then run:
  - `python3 scripts/sync-products-from-off.py --rebuild-from-checkpoint --exact-product-limit 2000`
  - `npm run audit:aliases`
  - `node scripts/verify-data-integrity.mjs`
  - the barcode Jest suites
  - a new `npm run audit:barcodes`. It replays the held-out lists (Open*Facts US rows, a fresh Kroger sample, the end-to-end list) and fails on any wrong-owner hit for a curated prefix.
- New owner entities, from Decision 4, go through the normal entity batch: `verify:entities:bulk --dry-run --ids=...` against the local FEC masters, with no API calls.

Refresh quarterly with the FEC bulk refresh. Re-check ownership of every curated row before each release.

## Evidence bar

This keeps the October 1 bar and tightens it where this pass found gaps.

1. **Three or more distinct real barcodes** with valid GS1 check digits share the prefix.
   - A barcode whose check digit we computed (from a Kroger URL) counts only if another source shows the same full UPC, or if the product text matches the brand.
   - In this pass, 244 such UPCs matched FDA label barcodes exactly, with no mismatches.
2. **Two independent source families, or one official source.**
   - Official: the company's own site, FDA label images, and GUDID filings. Each is filed by the company.
   - Government (independent but not official): NIH DSLD, USDA FDC, state WIC lists.
   - Open*Facts is **one** family, covering OFF, OBF, OPF and OPFF.
   - Each retailer chain is one family, with all Kroger banners and archived Kroger URLs together. Aggregators are one family and never suffice alone.
3. **Current ownership is checked** at build time and recorded with the date and source (SEC filing or company release).
   - Pending deals get `pendingOwner` and an expected close date, and are re-checked before each release.
   - Rule: the brand follows its current owner. If the owner is untracked or unconfirmed, return no match.
4. **No other company uses the prefix today.**
   - Search every evidence set for the prefix, including other owners' evidence and the marketplace blocks.
   - If two owners share a block, extend the prefix until it separates them (at most 10 digits). If it cannot, use exact rows only, or follow a dominant-owner exception approved under Decision 2.
5. **The barcode owner decides the match**, not the brand on the box.
   - Licensed makers (Kaz Vicks devices), distributors (Select Consumer Group) and marketplace sellers stay unmatched unless that company is tracked.
   - Store brands follow Decision 3.

## Expected coverage gain

**Method.** All scripts and outputs are in the session scratchpad (`.../scratchpad/hh/`). The lead can copy them to `tools/off-bulk/research-2026-10-14/`.

- **Test set A.** 8,534 in-scope UPCs from archived Kroger URLs: 38 two-letter slug starts, up to 2,500 URLs each, filtered by category keywords. After removing the 918 marketplace-block codes, 7,616 remain.
- **Test set B.** 4,683 US UPC-As from Open Beauty, Open Products and Open Pet Food Facts.
- **Tiers.** Each tier adds to the previous one, and the test set's own family was left out when deriving prefixes:
  - **T0:** `main` today.
  - **T1:** Phase 0 fixes plus the October 1 prefixes.
  - **T2:** plus candidates from this pass for existing entities.
  - **T3:** plus new owner entities, with Kenvue moved off J&J.
  - **T4:** plus store brands mapped to retailers.
- **Right or wrong owner** is judged only for brands in a hand-made brand table. Candidates passed a mechanical version of the bar and are unreviewed.
- **Caveats.** The shelf sample leans toward brands starting with those letters, and archived pages are older than today's shelf. The figures are estimates, not promises.

| Tier | Kroger shelf (7,616) | Wrong owner | Open*Facts US (4,683) | Wrong owner |
|---|---|---|---|---|
| T0 `main` today | 36.7% | 336 | 21.0% | 111 |
| T1 fixes + Oct 1 prefixes | 48.0% | 329 | 25.1% | 72 |
| T2 + new prefixes, existing entities | 51.4% | 324 | 26.0% | 73 |
| T3 + new owner entities | 53.4% | 155 | 28.5% | 28 |
| T4 + store brands | 56.0% | 155 | 30.7% | 29 |

On the Kroger shelf, 170 of the T0 wrong-owner hits are Kenvue products credited to J&J and 147 are Suave products credited to Unilever. The 155 left at T3 and T4 are mostly Suave under `079400` (Decision 2).

Kroger shelf match rate by category (matched products / in-scope products):

| Category | n | T0 | T1 | T2 | T3 | T4 |
|---|---|---|---|---|---|---|
| OTC medicine | 462 | 14% | 27% | 27% | 47% | 65% |
| Cleaning and laundry | 1,817 | 42% | 64% | 64% | 64% | 65% |
| Paper goods and bags | 292 | 25% | 64% | 64% | 64% | 72% |
| Oral care | 528 | 68% | 78% | 78% | 78% | 80% |
| Deodorant, hair, body | 2,187 | 42% | 50% | 53% | 54% | 56% |
| Cosmetics | 243 | 45% | 47% | 47% | 47% | 47% |
| Baby | 431 | 65% | 73% | 73% | 73% | 75% |
| Pet | 522 | 23% | 27% | 56% | 56% | 56% |
| Vitamins | 1,134 | 10% | 10% | 13% | 16% | 18% |

What stays unmatched after T4:
- **Long-tail brands with no tracked owner,** such as Alba Botanica, Herb Pharm, Life Extension, Natrol, Palmer's, Dr. Bronner's and Meow Mix (Smucker; its block is shared).
- **Mixed blocks:** Milk-Bone and Kibbles 'n Bits in `079100`, Claritin and Coppertone in `041100`.
- **Short 8-blocks still under review,** for example Method `817939`.

### End-to-end sample (20 real barcodes)

"Today" is the replica of `main`'s matcher. Kroger entries are archived `www.kroger.com/p/<slug>/<code>` URLs from the Wayback CDX index. DailyMed links are `dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=<id>`. Every UPC passes its check digit.

| # | Product | UPC-A | Evidence | Owner today | App today | After plan |
|---|---|---|---|---|---|---|
| 1 | Advil tablets, 24 ct | 305730150200 | FDA label (Haleon US Holdings), DailyMed `1a665e64-9f30-be37-4a83-38789f1f1e89`; Kroger `/advil-pain-reliever-...-24-coated-tablets/0030573015020`; Open Beauty Facts | Haleon | Haleon (`305730`) | Haleon (curated row) |
| 2 | Crest Kids Mandalorian strawberry toothpaste | 037000555674 | FDA label (P&G Manufactura), DailyMed `01f35279-76ce-6027-e063-6294a90a8e34`; Kroger `/crest-kid-s-featuring-star-wars-...-toothpaste/0003700055567` | P&G | P&G (`037000`) | P&G |
| 3 | Colgate Total Clean Mint toothpaste | 035000459862 | Kroger `/colgate-clean-mint-total-toothpaste/0003500045986`; Open Products Facts; Open Beauty Facts (Oct 1) | Colgate-Palmolive | Colgate (`035000`) | Colgate |
| 4 | Tylenol 8 HR Muscle Aches & Pain | 300450297211 | FDA label (Kenvue Brands LLC), DailyMed `037ec598-cba6-dbb6-e063-6394a90ac42c`; Kroger `/tylenol-8-hour-muscle-aches-pain-caplets-650mg/0030045029721` | Kenvue (Kimberly-Clark deal pending) | **J&J (wrong)** | Kenvue, or Kimberly-Clark once closed (Decision 1) |
| 5 | Listerine Cool Mint | 312547427357 | FDA label (Kenvue), DailyMed `44f2b66a-26ae-1044-e063-6394a90a9ab6`; Kroger `/listerine-antiseptic-mouthwash-cool-mint-.../0031254742735`; Open Beauty Facts | Kenvue | **J&J (wrong)** | as #4 |
| 6 | Mucinex Sinus-Max Clear & Cool nasal spray | 363824834368 | FDA label (Reckitt), DailyMed `2ee95e17-bd94-d717-e063-6294a90a2173`; Kroger `/mucinex-sinus-max-...-nasal-spray/0036382483436`; rbnainfo.com (Oct 1) | Reckitt | Reckitt (`363824`) | Reckitt |
| 7 | Zicam Cold Remedy fruit drops | 732216301359 | FDA label (Church & Dwight), DailyMed `ce2daf65-37b9-11e1-e053-2a95a90a6f0c`; Kroger `/zicam-cold-remedy-assorted-fruit-flavors-medicated-drops/0073221630135`; zicam.com (Oct 1) | Church & Dwight | no match | Church & Dwight (Oct 1 `732216`) |
| 8 | Claritin Allergy | 041100595416 | FDA label (Bayer HealthCare), DailyMed `19afd658-8c67-af44-e063-6394a90abada`; Kroger `/claritin-liquid-non-drowsy-.../0004110059541` | Bayer | no match | Bayer: needs a new entity and exact rows (`041100` shared with Coppertone/Beiersdorf) |
| 9 | Aleve tablets 220 mg | 025866591981 | FDA label (Bayer), DailyMed `00ef5b30-71d0-4cb4-84a3-48c67d1cea2a`; Kroger `/aleve-naproxen-sodium-...-tablets-220mg/0002586659198` | Bayer | no match | Bayer (new entity, `025866`) |
| 10 | Vicks NyQuil Severe Max, berry | 323900038158 | Kroger `/nyquil-severe-max-strength-cold-flu-berry-.../0032390003815`; Open Products Facts | P&G | no match | P&G (Oct 1 `323900`) |
| 11 | Windex Original, 23 oz | 019800701956 | Kroger `/windex-glass-cleaner-original-blue-spray-bottle-23-fl-oz/0001980070195`; Fairway, ShopRite and Harris Teeter (Oct 1) | SC Johnson | no match | SC Johnson (Oct 1 `019800`) |
| 12 | Clorox 2 Free & Clear | 044600300467 | Kroger `/clorox-2-for-colors-free-and-clear-3-in-1-laundry-additive/0004460030046`; clorox.com (Oct 1) | Clorox | no match | Clorox (Oct 1 `044600`) |
| 13 | Tide Coldwater Clean liquid | 037000874201 | Kroger `/tide-laundry-detergent-liquid-coldwater-clean-.../0003700087420`; Open Products Facts | P&G | P&G | P&G |
| 14 | Huggies Natural Care wipes | 036000504071 | Kroger `/huggies-nat-cr-refrsh-babywipe-rgd-flptp-56/0003600050407`; Open Beauty Facts | Kimberly-Clark | Kimberly-Clark | Kimberly-Clark |
| 15 | Purina Beneful Chopped Blends | 017800179669 | Kroger `/purina-beneful-chopped-blends-...-variety-pack/0001780017966`; Open Pet Food Facts | Nestlé | no match | Nestlé (new `017800`, after review) |
| 16 | Milk-Bone Original biscuits | 079100514113 | Kroger `/milk-bone-crunchy-large-dog-treats-original-beef-flavor/0007910051411`; Open Pet Food Facts | J.M. Smucker | no match | no match unless Smucker is added and exact rows are used (`079100` shared with Post's Kibbles 'n Bits and 9Lives) |
| 17 | Nature Made Burp-Less Fish Oil | 031604026653 | Kroger `/nature-made-burp-less-fish-oil-.../0003160402665`; NIH DSLD 271506; Open Products Facts | Pharmavite (Otsuka) | no match | Pharmavite (new entity, `031604`) |
| 18 | Equate sheer bandages (Walmart) | 681131006767 | FDA GUDID, company WAL-MART STORES, INC. (also Equate children's ibuprofen `681131016599`, Open Beauty Facts) | Walmart (store brand) | **Maple Leaf Foods (wrong)** | Walmart or no match (Decision 3) |
| 19 | Suave 24-hour powder antiperspirant (older code) | 079400404114 | Kroger `/suave-24-hour-protection-powder-anti-perspirant-deodorant/0007940040411` | Suave Brands Co. (Yellow Wood) | **Unilever (wrong)** | exact override to Suave Brands, or no match (Decision 2) |
| 20 | Suave Invisible Solid antiperspirant (2026 label) | 383711002564 | FDA label (Suave Brands Co, LLC), DailyMed `3002aea9-dae8-3c48-e063-6294a90a8296` | Suave Brands Co. | no match | Suave Brands (new entity, `383711`) |

Result:
- **Today:** 6 of 20 match the right owner, 4 match the wrong owner (Tylenol, Listerine, Equate, older Suave), and 10 return no match.
- **After the full plan:** 18 match the right owner. Milk-Bone stays unmatched, and Equate goes to Walmart or no match (Decision 3).
- **Phase 0 with the October 1 prefixes alone** adds 4 correct matches (Zicam, NyQuil, Windex, Clorox 2) and removes the Equate error.

## Open questions for the owner

1. **Kenvue.** Tylenol, Zyrtec, Benadryl, Motrin, Listerine, Neutrogena, Aveeno, Band-Aid and Johnson's are credited to J&J, which has held no stake since May 2024.
   - Option A: a new `kenvue` entity now, re-pointed to `kimberly-clark` when the merger closes.
   - Option B: check close status at ship time and map straight to `kimberly-clark` if closed.
   - Either way, remove the brands from `johnson-and-johnson`. The same applies to the aliases (Kenvue, Band-Aid, Tylenol, Listerine, Neutrogena).
2. **Mixed legacy blocks.**
   - `079400`: Unilever with Suave. On the shelf sample this is about 64% Unilever, but it covers Dove and Degree.
   - `017000`: Henkel's Dial with Thriving Brands' Right Guard.
   - `041100`: Bayer's Claritin with Beiersdorf's Coppertone. Our counts show about 84% Bayer.
   - `079100`: Smucker's Milk-Bone with Post's Kibbles 'n Bits and 9Lives. Our counts show about 82% Smucker.
   - `30573x`: Haleon with ChapStick, now Suave Brands.
   - Options: keep the dominant owner and add exact-row overrides for the minority, or use exact rows only. Recommendation: dominant owner plus overrides where the minority is a carve-out moving to its own prefix (Suave to `383711`, Right Guard to `850042`); exact rows only where neither side dominates.
3. **Store brands** (Equate, Great Value, Member's Mark, up&up, CVS Health, Walgreens, Kroger, Kirkland, Dollar General). Under the ownership rule the retailer owns its store brand.
   - Options: map store brands to the retailer entities, or return no match. Either way, stop crediting Walmart's prefixes to food companies.
   - Store brands are about 21% of UPC-bearing OTC labels. The evidence is FDA-filed: CVS `050428`, Walgreens `311917`, Kroger `041260`/`011110`, Walmart `681131`/`194346`, Target `311673` and others.
4. **New owner entities.** Each needs a no-API FEC check with `verify:entities:bulk`:
   - Bayer: Claritin, Aleve, Alka-Seltzer, One A Day, MiraLAX, Afrin, Phillips'.
   - Opella: Allegra, Gold Bond, Icy Hot, Cortizone-10, Dulcolax, ACT. CD&R holds 50%, Sanofi 48.2%; closed 2025-04-30.
   - Edgewell: Banana Boat, Hawaiian Tropic, Schick, Wet Ones.
   - Essity: Playtex, o.b., Stayfree, Carefree in North America, bought from Edgewell 2026-02-02.
   - Pharmavite (Otsuka): Nature Made.
   - J.M. Smucker: Milk-Bone, Meow Mix.
   - Suave Brands (Yellow Wood): Suave, ChapStick.
   - Galderma: Cetaphil. GOJO: Purell. Prestige Consumer Healthcare: Dramamine, Monistat, Clear Eyes, Chloraseptic.
   - Helen of Troy: Vicks devices under license.
   - Which ones are worth an entity?
5. **Alias clean-ups found here, outside barcodes:** `haleon` lists ChapStick and `dollar-tree` lists Family Dollar. Fix them in 1.2.2?
6. **ODbL.** `products.json` already derives from OFF. Add an ODbL notice and Open Food Facts attribution for the data file (code stays AGPL), and allow Open*Facts as corroborating evidence? Or keep Open*Facts to test sets only?
7. **Pending deals to re-check at ship:**
   - Kenvue to Kimberly-Clark.
   - Nestlé's mainstream vitamins (Nature's Bounty, Osteo Bi-Flex, Nuun and others) to Yellow Wood: announced 2026-09-01, close expected in the first half of 2027. Keep them under Nestlé until close.
   - Reckitt's Mead Johnson review, with no deal reported as of April 2026.
   - P&G's agreement to buy Thorne, reported in August 2026.
8. **Licensed and joint-venture products.** Vicks devices and Braun thermometers come from Kaz; Clearblue comes from SPD, a P&G joint venture. Map them by barcode owner, which gives no match unless that company is tracked. Agree?
9. **Downloads.** Approve the optional USDA FDC bulk file (427 MB) for baby food and formula? Nothing else in this plan needs a download over 200 MB. openFDA, GUDID and DSLD work through their APIs.
10. **Sources.** Approve the Internet Archive's URL index (URL strings only) as a recurring retailer-evidence source? Confirm that GS1 lookups stay out of the pipeline because their terms allow internal use only.

## Appendix: candidates from this pass (unreviewed)

These passed a mechanical version of the bar on local evidence. Each needs review and an ownership check before entering `curated-prefixes.json`. Entries that runtime or the October 1 research already cover are omitted. In the entries below, n is the number of distinct barcodes and "off" counts official FDA barcodes. Families: fda = FDA labels, kr = archived Kroger URLs, of = Open*Facts, dsld = NIH DSLD.

**Existing entities (T2):**
- **nestle:**
  - `017800` (n=132, kr+of, Purina, dominance review)
  - `038100` (47, kr+of)
  - `070230` (14, kr+of)
  - `074312` (92, dsld+of, Nature's Bounty, pending sale)
  - `6580101` (84, kr+dsld+of, Garden of Life)
- **abbott:** `070074` (57, kr+of, Similac and Pedialyte).
- **piping-rock-health-products:** `027917` (99, dsld+of, Vitafusion).
- **post-holdings:** `071190` (10, kr+of, Nutrish).
- **haleon:**
  - `076314` (58, dsld+of, Emergen-C)
  - `305731` (21, kr+dsld+of, Centrum; ChapStick legacy codes in the same block)
- **henkel:**
  - `017000` (36, fda+kr+of, off=27, Dial; mixed with Right Guard)
  - `052336` (4, fda+of)
- **unilever:**
  - `022400` (10, kr+of, TRESemmé)
  - `81705302` (59, dsld+of, SmartyPants)
  - `84016020` (36, kr+dsld, Olly)
  - `852933008` (18, kr+dsld, Olly)
  - `8581580` (31, kr+dsld, Olly)
  - `859139006` (22, kr+of)
  - `81011703` (6, kr+of)
- **procter-gamble:**
  - `81016080` (15, fda, First Aid Beauty)
  - `81551702` (5, fda+of, First Aid Beauty)
  - `81215403` (80, fda+kr+of)
  - `81452101` (10, kr+of)
  - `19067900` (15, kr+of)
  - `851939002` (4, fda+of)
- **colgate-palmolive:**
  - `81915602` (35, kr+of, Hello)
  - `035110` (3, fda+kr+of)
  - `81008487` (6)
  - `81004789` (3)
  - `850000494` (8)
- **church-dwight:**
  - `850028448` (23, fda, off=23, Touchland; the 6-digit block is credited to Ottogi today)
  - `850071283` (7, fda, Touchland)
  - `81519501` (3, kr+of)
- **sc-johnson:** `8435361` (71, kr+of).
- **reckitt:** `731124` (8, fda, Biofreeze).
- **kao:** `0190450` (4, fda+of).
- **loreal:** `301872` (3, fda+of, CeraVe).
- **thriving-brands:** `850042203` (3, fda, Right Guard 2026 labels).

**New owner entities (T3):**
- **kenvue:** `300450`, `312547`, `381370`, `381371`, `381372`, `074300`, `300810`, `716837`, `012547`, `052800`. The first two move off J&J.
- **bayer:** `016500` (166, off=58), `025866`, `325866`, `312843`, `311017`.
- **opella:** `041167` (55).
- **edgewell:** `079656` (Banana Boat), `075486` (Hawaiian Tropic), `8410580`, `853382004`.
- **suave-brands:** `383711` (49, off=22).
- **pharmavite:** `031604` (193).
- **galderma:** `302994`.
- **gojo:** `073852`.

**Store brands (T4):**
- **cvs-health:** `050428` (151, off=141).
- **walgreens:** `311917` (215, off=211), `049022`.
- **kroger:** `041260` (216), `011110` (40).
- **target:** `311673`, `349483`, `371661`, `368163`, `1919079`, `034197`, `490370`, `492450`, `732953`.
- **costco:** `096619`.
- **dollar-general:** `359726`, `715256`, `349580`.
- **walmart:** `681131`, `194346`, `078742`. These are already in runtime under the wrong entities.

## Requests made in this pass

All requests stayed at 1 per second or slower per site, with no keys, accounts or CAPTCHAs.
- openFDA: about 230 API calls and the 27 MB NDC zip.
- NIH DSLD: 12 calls.
- Open*Facts: 3 CSV downloads (27 MB) and 3 HEAD requests.
- Wayback CDX: 68 index queries.
- California WIC: 1 CSV.
- SEC EDGAR: 3 requests. GitHub: 3 requests.
- Plus web searches for ownership checks.

Blocked pages were not retried: the GS1 terms PDF returned 403, and the DSLD API guide returned no readable content (its terms came from a search summary). Nothing over 200 MB was downloaded.
