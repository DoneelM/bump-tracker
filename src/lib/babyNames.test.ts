import { describe, expect, it } from 'vitest';
import { hasName, MAX_NAMES, parseBabyNames, sortNames, toggleFavourite, type BabyName } from './babyNames';

const n = (id: string, name: string, favourite = false): BabyName => ({ id, name, note: '', favourite });

describe('parseBabyNames', () => {
  it('keeps valid entries and drops broken ones', () => {
    const r = parseBabyNames([
      { id: 'a', name: ' Aroha ', note: 'Love', favourite: true },
      { id: 'b', name: '' },
      { id: '', name: 'No id' },
      { id: 'c', name: 'x'.repeat(61) },
      { id: 'd', name: 'Mere', favourite: 'yes' },
      'junk',
    ]);
    expect(r).toEqual([
      { id: 'a', name: 'Aroha', note: 'Love', favourite: true },
      { id: 'd', name: 'Mere', note: '', favourite: false },
    ]);
  });

  it('rejects non-arrays and caps the list', () => {
    expect(parseBabyNames({})).toBeNull();
    const many = Array.from({ length: MAX_NAMES + 5 }, (_, i) => ({ id: `${i}`, name: `N${i}` }));
    expect(parseBabyNames(many)).toHaveLength(MAX_NAMES);
  });
});

describe('name helpers', () => {
  it('spots duplicates ignoring case and accents', () => {
    const list = [n('1', 'Aroha'), n('2', 'Zoë')];
    expect(hasName(list, ' aroha')).toBe(true);
    expect(hasName(list, 'Zoe')).toBe(true);
    expect(hasName(list, 'Mere')).toBe(false);
  });

  it('puts favourites first and keeps added order otherwise', () => {
    const list = [n('1', 'A'), n('2', 'B', true), n('3', 'C'), n('4', 'D', true)];
    expect(sortNames(list).map((x) => x.name)).toEqual(['B', 'D', 'A', 'C']);
  });

  it('toggles one favourite', () => {
    expect(toggleFavourite([n('1', 'A'), n('2', 'B')], '2').map((x) => x.favourite)).toEqual([false, true]);
  });
});
