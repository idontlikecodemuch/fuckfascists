# Browser extension store launch — Chrome, Firefox, Edge

**Prepared:** October 12, 2026 · **Extension version:** 1.2.0 · **Branch:** `chore/extension-store-launch`

This is the launch packet for the Chrome Web Store (CWS), Firefox Add-ons (AMO), and Microsoft Edge Add-ons. It has the readiness audit, the upload packages, the listing copy for each store, and the owner's step-by-step checklist. Safari ships through the App Store and is out of scope here (see `docs/BROWSER_EXTENSION_BUILDS.md`).

Nothing has been submitted. No accounts were created and nothing was paid for.

## Owner decisions (October 14, 2026)

| | Decision | Status |
|---|---|---|
| Store name | `FCK, Financial Contribution Kit` with the neutral summary in the manifest. The popup still says FCK FASCISTS. | Done on this branch |
| D1, live FEC fallback | (a) Removed. The extension makes no FEC calls; it shows bundled data, refreshed daily from `main`. The §3.5 "no data collected" answers stand. | Done on this branch |
| D2, data freshness | Bundled data refreshed 2026-10-12 (`docs/FEC_BULK_REFRESH_2026-10-12.md`); packages rebuilt from it. With D1 (a), staleness no longer triggers any network call. | Done |
| D4, license | AGPL-3.0-or-later. `LICENSE` added, `package.json` and README updated. Pick "GNU Affero General Public License v3.0" on AMO. | Done on this branch |
| D7, publisher | **App Hold Media LLC** on every store, as both the account owner and the publisher name shown. Edge: Company account (verification takes days to weeks). CWS: the trader declaration will show the LLC's name and address. | Owner, at account setup |
| D8, Edge | Publish on Edge after Chrome and Firefox are live. | Owner, later |
| D3, privacy page | Still open: the four edits in §5 go on the marketing branch's site. | Open |

---

## 1. Readiness audit

Policies were checked against the live store documentation on October 12, 2026: the CWS Program Policies (including the July 1, 2026 Limited Use and Disclosure updates, enforced from August 1, 2026), the CWS image and review-process docs, the Mozilla Add-on Policies and source-code submission rules, and the Edge publishing guide.

### Fixed on this branch

