import { describe, expect, it } from 'vitest';
import { deleteSyncedCopy, rememberCode, startSetup, sync, unlock, type LocalData, type SyncDeps } from './engine';
import type { SyncState, SyncStateStore } from './keyStore';
import type { KeysFile, RemoteVault, SyncProvider } from './provider';

/** One provider shared by "devices", like one Google account's hidden app folder. */
class FakeProvider implements SyncProvider {
  keys: KeysFile | null = null;
  vault: RemoteVault | null = null;
  private rev = 0;
  /** Runs once just before the next saveVault compares versions, to simulate another device writing first. */
  beforeSave: (() => Promise<unknown>) | null = null;
  async loadKeys() {
    return this.keys;
  }
  async saveKeys(k: KeysFile) {
    this.keys = k;
  }
  async loadVault() {
    return this.vault && { ...this.vault };
  }
  async saveVault(bytes: Uint8Array<ArrayBuffer>, counter: number, expected: string | null) {
    const hook = this.beforeSave;
    this.beforeSave = null;
    await hook?.();
    if ((this.vault?.remoteVersion ?? null) !== expected) return 'changed' as const;
    this.vault = { bytes, counter, remoteVersion: String(++this.rev) };
    return 'ok' as const;
  }
  async deleteAll() {
    this.keys = null;
    this.vault = null;
  }
}

class MemoryStore implements SyncStateStore {
  state: SyncState | null = null;
  async load() {
    return this.state && { ...this.state, base: { ...this.state.base } };
  }
  async save(s: SyncState) {
    this.state = { ...s, base: { ...s.base } };
  }
  async clear() {
    this.state = null;
  }
}

class MemoryLocal implements LocalData {
  constructor(public data: Record<string, unknown> = {}) {}
  read() {
    return structuredClone(this.data);
  }
  async apply(values: Record<string, unknown>) {
    this.data = structuredClone(values);
    return { ok: true as const };
  }
}

const device = (provider: FakeProvider, data: Record<string, unknown> = {}) => {
  const local = new MemoryLocal(data);
  const store = new MemoryStore();
  const deps: SyncDeps = { provider, store, local, now: () => new Date('2026-10-11T00:00:00Z') };
  return { deps, local, store };
};

const profile = (nickname: string) => ({
  dating: { method: 'lmp', lmp: '2026-04-01' },
  dueDate: '2027-01-06',
  nickname,
  updatedAt: '2026-04-02T00:00:00.000Z',
});
const pre = (weightKg: number) => ({ heightCm: 165, weightKg });

async function setUp(provider: FakeProvider, data: Record<string, unknown>) {
  const a = device(provider, data);
  const { code, finish } = await startSetup(a.deps);
  expect(await finish()).toEqual({ status: 'synced', pushed: true, updated: [] });
  return { a, code };
}

