import { describe, expect, it } from 'vitest';
import { CHOKING, CHOKING_SOURCE_ID, CPR_SOURCE_ID, CPR_STEPS, SICK_SOURCE_ID, WHEN_TO_GET_HELP } from './babyHelp';
import { SOURCES } from './sources';

describe('baby emergency help content', () => {
  it('cites listed sources', () => {
    for (const id of [CHOKING_SOURCE_ID, CPR_SOURCE_ID, SICK_SOURCE_ID]) expect(SOURCES.some((s) => s.id === id), id).toBe(true);
  });

  it('calls 111 early in every emergency sequence', () => {
    expect(CPR_STEPS.map((x) => x.title).slice(0, 3)).toEqual(['Dangers', 'Response', 'Send for help']);
    expect(CPR_STEPS[2]?.lines[0]).toMatch(/^Call 111/);
    expect(CHOKING.backBlows[0]).toMatch(/^Call 111/);
    expect(WHEN_TO_GET_HELP[0]?.title).toMatch(/^Call 111/);
  });

  it('keeps the counts from the sources', () => {
    const cpr = CPR_STEPS.find((x) => x.title === 'CPR')?.lines.join(' ') ?? '';
    expect(cpr).toContain('30 compressions followed by 2 breaths');
    expect(cpr).toContain('100 per minute');
    expect(CHOKING.backBlows.join(' ')).toContain('up to 5 back blows');
    expect(CHOKING.chestThrusts.join(' ')).toContain('Give 5 separate');
  });
});
