/**
 * Sync engine: setup, unlock on a new device, and a three-way merge per storage key.
 *
 * The whole app state (every registered storage key, no photos) travels as one encrypted backup envelope.
 * For each key we compare this device's value (L), the synced copy (R) and the last value both agreed on
 * (the base, kept as a hash): only one side changed -> take it; both changed -> combine them where we can
 * (the baby log, so two caregivers can log on two phones), otherwise ask the user.
 * Dependencies are passed in, so this runs against fakes in tests and IndexedDB/localStorage/Drive in the app.
 */
import { buildBackup, parseBackup } from '../backup';
import {
  createDek,
  decryptVault,
  deriveRecoveryKek,
  encryptVault,
  formatRecoveryCode,
  generateRecoveryCode,
  parseRecoveryCode,
  unwrapDek,
  VaultTooLargeError,
} from '../crypto';
import { mergeLogs, mergeTombstones, parseBabyLog, parseTombstones } from '../babyLog';
import { STORAGE_KEYS, STORAGE_TABLE } from '../storage';
import type { SyncState, SyncStateStore } from './keyStore';
import type { SyncProvider } from './provider';

/** This device's stored data by storage key (parsed JSON, null when absent), and a way to replace it. */
export interface LocalData {
  read(): Record<string, unknown>;
  /** Replaces every storage key with `values` (absent keys are removed), atomically. */
  apply(values: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string }>;
}

export interface SyncDeps {
  provider: SyncProvider;
  store: SyncStateStore;
  local: LocalData;
  now?: () => Date;
}

export interface Conflict {
  key: string;
  label: string;
}

export type Resolutions = Record<string, 'local' | 'remote'>;

export type SyncResult =
  | { status: 'synced'; pushed: boolean; updated: string[] }
  | { status: 'conflict'; conflicts: Conflict[] }
  /** The synced copy was deleted or replaced from another device. */
  | { status: 'gone' }
  | { status: 'not-set-up' }
  | { status: 'too-large' };

type Canon = Record<string, string | null>;

const NULL_HASH = '-';

async function hash(c: string | null): Promise<string> {
  if (c === null) return NULL_HASH;
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(c)));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Validated, re-serialised value per key, so formatting differences never count as a change. */
function canonical(values: Record<string, unknown>): Canon {
  const out: Canon = {};
  for (const e of STORAGE_TABLE) {
    const v = values[e.key];
    const valid = v === undefined || v === null ? null : e.validate(v);
    out[e.key] = valid === null ? null : JSON.stringify(valid);
  }
  return out;
}

const LOG = STORAGE_KEYS.babyLog;
const DELETED = STORAGE_KEYS.babyLogDeleted;
const parsed = <T>(c: Canon | null, key: string, parse: (v: unknown) => T[] | null): T[] => (c?.[key] ? (parse(JSON.parse(c[key])) ?? []) : []);

/**
 * Both sides changed this key: the combined value (canonical JSON), or undefined if it can't be combined.
 * The baby log keeps every entry from both, minus anything either side deleted.
 */
function combine(key: string, local: Canon, remote: Canon | null): string | undefined {
  if (key !== LOG && key !== DELETED) return undefined;
  const tombs = mergeTombstones(parsed(local, DELETED, parseTombstones), parsed(remote, DELETED, parseTombstones));
  if (key === DELETED) return JSON.stringify(tombs);
  return JSON.stringify(mergeLogs(parsed(local, LOG, parseBabyLog), parsed(remote, LOG, parseBabyLog), tombs));
}

function toValues(c: Canon): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(c)) if (v !== null) out[k] = JSON.parse(v);
  return out;
}

const toB64 = (b: Uint8Array): string => btoa(String.fromCharCode(...b));
function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

function newSyncId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return toB64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Setup found synced data already in this account: the user needs the recovery code (or to start over) instead. */
export class AlreadySyncedError extends Error {
  constructor() {
    super('This account already has synced data. Enter your recovery code to use it on this device.');
  }
}

/**
 * First device: makes a recovery code and a data key, but stores nothing until `finish()`,
 * which the UI calls only after the user has confirmed they kept the code.
 */
export async function startSetup(deps: SyncDeps): Promise<{ code: string; finish: () => Promise<SyncResult> }> {
  if (await deps.provider.loadKeys()) throw new AlreadySyncedError();
  const rc = generateRecoveryCode();
  const { dek, wraps } = await createDek([await deriveRecoveryKek(rc.bytes)]);
  const syncId = newSyncId();
  const code = formatRecoveryCode(rc.code);
  return {
    code,
    finish: async () => {
      if (await deps.provider.loadKeys()) {
        throw new Error('Sync was turned on from another device in the meantime. Enter that recovery code instead.');
      }
      // A vault without a keys file can't be opened by anyone; clear it so it doesn't block the first push.
      if (await deps.provider.loadVault()) await deps.provider.deleteAll();
      await deps.provider.saveKeys({ format: 1, syncId, wrapRc: toB64(wraps[0]!) });
      await deps.store.save({ dek, syncId, highestSeen: 0, base: {}, lastSyncedAt: null, recoveryCode: code });
      return sync(deps);
    },
  };
}

