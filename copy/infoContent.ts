/**
 * Bundled editorial content for the Info screen.
 *
 * This is the single source of truth for all long-form info text: about/mission,
 * data methodology, FAQ questions & answers, and external links. It ships with
 * the app for offline use and is replaced at runtime if a fresher version is
 * fetched from INFO_CONTENT_URL.
 *
 * UI chrome (section headers, expand/collapse labels, icons) lives in copy/info.ts.
 * Editorial content (this file) can be updated without an app release by editing
 * info.json in the fuckfascists-data repo.
 */
import type { InfoContent } from '../features/Info/types';
import { sharedCopy } from './shared';

export const BUNDLED_INFO_CONTENT: InfoContent = {
  version: '1.0.0',

  about: {
    tagline: 'The fascists won\u2019t f*ck themselves. \uD83E\uDD18\uD83C\uDFFD',
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

  transparency: [
    {
      id: 'data-source',
      title: 'Where does the data come from?',
      body:
        'Every figure comes from FEC.gov \u2014 the official U.S. government record of ' +
        'campaign finance. Every dollar amount in the app links to its original FEC ' +
        'filing. We don\u2019t editorialize. We show what\u2019s on file.',
    },
    {
      id: 'fec-filings',
      title: 'Can I verify the numbers?',
      body:
        'Yes. Tap \u2018See full FEC record\u2019 on any business card. It opens the ' +
        'committee\u2019s page on FEC.gov. Verify any number yourself.',
    },
    {
      id: 'confidence',
      title: 'How does matching work?',
      body:
        'Most businesses match to our bundled list automatically \u2014 high confidence, ' +
        'no badge. When a match comes from searching the FEC database, we show a ' +
        'MATCHED badge and a disclaimer. Tap the FEC link to verify. We never claim ' +
        'more certainty than the data supports.',
    },
    {
      id: 'storage',
      title: 'What\u2019s stored on my device?',
      body:
        'Only your avoidance actions: business IDs and dates you tapped Avoid, and ' +
        'platform avoids you logged. No times, no locations, no identifiers. The only ' +
        'outbound calls are to FEC.gov and GitHub \u2014 public data, one direction. ' +
        'Nothing about you is sent out.',
    },
    {
      id: 'data-currency',
      title: 'How current is the data?',
      body:
        'Contribution data follows FEC reporting cycles and covers every cycle since ' +
        '2016. The entity list ships with the app and updates automatically when ' +
        'connected. Both are versioned and public on GitHub.',
    },
    {
      id: 'limitations',
      title: 'What doesn\u2019t the app cover?',
      body:
        'V1 covers corporate PAC contributions (Schedule B). Individual executive ' +
        'donations (Schedule A) and independent expenditures (Schedule E) are planned ' +
        'for future versions. State-level campaign finance data is not included.',
    },
  ],

  faq: [
    {
      id: 'trust',
      q: 'Why should I trust this data?',
      a:
        'Every figure comes directly from FEC.gov. Uncertain matches are labeled. ' +
        'Every number links to its source. We never show data we can\u2019t cite.',
    },
    {
      id: 'wrong-match',
      q: 'What if a business is misidentified?',
      a:
        'Matches from the FEC search always show a MATCHED badge and a \u2018verify ' +
        'before acting\u2019 disclaimer. Tap the FEC link to check. If something is ' +
        'wrong, let us know.',
    },
    {
      id: 'tracking',
      q: 'Does the app track me?',
      a:
        'No. No accounts, no user IDs, no analytics. GPS is accessed only when you ' +
        'use the map and is never saved. The browser extension never stores which ' +
        'sites you visit.',
    },
    {
      id: 'partisan',
      q: 'Is the app partisan?',
      a:
        'This is a project about the outsized impact money has on politics. The app ' +
        'shows both R: and D: contributions for every entity. All data comes from ' +
        'FEC.gov. You see what\u2019s on file \u2014 you draw your own conclusions. We ' +
        'trust the data and we trust you.',
    },
    {
      id: 'report-error',
      q: 'How do I report an error or add a business?',
      a:
        `See something wrong? Email ${sharedCopy.contactEmail} or open an issue on ` +
        'GitHub. The entity list is open source \u2014 anyone can submit a correction.',
    },
    {
      id: 'extension-sync',
      q: 'Does the browser extension sync with the app?',
      a:
        'Not yet. Sync requires a backend, which we deliberately don\u2019t have. The ' +
        'extension has its own weekly summary. Sync is planned once a privacy-preserving ' +
        'approach is designed.',
    },
    {
      id: 'internet',
      q: 'Does the app need internet?',
      a:
        'The app was built to work offline \u2014 bundled data ships with every install ' +
        'as a privacy measure. An internet connection may be needed for live FEC lookups, ' +
        'barcode scanning, and entity list updates.',
    },
    {
      id: 'edit-platforms',
      q: 'How do I edit my platform list?',
      a: 'Tap Edit at the top of the Track tab. Add or remove platforms anytime.',
    },
    {
      id: 'extension',
      q: 'Is there a browser extension?',
      a:
        'Yes. Available for Chrome and Firefox. It flags businesses as you browse and ' +
        'lets you log avoids without opening the app. Same privacy rules \u2014 no ' +
        'browsing history stored, ever.',
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
