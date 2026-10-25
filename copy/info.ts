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
  // Alerts toggle (owner decision 2026-10-25). It reflects the system
  // permission; a tap asks iOS while it can, otherwise opens Settings.
  alertsSection: "ALERTS",
  alertsLabel: "Drop alerts",
  alertsDetail: "A ping when your scorecard drops, plus a nudge or two a week.",
  alertsOn: "ON",
  alertsOff: "OFF",
  alertsHintOn: "Opens Settings, where you can turn alerts off",
  alertsHintAsk: "Asks to turn on alerts",
  alertsHintSettings: "Opens Settings, where you can turn alerts on",
} as const;