/** Checks a typed code against the synced copy's key file; returns the data key and the code in standard form. */
async function openWithCode(deps: Pick<SyncDeps, 'provider'>, codeInput: string) {
  const keys = await deps.provider.loadKeys();
  if (!keys) throw new Error('No synced data was found in this account. Turn on sync on the device that has your data first.');
  const codeBytes = parseRecoveryCode(codeInput);
  if (!codeBytes) throw new Error('That doesn’t look like a recovery code. Check it and try again.');
  try {
    const dek = await unwrapDek(fromB64(keys.wrapRc), await deriveRecoveryKek(codeBytes));
    return { dek, keys, code: formatRecoveryCode(codeInput.replace(/[\s-]/g, '').toUpperCase()) };
  } catch {
    throw new Error('That recovery code doesn’t match the synced data in this account.');
  }
}

/** Another device: unlocks the synced copy with the recovery code, then merges it with this device's data. */
export async function unlock(deps: SyncDeps, codeInput: string): Promise<SyncResult> {
  const { dek, keys, code } = await openWithCode(deps, codeInput);
  await deps.store.save({ dek, syncId: keys.syncId, highestSeen: 0, base: {}, lastSyncedAt: null, recoveryCode: code });
  return sync(deps);
}

/** For a device set up before codes were kept: checks the code and keeps it, leaving the sync state as it was. */
export async function rememberCode(deps: Pick<SyncDeps, 'provider' | 'store'>, codeInput: string): Promise<string> {
  const state = await deps.store.load();
  if (!state) throw new Error('Sync is off on this device.');
  const { keys, code } = await openWithCode(deps, codeInput);
  if (keys.syncId !== state.syncId) throw new Error('The synced copy was replaced from another device. Turn sync off here and on again.');
  await deps.store.save({ ...state, recoveryCode: code });
  return code;
}

export async function sync(deps: SyncDeps, resolutions: Resolutions = {}, retried = false): Promise<SyncResult> {
  const state = await deps.store.load();
  if (!state) return { status: 'not-set-up' };
  const keys = await deps.provider.loadKeys();
  if (!keys || keys.syncId !== state.syncId) return { status: 'gone' };

  const remote = await deps.provider.loadVault();
  const localC = canonical(deps.local.read());
  let remoteC: Canon | null = null;
  if (remote) {
    const text = await decryptVault(state.dek, state.syncId, remote.counter, remote.bytes, state.highestSeen);
    const parsed = parseBackup(text);
    if (!parsed.ok) throw new Error(`The synced copy couldn’t be read: ${parsed.error}`);
    remoteC = canonical(parsed.backup.accepted);
  }

  const merged: Canon = {};
  const conflicts: Conflict[] = [];
  for (const e of STORAGE_TABLE) {
    const L = localC[e.key] ?? null;
    const R = remoteC ? (remoteC[e.key] ?? null) : L;
    if (L === R) {
      merged[e.key] = L;
      continue;
    }
    const B = state.base[e.key];
    let pick: 'local' | 'remote' | null;
    if (B === undefined) pick = L === null ? 'remote' : R === null ? 'local' : null;
    else if ((await hash(L)) === B) pick = 'remote';
    else if ((await hash(R)) === B) pick = 'local';
    else pick = null;
    if (pick === null) {
      const both = combine(e.key, localC, remoteC);
      if (both !== undefined) {
        merged[e.key] = both;
        continue;
      }
    }
    pick ??= resolutions[e.key] ?? null;
    if (pick === null) conflicts.push({ key: e.key, label: e.label });
    else merged[e.key] = pick === 'local' ? L : R;
  }
  if (conflicts.length) return { status: 'conflict', conflicts };

  const updated = STORAGE_TABLE.filter((e) => merged[e.key] !== (localC[e.key] ?? null)).map((e) => e.label);
  if (updated.length) {
    const r = await deps.local.apply(toValues(merged));
    if (!r.ok) throw new Error(r.error);
  }

  const next: SyncState = { ...state, base: { ...state.base } };
  if (remote && remoteC) {
    // Everything in the synced copy is now seen here; record it so a retry doesn't mistake it for a conflict.
    for (const e of STORAGE_TABLE) next.base[e.key] = await hash(remoteC[e.key] ?? null);
    next.highestSeen = Math.max(next.highestSeen, remote.counter);
    await deps.store.save(next);
  }

  const needPush = !remoteC || STORAGE_TABLE.some((e) => merged[e.key] !== (remoteC[e.key] ?? null));
  if (needPush) {
    const counter = (remote?.counter ?? 0) + 1;
    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = await encryptVault(state.dek, state.syncId, counter, buildBackup(toValues(merged), (deps.now ?? (() => new Date()))()));
    } catch (err) {
      if (err instanceof VaultTooLargeError) return { status: 'too-large' };
      throw err;
    }
    const saved = await deps.provider.saveVault(bytes, counter, remote?.remoteVersion ?? null);
    if (saved === 'changed') {
      if (retried) throw new Error('Another device is syncing at the same time. Try again in a moment.');
      return sync(deps, resolutions, true);
    }
    next.highestSeen = counter;
  }

  for (const e of STORAGE_TABLE) next.base[e.key] = await hash(merged[e.key] ?? null);
  next.lastSyncedAt = (deps.now ?? (() => new Date()))().getTime();
  await deps.store.save(next);
  return { status: 'synced', pushed: needPush, updated };
}

/** Stops syncing on this device only; the synced copy and this device's data both stay. */
export const turnOff = (deps: Pick<SyncDeps, 'store'>): Promise<void> => deps.store.clear();

/** Deletes the synced copy from the provider and stops syncing here. Data on devices is untouched. */
export async function deleteSyncedCopy(deps: Pick<SyncDeps, 'store' | 'provider'>): Promise<void> {
  await deps.provider.deleteAll();
  await deps.store.clear();
}
