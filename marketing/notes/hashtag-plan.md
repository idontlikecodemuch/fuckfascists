# Hashtag plan — @fckfascists.app (Instagram first, Bluesky second)

Research date: 2026-10-01. Research only; nothing was posted. Numbers are from
public pages and third-party indexes; each is dated and sourced, and anything
that could not be checked says "unverified".

## Principle

Hashtags are classification metadata and search handles, not reach. Instagram
says so itself (below), and our positioning says the rest: FCK is a game that
shows public FEC records and lets the user decide. So every tag has to do one
of three jobs — say what the thing *looks like* (pixel art), say what the data
*is* (campaign finance, political donations), or make our own cards
*findable* (a branded tag) — without telling anyone what to think or do. No
directives ("vote", "boycott"), no accusations ("dark money", "follow the
money"), no party words. The topic lives in the caption in plain English, where
Instagram keyword search and Google can read it; the tags only confirm it.

## What the platforms say (verified)

- **Cap is 5 per post, caption or comments combined.** Instagram Help:
  "You can add hashtags in the caption or comments… You can use up to 5 tags on
  a post. If you include more than 5… your comment won't post."
  (https://help.instagram.com/351460621611097). Announced via @creators
  2025-12-18; Instagram: "fewer (up to 5) more targeted hashtags, rather than
  many generic ones" (https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/).
  So: Buffer's missing first-comment is irrelevant — all tags go in the caption,
  last line.
- **Tags don't drive reach.** Mosseri, Feb 2025: hashtags "don't work" for
  reach; they tell Instagram "what a post is about" (same SMT piece;
  https://blog.hootsuite.com/social-media-updates/instagram/hashtags-dont-affect-reach/).
  Following hashtags was removed 2024-12-13
  (https://hellosocialco.com/2024/11/22/instagram-removes-option-to-follow-hashtags-what-does-this-mean-for-place-based-brands/).
  Hashtag-page order = recency, engagement, Recommendation Guidelines
  (https://help.instagram.com/777754038986618/).
- **Correlation to watch:** Metricool's 2026 study (24.4M posts, 375K accounts,
  Jan–Feb 2025 vs Jan–Feb 2026): posts with ≥1 hashtag saw 31.70% fewer views and
  33.89% fewer interactions than average
  (https://metricool.com/press-release-instagram-study-2026/). Not causal, but a
  reason to keep sets small and never let tags replace caption keywords.
- **Keywords matter more.** Public posts from professional accounts have been
  Google/Bing-indexed since 2025-07-10 (default on)
  (https://ppc.land/instagram-content-becomes-searchable-on-google-starting-july-10/).
  "FEC.gov", "political contributions", "campaign finance" belong in caption
  text, not only in tags.
- **Political-content control** defaults to "standard" since Jan 2025 (Meta
  called the 2024 limit "pretty blunt";
  https://techcrunch.com/2025/01/07/meta-to-phase-back-in-political-content-on-facebook-instagram-and-threads).
  Users who pick "less" still won't be recommended posts the classifier calls
  political; partisan-cluster tags feed that classifier.
- **Meta ads (SIEP).** An ad counts as social-issue/political if it is about a
  candidate, an election, a listed social issue ("political values and
  governance" is one), or is regulated as political advertising
  (https://transparency.meta.com/policies/ad-standards/SIEP-advertising/SIEP/).
  Carve-out: if a product is prominently shown, the primary purpose is to sell
  it, and there is a purchase CTA, authorization may not be required — but
  "each ad is subject to review"
  (https://www.facebook.com/business/help/287622936276216;
  https://www.socialmediatoday.com/news/facebook-eases-social-issues-ads-policy-to-allow-product-focused-ads-to-run/610382/).
  A boosted post should read as an app ad ($1.99, Get the app) with no
  advocacy tags; see the risk column.

## Candidates

Sources: **BH** = best-hashtags.com Instagram index, "posts using this hashtag"
+ page update date (small political tags were last refreshed late 2024, so
treat as order-of-magnitude). **BSKY** = Bluesky public search API
(`api.bsky.app searchPosts`, latest 100, measured 2026-10-01) as a live
activity/who-uses-it check. **DP** = displaypurposes.com (undated snapshot).
"Cluster" = the co-occurring tags BH lists, i.e. who actually dominates the tag.

| Tag | Traction | Who uses it | Fit | SIEP risk | Verdict | Why |
|---|---|---|---|---|---|---|
| #FECData | BH: not indexed (no data). BSKY: 0 posts, ever. | Nobody — not OpenSecrets, GUU, RepresentUs | 2 | none | **avoid** | Dead tag; means nothing to a non-wonk. Creator was right. |
| #CampaignFinance | BH 3,020 (2024-10-24, 0/hr). BSKY 3.1/day, 40 authors | Reform/anti-corruption cluster (#getmoneyout #endcitizensunited #corruption); Indivisible chapters, local-gov data accounts | 5 | low–med | **core** | The neutral legal term for exactly our data. Small, but accurate beats big. Strip from boosts (reviewer skim). |
| #MoneyInPolitics | BH 2,175 (2024-11-09). BSKY 0.7/day | Same reform cluster; OpenSecrets' own bio phrase; anti-Musk posts on BSKY | 4 | med | rotate (organic only) | Movement framing ("get money out"). Fine on organic data posts; never on boosts. |
| #PoliticalDonations | BH: not indexed (tiny). BSKY 0.4/day | Mixed news/cartoonists | 5 | none | rotate | Plain-English descriptor people type; zero stance. Use on Map/Scan. |
| #VoteWithYourWallet | BH 20,484 (2024-10-24). BSKY 0.7/day, 28 authors | IG cluster is zero-waste/plastic eco; in our niche GUU pairs it with #boycott and politician-stance posts; BSKY = boycott calls (Trump, Israel, Spotify) | 2 | med–high | **avoid** | An imperative. "Boycott" is not our word (voice doc); "avoid" is, and the user decides. No reach upside to pay the stance cost. |
| #ShopYourValues | BH 7,986 (2024-11-04). BSKY 0.2/day | #australianmade #shopsmall #sustainablefashion | 2 | low | avoid | Tiny and the wrong room (Aussie-made fashion). |
| #ConsciousConsumer | BH 787,947 (2024-10-15, 9/hr). BSKY 0.2/day | Sustainable/slow fashion, zero waste | 2 | low | avoid | Big but off-intent; our card in an eco-fashion stream reads as a political intrusion. |
| #EthicalConsumer | BH 89,277 (2024-10-24) | UK/AU ethical fashion, social enterprise | 2 | low | avoid | Same as above, smaller. |
| #FollowTheMoney | BH 96,049 (2024-10-19). BSKY 10.5/day | IG: Dutch TV show *Wie is de Mol?* + dividend investing; BSKY: accusatory politics (Epstein, Trump) | 1 | med | avoid | Hijacked on IG, accusatory elsewhere. |
| #DarkMoney | BH 0 (2024-11-15; likely unindexed). BSKY 2.3/day | Progressive activism (#CitizensUnited) | 1 | high | **never** | Factually wrong for us: FEC filings are *disclosed* money. Pure advocacy frame. |
| #CorporateAccountability | BH 869 (2024-11-08). BSKY 0.8/day | Labor/climate activism (#peopleoverprofit #unionstrong) | 2 | med–high | avoid | Activism cluster, no reach. |
| #PixelArt | BH 5,197,828 (2025-11-16, 59/hr); DP 2,199,907 (stale). BSKY ~420/day | Artists, perler/hama beads, #gamedev | 5 | none | **core** | Says what the content looks like. Mega-tag, so no reach, but it is the classification signal that matches every screenshot and card. |
| #8bit | BH 1,502,917 (2025-10-01, 17/hr). BSKY 61/day but 13 authors (bots) | #nintendo #nes #retrogaming #perlerbeads | 4 | none | rotate | Our own word for the look. Use on Track/scorecard where the arena and sprites lead. Skip on Bluesky (bot feed). |
| #RetroGaming | BH 6,122,197 (2025-11-09, 70/hr). BSKY ~290/day | Console collectors, #playstation #sega | 2 | none | avoid | We're not a retro game; collectors won't convert, and it's a mega-tag anyway. |
| #IndieGame | BH 1,959,919 (2026-01-03, 22/hr). BSKY ~800/day | Developers (#unity #gamedev), some players | 4 | none | rotate | "It's a game" is the positioning. Dev-heavy, but that's also the indie-game-fan room. Track + scorecard posts. |
| #IndieDev | BH 880,837 (2025-12-07). BSKY ~1,200/day | Solo devs, build logs | 4 | none | rotate | Behind-the-scenes only; triggers Bluesky's Indie Devs & Games feed. |
| #iOSApp | BH 193,466 (2024-10-14, 2/hr). BSKY 1.2/day | Dev shops/agencies, #appdevelopment | 3 | none | rotate | Literal category; agency-dominated so low lift. One slot on Map/Scan/update posts, and the safest tag on a boost. Flighty (20K) uses none — don't expect installs from it. |
| #AppStore | BH 1,371,227 (2025-12-28). BSKY 25/day, spammy | #googleplay #mobilegames generic | 2 | none | avoid | Generic, drowned. |
| #NewApp | BH 383,749 (2024-10-14). BSKY 0.3/day | #downloadnow #applaunch spam | 1 | none | avoid | Launch-spam cluster. |
| #PrivacyFirst | BH 2,493 (2024-10-24). BSKY 1.5/day | #cybersecurity #gdpr (B2B) | 4 | none | rotate | Tiny, but it is literally our promise. Privacy/update posts only. |
| #OpenSource | BH 302,175 (2026-09-04, 3/hr); DP 221,579. BSKY ~380/day | Linux/dev community, GitHub | 4 | none | rotate | Matches "public, reviewable source code". Posts that mention the repo. |
| #OpenData | BH 34,381 (2024-10-23). BSKY 15/day, legit (gov open-data orgs) | IG: fintech/Brazil noise; BSKY: real open-data community | 3 | none | rotate (Bluesky) | Right idea ("public records"), wrong IG crowd. Use on Bluesky. |
| #CivicTech | BH 10,992 (2024-10-24); IG cluster is #hondacivic. BSKY 4.4/day, legit (Civic Forecast, Civilian) | Cars on IG; civic-data orgs on BSKY | 3 | none | Bluesky only | Hijacked by Honda Civic on Instagram. |
| #Scorecard | BH 30,936 (2024-10-21). BSKY 0.1/day (LCV voting scorecards) | Cricket (#viratkohli) on IG; legislative scorecards on BSKY | 1 | low | avoid | Cricket on IG, politics on BSKY. Neither is us. |
| #FEC | BH 116,820 (2024-10-26) | Fortaleza EC (Brazilian football) | 1 | none | never | #fortaleza #tricolor. Not the agency. |
| #FCK | BH 292,546 (2024-10-13) | 1. FC Kaiserslautern | 1 | none | never | German football. |
| #FCKFascists | BH: not indexed. BSKY: 18 posts by other people, used as a slogan | Activists, merch | 3 | high | avoid as a tag | The brand name is in the handle and caption already; as a tag it pools us with slogan posts and hands a reviewer the word. Also unverified whether IG hides it. |
| #FCKapp | BH: none. BSKY: 0 posts | Nobody yet — ownable | 5 | none | **core (branded)** | Matches FCKapp.com and the store name. The aggregator for user-posted cards ("tag @fckfascists.app" + #FCKapp). Check it's searchable after the first posts. |
| #Politics / #Boycott / #AntiFascist | BH 13.7M / 324K / 333K | #trump #maga #democrat / boycott campaigns / activism | 1 | high | never | Instant partisan classification; "boycott" is banned by the voice doc. |

## What adjacent accounts actually do (Instagram, checked logged-out 2026-10-01)

- **Goods Unite Us** (13.8K, our closest comparable): `#GoodsUniteUs #VoteWithYourWallet #CorporatePolitics` on nearly every post, sometimes `#politics #vote #boycott`; 1–16 likes per post (https://www.instagram.com/goodsuniteus/, e.g. https://www.instagram.com/p/DdR8FZqlM-2/). Their posts are politician/issue stances — the room #VoteWithYourWallet keeps in our niche.
- **OpenSecrets** (20.8K): no hashtags at all; 2–16 likes (https://www.instagram.com/opensecretsdc/, https://www.instagram.com/p/DdpHfwylMPT/).
- **RepresentUs** (126K): first-comment activism tags `#AntiCorruption #TrumpJr #WethePeople`, `#ClarityAct #Congress #Corruption #Activism` (https://www.instagram.com/p/Ddt2EiOF-de/). Not our lane.
- **Good On You** (247K, "shop your values" for fashion): exactly five topic tags in caption, e.g. `#Sustainability #SustainableFashion` — no #ShopYourValues, no #ConsciousConsumer (https://www.instagram.com/p/Ddv_D26F5Pe/).
- **Devolver Digital** (108K, indie publisher): 4 tags — game name + `#devolverdigital` (https://www.instagram.com/p/Dd2md-Rmsmm/). Branded tag + product tag is the indie norm.
- **Flighty** (20.3K, award-winning indie iOS app): no hashtags (https://www.instagram.com/p/DWjZRdKjkR0/).
- Small pixel-art studios (@orangepixelgames 1.5K, @rastrolabs 2K): no or irregular tags.

Read: the data accounts don't tag, the activism accounts tag like activists, the
indie/game accounts use a branded tag plus 2–3 topic tags. We copy the indie
pattern and stay out of the activism cluster.

## The plan

Caption placement, last line, after a blank line. Max 5. Never more.

**CORE — on every post (3):**
`#PixelArt #CampaignFinance #FCKapp`

**ROTATE — add up to 2 by post type (exact strings):**

| Post type | Caption-ready tags (5 max) |
|---|---|
| MAP (Clark) | `#PixelArt #CampaignFinance #FCKapp #PoliticalDonations #iOSApp` |
| SCAN (Clark) | `#PixelArt #CampaignFinance #FCKapp #PoliticalDonations #iOSApp` |
| TRACK (Clark → game) | `#PixelArt #CampaignFinance #FCKapp #IndieGame #8bit` |
| SCORECARD drop (Sh*tposter, Fri/Sat) | `#PixelArt #CampaignFinance #FCKapp #8bit` — 4 on purpose; the card is the trophy, not a data post |
| Behind-the-scenes pixel art / dev | `#PixelArt #FCKapp #IndieDev #OpenSource` — see the AI note below |
| App update (Clark, corporate neutral) | `#PixelArt #CampaignFinance #FCKapp #iOSApp #PrivacyFirst` (swap #PrivacyFirst → #OpenSource when the post mentions the repo) |
| Any post you intend to BOOST | `#PixelArt #FCKapp #iOSApp` — no topic tags; caption stays product-first with the $1.99 / Get the app CTA so it fits Meta's product-sale carve-out |
| Organic "data explainer" (R: and D:, how FEC filings work) | `#PixelArt #CampaignFinance #FCKapp #MoneyInPolitics #OpenData` — organic only |

**NEVER (with reason):** #FECData (dead), #VoteWithYourWallet (directive; boycott
cluster), #Boycott (not our word), #DarkMoney (wrong and advocacy), #FollowTheMoney
(hijacked, accusatory), #FEC and #FCK (football clubs), #Scorecard (cricket),
#CivicTech on IG (Honda Civic), #Politics/#AntiFascist (partisan classifier
bait), #ConsciousConsumer/#EthicalConsumer/#ShopYourValues (eco-fashion rooms),
#RetroGaming/#AppStore/#NewApp (mega or spam), #PixelArtist (artist identity tag).

**AI-art note (real risk, not a tag question):** the sprite pipeline is
Gemini/GPT image generation (`tools/img-gen/`). Pixel-art communities police
this hard, and the main Bluesky feeds exclude AI content outright ("No AI" —
Indie Devs & Games; "Excluding NFT/AI" — Indie Pixel Games). Don't post
behind-the-scenes "how we draw the sprites" content into #PixelArt/#PixelArtist
rooms as if hand-drawn; show the app, not the brush. #PixelArt on finished
screenshots/cards is a description of the product and is fine.

## Verdicts the creator asked for

**#FECData — drop.** Not in any Instagram index (best-hashtags returns "no
data"), zero posts on Bluesky in its history, and none of OpenSecrets, Goods
Unite Us or RepresentUs use it. "FEC" alone is a Brazilian football tag. It
only speaks to people who already know the acronym, and those people search
"campaign finance". Provenance belongs in the caption ("straight from
FEC.gov"), which Instagram keyword search and Google index; the tag adds nothing.

**#VoteWithYourWallet — drop, and the original instinct was right.** It is
small (~20K posts, 2024 index), its Instagram neighbours are zero-waste/plastic
posts (apolitical, but not our room), and in our exact niche it is Goods Unite
Us's tag on politician-stance posts paired with #boycott; on Bluesky it is
boycott calls. It is an imperative. The voice framework bans "boycott" and
prescriptive framing — "avoid" is the verb and the user decides. Swapping it
for #FECData fixed the stance and broke the meaning; #CampaignFinance (core) +
#PoliticalDonations (rotate) fix both.

## SIEP / partisan pass (for boosts)

- Safe on a boost: #PixelArt, #FCKapp, #iOSApp, #8bit, #IndieGame, #IndieDev,
  #OpenSource, #PrivacyFirst. Nothing a reviewer can read as advocacy.
- Keep off boosts: #CampaignFinance, #PoliticalDonations, #MoneyInPolitics,
  #OpenData. Descriptive, but they name the "political values and governance"
  category; the product carve-out should cover an app ad, yet "each ad is
  subject to review" and these are the words a reviewer scans for.
- Never, boost or organic: #VoteWithYourWallet, #DarkMoney, #FollowTheMoney,
  #CorporateAccountability, #Boycott, #Politics, #AntiFascist, #FCKFascists.
- The brand name itself ("FCK FASCISTS" in the handle/caption) may trigger
  review on a boost regardless of tags. If a boost is rejected, the fix is the
  caption and creative, not the tag list; re-run with the App Store name
  ("FCK, Financial Contribution Kit") in the first line.

## Bluesky

Hashtags there are live search links and **feed triggers**; there is no cap
and no ad review. Custom feeds are the discovery mechanism (no hashtag
following; https://useagentsky.com/blog/how-to-use-hashtags-on-bluesky). Use
2–4 tags in the body, chosen to land in feeds (checked via the public feed
directory 2026-10-01):

- `#IndieGame #IndieDev` → "Indie Devs & Games" (965 likes; "Pure #IndieDev
  #IndieGame #SoloGameDev feed… No AI").
- `#pixel` + `#indiegame` → "Indie Pixel Games !" (193 likes; "#pixel &
  #indiegame/#indiedev/#gamedev, in post or ALT text, 7 days"). Put #pixel in
  alt text if the body is tight.
- `#pixelart` → Lospec's "Pixel Art" feed (uses #pixelart) and esdin.net's
  (401 likes, matches "pixel"/"8bit" in text and alt).
- The phrase "game dev"/"game art" (no hashtag needed) → trezy's "Game Dev"
  (9,272 likes; "Opt in with 'game', followed by… art, design, dev").
- `#OpenData` (15/day, real open-data orgs) and `#CivicTech` (4.4/day, Civic
  Forecast, Civilian) are legitimate on Bluesky — use them on data posts.
- `#CampaignFinance` works there too (3/day) but the room is Indivisible-heavy;
  fine organically.
- Skip `#8bit` on Bluesky (13 authors in the last 100 posts — bots) and the
  activism tags for the same reasons as Instagram.
- Bluesky search is full-text, so "FEC", "campaign finance", "pixel art" in
  the sentence do most of the work; tags are for feeds.

Bluesky set, caption-ready: `#IndieGame #IndieDev #pixelart #CampaignFinance`
(+ `#pixel` in alt text).

## How we'll know it's working (check after 2–3 weeks)

- In IG Insights per post: **non-follower share of views** and, if your app
  still shows it, **Views → From hashtags** (sources conflict on whether the
  per-source line survived the April 2025 Views change — check once). Compare
  the six post types above, not individual tags.
- Search `#FCKapp` on Instagram and Bluesky: do user-posted cards appear? If
  the tag page is empty after people have posted, the tag is being hidden —
  fall back to @mention-only and say so in the "tag us" line.
- Swap rules: if Map/Scan posts show no non-follower lift vs Track posts, drop
  `#iOSApp` to 4 tags (it was the weakest-evidence slot). If data-explainer
  posts draw partisan comment threads, pull `#MoneyInPolitics` and keep
  `#PoliticalDonations`. If Track posts pull dev-only engagement, test
  `#IndieGames` (BH 534K) in place of `#IndieGame` for two posts.
- Bluesky: open "Indie Devs & Games" and "Indie Pixel Games !" the day after
  posting; if the post isn't in them, the tags/alt text didn't fire.
- Re-check this file's small-tag counts against a logged-in hashtag page when
  the account has a session; the 2024 index numbers are the weakest data here.

## Local sources

- /Users/christophershannon/fuckfascists/docs/FCK_VOICE_FRAMEWORK.md — App Store listing (locked), voice rules, "don't use boycott".
- /Users/christophershannon/fuckfascists/marketing/ig/opening-grid.md — original set `#VoteWithYourWallet #MoneyInPolitics #CampaignFinance #PixelArt #iOSApp`.
- /Users/christophershannon/fuckfascists/.claude/worktrees/quizzical-hertz-94ee32/marketing/ig/explainer-reel/captions.md — current set `#FECData #MoneyInPolitics #CampaignFinance #PixelArt #iOSApp`.
- /Users/christophershannon/fuckfascists/.claude/worktrees/sharp-hypatia-fe36c4/marketing/notes/whats-new-1.2.0.md — what 1.2.0 does, in store voice.
