# FCK — Voice & Ethos Framework

**Version:** 2.3
**Date:** May 7, 2026
**Status:** Canonical reference for all copy, content, and communication across mobile app, browser extension, App Store listings, marketing, and social.

---

## What This Document Is

This is the voice framework for FCK — a privacy-first app that empowers users to see how businesses, products, and platforms fund politics, act on what they find, and share what they did. The app ships as a mobile app (iOS/Android), browser extension (Chrome/Firefox), and shared TypeScript core.

Every agent, writer, or contributor who touches user-facing copy should read this before writing anything.

Here's the short version: FCK has two voices. **Clark the Clerk** hands you the data — neutral, helpful, zero editorial. **The Sh\*tposter** is what happens after you act on it — "I FCK'd Zuckerberg 8×." If you only remember one thing from this doc: Clark earns the credibility. The Sh\*tposter spends it. Neither works without the other.

---

## The Product in One Sentence

FCK, your Financial Contribution Kit, empowers you with political spending information and makes what you choose to do about it worth sharing.

---

## Naming

### App Store Title

`FCK, FinancialContributionKit`

CamelCase visually shows where F, C, and K come from. The comma reads like a name and title on a business card. 29 characters — under both Apple and Google limits.

### App Store Subtitle

**Primary:** `Track political funding. FCK!` (30 chars)
**Alt:** `Track political spending. FCK!` (30 chars)

"FCK!" at the end works as both the acronym and the user's reaction to what they just found out.

### Google Play Listing Title

`FCK, Financial Contribution Kit`

Android's title field allows the longer spaced form (50-character limit on Play Store). Same comma-as-business-card pattern; the spelled-out subtitle reads more naturally with the extra room.

### Google Play Short Description

TBD — 80 character limit. Will be written after framework is finalized.

### Brand Name (everywhere else)

**FCK FASCISTS** / **FCK Fascists**

Inside the app, on the website, in social, on the scorecard share image. Never fully spelled out — always FCK. Once someone downloads it, the gloves come off.

### Casing in Prose

- **Alone / intentionally yelling** (titles, headlines, brand mark on launch screen, scorecard, posters, share image): `FCK FASCISTS`
- **In a sentence** (body prose, README, technical docs, FAQ explanations): `FCK Fascists`
- The brand mark is `FCK Fascists` — the app name on the store is `FCK, Financial Contribution Kit`. Don't conflate them.

### Why Two Names

The clinical store listing next to the actual product experience is the joke. A reviewer sees "Financial Contribution Kit." Everyone else sees what they see. The contrast is marketing no description could buy.

---

## Core Ethos

### The Data and the User Define the Bad Guy

The name is the thesis. The data is the evidence. The app never explicitly connects them.

FCK presents FEC filings — public records, verifiable, citable. It does not editorialize. It does not tell users who the fascists are. It does not need to. The user looks at $2.4M flowing to R-aligned PACs from a company they buy coffee from every morning, and they connect the dots themselves. That silent moment of realization is more subversive than any copy we could write.

### The Data Is Nonpartisan. The Product Is Not.

The app is called FCK FASCISTS. It has a point of view. But the tool layer presents both R: and D: contributions, links to FEC.gov, shows confidence labels, and never claims more certainty than the data supports. A user could theoretically use this app to avoid D-aligned donors. The experience would function identically. That's not a bug — it's credibility. The architecture says: we trust the data and we trust you.

This is not neutrality. It is transparency.

### The Bigger Commentary

This is a direct commentary on the outsized power money has in politics. And, in the moment this app was conceived, that power leans R.

---

## The Two Voices

FCK has two distinct voices. They are separated by a single user action: the avoid tap. Everything before the tap is one voice. Everything after is another. Both are essential. Neither works without the other.

### Clark the Clerk

Clark is the tool anthropomorphized. A public records clerk — neutral, helpful, infinitely competent without being eager or annoying. He has a name tag. He probably wears a short-sleeve button-down. He gets you what you need and moves on to the next folder.

