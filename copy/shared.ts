// Single source of truth for the brand domain. All site-derived URLs build
// from SITE_ORIGIN; consumers should never hardcode the domain.
const SITE_DOMAIN = "FCKfascists.com";
const SITE_ORIGIN = `https://${SITE_DOMAIN}`;

export const sharedCopy = {
  appName: "FCK FASCISTS",
  // Apostrophe is straight ASCII (U+0027), not curly (U+2019). The curly
  // apostrophe was dropped entirely during react-native-view-shot capture
  // of the rendered scorecard image \u2014 the rendered "won't" read as "wont"
  // on device. Straight apostrophe renders as a tall thin vertical line
  // that survives both font-render quirks and JPG compression at q=0.88.
  brandTagline: "The fascists won't FCK themselves.",
  brandTaglineStacked: "The fascists won't\nFCK themselves.",
  siteUrl: SITE_DOMAIN,
  repoUrl: "https://github.com/idontlikecodemuch/fuckfascists",
  dataRepoUrl: "https://github.com/idontlikecodemuch/fckfascists-data",
  issuesUrl: "https://github.com/idontlikecodemuch/fuckfascists/issues",
  privacyUrl: `${SITE_ORIGIN}/privacy`,
  contactEmail: "info@fckfascists.com",
  extensionChromeUrl: `${SITE_ORIGIN}/extension/chrome`,
  extensionFirefoxUrl: `${SITE_ORIGIN}/extension/firefox`,
  /** Close/cancel glyph (\u2715). Standardized across the app after the
   *  BusinessCard manila-folder reskin (#102/#105). Use for the visible
   *  control; dismissLabel stays as the spoken a11y label. */
  dismissIcon: "\u2715",
  dismissLabel: "Dismiss",
  partyR: "R:",
  partyD: "D:",
  partyO: "O:",
  verified: "VERIFIED",
  matched: "MATCHED",
  confidenceHigh: "HIGH",
  confidenceMedium: "MEDIUM",
  warningIcon: "\u26A0",
  checkmark: "\u2713",
  donationUnavail: "Contribution data not available.",
  donationNoneOnFile: "No contribution data on file.",
  totalSince: (rAmt: string, dAmt: string) => `Total since 2016: R: ${rAmt} \u00b7 D: ${dAmt}`,
  activeCycles: (cycles: string) => `Active cycles: ${cycles}`,
  confidenceA11y: (label: string) => `Confidence: ${label}`,
  totalSince2016: "TOTAL SINCE 2016",
  recentCycleShort: (rAmt: string, dAmt: string, cycle: string) => `Recent (${cycle}): R: ${rAmt} \u00b7 D: ${dAmt}`,
  sourcesLabel: "Sources (FEC):",
  donationsLinkSuffix: "contributions",
} as const;
