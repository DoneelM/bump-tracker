import { describe, expect, it } from 'vitest';
import { fitWithin, parsePhotoExport } from './photoStore';

const url = (mime: string, b64 = 'AQID') => `data:${mime};base64,${b64}`;

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
    expect(out[0]!.blob.size).toBe(3);
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
