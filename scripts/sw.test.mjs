import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { injectPrecache } from './sw-precache.mjs';

const SCOPE = 'https://app.test/';

function fakeDist(bundle) {
  const dir = mkdtempSync(join(tmpdir(), 'bt-sw-'));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), `<script src="./assets/${bundle}"></script>`);
  writeFileSync(join(dir, 'assets', bundle), `console.log('${bundle}')`);
  writeFileSync(join(dir, 'assets', 'index-x.css'), 'body{}');
  copyFileSync('public/sw.js', join(dir, 'sw.js'));
  return dir;
}

/** Runs sw.js against in-memory Cache Storage. `server` maps paths to bodies; `online` toggles fetch. */
function loadWorker(dir, storage, server, net) {
  const handlers = {};
  const open = async (name) => {
    if (!storage.has(name)) storage.set(name, new Map());
    const m = storage.get(name);
    const key = (r) => new URL(typeof r === 'string' ? r : r.url, SCOPE).href.split('?')[0];
    return {
      addAll: async (reqs) => { for (const r of reqs) m.set(key(r), await fetchImpl(r)); },
      match: async (r) => m.get(key(r)),
    };
  };
  const fetchImpl = async (r) => {
    if (!net.online) throw new TypeError('offline');
    const path = new URL(typeof r === 'string' ? r : r.url, SCOPE).pathname.slice(1);
    if (!(path in server)) throw new Error('404 ' + path);
    return server[path];
  };
  const self = {
    registration: { scope: SCOPE }, location: { origin: 'https://app.test' },
    addEventListener: (t, fn) => (handlers[t] = fn), skipWaiting: async () => {}, clients: { claim: async () => {} },
  };
  const caches = { open, keys: async () => [...storage.keys()], delete: async (k) => storage.delete(k) };
  class Request { constructor(url) { this.url = new URL(url, SCOPE).href; } }
  class Response { constructor(body, init) { Object.assign(this, init, { body, redirected: false }); } }
  vm.runInNewContext(readFileSync(join(dir, 'sw.js'), 'utf8'), { self, caches, fetch: fetchImpl, Request, Response, URL });
  const run = (type, ev) => new Promise((done, fail) => {
    let p;
    handlers[type]({ ...ev, waitUntil: (x) => (p = x), respondWith: (x) => (p = x) });
    Promise.resolve(p).then(done, fail);
  });
  return {
    install: () => run('install', {}),
    activate: () => run('activate', {}),
    get: (path, mode = 'no-cors') => run('fetch', { request: { method: 'GET', url: SCOPE + path, mode } }),
  };
}

const serverFor = (dir, bundle) => ({
  'index.html': `html:${bundle}`, [`assets/${bundle}`]: `js:${bundle}`, 'assets/index-x.css': 'css',
});

describe('service worker', () => {
  it('precaches every built file, including hashed bundles', () => {
    const dir = fakeDist('index-aaa.js');
    const { list, version } = injectPrecache(dir);
    expect(list).toEqual(['./assets/index-aaa.js', './assets/index-x.css', './index.html']);
    expect(version).toMatch(/^[0-9a-f]{12}$/);
    expect(readFileSync(join(dir, 'sw.js'), 'utf8')).toContain('"./assets/index-aaa.js"');
  });

  it('precaches only app files, not host config or dotfiles', () => {
    const dir = fakeDist('index-aaa.js');
    mkdirSync(join(dir, 'icons'));
    writeFileSync(join(dir, 'icons', 'icon.svg'), '<svg/>');
    writeFileSync(join(dir, 'icons', '.DS_Store'), '');
    for (const f of ['_headers', '_redirects', '.DS_Store', 'manifest.webmanifest']) writeFileSync(join(dir, f), 'x');
    const { list, skipped } = injectPrecache(dir);
    expect(list).toEqual(['./assets/index-aaa.js', './assets/index-x.css', './icons/icon.svg', './index.html', './manifest.webmanifest']);
    expect(skipped).toEqual(['.DS_Store', '_headers', '_redirects', 'icons/.DS_Store']);
  });

  it('hashes _headers into the version but never precaches it', () => {
    const a = fakeDist('index-aaa.js');
    const b = fakeDist('index-aaa.js');
    writeFileSync(join(a, '_headers'), '/*\n  X-Test: 1\n');
    writeFileSync(join(b, '_headers'), '/*\n  X-Test: 2\n');
    const ra = injectPrecache(a);
    expect(ra.list).not.toContain('./_headers');
    expect(injectPrecache(b).version).not.toBe(ra.version);
  });

  it('serves a shell cached through a redirect as a plain response', async () => {
    const v = fakeDist('index-ddd.js');
    injectPrecache(v);
    const server = serverFor(v, 'index-ddd.js');
    server['index.html'] = { status: 200, statusText: 'OK', headers: {}, redirected: true, blob: async () => 'html' };
    const w = loadWorker(v, new Map(), server, { online: true });
    await w.install();
    await w.activate();
    const res = await w.get('', 'navigate');
    expect(res).toMatchObject({ body: 'html', status: 200, redirected: false });
  });

  it('works offline after one online visit, and after a redeploy', async () => {
    const storage = new Map();
    const net = { online: true };
    const v1 = fakeDist('index-aaa.js');
    injectPrecache(v1);
    const w1 = loadWorker(v1, storage, serverFor(v1, 'index-aaa.js'), net);
    await w1.install();
    await w1.activate();
    net.online = false;
    expect(await w1.get('?x#/tools', 'navigate')).toBe('html:index-aaa.js');
    expect(await w1.get('assets/index-aaa.js')).toBe('js:index-aaa.js');

    // Redeploy: new bundle hash means new worker; it installs all its files before taking over.
    net.online = true;
    const v2 = fakeDist('index-bbb.js');
    injectPrecache(v2);
    const w2 = loadWorker(v2, storage, serverFor(v2, 'index-bbb.js'), net);
    await w2.install();
    await w2.activate();
    expect(storage.size).toBe(1); // old cache removed
    net.online = false;
    expect(await w2.get('', 'navigate')).toBe('html:index-bbb.js');
    expect(await w2.get('assets/index-bbb.js')).toBe('js:index-bbb.js');
  });

  it('does not activate a new version if any of its files fail to download', async () => {
    const storage = new Map();
    const v = fakeDist('index-ccc.js');
    injectPrecache(v);
    const server = serverFor(v, 'index-ccc.js');
    delete server['assets/index-ccc.js'];
    await expect(loadWorker(v, storage, server, { online: true }).install()).rejects.toThrow();
  });
});
