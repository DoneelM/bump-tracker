import { describe, expect, it } from 'vitest';
import { flaggedEntries, parseJournalEntries, sortNewestFirst, type JournalEntry } from './journal';

const e = (id: string, date: string, flagged = false): JournalEntry => ({ id, date, mood: 3, symptoms: [], notes: '', flagged });

describe('journal', () => {
  it('sorts newest first', () => {
    expect(sortNewestFirst([e('a', '2026-01-01'), e('b', '2026-03-01'), e('c', '2026-02-01')]).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('selects flagged entries newest first', () => {
    const list = [e('a', '2026-01-01', true), e('b', '2026-03-01'), e('c', '2026-02-01', true)];
    expect(flaggedEntries(list).map((x) => x.id)).toEqual(['c', 'a']);
    expect(flaggedEntries([])).toEqual([]);
  });

  it('drops invalid entries and unknown symptoms when parsing', () => {
    const good = { id: '1', date: '2026-01-01', mood: 4, symptoms: ['nausea', 'bogus'], notes: ' hi ', flagged: true };
    const parsed = parseJournalEntries([good, { ...good, id: '2', mood: 9 }, { ...good, id: '3', date: 'nope' }, { ...good, id: '4', notes: 'x'.repeat(2001) }, null]);
    expect(parsed).toEqual([{ id: '1', date: '2026-01-01', mood: 4, symptoms: ['nausea'], notes: 'hi', flagged: true }]);
    expect(parseJournalEntries('x')).toBeNull();
  });
});
