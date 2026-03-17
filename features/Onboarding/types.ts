export const ONBOARDING_STEPS = [
  'welcome',
  'permissions',
  'privacy',
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;
