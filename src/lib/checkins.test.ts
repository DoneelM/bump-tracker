import { describe, expect, it } from 'vitest';
import { answer, parseCheckIns, recentCheckIn } from './checkins';

describe('check-ins', () => {
  it('validates and sorts', () => {
    expect(
      parseCheckIns([
        { date: '2026-10-12', feeling: 'hard' },
        { date: '2026-10-01', feeling: 'good' },
        { date: 'x', feeling: 'good' },
        { date: '2026-10-02', feeling: 'great' },
      ]),
    ).toEqual([
      { date: '2026-10-01', feeling: 'good' },
      { date: '2026-10-12', feeling: 'hard' },
    ]);
    expect(parseCheckIns({})).toBeNull();
  });

  it('asks again after a week', () => {
    const list = [{ date: '2026-10-05', feeling: 'good' as const }];
    expect(recentCheckIn(list, '2026-10-11')).not.toBeNull();
    expect(recentCheckIn(list, '2026-10-12')).toBeNull();
  });

  it('replaces an answer given the same day', () => {
    const once = answer([], '2026-10-12', 'good');
    expect(answer(once, '2026-10-12', 'hard')).toEqual([{ date: '2026-10-12', feeling: 'hard' }]);
  });
});
