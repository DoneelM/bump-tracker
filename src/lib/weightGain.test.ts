import { describe, expect, it } from 'vitest';
import {
  bmi,
  bmiCategory,
  formatBmi,
  parsePrePregnancy,
  parseWeightEntries,
  recommendedRangeAtWeek,
  sortByDate,
  TOTAL_GAIN_KG,
  validateEntryDate,
  validateHeight,
  validateWeight,
  validateWeightNote,
  type BmiCategory,
} from './weightGain';

describe('bmi', () => {
  it('computes kg / m^2', () => {
    expect(bmi(170, 72.25)).toBeCloseTo(25, 6);
    expect(bmi(100, 20)).toBeCloseTo(20, 6);
  });
});

describe('bmiCategory boundaries', () => {
  it.each([
    [18.4, 'underweight'],
    [18.5, 'normal'],
    [24.9, 'normal'],
    [25.0, 'overweight'],
    [29.9, 'overweight'],
    [30.0, 'obese'],
    [45, 'obese'],
    [15, 'underweight'],
  ] as const)('%s -> %s', (v, cat) => expect(bmiCategory(v)).toBe(cat));

  it('formatBmi truncates so a shown value never implies a higher category', () => {
    expect(formatBmi(24.96)).toBe('24.9');
    expect(formatBmi(25)).toBe('25.0');
    expect(bmiCategory(24.96)).toBe('normal');
  });
});

describe('IOM total gain table', () => {
  it('matches IOM 2009 Table S-1 (singleton)', () => {
    expect(TOTAL_GAIN_KG).toEqual({
      underweight: { low: 12.5, high: 18 },
      normal: { low: 11.5, high: 16 },
      overweight: { low: 7, high: 11.5 },
      obese: { low: 5, high: 9 },
    });
  });
});

describe('recommendedRangeAtWeek', () => {
  const cats: BmiCategory[] = ['underweight', 'normal', 'overweight', 'obese'];
  it.each(cats)('%s: 0 at week 0, 0.5-2 at week 13, total at week 40', (c) => {
    expect(recommendedRangeAtWeek(c, 0)).toEqual({ low: 0, high: 0 });
    const w13 = recommendedRangeAtWeek(c, 13);
    expect(w13.low).toBeCloseTo(0.5, 9);
    expect(w13.high).toBeCloseTo(2, 9);
    const w40 = recommendedRangeAtWeek(c, 40);
    expect(w40.low).toBeCloseTo(TOTAL_GAIN_KG[c].low, 9);
    expect(w40.high).toBeCloseTo(TOTAL_GAIN_KG[c].high, 9);
  });
  it('interpolates linearly', () => {
    expect(recommendedRangeAtWeek('normal', 6.5)).toEqual({ low: 0.25, high: 1 });
    // midpoint of weeks 13..40 = 26.5
    const mid = recommendedRangeAtWeek('normal', 26.5);
    expect(mid.low).toBeCloseTo((0.5 + 11.5) / 2, 9);
    expect(mid.high).toBeCloseTo((2 + 16) / 2, 9);
  });
  it('clamps below 0 and holds beyond 40; tolerates NaN', () => {
    expect(recommendedRangeAtWeek('obese', -3)).toEqual({ low: 0, high: 0 });
    expect(recommendedRangeAtWeek('obese', 44)).toEqual({ low: 5, high: 9 });
    expect(recommendedRangeAtWeek('obese', NaN)).toEqual({ low: 0, high: 0 });
  });
  it('is non-decreasing across weeks', () => {
    for (const c of cats) {
      for (let w = 1; w <= 40; w++) {
        expect(recommendedRangeAtWeek(c, w).low).toBeGreaterThanOrEqual(recommendedRangeAtWeek(c, w - 1).low);
      }
    }
  });
});

describe('validation', () => {
  it('height 120-220 cm', () => {
    expect(validateHeight('120').ok).toBe(true);
    expect(validateHeight('220').ok).toBe(true);
    expect(validateHeight('119.9').ok).toBe(false);
    expect(validateHeight('220.1').ok).toBe(false);
    expect(validateHeight('').ok).toBe(false);
    expect(validateHeight('abc').ok).toBe(false);
  });
  it('weight 30-250 kg', () => {
    expect(validateWeight('30').ok).toBe(true);
    expect(validateWeight('250').ok).toBe(true);
    expect(validateWeight('29.9').ok).toBe(false);
    expect(validateWeight('250.1').ok).toBe(false);
    expect(validateWeight('-60').ok).toBe(false);
    expect(validateWeight('').ok).toBe(false);
  });
  it('entry date: valid, not future, not before LMP', () => {
    const lmp = '2026-01-01';
    const today = '2026-06-01';
    expect(validateEntryDate('2026-06-01', lmp, today).ok).toBe(true);
    expect(validateEntryDate('2026-01-01', lmp, today).ok).toBe(true);
    expect(validateEntryDate('2026-06-02', lmp, today).ok).toBe(false);
    expect(validateEntryDate('2025-12-31', lmp, today).ok).toBe(false);
    expect(validateEntryDate('2026-02-30', lmp, today).ok).toBe(false);
    expect(validateEntryDate('', lmp, today).ok).toBe(false);
  });
  it('note length', () => {
    expect(validateWeightNote('a'.repeat(200)).ok).toBe(true);
    expect(validateWeightNote('a'.repeat(201)).ok).toBe(false);
  });
});

describe('stored data parsing', () => {
  it('parsePrePregnancy rejects bad shapes and ranges', () => {
    expect(parsePrePregnancy({ heightCm: 165, weightKg: 60 })).toEqual({ heightCm: 165, weightKg: 60 });
    expect(parsePrePregnancy({ heightCm: 50, weightKg: 60 })).toBeNull();
    expect(parsePrePregnancy({ heightCm: 165 })).toBeNull();
    expect(parsePrePregnancy('x')).toBeNull();
  });
  it('parseWeightEntries drops invalid items, rejects non-arrays', () => {
    const good = { id: 'a', date: '2026-03-01', weightKg: 61.5, note: ' hi ' };
    expect(parseWeightEntries([good, { ...good, weightKg: 5 }, { ...good, id: '' }, null])).toEqual([
      { ...good, note: 'hi' },
    ]);
    expect(parseWeightEntries({})).toBeNull();
  });
  it('sortByDate sorts oldest first without mutating', () => {
    const input = [{ date: '2026-03-02' }, { date: '2026-03-01' }];
    expect(sortByDate(input).map((e) => e.date)).toEqual(['2026-03-01', '2026-03-02']);
    expect(input[0]?.date).toBe('2026-03-02');
  });
});
