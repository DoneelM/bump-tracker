/** Baby movement log: session model, formatting and storage parsing. Pure. A personal log, not a safety tool. */
import { isEpochMs, isRecord } from './validate';

export interface KickSession {
  id: string;
  /** Epoch ms. */
  start: number;
  end?: number;
  count: number;
  events: number[];
}

export const MAX_EVENTS_PER_SESSION = 500;
export const MAX_STORED_SESSIONS = 200;
/** Gestational week from which the counter is available without an override. */
export const KICKS_UNLOCK_WEEK = 28;

export const addMovement = (s: KickSession, at: number): KickSession =>
  s.count >= MAX_EVENTS_PER_SESSION ? s : { ...s, count: s.count + 1, events: [...s.events, at] };

export const endSession = (s: KickSession, at: number): KickSession => ({ ...s, end: Math.max(at, s.start) });

/** Elapsed ms; for an open session pass `now`. */
export const sessionDurationMs = (s: KickSession, now: number): number => Math.max(0, (s.end ?? now) - s.start);

/** "12 min 05 s" / "1 h 02 min"; under a minute shows seconds only. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
  if (m > 0) return `${m} min ${String(s).padStart(2, '0')} s`;
  return `${s} s`;
}

function parseSession(value: unknown): KickSession | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || value.id.length > 100) return null;
  if (!isEpochMs(value.start) || !Array.isArray(value.events)) return null;
  const events = value.events.filter(isEpochMs).slice(0, MAX_EVENTS_PER_SESSION);
  const s: KickSession = { id: value.id, start: value.start, count: events.length, events };
  if (value.end !== undefined) {
    if (!isEpochMs(value.end) || value.end < value.start) return null;
    s.end = value.end;
  }
  return s;
}

export function parseKickSessions(value: unknown): KickSession[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(parseSession).filter((s): s is KickSession => s !== null).slice(-MAX_STORED_SESSIONS);
}
