import { sharedCopy } from './shared';

export const scorecardCopy = {
  // Tab + header
  tabLabel: "SCORECARD",
  title: "SCORECARD",
  dropsLabel: "DROPS THIS FRIDAY",
  previewStamp: "PREVIEW",
  previewA11y: "Preview \u2014 this is not the official weekly drop",

  // Date range
  dateRange: (start: string, end: string) => `${start} \u2014 ${end}`,

  // Hero count (preview)
  heroLabel: "avoids",
  heroWeek: "THIS WEEK",

  // Sentence bookends (rendered card + preview)
  framingOpen: "I FCKd",
  framingClose: (n: number) => `${n}\u00d7 this week`,

  // Person rows
  personCount: (n: number) => `${n}\u00d7`,
  platformList: (platforms: string[]) => platforms.join(' \u00b7 '),
  othersLine: (n: number) => `+ ${n} more`,

  // Share
  shareBtn: "SHARE",
  shareLabel: "Share your scorecard",

  // Card presentation
  dismissLabel: "Done",

  // Loader
  loaderText: "Creating your scorecard...",

  // Archive
  pastCardsLabel: "Past scorecards",

  // Empty state
  emptyState: "Hit the Map. Hit Track.\nMake them feel it.",

  // Footer (rendered card)
  tagline: "The fascists won\u2019t f*ck themselves.",
  cta: sharedCopy.siteUrl,
  dataAttribution: "DATA: FEC.GOV",
} as const;
