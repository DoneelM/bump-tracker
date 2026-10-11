import { describe, expect, it } from 'vitest';
import { startSetup, sync, unlock, type LocalData } from './engine';
import { createDriveProvider, KEYS_NAME, VAULT_NAME } from './googleDrive';
import type { SyncState, SyncStateStore } from './keyStore';
import { SignInRequiredError } from './provider';

interface StoredFile {
  id: string;
  name: string;
  parents: string[];
  version: number;
  appProperties: Record<string, string>;
  bytes: Uint8Array;
}

const enc = new TextEncoder();
function indexOf(hay: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/** In-memory stand-in for the Drive v3 endpoints the provider uses; records every request. */
function fakeDrive(token = 'tok') {
  const files = new Map<string, StoredFile>();
  const requests: { method: string; url: string; auth: string | null; contentType: string | null }[] = [];
  let nextId = 1;
  let version = 100;

  async function parseMultipart(body: Blob, contentType: string) {
    const boundary = /boundary=(\S+)/.exec(contentType)![1]!;
    const bytes = new Uint8Array(await body.arrayBuffer());
    const sep = enc.encode(`--${boundary}`);
    const p1 = indexOf(bytes, sep);
    const p2 = indexOf(bytes, sep, p1 + sep.length);
    const end = indexOf(bytes, enc.encode(`\r\n--${boundary}--`), p2);
    const headEnd = (from: number) => indexOf(bytes, enc.encode('\r\n\r\n'), from) + 4;
    const meta = JSON.parse(new TextDecoder().decode(bytes.subarray(headEnd(p1), p2 - 2)));
    return { meta, media: bytes.slice(headEnd(p2), end) };
  }

  const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });

  const fetchImpl: typeof fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const headers = new Headers(init.headers);
    const method = init.method ?? 'GET';
    requests.push({ method, url: url.toString(), auth: headers.get('Authorization'), contentType: headers.get('Content-Type') });
    if (headers.get('Authorization') !== `Bearer ${token}`) return json({ error: 'unauthorized' }, 401);
    const id = /\/files\/([^/?]+)/.exec(url.pathname)?.[1];
    if (method === 'GET' && !id) {
      const out = [...files.values()].map((f) => ({ id: f.id, name: f.name, version: String(f.version), appProperties: f.appProperties }));
      return json({ files: out });
    }
    if (method === 'GET' && id && url.searchParams.get('alt') === 'media') {
      const f = files.get(id);
      return f ? new Response(f.bytes.slice()) : json({}, 404);
    }
    if ((method === 'POST' || method === 'PATCH') && url.pathname.startsWith('/upload/')) {
      const { meta, media } = await parseMultipart(init.body as Blob, headers.get('Content-Type')!);
      if (method === 'POST') {
        const f: StoredFile = { id: `f${nextId++}`, name: meta.name, parents: meta.parents, version: ++version, appProperties: meta.appProperties ?? {}, bytes: media };
        files.set(f.id, f);
        return json({ id: f.id, version: String(f.version) });
      }
      const f = files.get(id!)!;
      Object.assign(f, { bytes: media, version: ++version, appProperties: { ...f.appProperties, ...meta.appProperties } });
      return json({ id: f.id, version: String(f.version) });
    }
    if (method === 'DELETE' && id) {
      files.delete(id);
      return new Response(null, { status: 204 });
    }
    return json({}, 400);
  };
  return { files, requests, fetchImpl };
}

class MemoryStore implements SyncStateStore {
  state: SyncState | null = null;
  async load() {
    return this.state;
  }
  async save(s: SyncState) {
    this.state = { ...s, base: { ...s.base } };
  }
  async clear() {
    this.state = null;
  }
}

const local = (data: Record<string, unknown>): LocalData & { data: Record<string, unknown> } => ({
  data,
  read() {
    return structuredClone(this.data);
  },
  async apply(v) {
    this.data = structuredClone(v);
    return { ok: true };
  },
});

