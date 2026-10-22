# Free until Election Day — campaign plan (proposed Oct 22, 2026)

Owner decision (Oct 21): the app is free on the App Store through Election Day, Tue Nov 3, 2026,
and returns to $1.99 on Nov 4 (ASC price schedule set and read back by the dev lead). Promo text
option B is live on the listing. This plan covers the press release, the site, organic social,
promo video and the 1.2.1 release content. Nothing here spends money.

## Rules for every piece
- Positioning: a game and a records tool. No party words, no "boycott", no candidate or party
  endorsement. "FCK doesn't endorse candidates or parties. It shows contributions on every side."
- "Free" may be said in this window (the owner asked for it). $1.99 is never mentioned in organic
  copy or on video end cards. After Nov 4 all free copy comes down.
- Scorecard line stays "Random drop between Friday and Saturday." or "this weekend". No drop hours
  in public until 1.2.1 is live.
- Tags: #MoneyInPolitics #IndieGames #FCKapp; the ask is @fckfascists.app + #FCKapp.
- Election pause (owner to confirm): no organic posts Nov 2–4, no election tags Oct 31–Nov 4.
  So the posting window is Oct 22 → Nov 1.

## Assets
| # | Asset | Owner | Status |
|---|---|---|---|
| 1 | Press release (markdown) `marketing/press/2026-10-22-free-until-election-day.md` | marketing | drafted, needs the owner's OK (quote attributed to him) |
| 2 | Standalone page `site/free.html` → https://fckfascists.com/free | marketing | built, not uploaded until the text is approved |
| 3 | Homepage line: hero pitch gains "Free until Election Day." and the App Store button's top label reads FREE UNTIL NOV 3 | marketing | proposed, do with #2 |
| 4 | 15 s "FREE UNTIL ELECTION DAY" kinetic cut, 9:16 (logo slam → FREE slam → tap/scan/track → see where the money goes → tagline), own 14.6 s bed (`compose.py --style free`), money on the slams | marketing | rendered Oct 22: `marketing/video/renders/fck-free-election-15-9x16.mp4` (`src/release/Free15.tsx`) |
| 5 | Stills: feed 1080×1440 (3:4, per social) + story 1080×1920 in three variants (free / last weekend / last days): Clark + headline + THROUGH NOV 3 + the three verbs, starfield | marketing | rendered Oct 22: `marketing/social/free-window/` (`src/promo/FreeStill.tsx`, Stills `FreeFeed-*` / `FreeStory-*`) |
| 6 | Social copy set (announce, Reel caption, story text, Bluesky, YouTube) `marketing/notes/free-window-social.md` | marketing drafts, social manager finalises and schedules | social's final captions + slots in their POSTS.md (Oct 22); their edits: no "nothing leaves your phone", no "zero dollars", "through Nov 3" on every post, #Election2026 on A/B/E only |
| 7 | App Store promo text B | dev lead | live |
| 8 | 1.2.1 release video: a dated variant with a 2-bar "FREE UNTIL ELECTION DAY" insert after the hook, for the window only; evergreen cut unchanged | marketing | proposed, renders once 1.2.1 is approved |
| 9 | Earned media: the owner sends the release to his own list; price-drop trackers pick up the free change on their own | owner | from Oct 22 |

## Cadence (organic, social manager runs it)
- Thu Oct 22/23 — Announce: press page link + static tile (IG feed + story, Bluesky). Caption A.
- Sat Oct 24 — Scorecard drop day: the throwback series continues; story reminder "free this week".
- Sun Oct 25 — Reel/Short: the 15 s free cut (IG, YouTube Shorts, Bluesky video).
- Tue Oct 27 / Thu Oct 29 — Throwback scorecards as scheduled, caption carries one line: "Free until Election Day. Link in bio."
- Fri Oct 30 — Story: "Last weekend free" with the scorecard drop tease.
- Sun Nov 1 — Final push: feed post + story, "Last two days free." Then the pause.
- Nov 5 — Resume with the 1.2.1 release video if live (no free copy).
- Paid: none. If the owner wants one small boost on the announce post, that is his call and budget.

## What I need
- Owner: approve the press release text and the quote; say go on uploading /free and the homepage
  line; confirm the election pause; say whether a small boost is wanted (default no).
- Social manager: confirm slots for the cadence above, return the final captions, tell me if a
  square/4:5 cut of the video is needed for any slot.
- Dev lead: nothing on the listing; a heads-up when 1.2.1 is approved so the release video goes
  out, and a read-back that the App Store shows the app as free.

## Status, Oct 22 (afternoon)
- Store shows the app as Free (Apple lookup, 8:33am ET); 1.2.1 build 14 still Waiting for Review.
- Rendered: the 15 s cut and the six stills (table above). Social has the paths and stages wave 1 for the owner's approval.
- Social's wave 1: Fri Oct 23 noon IG feed (A) + 12:30 story (C) + 1pm Bluesky (D); Sat Oct 24 11am story; Sun Oct 25 noon Reel (B), 1pm Short (E), 7:30pm Bluesky video. Wave 2 scheduled Mon Oct 26.
- Open with the owner: press text + quote (then upload /free and the homepage line); the Nov 2–4 pause; Oct 27/29 content (a new card from his phone, or social's recap carousel of the four throwbacks); Nov 4 takedown from his phone (archive A, B, G on IG; unlist or edit the YT Short; reset the bio link if it pointed at /free).

## Status, Oct 22 (evening): social went video-only (owner)
- The 3:4 stills are retired. Rendered instead: three 7 s motion versions (`src/promo/FreeMotion.tsx`, `marketing/social/free-window/motion/free-motion-{free,weekend,lastdays}-9x16.mp4`) and the scorecard drop template (`src/promo/CardDrop.tsx`, any card JPG in `marketing/video/scorecards/` → `marketing/social/scorecards/card-drop-*.mp4`, props: card, free, hook1, hook2, freeLead). Music: `fck_bed_free_7s.mp3` and `_12s.mp3` (score_free.py arrangements).
- Card plan: July 4 card video = Sat Oct 24 drop post (hook INDEPENDENCE DAY. → ELECTION DAY., free-led end card); July 11 = Tue Oct 27; the owner's new card after Saturday's drop. His Oct 3 and Oct 10 cards are gone (known pre-build-14 bug: a drop not opened within 48 h lost the week; build 14 fixes it).
