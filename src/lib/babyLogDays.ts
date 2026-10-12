/**
 * Baby log by calendar day: which entries fall on a day, daily totals for the trends page and print summary,
 * and a CSV export. Days are local calendar days (DST-safe: bounds come from the Date constructor, not by
 * adding 24 hours). Totals are counts and sums only; no targets, no judging. Pure.
 */
import { addDays, todayLocal, type LocalDate } from './dates';
import { isOpen, type BabyLogEntry } from './babyLog';

export const dayOf = (ms: number): LocalDate => todayLocal(new Date(ms));

/** [start, end) of a local calendar day in epoch ms. */
export function dayBounds(day: LocalDate): [number, number] {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return [new Date(y, m - 1, d).getTime(), new Date(y, m - 1, d + 1).getTime()];
}

const overlap = (a: number, b: number, from: number, to: number) => Math.max(0, Math.min(b, to) - Math.max(a, from));

/** Entries that start on `day`, plus a sleep that runs into it from the night before. Newest first. */
export function entriesOn(log: readonly BabyLogEntry[], day: LocalDate, now: number): BabyLogEntry[] {
  const [from, to] = dayBounds(day);
  return log.filter((e) => (e.at >= from && e.at < to) || (e.kind === 'sleep' && e.at < from && (e.end ?? now) > from));
}

export interface DayTotals {
  day: LocalDate;
  feeds: number;
  bottleMl: number;
  nappies: number;
  wet: number;
  dirty: number;
  sleepMinutes: number;
  pumpMl: number;
}

export function dayTotals(log: readonly BabyLogEntry[], day: LocalDate, now: number): DayTotals {
  const [from, to] = dayBounds(day);
  const t: DayTotals = { day, feeds: 0, bottleMl: 0, nappies: 0, wet: 0, dirty: 0, sleepMinutes: 0, pumpMl: 0 };
  let sleepMs = 0;
  for (const e of log) {
    if (e.kind === 'sleep') {
      sleepMs += overlap(e.at, e.end ?? now, from, Math.min(to, now));
      continue;
    }
    if (e.at < from || e.at >= to) continue;
    if (e.kind === 'feed') {
      t.feeds++;
      t.bottleMl += e.ml ?? 0;
    } else if (e.kind === 'nappy') {
      t.nappies++;
      if (e.nappy === 'wet' || e.nappy === 'both') t.wet++;
      if (e.nappy === 'dirty' || e.nappy === 'both') t.dirty++;
    } else if (e.kind === 'pump') t.pumpMl += (e.leftMl ?? 0) + (e.rightMl ?? 0);
  }
  t.sleepMinutes = Math.round(sleepMs / 60_000);
  return t;
}

/** The last `n` days up to and including `today`, oldest first. */
export const lastDays = (today: LocalDate, n: number): LocalDate[] => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));

/** Average per day, over days that have anything logged (an empty day usually means nobody logged). */
export function averages(totals: readonly DayTotals[]) {
  const logged = totals.filter((t) => t.feeds || t.nappies || t.sleepMinutes);
  const avg = (f: (t: DayTotals) => number) => (logged.length ? logged.reduce((s, t) => s + f(t), 0) / logged.length : null);
  return { days: logged.length, feeds: avg((t) => t.feeds), nappies: avg((t) => t.nappies), sleepMinutes: avg((t) => t.sleepMinutes) };
}

const CSV_HEAD = ['Date', 'Time', 'Type', 'Details', 'Ended', 'Minutes', 'Note', 'Logged by'];

function details(e: BabyLogEntry): string {
  switch (e.kind) {
    case 'feed':
      if (e.side === 'bottle') return ['bottle', e.ml && `${e.ml} ml`, e.bottle].filter(Boolean).join(', ');
      return e.end === undefined ? e.side : `left ${Math.round((e.leftMs ?? 0) / 60_000)} min, right ${Math.round((e.rightMs ?? 0) / 60_000)} min`;
    case 'nappy':
      return e.nappy;
    case 'sleep':
      return '';
    case 'pump':
      return [e.leftMl && `left ${e.leftMl} ml`, e.rightMl && `right ${e.rightMl} ml`].filter(Boolean).join(', ');
    case 'solids':
      return [e.food, e.amount && `ate ${e.amount}`].filter(Boolean).join(', ');
    case 'medicine':
      return [e.name, e.dose].filter(Boolean).join(', ');
    case 'temp':
      return `${e.celsius} °C`;
    case 'activity':
      return e.activity;
    case 'growth':
      return [e.weightG !== null && `${e.weightG} g`, e.lengthCm !== null && `${e.lengthCm} cm long`, e.headCm !== null && `head ${e.headCm} cm`]
        .filter(Boolean)
        .join(', ');
  }
}

/** Quotes a cell; a leading = + - @ is prefixed so spreadsheet apps don't run it as a formula. */
function cell(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** The whole log as CSV, oldest first, for a spreadsheet or the GP. Running timers have no end yet. */
export function toCsv(log: readonly BabyLogEntry[]): string {
  const rows = [...log]
    .sort((a, b) => a.at - b.at)
    .map((e) => {
      const end = 'end' in e && typeof e.end === 'number' ? e.end : null;
      return [
        dayOf(e.at),
        hhmm(e.at),
        e.kind,
        details(e),
        end === null ? (isOpen(e) ? 'running' : '') : `${dayOf(end)} ${hhmm(end)}`,
        end === null ? '' : String(Math.round((end - e.at) / 60_000)),
        e.note ?? '',
        e.by ?? '',
      ];
    });
  return [CSV_HEAD, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
