import { describe, expect, it } from 'vitest';
import { addEntry, endSleep, formatDuration, last24h, lastOfKind, openSleep, parseBabyLog, type BabyLogEntry } from './babyLog';

const T = Date.UTC(2026, 9, 12, 0, 0, 0);
const H = 3_600_000;

describe('parseBabyLog', () => {
  it('keeps valid entries newest first and drops bad ones', () => {
    const r = parseBabyLog([
      { id: 'a', kind: 'feed', at: T, side: 'left', ml: 50 },
      { id: 'b', kind: 'feed', at: T + H, side: 'bottle', ml: 90 },
      { id: 'c', kind: 'nappy', at: T + 2 * H, nappy: 'both' },
      { id: 'd', kind: 'sleep', at: T + 3 * H, end: T + 2 * H },
      { id: 'e', kind: 'feed', at: T, side: 'middle' },
      { id: 'f', kind: 'nappy', at: 5, nappy: 'wet' },
      'junk',
    ]);
    expect(r?.map((e) => e.id)).toEqual(['c', 'b', 'a']);
    expect(r?.find((e) => e.id === 'a')).toEqual({ id: 'a', kind: 'feed', at: T, side: 'left', ml: null });
    expect(r?.find((e) => e.id === 'b')).toMatchObject({ ml: 90 });
  });

  it('keeps only the newest open sleep', () => {
    const r = parseBabyLog([
      { id: 's1', kind: 'sleep', at: T, end: null },
      { id: 's2', kind: 'sleep', at: T + H, end: null },
    ]);
    expect(r?.map((e) => e.id)).toEqual(['s2']);
    expect(parseBabyLog({})).toBeNull();
  });
});

describe('baby log helpers', () => {
  it('adds in time order and finds the last of a kind', () => {
    let log: BabyLogEntry[] = [];
    log = addEntry(log, { id: '1', kind: 'feed', at: T, side: 'left', ml: null });
    log = addEntry(log, { id: '2', kind: 'nappy', at: T + H, nappy: 'wet' });
    log = addEntry(log, { id: '3', kind: 'feed', at: T - H, side: 'right', ml: null });
    expect(log.map((e) => e.id)).toEqual(['2', '1', '3']);
    expect(lastOfKind(log, 'feed')?.id).toBe('1');
  });

  it('starts and ends a sleep', () => {
    const log = addEntry([], { id: 's', kind: 'sleep', at: T, end: null });
    expect(openSleep(log)?.id).toBe('s');
    const ended = endSleep(log, T + 2 * H);
    expect(openSleep(ended)).toBeNull();
    expect(ended[0]).toMatchObject({ end: T + 2 * H });
  });

  it('summarises the last 24 hours, clipping sleep to the window', () => {
    const now = T + 30 * H;
    const log: BabyLogEntry[] = [
      { id: 'f1', kind: 'feed', at: now - H, side: 'left', ml: null },
      { id: 'f2', kind: 'feed', at: now - 25 * H, side: 'right', ml: null },
      { id: 'n1', kind: 'nappy', at: now - 2 * H, nappy: 'dirty' },
      { id: 's1', kind: 'sleep', at: now - 26 * H, end: now - 23 * H },
      { id: 's2', kind: 'sleep', at: now - 30 * 60_000, end: null },
    ];
    expect(last24h(log, now)).toEqual({ feeds: 1, nappies: 1, sleepMinutes: 60 + 30 });
  });

  it('formats durations', () => {
    expect(formatDuration(5)).toBe('5 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(125)).toBe('2 h 5 min');
  });
});
