import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { parseStored, readRaw, STORAGE_EVENT, writeStored, type WriteResult } from './storage';
import type { Validator } from './validate';

function subscribe(onChange: () => void): () => void {
  window.addEventListener(STORAGE_EVENT, onChange);
  window.addEventListener('storage', onChange); // other tabs
  return () => {
    window.removeEventListener(STORAGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * React state backed by localStorage. The stored JSON is validated on every read;
 * invalid or missing data yields `defaultValue`. Stays in sync across components
 * and browser tabs.
 *
 * `defaultValue` and `validate` are captured on first render; they should be stable.
 */
export function useStoredState<T>(
  name: string,
  defaultValue: T,
  validate: Validator<T>,
): [T, (next: T | ((prev: T) => T)) => WriteResult] {
  const defaultRef = useRef(defaultValue);
  const validateRef = useRef(validate);

  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(name),
    () => null,
  );

  const value = useMemo(() => parseStored(raw, validateRef.current) ?? defaultRef.current, [raw]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)): WriteResult => {
      const prev = parseStored(readRaw(name), validateRef.current) ?? defaultRef.current;
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      return writeStored(name, resolved);
    },
    [name],
  );

  return [value, setValue];
}
