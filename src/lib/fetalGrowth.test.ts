import { describe, expect, it } from 'vitest';
import { describeEfw, efwPercentilesAtDays, WHO_EFW } from './fetalGrowth';

describe('WHO_EFW table', () => {
  it('covers weeks 14-40 in order, with increasing percentiles', () => {
    expect(WHO_EFW.map((r) => r.week)).toEqual(Array.from({ length: 27 }, (_, i) => 14 + i));
    for (const r of WHO_EFW) expect(r.p10 < r.p50 && r.p50 < r.p90).toBe(true);
  });
  it('spot-checks published values', () => {
    expect(WHO_EFW[0]).toEqual({ week: 14, p10: 78, p50: 90, p90: 104 });
    expect(WHO_EFW[13]).toEqual({ week: 27, p10: 898, p50: 1039, p90: 1196 });
    expect(WHO_EFW[26]).toEqual({ week: 40, p10: 3084, p50: 3617, p90: 4135 });
  });
});

describe('efwPercentilesAtDays', () => {
  it('returns exact values on week boundaries', () => {
    expect(efwPercentilesAtDays(20 * 7)).toEqual({ p10: 286, p50: 330, p90: 380 });
    expect(efwPercentilesAtDays(14 * 7)).toEqual({ p10: 78, p50: 90, p90: 104 });
    expect(efwPercentilesAtDays(40 * 7)).toEqual({ p10: 3084, p50: 3617, p90: 4135 });
  });
  it('interpolates by day', () => {
    expect(efwPercentilesAtDays(20 * 7 + 3)?.p50).toBeCloseTo(330 + (68 * 3) / 7, 6);
  });
  it('is null outside 14-40 weeks or for bad input', () => {
    expect(efwPercentilesAtDays(14 * 7 - 1)).toBeNull();
    expect(efwPercentilesAtDays(40 * 7 + 1)).toBeNull();
    expect(efwPercentilesAtDays(NaN)).toBeNull();
  });
});

describe('describeEfw', () => {
  const d = 20 * 7; // p10 286, p50 330, p90 380
  it('describes position neutrally', () => {
    expect(describeEfw(200, d)).toBe('below the 10th percentile line');
    expect(describeEfw(500, d)).toBe('above the 90th percentile line');
    expect(describeEfw(330, d)).toMatch(/typical middle/);
    expect(describeEfw(300, d)).toBe('between the 10th and 50th percentile lines');
    expect(describeEfw(360, d)).toBe('between the 50th and 90th percentile lines');
  });
  it('treats exactly p10 and p90 as within the range', () => {
    expect(describeEfw(286, d)).toMatch(/between/);
    expect(describeEfw(380, d)).toMatch(/between/);
  });
  it('explains when out of chart range', () => {
    expect(describeEfw(100, 50)).toMatch(/14 to 40 week/);
  });
});
