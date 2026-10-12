import { describe, expect, it } from 'vitest';
import { buildCareSummary, type CareSummaryInput } from './careSummary';
import { NO_TARGETS } from './monitoring';

const base: CareSummaryInput = {
  today: '2026-10-13',
  context: 'Due Wed, 6 January 2027',
  journal: [],
  questions: [],
  bp: [],
  glucose: [],
  targets: NO_TARGETS,
  babyDays: [],
};

describe('buildCareSummary', () => {
  it('has only a header when nothing is ticked', () => {
    expect(buildCareSummary(base).split('\n')).toHaveLength(3);
  });

  it('includes exactly what was selected, newest journal entry first', () => {
    const text = buildCareSummary({
      ...base,
      journal: [
        { id: 'a', date: '2026-10-01', mood: 2, symptoms: ['headache'], notes: 'Since\nlunch', flagged: true },
        { id: 'b', date: '2026-10-10', mood: 4, symptoms: [], notes: '', flagged: false },
      ],
      questions: [{ id: 'q', text: 'Is the itching normal?', askedOn: null }],
      bp: [{ id: 'r', date: '2026-10-12', time: '08:30', systolic: 128, diastolic: 84, pulse: null, note: '' }],
      targets: { bpSystolicMax: 140, bpDiastolicMax: 90, glucoseMax: {} },
    });
    expect(text).toContain('JOURNAL');
    expect(text.indexOf('10 October')).toBeLessThan(text.indexOf('1 October'));
    expect(text).toContain('feeling low (flagged to mention)');
    expect(text).toContain('  Since lunch');
    expect(text).toContain('- Is the itching normal?');
    expect(text).toContain("My care team's limits: 140/90");
    expect(text).toContain('08:30: 128/84');
    expect(text).not.toContain('GLUCOSE');
    expect(text).not.toContain('BABY LOG');
  });

  it('summarises baby log days', () => {
    const text = buildCareSummary({
      ...base,
      context: 'Baby born Thu, 1 October 2026',
      babyDays: [{ day: '2026-10-12', feeds: 8, bottleMl: 120, nappies: 7, wet: 6, dirty: 3, sleepMinutes: 900, pumpMl: 0 }],
    });
    expect(text).toContain('8 feeds (120 ml from bottles), 6 wet and 3 dirty nappies, 15 h sleep');
  });
});
