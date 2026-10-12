/**
 * "Firsts": a keepsake list of baby moments (first smile, first bath) with a date and a note. A memory book,
 * not a development checklist: no ages, no "should by now". Pure.
 */
import { isPlausibleDate, type LocalDate } from './dates';
import { cleanString, isRecord } from './validate';

export const MAX_FIRSTS = 300;
export const MAX_FIRST_TITLE = 60;
export const MAX_FIRST_NOTE = 500;

export interface First {
  id: string;
  date: LocalDate;
  title: string;
  note: string;
}

/** Ideas to tap, in no particular order and with no ages attached. */
export const FIRST_IDEAS: readonly string[] = [
  'First smile',
  'First bath',
  'First laugh',
  'Rolled over',
  'First trip out',
  'First tooth',
  'Sat up',
  'First solid food',
  'First word',
  'Crawled',
  'First steps',
  'First haircut',
];

export function parseFirsts(value: unknown): First[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter(isRecord)
    .map((f) => {
      const title = cleanString(f.title, MAX_FIRST_TITLE);
      if (typeof f.id !== 'string' || !f.id || !title || !isPlausibleDate(f.date)) return null;
      return { id: f.id, date: f.date, title, note: cleanString(f.note, MAX_FIRST_NOTE) ?? '' };
    })
    .filter((f): f is First => f !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, MAX_FIRSTS);
}
