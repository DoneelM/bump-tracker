import { describe, expect, it } from 'vitest';
import { VISITS } from '../data/immunisations';
import { dueDate, nextVisit, parseImmunisationsDone } from './immunisations';

describe('immunisation dates', () => {
  it('works out each due date from the birth date', () => {
    const born = '2026-09-20';
    expect(VISITS.map((v) => dueDate(born, v))).toEqual([
      '2026-11-01', // 6 weeks
      '2026-12-20',
      '2027-02-20',
      '2027-09-20',
      '2027-12-20',
      '2030-09-20',
    ]);
    expect(dueDate('2026-11-30', VISITS[1]!)).toBe('2027-02-28'); // clamps to month end
  });

  it('finds the next visit not done', () => {
    expect(nextVisit(VISITS, '2026-09-20', {})?.visit.id).toBe('6w');
    expect(nextVisit(VISITS, '2026-09-20', { '6w': '2026-11-02' })).toEqual({ visit: VISITS[1], due: '2026-12-20' });
  });

  it('validates done records', () => {
    expect(parseImmunisationsDone({ '6w': '2026-11-02', bad: 'nope', 'x y': '2026-11-02' })).toEqual({ '6w': '2026-11-02' });
    expect(parseImmunisationsDone([])).toBeNull();
  });
});
