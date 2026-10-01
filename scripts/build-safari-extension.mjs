import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const sourceDir = path.join(ROOT, 'dist/extension-safari');
const projectDir = path.join(ROOT, 'dist/safari-extension');
const bundleIdentifier = process.env.SAFARI_EXTENSION_BUNDLE_ID || 'com.fckapp.fck.safari';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

await run(process.execPath, [path.join(__dirname, 'build-extension.mjs'), '--browser=safari']);
await run('xcrun', [
  'safari-web-extension-packager',
  sourceDir,
  '--project-location', projectDir,
  '--app-name', 'FCK FASCISTS',
  '--bundle-identifier', bundleIdentifier,
  '--swift',
  '--copy-resources',
  '--no-open',
  '--no-prompt',
  '--force',
]);

console.log(`[build-safari-extension] Xcode project → ${projectDir}`);
