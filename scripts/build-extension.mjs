/**
 * Build script for the browser extension.
 *
 * Outputs to dist/extension/ — ready to load as an unpacked extension.
 * Run:  node scripts/build-extension.mjs
 * Watch: node scripts/build-extension.mjs --watch
 *
 * Three separate bundles:
 *  1. background/service-worker.js — ESM (MV3 requires ESM for SW)
 *  2. content/detector.js          — IIFE (content scripts are not modules)
 *  3. popup/popup.js               — IIFE
 *
 * esbuild resolves all TypeScript imports from /core, /config, etc.
 */

import { build, context } from 'esbuild';
import { copyFile, mkdir, cp } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT  = resolve(ROOT, 'dist/extension');

const watch = process.argv.includes('--watch');

const sharedOptions = {
  bundle:    true,
  sourcemap: watch ? 'inline' : false,
  minify:    !watch,
  target:    ['chrome112', 'firefox115'],
  tsconfig:  resolve(ROOT, 'tsconfig.json'),
};

const entryPoints = [
  {
    in:     resolve(ROOT, 'extension/background/service-worker.ts'),
    out:    resolve(OUT,  'background/service-worker'),
    format: /** @type {'esm'} */ ('esm'),
  },
  {
    in:     resolve(ROOT, 'extension/content/detector.ts'),
    out:    resolve(OUT,  'content/detector'),
    format: /** @type {'iife'} */ ('iife'),
  },
  {
    in:     resolve(ROOT, 'extension/popup/popup.ts'),
    out:    resolve(OUT,  'popup/popup'),
    format: /** @type {'iife'} */ ('iife'),
  },
];

async function copyStaticAssets() {
  await mkdir(OUT, { recursive: true });
  await mkdir(resolve(OUT, 'popup'), { recursive: true });
  await mkdir(resolve(OUT, 'icons'), { recursive: true });

  await copyFile(
    resolve(ROOT, 'extension/manifest.json'),
    resolve(OUT, 'manifest.json'),
  );
  await copyFile(
    resolve(ROOT, 'extension/popup/popup.html'),
    resolve(OUT, 'popup/popup.html'),
  );
  await copyFile(
    resolve(ROOT, 'extension/popup/popup.css'),
    resolve(OUT, 'popup/popup.css'),
  );

  // Icons — copy entire icons/ directory if it exists
  try {
    await cp(
      resolve(ROOT, 'extension/icons'),
      resolve(OUT, 'icons'),
      { recursive: true },
    );
  } catch {
    // No icons yet — placeholder PNGs need to be added before publishing
    console.warn('[build-extension] Warning: extension/icons/ not found — add pixel art icons before release');
  }
}

if (watch) {
  await copyStaticAssets();
  const ctxs = await Promise.all(
    entryPoints.map((ep) =>
      context({
        ...sharedOptions,
        entryPoints: [ep.in],
        outfile: ep.out + '.js',
        format: ep.format,
      })
    )
  );
  await Promise.all(ctxs.map((c) => c.watch()));
  console.log('[build-extension] Watching for changes…');
} else {
  await copyStaticAssets();
  await Promise.all(
    entryPoints.map((ep) =>
      build({
        ...sharedOptions,
        entryPoints: [ep.in],
        outfile: ep.out + '.js',
        format: ep.format,
      })
    )
  );
  console.log('[build-extension] Built → dist/extension/');
}
