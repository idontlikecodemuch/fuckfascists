/**
 * Builds the source-code archive Mozilla Add-ons (AMO) requires for the
 * Firefox package. AMO reviewers rebuild bundled/minified add-ons from source
 * and diff the result against the uploaded package, so the archive is a small
 * self-contained project: only the files esbuild bundles, the build script,
 * static extension files, the bundled data, and a one-dependency package.json.
 *
 * Run after `npm run build:ext:firefox`:
 *   npm run package:ext:source            → dist/packages/fck-fascists-firefox-<v>-source.zip
 *   npm run package:ext:source -- --verify  also rebuilds from the archive
 *                                            (npm ci + build) and diffs it
 *                                            against dist/extension-firefox/
 *
 * Needs network access to the npm registry (lockfile generation, --verify).
 * Makes no FEC or other data API calls.
 */

import { build } from 'esbuild';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STAGE = resolve(ROOT, 'dist/amo-source');
const verify = process.argv.includes('--verify');

const ENTRY_POINTS = [
  'extension/background/service-worker.ts',
  'extension/content/detector.ts',
  'extension/popup/popup.ts',
];
const STATIC_FILES = [
  'scripts/build-extension.mjs',
  'extension/manifest.json',
  'extension/popup/popup.html',
  'extension/popup/popup.css',
  'extension/icons',
  'assets/data/entities.json',
  'assets/data/people.bundle.json',
];

function run(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => (code === 0
      ? resolvePromise()
      : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))));
  });
}

/** Every source file esbuild reads for the Firefox bundles. */
async function bundledInputs() {
  const inputs = new Set();
  for (const entry of ENTRY_POINTS) {
    const result = await build({
      absWorkingDir: ROOT,
      entryPoints: [entry],
      bundle: true,
      write: false,
      metafile: true,
      target: ['firefox121'],
      tsconfig: resolve(ROOT, 'tsconfig.json'),
      define: { chrome: 'browser' },
      logLevel: 'silent',
    });
    Object.keys(result.metafile.inputs).forEach((input) => inputs.add(input));
  }
  return inputs;
}

/** Adds files referenced only by `import type` (erased by esbuild) for readability. */
async function withTypeOnlyImports(files) {
  const queue = [...files];
  while (queue.length) {
    const file = queue.pop();
    const source = await readFile(resolve(ROOT, file), 'utf8');
    for (const match of source.matchAll(/import\s+type\s+[^;]*?from\s+'(\.[^']+)'/g)) {
      const base = join(dirname(file), match[1]);
      const candidate = [`${base}.ts`, join(base, 'index.ts')].find((p) => existsSync(resolve(ROOT, p)));
      if (candidate && !files.has(candidate)) {
        files.add(candidate);
        queue.push(candidate);
      }
    }
  }
  return files;
}

function readme(version, esbuildVersion) {
  return `# FCK, Financial Contribution Kit — Firefox add-on source (v${version})

This archive rebuilds the uploaded Firefox package exactly. The add-on is
TypeScript bundled and minified with esbuild ${esbuildVersion} (open source,
MIT). Nothing is obfuscated. No code is downloaded at runtime.

Full project, including the mobile app that shares this code:
https://github.com/idontlikecodemuch/fuckfascists

## Requirements

- Any OS that runs Node.js. Tested on macOS 26 (arm64) with Node 25.8.0 and
  npm 11.11.0. Expected to match on Ubuntu 24.04 with Node 24 and npm 11.
- The \`zip\` command (Ubuntu: \`sudo apt-get install zip\`), used by the build
  script to package the result.

## Build

\`\`\`bash
npm ci
npm run build
\`\`\`

Output:

- \`dist/extension-firefox/\` — the unpacked add-on; diff this against the
  uploaded package.
- \`dist/packages/fck-fascists-firefox-${version}.zip\` — the uploaded package.

## What is here

- \`scripts/build-extension.mjs\` — the build script (bundles three entry points:
  background script, content script, popup).
- \`extension/\` — the add-on source, manifest, popup HTML/CSS, and icons.
- \`core/\`, \`config/\`, \`design/\`, \`features/\` — shared TypeScript the
  add-on imports from the mobile app's codebase. Only files the bundle uses
  (plus type-only imports) are included.
- \`assets/data/entities.json\`, \`assets/data/people.bundle.json\` — public FEC
  contribution data bundled with the add-on. Data, not code.
- \`tsconfig.json\` — the project tsconfig without its \`extends\` of the Expo
  base config, which only applies to the React Native app. esbuild output is
  identical either way.

The minified bundle contains a few unused string constants from the shared
config (for example App Store URLs used by the mobile app). The add-on never
requests them.
`;
}

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else out.push(full);
  }
  return out;
}

