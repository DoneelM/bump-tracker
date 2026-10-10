import { describe, expect, it } from 'vitest';
import {
  averagesLastHour,
  detect511,
  formatMmSs,
  formatSinceLast,
  intervalsMs,
  isSessionLive,
  isValidContraction,
  parseContractionState,
  type Contraction,
} from './contractions';

const T0 = Date.UTC(2026, 9, 11);
const S = 1000;
const M = 60 * S;
/** n contractions every `every` ms, each `dur` ms long. */
const series = (n: number, every: number, dur: number, t0 = 1_000_000): Contraction[] =>
  Array.from({ length: n }, (_, i) => ({ start: t0 + i * every, end: t0 + i * every + dur }));

describe('validity', () => {
  it('rejects end<=start and > 10 min', () => {
    expect(isValidContraction({ start: 5, end: 5 })).toBe(false);
    expect(isValidContraction({ start: 5, end: 4 })).toBe(false);
    expect(isValidContraction({ start: 0, end: 10 * M })).toBe(true);
    expect(isValidContraction({ start: 0, end: 10 * M + 1 })).toBe(false);
  });
});

describe('intervals and averages', () => {
  it('computes start-to-start intervals, ignoring invalid entries', () => {
    const list = [...series(3, 4 * M, 60 * S), { start: 1, end: 1 }];
    expect(intervalsMs(list)).toEqual([null, 4 * M, 4 * M]);
  });
  it('averages only the last hour', () => {
    const list = series(5, 10 * M, 30 * S);
    const now = list[4]!.end;
    const a = averagesLastHour(list, now);
    expect(a.count).toBe(5);
    expect(a.avgDurationMs).toBe(30 * S);
    expect(a.avgIntervalMs).toBe(10 * M);
    expect(averagesLastHour(list, now + 120 * M).count).toBe(0);
    expect(averagesLastHour([], now)).toEqual({ count: 0, avgDurationMs: null, avgIntervalMs: null });
  });
});

describe('detect511', () => {
  it('true for 5-minute, 1-minute contractions over an hour', () => {
    expect(detect511(series(13, 5 * M, 60 * S))).toBe(true);
  });
  it('false when the run is under an hour', () => {
    expect(detect511(series(12, 5 * M, 60 * S))).toBe(false);
  });
  it('false when contractions are too short', () => {
    expect(detect511(series(13, 5 * M, 30 * S))).toBe(false);
  });
  it('false when intervals average above 5.5 min', () => {
    expect(detect511(series(11, 6 * M, 60 * S))).toBe(false);
  });
  it('false with a gap over 7 min inside the hour', () => {
    const l = series(13, 5 * M, 60 * S);
    const gapped = l.map((c, i) => (i >= 6 ? { start: c.start + 3 * M, end: c.end + 3 * M } : c));
    expect(detect511(gapped)).toBe(false);
  });
  it('false once the latest contraction is over 7 min old', () => {
    const l = series(13, 5 * M, 60 * S);
    const lastStart = l[12]!.start;
    expect(detect511(l, lastStart + 6 * M)).toBe(true);
    expect(detect511(l, lastStart + 8 * M)).toBe(false);
  });
  it('earlier irregular labour does not block a later qualifying hour', () => {
    const early = series(3, 20 * M, 40 * S, 0);
    const late = series(13, 5 * M, 60 * S, 5 * 60 * M);
    expect(detect511([...early, ...late])).toBe(true);
  });
  it('requires most contractions >= 40 s', () => {
    const l = series(13, 5 * M, 60 * S).map((c, i) => (i % 2 ? { ...c, end: c.start + 20 * S } : c));
    expect(detect511(l)).toBe(false);
  });
  it('ignores invalid entries and handles tiny input', () => {
    expect(detect511([])).toBe(false);
    expect(detect511([{ start: 1, end: 1 }])).toBe(false);
    expect(detect511([...series(13, 5 * M, 60 * S), { start: 2_000_000_000, end: 2_000_000_000 }])).toBe(true);
  });
});

describe('formatMmSs', () => {
  it('formats', () => {
    expect(formatMmSs(65 * S)).toBe('01:05');
    expect(formatMmSs(61 * M)).toBe('61:00');
    expect(formatMmSs(null)).toBe('00:00');
    expect(formatMmSs(-5)).toBe('00:00');
  });
});

describe('parseContractionState', () => {
  it('rejects non-objects, drops bad entries, validates activeStart', () => {
    expect(parseContractionState(null)).toBeNull();
    expect(parseContractionState({ contractions: 'x' })).toBeNull();
    expect(
      parseContractionState({ contractions: [{ start: T0, end: T0 + 1 }, { start: 'a', end: 2 }, 5, { start: T0 + 3, end: T0 + 2 }], activeStart: 'z' }),
    ).toEqual({ contractions: [{ start: T0, end: T0 + 1 }], activeStart: null });
    expect(parseContractionState({ contractions: [], activeStart: T0 })?.activeStart).toBe(T0);
  });
  it('drops out-of-range timestamps', () => {
    const bad = { contractions: [{ start: 1, end: 2 }, { start: 1e300, end: 1e300 + 1 }], activeStart: 1e300 };
    expect(parseContractionState(bad)).toEqual({ contractions: [], activeStart: null });
  });
});

describe('isSessionLive', () => {
  const ended = (ago: number) => ({ contractions: [{ start: T0 - ago - 60 * S, end: T0 - ago }], activeStart: null });
  it('is live while timing, or within the gap after the last contraction ended', () => {
    expect(isSessionLive({ contractions: [], activeStart: T0 - S }, T0)).toBe(true);
    expect(isSessionLive(ended(M), T0)).toBe(true);
  });
  it('is not live for an old session or an empty state', () => {
    expect(isSessionLive(ended(8 * M), T0)).toBe(false);
    expect(isSessionLive({ contractions: [], activeStart: null }, T0)).toBe(false);
  });
});

describe('formatSinceLast', () => {
  it('ticks while the session is live and says "over 7 min" once it is not (no frozen 07:01)', () => {
    expect(formatSinceLast(65 * S, true)).toBe('01:05');
    expect(formatSinceLast(7 * M + S, false)).toBe('over 7 min');
    expect(formatSinceLast(20 * M, false)).toBe('over 7 min');
  });
});
