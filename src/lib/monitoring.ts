/**
 * Home blood pressure and glucose readings, for people whose care team has asked them to check at home.
 * The app ships no clinical thresholds: input limits below only reject typing mistakes, and "above target"
 * compares with upper limits the user enters from their own care team. Pure.
 */
import { isPlausibleDate, type LocalDate } from './dates';
import type { ValidationResult } from './pregnancy';
import { cleanString, isFiniteNumber, isIntInRange, isRecord } from './validate';

export const MAX_READINGS = 2000;
export const MAX_READING_NOTE_LENGTH = 200;

/** Plausible-input ranges (typos), not clinical limits. */
export const BP_INPUT = { systolic: [50, 260], diastolic: [30, 160], pulse: [30, 220] } as const;
export const GLUCOSE_INPUT = [1, 35] as const; // mmol/L

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface BpReading {
  id: string;
  date: LocalDate;
  /** "HH:MM", or "" if not given. */
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  note: string;
}

export const GLUCOSE_CONTEXTS = [
  { value: 'fasting', label: 'Fasting' },
  { value: '1h', label: '1 hour after a meal' },
  { value: '2h', label: '2 hours after a meal' },
  { value: 'other', label: 'Other' },
] as const;
export type GlucoseContext = (typeof GLUCOSE_CONTEXTS)[number]['value'];
export const glucoseContextLabel = (c: GlucoseContext) => GLUCOSE_CONTEXTS.find((x) => x.value === c)!.label;

export interface GlucoseReading {
  id: string;
  date: LocalDate;
  time: string;
  context: GlucoseContext;
  /** mmol/L, one decimal place. */
  mmol: number;
  note: string;
}

/** Upper limits from the user's own care team; each is optional. */
export interface MonitoringTargets {
  bpSystolicMax: number | null;
  bpDiastolicMax: number | null;
  glucoseMax: Partial<Record<Exclude<GlucoseContext, 'other'>, number>>;
}

export const NO_TARGETS: MonitoringTargets = { bpSystolicMax: null, bpDiastolicMax: null, glucoseMax: {} };

const inRange = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;
export const roundMmol = (n: number) => Math.round(n * 10) / 10;

function base(v: Record<string, unknown>) {
  if (typeof v.id !== 'string' || !v.id || !isPlausibleDate(v.date)) return null;
  const time = v.time === undefined || v.time === '' ? '' : typeof v.time === 'string' && TIME_RE.test(v.time) ? v.time : null;
  const note = cleanString(v.note ?? '', MAX_READING_NOTE_LENGTH);
  if (time === null || note === null) return null;
  return { id: v.id, date: v.date, time, note };
}

export function parseBpReadings(value: unknown): BpReading[] | null {
  if (!Array.isArray(value)) return null;
  const out: BpReading[] = [];
  for (const v of value) {
    if (!isRecord(v)) continue;
    const b = base(v);
    const pulse = v.pulse ?? null;
    if (
      !b ||
      !isIntInRange(v.systolic, ...BP_INPUT.systolic) ||
      !isIntInRange(v.diastolic, ...BP_INPUT.diastolic) ||
      v.diastolic >= v.systolic ||
      (pulse !== null && !isIntInRange(pulse, ...BP_INPUT.pulse))
    )
      continue;
    out.push({ ...b, systolic: v.systolic, diastolic: v.diastolic, pulse });
  }
  return out.slice(-MAX_READINGS);
}

export function parseGlucoseReadings(value: unknown): GlucoseReading[] | null {
  if (!Array.isArray(value)) return null;
  const out: GlucoseReading[] = [];
  for (const v of value) {
    if (!isRecord(v)) continue;
    const b = base(v);
    const context = GLUCOSE_CONTEXTS.find((c) => c.value === v.context)?.value;
    if (!b || !context || !isFiniteNumber(v.mmol) || !inRange(v.mmol, GLUCOSE_INPUT)) continue;
    out.push({ ...b, context, mmol: roundMmol(v.mmol) });
  }
  return out.slice(-MAX_READINGS);
}

