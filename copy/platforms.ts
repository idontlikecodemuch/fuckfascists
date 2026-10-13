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

  // Early-week push notification (random daytime minute, Monday or Tuesday).
  // Owner-picked 2026-10-13: friendly, about informed choices as much as
  // logging. Monday lines only go out on Monday and Tuesday lines on Tuesday
  // (EARLY_WEEK_NUDGE_LINES maps each to its day and the tab a tap opens).
  // Leave the "scorecard incoming" angle to the Thursday nudge. Lines can
  // land anywhere from 10am to 6pm, so no time-of-day words.
  earlyNudges: {
    mondayCure: { title: "Got a case of the Mondays?", body: "Known cure: one avoid. Side effects include feeling great." },
    mondayAutopilot: { title: "Monday autopilot", body: "Thumb heading for the usual app? Make it an avoid." },
    mondayFairGame: { title: "Ugh, Mondays", body: "You can\u2019t avoid Monday. Everything else is fair game." },
    mondayNewWeek: { title: "It\u2019s a new week", body: "Don\u2019t forget to log your avoids." },
    tuesdayYesterday: { title: "Yesterday still counts", body: "Avoided an app Monday? Tap it in. Today\u2019s wide open." },
    tuesdayTaco: { title: "It\u2019s Taco Tuesday", body: "Tacos: mandatory. Where you get them: your call." },
    tuesdayWhyNot: { title: "It\u2019s Tuesday. Why not?", body: "Low stakes, big energy. Log your first avoid of the week." },
    tuesdayBite: { title: "Grabbing a bite?", body: "See if they spend money on politics before you order." },
  },
  earlyNudgeChannelName: "Early-week nudge",

  // Perfect week
  perfectWeekTitle: "PERFECT WEEK",
  perfectWeekBody: (name: string) => `You avoided ${name} every single day. \uD83E\uDD18\uD83C\uDFFD`,
  perfectWeekA11y: (name: string) => `Perfect week \u2014 avoided ${name} all seven days`,
} as const;
