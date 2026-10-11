/** Questions to ask the midwife/LMC at the next appointment. Pure. */
import { isPlausibleDate, type LocalDate } from './dates';
import { cleanString, isRecord } from './validate';

export const MAX_QUESTION_LENGTH = 300;
export const MAX_QUESTIONS = 200;

export interface Question {
  id: string;
  text: string;
  /** Date it was asked, or null while still open. */
  askedOn: LocalDate | null;
}

export function parseQuestions(value: unknown): Question[] | null {
  if (!Array.isArray(value)) return null;
  const out: Question[] = [];
  for (const q of value) {
    if (out.length >= MAX_QUESTIONS) break;
    if (!isRecord(q) || typeof q.id !== 'string' || !q.id) continue;
    const text = cleanString(q.text, MAX_QUESTION_LENGTH);
    if (!text) continue;
    const askedOn = isPlausibleDate(q.askedOn) ? q.askedOn : null;
    out.push({ id: q.id, text, askedOn });
  }
  return out;
}

export const openQuestions = (qs: readonly Question[]) => qs.filter((q) => q.askedOn === null);
export const askedQuestions = (qs: readonly Question[]) =>
  qs.filter((q) => q.askedOn !== null).sort((a, b) => (a.askedOn! < b.askedOn! ? 1 : a.askedOn! > b.askedOn! ? -1 : 0));