| Area | Finding | Fix |
|---|---|---|
| Icons | All eight icons were solid-color placeholder squares (`#1A1A1A` and `#FF8C00`). CWS rejects listings with a missing icon, and a blank square reads as one. | New icons in `extension/icons/`. 16 and 32 px are a pixel-font "FCK" tile, legible in the toolbar. 48 and 128 px are the app icon art. The 128 px icon follows CWS guidance: 96×96 art inside 16 px of transparent padding. Amber variants: a solid amber tile at 16/32 and an amber-shifted app icon at 48/128. |
| Least privilege | `host_permissions: ["http://*/*", "https://*/*"]` was redundant. The content script's `matches` already grant injection on every site, and both fetch targets (raw.githubusercontent.com and api.open.fec.gov) send `Access-Control-Allow-Origin: *`. | Removed `host_permissions`. Verified in headless Chrome for Testing 145: the content script still injects, the service worker matches Home Depot and builds the full card, and the daily GitHub data fetch returns 200. The install warning doesn't change, because content-script matches carry the same "read and change data on all websites" warning. |
| Store name and summary | `name` was `FCK FASCISTS`, and the `description` (which becomes the CWS summary and the Edge short description) read "donate to authoritarian political movements". Both break the voice framework: store metadata is Clark, corporate-neutral, with the clinical name. | `name` is now `FCK, Financial Contribution Kit`, which matches the Google Play title pattern. `description` is now Clark-voice (128 of 132 characters): "The icon turns amber on sites whose company has political contributions on file. FEC records, R: and D:. Checked on your device." The in-product brand (popup header, toolbar tooltip) stays `FCK FASCISTS`. |
| Homepage | No `homepage_url`. | Added `https://fckfascists.com`. AMO and Edge show it. |
| In-product disclosure | CWS Limited Use allows browsing-activity handling only for a feature "described prominently in the Product's Chrome Web Store page and in the Product's user interface." The popup never said what happens to the domain it checks. | The popup footer now always shows "Sites are checked on this device. No browsing history saved." (`extCopy.privacyNote`). The copy-preview tool has been regenerated. |
| Popup false negative | The once-per-session throttle (`EXTENSION_FLAG_FREQUENCY = 'session'`) skipped building the tab flag. On the second page of a flagged site (homedepot.com → homedepot.com/cart), the popup said "No political funding on record for this site." Reproduced in headless Chrome. | Snooze and frequency now gate only the amber icon. The tab flag is always set, so the popup always shows the record for a matched site. The re-run passes. |
| Snooze response | After SNOOZE the popup showed the clean state, which claims "No political funding on record for this site." | The popup now closes after snoozing. |
| Hidden elements showing | `.confidence-badge` (`display: inline-block`) and `.source-link` (`display: block`) overrode the `hidden` attribute. Every card showed an empty badge box, plus the "See FEC record" link even when the Source row replaces it. | Added a global `[hidden] { display: none !important; }`. |
| AMO source code | The Firefox package is bundled and minified with esbuild, so AMO requires source plus build instructions that reproduce the package byte for byte. | New `npm run package:ext:source` (`scripts/package-extension-source.mjs`). It writes a self-contained archive: only the files esbuild bundles plus type-only imports, the build script, static files, bundled data, a one-dependency `package.json` and lockfile (exact esbuild version), and a README. `-- --verify` unzips it, runs `npm ci && npm run build`, and diffs against `dist/extension-firefox/`. The diff was identical. |

### Checked and fine

- **Manifest V3, version 1.2.0.** Matches the iOS app. First listing on every store, so no version conflicts.
- **Permissions:** `storage`, `activeTab`, `alarms` are all used (justifications in §3.4). `activeTab` is required: without host permissions the popup sees the active tab's URL only through the toolbar click grant. The headless check confirmed tab URLs are hidden otherwise.
- **No remote code.** No `eval`, no `new Function`, no `innerHTML` writes, no remote scripts or stylesheets, no inline script in `popup.html`. The default MV3 CSP is in force. The only network fetches are the bundled data (`chrome.runtime.getURL`), the public `entities.json` on GitHub (data, not code), and the FEC API (data). The minified bundle contains a few unused App Store URL constants pulled in from `config/constants.ts`. The extension never requests them, and the AMO README says so.
- **Minification.** Allowed by all three stores. Obfuscation is not, and esbuild only minifies.
- **Bundled data is current.** `assets/data/entities.json` (`updatedAt` 2026-10-01, 761 entities, 1,623 domains) matches `main` on GitHub byte for byte. All 241 entities that have both domains and a donation summary are within the 60-day freshness window. `people.bundle.json` is also dated 2026-10-01.
- **Firefox lint:** `npx web-ext@10.7.0 lint` on `dist/extension-firefox/` reports 0 errors, 0 warnings, 0 notices. The Gecko ID is `fck-fascists@fckfascists.com`, `strict_min_version` is 142.0, and `data_collection_permissions.required` is `["none"]`. See decision D1.
- **Tests:** extension Jest suites pass (4 suites, 39 tests) and `tsc --noEmit` is clean.

### Flagged for the owner (not changed here)

