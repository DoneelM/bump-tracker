import { describe, expect, it } from 'vitest';
import { askedQuestions, MAX_QUESTIONS, openQuestions, parseQuestions } from './questions';

describe('questions', () => {
  it('parses, trimming text and dropping bad entries', () => {
    expect(
      parseQuestions([
        { id: 'a', text: ' Is it safe to fly? ', askedOn: null },
        { id: 'b', text: 'Iron tablets?', askedOn: '2026-10-01' },
        { id: 'c', text: '', askedOn: null },
        { id: '', text: 'no id' },
        { id: 'd', text: 'x'.repeat(301) },
        { id: 'e', text: 'bad date', askedOn: 'soon' },
        'nope',
      ]),
    ).toEqual([
      { id: 'a', text: 'Is it safe to fly?', askedOn: null },
      { id: 'b', text: 'Iron tablets?', askedOn: '2026-10-01' },
      { id: 'e', text: 'bad date', askedOn: null },
    ]);
    expect(parseQuestions({})).toBeNull();
    expect(parseQuestions(Array.from({ length: 250 }, (_, i) => ({ id: `q${i}`, text: 'q' })))).toHaveLength(MAX_QUESTIONS);
  });

  it('splits open and asked, newest asked first', () => {
    const qs = [
      { id: 'a', text: 'a', askedOn: null },
      { id: 'b', text: 'b', askedOn: '2026-09-01' },
      { id: 'c', text: 'c', askedOn: '2026-10-01' },
    ];
    expect(openQuestions(qs).map((q) => q.id)).toEqual(['a']);
    expect(askedQuestions(qs).map((q) => q.id)).toEqual(['c', 'b']);
  });
});
