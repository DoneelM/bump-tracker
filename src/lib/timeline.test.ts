import { describe, expect, it } from 'vitest';
import { MILESTONES } from '../data/milestones';
import { SOURCES } from '../data/sources';
import { addDays } from './dates';
import { lmpFromDueDate } from './pregnancy';
import { comingUp, milestoneStatus, placeMilestones, timelineEvents } from './timeline';

const DUE = '2027-04-01';
const lmp = lmpFromDueDate(DUE);
const at = (weeks: number, days = 0) => addDays(lmp, weeks * 7 + days);
const byId = (id: string) => MILESTONES.find((m) => m.id === id)!;

describe('milestone data', () => {
  it('has sources that exist and sane windows', () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    for (const m of MILESTONES) {
      expect(m.sources.length).toBeGreaterThan(0);
      for (const s of m.sources) expect(ids.has(s)).toBe(true);
      if (m.endDay !== null) expect(m.endDay).toBeGreaterThanOrEqual(m.startDay);
      if (m.calendarDay !== null) {
        expect(m.calendarDay).toBeGreaterThanOrEqual(m.startDay);
        if (m.endDay !== null) expect(m.calendarDay).toBeLessThanOrEqual(m.endDay);
      }
    }
  });

  it('matches the Health NZ windows', () => {
    expect([byId('screening-early').startDay, byId('screening-early').endDay]).toEqual([63, 97]); // 9w0d to 13w6d
    expect([byId('anatomy-scan').startDay, byId('anatomy-scan').endDay]).toEqual([126, 140]); // 18 to 20 weeks
    expect([byId('glucose').startDay, byId('glucose').endDay]).toEqual([168, 196]); // 24 to 28 weeks
    expect([byId('whooping-cough').startDay, byId('whooping-cough').calendarDay]).toEqual([91, 112]); // free 13, best 16
    expect(MILESTONES.some((m) => /anti-d/i.test(m.title))).toBe(false); // no routine anti-D in the sources
  });
});

describe('timeline', () => {
  it('works out status from gestational age', () => {
    expect(milestoneStatus(byId('anatomy-scan'), 18 * 7 - 1)).toBe('soon');
    expect(milestoneStatus(byId('anatomy-scan'), 18 * 7)).toBe('now');
    expect(milestoneStatus(byId('anatomy-scan'), 20 * 7)).toBe('now');
    expect(milestoneStatus(byId('anatomy-scan'), 20 * 7 + 1)).toBe('done');
    expect(milestoneStatus(byId('lmc'), 10 * 7)).toBe('now');
    expect(milestoneStatus(byId('lmc'), 15 * 7)).toBe('done');
  });

  it('places windows on real dates', () => {
    const scan = placeMilestones(DUE, at(10)).find((p) => p.milestone.id === 'anatomy-scan')!;
    expect(scan).toMatchObject({ status: 'soon', from: at(18), to: at(20) });
  });

  it('shows current milestones first on Home, then the next ones', () => {
    expect(comingUp(DUE, at(19)).map((p) => p.milestone.id)).toEqual(['whooping-cough', 'anatomy-scan']);
    expect(comingUp(DUE, at(21)).map((p) => p.milestone.id)).toEqual(['whooping-cough', 'glucose']);
    expect(comingUp(DUE, at(6)).map((p) => p.milestone.id)).toEqual(['lmc', 'bloods']);
  });
});

describe('timeline calendar events', () => {
  const url = (id: string) => `https://example.org/${id}`;

  it('skips closed windows, moves open ones to today, and keeps appointment notes out', () => {
    const today = at(19);
    const events = timelineEvents(DUE, today, [
      { id: 'a1', date: at(30), label: 'Growth scan' },
      { id: 'a0', date: at(10), label: 'Dating scan' },
    ], url);
    const titles = events.map((e) => e.title);
    expect(titles).not.toContain('Screening for Down syndrome and other conditions (optional)');
    expect(titles).not.toContain('Dating scan');
    expect(events.find((e) => e.title === 'Fetal anatomy scan')?.date).toBe(today);
    expect(events.find((e) => e.title === 'Glucose test for diabetes in pregnancy')?.date).toBe(at(24));
    expect(events.find((e) => e.title === 'Growth scan')).toMatchObject({ date: at(30), description: 'From your Bump Tracker scans and appointments.' });
    expect(events.map((e) => e.date)).toEqual([...events.map((e) => e.date)].sort());
    expect(events.find((e) => e.title === 'Glucose test for diabetes in pregnancy')?.description).toContain(url('healthnz-diabetes-testing'));
  });
});
