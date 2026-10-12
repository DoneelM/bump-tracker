import { describe, expect, it } from 'vitest';
import { CHOKING, CHOKING_SOURCE_ID, CPR, CPR_SOURCE_ID, SICK_SOURCE_ID, WHEN_TO_GET_HELP } from './babyHelp';
import { SOURCES } from './sources';

describe('baby emergency help content', () => {
  it('cites listed sources', () => {
    for (const id of [CHOKING_SOURCE_ID, CPR_SOURCE_ID, SICK_SOURCE_ID]) expect(SOURCES.some((s) => s.id === id), id).toBe(true);
  });

  it('puts calling 111 first in every emergency sequence', () => {
    expect(CPR.quick[0]).toMatch(/^Call 111/);
    expect(CHOKING.backBlows[0]).toMatch(/^Call 111/);
    expect(WHEN_TO_GET_HELP[0]?.title).toMatch(/^Call 111/);
  });

  it('keeps the counts from the sources', () => {
    expect(CPR.pushes.join(' ')).toContain('30 times');
    expect(CHOKING.backBlows.join(' ')).toContain('up to 5 back blows');
    expect(CHOKING.chestThrusts.join(' ')).toContain('Give 5 separate');
  });
});
