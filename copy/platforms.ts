export const platformsCopy = {
  title: "TRACK",
  weekLabel: (weekOf: string) => `Week of ${weekOf}`,
  score: (total: number) => `${total} avoided this week`,
  loading: "Loading platform data",
  checklist: "Platform checklist",
  avoidBtn: "AVOID",
  avoidedBtn: "DONE",
  avoidedLabel: (name: string) => `${name}. Avoided today.`,
  notAvoidedLabel: (name: string) => `${name}. Tap to record avoidance.`,
  rowSubtitle: (company: string, ceo: string) => `${company} \u00b7 CEO: ${ceo}`,
  countLabel: (n: number) => `\u00d7${n}`,
  countA11y: (n: number, name: string) => `Avoided ${name} ${n} time${n === 1 ? '' : 's'} this week`,

  // Setup screen
  setupTitle: "SELECT YOUR TARGETS",
  setupSubhead: "Choose the platforms you want to track. You can change this anytime.",
  setupDone: "DONE",
  editBtn: "EDIT",
  editLabel: "Edit platform selection",

  // Day circles
  dayLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as readonly string[],
  dayCheckedLabel: (day: string, name: string) => `${day}: ${name} avoided`,
  dayUncheckedLabel: (day: string, name: string) => `${day}: Tap to log ${name} avoidance`,
  dayFutureLabel: (day: string) => `${day}: Future`,
  expandLabel: (name: string) => `Expand ${name} day details`,
  collapseLabel: (name: string) => `Collapse ${name} day details`,

  // Parent company group headers
  groupHeader: (name: string, total: number) => `${name} \u2014 ${total}\u00d7`,
  arenaTitle: "THE ARENA",

  // Arena sprite tap reactions (cosmetic only — no data logged)
  spriteReactions: ["ow!", "stop!", "no!", "hey!"] as readonly string[],

  // Arena speech bubble (cosmetic tap FX)
  arenaTapA11y: (name: string) => `${name} sprite. Tap for reaction.`,

  // Nudge banner (app-wide, Thursday)
  nudgeTitle: "Your card drops tomorrow.",
  nudgeBody: "Any more fascists you f*cked this week?",
  nudgeBanner: "Scorecard drops tomorrow \u2014 log your avoids!",
  nudgeDismiss: "DISMISS",
  nudgeDismissA11y: "Dismiss nudge banner",

  // Short parent company names for group headers
  shortParentNames: {
    'Meta Platforms': 'META',
    'Amazon.com Inc': 'AMAZON',
    'Alphabet Inc': 'ALPHABET',
    'X Corp': 'X CORP',
  } as Record<string, string>,
} as const;
