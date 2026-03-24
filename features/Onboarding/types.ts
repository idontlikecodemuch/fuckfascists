export const ONBOARDING_STEPS = [
  'welcome',
  'privacy',
  'permissions',
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;