| # | Decision or gap | Why it matters | Recommendation |
|---|---|---|---|
| D1 | **Live FEC fallback in the extension.** When a matched company's bundled data is older than `ENTITY_CACHE_TTL_DAYS` (60 days), the service worker calls `api.open.fec.gov` with that company's committee ID, using the public DEMO_KEY. | That request is derived from the site the user is on, so strictly it transmits browsing-derived data to a third party. That conflicts with Firefox's `data_collection_permissions: none` and with a clean "no data collected" answer on CWS and Edge. Today it never fires: every domain entity is fresh until **2026-11-30**. After that it fires on every flagged visit until new data ships. | Pick one before submitting. **(a) Recommended:** remove the extension's live fallback (the `else if (committeeId)` branch in `handleCheckDomain`) and show stale bundled data with its date. The privacy answers in §3 then stay true as written. This is a documented cross-surface divergence (Principle 8), so record it in CLAUDE.md. **(b)** Keep it, and declare `browsingActivity` as required data in the Firefox manifest (users see it at install) and "Web history" on CWS and Edge. |
| D2 | **Data freshness window.** Bundled summaries go stale on 2026-11-30, 60 days after the October 1 refresh. | Under the current code (D1-b), stale data triggers FEC calls. Under D1-a, the popup shows numbers that are older than the app's. | Refresh FEC data, or at least `lastVerifiedDate`, before 2026-11-30. The extension picks up `main` within a day through its daily alarm. |
| D3 | **Privacy policy page (fckfascists.com/privacy) needs four edits before the CWS submission.** The site isn't in this repo. | CWS Limited Use requires "an affirmative statement that your use of the data complies with the Limited Use restrictions" on your website. The policy names Chrome and Firefox only. | Add the text in §5. |
| D4 | **No LICENSE file** in the repo, even though the listings and README call the project open source. | AMO's submit form asks for a license (it offers "All Rights Reserved"). With no license file, "open source" is legally inaccurate. | Pick a license (MIT, GPL-3.0, AGPL-3.0, or keep All Rights Reserved and say "source-available"), add `LICENSE`, and select the same license on AMO. |
| D5 | **In-product consent screen.** The July 2026 CWS update requires that "all data collection be prominently disclosed". The older User Data FAQ (#10) says the disclosure and consent must happen in the product UI, not only in the listing. | The extension collects nothing; it processes hostnames locally. That is the same model as uBlock Origin Lite, which declares no data collected, so this is a low-to-medium risk, not a known blocker. | Submit as is with the popup disclosure line. If CWS rejects citing "Disclosure Requirements", add a first-run page from `chrome.runtime.onInstalled` with the disclosure and a "Turn on site checks" button, and gate the content-script checks on that flag. Estimated half a day. |
| D6 | **`service-worker.ts` is 466 lines.** CLAUDE.md caps files at 250. This was a known violation before this branch, and this branch added 3 lines. | Code-quality rule. Store reviewers won't care. | Do the split already documented in CLAUDE.md (extract `handleCheckDomain` and data freshness into `extension/background/domainCheck.ts`) in its own branch. |
| D7 | **Publisher identity.** The iOS app is published by App Hold Media LLC. | CWS publisher name, the Edge account type (Individual or Company; Company verification takes days to weeks), and the CWS EU trader declaration should match how you want the extension attributed. | Decide before creating accounts. Individual Edge accounts verify faster. |
| D8 | **Edge store URL in the app.** `copy/shared.ts` has Chrome and Firefox URLs only. | Edge is optional. | If you publish on Edge, add `extensionEdgeUrl` with the copy changes in §6, step 6. |

---

## 2. Packages

Build from a clean checkout of the branch you are shipping. If `assets/data/` changed after this packet, rebuild first.

```bash
npm run build:ext:all                      # Chrome, Edge, Firefox, Safari builds and ZIPs
npm run package:ext:source -- --verify     # AMO source archive, rebuilt and diffed
cd /tmp && npx web-ext@10.7.0 lint --source-dir <repo>/dist/extension-firefox
```

All output is under `dist/`, which is gitignored:

| Store | Upload this | Size |
|---|---|---|
| Chrome Web Store | `dist/packages/fck-fascists-chrome-1.2.0.zip` | ~0.8 MB |
| Microsoft Edge Add-ons | `dist/packages/fck-fascists-edge-1.2.0.zip` | ~0.8 MB |
| Firefox Add-ons (package) | `dist/packages/fck-fascists-firefox-1.2.0.zip` | ~0.8 MB |
| Firefox Add-ons (source code) | `dist/packages/fck-fascists-firefox-1.2.0-source.zip` | ~0.9 MB |
| Listing art | `dist/packages/listing/` (§4) | — |

Every later version needs a higher `version` in `extension/manifest.json` on every store, plus a fresh source archive for AMO.

---

## 3. Store listing drafts

Voice: the store listing is Clark, corporate-neutral (`docs/FCK_VOICE_FRAMEWORK.md`). No F-word in store metadata. R: and D: always appear together. "Avoid" is the verb.

### 3.1 Shared copy

**Name (from the manifest; CWS and Edge read it from the package):** `FCK, Financial Contribution Kit`

**Summary / short description (from the manifest, 128 of 132 characters):**

> The icon turns amber on sites whose company has political contributions on file. FEC records, R: and D:. Checked on your device.

**Full description (CWS, Edge, AMO; Edge needs 250 to 10,000 characters):**

> Know whose money is behind the site before you buy. FCK, your Financial Contribution Kit, checks the site you're on against public Federal Election Commission (FEC) records and shows the political contributions on file for the company behind it.
>
> HOW IT WORKS
> • The toolbar icon turns amber on sites whose company has political contributions on file. No pop-ups. No banners.
> • Click the icon to open the file: R: and D: totals for the latest completed election cycle and since 2016, the active cycles, and a source link to every FEC record behind the numbers.
> • Tap AVOID to log that you took your business elsewhere. Your weekly count shows at the bottom of the popup.
> • Snooze a site for 7 days if you don't want the reminder.
>
> WHAT'S ON FILE
> Contributions from the company's PAC and from linked executives and owners, from FEC filings. Republican and Democratic totals are both shown, every time. Every figure links to FEC.gov so you can check it yourself.
>
> PRIVACY
> • Sites are checked on your device against a bundled list. The extension doesn't save your browsing history and doesn't send the sites you visit anywhere.
> • No account. No sign-in. No analytics. No ads.
> • Saved in your browser only: your avoid counts and any sites you snooze. Counts don't sync with the mobile app.
> • Network requests: one download a day of the public data file from GitHub, so new filings reach you between releases.
>
> Also on iPhone, where you can map, tap, and scan businesses and products. Open source: github.com/idontlikecodemuch/fuckfascists
>
> Financial contributions, on file. 🤘🏽

If decision D1 is (b), add this as the last PRIVACY bullet: "When the bundled data for a company is out of date, the extension asks api.open.fec.gov for that company's public committee totals. The request contains the committee ID only."

**Homepage:** `https://fckfascists.com`
**Privacy policy:** `https://fckfascists.com/privacy`
**Support:** `https://github.com/idontlikecodemuch/fuckfascists/issues` · `info@fckfascists.com`

### 3.2 Single-purpose statement (CWS and Edge)

> Shows the political contributions on file with the U.S. Federal Election Commission (FEC) for the company behind the website the user is on, and lets the user log that they avoided that company.

### 3.3 Category

| Store | Category |
|---|---|
| CWS | Lifestyle › Shopping (fallback: Productivity › Tools) |
| AMO | Shopping; second category Alerts & Updates |
| Edge | Shopping |

### 3.4 Permission justifications (CWS and Edge privacy tab)

- **storage:** Saves, in the browser only: the user's avoid counts (company ID, date, count), sites the user snoozed (hostname and expiry, 7 days), the latest copy of the public company data file, and a 60-day cache of public FEC committee totals. Nothing in storage is sent anywhere.
- **activeTab:** When the user clicks the toolbar icon, the popup reads the active tab's address to show the record for that site, and re-checks it if the background worker restarted. No other tab is read.
- **alarms:** Schedules a once-a-day refresh of the public company data file (`assets/data/entities.json` on GitHub), so new FEC filings reach users between releases.
- **Host access (content script on `http://*/*` and `https://*/*`):** The content script reads only `location.hostname` on each page and passes it to the background worker. The worker compares it to the bundled list of 1,600+ company domains on the device. This is the extension's core feature: the toolbar icon turns amber on a matching site. The script doesn't read or change page content, and the hostname is never stored or sent. Matching has to run on every site because the domain list is large and updates daily.

**Remote code:** "No, I am not using remote code." The daily file is JSON data, parsed and validated, never executed.

### 3.5 Data usage answers

With D1 (a), or with D1 unresolved while the fallback can't fire before 2026-11-30:

- **CWS "What user data do you plan to collect":** check nothing. All handling is local. Hostnames are compared in memory. Stored data is the user's own avoid log and snoozes, which never leave the browser.
- **CWS certifications:** check all three. We don't sell or transfer user data to third parties outside the approved use cases. We don't use or transfer it for purposes unrelated to the single purpose. We don't use or transfer it to determine creditworthiness or for lending.
- **Edge:** same as CWS.
- **Firefox:** `data_collection_permissions.required: ["none"]` (already in the build). On AMO, leave "This add-on collects or transmits data" unchecked.

With D1 (b): check **Web history** on CWS and Edge, and change the Firefox manifest to `required: ["browsingActivity"]` (users see this at install). Also check the AMO privacy-policy box and paste the extension section of the privacy policy.

### 3.6 AMO-only fields

- **Add-on URL slug:** `fck-financial-contribution-kit`. That makes the URL `https://addons.mozilla.org/firefox/addon/fck-financial-contribution-kit/`.
- **Summary (AMO allows 250; 219 characters):** "The toolbar icon turns amber on sites whose company has political contributions on file with the FEC. Open it for R: and D: totals and a link to every record. Sites are checked on your device. No browsing history saved."
- **Description:** the full description in §3.1.
- **Platforms:** Firefox desktop. Leave Android unchecked; the popup is untested there.
- **Tags:** shopping, politics, transparency, privacy.
- **Support email / site:** `info@fckfascists.com` / `https://github.com/idontlikecodemuch/fuckfascists/issues`
- **License:** GNU Affero General Public License v3.0 (AGPL-3.0-or-later; see `LICENSE`).
- **Experimental:** no. **Requires payment:** no.
- **Source code:** "Yes". Upload `fck-fascists-firefox-1.2.0-source.zip`.
- **Notes for reviewers:**

  > Source: upload attached (fck-fascists-firefox-1.2.0-source.zip). Build: `npm ci && npm run build` (esbuild 0.25.12, any OS with Node 18+, needs `zip`). Output `dist/extension-firefox/` matches the uploaded package byte for byte; we verified this with a clean rebuild. Bundled `assets/data/*.json` are public FEC records (data). Network: a daily GET of the same entities.json from raw.githubusercontent.com (validated JSON, never executed). To test: visit homedepot.com or walmart.com, the toolbar icon turns amber, click it to see R: and D: totals with FEC.gov links. No account or login needed.

### 3.7 Edge-only fields

- **Extension logo:** `dist/packages/listing/edge-logo-300x300.png`
- **Search terms (up to 7, 30 characters each, 21 words total):** political donations · FEC · campaign finance · PAC contributions · shopping · company donations · transparency
- **Mature content:** unchecked.
- **Notes for certification:** same as the AMO reviewer note, minus the source-code lines.

### 3.8 CWS-only fields

- **Language:** English (United States).
- **Official URL:** link `fckfascists.com` after verifying the domain in Google Search Console (optional; adds a verified badge).
- **Mature content:** no.
- **Distribution:** public, all regions.

---

## 4. Listing art

All files are in `dist/packages/listing/` (gitignored). The screenshots show the real popup: it was rendered from the unpacked build in headless Chrome, with live service-worker matching against the bundled data, then framed at 1280×800.

| File | Use |
|---|---|
| `screenshot-1-flagged-1280x800.png` | Amber icon plus the Home Depot card (R: and D:, Source links) |
| `screenshot-2-avoided-1280x800.png` | The AVOIDED state and weekly count |
| `screenshot-3-checked-locally-1280x800.png` | A clean site and the on-device privacy line |
| `promo-small-440x280.png` | CWS small promo tile (required); Edge small tile |
| `promo-marquee-1400x560.png` | CWS marquee and Edge large tile (optional) |
| `edge-logo-300x300.png` | Edge store logo |

CWS and Edge take 1280×800. AMO accepts any size; upload the same three. The promo tiles carry only the icon and "Financial Contribution Kit", following CWS's "avoid text" guidance for promo art.

---

## 5. Privacy policy changes (fckfascists.com/privacy, decision D3)

Make these changes before submitting to CWS. The site isn't in this repo.

1. **Intro:** "the browser extension (Chrome and Firefox)" → "the browser extension (Chrome, Firefox, and Microsoft Edge)".
2. **Section 4 (browser extension), add:**
   > The extension also keeps, in local extension storage, the latest copy of the public company list and a cache of public FEC committee totals (up to 60 days). Both are public records keyed by company, not by site or visit.
3. **New paragraph at the end of section 4:**
   > The extension's use of information received from Chrome and other browser APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.
4. **Section 9 (your choices), fix stale instructions:** "triple-tap the version label" → "tap the version label seven times and confirm" (current beta toggle).
5. Bump the version and effective date at the top.

---

## 6. Owner checklist

Steps marked 🔑 need you: an account, payment, a credential, or a legal or brand decision. Nothing here was done by the agent.

### Before any store

1. ✅ D1 (removed) and D4 (AGPL-3.0) are decided and landed on this branch; packages are rebuilt (see "Owner decisions").
2. 🔑 Publish the privacy policy edits in §5 (D3).
3. Merge `chore/extension-store-launch` (or the branch you're shipping) to `main`, then rebuild packages from `main` (§2) so the data file and code match what users get from GitHub.
4. Load `dist/extension/` unpacked in Chrome and `dist/extension-firefox/manifest.json` in Firefox (`about:debugging` → This Firefox → Load Temporary Add-on). Smoke test: visit homedepot.com (amber icon), open the popup (card), go to a second page on the site (popup still shows the card), tap AVOID (weekly count goes to 1), then visit example.org (clean state).

### Chrome Web Store (one-time US$5 fee)

1. 🔑 Use the Google account that will own the listing. Turn on **2-Step Verification** at `myaccount.google.com/security`; CWS requires it to publish.
2. 🔑 Open `https://chrome.google.com/webstore/devconsole`, accept the developer agreement, and **pay the one-time US$5 registration fee**. Confirm the amount at checkout.
3. 🔑 Account tab: set the **publisher name** to `App Hold Media LLC` (D7), add and **verify the contact email** (click the link CWS emails you), and complete the **trader / non-trader declaration** for the EU if prompted.
4. Items → **New item** → upload `fck-fascists-chrome-1.2.0.zip`. The item ID appears now. Note it for step 9.
5. **Store listing** tab: description (§3.1), category (§3.3), language, the three screenshots, the 440×280 small promo tile, the optional marquee, homepage and support URLs.
6. **Privacy** tab: single purpose (§3.2), justifications for each permission and for host access (§3.4), remote code "No", data usage (§3.5), privacy policy URL.
7. **Distribution** tab: free, public, all regions.
8. 🔑 **Submit for review.** Optionally check "publish automatically after approval". Review usually takes a few days. Broad host access and a new developer account can stretch it to a few weeks. If it is still pending after 3 weeks, contact developer support.
9. Store URL: `https://chromewebstore.google.com/detail/<item-id>`. The slug part is optional.

### Firefox Add-ons (free)

1. 🔑 Create or sign in to a **Mozilla account** at `https://addons.mozilla.org/developers/`. AMO requires **two-factor authentication** (authenticator app). Save the recovery codes; Mozilla can't restore a locked account. Set the profile's **display name** to `App Hold Media LLC` (D7); AMO shows it as the author.
2. **Submit a New Add-on** → "On this site" (listed) → upload `fck-fascists-firefox-1.2.0.zip`. The validator should pass with no warnings.
3. Platforms: Firefox desktop.
4. Source code: **Yes**, then upload `fck-fascists-firefox-1.2.0-source.zip`.
5. Fill in the listing (§3.6): name, slug `fck-financial-contribution-kit`, summary, description, categories, support email and site, 🔑 license, and the privacy box per §3.5. Paste the reviewer notes.
6. 🔑 **Submit Version**, then add the screenshots on the listing's Edit Product Page → Media. Listed versions usually go live after automated review, often within a day, and may get a human source-code review later. Expect a reviewer email if anything in the source doesn't reproduce.
7. Store URL: `https://addons.mozilla.org/firefox/addon/fck-financial-contribution-kit/`

### Microsoft Edge Add-ons (free; after Chrome and Firefox are live)

1. 🔑 Sign in to Partner Center (`https://partner.microsoft.com/dashboard/microsoftedge/public/login`) with a personal Microsoft account (Outlook.com, or a GitHub sign-in that creates one). Turn on two-step verification for that account (recommended).
2. 🔑 Complete the **Microsoft Edge program registration**: country, **account type: Company, App Hold Media LLC** (D7; can't be changed later), publisher display name `App Hold Media LLC`, contact info, and accept the App Developer Agreement. No fee. Individual accounts verify quickly; Company accounts take days to weeks.
3. **Create new extension** → upload `fck-fascists-edge-1.2.0.zip`.
4. Availability: Public, all markets. Properties: category Shopping, website, support contact, mature content unchecked.
5. Privacy: single purpose, permission justifications, remote code "No", data usage, privacy policy URL (§3.2–3.5).
6. Store listing (English): description (§3.1, which clears the 250-character minimum), logo `edge-logo-300x300.png`, the 440×280 and 1400×560 tiles, the three screenshots, and search terms (§3.7).
7. 🔑 **Publish** with the certification notes. Certification takes up to 7 business days.
8. Store URL: `https://microsoftedge.microsoft.com/addons/detail/<product-id>` (shown on the extension's Overview page).

### After approval: update the app's store links

The in-app Info screen links are `sharedCopy.extensionChromeUrl` and `extensionFirefoxUrl` in `copy/shared.ts`. They currently point to `https://FCKfascists.com/extension/chrome` and `/extension/firefox`.

1. **Fastest, no app release:** add redirects on the site (for example in `site/.htaccess`): `/extension/chrome` → the CWS URL, `/extension/firefox` → the AMO URL, `/extension/edge` → the Edge URL. Shipped app builds start working immediately.
2. **Then, in the next app release,** point the copy straight at the stores. In `copy/shared.ts`:
   ```ts
   extensionChromeUrl: "https://chromewebstore.google.com/detail/<item-id>",
   extensionFirefoxUrl: "https://addons.mozilla.org/firefox/addon/fck-financial-contribution-kit/",
   ```
   Keep the site redirects either way. They also cover the remote Info content.
3. If you publish on Edge: add `extensionEdgeUrl` to `copy/shared.ts` and an `extension-edge` link next to the others in `copy/infoContent.ts` (around line 244). Add the same link to `info.json` in the `fckfascists-data` repo, because Info content is fetched from there.
4. Regenerate the copy-preview tool (`tools/copy-preview/copy-all.json` and `copy-all.js`; see CLAUDE.md, "Copy Management Rules") and run `bash scripts/audit-copy.sh`.
5. Update the website's "Get it" links and README.md with the store links.

### Every later update

Bump `version` in `extension/manifest.json`, then run `npm run build:ext:all` and `npm run package:ext:source -- --verify`. Upload the new ZIP to each store, plus the new source archive on AMO.
