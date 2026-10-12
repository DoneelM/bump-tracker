/**
 * Anonymous daily count. At most once a day and once a month, the app tells our own server "a device used
 * version X in pregnancy/baby mode today". No ID, no cookie, nothing the user entered, so we can count active
 * devices without knowing who anyone is. On by default, off in Settings. Per-device (like the theme): not a
 * registered key, so it is never backed up or synced, and every device counts once.
 */
import { useEffect, useState } from 'react';
import type { LocalDate } from './dates';
import type { PregnancyProfile } from './profile';

export const PING_KEY = 'bt:ui:ping';
/** Only these hosts send. Dev, preview URLs and copies of the app stay silent. */
export const PROD_HOSTS = ['heybaby.nz', 'bump-tracker.aiagents.nz'];

export type AppMode = 'pregnancy' | 'baby' | 'ended';
export type Period = 'day' | 'month';

export interface PingState {
  off: boolean;
  day: LocalDate | null;
  /** YYYY-MM */
  month: string | null;
}

const EMPTY: PingState = { off: false, day: null, month: null };

export const appMode = (profile: Pick<PregnancyProfile, 'ending'>): AppMode =>
  profile.ending?.kind === 'born' ? 'baby' : profile.ending ? 'ended' : 'pregnancy';

export function parsePingState(raw: string | null): PingState {
  try {
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (!v || typeof v !== 'object') return EMPTY;
    const o = v as Record<string, unknown>;
    return {
      off: o.off === true,
      day: typeof o.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.day) ? (o.day as LocalDate) : null,
      month: typeof o.month === 'string' && /^\d{4}-\d{2}$/.test(o.month) ? o.month : null,
    };
  } catch {
    return EMPTY;
  }
}

/** Which counts this device still owes for `today`. */
export function duePings(s: PingState, today: LocalDate): Period[] {
  if (s.off) return [];
  const due: Period[] = [];
  if (s.day !== today) due.push('day');
  if (s.month !== today.slice(0, 7)) due.push('month');
  return due;
}

export const markSent = (s: PingState, p: Period, today: LocalDate): PingState =>
  p === 'day' ? { ...s, day: today } : { ...s, month: today.slice(0, 7) };

/** The whole message: version, mode and period. Nothing else. */
export const pingUrl = (p: Period, version: string, mode: AppMode) =>
  `/api/ping?${new URLSearchParams({ p, m: mode, v: version }).toString()}`;

function read(): PingState {
  try {
    return parsePingState(localStorage.getItem(PING_KEY));
  } catch {
    return EMPTY;
  }
}

function write(s: PingState) {
  try {
    localStorage.setItem(PING_KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: we may count this device again next time, which is harmless.
  }
}

/** Sends what's due. A failed send (offline) is retried next time the app opens. */
export async function sendDuePings(today: LocalDate, mode: AppMode, version: string, f: typeof fetch = fetch): Promise<void> {
  if (!PROD_HOSTS.includes(location.hostname)) return;
  for (const p of duePings(read(), today)) {
    try {
      const res = await f(pingUrl(p, version, mode), { method: 'POST', keepalive: true, credentials: 'omit' });
      if (res.ok) write(markSent(read(), p, today));
    } catch {
      return;
    }
  }
}

export function usePingSetting(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => !read().off);
  const set = (next: boolean) => {
    write({ ...read(), off: !next });
    setOn(next);
  };
  return [on, set];
}

export function usePing(today: LocalDate, mode: AppMode) {
  useEffect(() => {
    void sendDuePings(today, mode, __APP_VERSION__);
  }, [today, mode]);
}
