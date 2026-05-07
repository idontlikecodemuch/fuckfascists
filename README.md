# FCK FASCISTS

**A privacy-first app that puts political contribution data where it's useful — at the counter, in your browser, on your phone.**

Every dollar you spend is a political act. Most people just don't realize it.

FCK Fascists makes corporate political contribution data visible at the moment it matters — when you're standing in front of a store, browsing a website, or deciding which platform to open. It celebrates the times you choose differently and tracks your weekly impact, privately, on your device.

---

## What It Does

**On your phone:**
When you're near a business, the app checks whether that company has contributed to Republican campaigns or authoritarian political movements. If it has, you'll see a flag — who they contributed to, how much, and a direct link to the FEC filing. If you decide to walk away, you tap "Avoided." That's it. No judgment, no moralizing. Just a small win counted.

The app also includes a `SCAN BETA` barcode flow for shelf products. It uses a bundled producer-prefix layer for fast local matches and falls back to Open Food Facts for remaining product lookups.

**In your browser:**
The extension quietly watches for flagged retailers as you shop online. A subtle indicator lets you know before you click "Buy." Same data, same transparency, same choice — yours to make.

**Every week:**
A shareable scorecard drops at the same moment for everyone on the same app version. It shows the businesses and platforms you avoided that week — built to be screenshotted, built to be shared. Or kept to yourself.

---

## The Data

All contribution data comes directly from the **FEC (Federal Election Commission)** — the same public records journalists and researchers use. We don't editorialize the data. We just surface it.

- Every figure links directly to its FEC filing
- Confidence levels are always shown — if a match is uncertain, we say so
- The full entity list is open and auditable
- We track corporate PAC contributions (Schedule B) plus a curated set of high-profile individual donors (Schedule A — bundled, surfaced in V1.5+)

---

## Privacy

This is non-negotiable:

- **No accounts, no servers** — MVP is fully on-device
- **Location stays on the device** — used to find nearby businesses and to remember which avoided pins to show on the map; encrypted at rest, auto-purged daily, never transmitted
- **No browsing history** — the extension never logs which sites you visit
- **No "support" events** — the app cannot record that you went somewhere or bought something. Only affirmative avoidances are logged
- **Open source** — every line of code is here for you to read

See the in-app Info tab or [FCKfascists.com/privacy](https://FCKfascists.com/privacy) for the full disclosure.

---

## The Three Products

1. **Mobile app** — iOS first (live today). Android shortly after.
2. **Browser extension** — Chrome (rolling out within days of iOS launch). Firefox shortly after.
3. **Shared data core** — TypeScript package powering the entity matching and contribution data pipeline used by both surfaces.

---

## Stability

FCK Fascists is designed to survive. If Apple or Google removes it from their stores, it keeps working — sideloadable APK, PWA distribution, and direct download are first-class concerns, not afterthoughts.

---

## The Name

Yes, it's called FCK Fascists. The name is intentional. This is not a neutral civic app — it is a tool for people who have decided that corporate funding of authoritarian politics is something worth pushing back against, one purchase at a time.

If that's you, welcome.

---

## Status

Currently in launch (v1.0.0). Mobile app live on iOS today; Android and browser extensions follow shortly. The curated entity list covers 400+ major US corporations with verified FEC data.

Contributions, issues, and data corrections welcome.

---

## Data Sources

- [Federal Election Commission](https://www.fec.gov) — all corporate PAC contribution data
- [FEC API](https://api.open.fec.gov) — live data pipeline

## License

Open source. See LICENSE.
