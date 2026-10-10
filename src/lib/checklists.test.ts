import { describe, expect, it } from 'vitest';
import { addItem, editItem, makeDefaults, moveItem, parseChecklist, progress, removeItem, setAnswer, toggleItem } from './checklists';

const base = () => makeDefaults('t', { A: ['a1', 'a2'], B: ['b1'] });

describe('checklists', () => {
  it('builds defaults with stable ids', () => {
    expect(base().map((i) => i.id)).toEqual(['t-0-0', 't-0-1', 't-1-0']);
  });

  it('toggles, edits, removes and tracks progress', () => {
    let items = toggleItem(base(), 't-0-0');
    expect(progress(items)).toEqual({ done: 1, total: 3 });
    items = editItem(items, 't-0-1', '  renamed ');
    expect(items[1]!.text).toBe('renamed');
    expect(editItem(items, 't-0-1', '   ')).toBe(items);
    expect(removeItem(items, 't-0-0')).toHaveLength(2);
  });

  it('adds trimmed items and rejects blank ones', () => {
    const items = base();
    expect(addItem(items, 'B', '  new ').at(-1)).toMatchObject({ section: 'B', text: 'new', done: false });
    expect(addItem(items, 'B', ' ')).toBe(items);
  });

  it('moves within a section only', () => {
    const items = base();
    expect(moveItem(items, 't-0-0', 1).map((i) => i.id)).toEqual(['t-0-1', 't-0-0', 't-1-0']);
    expect(moveItem(items, 't-0-1', 1)).toBe(items); // next neighbour is another section
    expect(moveItem(items, 't-0-0', -1)).toBe(items);
  });

  it('sets and clears answers', () => {
    let items = setAnswer(base(), 't-1-0', 'hello');
    expect(items[2]!.answer).toBe('hello');
    items = setAnswer(items, 't-1-0', '');
    expect(items[2]).not.toHaveProperty('answer');
  });

  it('validates stored data', () => {
    const parse = parseChecklist(['A']);
    expect(parse([{ id: '1', section: 'A', text: 'ok', done: true }, { id: '2', section: 'Z', text: 'bad' }, { id: '', section: 'A', text: 'x' }, 5])).toEqual([
      { id: '1', section: 'A', text: 'ok', done: true },
    ]);
    expect(parse({})).toBeNull();
  });
});
