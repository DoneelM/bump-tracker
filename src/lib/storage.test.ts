import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllStored,
  exportAll,
  fullKey,
  listAppKeys,
  readStored,
  removeStored,
  writeStored,
} from './storage';
import { isFiniteNumber, type Validator } from './validate';

/** Minimal in-memory Storage for the node test environment. */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  quotaExceeded = false;
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.quotaExceeded) throw new DOMException('full', 'QuotaExceededError');
    this.map.set(key, String(value));
  }
}

const numberValidator: Validator<number> = (v) => (isFiniteNumber(v) && v > 0 ? v : null);

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('storage', () => {
  it('namespaces keys with a versioned prefix', () => {
    expect(fullKey('profile')).toBe('bt:v1:profile');
  });

  it('round-trips JSON through a validator', () => {
    expect(writeStored('n', 42)).toEqual({ ok: true });
    expect(storage.getItem('bt:v1:n')).toBe('42');
    expect(readStored('n', numberValidator)).toBe(42);
  });

  it('returns null for missing, corrupt or invalid data', () => {
    expect(readStored('missing', numberValidator)).toBeNull();
    storage.setItem('bt:v1:corrupt', '{not json');
    expect(readStored('corrupt', numberValidator)).toBeNull();
    storage.setItem('bt:v1:invalid', '-5');
    expect(readStored('invalid', numberValidator)).toBeNull();
  });

  it('reports write failures instead of throwing', () => {
    storage.quotaExceeded = true;
    const result = writeStored('n', 1);
    expect(result.ok).toBe(false);
  });

  it('reports unavailable storage', () => {
    Reflect.deleteProperty(globalThis, 'localStorage');
    expect(writeStored('n', 1)).toMatchObject({ ok: false });
    expect(readStored('n', numberValidator)).toBeNull();
  });

  it('only exports and clears its own keys', () => {
    writeStored('a', 1);
    writeStored('b', { x: true });
    storage.setItem('bt:v0:old', '"legacy"');
    storage.setItem('other-app', 'keep me');

    expect(listAppKeys().sort()).toEqual(['bt:v0:old', 'bt:v1:a', 'bt:v1:b']);
    expect(exportAll()).toEqual({ a: 1, b: { x: true } });

    removeStored('a');
    expect(storage.getItem('bt:v1:a')).toBeNull();

    clearAllStored();
    expect(listAppKeys()).toEqual([]);
    expect(storage.getItem('other-app')).toBe('keep me');
  });
});
