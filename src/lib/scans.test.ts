import { describe, expect, it } from 'vitest';
import { MEASUREMENTS, nextAppointment, parseMeasurement, parseScanEntries, validateScanNotes } from './scans';

describe('nextAppointment', () => {
  const e = (id: string, date: string) => parseScanEntries([{ id, date, type: 'growth', notes: '' }])![0]!;
  it('picks the earliest entry dated today or later', () => {
    expect(nextAppointment([e('a', '2026-10-01'), e('b', '2026-10-20'), e('c', '2026-10-11')], '2026-10-11')?.id).toBe('c');
  });
  it('is null when nothing is upcoming', () => {
    expect(nextAppointment([e('a', '2026-10-01')], '2026-10-11')).toBeNull();
  });
});

const efw = MEASUREMENTS[0];
const fl = MEASUREMENTS[4];

describe('parseMeasurement', () => {
  it('blank is allowed', () => expect(parseMeasurement('  ', efw)).toEqual({ value: null }));
  it('accepts in-range values incl. bounds', () => {
    expect(parseMeasurement('330', efw).value).toBe(330);
    expect(parseMeasurement('5', fl).value).toBe(5);
    expect(parseMeasurement('90', fl).value).toBe(90);
  });
  it('rejects out-of-range and non-numeric', () => {
    expect(parseMeasurement('4.9', fl).error).toMatch(/between 5 and 90 mm/);
    expect(parseMeasurement('6001', efw).error).toBeDefined();
    expect(parseMeasurement('abc', efw).error).toBeDefined();
  });
});

describe('validateScanNotes', () => {
  it('max 1000 chars', () => {
    expect(validateScanNotes('a'.repeat(1000)).ok).toBe(true);
    expect(validateScanNotes('a'.repeat(1001)).ok).toBe(false);
  });
});

describe('parseScanEntries', () => {
  const good = { id: 'a', date: '2026-03-01', type: 'growth', notes: '', efwG: 900, flMm: 50 };
  it('fills missing measurements with null', () => {
    expect(parseScanEntries([good])).toEqual([
      { ...good, efwG: 900, bpdMm: null, hcMm: null, acMm: null, flMm: 50 },
    ]);
  });
  it('drops bad entries and rejects non-arrays', () => {
    expect(parseScanEntries([good, { ...good, type: 'x' }, { ...good, efwG: 1 }, { ...good, date: 'nope' }])).toHaveLength(1);
    expect(parseScanEntries('x')).toBeNull();
  });
});
