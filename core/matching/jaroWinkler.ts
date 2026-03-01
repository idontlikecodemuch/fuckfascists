const WINKLER_PREFIX_WEIGHT = 0.1;
const MAX_PREFIX_LENGTH = 4;

/**
 * Jaro similarity between two strings (0–1).
 */
export function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchDistance = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);

  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
  );
}

/**
 * Jaro-Winkler similarity between two strings (0–1).
 * Boosts scores for strings sharing a common prefix (up to 4 chars).
 */
export function jaroWinkler(s1: string, s2: string): number {
  const jaroScore = jaro(s1, s2);

  let prefixLength = 0;
  const limit = Math.min(MAX_PREFIX_LENGTH, s1.length, s2.length);
  for (let i = 0; i < limit; i++) {
    if (s1[i] === s2[i]) prefixLength++;
    else break;
  }

  return jaroScore + prefixLength * WINKLER_PREFIX_WEIGHT * (1 - jaroScore);
}
