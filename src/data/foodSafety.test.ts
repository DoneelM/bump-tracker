import { describe, expect, it } from 'vitest';
import { SOURCES } from './sources';
import { FISH_SERVINGS, filterFish, filterFoods, FOOD_GROUPS, FOOD_SOURCE_ID, VERDICT_LABEL } from './foodSafety';

describe('food safety data', () => {
  it('cites a listed source and uses known verdicts', () => {
    expect(SOURCES.some((s) => s.id === FOOD_SOURCE_ID)).toBe(true);
    for (const g of FOOD_GROUPS) {
      expect(g.items.length).toBeGreaterThan(0);
      for (const i of g.items) {
        expect(VERDICT_LABEL[i.verdict], i.food).toBeDefined();
        expect(i.advice).not.toMatch(/—|--/); // house style: no em dashes
      }
    }
  });

  it('keeps MPI’s key rules', () => {
    const find = (name: string) => FOOD_GROUPS.flatMap((g) => g.items).find((i) => i.food === name);
    expect(find('Soft cheese')?.verdict).toBe('cooked');
    expect(find('Sushi, store-bought')?.verdict).toBe('avoid');
    expect(find('Hard cheese')?.verdict).toBe('ok');
  });
});

describe('filterFoods', () => {
  it('returns everything for an empty query', () => {
    expect(filterFoods(FOOD_GROUPS, '  ')).toHaveLength(FOOD_GROUPS.length);
  });

  it('matches examples, ignoring case and accents', () => {
    const r = filterFoods(FOOD_GROUPS, 'PATE');
    expect(r.flatMap((g) => g.items).map((i) => i.food)).toEqual(['Processed meats']);
    expect(filterFoods(FOOD_GROUPS, 'feta')[0]?.items[0]?.food).toBe('Soft cheese');
  });

  it('drops empty groups', () => {
    expect(filterFoods(FOOD_GROUPS, 'zzzz')).toEqual([]);
  });
});

describe('filterFish', () => {
  it('finds a species in its band', () => {
    const r = filterFish('snapper');
    expect(r).toHaveLength(1);
    expect(r[0]?.advice).toBe(FISH_SERVINGS[1]?.advice);
  });
});
