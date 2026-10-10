// Headless end-to-end check that the built app opens offline, after a first visit and after a redeploy.
// Usage: npm run build && npm i --no-save playwright && npx playwright install chromium && npm run check:offline
import { cpSync, mkdtempSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { injectPrecache } from './sw-precache.mjs';

const { chromium } = await import('playwright').catch(() => {
  console.error('Playwright not installed: npm i --no-save playwright && npx playwright install chromium');
  process.exit(2);
});

// Two "deploys": v1 is the build; v2 is the same build with a renamed (new-hash) JS bundle.
const v1 = mkdtempSync(join(tmpdir(), 'bt-v1-'));
cpSync(process.env.DIST ?? 'dist', v1, { recursive: true });
const v2 = mkdtempSync(join(tmpdir(), 'bt-v2-'));
cpSync(process.env.DIST ?? 'dist', v2, { recursive: true });
const bundle = readdirSync(join(v2, 'assets')).find((f) => /^index-.+\.js$/.test(f));
const bundle2 = bundle.replace('.js', '-NEWDEPLOY.js');
renameSync(join(v2, 'assets', bundle), join(v2, 'assets', bundle2));
writeFileSync(join(v2, 'index.html'), readFileSync(join(v2, 'index.html'), 'utf8').replace(bundle, bundle2));
injectPrecache(v2);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
let root = v1;
let up = true;
const server = createServer((req, res) => {
  if (!up) return req.socket.destroy();
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return res.writeHead(400).end();
  }
  // Contain every path inside the served root (no ../ traversal, including %2e%2e%2f).
  const base = resolve(root);
  const path = resolve(base, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!path.startsWith(base + sep)) return res.writeHead(404).end();
  try {
    const body = readFileSync(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, '127.0.0.1');
await new Promise((ok) => server.once('listening', ok));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const failures = [];
const setOnline = async (on) => { up = on; await ctx.setOffline(!on); };
const rendered = () => page.evaluate(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
const waitForCache = async (needle) => {
  for (let i = 0; i < 100; i++) {
    const ready = await page.evaluate(async (n) => {
      const keys = (await caches.keys()).filter((k) => k.startsWith('bump-tracker-'));
      const reg = await navigator.serviceWorker.getRegistration();
      return keys.length === 1 && keys[0].endsWith(n) && !!reg?.active && !reg.installing && !reg.waiting;
    }, needle);
    if (ready) return;
    await page.waitForTimeout(200);
  }
  throw new Error(`service worker ${needle} never became active`);
};
const version = (dir) => readFileSync(join(dir, 'sw.js'), 'utf8').match(/const VERSION = '([^']+)'/)[1];

try {
  // A: one online visit, then offline reload.
  await page.goto(url);
  await waitForCache(version(v1));
  await setOnline(false);
  await page.reload();
  if (!(await rendered())) failures.push('A: blank screen offline after first visit');

  // B: redeploy, one online launch, then offline reload must show the NEW build.
  await setOnline(true);
  root = v2;
  await page.reload();
  await waitForCache(version(v2));
  await setOnline(false);
  await page.reload();
  if (!(await rendered())) failures.push('B: blank screen offline after redeploy');
  const usesNew = await page.evaluate((b) => !!document.querySelector(`script[src*="${b}"]`), bundle2);
  if (!usesNew) failures.push('B: offline page is not the new deploy');
} catch (e) {
  failures.push(String(e));
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error('offline check FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('offline check OK: first visit (A) and redeploy (B) both render offline');
