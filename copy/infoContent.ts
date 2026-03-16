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

export const BUNDLED_INFO_CONTENT: InfoContent = {
  version: '1.0.0',

  about: {
    tagline: 'The fascists won\u2019t f*ck themselves. \uD83E\uDD18',
    description:
      'Look up businesses. See who they fund. Decide where to spend.',
    organization: 'Open-source nonprofit project. See the repo for governance details.',
    sourceCodeUrl: 'https://github.com/idontlikecodemuch/fuckfascists',
  },

  transparency: [
    {
      id: 'data-source',
      title: 'Where does the data come from?',
      body:
        'All donation figures come directly from the Federal Election Commission ' +
        '(FEC) — the official US government source for campaign finance data, ' +
        'available at fec.gov. Every dollar figure shown in the app links back ' +
        'to its original FEC filing.',
    },
    {
      id: 'fec-filings',
      title: 'Can I verify the numbers myself?',
      body:
        'Yes — every donation figure links directly to the original FEC filing ' +
        'at fec.gov, the authoritative government source. Tap \u2018See full FEC record\u2019 ' +
        'on any business card to open the committee\'s official page. You can ' +
        'verify every number yourself without taking our word for it.',
    },
    {
      id: 'confidence',
      title: 'What does the MATCHED badge mean?',
      body:
        'When you look up a business, we match its name against the FEC committee ' +
        'database. Most businesses match with high confidence and show no badge. ' +
        'When we\u2019re less certain, a MATCHED badge and disclaimer appear \u2014 always ' +
        'with a link to verify on FEC.gov. We never claim more certainty than the data supports.',
    },
    {
      id: 'entity-list',
      title: 'What is the curated entity list?',
      body:
        'A community-maintained JSON file covering the top GOP-donating companies, ' +
        'retailers, and platforms. It ships with the app for offline use and ' +
        'updates automatically from GitHub. Anyone can submit corrections or ' +
        'additions via a pull request.',
    },
    {
      id: 'storage',
      title: 'What does the app store on my device?',
      body:
        'Only avoidance actions you explicitly take: the business IDs and dates ' +
        'you tapped Avoid (no times, no locations), and the platform avoid events ' +
        'you logged. Nothing else. No coordinates, no browsing ' +
        'history, no identifiers.',
    },
    {
      id: 'no-server',
      title: 'Is there a server?',
      body:
        'The only outbound calls are to the FEC API (from your device ' +
        'directly) and to fetch the entity list / drop schedule from GitHub. ' +
        'There is no backend, no telemetry, and no analytics.',
    },
  ],

  faq: [
    {
      id: 'trust',
      q: 'Why should I trust this data?',
      a:
        'Every figure comes directly from FEC.gov \u2014 the official US government ' +
        'record of campaign finance. Uncertain matches are always labeled and ' +
        'link directly to FEC.gov so you can verify. We never show data we cannot cite.',
    },
    {
      id: 'wrong-match',
      q: 'What if a business is misidentified?',
      a:
        'MEDIUM-confidence matches always show a "verify before acting" warning. ' +
        'Tap the FEC.gov link to check the source yourself. If something is ' +
        'wrong, please open an issue or PR in the data repo — the community ' +
        'maintains the entity list.',
    },
    {
      id: 'tracking',
      q: 'Does the app track me?',
      a:
        'No. There are no accounts, no user IDs, and no analytics. Your GPS is ' +
        'accessed only when you tap the locate button and is never written to ' +
        'disk. The browser extension never stores which sites you visit.',
    },
    {
      id: 'why-republican',
      q: 'Why focus on Republican donations?',
      a:
        'The app is built on the premise that donations to the Republican Party ' +
        'and aligned PACs since 2015 have funded an authoritarian political ' +
        'project. Users can review the data and draw their own conclusions — ' +
        'every figure links to its source on FEC.gov so nothing is taken on faith.',
    },
    {
      id: 'add-business',
      q: 'Can I add a business or correct an entry?',
      a:
        'Yes. The entity list is open-source on GitHub. Open a pull request with ' +
        'the canonical name, aliases, domains, and FEC committee ID. The ' +
        'community reviews all submissions.',
    },
    {
      id: 'matched-badge',
      q: 'What does the MATCHED badge mean?',
      a:
        'Tap \u2018See full FEC record\u2019 on the business card and verify the match ' +
        'yourself before tapping Avoid. MATCHED means the name similarity is ' +
        'strong but not conclusive.',
    },
    {
      id: 'free',
      q: 'Is this free?',
      a:
        'Yes, always. The app is a nonprofit project. There are no subscriptions, ' +
        'no ads, and no in-app purchases. Donations to support the project are ' +
        'welcome — details in the GitHub repo.',
    },
    {
      id: 'extension-sync',
      q: "Why doesn't the browser extension sync with the app?",
      a:
        'Cross-device sync requires a backend, which we deliberately do not have. ' +
        'The extension has its own weekly summary in the popup. Sync is ' +
        'planned once a privacy-preserving architecture is designed.',
    },
    {
      id: 'internet',
      q: 'Does the app need internet?',
      a:
        'Most data is bundled with the app and works offline. Some lookups check ' +
        'FEC.gov directly, which requires a connection.',
    },
    {
      id: 'edit-platforms',
      q: 'How do I edit my platform list?',
      a:
        'Tap EDIT at the top of the Platforms tab. You can add or remove platforms ' +
        'anytime. Your selections carry over week to week.',
    },
  ],

  links: [
    { id: 'fec',          label: 'FEC.gov (campaign finance data)', url: 'https://www.fec.gov',                                   category: 'source' },
    { id: 'source-code',  label: 'Source code (GitHub)',      url: 'https://github.com/idontlikecodemuch/fuckfascists',                   category: 'community' },
    { id: 'data-repo',    label: 'Entity list (GitHub)',      url: 'https://github.com/idontlikecodemuch/fckfascists-data',              category: 'community' },
    { id: 'issues',       label: 'Report a bug or correction', url: 'https://github.com/idontlikecodemuch/fuckfascists/issues',           category: 'community' },
    { id: 'privacy',      label: 'Privacy policy',            url: 'https://github.com/idontlikecodemuch/fuckfascists/blob/main/PRIVACY.md', category: 'legal' },
  ],
};

export type { InfoContent };
