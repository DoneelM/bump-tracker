/**
 * Versioned, typed localStorage wrapper for small structured data.
 *
 * Keys are namespaced as `bt:v<SCHEMA_VERSION>:<name>` so we can migrate or wipe
 * our own data without touching anything else on the origin. Values are JSON.
 * Every read goes through a Validator, so corrupt or tampered data falls back to
 * a default instead of crashing the UI.
 */
import type { Validator } from './validate';

export const KEY_PREFIX = 'bt:';
export const SCHEMA_VERSION = 1;

/** Logical keys used by the app. Add new ones here so backup/delete can find them. */
export const STORAGE_KEYS = {
  profile: 'profile',
  prePregnancy: 'weight-pre-pregnancy',
  weightEntries: 'weight-entries',
  scanEntries: 'scan-entries',
  // TODO(features): contractions, kicks, journal, checklists, ...
} as const;

/** Event fired on `window` when this tab writes a key, so hooks in the same tab re-read. */
export const STORAGE_EVENT = 'bt:storage';

export function fullKey(name: string): string {
  return `${KEY_PREFIX}v${SCHEMA_VERSION}:${name}`;
}

function getStorage(): Storage | null {
  try {
    const s = globalThis.localStorage;
    return s ?? null;
  } catch {
    // Accessing localStorage can throw (e.g. disabled cookies / privacy modes).
    return null;
  }
}

export function isStorageAvailable(): boolean {
  return getStorage() !== null;
}

/** Raw string for a key (useful as a cheap, stable snapshot for useSyncExternalStore). */
export function readRaw(name: string): string | null {
  try {
    return getStorage()?.getItem(fullKey(name)) ?? null;
  } catch {
    return null;
  }
}

/** Parses + validates a raw JSON string. */
export function parseStored<T>(raw: string | null, validate: Validator<T>): T | null {
  if (raw === null) return null;
  try {
    return validate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function readStored<T>(name: string, validate: Validator<T>): T | null {
  return parseStored(readRaw(name), validate);
}

export type WriteResult = { ok: true } | { ok: false; error: string };

function notify(name: string): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key: fullKey(name) } }));
  }
}

export function writeStored(name: string, value: unknown): WriteResult {
  const storage = getStorage();
  if (!storage) return { ok: false, error: 'Browser storage is not available.' };
  try {
    storage.setItem(fullKey(name), JSON.stringify(value));
  } catch {
    return { ok: false, error: 'Could not save. Your browser storage may be full.' };
  }
  notify(name);
  return { ok: true };
}

export function removeStored(name: string): void {
  try {
    getStorage()?.removeItem(fullKey(name));
  } catch {
    // ignore
  }
  notify(name);
}

/** All of this app's keys currently in storage (any schema version). */
export function listAppKeys(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k !== null && k.startsWith(KEY_PREFIX)) keys.push(k);
  }
  return keys;
}

/** Snapshot of all current-version data, keyed by logical name (for backup/export). */
export function exportAll(): Record<string, unknown> {
  const storage = getStorage();
  const prefix = fullKey('');
  const out: Record<string, unknown> = {};
  if (!storage) return out;
  for (const k of listAppKeys()) {
    if (!k.startsWith(prefix)) continue;
    try {
      out[k.slice(prefix.length)] = JSON.parse(storage.getItem(k) ?? 'null');
    } catch {
      // skip corrupt entries
    }
  }
  return out;
}

/** Removes every `bt:` key (all versions). Does not touch photos in IndexedDB. */
export function clearAllStored(): void {
  const storage = getStorage();
  if (!storage) return;
  for (const k of listAppKeys()) storage.removeItem(k);
  notify('*');
}
