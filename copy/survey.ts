export const surveyCopy = {
  title: "WEEKLY CHECK-IN",
  score: (avoided: number, total: number) => `${avoided} / ${total} avoided`,
  loading: "Loading this week's survey",
  checklist: "Platform checklist",
  rowAvoided: (name: string) => `${name}. Avoided this week.`,
  rowNotAvoided: (name: string) => `${name}. Not yet marked avoided.`,
  rowSubtitle: (company: string, ceo: string) => `${company} \u00b7 CEO: ${ceo}`,
} as const;
