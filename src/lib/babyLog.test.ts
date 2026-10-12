import { describe, expect, it } from 'vitest';
import {
  addEntry,
  endSleep,
  formatClock,
  formatDuration,
  last24h,
  lastOfKind,
  openOf,
  openSleep,
  parseBabyLog,
  pauseBreast,
  removeEntry,
  replaceEntry,
  resumeBreast,
  sideTimes,
  startBreast,
  stopBreast,
  stopTimer,
  switchSide,
  type BabyLogEntry,
} from './babyLog';

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

describe('new entry types', () => {
  it('parses every kind and drops out-of-range values', () => {
    const r = parseBabyLog([
      { id: 'b', kind: 'feed', at: T, side: 'bottle', ml: 120, bottle: 'formula', note: ' sleepy ', by: 'Sam' },
      { id: 'n', kind: 'nappy', at: T + 1, nappy: 'dry' },
      { id: 'p', kind: 'pump', at: T + 2, end: T + 2 + H / 2, leftMl: 60, rightMl: 9999 },
      { id: 's', kind: 'solids', at: T + 3, food: 'Kūmara', amount: 'some' },
      { id: 'm', kind: 'medicine', at: T + 4, name: 'Paracetamol', dose: '2.5 ml' },
      { id: 't', kind: 'temp', at: T + 5, celsius: 37.86 },
      { id: 'a', kind: 'activity', at: T + 6, activity: 'tummy', end: T + 6 + 600_000 },
      { id: 'g', kind: 'growth', at: T + 7, weightG: 4200, lengthCm: 54.5, headCm: null },
      { id: 'x1', kind: 'temp', at: T, celsius: 50 },
      { id: 'x2', kind: 'growth', at: T },
      { id: 'x3', kind: 'solids', at: T, food: '  ' },
      { id: 'x4', kind: 'activity', at: T, activity: 'skydiving' },
    ]);
    expect(r?.map((e) => e.id)).toEqual(['g', 'a', 't', 'm', 's', 'p', 'n', 'b']);
    expect(r?.find((e) => e.id === 'b')).toEqual({ id: 'b', kind: 'feed', at: T, side: 'bottle', ml: 120, bottle: 'formula', note: 'sleepy', by: 'Sam' });
    expect(r?.find((e) => e.id === 'p')).toMatchObject({ leftMl: 60, rightMl: null });
    expect(r?.find((e) => e.id === 't')).toMatchObject({ celsius: 37.9 });
  });

  it('keeps one open timer per kind', () => {
    const r = parseBabyLog([
      { id: 'p1', kind: 'pump', at: T, end: null, leftMl: null, rightMl: null },
      { id: 'p2', kind: 'pump', at: T + H, end: null, leftMl: null, rightMl: null },
      { id: 's1', kind: 'sleep', at: T, end: null },
      { id: 'a1', kind: 'activity', at: T, activity: 'bath', end: null },
    ]);
    expect(r?.map((e) => e.id).sort()).toEqual(['a1', 'p2', 's1']);
  });

  it('edits keep time order and removes by id', () => {
    let log: BabyLogEntry[] = [
      { id: '1', kind: 'nappy', at: T + H, nappy: 'wet' },
      { id: '2', kind: 'nappy', at: T, nappy: 'dirty' },
    ];
    log = replaceEntry(log, { id: '2', kind: 'nappy', at: T + 2 * H, nappy: 'both' });
    expect(log.map((e) => e.id)).toEqual(['2', '1']);
    expect(removeEntry(log, '2').map((e) => e.id)).toEqual(['1']);
  });

  it('stops pump and activity timers', () => {
    const log = addEntry([], { id: 'a', kind: 'activity', at: T, activity: 'tummy', end: null });
    expect(openOf(log, 'activity')?.id).toBe('a');
    expect(openOf(stopTimer(log, 'activity', T + 5 * 60_000), 'activity')).toBeNull();
  });
});

describe('breast feed timer', () => {
  it('times each side through a switch, a pause and a stop', () => {
    const M = 60_000;
    let f = startBreast('f', 'left', T);
    f = switchSide(f, T + 5 * M);
    expect(sideTimes(f, T + 8 * M)).toEqual({ leftMs: 5 * M, rightMs: 3 * M });
    f = pauseBreast(f, T + 8 * M);
    expect(sideTimes(f, T + 20 * M)).toEqual({ leftMs: 5 * M, rightMs: 3 * M });
    f = resumeBreast(f, T + 20 * M);
    f = stopBreast(f, T + 22 * M);
    expect(f).toMatchObject({ end: T + 22 * M, leftMs: 5 * M, rightMs: 5 * M, sideSince: null, side: 'right' });
    expect(parseBabyLog([f])?.[0]).toEqual(f);
  });

  it('survives a reload while running', () => {
    const f = startBreast('f', 'right', T);
    const back = parseBabyLog([JSON.parse(JSON.stringify(f))]);
    expect(back?.[0]).toEqual(f);
    expect(openOf(back ?? [], 'feed')?.id).toBe('f');
  });

  it('formats a running clock', () => {
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(3_725_000)).toBe('1:02:05');
  });
});
