/**
 * Bundled editorial content for the Info screen.
 *
 * This is the single source of truth for all long-form info text: about/mission,
 * reference accordion (data methodology, privacy, app FAQ), and external links.
 * It ships with the app for offline use and is replaced at runtime if a fresher
 * version is fetched from INFO_CONTENT_URL.
 *
 * UI chrome (section headers, expand/collapse labels, icons) lives in copy/info.ts.
 * Editorial content (this file) can be updated without an app release by editing
 * info.json in the fuckfascists-data repo.
 */
import type { InfoContent } from '../features/Info/types';
import { sharedCopy } from './shared';

export const BUNDLED_INFO_CONTENT: InfoContent = {
  version: '1.2.0',

  about: {
    tagline: `${sharedCopy.brandTagline} \uD83E\uDD18\uD83C\uDFFD`,
    description:
      'FCK puts political contribution data where it\u2019s useful \u2014 at the counter, ' +
      'in your browser, on your phone. Map a business. Scan a product. See where the ' +
      'money goes. Avoid what you want. Share what you did.',
    organization: 'An open-source project. One person trying to make a difference by doing what they\u2019re good at.',
    ethosTitle: 'BUILT TO LAST',
    ethos:
      'No accounts. No servers. No app store required. This app was built to work ' +
      'without permission \u2014 from anyone. All data is bundled. All code is public. ' +
      'If Apple or Google pulls it tomorrow, you can sideload it, fork it, or run the ' +
      'extension. The data lives on FEC.gov. The code lives on GitHub. Nothing depends ' +
      'on us staying online.',
    sourceCodeUrl: sharedCopy.repoUrl,
  },

  reference: [
    // ── THE DATA ──────────────────────────────────────────────────────────────
    {
      id: 'data-source',
      q: 'Where does the data come from?',
      a:
        'Every contribution figure comes from FEC.gov \u2014 the official U.S. government ' +
        'record of campaign finance. Every dollar amount in the app links to its original ' +
        'FEC filing. We don\u2019t editorialize. We show what\u2019s on file.',
      category: 'data',
    },
    {
      id: 'fec-filings',
      q: 'Can I verify the numbers myself?',
      a:
        'Yes. Every figure links to its FEC filing at fec.gov. Tap \u201CSee full FEC ' +
        'record\u201D on any business card and check it yourself.',
      category: 'data',
    },
    {
      id: 'confidence',
      q: 'What does the MATCHED badge mean?',
      a:
        'Most businesses match to our bundled list automatically \u2014 high confidence, ' +
        'no badge. When a match comes from searching the FEC database, we show a ' +
        'MATCHED badge and a disclaimer. Tap the FEC link to verify. We never claim ' +
        'more certainty than the data supports.',
      category: 'data',
    },
    {
      id: 'methodology-sort',
      q: 'How does the app sort contributions into R: and D:?',
      a:
        'Every dollar is classified by where it went, not where it came from.\n\n' +
        'Businesses: Each payment from the company\u2019s PAC to a candidate is sorted ' +
        'by the candidate\u2019s party.\n' +
        'Individuals: Each personal contribution to a committee is sorted by the ' +
        'receiving committee\u2019s party \u2014 matched using FEC records and public ' +
        'legislator databases.\n' +
        'Committees: If 80%+ of a committee\u2019s giving goes to one party, it\u2019s ' +
        'classified as that party. Below 80%, it stays unclassified.\n\n' +
        'If a dollar can\u2019t be confidently classified, it stays unlabeled.',
      category: 'data',
    },
    {
      id: 'methodology-match',
      q: 'How does the app match a business to its political record?',
      a:
        'Each business is matched to its registered PAC in the FEC database \u2014 ' +
        'public record. When the match is strong, you see the data. When it\u2019s less ' +
        'certain, a MATCHED badge appears with a link to verify on FEC.gov yourself.',
      category: 'data',
    },
    {
      id: 'methodology-linked',
      q: 'Who gets linked to a business?',
      a:
        'People who directly benefit financially \u2014 owners, founders with a stake, ' +
        'executives, controlling shareholders. Someone with an ordinary board seat or a ' +
        'former job doesn\u2019t qualify. Every link is based on public evidence like ' +
        'company filings and investor disclosures. If the evidence isn\u2019t there, the ' +
        'link isn\u2019t made.',
      category: 'data',
    },
    {
      id: 'matching-method',
      q: 'How does the app identify a business on the map?',
      a:
        'On iOS, the app checks a business\u2019s registered website against our ' +
        'entity list first \u2014 a verified match. When website data isn\u2019t available, ' +
        'it matches by name. On Android, Google Maps provides business names only, so ' +
        'matching is name-based. In both cases, every match links to its FEC filing ' +
        'so you can verify.',
      category: 'data',
    },
    {
      id: 'entity-list',
      q: 'What is the curated entity list?',
      a:
        'A community-maintained list covering top R-donating and D-donating companies, ' +
        'retailers, and platforms. It ships with the app for offline use and updates ' +
        'from GitHub. Anyone can submit corrections via a pull request.',
      category: 'data',
    },
    {
      id: 'data-currency',
      q: 'How current is the data?',
      a:
        'Contribution data follows FEC reporting cycles and covers every cycle since ' +
        '2016. The entity list ships with the app and updates automatically when ' +
        'connected. Both are versioned and public on GitHub.',
      category: 'data',
    },
    {
      id: 'limitations',
      q: 'What doesn\u2019t the app cover?',
      a:
        'V1 covers corporate PAC contributions (Schedule B). Individual executive ' +
        'donations (Schedule A) and independent expenditures (Schedule E) are planned ' +
        'for future versions. State-level campaign finance data is not included.',
      category: 'data',
    },

    // ── PRIVACY ───────────────────────────────────────────────────────────────
    {
      id: 'what-saved',
      q: 'What does the app save?',
      a:
        'The app saves your location when you open and engage with the map \u2014 daily ' +
        'session only data, encrypted on your phone, so you can see where you\u2019ve ' +
        'checked. That data is erased the next day. It also saves your avoids for the ' +
        'week \u2014 also locally and encrypted \u2014 so it can build you a scorecard. ' +
        'That data is cleared every week. Only the scorecard image is kept.',
      category: 'privacy',
    },
    {
      id: 'data-transmitted',
      q: 'Is my data transmitted?',
      a:
        'No. Your avoids, your scorecard, your location \u2014 none of it leaves your ' +
        'phone. The app does make a few outbound calls: to FEC.gov for contribution ' +
        'lookups, to a public product database for barcode scans, and to GitHub for ' +
        'data updates. No personal data is included in any of those calls.',
      category: 'privacy',
    },

    // ── THE APP ───────────────────────────────────────────────────────────────
    {
      id: 'partisan',
      q: 'Is the app partisan?',
      a:
        'The app shows R: and D: contributions for every business and individual. ' +
        'Federal, state, and local. The data comes from FEC filings and public records. ' +
        'You see all of it and make your own call.',
      category: 'app',
    },
    {
      id: 'internet',
      q: 'Does the app need internet?',
      a:
        'The app was built to work offline \u2014 bundled data ships with every install ' +
        'as a privacy measure. An internet connection may be needed for live FEC lookups, ' +
        'barcode scanning, and entity list updates.',
      category: 'app',
    },
    {
      id: 'wrong-match',
      q: 'What if a business is misidentified?',
      a:
        'Matches from the FEC search always show a MATCHED badge and a \u2018verify ' +
        'before acting\u2019 disclaimer. Tap the FEC link to check. If something is ' +
        'wrong, let us know.',
      category: 'app',
    },
    {
      id: 'edit-platforms',
      q: 'How do I edit my platform list?',
      a: 'Tap Edit at the top of the Track tab. Add or remove platforms anytime.',
      category: 'app',
    },
    {
      id: 'report-error',
      q: 'Can I add a business or correct an entry?',
      a:
        `See something wrong? Email ${sharedCopy.contactEmail} or open an issue on ` +
        'GitHub. The entity list is open source \u2014 anyone can submit a correction.',
      category: 'app',
    },
    {
      id: 'extension',
      q: 'Is there a browser extension?',
      a:
        'Yes. Available for Chrome and Firefox. It flags businesses as you browse and ' +
        'lets you log avoids without opening the app. Same privacy rules \u2014 no ' +
        'browsing history stored, ever.',
      category: 'app',
    },
    {
      id: 'extension-sync',
      q: 'Does the browser extension sync with the app?',
      a:
        'Not yet. Sync requires a backend, which we deliberately don\u2019t have. The ' +
        'extension has its own weekly summary. Sync is planned once a privacy-preserving ' +
        'approach is designed.',
      category: 'app',
    },
  ],

  links: [
    { id: 'fec', label: 'FEC.gov (campaign finance data)', url: 'https://www.fec.gov', category: 'source' },
    { id: 'source-code', label: 'Source code (GitHub)', url: sharedCopy.repoUrl, category: 'community' },
    { id: 'data-repo', label: 'Entity list (GitHub)', url: sharedCopy.dataRepoUrl, category: 'community' },
    { id: 'issues', label: 'Report a bug or correction', url: sharedCopy.issuesUrl, category: 'community' },
    { id: 'privacy', label: 'Privacy policy', url: sharedCopy.privacyUrl, category: 'legal' },
    { id: 'extension-chrome', label: 'Chrome extension', url: sharedCopy.extensionChromeUrl, category: 'community' },
    { id: 'extension-firefox', label: 'Firefox extension', url: sharedCopy.extensionFirefoxUrl, category: 'community' },
  ],
};

export type { InfoContent };
