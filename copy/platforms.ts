export const platformsCopy = {
  title: "TRACK",
  weekLabel: (weekOf: string) => `Week of ${weekOf}`,
  score: (total: number) => `${total} avoided this week`,
  loading: "Loading platform data",
  checklist: "Platform checklist",
  avoidBtn: "AVOID",
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

  // Thursday nudge notification
  nudgeTitle: "Your card drops tomorrow.",
  nudgeBody: "Any more fascists you f*cked this week?",
} as const;
