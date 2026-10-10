import { describe, expect, it } from 'vitest';
import { createProfile, dueDateFor, parseProfile, validateDating, validateNickname } from './profile';

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
});