export function parseTargets(value: unknown): MonitoringTargets | null {
  if (!isRecord(value)) return null;
  const sys = value.bpSystolicMax ?? null;
  const dia = value.bpDiastolicMax ?? null;
  if (sys !== null && !isIntInRange(sys, ...BP_INPUT.systolic)) return null;
  if (dia !== null && !isIntInRange(dia, ...BP_INPUT.diastolic)) return null;
  const glucoseMax: MonitoringTargets['glucoseMax'] = {};
  if (value.glucoseMax !== undefined) {
    if (!isRecord(value.glucoseMax)) return null;
    for (const k of ['fasting', '1h', '2h'] as const) {
      const g = value.glucoseMax[k];
      if (g === undefined) continue;
      if (!isFiniteNumber(g) || !inRange(g, GLUCOSE_INPUT)) return null;
      glucoseMax[k] = roundMmol(g);
    }
  }
  return { bpSystolicMax: sys, bpDiastolicMax: dia, glucoseMax };
}

// ---------------------------------------------------------------------------
// Form validation (plausible input only)

const fail = (error: string): ValidationResult => ({ ok: false, error });

export function validateBp(systolic: number | null, diastolic: number | null, pulse: number | null): ValidationResult {
  if (systolic === null || diastolic === null) return fail('Enter both numbers, for example 118 over 76.');
  if (!Number.isInteger(systolic) || !inRange(systolic, BP_INPUT.systolic)) return fail(`The top number should be between ${BP_INPUT.systolic[0]} and ${BP_INPUT.systolic[1]}. Check for a typo.`);
  if (!Number.isInteger(diastolic) || !inRange(diastolic, BP_INPUT.diastolic)) return fail(`The bottom number should be between ${BP_INPUT.diastolic[0]} and ${BP_INPUT.diastolic[1]}. Check for a typo.`);
  if (diastolic >= systolic) return fail('The top number (systolic) should be higher than the bottom number (diastolic).');
  if (pulse !== null && (!Number.isInteger(pulse) || !inRange(pulse, BP_INPUT.pulse))) return fail(`Pulse should be between ${BP_INPUT.pulse[0]} and ${BP_INPUT.pulse[1]}, or left blank.`);
  return { ok: true };
}

export function validateGlucose(mmol: number | null): ValidationResult {
  if (mmol === null) return fail('Enter your reading in mmol/L.');
  if (!inRange(mmol, GLUCOSE_INPUT)) return fail(`Readings should be between ${GLUCOSE_INPUT[0]} and ${GLUCOSE_INPUT[1]} mmol/L. Check for a typo.`);
  return { ok: true };
}

export function validateReadingDate(date: unknown, today: LocalDate): ValidationResult {
  if (!isPlausibleDate(date)) return fail('Please enter a valid date.');
  if (date > today) return fail('The date can’t be in the future.');
  return { ok: true };
}

export const isValidTime = (t: string) => t === '' || TIME_RE.test(t);

// ---------------------------------------------------------------------------
// Comparison with the user's own targets

export function bpAboveTarget(r: BpReading, t: MonitoringTargets): boolean {
  return (t.bpSystolicMax !== null && r.systolic > t.bpSystolicMax) || (t.bpDiastolicMax !== null && r.diastolic > t.bpDiastolicMax);
}

export function glucoseAboveTarget(r: GlucoseReading, t: MonitoringTargets): boolean {
  if (r.context === 'other') return false;
  const max = t.glucoseMax[r.context];
  return max !== undefined && r.mmol > max;
}

/** Newest first by date, then time; for the same date and time, the one added last comes first. */
export function newestFirst<T extends { date: LocalDate; time: string }>(rs: readonly T[]): T[] {
  return rs
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      if (a.r.date !== b.r.date) return a.r.date < b.r.date ? 1 : -1;
      if (a.r.time !== b.r.time) return a.r.time < b.r.time ? 1 : -1;
      return b.i - a.i;
    })
    .map((x) => x.r);
}
