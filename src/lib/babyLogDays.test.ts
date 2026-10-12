import { describe, expect, it } from 'vitest';
import type { BabyLogEntry } from './babyLog';
import { averages, dayBounds, dayOf, dayTotals, entriesOn, lastDays, toCsv } from './babyLogDays';

// Tests run in Pacific/Auckland time (vite.config.ts).
const at = (s: string) => new Date(s).getTime();

describe('baby log by day', () => {
  it('uses local calendar days, including the DST change', () => {
    const [a, b] = dayBounds('2026-09-27'); // NZ clocks go forward: a 23-hour day
    expect((b - a) / 3_600_000).toBe(23);
    expect(dayOf(at('2026-10-12T23:30:00'))).toBe('2026-10-12');
  });

  it('includes a sleep that started the night before, and clips it to the day', () => {
    const log: BabyLogEntry[] = [
      { id: 's', kind: 'sleep', at: at('2026-10-11T22:00:00'), end: at('2026-10-12T02:00:00') },
      { id: 'n', kind: 'nappy', at: at('2026-10-12T08:00:00'), nappy: 'both' },
      { id: 'b', kind: 'feed', at: at('2026-10-12T09:00:00'), side: 'bottle', ml: 90 },
      { id: 'l', kind: 'feed', at: at('2026-10-12T12:00:00'), side: 'left', ml: null },
      { id: 'p', kind: 'pump', at: at('2026-10-12T13:00:00'), leftMl: 40, rightMl: 50 },
      { id: 'x', kind: 'nappy', at: at('2026-10-13T01:00:00'), nappy: 'wet' },
    ];
    const now = at('2026-10-13T12:00:00');
    expect(entriesOn(log, '2026-10-12', now).map((e) => e.id)).toEqual(['s', 'n', 'b', 'l', 'p']);
    expect(dayTotals(log, '2026-10-12', now)).toEqual({
      day: '2026-10-12', feeds: 2, bottleMl: 90, nappies: 1, wet: 1, dirty: 1, sleepMinutes: 120, pumpMl: 90,
    });
    expect(dayTotals(log, '2026-10-11', now).sleepMinutes).toBe(120);
  });

  it('lists days oldest first and averages only logged days', () => {
    expect(lastDays('2026-10-12', 3)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
    const t = (feeds: number) => ({ day: '2026-10-12', feeds, bottleMl: 0, nappies: 0, wet: 0, dirty: 0, sleepMinutes: 0, pumpMl: 0 });
    expect(averages([t(8), t(0), t(6)])).toMatchObject({ days: 2, feeds: 7 });
    expect(averages([t(0)]).feeds).toBeNull();
  });
});

describe('toCsv', () => {
  it('writes one row per entry, oldest first, and neutralises formulas', () => {
    const csv = toCsv([
      { id: '2', kind: 'medicine', at: at('2026-10-12T10:05:00'), name: '=HYPERLINK("x")', dose: '2.5 ml', by: 'Sam' },
      { id: '1', kind: 'sleep', at: at('2026-10-12T08:00:00'), end: at('2026-10-12T09:30:00'), note: 'in the pram, "finally"' },
      { id: '3', kind: 'feed', at: at('2026-10-12T11:00:00'), side: 'right', ml: null, end: null, leftMs: 0, rightMs: 0, sideSince: at('2026-10-12T11:00:00') },
    ]);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('Date,Time,Type,Details,Ended,Minutes,Note,Logged by');
    expect(lines[1]).toBe('2026-10-12,08:00,sleep,,2026-10-12 09:30,90,"in the pram, ""finally""",');
    expect(lines[2]).toBe(`2026-10-12,10:05,medicine,"'=HYPERLINK(""x""), 2.5 ml",,,,Sam`);
    expect(lines[3]).toContain(',running,');
  });
});