describe('sync engine', () => {
  it('sets up on one device and unlocks on another with the recovery code', async () => {
    const p = new FakeProvider();
    const { code } = await setUp(p, { profile: profile('Bean') });
    expect(code).toMatch(/^[A-Z2-7]{5}(-[A-Z2-7]{5}){3}-[A-Z2-7]{6}$/);
    expect(p.vault!.counter).toBe(1);

    const b = device(p);
    expect(await unlock(b.deps, code.toLowerCase().replace(/-/g, ' '))).toEqual({
      status: 'synced',
      pushed: false,
      updated: ['Pregnancy details'],
    });
    expect(b.local.data).toEqual({ profile: profile('Bean') });
  });

  it('stores nothing until the user confirms they kept the code', async () => {
    const p = new FakeProvider();
    const a = device(p, { profile: profile('Bean') });
    await startSetup(a.deps);
    expect(p.keys).toBeNull();
    expect(a.store.state).toBeNull();
  });

  it('refuses a malformed or wrong recovery code', async () => {
    const p = new FakeProvider();
    await setUp(p, { profile: profile('Bean') });
    const b = device(p);
    await expect(unlock(b.deps, 'not a code')).rejects.toThrow('doesn’t look like a recovery code');
    await expect(unlock(b.deps, 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAAA')).rejects.toThrow('doesn’t match');
    expect(b.store.state).toBeNull();
  });

  it('takes the side that changed, in both directions', async () => {
    const p = new FakeProvider();
    const { a, code } = await setUp(p, { profile: profile('Bean'), 'weight-pre-pregnancy': pre(60) });
    const b = device(p);
    await unlock(b.deps, code);

    b.local.data['weight-pre-pregnancy'] = pre(61);
    expect(await sync(b.deps)).toEqual({ status: 'synced', pushed: true, updated: [] });
    expect(await sync(a.deps)).toEqual({ status: 'synced', pushed: false, updated: ['Pre-pregnancy height and weight'] });
    expect(a.local.data['weight-pre-pregnancy']).toEqual(pre(61));

    // Different keys changed on each device: both survive.
    a.local.data.profile = profile('Peanut');
    b.local.data['weight-pre-pregnancy'] = pre(62);
    await sync(a.deps);
    expect(await sync(b.deps)).toEqual({ status: 'synced', pushed: true, updated: ['Pregnancy details'] });
    await sync(a.deps);
    expect(a.local.data).toEqual(b.local.data);
    expect(a.local.data).toEqual({ profile: profile('Peanut'), 'weight-pre-pregnancy': pre(62) });
  });

  it('asks when both devices changed the same thing, then applies the choice', async () => {
    const p = new FakeProvider();
    const { a, code } = await setUp(p, { profile: profile('Bean') });
    const b = device(p);
    await unlock(b.deps, code);
    a.local.data.profile = profile('Peanut');
    b.local.data.profile = profile('Sprout');
    await sync(a.deps);

    expect(await sync(b.deps)).toEqual({ status: 'conflict', conflicts: [{ key: 'profile', label: 'Pregnancy details' }] });
    expect(b.local.data.profile).toEqual(profile('Sprout')); // nothing written while undecided
    expect(await sync(b.deps, { profile: 'local' })).toMatchObject({ status: 'synced', pushed: true });
    await sync(a.deps);
    expect(a.local.data.profile).toEqual(profile('Sprout'));
  });

  it('combines baby logs from two phones without asking, and keeps deletions', async () => {
    const T = Date.UTC(2026, 9, 12);
    const nappy = (id: string, h: number) => ({ id, kind: 'nappy', at: T + h * 3_600_000, nappy: 'wet' });
    const p = new FakeProvider();
    const { a, code } = await setUp(p, { profile: profile('Bean'), 'baby-log': [nappy('n1', 0), nappy('n2', 1)] });
    const b = device(p);
    await unlock(b.deps, code);

    // Phone A logs one and deletes n2; phone B logs another before syncing.
    a.local.data['baby-log'] = [nappy('a1', 3), nappy('n1', 0)];
    a.local.data['baby-log-deleted'] = [{ id: 'n2', at: T + 4 * 3_600_000 }];
    b.local.data['baby-log'] = [nappy('b1', 2), nappy('n2', 1), nappy('n1', 0)];
    await sync(a.deps);

    expect(await sync(b.deps)).toMatchObject({ status: 'synced', pushed: true });
    expect((b.local.data['baby-log'] as { id: string }[]).map((e) => e.id)).toEqual(['a1', 'b1', 'n1']);
    await sync(a.deps);
    expect(a.local.data['baby-log']).toEqual(b.local.data['baby-log']);
  });

  it('merges a new device that already has its own data', async () => {
    const p = new FakeProvider();
    const { code } = await setUp(p, { profile: profile('Bean'), 'weight-pre-pregnancy': pre(60) });
    const b = device(p, { profile: profile('Other'), 'checklist-bag': undefined });
    expect(await unlock(b.deps, code)).toEqual({ status: 'conflict', conflicts: [{ key: 'profile', label: 'Pregnancy details' }] });
    expect(await sync(b.deps, { profile: 'remote' })).toMatchObject({ status: 'synced' });
    expect(b.local.data).toEqual({ profile: profile('Bean'), 'weight-pre-pregnancy': pre(60) });
  });

  it('retries once when another device wrote first, without a false conflict', async () => {
    const p = new FakeProvider();
    const { a, code } = await setUp(p, { profile: profile('Bean'), 'weight-pre-pregnancy': pre(60) });
    const b = device(p);
    await unlock(b.deps, code);
    b.local.data['weight-pre-pregnancy'] = pre(61);
    a.local.data.profile = profile('Peanut');
    p.beforeSave = () => sync(b.deps); // B pushes in the middle of A's sync
    await expect(sync(a.deps)).resolves.toMatchObject({ status: 'synced', pushed: true });
    expect(a.local.data).toEqual({ profile: profile('Peanut'), 'weight-pre-pregnancy': pre(61) });
  });

  it('refuses a synced copy older than one this device has seen', async () => {
    const p = new FakeProvider();
    const { a } = await setUp(p, { profile: profile('Bean') });
    const old = { ...p.vault! };
    a.local.data.profile = profile('Peanut');
    await sync(a.deps);
    p.vault = { ...old, remoteVersion: '99' };
    await expect(sync(a.deps)).rejects.toThrow('older than one this device has already seen');
  });

  it('reports a synced copy deleted elsewhere, and setup refuses when one already exists', async () => {
    const p = new FakeProvider();
    const { a, code } = await setUp(p, { profile: profile('Bean') });
    await expect(startSetup(device(p).deps)).rejects.toThrow('already has synced data');
    const b = device(p);
    await unlock(b.deps, code);
    await deleteSyncedCopy(b.deps);
    expect(b.store.state).toBeNull();
    expect(await sync(a.deps)).toEqual({ status: 'gone' });
    expect(a.local.data).toEqual({ profile: profile('Bean') }); // device data untouched
  });

  it('keeps the recovery code on every synced device, in standard form', async () => {
    const p = new FakeProvider();
    const { a, code } = await setUp(p, { profile: profile('Bean') });
    expect(a.store.state!.recoveryCode).toBe(code);
    const b = device(p);
    await unlock(b.deps, code.toLowerCase().replace(/-/g, ' '));
    expect(b.store.state!.recoveryCode).toBe(code);
    await sync(b.deps);
    expect(b.store.state!.recoveryCode).toBe(code);
  });

  it('lets a device set up before codes were kept save it once, without resetting sync', async () => {
    const p = new FakeProvider();
    const { a, code } = await setUp(p, { profile: profile('Bean') });
    delete a.store.state!.recoveryCode; // as stored by the earlier version
    const before = structuredClone(a.store.state!.base);
    a.local.data.profile = profile('Peanut');
    await sync(a.deps);
    expect(a.store.state!.recoveryCode).toBeUndefined();

    await expect(rememberCode(a.deps, 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAAA')).rejects.toThrow('doesn’t match');
    const { highestSeen, base } = a.store.state!;
    expect(base).not.toEqual(before);
    expect(await rememberCode(a.deps, code.toLowerCase())).toBe(code);
    expect(a.store.state).toMatchObject({ highestSeen, base, recoveryCode: code });
    expect(await sync(a.deps)).toEqual({ status: 'synced', pushed: false, updated: [] });
  });

  it('starts over after a forgotten code: other devices stop, then rejoin with the new code', async () => {
    const p = new FakeProvider();
    const { a } = await setUp(p, { profile: profile('Bean') });
    const b = device(p, { profile: profile('Peanut') });
    await deleteSyncedCopy(b.deps); // "Forgot your code? Start over" on B
    const { code, finish } = await startSetup(b.deps);
    await finish();

    expect(await sync(a.deps)).toEqual({ status: 'gone' });
    await expect(rememberCode(a.deps, code)).rejects.toThrow('replaced from another device');
    a.store.state = null; // the app turns sync off on "gone"
    expect(await unlock(a.deps, code)).toEqual({ status: 'conflict', conflicts: [{ key: 'profile', label: 'Pregnancy details' }] });
    expect(a.local.data).toEqual({ profile: profile('Bean') }); // nothing overwritten without asking
  });

  it('reports not-set-up before setup', async () => {
    expect(await sync(device(new FakeProvider()).deps)).toEqual({ status: 'not-set-up' });
  });
});
