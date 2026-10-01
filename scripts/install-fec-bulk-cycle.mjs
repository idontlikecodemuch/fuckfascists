import { access, mkdir, mkdtemp, readdir, rename, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEFAULT_ARCHIVE_DIR = path.join(ROOT, 'tools/fec-bulk/downloads-2026-08-18');
const DEFAULT_BULK_ROOT = path.join(ROOT, 'tools/fec-bulk');

const CYCLE_CONFIG = {
  2016: { yy: '16', legacySuffix: '' },
  2018: { yy: '18', legacySuffix: ' 2' },
  2020: { yy: '20', legacySuffix: ' 3' },
  2022: { yy: '22', legacySuffix: ' 4' },
  2024: { yy: '24', legacySuffix: ' 5' },
  2026: { yy: '26', legacySuffix: ' 6' },
};

function parseArgs(argv) {
  const args = {
    cycle: null,
    archiveDir: DEFAULT_ARCHIVE_DIR,
    bulkRoot: DEFAULT_BULK_ROOT,
    apply: false,
  };

  for (const arg of argv) {
    if (arg.startsWith('--cycle=')) args.cycle = Number.parseInt(arg.slice('--cycle='.length), 10);
    else if (arg.startsWith('--archive-dir=')) args.archiveDir = path.resolve(arg.slice('--archive-dir='.length));
    else if (arg.startsWith('--bulk-root=')) args.bulkRoot = path.resolve(arg.slice('--bulk-root='.length));
    else if (arg === '--apply') args.apply = true;
  }

  if (!CYCLE_CONFIG[args.cycle]) {
    throw new Error(`--cycle must be one of: ${Object.keys(CYCLE_CONFIG).join(', ')}`);
  }
  return args;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function requireNonEmptyFile(filePath) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`Expected non-empty file: ${filePath}`);
  }
  return fileStat.size;
}

async function directoryBytes(dirPath) {
  let total = 0;
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) total += await directoryBytes(entryPath);
    else if (entry.isFile()) total += (await stat(entryPath)).size;
  }
  return total;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = CYCLE_CONFIG[args.cycle];
  const archiveNames = {
    cm: `cm${config.yy}.zip`,
    cn: `cn${config.yy}.zip`,
    ccl: `ccl${config.yy}.zip`,
    pas2: `pas2${config.yy}.zip`,
    oth: `oth${config.yy}.zip`,
    indiv: `indiv${config.yy}.zip`,
  };

  const archives = Object.fromEntries(
    Object.entries(archiveNames).map(([key, name]) => [key, path.join(args.archiveDir, name)])
  );
  for (const archivePath of Object.values(archives)) await requireNonEmptyFile(archivePath);

  const targets = [
    { key: 'cm', target: path.join(args.bulkRoot, `cm${config.legacySuffix}.txt`) },
    { key: 'cn', target: path.join(args.bulkRoot, `cn${config.yy}`) },
    { key: 'ccl', target: path.join(args.bulkRoot, `ccl${config.legacySuffix}.txt`) },
    { key: 'pas2', target: path.join(args.bulkRoot, `itpas2${config.legacySuffix}.txt`) },
    { key: 'oth', target: path.join(args.bulkRoot, `oth${config.yy}`) },
    { key: 'indiv', target: path.join(args.bulkRoot, `indiv${config.yy}`) },
  ];

  if (!args.apply) {
    console.log(JSON.stringify({ cycle: args.cycle, archiveDir: args.archiveDir, targets }, null, 2));
    return;
  }

  await mkdir(args.bulkRoot, { recursive: true });
  const tempRoot = await mkdtemp(path.join(args.bulkRoot, `.install-${args.cycle}-`));
  const newRoot = path.join(tempRoot, 'new');
  const oldRoot = path.join(tempRoot, 'old');
  await mkdir(newRoot, { recursive: true });
  await mkdir(oldRoot, { recursive: true });

  const extractionDirs = {};
  for (const key of Object.keys(archives)) {
    const destination = path.join(newRoot, key);
    await mkdir(destination, { recursive: true });
    await run('unzip', ['-q', archives[key], '-d', destination]);
    extractionDirs[key] = destination;
  }

  const extracted = {
    cm: path.join(extractionDirs.cm, 'cm.txt'),
    cn: extractionDirs.cn,
    ccl: path.join(extractionDirs.ccl, 'ccl.txt'),
    pas2: path.join(extractionDirs.pas2, 'itpas2.txt'),
    oth: extractionDirs.oth,
    indiv: extractionDirs.indiv,
  };

  const requiredFiles = [
    extracted.cm,
    path.join(extracted.cn, 'cn.txt'),
    extracted.ccl,
    extracted.pas2,
    path.join(extracted.oth, 'itoth.txt'),
    path.join(extracted.indiv, 'itcont.txt'),
  ];
  const extractedFileBytes = {};
  for (const filePath of requiredFiles) extractedFileBytes[path.basename(filePath)] = await requireNonEmptyFile(filePath);

  const byDateDir = path.join(extracted.indiv, 'by_date');
  const byDateFiles = (await readdir(byDateDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.txt'));
  if (byDateFiles.length === 0) throw new Error(`No by_date shards found for cycle ${args.cycle}`);

  const installed = [];
  try {
    for (const targetSpec of targets) {
      const sourcePath = extracted[targetSpec.key];
      const backupPath = path.join(oldRoot, path.basename(targetSpec.target));
      const hadOldTarget = await exists(targetSpec.target);
      if (hadOldTarget) await rename(targetSpec.target, backupPath);

      try {
        await rename(sourcePath, targetSpec.target);
      } catch (error) {
        if (hadOldTarget && await exists(backupPath)) await rename(backupPath, targetSpec.target);
        throw error;
      }
      installed.push({ ...targetSpec, sourcePath, backupPath, hadOldTarget });
    }
  } catch (error) {
    for (const item of installed.reverse()) {
      await rm(item.target, { recursive: true, force: true });
      if (item.hadOldTarget && await exists(item.backupPath)) await rename(item.backupPath, item.target);
    }
    console.error(`Install failed; temporary files retained at ${tempRoot}`);
    throw error;
  }

  const installedBytes = {};
  for (const item of installed) {
    const installedStat = await stat(item.target);
    installedBytes[item.key] = installedStat.isDirectory()
      ? await directoryBytes(item.target)
      : installedStat.size;
  }

  await rm(tempRoot, { recursive: true, force: true });
  console.log(JSON.stringify({
    cycle: args.cycle,
    status: 'installed',
    byDateShardCount: byDateFiles.length,
    extractedFileBytes,
    installedBytes,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
