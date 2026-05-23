# Store Feedback Automation

Purpose: stop copying TestFlight screenshots by hand. Store feedback imports are local maintainer tooling, not runtime app code.

Outputs go to `tools/review/store-feedback/<timestamp>/`, which is gitignored because feedback can include tester email, device metadata, comments, screenshots, and crash logs.

## Commands

```sh
npm run feedback:apple
npm run feedback:google
npm run feedback:stores
```

Useful flags:

```sh
npm run feedback:apple -- --since=2026-05-01 --download-screenshots --download-crash-logs
npm run feedback:google -- --since=2026-05-01 --all-pages
```

Each run writes:

- `feedback.json` normalized records
- `feedback.jsonl` one normalized record per line
- `feedback.md` a readable triage summary
- `metadata.json` run metadata
- optional `screenshots/` and `crashlogs/`

## Apple / TestFlight

Apple supports this directly through App Store Connect API.

Required env:

```sh
APP_STORE_CONNECT_KEY_ID=
APP_STORE_CONNECT_ISSUER_ID=
APP_STORE_CONNECT_PRIVATE_KEY_PATH=./AuthKey_YOURKEYID.p8
APP_STORE_CONNECT_APP_ID=
```

Alternative private-key envs are supported:

```sh
APP_STORE_CONNECT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
APP_STORE_CONNECT_PRIVATE_KEY_BASE64=
```

The script imports:

- TestFlight screenshot feedback
- TestFlight crash feedback
- optional screenshot assets
- optional crash logs

Apple also supports webhooks for new screenshot/crash feedback. That is the next step if we want near-real-time sync; polling is enough for the current local workflow.

## Google Play / Android

Google has two different feedback surfaces:

- Production reviews: available through Google Play Developer API.
- Open/closed/internal testing feedback: visible and replyable in Play Console, but not exposed by the public Reply to Reviews API.

Required env for production reviews:

```sh
GOOGLE_PLAY_PACKAGE_NAME=
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=./google-play-service-account.json
```

The service account needs Play Console access with the Reply to reviews permission.

For Android beta feedback, do not build against an unofficial Play Console scrape unless we deliberately accept brittle auth and ToS risk. Better options:

- Set the Play testing feedback URL/email to a channel we control and ingest that mailbox/form.
- Use in-app beta feedback in `features/Beta` and export locally/serverlessly.
- Use the Play Console testing feedback UI only as a temporary manual fallback.

## Normalized Record Shape

```json
{
  "id": "testflight:screenshot-feedback:...",
  "source": "testflight",
  "kind": "screenshot-feedback",
  "createdAt": "2026-05-23T12:00:00Z",
  "comment": "Tester comment",
  "appVersion": "1.0.0",
  "platform": "IOS",
  "device": {
    "model": "iPhone",
    "osVersion": "18.5"
  },
  "tester": {
    "email": "ch...@example.com"
  },
  "attachments": []
}
```

Emails are redacted in normalized output by default.
