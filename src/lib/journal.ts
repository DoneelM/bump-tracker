/** Symptom & mood journal: entry model, storage parsing and selectors. Pure. */
import { isLocalDate, isPlausibleDate, type LocalDate } from './dates';
import type { ValidationResult } from './pregnancy';
import { cleanString, isIntInRange, isRecord } from './validate';

export const MAX_NOTES_LENGTH = 2000;
export const MAX_JOURNAL_ENTRIES = 1000;

export const MOODS = [
  { value: 1, emoji: '😣', label: 'Very low' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
] as const;

export const SYMPTOMS = [
  'nausea',
  'tiredness',
  'heartburn',
  'back pain',
  'headache',
  'swelling',
  'cramps',
  'constipation',
  'trouble sleeping',
  'mood swings',
  'breathlessness',
  'itching',
  'vision changes',
  'other',
] as const;

export interface JournalEntry {
  id: string;
  date: LocalDate;
  mood: number;
  symptoms: string[];
  notes: string;
  /** "Mention to midwife" */
  flagged: boolean;
}

/** Symptoms that can be pre-eclampsia warning signs, so the entry shows guidance. */
export const hasPreEclampsiaSigns = (symptoms: readonly string[]): boolean =>
  symptoms.some((s) => s === 'headache' || s === 'swelling' || s === 'vision changes');

export function validateJournalDate(date: string, today: LocalDate): ValidationResult {
  if (!isLocalDate(date)) return { ok: false, error: 'Please enter a valid date.' };
  return date > today ? { ok: false, error: 'The date can’t be in the future.' } : { ok: true };
}

function parseEntry(value: unknown): JournalEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || value.id.length > 100) return null;
  if (!isPlausibleDate(value.date) || !isIntInRange(value.mood, 1, 5)) return null;
  const notes = cleanString(value.notes, MAX_NOTES_LENGTH);
  if (notes === null || !Array.isArray(value.symptoms)) return null;
  const symptoms = SYMPTOMS.filter((s) => (value.symptoms as unknown[]).includes(s));
  return { id: value.id, date: value.date, mood: value.mood, symptoms, notes, flagged: value.flagged === true };
}

export function parseJournalEntries(value: unknown): JournalEntry[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(parseEntry).filter((e): e is JournalEntry => e !== null).slice(-MAX_JOURNAL_ENTRIES);
}

/** Newest first (ties keep the later-added entry first). */
export function sortNewestFirst(entries: readonly JournalEntry[]): JournalEntry[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.date === b.e.date ? b.i - a.i : a.e.date < b.e.date ? 1 : -1))
    .map(({ e }) => e);
}

/** Entries marked "Mention to midwife", newest first. Used by the journal filter and the print summary. */
export const flaggedEntries = (entries: readonly JournalEntry[]): JournalEntry[] =>
  sortNewestFirst(entries.filter((e) => e.flagged));
