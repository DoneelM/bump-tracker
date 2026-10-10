import { describe, expect, it } from 'vitest';
import { stageForWeek, stageImagePath } from './stages';

describe('stageForWeek', () => {
  it('uses the week 6 image for weeks 4-5', () => {
    expect(stageForWeek(4)).toBe(6);
    expect(stageForWeek(5)).toBe(6);
  });

  it('picks the closest stage at or below the week', () => {
    expect(stageForWeek(6)).toBe(6);
    expect(stageForWeek(7)).toBe(6);
    expect(stageForWeek(8)).toBe(8);
    expect(stageForWeek(11)).toBe(8);
    expect(stageForWeek(19)).toBe(16);
    expect(stageForWeek(27)).toBe(24);
  });

  it('uses the week 28 image for weeks 28-40', () => {
    for (let w = 28; w <= 40; w++) expect(stageForWeek(w)).toBe(28);
  });
});

describe('stageImagePath', () => {
  it('zero-pads the stage', () => {
    expect(stageImagePath(5)).toBe('images/baby/baby-week-06.webp');
    expect(stageImagePath(33)).toBe('images/baby/baby-week-28.webp');
  });
});
