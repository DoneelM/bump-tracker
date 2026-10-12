/**
 * After-birth log: feeds, nappies, sleep, pumping, solids, medicine, temperature, activities and growth.
 * Records what happened; sets no targets and doesn't judge the numbers (same rule as the BP and glucose logs).
 *
 * Timers (breast feed, sleep, pumping, activities) are entries with `end: null`, so they keep running when the
 * app is closed. At most one can be open per kind. A breast feed also keeps the time on each side: `leftMs`
 * and `rightMs` hold finished stretches, and `sideSince` is when the current side started (null when paused).
 * Pure.
 */
import { cleanString, isEpochMs, isIntInRange, isNumberInRange, isRecord } from './validate';

export const MAX_LOG_ENTRIES = 10_000;
export const MAX_BOTTLE_ML = 500;
export const MAX_PUMP_ML = 500;
export const MAX_NOTE = 500;
export const MAX_TEXT = 80;
export const MAX_BY = 40;
export const TEMP_MIN = 30;
export const TEMP_MAX = 45;
const HOUR = 3_600_000;

export type FeedSide = 'left' | 'right' | 'bottle';
export type BottleType = 'formula' | 'breast-milk' | 'mixed';
export type NappyKind = 'wet' | 'dirty' | 'both' | 'dry';
export type SolidsAmount = 'none' | 'some' | 'most';
export type ActivityKind = 'tummy' | 'bath' | 'story' | 'skin' | 'outdoor';

interface Base {
  id: string;
  at: number;
  note?: string;
  /** Who logged it: the caregiver name set on that device. */
  by?: string;
}

export type FeedEntry = Base & {
  kind: 'feed';
  side: FeedSide;
  ml: number | null;
  bottle?: BottleType;
  /** Breast feeds with the timer: null while running. Missing on one-tap feeds. */
  end?: number | null;
  leftMs?: number;
  rightMs?: number;
  sideSince?: number | null;
};
export type NappyEntry = Base & { kind: 'nappy'; nappy: NappyKind };
/** `end` is null while the baby is asleep. */
export type SleepEntry = Base & { kind: 'sleep'; end: number | null };
export type PumpEntry = Base & { kind: 'pump'; end?: number | null; leftMl: number | null; rightMl: number | null };
export type SolidsEntry = Base & { kind: 'solids'; food: string; amount: SolidsAmount | null };
export type MedicineEntry = Base & { kind: 'medicine'; name: string; dose: string };
export type TempEntry = Base & { kind: 'temp'; celsius: number };
export type ActivityEntry = Base & { kind: 'activity'; activity: ActivityKind; end?: number | null };
export type GrowthEntry = Base & { kind: 'growth'; weightG: number | null; lengthCm: number | null; headCm: number | null };

export type BabyLogEntry =
  | FeedEntry
  | NappyEntry
  | SleepEntry
  | PumpEntry
  | SolidsEntry
  | MedicineEntry
  | TempEntry
  | ActivityEntry
  | GrowthEntry;
export type EntryKind = BabyLogEntry['kind'];
export type TimedKind = 'feed' | 'sleep' | 'pump' | 'activity';

export const ENTRY_KINDS: readonly EntryKind[] = ['feed', 'nappy', 'sleep', 'pump', 'solids', 'medicine', 'temp', 'activity', 'growth'];
export const SIDES: readonly FeedSide[] = ['left', 'right', 'bottle'];
export const BOTTLE_TYPES: readonly BottleType[] = ['formula', 'breast-milk', 'mixed'];
export const NAPPIES: readonly NappyKind[] = ['wet', 'dirty', 'both', 'dry'];
export const SOLIDS_AMOUNTS: readonly SolidsAmount[] = ['none', 'some', 'most'];
export const ACTIVITIES: readonly ActivityKind[] = ['tummy', 'bath', 'story', 'skin', 'outdoor'];

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => list.includes(v as T);
const ml = (v: unknown, max: number) => (isIntInRange(v, 1, max) ? v : null);
/** An end time: null (running), a time at or after `at`, or undefined for a bad or missing value. */
const endOf = (v: unknown, at: number): number | null | undefined => (v === null ? null : isEpochMs(v) && v >= at ? v : undefined);
const text = (v: unknown, max: number) => cleanString(v, max) ?? '';

