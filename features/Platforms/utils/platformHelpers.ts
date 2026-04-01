import { theme } from '../../../design/tokens';

/**
 * Formats a YYYY-MM-DD week-of date for display.
 * e.g. "2024-03-11" → "Mar 11"
 */
export function formatWeekOf(weekOf: string): string {
  const date = new Date(`${weekOf}T00:00:00Z`);
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();
  return `${month} ${day}`;
}

/**
 * Compute the largest square cell size that fits N figures in a grid
 * within the given arena dimensions. Pure math — no magic constants.
 *
 * Tries every possible column count (1..N) and picks the layout that
 * maximizes cell size while fitting all rows. The cell size is the
 * minimum of what the width and height allow for that column count.
 */
export function computeGridCellSize(
  figureCount: number,
  arenaWidth: number,
  arenaHeight: number,
  gap: number,
  padding: number,
): number {
  if (figureCount === 0) return 0;

  const availableW = arenaWidth - padding * 2;
  const availableH = arenaHeight - padding * 2;
  const border = theme.borders.standard.width * 2;

  let best = 0;

  for (let cols = 1; cols <= figureCount; cols++) {
    const rows = Math.ceil(figureCount / cols);
    // Max cell size that fits cols columns in the available width
    const cellW = (availableW - (cols - 1) * gap) / cols - border;
    // Max cell size that fits rows in the available height
    const cellH = (availableH - (rows - 1) * gap) / rows - border;
    // Square cells: constrained by the smaller dimension
    const size = Math.floor(Math.min(cellW, cellH));
    if (size > best) best = size;
  }

  return Math.max(best, 1);
}
