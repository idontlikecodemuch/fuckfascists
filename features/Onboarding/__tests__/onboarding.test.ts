import { ONBOARDING_STEPS, TOTAL_STEPS, type OnboardingStep } from '../types';

// ─── Step list invariants ─────────────────────────────────────────────────────

describe('ONBOARDING_STEPS', () => {
  it('starts with welcome', () => {
    expect(ONBOARDING_STEPS[0]).toBe('welcome');
  });

  it('ends with notifications', () => {
    expect(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1]).toBe('notifications');
  });

  it('places privacy before permissions', () => {
    const privacyIdx = ONBOARDING_STEPS.indexOf('privacy');
    const locationIdx = ONBOARDING_STEPS.indexOf('location');
    expect(privacyIdx).toBeLessThan(locationIdx);
  });

  it('places location before notifications', () => {
    const locIdx  = ONBOARDING_STEPS.indexOf('location');
    const notifIdx = ONBOARDING_STEPS.indexOf('notifications');
    expect(locIdx).toBeLessThan(notifIdx);
  });

  it('contains no duplicate steps', () => {
    expect(new Set(ONBOARDING_STEPS).size).toBe(ONBOARDING_STEPS.length);
  });

  it('TOTAL_STEPS matches the array length', () => {
    expect(TOTAL_STEPS).toBe(ONBOARDING_STEPS.length);
  });

  it('contains all five expected steps', () => {
    const expected: OnboardingStep[] = [
      'welcome', 'how-it-works', 'privacy', 'location', 'notifications',
    ];
    expected.forEach((step) => expect(ONBOARDING_STEPS).toContain(step));
  });
});

// ─── Step progression logic ───────────────────────────────────────────────────

describe('step progression', () => {
  it('advancing past the last step triggers completion', () => {
    // Simulate the OnboardingNavigator advance() logic
    const advance = (index: number, total: number) =>
      index + 1 >= total ? 'complete' : index + 1;

    expect(advance(TOTAL_STEPS - 1, TOTAL_STEPS)).toBe('complete');
    expect(advance(0, TOTAL_STEPS)).toBe(1);
    expect(advance(2, TOTAL_STEPS)).toBe(3);
  });
});
