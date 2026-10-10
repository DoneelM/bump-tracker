/** Scan & appointment log: data model, validation and storage parsing. Pure. */
import { addDays, diffDays, isLocalDate, isPlausibleDate, type LocalDate } from './dates';
import type { ValidationResult } from './pregnancy';
import { cleanString, isNumberInRange, isRecord, parseNumberInput } from './validate';

export const SCAN_TYPES = [
  { value: 'dating', label: 'Dating scan' },
  { value: 'nuchal', label: 'Nuchal / 12-week scan' },
  { value: 'anatomy', label: 'Anatomy / 20-week scan' },
  { value: 'growth', label: 'Growth scan' },
  { value: 'midwife', label: 'Midwife/LMC appointment' },
  { value: 'other', label: 'Other' },
] as const;

export type ScanType = (typeof SCAN_TYPES)[number]['value'];

export const scanTypeLabel = (t: ScanType): string => SCAN_TYPES.find((s) => s.value === t)?.label ?? 'Other';

export const MAX_SCAN_NOTES_LENGTH = 1000;
export const MAX_SCAN_ENTRIES = 1000;
/** Appointments can be booked ahead, up to this long after the due date. */
export const MAX_DAYS_AFTER_DUE = 6 * 7;

/** Optional measurements and their plausible ranges (EFW in grams, the rest in mm). */
export const MEASUREMENTS = [
  { key: 'efwG', label: 'Estimated fetal weight', unit: 'g', min: 10, max: 6000 },
  { key: 'bpdMm', label: 'BPD (head width)', unit: 'mm', min: 10, max: 120 },
  { key: 'hcMm', label: 'HC (head circumference)', unit: 'mm', min: 30, max: 400 },
  { key: 'acMm', label: 'AC (abdominal circumference)', unit: 'mm', min: 30, max: 420 },
  { key: 'flMm', label: 'FL (femur length)', unit: 'mm', min: 5, max: 90 },
] as const;

export type MeasurementKey = (typeof MEASUREMENTS)[number]['key'];

export interface ScanEntry {
  id: string;
  date: LocalDate;
  type: ScanType;
  notes: string;
  efwG: number | null;
  bpdMm: number | null;
  hcMm: number | null;
  acMm: number | null;
  flMm: number | null;
}

export function validateScanNotes(notes: string): ValidationResult {
  return notes.trim().length > MAX_SCAN_NOTES_LENGTH
    ? { ok: false, error: `Please keep notes to ${MAX_SCAN_NOTES_LENGTH} characters or fewer.` }
    : { ok: true };
}

/** Latest date a scan or appointment can be logged (due date + 6 weeks). */
export const latestScanDate = (dueDate: LocalDate): LocalDate => addDays(dueDate, MAX_DAYS_AFTER_DUE);

/** Scans may be in the future (upcoming appointments), but not before the LMP or long after the due date. */
export function validateScanDate(date: unknown, lmp: LocalDate, dueDate: LocalDate): ValidationResult {
  if (date === '' || date == null) return { ok: false, error: 'Please enter a date.' };
  if (!isLocalDate(date)) return { ok: false, error: 'Please enter a valid date.' };
  if (diffDays(lmp, date) < 0) return { ok: false, error: 'The date can’t be before the start of your pregnancy.' };
  if (date > latestScanDate(dueDate)) return { ok: false, error: 'The date is too far after your due date.' };
  return { ok: true };
}

/** Measurements come from a scan that has already happened. */
export function validateMeasurementsDate(date: LocalDate, today: LocalDate, hasMeasurements: boolean): ValidationResult {
  return hasMeasurements && date > today
    ? { ok: false, error: 'Measurements can only be added once the scan has happened. Clear them, or change the date.' }
    : { ok: true };
}

/** Parses an optional measurement field: blank is fine (null); otherwise must be in range. */
export function parseMeasurement(
  raw: string,
  m: (typeof MEASUREMENTS)[number],
): { value: number | null; error?: string } {
  const p = parseNumberInput(raw);
  if (p.error || p.value === null) return p;
  if (!isNumberInRange(p.value, m.min, m.max)) {
    return { value: null, error: `Should be between ${m.min} and ${m.max} ${m.unit}.` };
  }
  return p;
}

const isScanType = (v: unknown): v is ScanType => SCAN_TYPES.some((s) => s.value === v);

function parseScanEntry(value: unknown): ScanEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || value.id.length > 100) return null;
  if (!isPlausibleDate(value.date) || !isScanType(value.type)) return null;
  const notes = cleanString(value.notes ?? '', MAX_SCAN_NOTES_LENGTH);
  if (notes === null) return null;
  const entry: ScanEntry = { id: value.id, date: value.date, type: value.type, notes, efwG: null, bpdMm: null, hcMm: null, acMm: null, flMm: null };
  for (const m of MEASUREMENTS) {
    const v = value[m.key];
    if (v == null) continue;
    if (!isNumberInRange(v, m.min, m.max)) return null;
    entry[m.key] = v;
  }
  return entry;
}

export function parseScanEntries(value: unknown): ScanEntry[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(parseScanEntry).filter((e): e is ScanEntry => e !== null).slice(-MAX_SCAN_ENTRIES);
}

/** Earliest entry dated today or later, or null. */
export function nextAppointment(entries: readonly ScanEntry[], today: LocalDate): ScanEntry | null {
  let next: ScanEntry | null = null;
  for (const e of entries) if (e.date >= today && (next === null || e.date < next.date)) next = e;
  return next;
}
