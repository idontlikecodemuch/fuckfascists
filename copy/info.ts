export const infoCopy = {
  title: "INFO",
  about: "ABOUT",
  data: "HOW THE DATA WORKS",
  faq: "FAQ",
  links: "LINKS & SOURCE",
  linkText: (label: string) => `${label} \u2197`,
  linkLabel: (label: string) => `${label} \u2014 opens in browser`,
  faqCollapse: "Tap to collapse",
  faqExpand: "Tap to expand answer",
  chevronOpen: "\u25B2",
  chevronClosed: "\u25BC",
} as const;
