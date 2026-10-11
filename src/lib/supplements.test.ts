import { describe, expect, it } from 'vitest';
import {
  addSupplement,
  DEFAULT_SUPPLEMENTS,
  hasSupplement,
  isTaken,
  lastDays,
  MAX_DAYS_KEPT,
  parseSupplements,
  removeSupplement,
  toggleTaken,
} from './supplements';

describe('parseSupplements', () => {
  it('accepts the default', () => {
    expect(parseSupplements(DEFAULT_SUPPLEMENTS)).toEqual(DEFAULT_SUPPLEMENTS);
  });

  it('cleans list, ticks and reminder time', () => {
    const r = parseSupplements({
      list: [
        { id: 'folic-acid', name: 'Folic acid', builtIn: false },
        { id: 'x', name: 'Iron', builtIn: true },
        { id: 'x', name: 'Duplicate id' },
        { id: 'y', name: '' },
      ],
      taken: { 'folic-acid': ['2026-10-02', '2026-10-01', '2026-10-01', 'nope'], orphan: ['2026-10-01'] },
      reminderTime: '9am',
    });
    expect(r).toEqual({
      list: [
        { id: 'folic-acid', name: 'Folic acid', builtIn: true },
        { id: 'x', name: 'Iron', builtIn: false },
      ],
      taken: { 'folic-acid': ['2026-10-01', '2026-10-02'] },
      reminderTime: '08:00',
    });
  });

  it('rejects the wrong shape', () => {
    expect(parseSupplements([])).toBeNull();
    expect(parseSupplements({ list: [] })).toBeNull();
  });
});

describe('supplement helpers', () => {
  it('toggles a day on and off', () => {
    const on = toggleTaken(DEFAULT_SUPPLEMENTS, 'iodine', '2026-10-11');
    expect(isTaken(on, 'iodine', '2026-10-11')).toBe(true);
    expect(isTaken(toggleTaken(on, 'iodine', '2026-10-11'), 'iodine', '2026-10-11')).toBe(false);
  });

  it('keeps a bounded history', () => {
    let s = DEFAULT_SUPPLEMENTS;
    for (const d of lastDays('2026-10-11', MAX_DAYS_KEPT + 3)) s = toggleTaken(s, 'iodine', d);
    expect(s.taken.iodine).toHaveLength(MAX_DAYS_KEPT);
    expect(s.taken.iodine?.at(-1)).toBe('2026-10-11');
  });

  it('lists the last days oldest first, across a DST change', () => {
    expect(lastDays('2026-09-28', 3)).toEqual(['2026-09-26', '2026-09-27', '2026-09-28']);
  });

  it('adds and removes, dropping the removed ticks', () => {
    const s = toggleTaken(addSupplement(DEFAULT_SUPPLEMENTS, 'iron', 'Iron'), 'iron', '2026-10-11');
    expect(hasSupplement(s, ' iron ')).toBe(true);
    const r = removeSupplement(s, 'iron');
    expect(r.list.map((x) => x.id)).toEqual(['folic-acid', 'iodine']);
    expect(r.taken.iron).toBeUndefined();
  });
});
