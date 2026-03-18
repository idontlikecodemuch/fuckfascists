/**
 * Scans assets/pixel/arena/ for PNG files and regenerates
 * core/arena/arenaAssets.ts — a static require() map.
 *
 * Run:  node scripts/generate-arena-assets.mjs
 *
 * Run this after adding or removing arena background images.
 * Metro bundler requires static require() strings at build time,
 * so this script writes them as string literals.
 */

import { readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ARENA_DIR = resolve(ROOT, 'assets/pixel/arena');
const OUTPUT_FILE = resolve(ROOT, 'core/arena/arenaAssets.ts');

/** Convert a filename like arena_nyc_street.png → arena-nyc-street */
function filenameToId(filename) {
  return basename(filename, '.png').replace(/_/g, '-');
}

async function main() {
  const files = (await readdir(ARENA_DIR))
    .filter((f) => f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error('No PNG files found in assets/pixel/arena/');
    process.exit(1);
  }

  const entries = files.map((f) => {
    const id = filenameToId(f);
    return `  '${id}': require('../../assets/pixel/arena/${f}'),`;
  });

  const output = `/**
 * Generated arena background asset require map.
 * Do not edit manually — regenerate via: node scripts/generate-arena-assets.mjs
 */
import type { ImageSourcePropType } from 'react-native';

export const arenaAssets: Record<string, ImageSourcePropType> = {
${entries.join('\n')}
};
`;

  await writeFile(OUTPUT_FILE, output, 'utf-8');
  console.log(`arenaAssets.ts generated with ${files.length} backgrounds:`);
  files.forEach((f) => console.log(`  ${f}`));
}

main();
