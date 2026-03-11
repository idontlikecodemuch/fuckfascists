# F*ck Fascists

**A privacy-first, gamified app that helps you put your money where your values are.**

Every dollar you spend is a political act. Most people just don't realize it.

F*ck Fascists makes corporate political donation data visible at the moment it matters — when you're standing in front of a store, browsing a website, or deciding which platform to open. It celebrates the times you choose differently, tracks your impact over time, and connects you with a community doing the same thing.

---

## What It Does

**On your phone:**
When you're near a business, the app checks whether that company has donated to Republican campaigns or authoritarian political movements. If it has, you'll see a flag — who they donated to, how much, and a direct link to the FEC data. If you decide to walk away, you tap "Avoided." That's it. No judgment, no moralizing. Just a small win counted.

**In your browser:**
The extension quietly watches for flagged retailers as you shop online. A subtle indicator lets you know before you click "Buy." Same data, same transparency, same choice — yours to make.

**Every week:**
A shareable report card drops for everyone at the same time — like BeReal, but for your spending habits. It shows your avoidances for the week, your cumulative impact, and how you're doing on platform avoidance (social media, streaming, delivery apps). You can share it or keep it to yourself.

---

## The Data

All donation data comes directly from the **FEC (Federal Election Commission)** — the same public records journalists and researchers use. We don't editorialize the data. We just surface it.

- Every data point links directly to its FEC source
- Confidence levels are always shown — if a match is uncertain, we say so
- The full entity list is open and auditable
- We track corporate PAC donations, not individual employees

---

## The Model

F*ck Fascists is organized as a **nonprofit**. The app is free. There are no ads. There is no data harvesting.

Revenue comes from optional user donations. After operating costs, 100% is distributed:

| Allocation | Purpose |
|---|---|
| 50% | Quarterly payouts to users (weighted by avoid activity — more avoidances = more entries) |
| 25% | Anti-fascist causes and campaigns, voted on by users |
| 15% | Growth and platform maintenance |
| 10% | Creators and developers |

The transparency dashboard shows the current pool, every past distribution, and how cause votes went. Nothing is hidden.

---

## Privacy

This is non-negotiable:

- **No location data stored** — geolocation is used in the moment and discarded
- **No browsing history** — the extension never logs what sites you visit
- **No account required** — MVP has no backend, no server, no accounts
- **No "support" events** — the app cannot record that you went somewhere or bought something. Only affirmative avoidances are logged, locally, on your device
- **Open source** — every line of code is here for you to read

---

## The Three Products

All three launch together at v1.0:

1. **Mobile app** — iOS + Android (React Native + Expo)
2. **Browser extension** — Chrome + Firefox (Manifest V3)
3. **Shared data core** — the entity matching and donation data pipeline used by both

---

## Stability

F*ck Fascists is designed to survive. If Apple or Google removes it from their stores, it keeps working — sideloadable APK, PWA distribution, and direct download are first-class concerns, not afterthoughts.

---

## The Name

Yes, it's called F*ck Fascists. The name is intentional. This is not a neutral civic app — it is a tool for people who have decided that corporate funding of authoritarian politics is something worth pushing back against, one purchase at a time.

If that's you, welcome.

---

## Status

Currently in active development. MVP targets: map screen, browser extension, weekly report card, and curated entity list of 400+ major US corporations with verified FEC data.

Contributions, issues, and data corrections welcome.

---

## Data Sources

- [Federal Election Commission](https://www.fec.gov) — all corporate PAC donation data
- [FEC API](https://api.open.fec.gov) — live data pipeline

## License

Open source. See LICENSE.