describe('Google Drive provider', () => {
  it('syncs two devices through the hidden app folder, with only ciphertext stored', async () => {
    const drive = fakeDrive();
    const provider = createDriveProvider({ getToken: () => 'tok', fetch: drive.fetchImpl });
    const a = { provider, store: new MemoryStore(), local: local({ 'weight-pre-pregnancy': { heightCm: 165, weightKg: 60 } }) };
    const { code, finish } = await startSetup(a);
    await finish();

    const stored = [...drive.files.values()];
    expect(stored.map((f) => f.name).sort()).toEqual([KEYS_NAME, VAULT_NAME]);
    expect(stored.every((f) => f.parents.length === 1 && f.parents[0] === 'appDataFolder')).toBe(true);
    const vault = stored.find((f) => f.name === VAULT_NAME)!;
    expect(vault.appProperties).toEqual({ v: '1' });
    expect(new TextDecoder().decode(vault.bytes)).not.toContain('weightKg');
    expect(drive.requests.every((r) => r.auth === 'Bearer tok' && r.url.startsWith('https://www.googleapis.com/'))).toBe(true);
    expect(drive.requests.filter((r) => r.method !== 'GET').every((r) => r.contentType?.startsWith('multipart/related; boundary='))).toBe(true);

    const b = { provider, store: new MemoryStore(), local: local({}) };
    await unlock(b, code);
    expect(b.local.data).toEqual({ 'weight-pre-pregnancy': { heightCm: 165, weightKg: 60 } });
    b.local.data['weight-pre-pregnancy'] = { heightCm: 165, weightKg: 61 };
    await sync(b);
    expect(vault.appProperties).toEqual({ v: '2' });
    await sync(a);
    expect(a.local.data['weight-pre-pregnancy']).toEqual({ heightCm: 165, weightKg: 61 });
  });

  it('reports a write from another device instead of overwriting it', async () => {
    const drive = fakeDrive();
    const provider = createDriveProvider({ getToken: () => 'tok', fetch: drive.fetchImpl });
    expect(await provider.saveVault(new Uint8Array([1]), 1, null)).toBe('ok');
    const v = (await provider.loadVault())!;
    expect(await provider.saveVault(new Uint8Array([2]), 2, v.remoteVersion)).toBe('ok');
    expect(await provider.saveVault(new Uint8Array([3]), 3, v.remoteVersion)).toBe('changed');
    expect(await provider.saveVault(new Uint8Array([3]), 1, null)).toBe('changed');
  });

  it('asks for sign-in on a 401 or with no token, and deletes only its own files', async () => {
    const drive = fakeDrive('good');
    let dropped = 0;
    const bad = createDriveProvider({ getToken: () => 'expired', onUnauthorized: () => dropped++, fetch: drive.fetchImpl });
    await expect(bad.loadKeys()).rejects.toBeInstanceOf(SignInRequiredError);
    expect(dropped).toBe(1);
    const none = createDriveProvider({
      getToken: () => {
        throw new SignInRequiredError();
      },
      fetch: drive.fetchImpl,
    });
    await expect(none.loadVault()).rejects.toBeInstanceOf(SignInRequiredError);

    const good = createDriveProvider({ getToken: () => 'good', fetch: drive.fetchImpl });
    await good.saveKeys({ format: 1, syncId: 'abcdefghijklmnop', wrapRc: `${'A'.repeat(54)}==` });
    await good.saveVault(new Uint8Array([1]), 1, null);
    drive.files.set('other', { id: 'other', name: 'something-else', parents: ['appDataFolder'], version: 1, appProperties: {}, bytes: new Uint8Array() });
    await good.deleteAll();
    expect([...drive.files.keys()]).toEqual(['other']);
  });

  it('rejects a damaged keys file or vault counter', async () => {
    const drive = fakeDrive();
    const p = createDriveProvider({ getToken: () => 'tok', fetch: drive.fetchImpl });
    drive.files.set('k', { id: 'k', name: KEYS_NAME, parents: ['appDataFolder'], version: 1, appProperties: {}, bytes: enc.encode('{"format":2}') });
    drive.files.set('v', { id: 'v', name: VAULT_NAME, parents: ['appDataFolder'], version: 1, appProperties: { v: 'x' }, bytes: new Uint8Array([1]) });
    await expect(p.loadKeys()).rejects.toThrow('damaged');
    await expect(p.loadVault()).rejects.toThrow('damaged');
  });

  it('turns a network failure into a readable error', async () => {
    const p = createDriveProvider({
      getToken: () => 'tok',
      fetch: async () => {
        throw new TypeError('Failed to fetch');
      },
    });
    await expect(p.loadKeys()).rejects.toThrow('Couldn’t reach Google Drive');
  });
});
