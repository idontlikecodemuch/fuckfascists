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
} as const;
