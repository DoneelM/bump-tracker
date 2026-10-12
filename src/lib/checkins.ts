/**
 * Weekly "How are you going?" check-in for the parent after the birth. No scores, no trends: it only
 * decides whether to show support lines straight away. Pure.
 */
import { diffDays, isPlausibleDate, type LocalDate } from './dates';
import { isRecord } from './validate';

export const FEELINGS = ['good', 'mixed', 'hard'] as const;
export type Feeling = (typeof FEELINGS)[number];
export const FEELING_LABEL: Record<Feeling, string> = { good: 'Going OK', mixed: 'Up and down', hard: 'Struggling' };
export const MAX_CHECKINS = 200;

export interface CheckIn {
  date: LocalDate;
  feeling: Feeling;
}

export function parseCheckIns(value: unknown): CheckIn[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter((c): c is CheckIn => isRecord(c) && isPlausibleDate(c.date) && FEELINGS.includes(c.feeling as Feeling))
    .map((c) => ({ date: c.date, feeling: c.feeling }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-MAX_CHECKINS);
}

/** This week's answer (within the last 7 days), if any. */
export function recentCheckIn(list: readonly CheckIn[], today: LocalDate): CheckIn | null {
  const last = list.at(-1);
  return last && diffDays(last.date, today) >= 0 && diffDays(last.date, today) < 7 ? last : null;
}

/** Records today's answer, replacing one already given today. */
export function answer(list: readonly CheckIn[], today: LocalDate, feeling: Feeling): CheckIn[] {
  return [...list.filter((c) => c.date !== today), { date: today, feeling }].slice(-MAX_CHECKINS);
}
