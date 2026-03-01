import { normalize } from '../normalize';

describe('normalize', () => {
  it('lowercases input', () => {
    expect(normalize('Walmart')).toBe('walmart');
    expect(normalize('TARGET')).toBe('target');
  });

  it('strips possessives without leaving a space', () => {
    expect(normalize("McDonald's")).toBe('mcdonalds');
    expect(normalize("Denny's")).toBe('dennys');
  });

  it('strips joiners without leaving a space', () => {
    expect(normalize('AT&T')).toBe('att');
    expect(normalize('Chick-fil-A')).toBe('chickfila');
    expect(normalize('7-Eleven')).toBe('7eleven');
  });

  it('replaces remaining punctuation with a space', () => {
    expect(normalize('Bed, Bath & Beyond')).toBe('bed bath beyond');
  });

  it('collapses multiple whitespace', () => {
    expect(normalize('Whole  Foods   Market')).toBe('whole foods market');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalize('  Target  ')).toBe('target');
  });

  it('returns empty string for empty input', () => {
    expect(normalize('')).toBe('');
  });

  it('handles input that is only punctuation', () => {
    expect(normalize('---')).toBe('');
  });

  it('preserves numbers', () => {
    expect(normalize('7-Eleven')).toBe('7eleven');
    expect(normalize('24 Hour Fitness')).toBe('24 hour fitness');
  });
});
