import { sharedCopy } from './shared';

export const launchCopy = {
  tapToStart: "PRESS START",
  tapLabel: "Tap anywhere to dismiss and enter the app",
  messages: [
    sharedCopy.brandTagline,
    "Here\u2019s the data. Your move.",
    "Who are you FCKing today?",
    "Financial contributions, on file. \uD83E\uDD18\uD83C\uDFFD",
    "The data is public. Now it\u2019s useful.",
    "Someone\u2019s PAC is showing.",
    "Tap. Avoid. Share. Repeat.",
  ] as readonly string[],
} as const;
