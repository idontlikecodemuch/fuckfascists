/**
 * Build script for the browser extension.
 *
 * Outputs browser-specific unpacked builds and store-upload ZIPs.
 * Run Chrome: node scripts/build-extension.mjs
 * Run all:    node scripts/build-extension.mjs --browser=all
 * Watch: node scripts/build-extension.mjs --watch
 *
 * Three separate bundles per browser:
 *  1. background/service-worker.js — ESM (MV3 requires ESM for SW)
 *  2. content/detector.js          — IIFE (content scripts are not modules)
 *  3. popup/popup.js               — IIFE
 *
 * esbuild resolves all TypeScript imports from /core, /config, etc.
 */

import { build, context } from 'esbuild';
import { spawn } from 'node:child_process';
import { copyFile, mkdir, cp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const watch = process.argv.includes('--watch');
const browserArg = process.argv.find((arg) => arg.startsWith('--browser='));
const requestedBrowser = browserArg?.slice('--browser='.length) || 'chrome';
const BROWSERS = {
  chrome: { out: 'extension', target: ['chrome112'], apiNamespace: 'chrome' },
  edge: { out: 'extension-edge', target: ['edge112'], apiNamespace: 'chrome' },
  firefox: { out: 'extension-firefox', target: ['firefox121'], apiNamespace: 'browser' },
  safari: { out: 'extension-safari', target: ['safari17'], apiNamespace: 'browser' },
};
const selectedBrowsers = requestedBrowser === 'all' ? Object.keys(BROWSERS) : [requestedBrowser];
if (selectedBrowsers.some((browser) => !BROWSERS[browser])) {
  throw new Error(`--browser must be one of: ${Object.keys(BROWSERS).join(', ')}, all`);
}
if (watch && selectedBrowsers.length !== 1) {
  throw new Error('--watch requires exactly one browser target');
}

function manifestForBrowser(baseManifest, browser) {
  if (browser === 'firefox') {
    return {
      ...baseManifest,
      background: {
        scripts: ['background/service-worker.js'],
        type: 'module',
      },
      browser_specific_settings: {
        gecko: {
          id: 'fck-fascists@fckfascists.com',
          strict_min_version: '142.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    };
  }

  if (browser === 'safari') {
    return {
      ...baseManifest,
      background: {
        scripts: ['background/service-worker.js'],
        service_worker: 'background/service-worker.js',
      },
    };
  }

  return baseManifest;
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function entryPointsFor(out, browser) {
  return [
    {
      in: resolve(ROOT, 'extension/background/service-worker.ts'),
      out: resolve(out, 'background/service-worker'),
      format: /** @type {'esm' | 'iife'} */ (browser === 'safari' ? 'iife' : 'esm'),
    },
    {
      in: resolve(ROOT, 'extension/content/detector.ts'),
      out: resolve(out, 'content/detector'),
      format: /** @type {'iife'} */ ('iife'),
    },
    {
      in: resolve(ROOT, 'extension/popup/popup.ts'),
      out: resolve(out, 'popup/popup'),
      format: /** @type {'iife'} */ ('iife'),
    },
  ];
}

async function copyStaticAssets(out, manifest) {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await mkdir(resolve(out, 'popup'), { recursive: true });
  await mkdir(resolve(out, 'icons'), { recursive: true });

  await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  await copyFile(
    resolve(ROOT, 'extension/popup/popup.html'),
    resolve(out, 'popup/popup.html'),
  );
  await copyFile(
    resolve(ROOT, 'extension/popup/popup.css'),
    resolve(out, 'popup/popup.css'),
  );

  // Icons — copy entire icons/ directory if it exists
  try {
    await cp(
      resolve(ROOT, 'extension/icons'),
      resolve(out, 'icons'),
      { recursive: true },
    );
  } catch {
    // No icons yet — placeholder PNGs need to be added before publishing
    console.warn('[build-extension] Warning: extension/icons/ not found — add pixel art icons before release');
  }

  // Entity + people lists — bundle the curated data so the extension works
  // offline from day one without waiting for a CDN fetch. people.bundle.json
  // is the slim build output from `npm run strip:people:raw`; it keeps raw
  // line items only for people linked to live entities.
  await mkdir(resolve(out, 'assets/data'), { recursive: true });
  await copyFile(
    resolve(ROOT, 'assets/data/entities.json'),
    resolve(out, 'assets/data/entities.json'),
  );
  await copyFile(
    resolve(ROOT, 'assets/data/people.bundle.json'),
    resolve(out, 'assets/data/people.bundle.json'),
  );
}

async function packageBrowser(browser, out, version) {
  const packagesDir = resolve(ROOT, 'dist/packages');
  const packagePath = resolve(packagesDir, `fck-fascists-${browser}-${version}.zip`);
  await mkdir(packagesDir, { recursive: true });
  await rm(packagePath, { force: true });
  await run('zip', ['-qr', packagePath, '.'], { cwd: out });
  return packagePath;
}

async function buildBrowser(browser) {
  const config = BROWSERS[browser];
  const out = resolve(ROOT, 'dist', config.out);
  const baseManifest = JSON.parse(await readFile(resolve(ROOT, 'extension/manifest.json'), 'utf8'));
  const manifest = manifestForBrowser(baseManifest, browser);
  const entryPoints = entryPointsFor(out, browser);
  const sharedOptions = {
    bundle: true,
    sourcemap: watch ? 'inline' : false,
    minify: !watch,
    target: config.target,
    tsconfig: resolve(ROOT, 'tsconfig.json'),
    define: config.apiNamespace === 'browser' ? { chrome: 'browser' } : undefined,
  };

  await copyStaticAssets(out, manifest);
  if (watch) {
    const ctxs = await Promise.all(entryPoints.map((ep) =>
      context({
        ...sharedOptions,
        entryPoints: [ep.in],
        outfile: ep.out + '.js',
        format: ep.format,
      })
    ));
    await Promise.all(ctxs.map((c) => c.watch()));
    console.log(`[build-extension] Watching ${browser} → ${out}`);
    return;
  }

  await Promise.all(entryPoints.map((ep) =>
      build({
        ...sharedOptions,
        entryPoints: [ep.in],
        outfile: ep.out + '.js',
        format: ep.format,
      })
  ));
  const packagePath = await packageBrowser(browser, out, manifest.version);
  console.log(`[build-extension] Built ${browser} → ${out}`);
  console.log(`[build-extension] Packaged ${browser} → ${packagePath}`);
}

await Promise.all(selectedBrowsers.map((browser) => buildBrowser(browser)));
