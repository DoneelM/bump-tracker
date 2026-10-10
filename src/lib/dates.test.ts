import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysInMonth,
  diffDays,
  formatDisplayDate,
  fromDayNumber,
  isLeapYear,
  isLocalDate,
  parseLocalDate,
  toDayNumber,
  todayLocal,
} from './dates';

describe('parseLocalDate / isLocalDate', () => {
  it('accepts well-formed real dates', () => {
    expect(parseLocalDate('2026-10-11')).toEqual({ year: 2026, month: 10, day: 11 });
    expect(isLocalDate('2024-02-29')).toBe(true);
    expect(isLocalDate('2000-02-29')).toBe(true);
  });

  it.each([
    '2023-02-29', // not a leap year
    '2100-02-29', // century, not leap
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '2026-01-00',
    '2026-1-5',
    '26-01-05',
    '2026/01/05',
    '2026-01-05T00:00:00Z',
    ' 2026-01-05',
    '',
    '1899-12-31',
    '2201-01-01',
  ])('rejects %j', (value) => {
    expect(parseLocalDate(value)).toBeNull();
    expect(isLocalDate(value)).toBe(false);
  });

  it.each([null, undefined, 20260105, {}, ['2026-01-05']])('rejects non-strings (%j)', (value) => {
    expect(isLocalDate(value)).toBe(false);
  });
});

describe('leap years and month lengths', () => {
  it('follows Gregorian leap rules', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
  });

  it('knows month lengths', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2025, 4)).toBe(30);
    expect(daysInMonth(2025, 12)).toBe(31);
  });
});

describe('addDays / diffDays', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(addDays('2100-02-28', 1)).toBe('2100-03-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-03-31', -31)).toBe('2026-02-28');
  });

  it('measures whole days, including over leap days', () => {
    expect(diffDays('2024-01-01', '2025-01-01')).toBe(366);
    expect(diffDays('2025-01-01', '2026-01-01')).toBe(365);
    expect(diffDays('2026-10-11', '2026-10-11')).toBe(0);
    expect(diffDays('2026-10-12', '2026-10-11')).toBe(-1);
  });

  it('rejects non-integer offsets and invalid dates', () => {
    expect(() => addDays('2026-01-01', 1.5)).toThrow(RangeError);
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
    expect(() => diffDays('nope', '2026-01-01')).toThrow(RangeError);
  });

  it('steps exactly one day at a time for years, regardless of DST', () => {
    let d = '2023-01-01';
    for (let i = 0; i < 365 * 4 + 1; i++) {
      const next = addDays(d, 1);
      expect(diffDays(d, next)).toBe(1);
      expect(fromDayNumber(toDayNumber(next))).toBe(next);
      expect(isLocalDate(next)).toBe(true);
      d = next;
    }
    expect(d).toBe('2027-01-01'); // 2023-2026 = 1461 days incl. one leap day
  });
});

describe('todayLocal', () => {
  it('uses local calendar fields, not UTC', () => {
    expect(todayLocal(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01-01');
    expect(todayLocal(new Date(2026, 0, 1, 23, 59, 59))).toBe('2026-01-01');
    expect(todayLocal(new Date(2024, 1, 29, 12))).toBe('2024-02-29');
  });

  describe('in Pacific/Auckland (set in vite.config.ts)', () => {
    it('runs with the NZ timezone', () => {
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Pacific/Auckland');
    });

    it('returns the NZ date when UTC is still on the previous day', () => {
      // 2026-10-10T20:00Z is 9am Sunday 11 October in Auckland (NZDT, UTC+13).
      expect(todayLocal(new Date('2026-10-10T20:00:00Z'))).toBe('2026-10-11');
    });

    it('is unaffected by the start of daylight saving (27 Sep 2026)', () => {
      // Clocks go 02:00 NZST -> 03:00 NZDT. That day is only 23 hours long.
      expect(todayLocal(new Date('2026-09-26T13:30:00Z'))).toBe('2026-09-27'); // 01:30 NZST
      expect(todayLocal(new Date('2026-09-27T10:59:00Z'))).toBe('2026-09-27'); // 23:59 NZDT
      expect(todayLocal(new Date('2026-09-27T11:00:00Z'))).toBe('2026-09-28'); // 00:00 NZDT
      expect(diffDays('2026-09-26', '2026-09-28')).toBe(2);
    });

    it('is unaffected by the end of daylight saving (5 Apr 2026)', () => {
      // Clocks go 03:00 NZDT -> 02:00 NZST. That day is 25 hours long.
      expect(todayLocal(new Date('2026-04-04T11:00:00Z'))).toBe('2026-04-05'); // 00:00 NZDT
      expect(todayLocal(new Date('2026-04-05T11:59:00Z'))).toBe('2026-04-05'); // 23:59 NZST
      expect(todayLocal(new Date('2026-04-05T12:00:00Z'))).toBe('2026-04-06'); // 00:00 NZST
      expect(diffDays('2026-04-04', '2026-04-06')).toBe(2);
    });
  });
});

describe('formatDisplayDate', () => {
  it('formats without shifting the day', () => {
    const text = formatDisplayDate('2026-07-03');
    expect(text).toContain('3');
    expect(text).toContain('July');
    expect(text).toContain('2026');
    expect(formatDisplayDate('2026-01-01')).toContain('January');
    expect(formatDisplayDate('2025-12-31')).toContain('December');
  });
});
