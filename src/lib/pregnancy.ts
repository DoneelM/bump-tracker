/**
 * Pure pregnancy dating logic. No React, no storage, no clock access:
 * "today" is always passed in, which keeps everything deterministic and testable.
 *
 * Conventions (standard obstetric dating):
 * - Gestational age (GA) is counted from the first day of the last menstrual period (LMP).
 * - Estimated due date (EDD) = LMP + 280 days (Naegele's rule, 40w0d).
 * - Trimesters: 1st up to 13w6d, 2nd 14w0d-27w6d, 3rd from 28w0d.
 */
import { addDays, diffDays, isLocalDate, type LocalDate } from './dates';

export const PREGNANCY_LENGTH_DAYS = 280;
/** Oldest LMP accepted (~44 weeks), beyond which the dates are almost certainly a typo. */
export const MAX_LMP_AGE_DAYS = 44 * 7;
export const MIN_SCAN_GA_DAYS = 4 * 7; // 4w0d
export const MAX_SCAN_GA_DAYS = 42 * 7 + 6; // 42w6d

const TRIMESTER_2_START = 14 * 7;
const TRIMESTER_3_START = 28 * 7;

export type Trimester = 1 | 2 | 3;

export const TRIMESTER_LABEL: Record<Trimester, string> = {
  1: 'First trimester',
  2: 'Second trimester',
  3: 'Third trimester',
};

export interface GestationalAge {
  /** Completed weeks. Negative if `today` is before the LMP. */
  weeks: number;
  /** Extra days, always 0-6. */
  days: number;
  /** Total days since LMP. */
  totalDays: number;
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

const ok: ValidationResult = { ok: true };
const fail = (error: string): ValidationResult => ({ ok: false, error });

export function dueDateFromLMP(lmp: LocalDate): LocalDate {
  return addDays(lmp, PREGNANCY_LENGTH_DAYS);
}

export function lmpFromDueDate(dueDate: LocalDate): LocalDate {
  return addDays(dueDate, -PREGNANCY_LENGTH_DAYS);
}

/** Due date from a dating scan showing `gaWeeks`+`gaDays` on `scanDate`. */
export function dueDateFromScan(scanDate: LocalDate, gaWeeks: number, gaDays: number): LocalDate {
  if (!Number.isInteger(gaWeeks) || !Number.isInteger(gaDays) || gaWeeks < 0 || gaDays < 0 || gaDays > 6) {
    throw new RangeError(`Invalid gestational age: ${gaWeeks}w${gaDays}d`);
  }
  return addDays(scanDate, PREGNANCY_LENGTH_DAYS - (gaWeeks * 7 + gaDays));
}

export function splitDays(totalDays: number): { weeks: number; days: number } {
  const weeks = Math.floor(totalDays / 7);
  return { weeks, days: totalDays - weeks * 7 };
}

export function gestationalAge(dueDate: LocalDate, today: LocalDate): GestationalAge {
  const totalDays = diffDays(lmpFromDueDate(dueDate), today);
  return { ...splitDays(totalDays), totalDays };
}

/** Trimester for a gestational age in total days (values before LMP count as 1st). */
export function trimester(totalDays: number): Trimester {
  if (totalDays < TRIMESTER_2_START) return 1;
  if (totalDays < TRIMESTER_3_START) return 2;
  return 3;
}

/** Days from `today` until the due date; negative once the due date has passed. */
export function daysUntilDue(dueDate: LocalDate, today: LocalDate): number {
  return diffDays(today, dueDate);
}

/** Past-due guidance: none up to the due date, "past" after it, "overdue" from 14 days past (42w0d). */
export const pastDueLevel = (daysLeft: number): 'none' | 'past' | 'overdue' =>
  daysLeft >= 0 ? 'none' : daysLeft <= -14 ? 'overdue' : 'past';

/** Fraction of a 40-week pregnancy elapsed, clamped to 0..1. */
export function progressFraction(totalDays: number): number {
  return Math.min(1, Math.max(0, totalDays / PREGNANCY_LENGTH_DAYS));
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** e.g. "24 weeks 3 days", "1 week", "0 days". */
export function formatWeeksDays(weeks: number, days: number): string {
  if (weeks === 0 && days === 0) return '0 days';
  const parts: string[] = [];
  if (weeks !== 0) parts.push(plural(weeks, 'week'));
  if (days !== 0) parts.push(plural(days, 'day'));
  return parts.join(' ');
}

/** Age for a logged entry; a date before the LMP (dating changed later) reads "before pregnancy". */
export function formatEntryAge(ga: GestationalAge): string {
  return ga.totalDays < 0 ? 'before pregnancy' : formatWeeksDays(ga.weeks, ga.days);
}

// ---------------------------------------------------------------------------
// Validation

export function validateLMP(lmp: unknown, today: LocalDate): ValidationResult {
  if (lmp === '' || lmp == null) return fail('Please enter the first day of your last period.');
  if (!isLocalDate(lmp)) return fail('Please enter a valid date.');
  const age = diffDays(lmp, today);
  if (age < 0) return fail('This date is in the future. Please check it.');
  if (age > MAX_LMP_AGE_DAYS) return fail('This date is more than 44 weeks ago. Please check it.');
  return ok;
}

export function validateScanDate(scanDate: unknown, today: LocalDate): ValidationResult {
  if (scanDate === '' || scanDate == null) return fail('Please enter the date of your scan.');
  if (!isLocalDate(scanDate)) return fail('Please enter a valid date.');
  if (diffDays(scanDate, today) < 0) return fail('The scan date can’t be in the future.');
  return ok;
}

export function validateScanGA(gaWeeks: unknown, gaDays: unknown): ValidationResult {
  if (typeof gaWeeks !== 'number' || !Number.isInteger(gaWeeks)) return fail('Weeks must be a whole number.');
  if (typeof gaDays !== 'number' || !Number.isInteger(gaDays)) return fail('Days must be a whole number.');
  if (gaDays < 0 || gaDays > 6) return fail('Days must be between 0 and 6.');
  const total = gaWeeks * 7 + gaDays;
  if (total < MIN_SCAN_GA_DAYS || total > MAX_SCAN_GA_DAYS) {
    return fail('Gestational age at the scan must be between 4 weeks 0 days and 42 weeks 6 days.');
  }
  return ok;
}

/** Validates a complete scan entry, including that the implied LMP is not implausibly old. */
export function validateScan(
  scanDate: unknown,
  gaWeeks: unknown,
  gaDays: unknown,
  today: LocalDate,
): ValidationResult {
  const dateResult = validateScanDate(scanDate, today);
  if (!dateResult.ok) return dateResult;
  const gaResult = validateScanGA(gaWeeks, gaDays);
  if (!gaResult.ok) return gaResult;
  const due = dueDateFromScan(scanDate as LocalDate, gaWeeks as number, gaDays as number);
  if (gestationalAge(due, today).totalDays > MAX_LMP_AGE_DAYS) {
    return fail('This scan would put you more than 44 weeks along today. Please check the date.');
  }
  return ok;
}
