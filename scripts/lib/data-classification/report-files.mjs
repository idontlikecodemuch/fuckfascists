import { readdir } from 'node:fs/promises';
import path from 'node:path';

export async function findLatestReport(reportsDir, prefix, options = {}) {
  const excludeSuffixes = options.excludeSuffixes ?? ['.rows.json', '.people.rows.json', '.entities.rows.json'];
  const entries = await readdir(reportsDir, { withFileTypes: true });
  const filenames = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(prefix) &&
        entry.name.endsWith('.json') &&
        !excludeSuffixes.some((suffix) => entry.name.endsWith(suffix))
    )
    .map((entry) => entry.name)
    .sort();

  if (filenames.length === 0) {
    throw new Error(`No report found for prefix ${prefix} under ${reportsDir}`);
  }

  return path.join(reportsDir, filenames[filenames.length - 1]);
}

export function replaceJsonSuffix(filePath, replacement) {
  return filePath.replace(/\.json$/i, replacement);
}
