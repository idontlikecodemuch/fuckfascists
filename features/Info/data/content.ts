import type { InfoContent } from '../types';

/**
 * Bundled default content — always available offline.
 * To update without an app release, edit info.json in the fuckfascists-data
 * GitHub repo. The app fetches it on launch and falls back to this if offline.
 */
export const BUNDLED_CONTENT: InfoContent = {
  version: '1.0.0',

  about: {
    tagline: 'Your money. Your power. Your choice.',
    description:
      'F*ck Fascists is a privacy-first, gamified app that helps you avoid ' +
      'businesses and platforms that donate to Republican campaigns and ' +
      'authoritarian political movements — and celebrate every time you do. ' +
      'It is organized as a nonprofit and is fully open-source.',
    organization: 'Open-source nonprofit project. See the repo for governance details.',
    sourceCodeUrl: 'https://github.com/[org]/fuckfascists',
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
        'at fec.gov, the authoritative government source. Tap "VIEW FEC FILING" ' +
        'on any business card to open the committee\'s official page. You can ' +
        'verify every number yourself without taking our word for it.',
    },
    {
      id: 'confidence',
      title: 'What do HIGH and MEDIUM confidence mean?',
      body:
        'When you scan a business, we match its name against the FEC committee ' +
        'database using a Jaro-Winkler similarity score. HIGH (≥ 0.85) means a ' +
        'near-certain match. MEDIUM (≥ 0.60) means a likely match — always shown ' +
        'with a disclaimer and a link to verify. We never claim more certainty than the data supports.',
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
        'you tapped "Avoided" (no times, no locations), and the platform IDs ' +
        'you checked off each week. Nothing else. No coordinates, no browsing ' +
        'history, no identifiers.',
    },
    {
      id: 'no-server',
      title: 'Is there a server?',
      body:
        'Not in v1. The only outbound calls are to the FEC API (from your device ' +
        'directly) and to fetch the entity list / drop schedule from GitHub. ' +
        'There is no backend, no telemetry, and no analytics.',
    },
  ],

  faq: [
    {
      id: 'trust',
      q: 'Why should I trust this data?',
      a:
        'Every figure comes directly from FEC.gov — the official US government ' +
        'record of campaign finance. The app always shows the confidence level ' +
        'of each match and links directly to the FEC source. We never show data we cannot cite.',
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
      id: 'medium-confidence',
      q: 'What should I do with a MEDIUM confidence match?',
      a:
        'Tap the "VIEW FEC FILING" link in the business card and verify the match ' +
        'yourself before tapping "Avoided". MEDIUM means the name similarity is ' +
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
        'Cross-device sync requires a backend, which we deliberately do not have ' +
        'in v1. The extension has its own weekly summary in the popup. Sync is ' +
        'planned for v2 once a privacy-preserving architecture is designed.',
    },
  ],

  links: [
    { id: 'fec',          label: 'FEC.gov (campaign finance data)', url: 'https://www.fec.gov',                                   category: 'source' },
    { id: 'source-code',  label: 'Source code (GitHub)',      url: 'https://github.com/[org]/fuckfascists',                   category: 'community' },
    { id: 'data-repo',    label: 'Entity list (GitHub)',      url: 'https://github.com/[org]/fuckfascists-data',              category: 'community' },
    { id: 'issues',       label: 'Report a bug or correction', url: 'https://github.com/[org]/fuckfascists/issues',           category: 'community' },
    { id: 'privacy',      label: 'Privacy policy',            url: 'https://github.com/[org]/fuckfascists/blob/main/PRIVACY.md', category: 'legal' },
  ],
};
