import { describe, expect, it } from 'vitest';
import { exceedsPixelLimit, fitWithin, parsePhotoExport, planPhotoRestore, preparePhoto, readImageSize, sniffImageType } from './photoStore';

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

describe('readImageSize', () => {
  const bytes = (...parts: (number | string)[]) =>
    Uint8Array.from(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : [p])));
  const pad = (n: number) => Array<number>(n).fill(0);

  it('reads PNG IHDR', () => {
    const png = bytes(0x89, 'PNG', 13, 10, 26, 10, 0, 0, 0, 13, 'IHDR', 0, 0, 0x1f, 0x40, 0, 0, 0x17, 0x70, ...pad(5));
    expect(readImageSize(png)).toEqual({ width: 8000, height: 6000 });
  });
  it('scans JPEG markers to SOF0', () => {
    // SOI, APP0 (length 4), SOF0: precision, height 6000 (0x1770), width 8000 (0x1f40)
    const jpg = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, 0x17, 0x70, 0x1f, 0x40, 3, 0, 0);
    expect(readImageSize(jpg)).toEqual({ width: 8000, height: 6000 });
  });
  it('reads WebP VP8X, VP8L and VP8', () => {
    const head = (fourcc: string) => bytes('RIFF', 0, 0, 0, 0, 'WEBP', fourcc, 0, 0, 0, 0);
    // VP8X: width-1 = 9999 (0x270f), height-1 = 4999 (0x1387), 24-bit little-endian
    expect(readImageSize(Uint8Array.from([...head('VP8X'), 0, 0, 0, 0, 0x0f, 0x27, 0, 0x87, 0x13, 0, ...pad(2)]))).toEqual({ width: 10000, height: 5000 });
    // VP8L: signature 0x2f then 14-bit width-1 / height-1: 99 and 49 -> bits = 99 | 49 << 14 = 0xC4063
    expect(readImageSize(Uint8Array.from([...head('VP8L'), 0x2f, 0x63, 0x40, 0x0c, 0, ...pad(5)]))).toEqual({ width: 100, height: 50 });
    // VP8: 3-byte frame tag, start code, then 16-bit width 640 and height 480 (little-endian)
    expect(readImageSize(Uint8Array.from([...head('VP8 '), 0, 0, 0, 0x9d, 0x01, 0x2a, 0x80, 0x02, 0xe0, 0x01, ...pad(2)]))).toEqual({ width: 640, height: 480 });
  });
  it('returns null for unknown or truncated data', () => {
    expect(readImageSize(bytes(1, 2, 3))).toBeNull();
    expect(readImageSize(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0))).toBeNull();
    expect(readImageSize(new Uint8Array(0))).toBeNull();
  });
});

describe('preparePhoto header guard', () => {
  const seg = (marker: number, len: number) => [0xff, marker, len >> 8, len & 0xff, ...Array<number>(len - 2).fill(0)];
  const sof = (w: number, h: number) => [0xff, 0xc0, 0, 11, 8, h >> 8, h & 0xff, w >> 8, w & 0xff, 3, 0, 0];
  const jpeg = (...parts: number[][]) => new File([Uint8Array.from([0xff, 0xd8, ...parts.flat()])], 'x.jpg', { type: 'image/jpeg' });

  it('rejects a 9000x6000 JPEG whose SOF is pushed past 64 KB, before decoding', async () => {
    const f = jpeg(seg(0xe9, 65535), seg(0xe9, 65535), sof(9000, 6000));
    await expect(preparePhoto(f)).rejects.toThrow('too large');
  });
  it('rejects a file whose size cannot be read from the header', async () => {
    await expect(preparePhoto(jpeg([1, 2, 3, 4]))).rejects.toThrow('couldn’t be read');
  });
});

describe('planPhotoRestore', () => {
  it('leaves device photos alone when no backup photo decoded', () => {
    expect(planPhotoRestore([3, 20], [], [3, 20])).toEqual({ replace: false, keptWeeks: [], finalCount: 2 });
  });
  it('replaces with decoded photos plus device photos for weeks that failed to decode', () => {
    expect(planPhotoRestore([3, 10, 20], [10, 12], [3])).toEqual({ replace: true, keptWeeks: [3], finalCount: 3 });
  });
  it('replaces everything when nothing was skipped', () => {
    expect(planPhotoRestore([3, 10], [12], [])).toEqual({ replace: true, keptWeeks: [], finalCount: 1 });
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
