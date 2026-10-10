/** Contraction timer: durations, intervals, averages and the 5-1-1 pattern. Pure. */
import { isEpochMs, isFiniteNumber, isRecord } from './validate';

export interface Contraction {
  /** Epoch ms. */
  start: number;
  end: number;
}

export interface ContractionState {
  contractions: Contraction[];
  /** Start (epoch ms) of a contraction in progress, or null. */
  activeStart: number | null;
}

const SEC = 1000;
const MIN = 60 * SEC;

export const MAX_CONTRACTION_MS = 10 * MIN;
export const SUMMARY_WINDOW_MS = 60 * MIN;
export const PATTERN_WINDOW_MS = 60 * MIN;
export const PATTERN_MAX_AVG_INTERVAL_MS = 5.5 * MIN;
export const PATTERN_MAX_GAP_MS = 7 * MIN;
export const PATTERN_MIN_AVG_DURATION_MS = 45 * SEC;
export const PATTERN_MIN_DURATION_MS = 40 * SEC;
/** Contractions kept in storage (oldest dropped). */
export const MAX_STORED_CONTRACTIONS = 500;

export const EMPTY_STATE: ContractionState = { contractions: [], activeStart: null };

export const isValidContraction = (c: Contraction): boolean =>
  isFiniteNumber(c.start) && isFiniteNumber(c.end) && c.end > c.start && c.end - c.start <= MAX_CONTRACTION_MS;

export const durationMs = (c: Contraction): number => c.end - c.start;

/** Valid contractions, oldest first. */
export function validSorted(list: readonly Contraction[]): Contraction[] {
  return list.filter(isValidContraction).sort((a, b) => a.start - b.start);
}

/** Start-to-start gap from the previous valid contraction (null for the first). */
export function intervalsMs(list: readonly Contraction[]): (number | null)[] {
  const s = validSorted(list);
  return s.map((c, i) => (i === 0 ? null : c.start - s[i - 1]!.start));
}

const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface Averages {
  count: number;
  avgDurationMs: number | null;
  avgIntervalMs: number | null;
}

/** Averages over valid contractions starting within the hour up to `now`. */
export function averagesLastHour(list: readonly Contraction[], now: number): Averages {
  const inWindow = validSorted(list).filter((c) => c.start >= now - SUMMARY_WINDOW_MS && c.start <= now);
  const gaps: number[] = [];
  for (let i = 1; i < inWindow.length; i++) gaps.push(inWindow[i]!.start - inWindow[i - 1]!.start);
  return { count: inWindow.length, avgDurationMs: avg(inWindow.map(durationMs)), avgIntervalMs: avg(gaps) };
}

/**
 * 5-1-1: walking back from the latest contraction with no gap over 7 minutes, the run
 * spans at least an hour; its contractions average <= 5.5 min apart, average >= 45 s
 * long, and most are >= 40 s. With `now`, the latest contraction must also have started
 * within the last 7 minutes, so a finished session stops alerting.
 */
export function detect511(list: readonly Contraction[], now?: number): boolean {
  const s = validSorted(list);
  if (s.length < 2) return false;
  const latest = s[s.length - 1]!;
  if (now !== undefined && now - latest.start > PATTERN_MAX_GAP_MS) return false;
  const run: Contraction[] = [latest];
  for (let i = s.length - 2; i >= 0; i--) {
    if (run[0]!.start - s[i]!.start > PATTERN_MAX_GAP_MS) return false;
    run.unshift(s[i]!);
    if (latest.start - s[i]!.start >= PATTERN_WINDOW_MS) break;
  }
  const span = latest.start - run[0]!.start;
  if (span < PATTERN_WINDOW_MS) return false;
  const durations = run.map(durationMs);
  return (
    span / (run.length - 1) <= PATTERN_MAX_AVG_INTERVAL_MS &&
    avg(durations)! >= PATTERN_MIN_AVG_DURATION_MS &&
    durations.filter((d) => d >= PATTERN_MIN_DURATION_MS).length > durations.length / 2
  );
}

/** True while a contraction is being timed or the last one ended within the 7-minute gap (old sessions are not live). */
export function isSessionLive(state: ContractionState, now: number): boolean {
  const last = validSorted(state.contractions).at(-1);
  return state.activeStart !== null || (last !== undefined && now - last.end < PATTERN_MAX_GAP_MS);
}

/** Time since the last contraction: mm:ss while the session is live, else a fixed "over 7 min" (the clock no longer ticks). */
export function formatSinceLast(ms: number, live: boolean): string {
  return live ? formatMmSs(ms) : `over ${PATTERN_MAX_GAP_MS / 60_000} min`;
}

/** mm:ss (minutes may exceed 59). Null, negative or invalid input shows 00:00. */
export function formatMmSs(ms: number | null): string {
  if (ms === null || !isFiniteNumber(ms) || ms < 0) return '00:00';
  const total = Math.round(ms / SEC);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function parseContractionState(value: unknown): ContractionState | null {
  if (!isRecord(value) || !Array.isArray(value.contractions)) return null;
  const contractions = value.contractions
    .filter(isRecord)
    .map((c) => ({ start: c.start as number, end: c.end as number }))
    .filter((c) => isEpochMs(c.start) && isEpochMs(c.end) && isValidContraction(c))
    .slice(-MAX_STORED_CONTRACTIONS);
  const a = value.activeStart;
  return { contractions, activeStart: isEpochMs(a) ? a : null };
}
