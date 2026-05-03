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

  // Rendered card headline \u2014 "I FCK'D N\u00d7" lives together at the top of the
  // content section. Closing beat at the bottom-right is just heroWeek.
  heroPrefix: "I FCK'D",

  // Person rows
  personCount: (n: number) => `${n}\u00d7`,
  platformList: (platforms: string[]) => platforms.join(' \u00b7 '),
  othersLine: (n: number) => `+ ${n} MORE`,

  // Share
  shareBtn: "SHARE",
  shareLabel: "Share your scorecard",
  shareHint: "Swipe up or tap to share",

  // Card presentation
  dismissLabel: "Done",

  // Loader — shown during the capture-then-purge transition. Two-line
  // privacy-proving copy: the second line is literally true at the moment
  // it's shown (raw events are being deleted as the PNG writes). Sh*tposter
  // voice, first-person, non-vulgar.
  loaderText: "Locking in my card.\nShredding the data.",

  // Archive
  pastCardsLabel: "Past scorecards",

  // Empty state — `{map}` and `{track}` tokens are rendered as tappable
  // cross-tab links by LivePreview's EmptyHint. Do not remove the tokens;
  // plain "Map"/"Track" strings regressed to unlinked text (#84).
  emptyState: "Hit the {map}. Hit {track}.\nMake them feel it.",

  // Footer (rendered card)
  tagline: "The fascists wont FCK themselves.",
  cta: sharedCopy.siteUrl,
  dataAttribution: "DATA: FEC.GOV",
} as const;
