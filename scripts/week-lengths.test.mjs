// Checks the week guide against its sources: lengths against perinatology.com's week-by-week figures, weights
// against the WHO EFW medians the scans chart uses. Run alone with: npx vitest run scripts/week-lengths.test.mjs
import { describe, expect, it } from 'vitest';
import { WEEKS } from '../src/data/weeks.ts';
import { WHO_EFW } from '../src/lib/fetalGrowth.ts';

// https://www.perinatology.com/Reference/Fetal%20development.htm (page reviewed 12/6/2025, read 2026-10-11).
// Average length in cm by completed week; crown-rump to week 13, crown-heel from week 14. No figure for weeks 4-5.
const PERINATOLOGY_CM = {
  6: 0.5,
  7: 0.95,
  8: 1.6,
  9: 2.3,
  10: 3.1,
  11: 4.1,
  12: 5.4,
  13: 6.7,
  14: 14.7,
  15: 16.7,
  16: 18.6,
  17: 20.4,
  18: 22.2,
  19: 24,
  20: 25.7,
  21: 27.4,
  22: 29,
  23: 30.6,
  24: 32.2,
  25: 33.7,
  26: 35.1,
  27: 36.6,
  28: 37.9,
  29: 39.2,
  30: 40.5,
  31: 41.8,
  32: 43,
  33: 44,
  34: 45.2,
  35: 46.3,
  36: 47.3,
  37: 48.3,
  38: 49.2,
  39: 50.1,
  40: 51,
};
const CROWN_HEEL_FROM = 14;

describe('week guide data vs sources', () => {
  it('matches perinatology.com lengths and measure for weeks 6-40', () => {
    const mismatches = WEEKS.filter((w) => w.week >= 6).flatMap((w) => {
      const out = [];
      if (w.lengthCm !== PERINATOLOGY_CM[w.week]) out.push(`week ${w.week}: ${w.lengthCm} cm, source ${PERINATOLOGY_CM[w.week]} cm`);
      const note = w.week >= CROWN_HEEL_FROM ? 'crown-heel' : 'crown-rump';
      if (w.lengthNote !== note) out.push(`week ${w.week}: ${w.lengthNote}, source ${note}`);
      return out;
    });
    expect(mismatches).toEqual([]);
  });

  it('uses the WHO EFW median as the weight for weeks 14-40', () => {
    const mismatches = WEEKS.filter((w) => w.week >= 14).flatMap((w) => {
      const p50 = WHO_EFW.find((r) => r.week === w.week)?.p50;
      return w.weightG === p50 ? [] : [`week ${w.week}: ${w.weightG} g, WHO ${p50} g`];
    });
    expect(mismatches).toEqual([]);
  });
});
