/**
 * Local calendar date primitives.
 *
 * All dates in the app are plain calendar dates stored as `YYYY-MM-DD`
 * strings (a "LocalDate"). Arithmetic is done on integer day numbers derived
 * via Date.UTC, so results never depend on the device's timezone or on
 * daylight-saving transitions (e.g. NZDT <-> NZST).
 */

/** A calendar date formatted as `YYYY-MM-DD` (no time, no timezone). */
export type LocalDate = string;

const MS_PER_DAY = 86_400_000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Earliest/latest years we accept at all. Keeps arithmetic well inside safe ranges. */
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2200;

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Strictly parses `YYYY-MM-DD`. Returns null for malformed or impossible dates (e.g. 2023-02-29). */
export function parseLocalDate(value: unknown): DateParts | null {
  if (typeof value !== 'string') return null;
  const m = DATE_RE.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isLocalDate(value: unknown): value is LocalDate {
  return parseLocalDate(value) !== null;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

export function formatLocalDate({ year, month, day }: DateParts): LocalDate {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Days since 1970-01-01 for a valid LocalDate. Throws on invalid input. */
export function toDayNumber(date: LocalDate): number {
  const p = parseLocalDate(date);
  if (!p) throw new RangeError(`Invalid date: ${String(date)}`);
  return Date.UTC(p.year, p.month - 1, p.day) / MS_PER_DAY;
}

export function fromDayNumber(dayNumber: number): LocalDate {
  if (!Number.isInteger(dayNumber)) throw new RangeError(`Invalid day number: ${dayNumber}`);
  const d = new Date(dayNumber * MS_PER_DAY);
  return formatLocalDate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}

export function addDays(date: LocalDate, days: number): LocalDate {
  if (!Number.isInteger(days)) throw new RangeError(`Days must be an integer: ${days}`);
  return fromDayNumber(toDayNumber(date) + days);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: LocalDate, to: LocalDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** The device's current calendar date, read from local (not UTC) fields. */
export function todayLocal(now: Date = new Date()): LocalDate {
  return formatLocalDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

const displayFormatter = new Intl.DateTimeFormat('en-NZ', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Human-friendly NZ format, e.g. "Fri, 3 July 2026". Formats in UTC so the day never shifts. */
export function formatDisplayDate(date: LocalDate): string {
  return displayFormatter.format(new Date(toDayNumber(date) * MS_PER_DAY));
}
