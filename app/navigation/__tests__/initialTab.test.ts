import { pickInitialTab } from '../initialTab';

describe('pickInitialTab', () => {
  it('uses weighted launch tabs with scan least likely', () => {
    expect(pickInitialTab(() => 0)).toBe('map');
    expect(pickInitialTab(() => 0.36)).toBe('map');
    expect(pickInitialTab(() => 0.37)).toBe('platforms');
    expect(pickInitialTab(() => 0.63)).toBe('platforms');
    expect(pickInitialTab(() => 0.64)).toBe('report');
    expect(pickInitialTab(() => 0.9)).toBe('report');
    expect(pickInitialTab(() => 0.91)).toBe('scan');
  });

  it('falls back to map if no positive weights are configured', () => {
    expect(pickInitialTab(() => 0.5, [
      { tab: 'scan', weight: 0 },
      { tab: 'report', weight: -1 },
    ])).toBe('map');
  });
});
