export const platformsCopy = {
  tabLabel: "TRACK",
  // Header
  weekLabel: (weekOf: string) => `Week of ${weekOf}`,
  editPlatforms: "Edit",
  editPlatformsA11y: "Edit platform selection",
  avoidCountLabel: (n: number) => `${n}\u00d7 this week`,
  pumpUp: "NOTHING AVOIDED YET",
  loading: "Loading platform data",
  checklist: "Platform checklist",

  // Avoid button
  avoidBtn: "AVOID",
  avoidedBtn: "\u2713",
  avoidBtnA11y: (name: string) => `Avoid ${name} today`,
  avoidedBtnA11y: (name: string) => `${name} avoided today. Tap to expand day details.`,

  // Platform row
  countLabel: (n: number) => `${n}\u00d7`,
  countDash: "\u2014",
  countA11y: (n: number, name: string) => `Avoided ${name} ${n} time${n === 1 ? '' : 's'} this week`,
  /** @deprecated — use theme.accordion.collapsedIndicator / expandedIndicator */
  expandIndicator: "+",
  /** @deprecated — use theme.accordion.collapsedIndicator / expandedIndicator */
  collapseIndicator: "\u2212",
  rowSubtitle: (company: string, ceo: string) => `${company} \u00b7 CEO: ${ceo}`,

  // Setup screen
  setupTitle: "CHOOSE PLATFORMS",
  setupSubhead: "Pick the platforms you want to avoid. Change anytime.",
  setupDone: "DONE",

  // Day circles
  dayLabels: ['S', 'S', 'M', 'T', 'W', 'T', 'F'] as readonly string[],
  dayCheckedLabel: (day: string, name: string) => `${day}: ${name} avoided. Tap to remove`,
  dayUncheckedLabel: (day: string, name: string) => `${day}: Tap to log ${name} avoidance`,
  dayFutureLabel: (day: string) => `${day}: Future`,
  expandLabel: (name: string) => `Expand ${name} day details`,
  collapseLabel: (name: string) => `Collapse ${name} day details`,

  // Parent company group headers
  groupHeaderA11y: (name: string, total: number) => `${name} \u2014 ${total}\u00d7 this week`,

  // See File link on top-level rows (singletons + group headers).
  seeFileLabel: "SEE FILE",
  seeFileA11y: (name: string) => `See file for ${name}`,

  // Arena sprite tap reactions (cosmetic only — no data logged)
  spriteReactions: ["ow!", "quit it!", "no!", "hey!", "FCK!"] as readonly string[],
  arenaTapA11y: (name: string) => `${name} sprite. Tap for reaction.`,

  // Dev tools (temporary)
  clearData: "Clear data",
  clearDataA11y: "Clear all platform avoid data",
  clearDataConfirm: "All avoid data cleared.",

  // Nudge banner (app-wide, Thursday) + push notification
  // Push notification uses nudgeTitle/nudgeBody; in-app banner uses
  // nudgeBannerTitle (Bungee uppercase) + nudgeBody.
  nudgeTitle: "Scorecard incoming",
  nudgeBody: "Any avoids on file?",
  nudgeChannelName: "Thursday nudge",
  nudgeBannerTitle: "SCORECARD INCOMING",
  nudgeDismissA11y: "Dismiss nudge banner",

  // Early-week push notification (Mon/Tue, random daytime minute). One
  // title/body pair is picked per week, never the same pair two weeks
  // running. Angle: a fresh week and the first move. Leave the deadline /
  // "scorecard incoming" angle to the Thursday nudge. Never name a weekday:
  // the same line can land on Monday or Tuesday. With
  // EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE on, it only fires while nothing is
  // logged yet that week, so "first" and "clean slate" stay true.
  earlyNudges: [
    { title: "Insert coin", body: "New week. New card. Same suits." },
    { title: "Round 1", body: "Who\u2019s taking the first hit this week?" },
    { title: "New week loaded", body: "Press start." },
    { title: "Your money. Your move.", body: "Who\u2019s not getting it this week?" },
    { title: "The week is young", body: "Plenty of time to make them feel it." },
    { title: "Fresh week", body: "Who are you FCKing first?" },
    { title: "Clean slate", body: "It won\u2019t stay clean for long." },
    { title: "Window\u2019s open", body: "New week. The files are ready when you are." },
  ] as readonly { readonly title: string; readonly body: string }[],
  earlyNudgeChannelName: "Early-week nudge",

  // Perfect week
  perfectWeekTitle: "PERFECT WEEK",
  perfectWeekBody: (name: string) => `You avoided ${name} every single day. \uD83E\uDD18\uD83C\uDFFD`,
  perfectWeekA11y: (name: string) => `Perfect week \u2014 avoided ${name} all seven days`,
} as const;
