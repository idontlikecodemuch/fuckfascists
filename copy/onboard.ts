import { sharedCopy } from './shared';

export const onboardCopy = {
  // Screen 1: Welcome (Sh*tposter)
  appDisplay: "FCK\nFASCISTS",
  welcomeTitle: "WELCOME",
  tagline: sharedCopy.brandTaglineStacked,
  body: "See how businesses fund politics.\nDecide what to do about it. Share.",
  letsGo: "PRESS START",
  // Feature row on Welcome (per #157) — short labels paired with tab-bar icons
  featureMap: "Map",
  featureTrack: "Track",
  featureScan: "Scan",

  // Screen 2: How-to memo (Clark)
  howToTitle: "HOW TO: FCK",
  clarkIntro:
    "Hi, I\u2019m Clark the Clerk. Your public records clerk. I\u2019m here to help.",
  clarkData:
    "I\u2019ve organized hundreds of gigabytes of FEC donations, state and local campaign data, and UPC codes to make the information useful.",
  howToMapTitle: "MAP",
  howToMapBody:
    "Use the map to explore companies around you. Tap or search a business, and I\u2019ll pull the file and drop a flag so you can keep track.",
  howToTrackTitle: "TRACK",
  howToTrackBody:
    "Set up the platforms you use regularly. Tap AVOID when you skip one, and track your avoids for the week.",
  howToScanTitle: "SCAN",
  howToScanBody:
    "Check product UPCs. If we have the parent company on file, I\u2019ll show you the record.",
  howToScorecardTitle: "SCORECARD",
  howToScorecardBody: "Your avoids count toward this week\u2019s scorecard.",
  howToPrivacy:
    "No Accounts. No Tracking. No servers. Everything is encrypted on your phone, and cleared daily or weekly. Never transmitted. Never tracked.",
  howToSignature: "Financial contributions, on file. \u2014 Clark",

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
