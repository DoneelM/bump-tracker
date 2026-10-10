import { describe, expect, it } from 'vitest';
import { addMovement, endSession, formatDuration, MAX_EVENTS_PER_SESSION, parseKickSessions, sessionDurationMs } from './kicks';

const T0 = Date.UTC(2026, 9, 11);
const base = { id: 'a', start: 1000, count: 0, events: [] as number[] };

describe('kick sessions', () => {
  it('adds movements and caps the count', () => {
    const s = addMovement(addMovement(base, 2000), 3000);
    expect(s.count).toBe(2);
    expect(s.events).toEqual([2000, 3000]);
    const full = { ...base, count: MAX_EVENTS_PER_SESSION };
    expect(addMovement(full, 5).count).toBe(MAX_EVENTS_PER_SESSION);
  });
  it('ends and measures duration', () => {
    expect(sessionDurationMs(base, 61_000)).toBe(60_000);
    expect(sessionDurationMs(endSession(base, 31_000), 999_999)).toBe(30_000);
    expect(endSession(base, 5).end).toBe(1000);
  });
  it('formats durations', () => {
    expect(formatDuration(45_000)).toBe('45 s');
    expect(formatDuration(725_000)).toBe('12 min 05 s');
    expect(formatDuration(3_720_000)).toBe('1 h 02 min');
    expect(formatDuration(-1)).toBe('0 s');
  });
  it('parses defensively and recomputes count', () => {
    expect(parseKickSessions({})).toBeNull();
    const t = T0;
    const out = parseKickSessions([
      { id: 'a', start: t, end: t + 10, count: 99, events: [t + 1, 'x', t + 2] },
      { id: '', start: t, events: [] },
      { id: 'b', start: t, end: t - 5, events: [] },
      { id: 'c', start: t, events: [] },
    ]);
    expect(out).toEqual([
      { id: 'a', start: t, end: t + 10, count: 2, events: [t + 1, t + 2] },
      { id: 'c', start: t, count: 0, events: [] },
    ]);
  });
  it('drops out-of-range timestamps', () => {
    const out = parseKickSessions([
      { id: 'a', start: 1e300, events: [] },
      { id: 'b', start: T0, end: 1e300, events: [] },
      { id: 'c', start: T0, events: [T0 + 1, 1e300, 5] },
    ]);
    expect(out).toEqual([{ id: 'c', start: T0, count: 1, events: [T0 + 1] }]);
  });
});
