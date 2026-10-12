import { describe, expect, it } from 'vitest';
import type { LocalDate } from './dates';
import { appMode, duePings, markSent, parsePingState, pingUrl } from './ping';

const d = (s: string) => s as LocalDate;

describe('ping', () => {
  it('owes a day and a month count on first use, then nothing until the date changes', () => {
    let s = parsePingState(null);
    expect(duePings(s, d('2026-10-13'))).toEqual(['day', 'month']);
    s = markSent(markSent(s, 'day', d('2026-10-13')), 'month', d('2026-10-13'));
    expect(duePings(s, d('2026-10-13'))).toEqual([]);
    expect(duePings(s, d('2026-10-14'))).toEqual(['day']);
    expect(duePings(s, d('2026-11-01'))).toEqual(['day', 'month']);
  });

  it('sends nothing when switched off', () => {
    expect(duePings({ off: true, day: null, month: null }, d('2026-10-13'))).toEqual([]);
  });

  it('carries only the period, mode and version', () => {
    const url = new URL(pingUrl('day', '0.1.0', 'baby'), 'https://heybaby.nz');
    expect(url.pathname).toBe('/api/ping');
    expect([...url.searchParams.keys()].sort()).toEqual(['m', 'p', 'v']);
    expect(url.searchParams.get('m')).toBe('baby');
  });

  it('reads stored state defensively', () => {
    expect(parsePingState('not json')).toEqual({ off: false, day: null, month: null });
    expect(parsePingState(JSON.stringify({ off: true, day: 'x', month: '2026-10' }))).toEqual({ off: true, day: null, month: '2026-10' });
  });

  it('works out the mode from the profile', () => {
    expect(appMode({})).toBe('pregnancy');
    expect(appMode({ ending: { kind: 'born', date: '2026-10-01' as LocalDate, name: '', weightG: null } })).toBe('baby');
    expect(appMode({ ending: { kind: 'ended', date: null } })).toBe('ended');
  });
});