Clark is not just a filing cabinet with legs. He's the most helpful clerk you've ever encountered. You walk up to the window holding a Tropicana bottle and he says "that's PepsiCo, here's their filing." You point at a spot on a map and he pulls the record before you ask. You walk into a website and he's already got the folder open.

The personality is the competence, the neutrality, not the delivery. He can never be political.

And after hours? Clark didn't take this job by accident. 🤘🏽

**Where Clark lives:** Map screen, business card (before avoid tap), barcode results, extension popup, data zones, FEC links, info section (FAQ, transparency, data methodology), confidence labels.

**What Clark sounds like:** "Here's what we have on file." No wink, no lean, no editorial.

**Clark's principles:**

- Present R: and D: contributions. Always. Both shown.
- Show confidence labels on medium-confidence matches only. High confidence shows no badge.
- Link to FEC.gov or other data source. Every figure is verifiable.
- Clinical formatting. R: $X · D: $Y. Filing cabinet energy.
- CEO names and sprites appear on Clark's surfaces in their neutral state. They are presented as data — who runs this company — not as targets.
- No humor. No personality in delivery. Data speaks for itself.
- "Here's the file." — not "did you know?" or "can you believe this?"
- Infinitely helpful, never eager, never annoying.

**Why Clark matters:** This is where the app earns its credibility. The moment the data layer gets cute, the entire product becomes dismissable as propaganda. Clark is what makes The Sh\*tposter possible.

**Clark's tagline:** "Financial contributions, on file."

### The Sh\*tposter

The Sh\*tposter shows up in two ways. On **output surfaces** (scorecard, share image), it's the user's voice — first person, confrontational, a brag. On **brand surfaces** (launch screen, onboarding welcome, about/mission), it's the app's personality — the attitude, the identity — the user's frustration personified — the thing that makes FCK feel like FCK! and not another civic data tool.

In both cases the energy is the same: unhinged, edgelord, troll energy. 8-bit video game trash talk. The kind of audacious that could eviscerate Musk — but he'd like it.

**Where The Sh\*tposter lives:** Scorecard, share images, avoid celebrations, sprite animations (defeated state), achievement moments, launch screen, onboarding welcome, about/mission in the info section, business card (after avoid tap), the app name itself.

**What The Sh\*tposter sounds like:** "I FCK'd Zuckerberg 8×."

**The Sh\*tposter's principles:**

- First person on output surfaces. "I FCK'd Zuckerberg 8×" — not "you FCK'd Zuckerberg."
- CEO names in confrontational context live here. The scorecard rolls up avoids to the publicFigureName. It's personal.
- Defeated sprites, celebration animations, weekly drops — this is a game, it should feel like one.
- Humor is audacious and crafted. Not mean-spirited — audacious. The difference between bullying and trolling is craft.
- Error states and empty states can be funny.
- Humor never undermines the data.
- The energy is empowerment, not protest. This is not an activist rally. It's an act of defiance that feels good and looks even better when you share it.

**Why The Sh\*tposter matters:** This is what gets shared. This is what generates earned media. Nobody screenshots a data table. They screenshot and share "I FCK'd Zuckerberg 8×" and everyone who sees it goes through the same arc: shock, curiosity, empowerment.

**The Sh\*tposter's tagline:** "The fascists won't FCK themselves. 🤘🏽"

### The Toggle: The Avoid Tap

The avoid tap is where Clark hands off to The Sh\*tposter. Before the tap, you're looking at a public record. After the tap, you are FCKing "the man." The sprite flips to its defeated state, the celebration fires, you're in the game. This transition is environmental — the whole surface shifts — not a gentle gradient.

Clark gives you the information. The Sh\*tposter destroys you with it.

### The Creator Voice (used sparingly)

There is a third voice that shows up sparingly and intentionally. Only once per surface if at all. It is the person who built this — speaking briefly, sincerely, in their own voice. Not Clark. Not the Sh\*tposter. Just the human behind the project, telling you who's on the other side of the screen.

It exists because at some point a user is going to think "who built this?" and the credibility chain — Clark earns it, the Sh\*tposter spends it — needs a visible author. Without that, the project reads as either institutional (it isn't) or anonymous (it isn't either).

