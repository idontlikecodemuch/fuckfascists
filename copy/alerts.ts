// Notification permission prompts outside onboarding (owner decision
// 2026-10-25). The in-app banner shows while alerts are off: the first open
// inside a drop's 48h window, every other drop, at most three times.
export const alertsCopy = {
  bannerTitle: "NOTIFICATIONS OFF",
  bannerBody: "Tap to get a ping when your card drops.",
  bannerA11y: "Notifications are off. Get a ping when your card drops.",
  noThanks: "NO THANKS",
  noThanksA11y: "No thanks. Don't ask about notifications again.",
  dismissA11y: "Hide for now",
} as const;
