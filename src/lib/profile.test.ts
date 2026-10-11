import { describe, expect, it } from 'vitest';
import { createProfile, dueDateFor, parseProfile, validateDating, validateEndingDate, validateNickname } from './profile';

describe('profile', () => {
  it('computes due dates for both dating methods', () => {
    expect(dueDateFor({ method: 'lmp', lmp: '2024-01-01' })).toBe('2024-10-07');
    expect(dueDateFor({ method: 'scan', scanDate: '2026-03-10', gaWeeks: 12, gaDays: 3 })).toBe('2026-09-19');
  });

  it('creates a profile with a trimmed nickname', () => {
    const p = createProfile({ method: 'lmp', lmp: '2026-03-01' }, '  Peanut ', new Date('2026-10-11T00:00:00Z'));
    expect(p).toEqual({
      dating: { method: 'lmp', lmp: '2026-03-01' },
      dueDate: '2026-12-06',
      nickname: 'Peanut',
      updatedAt: '2026-10-11T00:00:00.000Z',
    });
  });

  it('validates dating against today', () => {
    expect(validateDating({ method: 'lmp', lmp: '2026-10-12' }, '2026-10-11').ok).toBe(false);
    expect(validateDating({ method: 'scan', scanDate: '2026-06-01', gaWeeks: 12, gaDays: 0 }, '2026-10-11').ok).toBe(
      true,
    );
  });

  it('limits nickname length', () => {
    expect(validateNickname('x'.repeat(40)).ok).toBe(true);
    expect(validateNickname('x'.repeat(41)).ok).toBe(false);
  });

  describe('parseProfile', () => {
    it('round-trips a valid profile through JSON', () => {
      const p = createProfile({ method: 'scan', scanDate: '2026-03-10', gaWeeks: 12, gaDays: 3 }, 'Bean');
      expect(parseProfile(JSON.parse(JSON.stringify(p)))).toEqual(p);
    });

    it('recomputes the due date rather than trusting storage', () => {
      const stored = { dating: { method: 'lmp', lmp: '2024-01-01' }, dueDate: '1999-01-01', nickname: '', updatedAt: '' };
      expect(parseProfile(stored)?.dueDate).toBe('2024-10-07');
    });

    it('drops unknown fields', () => {
      const parsed = parseProfile({ dating: { method: 'lmp', lmp: '2024-01-01', evil: 1 }, nickname: 'a', extra: 2 });
      expect(parsed).toEqual({ dating: { method: 'lmp', lmp: '2024-01-01' }, dueDate: '2024-10-07', nickname: 'a', updatedAt: '' });
    });

    it.each([
      { dating: { method: 'lmp', lmp: '2200-12-31' } },
      { dating: { method: 'lmp', lmp: '1999-12-31' } },
      { dating: { method: 'scan', scanDate: '1900-01-05', gaWeeks: 45, gaDays: 6 } },
      { dating: { method: 'scan', scanDate: '2100-01-01', gaWeeks: 12, gaDays: 0 } },
      null,
      'string',
      [],
      {},
      { dating: { method: 'lmp', lmp: '2023-02-29' } },
      { dating: { method: 'scan', scanDate: '2026-03-10', gaWeeks: 12, gaDays: 7 } },
      { dating: { method: 'scan', scanDate: '2026-03-10', gaWeeks: '12', gaDays: 0 } },
      { dating: { method: 'ivf', lmp: '2026-03-10' } },
      { dating: { method: 'lmp', lmp: '2026-03-10' }, nickname: 'x'.repeat(41) },
      { dating: { method: 'lmp', lmp: '2026-03-10' }, nickname: 5 },
    ])('rejects %j', (value) => {
      expect(parseProfile(value)).toBeNull();
    });
  });

  describe('ending', () => {
    const base = createProfile({ method: 'lmp', lmp: '2026-01-01' }, 'Bean', new Date('2026-10-01T00:00:00Z'));

    it('round-trips a birth and an ended pregnancy', () => {
      const born = { ...base, ending: { kind: 'born' as const, date: '2026-10-05', name: 'Aria', weightG: 3450 } };
      expect(parseProfile(JSON.parse(JSON.stringify(born)))).toEqual(born);
      const ended = { ...base, ending: { kind: 'ended' as const, date: null } };
      expect(parseProfile(JSON.parse(JSON.stringify(ended)))).toEqual(ended);
    });

    it('drops a damaged ending but keeps the profile', () => {
      for (const ending of [{ kind: 'born', date: 'nope', name: '' }, { kind: 'born', date: '2026-10-05', weightG: 99 }, { kind: 'x' }, 'born']) {
        const p = parseProfile({ ...base, ending });
        expect(p).not.toBeNull();
        expect(p).not.toHaveProperty('ending');
      }
    });

    it('checks the date: required for a birth, never in the future or before the pregnancy', () => {
      // LMP 2026-01-01, so due 2026-10-08.
      expect(validateEndingDate('', base.dueDate, '2026-10-11', true).ok).toBe(false);
      expect(validateEndingDate('', base.dueDate, '2026-10-11', false).ok).toBe(true);
      expect(validateEndingDate('2026-10-12', base.dueDate, '2026-10-11', true).ok).toBe(false);
      expect(validateEndingDate('2025-12-31', base.dueDate, '2026-10-11', true).ok).toBe(false);
      expect(validateEndingDate('2026-03-01', base.dueDate, '2026-10-11', false).ok).toBe(true);
    });
  });
});