The creator voice should rarely be used unless requested and if its use is ever suggested, it must be reviewed and approved by the creator (me).

**Where the Creator lives:** `infoContent.about.organization` — *"An open-source project. One person trying to make a difference by doing what they're good at."* The CLAUDE.md project overview second line.

**What the Creator sounds like:** Quiet. First-person or implied first-person. No horns, no audacity, no clerk. Owns the work without performing it. The audience is a stranger who has decided to care enough to read.

**The Creator's principles:**

- One line per surface. Two is one too many.
- Never on Clark surfaces (data, FAQ, error states, banners). Never on Sh\*tposter surfaces (scorecard, share image, celebrations).
- Never explains the project's politics or pitches the user. The Sh\*tposter and Clark already did that work.
- Never names other people, partners, or organizations — it's a single voice, not a credit roll.
- The form is the substance: small, plain, slightly under-edited. Anything more polished reads like a corporate "About Us."
- If you find yourself writing two Creator lines on the same surface, you're not writing the Creator anymore — you're writing brand copy. Stop.

**Why the Creator matters:** It's the only place in the entire product where the wall between user and maker comes down. It earns its presence by being rare. If it shows up everywhere, it loses force. Protect its rarity.

**The Creator's tagline:** none. The Creator does not have a tagline. That would defeat the point.

---

## The Two Modes

Every surface in the app is one or the other. There is no in-between. The avoid tap is a hard switch, not a dial.

```
CLERK                                     SH*TPOSTER
─────────────────── AVOID TAP ───────────────────
neutral                                   unhinged
factual                                   confrontational
both parties                              CEO names (defeated)
"here's the file"                         "I FCK'd Zuckerberg 8×"
```

If you're writing copy and aren't sure which voice to use, ask: has the user made a choice yet? If no → Clark. If yes → The Sh\*tposter.

---

## The Share Arc

When someone sees an FCK scorecard for the first time, the emotional sequence is:

1. **Shock** — "Holy shit, lol"
2. **Curiosity** — "What is this? How does it work? Who donated where? What can I see?"
3. **Empowerment** — "I can choose this place over that place. I'm gonna skip Instagram today. Finally it feels like I can do something about this."

Every surface in the app serves one of these beats:

- **Shock:** The name, the scorecard, the share image, the brand identity.
- **Curiosity:** The map, the business card, the barcode scanner, the extension popup.
- **Empowerment:** The avoid tap, the tracking loop, the weekly drop, the growing scorecard.

---

## What Only FCK Does

**The app that lets you map, tap, and scan.**

Other tools require you to already know what you're searching for. You type "Pepsi" into a search box because you already suspect Pepsi. FCK works the other way — it meets you where you are with information you need to act. You tap a pin on the map and discover the sandwich shop you eat at twice a week funds a PAC. You scan a juice bottle and learn Tropicana is PepsiCo. You're browsing and the extension lights up on a site you didn't realize had political spending on file.

The data is public. It's all on FEC.gov. But nobody browses FEC.gov at a coffee shop. FCK puts that data in your hands in a real, understandable, and actionable (avoidable) way — wherever you shop, browse, or scan — then you can act on what you know and share what you did.

**But the tool is only half of it.** FCK turns a one-time lookup into an ongoing practice. You avoid a business, that goes on your record. You skip a platform for the day, that counts. At the end of the week your scorecard shows what you did — and it's built to be shared. The chain is: discover → decide → track → share. Other tools stop at discover. FCK runs the whole loop.

The tool is based on FEC data, but it's useful and empowering in ways no other tool is. The UPC barcode scanner tracing a product to its parent company's political contributions is basically unheard of. The map tap that pulls up nearby businesses' filings on demand doesn't exist anywhere else. The browser extension that flags sites in real time as you browse is something nobody else has built. This is built to be useful and fun.

---

## Formatting Conventions

### R: / D:

All political party labels use **R:** and **D:** — both abbreviated, both the same length, both clinical, neither colloquial, neither loaded. Filing cabinet energy in two characters.

