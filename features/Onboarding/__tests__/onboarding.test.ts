import { ONBOARDING_STEPS, TOTAL_STEPS, type OnboardingStep } from '../types';

// ─── Step list invariants ─────────────────────────────────────────────────────

describe('ONBOARDING_STEPS', () => {
  it('starts with welcome', () => {
    expect(ONBOARDING_STEPS[0]).toBe('welcome');
  });

  it('ends with permissions', () => {
    expect(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1]).toBe('permissions');
  });

  it('places privacy before permissions', () => {
    const privacyIdx = ONBOARDING_STEPS.indexOf('privacy');
    const permIdx = ONBOARDING_STEPS.indexOf('permissions');
    expect(privacyIdx).toBeLessThan(permIdx);
  });

  it('contains no duplicate steps', () => {
    expect(new Set(ONBOARDING_STEPS).size).toBe(ONBOARDING_STEPS.length);
  });

  it('TOTAL_STEPS matches the array length', () => {
    expect(TOTAL_STEPS).toBe(ONBOARDING_STEPS.length);
  });

  it('contains all three expected steps', () => {
    const expected: OnboardingStep[] = [
      'welcome', 'permissions', 'privacy',
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
    expect(advance(1, TOTAL_STEPS)).toBe(2);
  });
});
