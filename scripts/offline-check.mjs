// Headless end-to-end check of the built app, served with the §3 security headers (scripts/_headers):
// no CSP or Trusted Types violation on any screen (incl. the Recharts charts and bump photos),
// and it opens offline after a first visit and after a redeploy.
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

// Cloudflare `_headers` subset: a path line (exact, or a prefix ending in *), then indented `Name: value` lines.
const RULES = [];
for (const line of readFileSync(new URL('./_headers', import.meta.url), 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  if (!/^\s/.test(line)) RULES.push({ path: line.trim(), headers: {} });
  else {
    const i = line.indexOf(':');
    RULES.at(-1).headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}
if (!RULES[0]?.headers['Content-Security-Policy']) throw new Error('scripts/_headers has no CSP for /*');
const headersFor = (pathname) =>
  Object.assign({}, ...RULES.filter(({ path }) => (path.endsWith('*') ? pathname.startsWith(path.slice(0, -1)) : pathname === path)).map((r) => r.headers));

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
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', ...headersFor(pathname) });
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
// Every CSP / Trusted Types violation in any page, reported by the browser itself.
// shortcut: violations inside the service worker itself aren't seen (no document); a blocked SW still fails A/B. Add worker console capture if sw.js grows.
const violations = [];
await ctx.exposeBinding('__cspViolation', ({ page: p }, v) => violations.push({ ...v, at: new URL(p.url()).hash || '/' }));
await ctx.addInitScript(() =>
  document.addEventListener('securitypolicyviolation', (e) =>
    window.__cspViolation({ directive: e.effectiveDirective, blocked: e.blockedURI, source: `${e.sourceFile}:${e.lineNumber}`, sample: e.sample }),
  ),
);
page.on('pageerror', (e) => failures.push(`page error at ${new URL(page.url()).hash || '/'}: ${e.message}`));
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

// Demo data so the charts, the 5-1-1 note and the print summary all render. Dates are relative to today.
const seed = () => {
  const day = (offset) => new Date(Date.now() + offset * 864e5).toLocaleDateString('en-CA');
  const now = Date.now();
  const data = {
    profile: { dating: { method: 'lmp', lmp: day(-210) }, nickname: 'Check', updatedAt: new Date().toISOString() },
    'weight-pre-pregnancy': { heightCm: 165, weightKg: 62 },
    'weight-entries': [-140, -84, -28, -1].map((d, i) => ({ id: `w${i}`, date: day(d), weightKg: 63 + i * 3, note: '' })),
    'scan-entries': [{ id: 's1', date: day(-14), type: 'growth', notes: '', efwG: 1100, bpdMm: 72, hcMm: 260, acMm: 240, flMm: 52 }],
    contractions: { contractions: Array.from({ length: 13 }, (_, i) => ({ start: now - (13 - i) * 5 * 6e4, end: now - (13 - i) * 5 * 6e4 + 6e4 })), activeStart: null },
  };
  for (const [k, v] of Object.entries(data)) localStorage.setItem(`bt:v1:${k}`, JSON.stringify(v));
};
const ROUTES = ['/', '/weeks', '/weeks/24', '/tools', '/tools/weight', '/tools/contractions', '/tools/scans', '/tools/kicks', '/tools/photos', '/tools/checklists', '/journal', '/more', '/more/partner', '/more/print', '/more/data', '/more/sources', '/more/about', '/settings'];

try {
  // A: one online visit, then offline reload.
  await page.goto(url);
  await waitForCache(version(v1));

  // Self-check: a Trusted Types sink must be blocked and reported, or this check can't see violations.
  await page.evaluate(() => { try { document.body.insertAdjacentHTML('beforeend', ''); } catch {} });
  await page.waitForTimeout(100);
  if (!violations.some((v) => v.directive === 'require-trusted-types-for')) failures.push('self-check: Trusted Types violation was not reported');
  violations.length = 0;

  // Every screen with demo data, under the headers. Recharts (weight, scans) and photos are checked explicitly.
  await page.evaluate(seed);
  for (const r of ROUTES) {
    await page.goto(`${url}#${r}`);
    await page.waitForSelector('h1', { timeout: 5000 });
    if (r === '/tools/weight' || r === '/tools/scans') {
      await page.waitForSelector('.recharts-surface', { timeout: 5000 }).catch(() => failures.push(`${r}: Recharts chart did not render`));
    }
    if (r === '/tools/contractions' && !(await page.getByText('5-1-1 pattern').count())) failures.push(`${r}: 5-1-1 note did not show`);
  }
  // Photos: add two (canvas re-encode + IndexedDB + blob: URLs), then open the slideshow.
  await page.goto(`${url}#/tools/photos`);
  const fileInput = page.locator('input[type=file]');
  for (const [week, icon] of [['30', 'icon-512.png'], ['29', 'icon-192.png']]) {
    await page.selectOption('#ph-week', week);
    await fileInput.setInputFiles(join(v1, 'icons', icon));
    await page.waitForSelector(`img[alt^="Bump photo, week ${week}"]`, { timeout: 5000 });
  }
  const shown = await page.$$eval('img[alt^="Bump photo"]', (imgs) => Promise.all(imgs.map((i) => i.decode().then(() => i.src.startsWith('blob:'), () => false))));
  if (shown.length !== 2 || !shown.every(Boolean)) failures.push('photos: blob: thumbnails did not load');
  await page.getByRole('button', { name: /Slideshow/ }).click();
  await page.keyboard.press('Escape');
  await page.goto(url);
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
for (const v of violations) failures.push(`CSP violation at ${v.at}: ${v.directive} blocked ${v.blocked || '(inline)'} from ${v.source} ${v.sample}`);
if (failures.length) {
  console.error('offline check FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`offline check OK: ${ROUTES.length} screens + photos with no CSP/Trusted Types violation; first visit (A) and redeploy (B) both render offline`);
