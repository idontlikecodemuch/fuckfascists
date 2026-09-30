/**
 * Convert a display name to its sprite ID, e.g. "Jeff Bezos" -> "jeff-bezos".
 *
 * Sprite files and the generated require() map only use [a-z0-9-], so
 * punctuation and accents are dropped: "Josh D'Amaro" -> "josh-damaro",
 * "J.K. Symancyk" -> "jk-symancyk", "Tobi Lütke" -> "tobi-lutke".
 * Names made only of letters, digits, and spaces map exactly as before.
 */
export function nameToSpriteId(name: string): string {
  const lower = name.trim().toLowerCase();
  // Guard for engines without String.prototype.normalize; accented letters
  // are then dropped by the filter below instead of folded.
  const folded = typeof lower.normalize === 'function'
    ? lower.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    : lower;
  return folded.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}
