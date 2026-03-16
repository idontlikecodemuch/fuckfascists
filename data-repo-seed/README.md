# fckfascists-data

Public data files for the [F*ck Fascists](https://github.com/idontlikecodemuch/fuckfascists) app and browser extension.

The app bundles these files at build time for offline use and fetches updates from this repo at runtime. Editing a file here updates the app without requiring a new release.

---

## Files

| File | Purpose | Consumed by |
|---|---|---|
| `entities.json` | Curated list of ~448 entities with FEC committee IDs, aliases, domains, and bundled donation summaries | App entity matching pipeline, extension domain detection |
| `info.json` | Info screen editorial content: about/mission, data methodology, FAQ, external links | App Info screen (`useInfoContent` hook) |

---

## entities.json

The canonical entity list. Each entry includes:

- `id` — unique lowercase-hyphenated identifier
- `canonicalName` — FEC-registered organization name
- `aliases` — consumer-facing brand names (used for matching)
- `domains` — website domains (used by browser extension)
- `fecCommitteeId` — verified FEC committee ID (`string` = confirmed, `null` = confirmed no PAC, `""` = unverified)
- `donationSummary` — pre-fetched donation totals from the FEC API (populated by `fetch-donation-data.mjs` in the main repo)
- `ceoName`, `publicFigureName`, `parentEntityId` — display and relationship metadata

**To update:** Edit the file, submit a PR. The community reviews all submissions. Run `npm run verify:entities` and `npm run fetch:donations` in the main repo to refresh FEC data.

---

## info.json

Editorial content for the app's Info screen. Schema:

```json
{
  "version": "1.0.0",
  "about": { "tagline": "...", "description": "...", "organization": "...", "sourceCodeUrl": "..." },
  "transparency": [{ "id": "...", "title": "...", "body": "..." }],
  "faq": [{ "id": "...", "q": "...", "a": "..." }],
  "links": [{ "id": "...", "label": "...", "url": "...", "category": "source|community|legal" }]
}
```

The app falls back to the bundled version in `copy/infoContent.ts` if this file is unreachable or malformed. Edits here take effect on the next app launch without an app store update.

---

## How the app fetches updates

1. App launches with bundled data (offline-first)
2. In the background, fetches from `raw.githubusercontent.com/idontlikecodemuch/fckfascists-data/main/{file}`
3. If the fetch succeeds and the response is valid, it silently replaces the bundled version in memory
4. If the fetch fails, the bundled version continues to work — no error shown to the user

No authentication, no API keys, no rate limits. The files are served as raw static content from GitHub.

---

## Contributing

- **Entity corrections:** Fix aliases, domains, or FEC committee IDs and open a PR
- **New entities:** Add a complete entry following the existing schema; include `fecCommitteeId` if known
- **Info content:** Edit `info.json` — FAQ additions, transparency clarifications, link updates
- **Data pipeline:** The `verify:entities` and `fetch:donations` scripts in the main repo populate FEC data; see the main repo's CLAUDE.md for pipeline documentation

---

## License

Same as the main repo. See [LICENSE](https://github.com/idontlikecodemuch/fuckfascists/blob/main/LICENSE).
