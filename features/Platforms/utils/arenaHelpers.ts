import { arenaAssets } from '../../../core/arena/arenaAssets';
import { nameToSpriteId, hasSprite } from '../../../core/sprites/spriteLoader';
import { platformsCopy } from '../../../copy/platforms';
import { TRACKED_PLATFORMS } from '../data/platformList';
import { getDisplayFigure } from '../context/TrackContext';

export interface ArenaFigure {
  figureName: string;
  spriteId: string;
}

const arenaKeys = Object.keys(arenaAssets);

/** Pick a random arena key, optionally excluding one for variety. */
export function pickRandomArena(exclude?: string | null): string | null {
  if (arenaKeys.length === 0) return null;
  if (arenaKeys.length === 1) return arenaKeys[0] ?? null;
  const candidates = exclude ? arenaKeys.filter((k) => k !== exclude) : arenaKeys;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? arenaKeys[0] ?? null;
}

/** Pick a random sprite reaction string. */
export function pickReaction(): string {
  const reactions = platformsCopy.spriteReactions;
  return reactions[Math.floor(Math.random() * reactions.length)] ?? reactions[0] ?? '!';
}

/** Build the deduplicated list of arena figures from tracked platforms. */
export function buildGridFigures(): ArenaFigure[] {
  const seen = new Set<string>();
  const figures: ArenaFigure[] = [];
  for (const platform of TRACKED_PLATFORMS) {
    const figureName = getDisplayFigure(platform);
    if (seen.has(figureName)) continue;
    seen.add(figureName);
    if (!hasSprite(figureName)) continue;
    figures.push({ figureName, spriteId: nameToSpriteId(figureName) });
  }
  return figures;
}
