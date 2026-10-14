# "What's new in 1.2" — video script (draft for the creator, Oct 14, 2026)

Two vertical cuts in the explainer pipeline (`marketing/video/remotion`): a **30** for IG/FB
Reels, TikTok and YouTube Shorts, and a **15** for Stories and the ad slot. Clark narrates
(data voice: helpful, zero editorial). Facts from `docs/releases/1.2.0.md` and
`docs/releases/1.2.1.md` (release/1.2.1, Oct 14). Rules applied: no price, no party words,
no "iPhone", the scorecard line is "Random drop between Friday and Saturday." verbatim, end
card OUT NOW with no price. Status: **draft — needs the creator's read before it goes into
the storyboard and `script.json`.**

Cold opens, as on the shorts since Oct 6: the payoff in frame 1, CRT blink, title card.

## The 30 — "NEW FILES" (≈30 s)

| # | Beat | On screen | Clark says | ≈s |
|---|---|---|---|---|
| C | Cold open | Track screen; the iOS banner drops in: **Case of the Mondays?** / Known cure: log an avoid. Side effects include feeling great. | — | 1.5 |
| T | Title | **1.2 · NEW FILES** | — | 0.6 |
| 02 | Files | Map pins (reuse `60_03_map_pins`) or Info → THE DATA scroll | Fresh files. Every record refreshed. 761 companies on file. | 3.0 |
| 03 | Household | Search "Windex" → SC Johnson card (by name — never the scanner, see honesty notes) | Now on file: the stuff under your sink. Windex. Ziploc. Post-its. Reynolds Wrap. | 4.0 |
| 04 | Owners | Search "Ben & Jerry's" → The Magnum Ice Cream Company card | Brands follow their owners. Ben & Jerry's? Filed under Magnum now. | 3.2 |
| 05 | Scan | Phone: 20 oz Sprite, short barcode locks fast → Coca-Cola record | Small bottle, short barcode. I read those now. And I focus closer. | 3.7 |
| 06 | Faces | Scorecard live preview: new sprites (Furner, Laguarta, Van de Put…) plus one red X | Forty-nine new faces on the card. Still no sprite? Red X. | 3.5 |
| 07 | Nudge | Map screen; banner: **It's Taco Tuesday 🌮** / Tacos: mandatory. Where you get them: your call. Tap → the Map opens. | I check in Monday or Tuesday. Tacos: mandatory. Where you get them: your call. | 4.2 |
| 08 | Drop | The drop (reuse `60_12_drop`: gold reveal, money rain) | Random drop between Friday and Saturday. | 2.2 |
| 09 | Outro | End card: UPDATE OUT NOW · NO ADS · NO TRACKING · FCKapp.com · @fckfascists.app | The update's out. Your move. 🤘🏽 | 4.3 |

Seconds use the 30-cut formula (0.25 s/word + 0.7, min 2.2); the outro adds the horns
(0.6) and the hold (1.5). Total ≈ 30 s before CRT transitions.

## The 15 — Stories / ad slot (≈16 s)

| # | Beat | On screen | Clark says | ≈s |
|---|---|---|---|---|
| C | Cold open | The new card, money rain from frame 0 (new faces visible) | — | 1.5 |
| 02 | Files | Map pins | Fresh files. 761 companies. | 2.3 |
| 03 | Household | Windex → SC Johnson card | Windex. Post-its. On file. | 2.3 |
| 04 | Faces | Scorecard preview, new sprites + red X | Forty-nine new faces. | 2.2 |
| 05 | Nudge | Banner: Case of the Mondays? | Case of the Mondays? I'll check in. | 3.3 |
| 06 | Outro | End card | Your move. 🤘🏽 | 4.3 |

15-cut formula (0.34 s/word + 0.9, min 2.2). No title card on the 15, as today.

## Lines on the bench (swap in if a beat reads flat)

