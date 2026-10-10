import { describe, expect, it } from 'vitest';
import { validatePhotoFile, MAX_PHOTO_BYTES } from './photoStore';
import { cleanString, isIntInRange, isNumberInRange, isRecord, parseNumberInput } from './validate';

describe('validate helpers', () => {
  it('isRecord', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });

  it('range checks', () => {
    expect(isIntInRange(5, 0, 10)).toBe(true);
    expect(isIntInRange(5.5, 0, 10)).toBe(false);
    expect(isIntInRange(11, 0, 10)).toBe(false);
    expect(isNumberInRange(5.5, 0, 10)).toBe(true);
    expect(isNumberInRange(Number.NaN, 0, 10)).toBe(false);
    expect(isNumberInRange(Infinity, 0, Infinity)).toBe(false);
  });

  it('cleanString', () => {
    expect(cleanString('  hi ', 5)).toBe('hi');
    expect(cleanString('toolong', 3)).toBeNull();
    expect(cleanString(3, 3)).toBeNull();
  });

  it('parseNumberInput', () => {
    expect(parseNumberInput('')).toEqual({ value: null });
    expect(parseNumberInput(' 12 ')).toEqual({ value: 12 });
    expect(parseNumberInput('65.4')).toEqual({ value: 65.4 });
    expect(parseNumberInput('1e3').error).toBeDefined();
    expect(parseNumberInput('12abc').error).toBeDefined();
    expect(parseNumberInput('0x10').error).toBeDefined();
  });
});

describe('validatePhotoFile', () => {
  it('accepts common image types within the size limit', () => {
    expect(validatePhotoFile({ type: 'image/jpeg', size: 1000 })).toEqual({ ok: true });
    expect(validatePhotoFile({ type: 'image/webp', size: MAX_PHOTO_BYTES })).toEqual({ ok: true });
  });

  it('rejects other types, empty and oversized files', () => {
    expect(validatePhotoFile({ type: 'image/svg+xml', size: 1000 }).ok).toBe(false);
    expect(validatePhotoFile({ type: 'text/html', size: 1000 }).ok).toBe(false);
    expect(validatePhotoFile({ type: 'image/png', size: 0 }).ok).toBe(false);
    expect(validatePhotoFile({ type: 'image/png', size: MAX_PHOTO_BYTES + 1 }).ok).toBe(false);
  });
});
