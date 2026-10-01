#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';
import { execFileSync } from 'child_process';

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function curlText(url) {
  return execFileSync('curl', ['-sL', '-A', 'Mozilla/5.0', url], { encoding: 'utf8' });
}

function extractFirstPortraitUrl(html) {
  const matches = [...html.matchAll(/https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^"]+/g)];
  return matches[0]?.[0] || null;
}

function fetchPageTitle(name) {
  const html = curlText(`https://en.wikipedia.org/wiki/${encodeURIComponent(name.replaceAll(' ', '_'))}`);
  const titleMatch = html.match(/<title>([^<]+) - Wikipedia<\/title>/i);
  const title = titleMatch?.[1] || name;
  return { html, title };
}

function main() {
  const [, , namesPath, outDirArg] = process.argv;
  if (!namesPath) {
    console.error('Usage: fetch_wiki_portraits.mjs <names.json> [out-dir]');
    process.exit(1);
  }

  const outDir = outDirArg
    ? path.resolve(outDirArg)
    : path.resolve('tools/img-gen/output/research/wiki-portraits');

  fs.mkdirSync(outDir, { recursive: true });

  const names = JSON.parse(fs.readFileSync(path.resolve(namesPath), 'utf8'));
  const results = [];

  for (const name of names) {
    try {
      const { html, title } = fetchPageTitle(name);
      const portraitUrl = extractFirstPortraitUrl(html);
      const entry = {
        name,
        title,
        portraitUrl,
        status: portraitUrl ? 'ok' : 'no-portrait',
      };

      if (portraitUrl) {
        const ext = path.extname(new URL(portraitUrl).pathname) || '.jpg';
        const localImage = path.join(outDir, `${slugify(name)}${ext}`);
        execFileSync('curl', ['-sL', '-A', 'Mozilla/5.0', portraitUrl, '-o', localImage]);
        entry.localImage = localImage;
      }

      results.push(entry);
    } catch (error) {
      results.push({
        name,
        status: 'error',
        error: String(error),
      });
    }
  }

  const outPath = path.join(outDir, 'index.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      {
        outPath,
        total: results.length,
        withPortrait: results.filter((entry) => entry.portraitUrl).length,
        missing: results.filter((entry) => !entry.portraitUrl).map((entry) => entry.name),
      },
      null,
      2,
    ),
  );
}

main();