- Faces, longer: "Forty-nine new faces. Nobody gets an empty slot — no sprite yet, red X."
- Owners, alt: "Ben & Jerry's sold. The file moved with it."
- Scan, alt: "Short barcode on a small can? Locks now. Closer, faster."
- Files, with people: "761 companies. 1,097 donors and executives. Every record refreshed."
- CEOs (1.2.0 fact, not in either cut): "Who runs the place, updated at 180 companies."
- Track (1.1 feature, new to store users; footage exists in `R5_track_roster`): "Track Cursor, Google Workspace, Microsoft 365."
- Nudge, Clark-only: "I check in Monday or Tuesday. Tap, and I open the right tab."

## Honesty notes (what the footage may and may not show)

- **Household brands by name only.** Windex, Clorox and the rest mostly return no match by
  barcode until the 1.2.2 prefix work ships. Beat 03 is a Map search, never the scanner.
- **"I focus closer"** is the 1.2.1 close-focus change on Pro and dual-wide iPhones (owner
  confirmed on device Oct 14). Beat 05 must be recorded on the phone with build 13.
- **"761 companies"** holds on release/1.2.1 (counted in `assets/data/entities.json` there,
  Oct 14; the Oct 12 refresh changed records, not the roster). Re-count if 1.2.2 lands first.
- **Red X** appears on the scorecard (shared card and live preview), not on the business
  card. Every household entity from the 1.2.0 batch has no sprite (SC Johnson, 3M,
  Reynolds, Magnum, McCormick, Clorox), so avoiding SC Johnson after the Windex search
  puts H. Fisk Johnson on the card as a red X — beats 03 and 06 come from one take.
- **New faces on the card:** the 49 include John Furner (Walmart), Michael Fiddelke
  (Target), Ramon Laguarta (PepsiCo), Dirk Van de Put (Mondelez — also the "full surnames"
  fix: the card reads Van de Put), Shailesh Jejurikar (P&G). Avoid two or three of those in
  the capture so the preview shows new art next to the X.
- **The nudge** is real: Monday or Tuesday, 10am–6pm local, eight owner-written lines, tap
  opens the Map or Track. The banner in the video is composited (same iOS banner the drop
  beat uses), so the title and body are typed in exactly from `copy/platforms.ts`.
- Nothing on Android, nothing on household barcodes, no count of sprites beyond "forty-nine".

## Shot list — captures on build 13 (TestFlight), production tab bar

Build 13 replaces 12 for submission (barcode-attribution fix in progress, release session,
Oct 14). Record N1 on 13 so the scan result is the shipped one; N2–N4 are fine on either.

Same conventions as `marketing/video/captures/CAPTURES.md`: slow, deliberate taps; hold
two seconds on every end state; one feature per clip. Phone recordings crop the real
status bar in the edit, as R6 did.

