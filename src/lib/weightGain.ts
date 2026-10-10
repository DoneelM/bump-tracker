/**
 * Pregnancy weight logic: BMI, IOM gain guidance, and the weight log's data model.
 * Pure: no React, no clock (today is passed in).
 *
 * Gain ranges: Institute of Medicine (National Academies) 2009, "Weight Gain During
 * Pregnancy: Reexamining the Guidelines", Table S-1. SINGLETON pregnancies only.
 * BMI categories use the WHO cut-offs.
 */
import { diffDays, isLocalDate, type LocalDate } from './dates';
import { cleanString, isNumberInRange, isRecord, parseNumberInput } from './validate';
import type { ValidationResult } from './pregnancy';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export const BMI_CATEGORY_LABEL: Record<BmiCategory, string> = {
  underweight: 'in the underweight range',
  normal: 'in the typical range',
  overweight: 'in the overweight range',
  obese: 'in the obese range',
};

export const HEIGHT_MIN_CM = 120;
export const HEIGHT_MAX_CM = 220;
export const WEIGHT_MIN_KG = 30;
export const WEIGHT_MAX_KG = 250;
export const MAX_WEIGHT_NOTE_LENGTH = 200;

export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** WHO cut-offs: 18.5 is normal, 25.0 overweight, 30.0 obese. */
export function bmiCategory(v: number): BmiCategory {
  if (v < 18.5) return 'underweight';
  if (v < 25) return 'normal';
  if (v < 30) return 'overweight';
  return 'obese';
}

/** BMI to 1 decimal, truncated (not rounded) so the shown value never reads as a cut-off it hasn't reached. */
export const formatBmi = (v: number): string => (Math.floor(v * 10 + 1e-9) / 10).toFixed(1);

export interface GainRange {
  low: number;
  high: number;
}

/** IOM 2009 recommended TOTAL gain (kg) for a singleton pregnancy. */
export const TOTAL_GAIN_KG: Record<BmiCategory, GainRange> = {
  underweight: { low: 12.5, high: 18 },
  normal: { low: 11.5, high: 16 },
  overweight: { low: 7, high: 11.5 },
  obese: { low: 5, high: 9 },
};

const FIRST_TRIMESTER_END_WEEK = 13;
const FIRST_TRIMESTER_GAIN: GainRange = { low: 0.5, high: 2 }; // IOM assumes 0.5-2 kg in the first trimester
const FULL_TERM_WEEK = 40;

/**
 * APPROXIMATE band for charting only. The IOM publishes a total-gain range, not a
 * week-by-week one, so we draw straight lines: 0 kg at week 0 to 0.5/2 kg at week 13,
 * then to the category's total low/high at week 40. Weeks are clamped to 0..40
 * (the band holds at the total after 40).
 */
export function recommendedRangeAtWeek(category: BmiCategory, week: number): GainRange {
  const w = Math.min(FULL_TERM_WEEK, Math.max(0, Number.isFinite(week) ? week : 0));
  const total = TOTAL_GAIN_KG[category];
  const at = (first: number, last: number) =>
    w <= FIRST_TRIMESTER_END_WEEK
      ? (first * w) / FIRST_TRIMESTER_END_WEEK
      : first + ((last - first) * (w - FIRST_TRIMESTER_END_WEEK)) / (FULL_TERM_WEEK - FIRST_TRIMESTER_END_WEEK);
  return { low: at(FIRST_TRIMESTER_GAIN.low, total.low), high: at(FIRST_TRIMESTER_GAIN.high, total.high) };
}

// ---------------------------------------------------------------------------
// Data model + validation

export interface PrePregnancy {
  heightCm: number;
  weightKg: number;
}

export interface WeightEntry {
  id: string;
  date: LocalDate;
  weightKg: number;
  note: string;
}

export const rangeText = (r: GainRange) => `${r.low} to ${r.high} kg`;

const fail = (error: string): ValidationResult => ({ ok: false, error });

export function validateHeight(raw: string): ValidationResult {
  const p = parseNumberInput(raw);
  if (p.error) return fail(p.error);
  if (p.value === null) return fail('Please enter your height in cm.');
  if (!isNumberInRange(p.value, HEIGHT_MIN_CM, HEIGHT_MAX_CM)) {
    return fail(`Height should be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm.`);
  }
  return { ok: true };
}

export function validateWeight(raw: string): ValidationResult {
  const p = parseNumberInput(raw);
  if (p.error) return fail(p.error);
  if (p.value === null) return fail('Please enter your weight in kg.');
  if (!isNumberInRange(p.value, WEIGHT_MIN_KG, WEIGHT_MAX_KG)) {
    return fail(`Weight should be between ${WEIGHT_MIN_KG} and ${WEIGHT_MAX_KG} kg.`);
  }
  return { ok: true };
}

/** Entry date must be a real date, not in the future, and not before the LMP. */
export function validateEntryDate(date: unknown, lmp: LocalDate, today: LocalDate): ValidationResult {
  if (date === '' || date == null) return fail('Please enter a date.');
  if (!isLocalDate(date)) return fail('Please enter a valid date.');
  if (diffDays(date, today) < 0) return fail('The date can’t be in the future.');
  if (diffDays(lmp, date) < 0) return fail('The date can’t be before the start of your pregnancy.');
  return { ok: true };
}

export function validateWeightNote(note: string): ValidationResult {
  return note.trim().length > MAX_WEIGHT_NOTE_LENGTH
    ? fail(`Please keep the note to ${MAX_WEIGHT_NOTE_LENGTH} characters or fewer.`)
    : { ok: true };
}

export function parsePrePregnancy(value: unknown): PrePregnancy | null {
  if (!isRecord(value)) return null;
  if (!isNumberInRange(value.heightCm, HEIGHT_MIN_CM, HEIGHT_MAX_CM)) return null;
  if (!isNumberInRange(value.weightKg, WEIGHT_MIN_KG, WEIGHT_MAX_KG)) return null;
  return { heightCm: value.heightCm, weightKg: value.weightKg };
}

function parseWeightEntry(value: unknown): WeightEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id) return null;
  if (!isLocalDate(value.date) || !isNumberInRange(value.weightKg, WEIGHT_MIN_KG, WEIGHT_MAX_KG)) return null;
  const note = cleanString(value.note ?? '', MAX_WEIGHT_NOTE_LENGTH);
  if (note === null) return null;
  return { id: value.id, date: value.date, weightKg: value.weightKg, note };
}

export function parseWeightEntries(value: unknown): WeightEntry[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(parseWeightEntry).filter((e): e is WeightEntry => e !== null);
}

/** Oldest first; same-day entries keep insertion order. */
export function sortByDate<T extends { date: LocalDate }>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
