/**
 * Scans assets/pixel/starbg/ for PNG files and regenerates
 * core/starbg/starbgAssets.ts — categorized static require() maps.
 *
 * Run:  node scripts/generate-starbg-assets.mjs
 *
 * Categories derived from filename prefix:
 *   gal_*       → galaxies
 *   rock_*      → rocks
 *   milkyway_*  → milky way variations
 *   star_field_base → base star texture
 *
 * Metro bundler requires static require() strings at build time.
 */

import { readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ASSET_DIR = resolve(ROOT, 'assets/pixel/starbg');
const OUTPUT_FILE = resolve(ROOT, 'core/starbg/starbgAssets.ts');

function filenameToId(filename) {
  const ext = filename.endsWith('.jpg') ? '.jpg' : '.png';
  return basename(filename, ext).replace(/_/g, '-');
}

function categorize(filename) {
  const base = filename.replace(/\.(png|jpg)$/, '');
  if (base.startsWith('gal_')) return 'galaxies';
  if (base.startsWith('rock_')) return 'rocks';
  if (base.startsWith('milkyway_')) return 'milkyways';
  if (base.startsWith('star_field_base')) return 'base';
  return null;
}

async function main() {
  const files = (await readdir(ASSET_DIR))
    .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
    .filter((f) => !f.includes('_transparent'))  // skip transparent backups
    .sort();

  if (files.length === 0) {
    console.error('No PNG files found in assets/pixel/starbg/');
    process.exit(1);
  }

  const cats = { galaxies: [], rocks: [], milkyways: [], base: [] };
  for (const f of files) {
    const cat = categorize(f);
    if (cat) cats[cat].push(f);
    else console.warn(`  Skipping unknown file: ${f}`);
  }

  const makeEntries = (fileList) =>
    fileList.map((f) => {
      const id = filenameToId(f);
      return `  '${id}': require('../../assets/pixel/starbg/${f}'),`;
    });

  const output = `/**
 * Generated star field background asset require map.
 * Do not edit manually — regenerate via: node scripts/generate-starbg-assets.mjs
 */
import type { ImageSourcePropType } from 'react-native';

/** Galaxy / nebula images */
export const starbgGalaxies: Record<string, ImageSourcePropType> = {
${makeEntries(cats.galaxies).join('\n')}
};

/** Space rock / asteroid images */
export const starbgRocks: Record<string, ImageSourcePropType> = {
${makeEntries(cats.rocks).join('\n')}
};

/** Milky way band variations */
export const starbgMilkyways: Record<string, ImageSourcePropType> = {
${makeEntries(cats.milkyways).join('\n')}
};

/** Pre-rendered dense star dot texture */
export const starbgBase: ImageSourcePropType | null = ${
    cats.base.length > 0
      ? `require('../../assets/pixel/starbg/${cats.base[0]}')`
      : 'null'
  };
`;

  await writeFile(OUTPUT_FILE, output, 'utf-8');
  console.log(`starbgAssets.ts generated:`);
  console.log(`  galaxies:  ${cats.galaxies.length}`);
  console.log(`  rocks:     ${cats.rocks.length}`);
  console.log(`  milkyways: ${cats.milkyways.length}`);
  console.log(`  base:      ${cats.base.length}`);
}

main();
