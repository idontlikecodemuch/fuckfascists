# Meta ads — setup steps + asset plan (Oct 7, 2026)

> The authorization question — does declaring make FCK "a political app"? — is answered with
> Ad Library evidence in `siep-analysis.md` (same folder). Short version: it's a disclosure of
> who paid, not a side; the comparables either declare (Goods Unite Us, Ground News) or don't
> run Meta ads at all; and Meta's product carve-out does NOT cover us (party/PAC mentions and
> the Page name exclude it), so "product-first" below means the disclaimer is the only
> political-looking element, not that the ads can run undeclared. Hard date: live with at
> least one impression by **Oct 23**, or hold all Meta paid until Nov 4.

Supersedes the Aug 27 Story-ads brief on one point: with the midterms four weeks out,
authorize for "social issues, elections or politics" (SIEP) **now** instead of running
undeclared and waiting for a flag. Everything else from the playbook stands: one campaign,
one ad set, Traffic objective to the App Store (no Meta SDK, no pixel — SDK-free by
principle), small budget, judge on 7-day windows, never edit mid-flight, never boost from
the Instagram app (Apple takes 30% of in-app boosts).

## Why authorize first

- The brand name ("FCK FASCISTS", "Track political funding") and the money-in-politics
  creative will be classified SIEP by a reviewer whatever the tags say. Running undeclared
  risks rejections that erode the ad account — the one asset we can't rebuild.
- Meta blocks **new** social-issue/political ads in the final week before the election
  (about **Oct 27 – Nov 3, 2026**); ads already approved and running continue. Authorized
  and live by ~Oct 20 means we ride through the freeze; unauthorized means nothing runs
  until Nov 4.
- Cost: your government ID, 2FA, and a public "Paid for by App Hold Media LLC" line on
  every ad (kept in Meta's Ad Library for 7 years). The disclaimer reads as a company, not
  a cause — consistent with the positioning (a game; no claim for either party).
- Authorization takes 1–3 weeks. Start today.

## Step by step (your logins; I never enter payment or ID details)

1. **Meta Business Suite** — business.facebook.com → create a business portfolio
   "App Hold Media LLC". Turn on 2FA on the Facebook account that owns it (required for
   SIEP). ~10 min.
2. **Facebook Page** "FCK Fascists" — Ads Manager needs a Page as the advertiser identity
   even for Instagram-only ads. Avatar (`site/images/brand/og.jpg` crop or the app icon),
   website FCKapp.com, nothing else. Add it to the business portfolio. ~10 min.
3. **Connect Instagram** @fckfascists.app — Business Suite → Settings → Accounts →
   Instagram → connect, and link it to the Page. ~5 min.
4. **Ad account** — Business Settings → Ad accounts → Add → USD, your timezone, add the
   payment method. Name it "FCK — App Hold Media". ~5 min.
5. **App Store campaign-link token** — App Store Connect → App Analytics → FCK →
   Acquisition → Campaigns → "Create campaign link". Any link you generate carries your
   provider token `pt=NNNNN`. Keep it; every ad URL below uses it. ~2 min.
6. **SIEP authorization** — Business Settings → Ad accounts → the account → "Ads about
   social issues, elections or politics" → Start: confirm identity (ID upload; Meta may
   mail a code to a US address or verify instantly), then create the disclaimer
   **"App Hold Media LLC"** (needs a website, email or phone shown publicly — use
   FCKapp.com and info@fckfascists.com). Wait for "authorized" (1–3 weeks). Reply here when
   it lands.
7. **Campaign** (desktop Ads Manager → Create):
   - Objective **Traffic** · declare "This ad is about social issues, elections or
     politics" → attach the App Hold Media LLC disclaimer.
   - Conversion location **Website**, destination
     `https://apps.apple.com/us/app/fck-financialcontributionkit/id6761508241?pt=YOURTOKEN&ct=meta-reels-15&mt=8`
     (change `ct=` per ad: `meta-reels-15`, `meta-reels-map`, `meta-story-card`…; App
     Analytics then splits taps and downloads per ad).
   - Optimization **Link clicks** (landing-page views need a pixel; we have none).
   - Budget **$10/day**, one ad set, 7-day minimum before any judgement.
   - Audience **United States, 18+**, broad (18+ is mandatory: Meta's profanity rule can
     read "FCK"). Under SIEP, Advantage+ detailed-targeting expansion is unavailable;
     broad or interest targeting only. Interests worth one test later: indie games, pixel
     art, Nintendo Switch, OpenSecrets/ProPublica readers.
   - Placements **Manual: Instagram Reels, Instagram Stories, Facebook Reels, Facebook
     Stories** — 9:16 only, so no auto-crops of our videos.
   - CTA **Download**.
