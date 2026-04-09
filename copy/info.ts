export const infoCopy = {
  tabLabel: "INFO",
  title: "INFO",
  about: "ABOUT",
  links: "LINKS & SOURCE",
  linkText: (label: string) => `${label} \u2197`,
  linkLabel: (label: string) => `${label} \u2014 opens in browser`,
  faqCollapse: "Tap to collapse",
  faqExpand: "Tap to expand answer",
  versionLabel: "App version",
  categoryData: "THE DATA",
  categoryPrivacy: "PRIVACY",
  categoryApp: "THE APP",
} as const;
