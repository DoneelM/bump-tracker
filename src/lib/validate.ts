/**
 * Tiny runtime-validation helpers for data read from storage or imported files.
 * A Validator returns a clean typed value, or null if the input is unusable.
 */

export type Validator<T> = (value: unknown) => T | null;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && value >= min && value <= max;
}

/** Trimmed string of at most `maxLength` characters, or null. */
export function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}

/** Validates every element of an array, dropping invalid ones. Returns null if `value` is not an array. */
export function arrayOf<T>(item: Validator<T>): Validator<T[]> {
  return (value) => {
    if (!Array.isArray(value)) return null;
    const out: T[] = [];
    for (const v of value) {
      const parsed = item(v);
      if (parsed !== null) out.push(parsed);
    }
    return out;
  };
}

/** Short unique id for list entries. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Parses a number typed into a form field. Empty input gives null with no error;
 * the caller decides whether the field is required.
 */
export function parseNumberInput(raw: string): { value: number | null; error?: string } {
  const text = raw.trim();
  if (text === '') return { value: null };
  if (!/^-?\d+(\.\d+)?$/.test(text)) return { value: null, error: 'Please enter a number.' };
  return { value: Number(text) };
}
