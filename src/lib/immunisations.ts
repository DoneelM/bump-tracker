/** Due dates and "done" records for the baby's immunisation visits. Pure. */
import type { ImmunisationVisit } from '../data/immunisations';
import { addDays, addMonths, isPlausibleDate, type LocalDate } from './dates';
import { isRecord } from './validate';

/** Visit id to the date it was done. */
export type ImmunisationsDone = Record<string, LocalDate>;

export const dueDate = (born: LocalDate, v: ImmunisationVisit): LocalDate =>
  'weeks' in v.after ? addDays(born, v.after.weeks * 7) : addMonths(born, v.after.months);

export function parseImmunisationsDone(value: unknown): ImmunisationsDone | null {
  if (!isRecord(value)) return null;
  const out: ImmunisationsDone = {};
  for (const [k, d] of Object.entries(value)) if (/^[a-z0-9]{1,8}$/.test(k) && isPlausibleDate(d)) out[k] = d;
  return out;
}

/** The first visit not yet marked done, with its due date. */
export function nextVisit(visits: readonly ImmunisationVisit[], born: LocalDate, done: ImmunisationsDone) {
  const v = visits.find((x) => !done[x.id]);
  return v ? { visit: v, due: dueDate(born, v) } : null;
}
