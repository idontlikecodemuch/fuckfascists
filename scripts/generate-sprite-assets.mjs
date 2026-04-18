/**
 * Scans assets/pixel/sprites/ for PNG files and regenerates
 * core/sprites/spriteAssets.ts — a static require() map.
 *
 * Run:  node scripts/generate-sprite-assets.mjs
 *
 * Run this after adding or removing sprite sheets (or after running
 * tools/img-gen/scripts/optimize_sprites.py). Metro bundler requires static
 * require() strings at build time, so this script writes them as string literals.
 */

import { readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SPRITES_DIR = resolve(ROOT, 'assets/pixel/sprites');
const OUTPUT_FILE = resolve(ROOT, 'core/sprites/spriteAssets.ts');

async function main() {
  const files = (await readdir(SPRITES_DIR))
    .filter((f) => f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error('No PNG files found in assets/pixel/sprites/');
    process.exit(1);
  }

  const entries = files.map((f) => {
    const id = basename(f, '.png');
    return `  '${id}': require('../../assets/pixel/sprites/${f}'),`;
  });

  const output = `/**
 * Generated sprite asset require map.
 * Do not edit manually — regenerate via: node scripts/generate-sprite-assets.mjs
 */
import type { ImageSourcePropType } from 'react-native';

export const spriteAssets: Record<string, ImageSourcePropType> = {
${entries.join('\n')}
};

// ${files.length} sprites
`;

  await writeFile(OUTPUT_FILE, output, 'utf-8');
  console.log(`spriteAssets.ts generated with ${files.length} sprites`);
}

main();
