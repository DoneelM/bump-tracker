import { describe, expect, it } from 'vitest';
import { CONTACT_MIDWIFE, PATTERN_511, PAST_DUE, PRE_ECLAMPSIA, PRETERM, WORRIED_ABOUT_MOVEMENTS } from '../data/guidance';
import { SOURCES } from '../data/sources';
import { EMPTY_STATE, showPretermGuidance } from './contractions';
import { hasPreEclampsiaSigns, parseJournalEntries, SYMPTOMS, validateJournalDate } from './journal';
import { sessionGuidanceLevel } from './kicks';
import { pastDueLevel } from './pregnancy';
import { nextAppointment, parseScanEntries } from './scans';
import { stageAlt } from './stages';
import { requestPersistentStorage } from './storage';

describe('showPretermGuidance', () => {
  const timed = { contractions: [{ start: 1, end: 2 }], activeStart: null };
  it('shows under 37 weeks once contractions are being timed, with no pattern needed', () => {
    expect(showPretermGuidance(31, timed)).toBe(true);
    expect(showPretermGuidance(36, { contractions: [], activeStart: 5 })).toBe(true);
  });
  it('is hidden at 37+ weeks, or when nothing is being timed', () => {
    expect(showPretermGuidance(37, timed)).toBe(false);
    expect(showPretermGuidance(31, EMPTY_STATE)).toBe(false);
  });
});

describe('nextAppointment (today has no time of day)', () => {
  const e = (id: string, date: string, efwG?: number) => parseScanEntries([{ id, date, type: 'growth', notes: '', efwG }])![0]!;
  it("skips today's entry once it has measurements, so the later appointment wins", () => {
    expect(nextAppointment([e('today', '2026-10-11', 900), e('later', '2026-10-20')], '2026-10-11')?.id).toBe('later');
  });
  it("counts today's entry while it has no measurements, and always counts later dates", () => {
    expect(nextAppointment([e('today', '2026-10-11'), e('later', '2026-10-20')], '2026-10-11')?.id).toBe('today');
    expect(nextAppointment([e('today', '2026-10-11', 900)], '2026-10-11')).toBeNull();
  });
});

describe('pastDueLevel', () => {
  it('is none up to the due date, past after it, overdue from 14 days (42w0d)', () => {
    expect([1, 0].map(pastDueLevel)).toEqual(['none', 'none']);
    expect([-1, -13].map(pastDueLevel)).toEqual(['past', 'past']);
    expect([-14].map(pastDueLevel)).toEqual(['past']); // 42w0d is not yet overdue
    expect([-15, -30].map(pastDueLevel)).toEqual(['overdue', 'overdue']);
  });
});

describe('journal pre-eclampsia signs', () => {
  it('flags headache, swelling, vision changes, pain below ribs, vomiting and difficulty breathing only', () => {
    for (const s of ['headache', 'swelling', 'vision changes', 'pain below ribs', 'vomiting', 'difficulty breathing'])
      expect(hasPreEclampsiaSigns(['nausea', s])).toBe(true);
    expect(hasPreEclampsiaSigns(['nausea', 'breathlessness', 'other'])).toBe(false);
    for (const s of ['pain below ribs', 'vomiting', 'difficulty breathing']) expect(SYMPTOMS).toContain(s);
    expect(hasPreEclampsiaSigns([])).toBe(false);
  });
  it('keeps vision changes before other, and old entries still parse', () => {
    expect(SYMPTOMS.at(-1)).toBe('other');
    const old = { id: '1', date: '2026-01-01', mood: 3, symptoms: ['headache'], notes: '', flagged: false };
    const saved = { ...old, id: '2', symptoms: ['vision changes'] };
    expect(parseJournalEntries([old, saved])?.map((x) => x.symptoms)).toEqual([['headache'], ['vision changes']]);
  });
  it('rejects dates after today', () => {
    expect(validateJournalDate('2026-10-11', '2026-10-11').ok).toBe(true);
    expect(validateJournalDate('2026-10-10', '2026-10-11').ok).toBe(true);
    expect(validateJournalDate('2026-12-01', '2026-10-11')).toEqual({ ok: false, error: 'The date can’t be in the future.' });
    expect(validateJournalDate('nope', '2026-10-11').ok).toBe(false);
    // Valid dates outside the range the stored journal keeps would save and then vanish on the next read.
    expect(validateJournalDate('1995-03-04', '2026-10-11')).toEqual({ ok: false, error: 'Please enter a date from 2000 onwards.' });
    expect(validateJournalDate('2000-01-01', '2026-10-11').ok).toBe(true);
  });
});

describe('sessionGuidanceLevel', () => {
  it('is an alert for 0 movements and a card otherwise, regardless of reaching 10', () => {
    expect(sessionGuidanceLevel(0)).toBe('alert');
    expect(sessionGuidanceLevel(3)).toBe('card');
    expect(sessionGuidanceLevel(10)).toBe('card');
  });
});

describe('stageAlt', () => {
  it('does not say 6 weeks for weeks 4, 5 and 7, which reuse the week 6 image', () => {
    for (const w of [4, 5, 7]) expect(stageAlt(w)).toBe('Stylised illustration of a baby in early pregnancy');
    expect(stageAlt(6)).toContain('about 6 weeks');
  });
  it('says late pregnancy for 29+ and the stage week otherwise', () => {
    expect(stageAlt(28)).toContain('about 28 weeks');
    expect(stageAlt(35)).toBe('Stylised illustration of a baby in late pregnancy');
    expect(stageAlt(9)).toContain('about 8 weeks');
  });
});

describe('guidance sources', () => {
  it('every source id used by guidance exists in SOURCES', () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    for (const g of [CONTACT_MIDWIFE, PRETERM, PATTERN_511, PAST_DUE, PRE_ECLAMPSIA, WORRIED_ABOUT_MOVEMENTS])
      for (const id of g.sources) expect(ids.has(id)).toBe(true);
  });
  it('uses NZ wording: no UK "maternity unit", and 111 only as the NZ emergency number', () => {
    for (const g of [CONTACT_MIDWIFE, PRETERM, PATTERN_511, PAST_DUE, PRE_ECLAMPSIA, WORRIED_ABOUT_MOVEMENTS]) {
      const text = JSON.stringify(g);
      expect(text).not.toMatch(/maternity unit/i);
      for (const m of text.matchAll(/111/g)) expect(text.slice(m.index! - 30, m.index)).toMatch(/emergency, call $/);
    }
  });
  it('does not credit "don’t count to 10" to Health NZ', () => {
    expect(WORRIED_ABOUT_MOVEMENTS.body).not.toMatch(/counting to 10/);
  });
});

describe('requestPersistentStorage', () => {
  it('never throws when storage.persist is unsupported or rejects', async () => {
    await expect(requestPersistentStorage()).resolves.toBeUndefined();
    const nav = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', { value: { storage: { persist: () => Promise.reject(new Error('no')) } }, configurable: true });
    await expect(requestPersistentStorage()).resolves.toBeUndefined();
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true });
  });
});
