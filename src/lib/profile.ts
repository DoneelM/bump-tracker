/**
 * The pregnancy profile set up during onboarding: how the due date was worked
 * out, the due date itself, and an optional baby nickname.
 */
import { isPlausibleDate, type LocalDate } from './dates';
import { dueDateFromLMP, dueDateFromScan, validateLMP, validateScan, type ValidationResult } from './pregnancy';
import { cleanString, isIntInRange, isRecord } from './validate';

export const MAX_NICKNAME_LENGTH = 40;

export type DatingInput =
  | { method: 'lmp'; lmp: LocalDate }
  | { method: 'scan'; scanDate: LocalDate; gaWeeks: number; gaDays: number };

export interface PregnancyProfile {
  dating: DatingInput;
  dueDate: LocalDate;
  nickname: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}

export function dueDateFor(dating: DatingInput): LocalDate {
  return dating.method === 'lmp' ? dueDateFromLMP(dating.lmp) : dueDateFromScan(dating.scanDate, dating.gaWeeks, dating.gaDays);
}

export function validateDating(dating: DatingInput, today: LocalDate): ValidationResult {
  return dating.method === 'lmp'
    ? validateLMP(dating.lmp, today)
    : validateScan(dating.scanDate, dating.gaWeeks, dating.gaDays, today);
}

export function validateNickname(value: string): ValidationResult {
  if (value.trim().length > MAX_NICKNAME_LENGTH) {
    return { ok: false, error: `Please keep the nickname to ${MAX_NICKNAME_LENGTH} characters or fewer.` };
  }
  return { ok: true };
}

export function createProfile(dating: DatingInput, nickname: string, now: Date = new Date()): PregnancyProfile {
  return { dating, dueDate: dueDateFor(dating), nickname: nickname.trim(), updatedAt: now.toISOString() };
}

function parseDating(value: unknown): DatingInput | null {
  if (!isRecord(value)) return null;
  if (value.method === 'lmp' && isPlausibleDate(value.lmp)) return { method: 'lmp', lmp: value.lmp };
  if (
    value.method === 'scan' &&
    isPlausibleDate(value.scanDate) &&
    isIntInRange(value.gaWeeks, 0, 45) &&
    isIntInRange(value.gaDays, 0, 6)
  ) {
    return { method: 'scan', scanDate: value.scanDate, gaWeeks: value.gaWeeks, gaDays: value.gaDays };
  }
  return null;
}

/**
 * Validator for stored profiles. Structural checks only (not "is the LMP in the
 * future", which depends on today). The due date is recomputed from the dating
 * input so the two can never disagree. Dating dates are bounded to 2000-2099, so the derived
 * due date (at most ~46 weeks away) is always a valid LocalDate.
 */
export function parseProfile(value: unknown): PregnancyProfile | null {
  if (!isRecord(value)) return null;
  const dating = parseDating(value.dating);
  if (!dating) return null;
  const nickname = cleanString(value.nickname ?? '', MAX_NICKNAME_LENGTH);
  if (nickname === null) return null;
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : '';
  return { dating, dueDate: dueDateFor(dating), nickname, updatedAt };
}