function parseEntry(e: unknown): BabyLogEntry | null {
  if (!isRecord(e) || typeof e.id !== 'string' || !e.id || !isEpochMs(e.at)) return null;
  const at = e.at;
  const base: Base = { id: e.id, at };
  const note = cleanString(e.note, MAX_NOTE);
  if (note) base.note = note;
  const by = cleanString(e.by, MAX_BY);
  if (by) base.by = by;

  switch (e.kind) {
    case 'feed': {
      if (!oneOf(SIDES, e.side)) return null;
      const f: FeedEntry = { ...base, kind: 'feed', side: e.side, ml: e.side === 'bottle' ? ml(e.ml, MAX_BOTTLE_ML) : null };
      if (e.side === 'bottle') {
        if (oneOf(BOTTLE_TYPES, e.bottle)) f.bottle = e.bottle;
        return f;
      }
      const end = endOf(e.end, at);
      if (end === undefined) return f; // A one-tap breast feed (or a damaged timer, kept as a feed at its start).
      f.end = end;
      f.leftMs = isIntInRange(e.leftMs, 0, 24 * HOUR) ? e.leftMs : 0;
      f.rightMs = isIntInRange(e.rightMs, 0, 24 * HOUR) ? e.rightMs : 0;
      f.sideSince = end === null && isEpochMs(e.sideSince) && e.sideSince >= at ? e.sideSince : null;
      return f;
    }
    case 'nappy':
      return oneOf(NAPPIES, e.nappy) ? { ...base, kind: 'nappy', nappy: e.nappy } : null;
    case 'sleep': {
      const end = e.end === undefined ? null : endOf(e.end, at);
      return end === undefined ? null : { ...base, kind: 'sleep', end };
    }
    case 'pump': {
      const p: PumpEntry = { ...base, kind: 'pump', leftMl: ml(e.leftMl, MAX_PUMP_ML), rightMl: ml(e.rightMl, MAX_PUMP_ML) };
      const end = endOf(e.end, at);
      if (end !== undefined) p.end = end;
      return p;
    }
    case 'solids': {
      const food = text(e.food, MAX_TEXT);
      return food ? { ...base, kind: 'solids', food, amount: oneOf(SOLIDS_AMOUNTS, e.amount) ? e.amount : null } : null;
    }
    case 'medicine': {
      const name = text(e.name, MAX_TEXT);
      return name ? { ...base, kind: 'medicine', name, dose: text(e.dose, MAX_TEXT) } : null;
    }
    case 'temp':
      return isNumberInRange(e.celsius, TEMP_MIN, TEMP_MAX) ? { ...base, kind: 'temp', celsius: Math.round(e.celsius * 10) / 10 } : null;
    case 'activity': {
      if (!oneOf(ACTIVITIES, e.activity)) return null;
      const a: ActivityEntry = { ...base, kind: 'activity', activity: e.activity };
      const end = endOf(e.end, at);
      if (end !== undefined) a.end = end;
      return a;
    }
    case 'growth': {
      const g: GrowthEntry = {
        ...base,
        kind: 'growth',
        weightG: isIntInRange(e.weightG, 300, 30_000) ? e.weightG : null,
        lengthCm: isNumberInRange(e.lengthCm, 20, 130) ? e.lengthCm : null,
        headCm: isNumberInRange(e.headCm, 20, 60) ? e.headCm : null,
      };
      return g.weightG === null && g.lengthCm === null && g.headCm === null ? null : g;
    }
    default:
      return null;
  }
}

export const isOpen = (e: BabyLogEntry): boolean => 'end' in e && e.end === null;

/** Valid entries, newest first, capped. At most one open timer per kind (the newest). */
export function parseBabyLog(value: unknown): BabyLogEntry[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.map(parseEntry).filter((e): e is BabyLogEntry => e !== null);
  out.sort((a, b) => b.at - a.at);
  const openSeen = new Set<EntryKind>();
  const cleaned = out.filter((e) => {
    if (!isOpen(e)) return true;
    if (openSeen.has(e.kind)) return false;
    openSeen.add(e.kind);
    return true;
  });
  return cleaned.slice(0, MAX_LOG_ENTRIES);
}

const byTime = (log: BabyLogEntry[]) => log.sort((a, b) => b.at - a.at).slice(0, MAX_LOG_ENTRIES);

