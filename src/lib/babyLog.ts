/**
 * After-birth log: feeds, nappies and sleep. Records what happened; sets no targets and doesn't
 * judge the numbers (same rule as the BP and glucose logs). Pure.
 */
import { isEpochMs, isIntInRange, isRecord } from './validate';

export const MAX_LOG_ENTRIES = 3000;
export const MAX_BOTTLE_ML = 500;
const HOUR = 3_600_000;

export type FeedSide = 'left' | 'right' | 'bottle';
export type NappyKind = 'wet' | 'dirty' | 'both';

export type BabyLogEntry =
  | { id: string; kind: 'feed'; at: number; side: FeedSide; ml: number | null }
  | { id: string; kind: 'nappy'; at: number; nappy: NappyKind }
  /** `end` is null while the baby is asleep. */
  | { id: string; kind: 'sleep'; at: number; end: number | null };

const SIDES: readonly FeedSide[] = ['left', 'right', 'bottle'];
const NAPPIES: readonly NappyKind[] = ['wet', 'dirty', 'both'];

function parseEntry(e: unknown): BabyLogEntry | null {
  if (!isRecord(e) || typeof e.id !== 'string' || !e.id || !isEpochMs(e.at)) return null;
  const base = { id: e.id, at: e.at };
  if (e.kind === 'feed' && SIDES.includes(e.side as FeedSide)) {
    const side = e.side as FeedSide;
    const ml = side === 'bottle' && isIntInRange(e.ml, 1, MAX_BOTTLE_ML) ? e.ml : null;
    return { ...base, kind: 'feed', side, ml };
  }
  if (e.kind === 'nappy' && NAPPIES.includes(e.nappy as NappyKind)) return { ...base, kind: 'nappy', nappy: e.nappy as NappyKind };
  if (e.kind === 'sleep') {
    if (e.end === null || e.end === undefined) return { ...base, kind: 'sleep', end: null };
    if (isEpochMs(e.end) && e.end >= e.at) return { ...base, kind: 'sleep', end: e.end };
  }
  return null;
}

/** Valid entries, newest first, capped. At most one sleep can be open (the newest). */
export function parseBabyLog(value: unknown): BabyLogEntry[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.map(parseEntry).filter((e): e is BabyLogEntry => e !== null);
  out.sort((a, b) => b.at - a.at);
  let openSeen = false;
  const cleaned = out.filter((e) => {
    if (e.kind !== 'sleep' || e.end !== null) return true;
    if (openSeen) return false;
    openSeen = true;
    return true;
  });
  return cleaned.slice(0, MAX_LOG_ENTRIES);
}

export const addEntry = (log: readonly BabyLogEntry[], e: BabyLogEntry): BabyLogEntry[] =>
  [e, ...log].sort((a, b) => b.at - a.at).slice(0, MAX_LOG_ENTRIES);

export const openSleep = (log: readonly BabyLogEntry[]) =>
  log.find((e): e is Extract<BabyLogEntry, { kind: 'sleep' }> => e.kind === 'sleep' && e.end === null) ?? null;

export const endSleep = (log: readonly BabyLogEntry[], now: number): BabyLogEntry[] =>
  log.map((e) => (e.kind === 'sleep' && e.end === null ? { ...e, end: Math.max(now, e.at) } : e));

export const lastOfKind = (log: readonly BabyLogEntry[], kind: BabyLogEntry['kind']) => log.find((e) => e.kind === kind) ?? null;

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
