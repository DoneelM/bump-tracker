// Post-build step: fills dist/sw.js with every app file in dist/ and a content hash, then checks the result.
// Each deploy therefore ships a byte-different worker with its own cache that holds all of its files.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

// Only what the app loads. Anything else in dist/ (host config such as _headers or _redirects, dotfiles) may not be
// served, and one 404 fails the whole install, which leaves existing users on the old version.
const ROOT_FILES = ['index.html', 'manifest.webmanifest'];
const DIRS = ['assets/', 'icons/', 'images/'];
const isAppFile = (f) => (ROOT_FILES.includes(f) || DIRS.some((d) => f.startsWith(d))) && !f.split('/').some((s) => s.startsWith('.'));

export function injectPrecache(dist) {
  const all = walk(dist).map((f) => relative(dist, f).split('\\').join('/')).filter((f) => f !== 'sw.js').sort();
  const files = all.filter(isAppFile);
  const skipped = all.filter((f) => !isAppFile(f));
  // Hash every file, precached or not: a header-only change (_headers) still ships a new worker, so pages it
  // serves from cache pick up the new headers.
  const hash = createHash('sha256');
  for (const f of all) hash.update(f).update(readFileSync(join(dist, f)));
  const version = hash.digest('hex').slice(0, 12);
  const list = files.map((f) => './' + f);
  const swPath = join(dist, 'sw.js');
  const sw = readFileSync(swPath, 'utf8')
    .replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`)
    .replace(/const PRECACHE = .*;/, `const PRECACHE = ${JSON.stringify(list)};`);
  writeFileSync(swPath, sw);
  const check = readFileSync(swPath, 'utf8');
  const missing = list.filter((f) => !check.includes(JSON.stringify(f)));
  if (!check.includes(`'${version}'`) || missing.length || !list.some((f) => /^\.\/assets\/index-.+\.js$/.test(f))) {
    throw new Error(`sw.js precache injection failed (missing: ${missing.join(', ') || 'version/bundle'})`);
  }
  return { version, list, skipped };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { version, list, skipped } = injectPrecache(process.argv[2] ?? 'dist');
  console.log(`sw.js: precaching ${list.length} files, version ${version}`);
  if (skipped.length) console.log(`sw.js: not precached (not app files): ${skipped.join(', ')}`);
}
