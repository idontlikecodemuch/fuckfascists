// Pixel art for the Info notifications controls (design 2026-10-26: option A
// "HUD bell" and option E "menu line"). One character per cell: '#' body,
// 'g' glint, 'w' ring marks, 'k' knock-out gap beside the slash.

/** Ringing bell, 12 x 9 cells. */
export const BELL_ON: readonly string[] = [
  '.....##.....',
  '.w..####..w.',
  'w..#g####..w',
  'w..#g####..w',
  'w..######..w',
  '.w.######.w.',
  '..########..',
  '............',
  '.....##.....',
];

/** Slashed bell, 12 x 9 cells. */
export const BELL_OFF: readonly string[] = [
  '..#k.##.....',
  '...#k###....',
  '...##k###...',
  '...###k##...',
  '...####k#...',
  '...#####k...',
  '..#######k..',
  '.........#k.',
  '.....##...#.',
];

/** Pixel ">" for a line that opens something, 4 x 7 cells. */
export const CHEVRON: readonly string[] = [
  '#...',
  '.#..',
  '..#.',
  '...#',
  '..#.',
  '.#..',
  '#...',
];
