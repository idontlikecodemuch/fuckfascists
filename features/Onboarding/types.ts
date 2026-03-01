export const ONBOARDING_STEPS = [
  'welcome',
  'how-it-works',
  'privacy',
  'location',
  'notifications',
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;
