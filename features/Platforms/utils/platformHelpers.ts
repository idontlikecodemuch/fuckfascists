import { theme } from '../../../design/tokens';
import {
  TRACK_ARENA_GRID_CELL_MIN,
  TRACK_ARENA_GRID_CELL_MAX,
} from '../../../config/constants';

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
 * Compute a grid cell size that fits all figures within the arena.
 * Mimics classic fighting-game character-select: a tight grid of evenly-sized
 * portraits that fills the available space without overflow.
 */
export function computeGridCellSize(
  figureCount: number,
  arenaWidth: number,
  arenaHeight: number,
  gap: number,
  padding: number,
): number {
  if (figureCount === 0) return TRACK_ARENA_GRID_CELL_MAX;

  const availableW = arenaWidth - padding * 2;
  const availableH = arenaHeight - padding * 2;
  const borderW = theme.borders.standard.width * 2;

  let bestSize = TRACK_ARENA_GRID_CELL_MAX;
  for (let size = TRACK_ARENA_GRID_CELL_MAX; size >= TRACK_ARENA_GRID_CELL_MIN; size--) {
    const cellTotal = size + borderW;
    const cols = Math.max(1, Math.floor((availableW + gap) / (cellTotal + gap)));
    const rows = Math.ceil(figureCount / cols);
    const totalHeight = rows * cellTotal + (rows - 1) * gap;
    if (totalHeight <= availableH) {
      bestSize = size;
      break;
    }
    bestSize = size;
  }

  return Math.max(bestSize, TRACK_ARENA_GRID_CELL_MIN);
}
