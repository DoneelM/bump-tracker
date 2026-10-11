/**
 * The pregnancy profile set up during onboarding: how the due date was worked
 * out, the due date itself, and an optional baby nickname.
 */
import { diffDays, isPlausibleDate, type LocalDate } from './dates';
import { dueDateFromLMP, dueDateFromScan, lmpFromDueDate, validateLMP, validateScan, type ValidationResult } from './pregnancy';
import { cleanString, isIntInRange, isRecord } from './validate';

export const MAX_NICKNAME_LENGTH = 40;

export type DatingInput =
  | { method: 'lmp'; lmp: LocalDate }
  | { method: 'scan'; scanDate: LocalDate; gaWeeks: number; gaDays: number };

export const MAX_BABY_NAME_LENGTH = 60;
export const MIN_BIRTH_WEIGHT_G = 300;
export const MAX_BIRTH_WEIGHT_G = 7000;

/** How the pregnancy ended, once it has: the app stops showing pregnancy updates. */
export type PregnancyEnding =
  | { kind: 'born'; date: LocalDate; name: string; weightG: number | null }
  | { kind: 'ended'; date: LocalDate | null };

export interface PregnancyProfile {
  dating: DatingInput;
  dueDate: LocalDate;
  nickname: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
  /** Missing while pregnant. */
  ending?: PregnancyEnding;
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

/** A birth or end date must be after the pregnancy started and not in the future. */
export function validateEndingDate(date: unknown, dueDate: LocalDate, today: LocalDate, required: boolean): ValidationResult {
  if (date === '' || date == null) return required ? { ok: false, error: 'Please enter a date.' } : { ok: true };
  if (!isPlausibleDate(date)) return { ok: false, error: 'Please enter a valid date.' };
  if (diffDays(date, today) < 0) return { ok: false, error: 'The date can’t be in the future.' };
  if (diffDays(lmpFromDueDate(dueDate), date) < 0) return { ok: false, error: 'The date can’t be before the start of your pregnancy.' };
  return { ok: true };
}

function parseEnding(value: unknown): PregnancyEnding | null {
  if (!isRecord(value)) return null;
  if (value.kind === 'born' && isPlausibleDate(value.date)) {
    const name = cleanString(value.name ?? '', MAX_BABY_NAME_LENGTH);
    const weightG = value.weightG ?? null;
    if (name === null || (weightG !== null && !isIntInRange(weightG, MIN_BIRTH_WEIGHT_G, MAX_BIRTH_WEIGHT_G))) return null;
    return { kind: 'born', date: value.date, name, weightG };
  }
  if (value.kind === 'ended' && (value.date === null || value.date === undefined || isPlausibleDate(value.date))) {
    return { kind: 'ended', date: value.date ?? null };
  }
  return null;
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
  const profile: PregnancyProfile = { dating, dueDate: dueDateFor(dating), nickname, updatedAt };
  // A damaged ending is dropped rather than failing the whole profile, which would send the user back to onboarding.
  const ending = parseEnding(value.ending);
  if (ending) profile.ending = ending;
  return profile;
}
