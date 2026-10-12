import { describe, expect, it } from 'vitest';
import { parseFirsts } from './firsts';

describe('parseFirsts', () => {
  it('keeps valid firsts, newest first, and drops bad ones', () => {
    const r = parseFirsts([
      { id: 'a', date: '2026-10-20', title: ' First smile ', note: '' },
      { id: 'b', date: '2026-11-02', title: 'First bath', note: 'Loved it' },
      { id: 'c', date: 'soon', title: 'Bad date' },
      { id: 'd', date: '2026-10-21', title: '' },
    ]);
    expect(r?.map((f) => f.id)).toEqual(['b', 'a']);
    expect(r?.[1]?.title).toBe('First smile');
    expect(parseFirsts('x')).toBeNull();
  });
});
