/**
 * Display surname for a figure or person name, used wherever the UI shows
 * one name in place of the full one (scorecard rows, donor links on the
 * business card and extension popup).
 *
 * Taking the last whitespace token breaks real names: "Dirk Van de Put"
 * became "Put", "Ernie Garcia III" became "III", and "Mars Family" became
 * "Family". Rules, in order:
 *   1. Co-leads written "A B and C D" (or "&") render as "B & D". Only split
 *      when every side has at least two words, so an organization name like
 *      "Texans For Truth And Liberty" is left alone.
 *   2. Drop trailing generational suffixes (Jr, Sr, II, III, IV, V).
 *   3. Collective figures ending in "Family" keep the whole phrase.
 *   4. Keep surname particles (van, von, de, la, ...) that sit between the
 *      given name and the last word. The first word is never treated as a
 *      particle, so "Del Smith" stays "Smith".
 * Name-order conventions (e.g. Korean family-name-first) are not inferred.
 */

const GENERATIONAL_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
const SURNAME_PARTICLES = new Set([
  'van', 'von', 'de', 'der', 'den', 'del', 'della', 'di', 'da', 'du',
  'dos', 'das', 'la', 'le', 'ten', 'ter', 'st',
]);
const COLLECTIVE_WORDS = new Set(['family']);
const CO_LEAD_JOINER = /\s+(?:and|&)\s+/i;

function bare(token: string): string {
  return token.toLowerCase().replace(/[.,]/g, '');
}

function wordsOf(name: string): string[] {
  return name.trim().split(/\s+/).filter(Boolean);
}

function singleSurname(name: string): string {
  const words = wordsOf(name);
  if (words.length === 0) return name.trim();

  while (words.length > 1 && GENERATIONAL_SUFFIXES.has(bare(words[words.length - 1]!))) {
    words.pop();
  }

  const lastIndex = words.length - 1;
  if (COLLECTIVE_WORDS.has(bare(words[lastIndex]!))) return words.join(' ');

  let start = lastIndex;
  while (start > 1 && SURNAME_PARTICLES.has(bare(words[start - 1]!))) start--;

  return words.slice(start).join(' ').replace(/,$/, '');
}

export function getDisplaySurname(fullName: string): string {
  const people = fullName.trim().split(CO_LEAD_JOINER);
  if (people.length > 1 && people.every((p) => wordsOf(p).length >= 2)) {
    return people.map(singleSurname).join(' & ');
  }
  return singleSurname(fullName);
}
