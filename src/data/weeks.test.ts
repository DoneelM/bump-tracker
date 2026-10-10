import { describe, expect, it } from 'vitest';
import { WEEKS } from './weeks';

describe('WEEKS', () => {
  it('has exactly weeks 4 to 40 in order', () => {
    expect(WEEKS.map((w) => w.week)).toEqual(Array.from({ length: 37 }, (_, i) => i + 4));
  });

  it('has content for every week', () => {
    for (const w of WEEKS) {
      expect(w.developing.length, `week ${w.week} developing`).toBeGreaterThan(0);
      expect(w.mother.length, `week ${w.week} mother`).toBeGreaterThan(0);
      expect(w.sizeObject.trim()).not.toBe('');
      expect(w.sourceUrl.startsWith('https://')).toBe(true);
    }
  });

  it('has non-decreasing lengths and weights', () => {
    WEEKS.slice(1).forEach((w, i) => {
      const prev = WEEKS[i]!;
      expect(w.lengthCm).toBeGreaterThanOrEqual(prev.lengthCm);
      expect(w.weightG ?? 0).toBeGreaterThanOrEqual(prev.weightG ?? 0);
    });
  });

  it('has weights only from week 14', () => {
    for (const w of WEEKS) expect(w.weightG === null).toBe(w.week < 14);
  });
});
