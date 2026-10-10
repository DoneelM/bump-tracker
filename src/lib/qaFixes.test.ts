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
    expect([-14, -30].map(pastDueLevel)).toEqual(['overdue', 'overdue']);
  });
});

describe('journal pre-eclampsia signs', () => {
  it('flags headache, swelling and vision changes only', () => {
    for (const s of ['headache', 'swelling', 'vision changes']) expect(hasPreEclampsiaSigns(['nausea', s])).toBe(true);
    expect(hasPreEclampsiaSigns(['nausea', 'other'])).toBe(false);
    expect(hasPreEclampsiaSigns([])).toBe(false);
  });
  it('keeps vision changes before other, and old entries still parse', () => {
    expect(SYMPTOMS.indexOf('vision changes')).toBe(SYMPTOMS.length - 2);
    const old = { id: '1', date: '2026-01-01', mood: 3, symptoms: ['headache'], notes: '', flagged: false };
    const saved = { ...old, id: '2', symptoms: ['vision changes'] };
    expect(parseJournalEntries([old, saved])?.map((x) => x.symptoms)).toEqual([['headache'], ['vision changes']]);
  });
  it('rejects dates after today', () => {
    expect(validateJournalDate('2026-10-11', '2026-10-11').ok).toBe(true);
    expect(validateJournalDate('2026-10-10', '2026-10-11').ok).toBe(true);
    expect(validateJournalDate('2026-12-01', '2026-10-11')).toEqual({ ok: false, error: 'The date can’t be in the future.' });
    expect(validateJournalDate('nope', '2026-10-11').ok).toBe(false);
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
