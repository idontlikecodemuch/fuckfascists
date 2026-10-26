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
  // Info notifications controls (owner decisions 2026-10-25/26): a bell + On/Off
  // readout at the top right of the header and a menu line above THE DATA. Both
  // show the system permission; a tap asks iOS while it can, otherwise opens
  // the app's notification settings.
  notificationsLabel: "Notifications",
  notificationsA11y: "Notifications: your scorecard drop and a nudge or two a week",
  notificationsOn: "On",
  notificationsOff: "Off",
  notificationsHintOn: "Opens Settings, where you can turn notifications off",
  notificationsHintAsk: "Asks to turn on notifications",
  notificationsHintSettings: "Opens Settings, where you can turn notifications on",
} as const;