| Clip | Where | Steps | Feeds |
|---|---|---|---|
| `N1_scan_sprite-20oz` | phone, build 13 | Scan tab → OPEN SCANNER → a 20 oz Sprite (or any small can with the short 8-digit barcode) from close → lock → Coca-Cola record → AVOID → hold | 30 beat 05 |
| `N2_map_search-windex-scjohnson` | phone or simulator | Map → search "Windex" → SC Johnson card → AVOID → dismiss; then "Post-it" → 3M card (dismiss); "Reynolds Wrap" → Reynolds card (dismiss) | 30 beat 03, 15 beat 03 |
| `N3_map_search-benjerrys-magnum` | phone or simulator | Map → search "Ben & Jerry's" → The Magnum Ice Cream Company card → hold; optional "French's" → McCormick | 30 beat 04 |
| `N4_scorecard_new-faces-red-x` | phone or simulator | Avoid Walmart (search), Target (search), PepsiCo (scan a Pepsi or Lay's) and Mondelez (scan an Oreo), plus SC Johnson from N2 → Scorecard tab → live preview shows Furner, Fiddelke, Laguarta, Van de Put and the red X → dev Generate → reveal + rain → card | 30 beat 06, 15 cold open + beat 04 |
| `N5` nudge | none | Composited in Remotion over the Track screen (cold open) and the Map (beat 07). If a real Monday/Tuesday banner gets screen-recorded on the phone, it replaces the composite. | 30 C + 07, 15 beat 05 |
| reuse | existing | `60_03_map_pins` (files), `60_12_drop` (drop), Track grid from R5 if the Track line comes in | 30 beats 02, 08 |

N4 note: the drop flow is the dev "Generate Card Now" control on a Debug build (as R8) or
the real Friday–Saturday drop on the phone; either is fine, the card is real either way.

## Pipeline (mine, once the lines are approved)

- `script.json`: new cuts `new30` and `new15` (block below) → storyboard db → `sync-script`.
- `timing.ts`: add both to `Cut`; formulas copy the 30/15; `COLD_OPEN_S` 1.5; `HOOK_S` 0;
  `TITLE_S` 0.6 / 0 with a fixed "1.2 · NEW FILES" title card (not per-feature titles).
- `clips.ts`: `CLIPS['new30-02'…]`, `COLD_OPEN.new30` (nudge composite), `COLD_OPEN.new15`
  (card + rain); the banner overlay takes title/body props (today it is the drop banner).
- `OutroPanel.tsx`: end-card tagline "UPDATE OUT NOW" for these cuts; sub unchanged, no price.
- `Root.tsx` + `render.sh`: `New30`, `New15` compositions and targets; `prep-clips.sh` for
  N1–N4; framecheck on every output as usual.
- Social: hand the social lead both files plus the core set `#MoneyInPolitics #IndieGames
  #FCKapp` and the ask "tag @fckfascists.app + #FCKapp"; no price in the captions.

## `script.json` block (paste under `cuts` once approved)

```json
"new30": [
  { "panel": "02", "title": "FILES", "kind": "feature", "feature": "MAP",
    "lines": [{ "id": "cnew30-02-1", "text": "Fresh files. Every record refreshed. 761 companies on file." }] },
  { "panel": "03", "title": "HOUSEHOLD", "kind": "feature", "feature": "MAP",
    "lines": [{ "id": "cnew30-03-1", "text": "Now on file: the stuff under your sink. Windex. Ziploc. Post-its. Reynolds Wrap." }] },
  { "panel": "04", "title": "OWNERS", "kind": "feature", "feature": "MAP",
    "lines": [{ "id": "cnew30-04-1", "text": "Brands follow their owners. Ben & Jerry's? Filed under Magnum now." }] },
  { "panel": "05", "title": "SCAN", "kind": "feature", "feature": "SCAN",
    "lines": [{ "id": "cnew30-05-1", "text": "Small bottle, short barcode. I read those now. And I focus closer." }] },
  { "panel": "06", "title": "FACES", "kind": "feature", "feature": "SCORECARD",
    "lines": [{ "id": "cnew30-06-1", "text": "Forty-nine new faces on the card. Still no sprite? Red X." }] },
  { "panel": "07", "title": "NUDGE", "kind": "feature", "feature": "TRACK",
    "lines": [{ "id": "cnew30-07-1", "text": "I check in Monday or Tuesday. Tacos: mandatory. Where you get them: your call." }] },
  { "panel": "08", "title": "THE DROP", "kind": "drop",
    "lines": [{ "id": "cnew30-08-1", "text": "Random drop between Friday and Saturday." }] },
  { "panel": "09", "title": "OUTRO", "kind": "outro",
    "lines": [{ "id": "cnew30-09-1", "text": "The update's out. Your move.", "horns": true }] }
],
"new15": [
  { "panel": "02", "title": "FILES", "kind": "feature", "feature": "MAP",
    "lines": [{ "id": "cnew15-02-1", "text": "Fresh files. 761 companies." }] },
  { "panel": "03", "title": "HOUSEHOLD", "kind": "feature", "feature": "MAP",
    "lines": [{ "id": "cnew15-03-1", "text": "Windex. Post-its. On file." }] },
  { "panel": "04", "title": "FACES", "kind": "feature", "feature": "SCORECARD",
    "lines": [{ "id": "cnew15-04-1", "text": "Forty-nine new faces." }] },
  { "panel": "05", "title": "NUDGE", "kind": "feature", "feature": "TRACK",
    "lines": [{ "id": "cnew15-05-1", "text": "Case of the Mondays? I'll check in." }] },
  { "panel": "06", "title": "OUTRO", "kind": "outro",
    "lines": [{ "id": "cnew15-06-1", "text": "Your move.", "horns": true }] }
]
```
