/**
 * Sync state kept on this device, in its own IndexedDB database (separate from photos, so no schema bump there).
 * The data key is a non-extractable CryptoKey: script on this origin can use it but can't read its bytes.
 * Access tokens are never stored; they live in memory only (see googleAuth.ts).
 */

export interface SyncState {
  dek: CryptoKey;
  syncId: string;
  /** Highest vault counter accepted, so an older (rolled-back) vault is refused. */
  highestSeen: number;
  /** SHA-256 per storage key of the last agreed value, for three-way merging. Missing = never synced. */
  base: Record<string, string>;
  lastSyncedAt: number | null;
}

/** Load/save/clear for SyncState; IndexedDB in the app, in-memory in tests. */
export interface SyncStateStore {
  load(): Promise<SyncState | null>;
  save(state: SyncState): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = 'bump-tracker-sync';
const STORE = 'state';
const KEY = 'current';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open sync storage.'));
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result as T);
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('Sync storage failed.'));
    });
  } finally {
    db.close();
  }
}

function isSyncState(v: unknown): v is SyncState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    s.dek instanceof CryptoKey &&
    typeof s.syncId === 'string' &&
    Number.isSafeInteger(s.highestSeen) &&
    typeof s.base === 'object' &&
    s.base !== null &&
    (s.lastSyncedAt === null || typeof s.lastSyncedAt === 'number')
  );
}

export const idbSyncStateStore: SyncStateStore = {
  async load() {
    if (typeof indexedDB === 'undefined') return null;
    const v = await run<unknown>('readonly', (s) => s.get(KEY));
    return isSyncState(v) ? v : null;
  },
  async save(state) {
    await run('readwrite', (s) => s.put(state, KEY));
  },
  async clear() {
    if (typeof indexedDB === 'undefined') return;
    await run('readwrite', (s) => s.delete(KEY));
  },
};

/** Removes this device's sync state (the data key included). Data already on the device is untouched. */
export const clearSyncState = (): Promise<void> => idbSyncStateStore.clear();
