import { getDisplaySurname } from '../surname';

describe('getDisplaySurname', () => {
  it('returns the last word for ordinary names', () => {
    expect(getDisplaySurname('Jeff Bezos')).toBe('Bezos');
    expect(getDisplaySurname('Shailesh G. Jejurikar')).toBe('Jejurikar');
    expect(getDisplaySurname('Carlos Abrams-Rivera')).toBe('Abrams-Rivera');
    expect(getDisplaySurname('  Linda   Rendle ')).toBe('Rendle');
  });

  it('keeps surname particles', () => {
    expect(getDisplaySurname('Dirk Van de Put')).toBe('Van de Put');
    expect(getDisplaySurname('Luis von Ahn')).toBe('von Ahn');
    expect(getDisplaySurname('Dolf van den Brink')).toBe('van den Brink');
    expect(getDisplaySurname('Stephane de La Faverie')).toBe('de La Faverie');
    expect(getDisplaySurname('Antoine de Saint-Affrique')).toBe('de Saint-Affrique');
  });

  it('never treats the given name as a particle', () => {
    expect(getDisplaySurname('Del Smith')).toBe('Smith');
    expect(getDisplaySurname('Van Morrison')).toBe('Morrison');
  });

  it('drops generational suffixes', () => {
    expect(getDisplaySurname('John Menard Jr')).toBe('Menard');
    expect(getDisplaySurname('Frank B. Holding Jr.')).toBe('Holding');
    expect(getDisplaySurname('Frank Holding, Jr.')).toBe('Holding');
    expect(getDisplaySurname('Ernie Garcia III')).toBe('Garcia');
    expect(getDisplaySurname('William T. Dillard II')).toBe('Dillard');
  });

  it('keeps collective family figures whole', () => {
    expect(getDisplaySurname('Mars Family')).toBe('Mars Family');
  });

  it('joins co-leads', () => {
    expect(getDisplaySurname('Rodney Sacks and Hilton Schlosberg')).toBe('Sacks & Schlosberg');
    expect(getDisplaySurname('Meghan Frank & Andre Maestrini')).toBe('Frank & Maestrini');
  });

  it('does not split organization names that contain "and"', () => {
    expect(getDisplaySurname('Texans For Truth And Liberty')).toBe('Liberty');
  });

  it('handles single words and empty input', () => {
    expect(getDisplaySurname('Cher')).toBe('Cher');
    expect(getDisplaySurname('   ')).toBe('');
  });
});
