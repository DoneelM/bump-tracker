// Post-build step: fills dist/sw.js with every built file and a content hash, then checks the result.
// Each deploy therefore ships a byte-different worker with its own cache that holds all of its files.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

export function injectPrecache(dist) {
  const files = walk(dist).map((f) => relative(dist, f).split('\\').join('/')).filter((f) => f !== 'sw.js').sort();
  const hash = createHash('sha256');
  for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
  const version = hash.digest('hex').slice(0, 12);
  // _headers is hashed (a header-only change ships a new SW) but not precached: Cloudflare 404s it, which would fail cache.addAll.
  const list = files.filter((f) => f !== '_headers').map((f) => './' + f);
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
  return { version, list };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { version, list } = injectPrecache(process.argv[2] ?? 'dist');
  console.log(`sw.js: precaching ${list.length} files, version ${version}`);
}