In editorial contexts (FAQ, info section), write "Republican campaigns/donors" or "Democratic campaigns/donors" — never as identity labels for people.

This applies everywhere: business card, extension popup, scorecard, shared constants, info section, app store description.

### Emoji

🤘🏽 is the canonical emoji. Used sparingly. It appears on sign-offs and branded moments — the scorecard share image, Clark's after-hours sign-off, the Sh\*tposter tagline. Nowhere else in branded contexts.

### Action Verb

**"Avoid"** is the primary action verb. Not boycott (too loaded, too prescriptive), not skip (too soft), not dodge (close second — on deck for A/B testing later). Avoid is clear, active, personal, and non-prescriptive. The app presents information. The user avoids. The app never tells you what to do.

### The F-word

- **App Store metadata:** Never. The store listing is `FCK, FinancialContributionKit`.
- **In-app branded surfaces** (scorecard, share image, launch screen, onboarding welcome): always abbreviated, never asterisked. Use **FCK** as the noun/expletive, **FCK'd** as past tense, **FCKing** as the gerund (e.g. "Who are you FCKing today?"), **FCKs** as the plural, **FCK!** as the standalone exclamation/reaction. The `!` is reserved for standalone use only — compound forms drop the bang. The pixel-art logo and specific marketing surfaces are the only place the F\*CK styling is preserved — it's an asset, not text. Consider its use intentionally.
- **Website, social, organic marketing:** FCK FASCISTS. Still abbreviated — never fully spelled out.
- **Clark's surfaces** (business card, extension popup, info FAQ/data sections): Never. These are data surfaces.

---

## Copy Principles

1. **Lead with the answer.** No preamble, no "did you know that corporations...". State the thing.
2. **Short sentences. Plain language.** Talk the way you'd talk to a friend. Not overeducated, not dumbed down. Understandable.
3. **The user is the hero.** The app is a tool. It empowers the user to do something.
4. **Never preach.** The app is not an activist rally. It assumes you already care and gives you something to do about it.
5. **Never explain the joke.** "I FCK'd Zuckerberg 8×" does not need a footnote.
6. **When you're right, you can be loud.** Every confrontational line from The Sh\*tposter is backed by a verifiable number from Clark.
7. **Accessible always.** Dynamic Type, VoiceOver/TalkBack labels, high-contrast mode. The 8-bit aesthetic is the design language, not a barrier. Every edgy line needs an a11y label that's clear and functional.
8. **Write for the screenshot.** The scorecard will be screenshotted, cropped, and shared with zero context. It needs to work as a standalone image. Every share surface should make sense to someone who has never heard of the app.

---

## Surfaces Quick Reference

*Always check that this is accurate based on the current version of the app.*

| Surface | Voice | CEO Names/Sprites | Party Labels | Humor | User Pronoun |
|---|---|---|---|---|---|
| Business card (pre-avoid) | Clark | Yes — neutral state | R: / D: | No | None |
| Business card (post-avoid) | Sh\*tposter | Yes — defeated state | R: / D: | Yes (celebration) | None |
| Extension popup | Clark | Yes — neutral state, named (confrontational framing per config) | R: / D: | No | None |
| Barcode result | Clark | No | R: / D: | No | None |
| Map markers / search | Clark | No | N/A | No | None |
| Info — FAQ / transparency / data | Clark | No | R: / D: where needed | No | None |
| Info — About / mission | Sh\*tposter (brand) — closing line is the Creator | No | No | Yes (Sh\*tposter only) | None |
| Avoid tap + celebration | Sh\*tposter | Yes — defeated sprite | No | Yes | None (environmental) |
| Scorecard | Sh\*tposter (user) | Yes (primary) | No | Yes | "I" |
| Share image | Sh\*tposter (user) | Yes (primary) | No | Yes | "I" |
| Launch screen | Sh\*tposter (brand) | No | No | Yes | None |
| Onboarding — welcome | Sh\*tposter (brand) | No | No | Light | None |
| Onboarding — permissions/privacy | Clark | No | No | No | "Your" |
| Track screen — list | Clark | Yes — neutral state | No | No | None |
| Track screen — arena/celebrations | Sh\*tposter | Yes — defeated state | No | Yes (reactions) | None |
| Empty states | Sh\*tposter | No | No | Yes | Varies |
| Error states (game surfaces) | Sh\*tposter | No | No | Yes | None |
| Error states (data surfaces) | Clark | No | No | No | None |
| App Store listing | Clark (corporate neutral) | No | No | No | None |

