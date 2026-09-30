import { nameToSpriteId } from '../spriteId';

describe('nameToSpriteId', () => {
  it('kebab-cases plain names exactly as before', () => {
    expect(nameToSpriteId('Jeff Bezos')).toBe('jeff-bezos');
    expect(nameToSpriteId('  Dirk   Van de Put ')).toBe('dirk-van-de-put');
    expect(nameToSpriteId('Carlos Abrams-Rivera')).toBe('carlos-abrams-rivera');
  });

  it('drops apostrophes and periods so ids stay file-safe', () => {
    expect(nameToSpriteId("Josh D'Amaro")).toBe('josh-damaro');
    expect(nameToSpriteId("Shane O'Kelly")).toBe('shane-okelly');
    expect(nameToSpriteId('J.K. Symancyk')).toBe('jk-symancyk');
    expect(nameToSpriteId('Michael J. Bender')).toBe('michael-j-bender');
  });

  it('folds accents', () => {
    expect(nameToSpriteId('Tobi Lütke')).toBe('tobi-lutke');
    expect(nameToSpriteId('Juan Antonio González Moreno')).toBe('juan-antonio-gonzalez-moreno');
  });
});
