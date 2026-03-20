export const platformsCopy = {
  // Header
  weekLabel: (weekOf: string) => `Week of ${weekOf}`,
  editPlatforms: "Edit platforms",
  editPlatformsA11y: "Edit platform selection",
  avoidCountLabel: (n: number) => `${n}\u00d7 avoids this week`,
  pumpUp: "LET'S GO!!!!",
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
  expandIndicator: "+",
  collapseIndicator: "\u2212",
  rowSubtitle: (company: string, ceo: string) => `${company} \u00b7 CEO: ${ceo}`,

  // Setup screen
  setupTitle: "SELECT YOUR TARGETS",
  setupSubhead: "Choose the platforms you want to track. You can change this anytime.",
  setupDone: "DONE",

  // Day circles
  dayLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as readonly string[],
  dayCheckedLabel: (day: string, name: string) => `${day}: ${name} avoided`,
  dayUncheckedLabel: (day: string, name: string) => `${day}: Tap to log ${name} avoidance`,
  dayFutureLabel: (day: string) => `${day}: Future`,
  expandLabel: (name: string) => `Expand ${name} day details`,
  collapseLabel: (name: string) => `Collapse ${name} day details`,

  // Parent company group headers
  groupHeaderA11y: (name: string, total: number) => `${name} \u2014 ${total}\u00d7 this week`,

  // Arena sprite tap reactions (cosmetic only \u2014 no data logged)
  spriteReactions: ["ow!", "stop!", "no!", "hey!"] as readonly string[],
  arenaTapA11y: (name: string) => `${name} sprite. Tap for reaction.`,

  // Short parent company names for group headers
  shortParentNames: {
    'Meta Platforms': 'META',
    'Amazon.com Inc': 'AMAZON',
    'Alphabet Inc': 'ALPHABET',
    'X Corp': 'X CORP',
  } as Record<string, string>,

  // Dev tools (temporary)
  clearData: "Clear data",
  clearDataA11y: "Clear all platform avoid data",
  clearDataConfirm: "All avoid data cleared.",

  // Nudge banner (app-wide, Thursday)
  nudgeTitle: "Your card drops tomorrow.",
  nudgeBody: "Any more fascists you f*cked this week?",
  nudgeBanner: "Scorecard drops tomorrow \u2014 log your avoids!",
  nudgeDismiss: "DISMISS",
  nudgeDismissA11y: "Dismiss nudge banner",
} as const;
