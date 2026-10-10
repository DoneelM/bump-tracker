import { describe, expect, it } from 'vitest';
import {
  daysUntilDue,
  dueDateFromLMP,
  dueDateFromScan,
  formatWeeksDays,
  gestationalAge,
  lmpFromDueDate,
  MAX_LMP_AGE_DAYS,
  progressFraction,
  splitDays,
  trimester,
  validateLMP,
  validateScan,
  validateScanDate,
  validateScanGA,
} from './pregnancy';
import { addDays } from './dates';

describe('dueDateFromLMP (Naegele, +280 days)', () => {
  it('adds 280 days in a leap year', () => {
    expect(dueDateFromLMP('2024-01-01')).toBe('2024-10-07');
  });

  it('adds 280 days in a common year', () => {
    expect(dueDateFromLMP('2023-01-01')).toBe('2023-10-08');
  });

  it('accounts for a 29 February inside the pregnancy', () => {
    expect(dueDateFromLMP('2023-06-01')).toBe('2024-03-07');
    expect(dueDateFromLMP('2022-06-01')).toBe('2023-03-08');
  });

  it('handles month-end LMPs', () => {
    expect(dueDateFromLMP('2025-05-31')).toBe('2026-03-07');
    expect(dueDateFromLMP('2024-02-29')).toBe('2024-12-05');
    expect(dueDateFromLMP('2025-12-31')).toBe('2026-10-07');
  });

  it('round-trips with lmpFromDueDate', () => {
    for (const lmp of ['2024-01-01', '2024-02-29', '2025-03-30', '2025-12-31', '2026-09-27']) {
      expect(lmpFromDueDate(dueDateFromLMP(lmp))).toBe(lmp);
    }
  });

  it('throws on invalid dates', () => {
    expect(() => dueDateFromLMP('2023-02-29')).toThrow(RangeError);
  });
});

describe('dueDateFromScan', () => {
  it('dates from gestational age at the scan', () => {
    // 12w3d = 87 days, so LMP-equivalent is 2025-12-13 and EDD is 2026-09-19.
    expect(dueDateFromScan('2026-03-10', 12, 3)).toBe('2026-09-19');
    expect(lmpFromDueDate('2026-09-19')).toBe('2025-12-13');
    expect(dueDateFromLMP('2025-12-13')).toBe('2026-09-19');
  });

  it('a 40w0d scan gives a due date of the scan day', () => {
    expect(dueDateFromScan('2026-05-01', 40, 0)).toBe('2026-05-01');
  });

  it('a 0w0d scan behaves like an LMP', () => {
    expect(dueDateFromScan('2024-01-01', 0, 0)).toBe(dueDateFromLMP('2024-01-01'));
  });

  it('agrees with gestationalAge on the scan date', () => {
    const due = dueDateFromScan('2024-02-29', 20, 6);
    expect(gestationalAge(due, '2024-02-29')).toEqual({ weeks: 20, days: 6, totalDays: 146 });
  });

  it.each([
    [12, 7],
    [12, -1],
    [-1, 0],
    [12.5, 0],
    [12, 0.5],
  ])('throws on invalid GA %iw%id', (w, d) => {
    expect(() => dueDateFromScan('2026-03-10', w, d)).toThrow(RangeError);
  });
});

describe('gestationalAge', () => {
  const due = '2026-09-19'; // LMP 2025-12-13

  it('is 0w0d on the LMP', () => {
    expect(gestationalAge(due, '2025-12-13')).toEqual({ weeks: 0, days: 0, totalDays: 0 });
  });

  it('counts across a year end', () => {
    expect(gestationalAge(due, '2026-06-01')).toEqual({ weeks: 24, days: 2, totalDays: 170 });
  });

  it('is 40w0d on the due date and continues afterwards', () => {
    expect(gestationalAge(due, due)).toEqual({ weeks: 40, days: 0, totalDays: 280 });
    expect(gestationalAge(due, '2026-09-29')).toEqual({ weeks: 41, days: 3, totalDays: 290 });
  });

  it('is negative before the LMP with days still 0-6', () => {
    expect(gestationalAge(due, '2025-12-12')).toEqual({ weeks: -1, days: 6, totalDays: -1 });
  });

  it('is identical across NZ daylight-saving changes', () => {
    // Due date chosen so the pregnancy spans both the April and September 2026 transitions.
    const edd = dueDateFromLMP('2026-03-01');
    expect(gestationalAge(edd, '2026-04-04').totalDays).toBe(34);
    expect(gestationalAge(edd, '2026-04-06').totalDays).toBe(36);
    expect(gestationalAge(edd, '2026-09-26').totalDays).toBe(209);
    expect(gestationalAge(edd, '2026-09-28').totalDays).toBe(211);
  });
});

describe('splitDays', () => {
  it('splits into weeks and 0-6 days', () => {
    expect(splitDays(0)).toEqual({ weeks: 0, days: 0 });
    expect(splitDays(6)).toEqual({ weeks: 0, days: 6 });
    expect(splitDays(7)).toEqual({ weeks: 1, days: 0 });
    expect(splitDays(171)).toEqual({ weeks: 24, days: 3 });
    expect(splitDays(-8)).toEqual({ weeks: -2, days: 6 });
  });
});

