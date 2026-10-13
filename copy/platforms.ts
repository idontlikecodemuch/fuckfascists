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

  // Early-week push notification (Monday or Tuesday). Owner-written
  // 2026-10-13: friendly, about informed choices as much as logging.
  // EARLY_WEEK_NUDGE_LINES gives each line its days, its hours when it names
  // a moment (coffee, lunch), and the tab a tap opens. Leave the "scorecard
  // incoming" angle to the Thursday nudge.
  earlyNudges: {
    mondayCure: { title: "Case of the Mondays?", body: "Known cure: log an avoid. Side effects include feeling great." },
    mondayFairGame: { title: "You can\u2019t avoid Monday.", body: "Everything else is fair game. \u{1F918}" },
    tuesdayYesterday: { title: "Yesterday still counts.", body: "Avoided an app Monday? Tap it in. Today\u2019s wide open." },
    tuesdayTaco: { title: "It\u2019s Taco Tuesday \u{1F32E}", body: "Tacos: mandatory. Where you get them: your call." },
    tuesdayWhyNot: { title: "It\u2019s Tuesday. Why not?", body: "Low stakes, big energy. Ready to see where your money goes?" },
    lunch: { title: "Lunchtime?", body: "See if they spend money on politics before you order." },
    coffee: { title: "Back to the grind \u2615", body: "Grabbing a coffee? See who they support." },
    newWeek: { title: "It\u2019s a new week!", body: "Don\u2019t forget to log your avoids." },
  },
  earlyNudgeChannelName: "Early-week nudge",

  // Perfect week
  perfectWeekTitle: "PERFECT WEEK",
  perfectWeekBody: (name: string) => `You avoided ${name} every single day. \uD83E\uDD18\uD83C\uDFFD`,
  perfectWeekA11y: (name: string) => `Perfect week \u2014 avoided ${name} all seven days`,
} as const;