export const addEntry = (log: readonly BabyLogEntry[], e: BabyLogEntry): BabyLogEntry[] => byTime([e, ...log]);

/** Replaces the entry with the same id (an edit), keeping time order. */
export const replaceEntry = (log: readonly BabyLogEntry[], e: BabyLogEntry): BabyLogEntry[] =>
  byTime(log.map((x) => (x.id === e.id ? e : x)));

export const removeEntry = (log: readonly BabyLogEntry[], id: string): BabyLogEntry[] => log.filter((x) => x.id !== id);

export function openOf<K extends TimedKind>(log: readonly BabyLogEntry[], kind: K): Extract<BabyLogEntry, { kind: K }> | null {
  return (log.find((e) => e.kind === kind && isOpen(e)) as Extract<BabyLogEntry, { kind: K }> | undefined) ?? null;
}

export const openSleep = (log: readonly BabyLogEntry[]) => openOf(log, 'sleep');

export const endSleep = (log: readonly BabyLogEntry[], now: number): BabyLogEntry[] =>
  log.map((e) => (e.kind === 'sleep' && e.end === null ? { ...e, end: Math.max(now, e.at) } : e));

/** Stops an open timer of this kind (pump, activity, sleep). Breast feeds use `stopBreast`. */
export const stopTimer = (log: readonly BabyLogEntry[], kind: Exclude<TimedKind, 'feed'>, now: number): BabyLogEntry[] =>
  log.map((e) => (e.kind === kind && isOpen(e) ? { ...e, end: Math.max(now, e.at) } : e));

// Breast feed timer.

export const startBreast = (id: string, side: 'left' | 'right', now: number, by?: string): FeedEntry => ({
  id,
  kind: 'feed',
  at: now,
  side,
  ml: null,
  end: null,
  leftMs: 0,
  rightMs: 0,
  sideSince: now,
  ...(by ? { by } : {}),
});

/** Adds the running stretch to the current side's total. */
function bank(f: FeedEntry, now: number): FeedEntry {
  if (f.sideSince == null) return f;
  const run = Math.max(0, now - f.sideSince);
  return f.side === 'left' ? { ...f, leftMs: (f.leftMs ?? 0) + run, sideSince: null } : { ...f, rightMs: (f.rightMs ?? 0) + run, sideSince: null };
}

export const switchSide = (f: FeedEntry, now: number): FeedEntry => ({ ...bank(f, now), side: f.side === 'left' ? 'right' : 'left', sideSince: now });
export const pauseBreast = (f: FeedEntry, now: number): FeedEntry => bank(f, now);
export const resumeBreast = (f: FeedEntry, now: number): FeedEntry => (f.sideSince == null ? { ...f, sideSince: now } : f);
export const stopBreast = (f: FeedEntry, now: number): FeedEntry => ({ ...bank(f, now), end: Math.max(now, f.at) });

/** Time on each side so far, counting the running stretch. */
export function sideTimes(f: FeedEntry, now: number): { leftMs: number; rightMs: number } {
  const run = f.sideSince != null ? Math.max(0, now - f.sideSince) : 0;
  return { leftMs: (f.leftMs ?? 0) + (f.side === 'left' ? run : 0), rightMs: (f.rightMs ?? 0) + (f.side === 'right' ? run : 0) };
}

export const lastOfKind = (log: readonly BabyLogEntry[], kind: EntryKind) => log.find((e) => e.kind === kind) ?? null;

/** Counts and sleep time over the last 24 hours (sleep overlapping the window is clipped to it). */
export function last24h(log: readonly BabyLogEntry[], now: number) {
  const from = now - 24 * HOUR;
  let feeds = 0;
  let nappies = 0;
  let sleepMs = 0;
  for (const e of log) {
    if (e.kind === 'feed' && e.at >= from) feeds++;
    else if (e.kind === 'nappy' && e.at >= from) nappies++;
    else if (e.kind === 'sleep') {
      const end = e.end ?? now;
      sleepMs += Math.max(0, Math.min(end, now) - Math.max(e.at, from));
    }
  }
  return { feeds, nappies, sleepMinutes: Math.round(sleepMs / 60_000) };
}

/** "12 min", "2 h 5 min": for "ago" lines and sleep totals. */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

/** "4:07" for a running timer. */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
}
