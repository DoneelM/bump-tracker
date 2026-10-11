import { describe, expect, it } from 'vitest';
import {
  bpAboveTarget,
  glucoseAboveTarget,
  newestFirst,
  NO_TARGETS,
  parseBpReadings,
  parseGlucoseReadings,
  parseTargets,
  validateBp,
  validateGlucose,
  validateReadingDate,
  type BpReading,
  type GlucoseReading,
} from './monitoring';

const bp = (o: Partial<BpReading> = {}): BpReading => ({ id: 'b', date: '2026-10-01', time: '08:00', systolic: 118, diastolic: 76, pulse: null, note: '', ...o });
const gl = (o: Partial<GlucoseReading> = {}): GlucoseReading => ({ id: 'g', date: '2026-10-01', time: '07:00', context: 'fasting', mmol: 5.1, note: '', ...o });

describe('home monitoring', () => {
  it('parses readings and drops bad ones', () => {
    expect(parseBpReadings([bp(), bp({ id: 'x', systolic: 70, diastolic: 80 }), bp({ id: 'y', time: '25:00' }), { ...bp({ id: 'z' }), pulse: 5 }, 'junk'])).toEqual([bp()]);
    expect(parseBpReadings([{ id: 'n', date: '2026-10-01', systolic: 120, diastolic: 80 }])).toEqual([{ id: 'n', date: '2026-10-01', time: '', systolic: 120, diastolic: 80, pulse: null, note: '' }]);
    expect(parseGlucoseReadings([gl(), gl({ id: 'x', mmol: 0.5 }), { ...gl({ id: 'y' }), context: 'lunch' }, gl({ id: 'r', mmol: 5.149 })])).toEqual([gl(), gl({ id: 'r', mmol: 5.1 })]);
    expect(parseBpReadings({})).toBeNull();
  });

  it('parses targets: upper limits only, within input ranges', () => {
    expect(parseTargets({ bpSystolicMax: 140, bpDiastolicMax: 90, glucoseMax: { fasting: 5.3, '1h': 7.8 } })).toEqual({
      bpSystolicMax: 140,
      bpDiastolicMax: 90,
      glucoseMax: { fasting: 5.3, '1h': 7.8 },
    });
    expect(parseTargets({})).toEqual(NO_TARGETS);
    expect(parseTargets({ bpSystolicMax: 9000 })).toBeNull();
    expect(parseTargets({ glucoseMax: { fasting: 'low' } })).toBeNull();
  });

  it('flags readings only against targets the user entered', () => {
    expect(bpAboveTarget(bp({ systolic: 200, diastolic: 120 }), NO_TARGETS)).toBe(false);
    const t = { bpSystolicMax: 135, bpDiastolicMax: 85, glucoseMax: { fasting: 5.3 } };
    expect(bpAboveTarget(bp({ systolic: 135, diastolic: 85 }), t)).toBe(false);
    expect(bpAboveTarget(bp({ systolic: 136 }), t)).toBe(true);
    expect(bpAboveTarget(bp({ diastolic: 86 }), t)).toBe(true);
    expect(glucoseAboveTarget(gl({ mmol: 5.4 }), t)).toBe(true);
    expect(glucoseAboveTarget(gl({ mmol: 9, context: '1h' }), t)).toBe(false); // no 1h target
    expect(glucoseAboveTarget(gl({ mmol: 9, context: 'other' }), t)).toBe(false);
  });

  it('validates input as typos, not clinically', () => {
    expect(validateBp(120, 80, null).ok).toBe(true);
    expect(validateBp(80, 120, null).ok).toBe(false);
    expect(validateBp(1200, 80, null).ok).toBe(false);
    expect(validateBp(120, null, null).ok).toBe(false);
    expect(validateBp(120, 80, 500).ok).toBe(false);
    expect(validateGlucose(4.8).ok).toBe(true);
    expect(validateGlucose(48).ok).toBe(false);
    expect(validateReadingDate('2026-10-12', '2026-10-11').ok).toBe(false);
  });

  it('sorts newest first by date then time', () => {
    const rs = [bp({ id: 'a', date: '2026-10-01', time: '08:00' }), bp({ id: 'b', date: '2026-10-02', time: '07:00' }), bp({ id: 'c', date: '2026-10-01', time: '20:00' })];
    expect(newestFirst(rs).map((r) => r.id)).toEqual(['b', 'c', 'a']);
    // Same date and time: the one added last is newest.
    const same = [gl({ id: 'first' }), gl({ id: 'second', context: '1h' })];
    expect(newestFirst(same).map((r) => r.id)).toEqual(['second', 'first']);
  });
});
