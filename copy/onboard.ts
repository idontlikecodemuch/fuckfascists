export const onboardCopy = {
  // Screen 1: Welcome (Sh*tposter)
  appDisplay: "FCK\nFASCISTS",
  tagline: "The fascists won\u2019t\nf*ck themselves. \uD83E\uDD18\uD83C\uDFFD",
  body: "See how businesses fund politics.\nDecide what to do about it. Share.",
  letsGo: "PRESS START",

  // Screen 2: Privacy — WHAT WE DON'T DO (Clark)
  privacyTitle: "WHAT WE DON\u2019T DO",
  privacyBody:
    "No accounts. No tracking. No servers.\n" +
    "Everything is encrypted on your phone\n" +
    "and cleared daily or weekly.",
  openSourceLink: "Public, reviewable code. Take a look \u2192",

  // Screen 3: Permissions — BEFORE WE START (Clark)
  permissionsTitle: "BEFORE WE START",
  locTitle: "LOCATION",
  locWhy: "Show businesses near you on the map.",
  locPromise: "Never sent anywhere.",
  locBtn: "ALLOW LOCATION",
  notifTitle: "NOTIFICATIONS",
  notifWhy: "Know when your weekly scorecard is ready.",
  notifPromise: "Local only \u2014 nothing leaves your phone.",
  notifBtn: "ALLOW NOTIFICATIONS",
  done: "LET\u2019S GO",

  // Shared
  requesting: "...",
  confirmed: "GRANTED",
  next: "NEXT",
  skip: "SKIP",
  progressStep: (n: number, total: number) => `Step ${n} of ${total}`,
} as const;