describe('trimester boundaries', () => {
  it.each([
    [-5, 1],
    [0, 1],
    [13 * 7 + 6, 1], // 13w6d
    [14 * 7, 2], // 14w0d
    [27 * 7 + 6, 2], // 27w6d
    [28 * 7, 3], // 28w0d
    [40 * 7, 3],
    [43 * 7, 3],
  ])('%i days -> trimester %i', (days, expected) => {
    expect(trimester(days)).toBe(expected);
  });

  it('matches gestationalAge on real dates', () => {
    const lmp = '2024-01-01';
    const due = dueDateFromLMP(lmp);
    expect(trimester(gestationalAge(due, addDays(lmp, 97)).totalDays)).toBe(1);
    expect(trimester(gestationalAge(due, addDays(lmp, 98)).totalDays)).toBe(2);
    expect(trimester(gestationalAge(due, addDays(lmp, 195)).totalDays)).toBe(2);
    expect(trimester(gestationalAge(due, addDays(lmp, 196)).totalDays)).toBe(3);
  });
});

describe('daysUntilDue', () => {
  it('counts down and goes negative after the due date', () => {
    expect(daysUntilDue('2026-12-25', '2026-10-11')).toBe(75);
    expect(daysUntilDue('2026-12-25', '2026-12-25')).toBe(0);
    expect(daysUntilDue('2026-12-25', '2026-12-27')).toBe(-2);
  });

  it('counts across 29 February', () => {
    expect(daysUntilDue('2024-03-01', '2024-02-28')).toBe(2);
    expect(daysUntilDue('2023-03-01', '2023-02-28')).toBe(1);
  });
});

describe('progressFraction', () => {
  it('clamps to 0..1', () => {
    expect(progressFraction(-3)).toBe(0);
    expect(progressFraction(0)).toBe(0);
    expect(progressFraction(140)).toBe(0.5);
    expect(progressFraction(280)).toBe(1);
    expect(progressFraction(300)).toBe(1);
  });
});

describe('formatWeeksDays', () => {
  it('pluralises', () => {
    expect(formatWeeksDays(24, 3)).toBe('24 weeks 3 days');
    expect(formatWeeksDays(1, 1)).toBe('1 week 1 day');
    expect(formatWeeksDays(10, 0)).toBe('10 weeks');
    expect(formatWeeksDays(0, 5)).toBe('5 days');
    expect(formatWeeksDays(0, 0)).toBe('0 days');
  });
});

describe('validateLMP', () => {
  const today = '2026-10-11';

  it('accepts today and dates up to 44 weeks ago', () => {
    expect(validateLMP(today, today)).toEqual({ ok: true });
    expect(validateLMP('2026-03-01', today)).toEqual({ ok: true });
    expect(validateLMP(addDays(today, -MAX_LMP_AGE_DAYS), today)).toEqual({ ok: true });
  });

  it('rejects future dates', () => {
    expect(validateLMP('2026-10-12', today)).toMatchObject({ ok: false, error: expect.stringMatching(/future/) });
  });

  it('rejects dates more than 44 weeks ago', () => {
    expect(validateLMP(addDays(today, -MAX_LMP_AGE_DAYS - 1), today)).toMatchObject({
      ok: false,
      error: expect.stringMatching(/44 weeks/),
    });
  });

  it.each(['', null, undefined, '2026-02-30', 'yesterday', 20260101])('rejects %j', (value) => {
    expect(validateLMP(value, today).ok).toBe(false);
  });
});

describe('validateScanDate', () => {
  const today = '2026-10-11';

  it('accepts today and past dates', () => {
    expect(validateScanDate(today, today).ok).toBe(true);
    expect(validateScanDate('2026-06-01', today).ok).toBe(true);
  });

  it.each(['2026-10-12', '', null, '2026-13-01'])('rejects %j', (value) => {
    expect(validateScanDate(value, today).ok).toBe(false);
  });
});

describe('validateScanGA', () => {
  it.each([
    [4, 0],
    [12, 3],
    [42, 6],
  ])('accepts %iw%id', (w, d) => {
    expect(validateScanGA(w, d)).toEqual({ ok: true });
  });

  it.each([
    [3, 6],
    [43, 0],
    [12, 7],
    [12, -1],
    [12.5, 0],
    [12, 1.5],
    [Number.NaN, 0],
    ['12', 0],
    [12, null],
  ])('rejects %j w %j d', (w, d) => {
    expect(validateScanGA(w, d).ok).toBe(false);
  });
});

describe('validateScan', () => {
  const today = '2026-10-11';

  it('accepts a typical dating scan', () => {
    expect(validateScan('2026-06-15', 12, 2, today)).toEqual({ ok: true });
  });

  it('reports the first problem found', () => {
    expect(validateScan('2026-10-12', 12, 2, today)).toMatchObject({ ok: false, error: expect.stringMatching(/future/) });
    expect(validateScan('2026-06-15', 2, 0, today)).toMatchObject({ ok: false, error: expect.stringMatching(/4 weeks/) });
  });

  it('rejects scans implying more than 44 weeks today', () => {
    // A 40w scan 5 weeks ago -> 45 weeks today.
    expect(validateScan(addDays(today, -35), 40, 0, today)).toMatchObject({
      ok: false,
      error: expect.stringMatching(/44 weeks/),
    });
    // Exactly 44w0d today is still allowed.
    expect(validateScan(addDays(today, -28), 40, 0, today)).toEqual({ ok: true });
  });
});