async function diffTrees(expectedDir, actualDir) {
  const expected = (await listFiles(expectedDir)).map((f) => relative(expectedDir, f)).sort();
  const actual = (await listFiles(actualDir)).map((f) => relative(actualDir, f)).sort();
  const problems = [];
  if (expected.join('\n') !== actual.join('\n')) problems.push('file lists differ');
  for (const file of expected.filter((f) => actual.includes(f))) {
    const [a, b] = await Promise.all([readFile(join(expectedDir, file)), readFile(join(actualDir, file))]);
    if (!a.equals(b)) problems.push(`content differs: ${file}`);
  }
  return problems;
}

const manifest = JSON.parse(await readFile(resolve(ROOT, 'extension/manifest.json'), 'utf8'));
const esbuildVersion = JSON.parse(
  await readFile(resolve(ROOT, 'node_modules/esbuild/package.json'), 'utf8'),
).version;
const rootTsconfig = JSON.parse(await readFile(resolve(ROOT, 'tsconfig.json'), 'utf8'));
delete rootTsconfig.extends;

const sources = await withTypeOnlyImports(await bundledInputs());

await rm(STAGE, { recursive: true, force: true });
for (const file of [...sources, ...STATIC_FILES]) {
  const dest = resolve(STAGE, file);
  await mkdir(dirname(dest), { recursive: true });
  await cp(resolve(ROOT, file), dest, { recursive: true });
}
await writeFile(resolve(STAGE, 'tsconfig.json'), JSON.stringify(rootTsconfig, null, 2) + '\n');
await writeFile(resolve(STAGE, 'README.md'), readme(manifest.version, esbuildVersion));
await writeFile(resolve(STAGE, 'package.json'), JSON.stringify({
  name: 'fck-fascists-firefox-source',
  version: manifest.version,
  private: true,
  scripts: { build: 'node scripts/build-extension.mjs --browser=firefox' },
  devDependencies: { esbuild: esbuildVersion },
}, null, 2) + '\n');
await run('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], STAGE);

const archive = resolve(ROOT, `dist/packages/fck-fascists-firefox-${manifest.version}-source.zip`);
await mkdir(dirname(archive), { recursive: true });
await rm(archive, { force: true });
await run('zip', ['-qrX', archive, '.', '-x', '*.DS_Store'], STAGE);
console.log(`[package-extension-source] ${sources.size} source files → ${archive}`);

if (verify) {
  const builtDir = resolve(ROOT, 'dist/extension-firefox');
  if (!existsSync(builtDir)) throw new Error('Run `npm run build:ext:firefox` before --verify');
  const work = await mkdtemp(join(tmpdir(), 'fck-amo-verify-'));
  await run('unzip', ['-q', archive, '-d', work], ROOT);
  await run('npm', ['ci', '--no-audit', '--no-fund'], work);
  await run('npm', ['run', 'build'], work);
  const problems = await diffTrees(builtDir, resolve(work, 'dist/extension-firefox'));
  await rm(work, { recursive: true, force: true });
  if (problems.length) throw new Error(`Rebuild differs from dist/extension-firefox:\n${problems.join('\n')}`);
  console.log('[package-extension-source] Verified: rebuild from the archive matches dist/extension-firefox/');
}
