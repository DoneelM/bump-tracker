import { describe, expect, it } from 'vitest';
import { formatBabyAge } from './babyAge';

describe('formatBabyAge', () => {
  it('reads naturally at each stage', () => {
    expect(formatBabyAge('2026-10-12', '2026-10-12')).toBe('Born today');
    expect(formatBabyAge('2026-10-12', '2026-10-13')).toBe('1 day old');
    expect(formatBabyAge('2026-10-01', '2026-10-24')).toBe('3 weeks 2 days old');
    expect(formatBabyAge('2026-10-01', '2026-10-29')).toBe('4 weeks old');
    expect(formatBabyAge('2026-06-10', '2026-10-20')).toBe('4 months 1 week old');
    expect(formatBabyAge('2024-07-12', '2026-10-12')).toBe('2 years 3 months old');
  });

  it('is empty before the birth date', () => {
    expect(formatBabyAge('2026-10-12', '2026-10-11')).toBe('');
  });
});
