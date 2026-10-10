import { describe, expect, it } from 'vitest';
import { exceedsPixelLimit, fitWithin, parsePhotoExport, sniffImageType } from './photoStore';

const MAGIC: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
};
const url = (mime: string, b64 = btoa(String.fromCharCode(...(MAGIC[mime] ?? [1, 2, 3])))) => `data:${mime};base64,${b64}`;

describe('exceedsPixelLimit', () => {
  it('allows up to 50 megapixels and rejects more', () => {
    expect(exceedsPixelLimit(8000, 6000)).toBe(false);
    expect(exceedsPixelLimit(10_000, 5000)).toBe(false);
    expect(exceedsPixelLimit(30_000, 30_000)).toBe(true);
  });
});

describe('sniffImageType', () => {
  it('recognises JPEG, PNG and WebP and nothing else', () => {
    for (const [mime, bytes] of Object.entries(MAGIC)) expect(sniffImageType(Uint8Array.from(bytes))).toBe(mime);
    expect(sniffImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(sniffImageType(new Uint8Array(0))).toBeNull();
  });
});

describe('fitWithin', () => {
  it('downscales the long edge to 1280 and keeps aspect ratio', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 960, height: 1280 });
  });
  it('never upscales', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('parsePhotoExport', () => {
  it('accepts valid items and the last duplicate week wins', () => {
    const out = parsePhotoExport([
      { week: 20, mime: 'image/jpeg', dataUrl: url('image/jpeg') },
      { week: 20, mime: 'image/png', dataUrl: url('image/png') },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ week: 20, mime: 'image/png' });
    expect(out[0]!.blob.size).toBe(4);
  });
  it('drops bytes that do not match the claimed image type', () => {
    expect(parsePhotoExport([{ week: 12, mime: 'image/png', dataUrl: url('image/png', btoa('<svg/>')) }])).toEqual([]);
    expect(parsePhotoExport([{ week: 12, mime: 'image/png', dataUrl: url('image/jpeg') }])).toEqual([]);
  });
  it('keeps a valid takenOn and falls back to today otherwise', () => {
    const item = (takenOn: unknown) => ({ week: 12, mime: 'image/png', dataUrl: url('image/png'), takenOn });
    expect(parsePhotoExport([item('2026-05-01')])[0]!.takenOn).toBe('2026-05-01');
    expect(parsePhotoExport([item('1900-01-01')])[0]!.takenOn).toMatch(/^20\d\d-\d\d-\d\d$/);
  });
  it('drops invalid items', () => {
    expect(
      parsePhotoExport([
        { week: 0, mime: 'image/jpeg', dataUrl: url('image/jpeg') },
        { week: 12, mime: 'image/svg+xml', dataUrl: url('image/svg+xml') },
        { week: 12, mime: 'image/png', dataUrl: url('image/jpeg') },
        { week: 12, mime: 'image/jpeg', dataUrl: 'javascript:alert(1)' },
        { week: 12, mime: 'image/jpeg', dataUrl: url('image/jpeg', '') },
        null,
      ]),
    ).toEqual([]);
    expect(parsePhotoExport('nope')).toEqual([]);
  });
});