*Note: "(user)" = The Sh\*tposter as the user's voice (first person). "(brand)" = The Sh\*tposter as the app's personality.*

---

## App Store Listing (Locked)

### Title

`FCK, FinancialContributionKit`

### Subtitle

`Track political funding. FCK!`

### Full Description

The app that lets you map, tap, and scan products and businesses to see their political funding record. FCK, your Financial Contribution Kit, empowering you with political spending information and making what you choose to do about it worth sharing.

MAP — Tap or search anywhere to see the political funding behind nearby businesses.

TRACK — Log the platforms and businesses you choose to avoid. Your choices, tracked privately on your device.

SCAN — Scan a product and see its parent company's political contributions.

SHARE your FCK! — Get a scorecard every week to see how you did. Your data. Your choices. Worth sharing.

No accounts. No sign-in. No tracking. No servers. All data stays on your device. Public, reviewable source code.

Financial contributions, on file. 🤘🏽

---

## Pending Items

- **Google Play short description** (80 character limit) — not yet written.
- **Launch screen rotating messages** — old placeholders killed, new ones TBD. Will be written during copy rewrite.

---

## Anti-Patterns (Do Not Do This)

- **Don't editorialize on data surfaces.** "This company donated a shocking $2.4M" — no. Show the number. The user decides if it's shocking.
- **Don't use "boycott."** It's prescriptive and loaded. "Avoid" is the verb.
- **Don't explain why fascism is bad.** The app assumes the user already knows. Preaching is the fastest way to lose the audience.
- **Don't soften the scorecard.** "I FCK'd Zuckerberg 8×" does not need "based on your avoidance tracking data." Clark already did that work.
- **Don't put humor in Clark's surfaces.** A funny empty state on the scorecard is fine. A funny confidence label on a business card is not.

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-03-25 | Initial framework |
| 2.0 | 2026-03-26 | Full revision: voice names, CEO sprite states, R:/D:, App Store listing, taglines, ethos, product description, transcript feedback |
| 2.1 | 2026-03-26 | Self-review fixes: removed "gamified" from intro, fixed "surfaces" as verb, removed "megaphone" and "intervention" jargon, clarified Sh\*tposter as user voice vs brand voice, added behavior loop to differentiator section, noted extension popup config, added pending items section, fixed R-aligned language in ethos, added both-voices example to intro |
| 2.2 | 2026-03-27 | Creator's review: "The App Never Has To" → "The Data and the User Define the Bad Guy," attitude gradient → two modes (binary switch not spectrum), "weapon" → "gives you something to do about it," Clark's line → "here's the file," added "He can never be political," added "the user's frustration personified" to Sh\*tposter, added business card (after avoid tap) to Sh\*tposter surfaces, updated toggle language, updated share arc reactions, refined What Only FCK Does section, added "campaigns/donors" to editorial usage, typo fixes |
| 2.3 | 2026-05-07 | Launch-day cleanup: asterisks dropped on user-facing surfaces (only the pixel-art logo and intentional marketing surfaces retain F\*CK styling); canonical forms documented as **FCK / FCK'd / FCKing / FCKs / FCK!** with the bang reserved for standalone use only; **casing rule**: `FCK FASCISTS` alone or intentionally yelling, `FCK Fascists` in body prose; brand mark vs. App Store name distinction clarified; Android Play Store title `FCK, Financial Contribution Kit` added (50-char limit allows the spaced form); all f\*cked example sentences updated to FCK'd; framework's brand-tagline example aligned to the live `sharedCopy.brandTagline`; **added the Creator voice** as a third recognized voice — used sparingly, once per surface, to puncture the wall between user and maker (currently lives in `infoContent.about.organization`); creator's directive on launch day. |
