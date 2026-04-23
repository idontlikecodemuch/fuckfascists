import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// Dirent.isFile() returns false for symbolic links; fall back to stat() so
// worktrees sharing the main repo's reports dir via symlink still resolve.
async function isFileLike(entry, fullPath) {
  if (entry.isFile()) return true;
  if (!entry.isSymbolicLink()) return false;
  try {
    const stats = await stat(fullPath);
    return stats.isFile();
  } catch {
    return false;
  }
}

export async function findLatestReport(reportsDir, prefix, options = {}) {
  const excludeSuffixes = options.excludeSuffixes ?? ['.rows.json', '.people.rows.json', '.entities.rows.json'];
  const entries = await readdir(reportsDir, { withFileTypes: true });
  const filenames = [];
  for (const entry of entries) {
    if (!entry.name.startsWith(prefix)) continue;
    if (!entry.name.endsWith('.json')) continue;
    if (excludeSuffixes.some((suffix) => entry.name.endsWith(suffix))) continue;
    if (!(await isFileLike(entry, path.join(reportsDir, entry.name)))) continue;
    filenames.push(entry.name);
  }
  filenames.sort();

  if (filenames.length === 0) {
    throw new Error(`No report found for prefix ${prefix} under ${reportsDir}`);
  }

  return path.join(reportsDir, filenames[filenames.length - 1]);
}

export function replaceJsonSuffix(filePath, replacement) {
  return filePath.replace(/\.json$/i, replacement);
}
