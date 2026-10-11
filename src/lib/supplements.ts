/** Daily supplement tick-off. Records which days each supplement was taken; sets no targets. Pure. */
import { addDays, isPlausibleDate, type LocalDate } from './dates';
import { isTimeOfDay } from './ics';
import { cleanString, isRecord } from './validate';

export const MAX_SUPPLEMENT_NAME = 40;
export const MAX_SUPPLEMENTS = 12;
/** Days kept per supplement; older ticks drop off. */
export const MAX_DAYS_KEPT = 400;

export const BUILT_IN_IDS = ['folic-acid', 'iodine'] as const;

export interface Supplement {
  id: string;
  name: string;
  builtIn: boolean;
}

export interface SupplementState {
  list: Supplement[];
  /** Supplement id to the days it was taken, oldest first. */
  taken: Record<string, LocalDate[]>;
  /** "HH:MM" for the calendar reminder. */
  reminderTime: string;
}

export const DEFAULT_SUPPLEMENTS: SupplementState = {
  list: [
    { id: 'folic-acid', name: 'Folic acid', builtIn: true },
    { id: 'iodine', name: 'Iodine', builtIn: true },
  ],
  taken: {},
  reminderTime: '08:00',
};

export function parseSupplements(value: unknown): SupplementState | null {
  if (!isRecord(value) || !Array.isArray(value.list) || !isRecord(value.taken)) return null;
  const list: Supplement[] = [];
  const seen = new Set<string>();
  for (const s of value.list) {
    if (list.length >= MAX_SUPPLEMENTS) break;
    if (!isRecord(s) || typeof s.id !== 'string' || !s.id || seen.has(s.id)) continue;
    const name = cleanString(s.name, MAX_SUPPLEMENT_NAME);
    if (!name) continue;
    seen.add(s.id);
    list.push({ id: s.id, name, builtIn: (BUILT_IN_IDS as readonly string[]).includes(s.id) });
  }
  const taken: Record<string, LocalDate[]> = {};
  for (const s of list) {
    const raw = value.taken[s.id];
    if (!Array.isArray(raw)) continue;
    const days = [...new Set(raw.filter(isPlausibleDate))].sort().slice(-MAX_DAYS_KEPT);
    if (days.length) taken[s.id] = days;
  }
  const reminderTime = isTimeOfDay(value.reminderTime) ? value.reminderTime : DEFAULT_SUPPLEMENTS.reminderTime;
  return { list, taken, reminderTime };
}

export const isTaken = (state: SupplementState, id: string, day: LocalDate): boolean =>
  state.taken[id]?.includes(day) ?? false;

export function toggleTaken(state: SupplementState, id: string, day: LocalDate): SupplementState {
  const days = state.taken[id] ?? [];
  const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort().slice(-MAX_DAYS_KEPT);
  return { ...state, taken: { ...state.taken, [id]: next } };
}

/** The last `n` days ending today, oldest first. */
export const lastDays = (today: LocalDate, n: number): LocalDate[] =>
  Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));

export function addSupplement(state: SupplementState, id: string, name: string): SupplementState {
  return { ...state, list: [...state.list, { id, name, builtIn: false }] };
}

/** Removing keeps nothing behind: its ticks go too. */
export function removeSupplement(state: SupplementState, id: string): SupplementState {
  const { [id]: _gone, ...taken } = state.taken;
  return { ...state, list: state.list.filter((s) => s.id !== id), taken };
}

/** Same name already listed, ignoring case. */
export const hasSupplement = (state: SupplementState, name: string): boolean =>
  state.list.some((s) => s.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase());
