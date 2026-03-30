export const onboardCopy = {
  // Screen 1: Welcome
  welcomeTitle: "WELCOME",
  letsGo: "LET\u2019S GO",
  appDisplay: "FCK\nFASCISTS",
  tagline: "The fascists won\u2019t\nf*ck themselves. \uD83E\uDD18\uD83C\uDFFD",
  body: "Map, Track, and Scan to see who businesses fund. Political contribution data. In your hands.",
  featureMap: "MAP \u2014 Tap a business. See who it funds.",
  featureTrack: "TRACK \u2014 Log what you avoid. See it on your scorecard.",
  featureScan: "SCAN \u2014 Scan a product. See who\u2019s behind it and where their money goes.",
  featureScorecard: "SCORECARD \u2014 Share what you did every week.",

  // Screen 2: Privacy (WHAT WE DON'T DO)
  privacyTitle: "WHAT WE DON\u2019T DO",
  privacySubhead: "Most apps collect everything. Here\u2019s what this one doesn\u2019t.",
  noSignIn: "NO SIGN-IN",
  noSignInDesc: "No accounts, no email, no user ID. Nothing to create, nothing to leak.",
  noLocation: "NO LOCATION STORAGE",
  noLocationDesc: "GPS is used once to center your map. Coordinates are never saved.",
  noVisitHistory: "NO VISIT HISTORY",
  noVisitHistoryDesc: "All your data \u2014 dates and counts \u2014 is stored on this device only. Never transmitted.",
  noServers: "NO SERVERS",
  noServersDesc: "Everything stays on this device. We only read public data.",
  openSource: "OPEN SOURCE",
  openSourceDesc: "Every line of code is public. ",
  openSourceLink: "Check it yourself.",

  // Screen 3: Permissions (BEFORE WE START)
  permissionsTitle: "BEFORE WE START",
  locTitle: "LOCATION",
  locWhy: "Centers the map on businesses near you.",
  locPromise: "Used once per session. Never stored.",
  locBtn: "ALLOW LOCATION",
  notifTitle: "NOTIFICATIONS",
  notifWhy: "Alerts for scorecard drops, reminders, and the things that matter.",
  notifPromise: "Only the important stuff. Never spam.",
  notifBtn: "ALLOW NOTIFICATIONS",

  // Shared
  requesting: "...",
  confirmed: "GRANTED",
  next: "NEXT",
  skip: "SKIP",
  progressStep: (n: number, total: number) => `Step ${n} of ${total}`,
} as const;
