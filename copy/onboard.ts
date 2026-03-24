export const onboardCopy = {
  // Screen 1: Welcome + How It Works (combined)
  welcomeTitle: "WELCOME",
  letsGo: "PRESS START",
  appDisplay: "F*CK\nFASCISTS",
  tagline: "The fascists won\u2019t\nf*ck themselves. \uD83E\uDD18",
  body: "Look up businesses. See who they fund. Decide where to spend.",
  note: "Open-source \u00b7 Nonprofit \u00b7 No tracking",
  featureMap: "MAP \u2014 Flag GOP donors near you",
  featureTrack: "TRACK \u2014 Log the platforms you skipped",
  featureScorecard: "SCORECARD \u2014 See your impact every Friday",

  // Screen 3: Permissions (location + notifications combined)
  permissionsTitle: "SET UP",
  locTitle: "FIND NEARBY BUSINESSES",
  locWhy: "We use your location to center the map on your neighborhood.",
  locPromise: "GPS is session-only \u2014 never stored, never transmitted.",
  locBtn: "ALLOW LOCATION",
  notifTitle: "NEVER MISS THE DROP",
  notifWhy: "Your weekly scorecard drops every Friday.",
  notifPromise: "Notifications are local-only. No server push.",
  notifBtn: "ALLOW NOTIFICATIONS",

  // Screen 2: Privacy (YOUR DATA — privacy promise before permission request)
  privacyTitle: "YOUR DATA",
  noAccounts: "NO ACCOUNTS",
  noAccountsDesc: "No sign-in, no email, no user ID. Ever.",
  noLocation: "NO LOCATION STORAGE",
  noLocationDesc: "GPS is session-only. Coordinates never written to disk.",
  noHistory: "NO HISTORY",
  noHistoryDesc: "Only records what you actively avoided \u2014 never what you visited.",
  onDevice: "ON-DEVICE ONLY",
  onDeviceDesc: "All data stays on your phone. No servers, no syncing.",
  openSource: "OPEN SOURCE",
  openSourceDesc: "Every line of code is public.",
  ourPromise: "OUR PROMISE",

  // Shared
  requesting: "...",
  confirmed: "GRANTED",
  next: "NEXT",
  skip: "SKIP",
  done: "LET\u2019S GO",
  progressStep: (n: number, total: number) => `Step ${n} of ${total}`,
} as const;