8. **Ads** — three in the one ad set (a real A/B at this budget; more splits the data):
   the 15 s explainer, the Map short, the Card short (table below). The scorecard still is
   NOT paid-safe as it stands (logo, "The fascists won't FCK themselves.", Musk's face —
   `siep-analysis.md` §4); a paid variant without the tagline and without CEO faces is a
   separate render if we want a still.
9. **Copy fields** (product-first — declared ads; the carve-out doesn't apply once R:/D:
   or "both parties" appear, see `siep-analysis.md` §1 — and the organic no-price rule does
   not apply to ads, so this is the one place $1.99 belongs):
   - Primary text A: `FCK, Financial Contribution Kit · $1.99 · See where the money goes. It's all on file.`
     (no party words in copy, matching every other marketing asset; the record footage shows
     the app's own R:/D: totals, which is fine in a declared ad)
   - Primary text B: `Tap a business. Scan a barcode. Track what you skip. Your scorecard drops every week. $1.99, no accounts, no tracking.`
   - Headline: `Financial contributions, on file.` · Description: `FCKapp.com`
   - No hashtags in ads. Never "boycott", never a party word, never "dark money".
10. **Launch, then leave it.** Day 7 check only: link CTR ≥ 0.5% and CPC $0.40–1.80 are
    respectable; App Store Connect → Analytics → Acquisition → Campaigns shows taps and
    downloads per `ct` (downloads = $1.99 sales; expect few — the campaign's job is reach,
    learning which creative pulls, and followers as a by-product). Kill or keep per ad;
    winners get the budget.
11. **Calendar:** no new ads or edits Oct 27 – Nov 3. If the first flight is live by
    Oct 20, it keeps running through the freeze.

## Assets: what to use, where (all 1080×1920, H.264, 30 fps — already on the server)

| Ad | File | Length | Placement | Why | Status |
|---|---|---|---|---|---|
| Lead | `fck-explainer-15-9x16.mp4` | 15.1 s | Reels + Stories | Whole story in the length Meta recommends for Reels; slam open, "Random drop", end card | ready |
| Feature | `fck-short-map-9x16.mp4` | 14.1 s | Reels + Stories | Cold open on the record + AVOIDED stamp — the clearest "what it does" in 1.5 s | ready |
| Payoff | `fck-short-card-9x16.mp4` | 14.1 s | Reels + Stories | The shareable outcome; money rain in frame 1 | ready |
| Still | scorecard, paid variant | — | Stories | Native card, cheapest impression | needs a paid-safe render: no tagline, no CEO faces (`siep-analysis.md` §4) |
| Later | `fck-short-track`, `fck-short-scan` | 14.4 / 10.9 s | Reels | Second flight after the first 7 days say which angle pulls | ready |
| Not for paid | 60 vertical, 60 wide, 30 | 30–62 s | — | Completion falls off past ~15 s in paid; the 60s are the landing content on fckfascists.com and YouTube, the 30 is organic | — |

Local masters: `/Users/christophershannon/fuckfascists/marketing/video/renders/`; served at
`https://fckfascists.com/video/<file>` (Ads Manager wants the file uploaded, not a URL).

**Safe-zone caveat (the one production item).** Reels overlays the caption and CTA on the
bottom ~20% and the top ~14% of the frame. Our full-bleed layout puts Clark's dialogue box
at the bottom, so on Reels some lines will sit under Meta's UI. Stories' overlay is smaller
(the CTA bar), so the current files are fine there. Before the first Reels flight I'll
render ad-safe variants (`-ad` suffix) with the box lifted into the safe zone for the 15
and the two shorts — a layout tweak and a re-render, no new footage. Say "make the ad
variants" when you're ready to build the campaign.

**Formats we don't need to make:** 1:1 and 4:5 feed cuts. Manual placements keep us in
9:16; feed can come later if Reels/Stories prove out.

## What I own vs. what's yours

- Yours (logins, money, identity): steps 1–6, payment, the ID, pressing Publish.
- Mine: ad-safe renders, copy variants, campaign naming and `ct=` scheme, the day-7 read
  from the numbers you paste or screenshot, and the Ad Library check that the disclaimer
  shows correctly.
