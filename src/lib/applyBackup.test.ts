import { describe, expect, it } from 'vitest';
import { applyBackup, parseBackup, type BackupStorage, type ParsedBackup } from './backup';
import { formatMmSs } from './contractions';
import { formatDisplayDate, toDayNumber } from './dates';
import { formatDuration } from './kicks';
import { gestationalAge } from './pregnancy';
import { STORAGE_KEYS, STORAGE_TABLE } from './storage';

const make = (data: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ app: 'bump-tracker', schemaVersion: 1, exportedAt: '2026-10-11T00:00:00.000Z', data, ...extra });

describe('out-of-range values in an imported backup', () => {
  const T0 = Date.UTC(2026, 9, 11);
  const entry = (date: string) => ({ id: 'a', date, type: 'growth', notes: '', weightKg: 70 });
  const hostile = {
    [STORAGE_KEYS.profile]: { dating: { method: 'lmp', lmp: '2200-12-31' } },
    [STORAGE_KEYS.contractions]: { contractions: [{ start: 1e300, end: 1e300 + 1 }, { start: T0, end: T0 + 1000 }], activeStart: 1e300 },
    [STORAGE_KEYS.kickSessions]: [
      { id: 'k', start: 1e300, events: [] },
      { id: 'j', start: T0, events: [1e300] },
    ],
    [STORAGE_KEYS.weightEntries]: [entry('1900-01-05'), entry('2200-01-01'), entry('2026-10-01')],
    [STORAGE_KEYS.scanEntries]: [entry('1900-01-05'), entry('2026-10-01')],
    [STORAGE_KEYS.journal]: [{ id: 'j', date: '2150-01-01', mood: 3, symptoms: [], notes: '' }],
  };
  const parsed = () => {
    const r = parseBackup(make(hostile, { exportedAt: '+275760-09-13T00:00:00.000Z' }));
    if (!r.ok) throw new Error(r.error);
    return r.backup;
  };

  it('rejects or drops every out-of-range date and timestamp', () => {
    const b = parsed();
    expect(b.exportedAt).toBe('');
    expect(b.skipped.map((s) => s.key)).toEqual([STORAGE_KEYS.profile]);
    expect(b.accepted[STORAGE_KEYS.contractions]).toEqual({ contractions: [{ start: T0, end: T0 + 1000 }], activeStart: null });
    expect(b.accepted[STORAGE_KEYS.kickSessions]).toEqual([{ id: 'j', start: T0, count: 0, events: [] }]);
    expect(b.accepted[STORAGE_KEYS.weightEntries]).toHaveLength(1);
    expect(b.accepted[STORAGE_KEYS.scanEntries]).toHaveLength(1);
    expect(b.accepted[STORAGE_KEYS.journal]).toEqual([]);
  });

  it('leaves only values the format helpers can render', () => {
    const b = parsed();
    const dates = [...(b.accepted[STORAGE_KEYS.weightEntries] as { date: string }[]), ...(b.accepted[STORAGE_KEYS.scanEntries] as { date: string }[])];
    for (const { date } of dates) {
      expect(() => formatDisplayDate(date)).not.toThrow();
      expect(() => gestationalAge('2026-12-06', date)).not.toThrow();
      expect(() => toDayNumber(date)).not.toThrow();
    }
    const c = (b.accepted[STORAGE_KEYS.contractions] as { contractions: { start: number; end: number }[] }).contractions[0]!;
    expect(() => new Intl.DateTimeFormat('en-NZ', { timeStyle: 'short' }).format(c.start)).not.toThrow();
    expect(() => formatMmSs(c.end - c.start)).not.toThrow();
    expect(() => formatDuration(c.end - c.start)).not.toThrow();
  });
});

/** In-memory storage; `failOn` makes the next write of that key fail once. */
function fakeStorage(initial: Record<string, string>, failOn?: string) {
  const data = new Map(Object.entries(initial));
  let fail = failOn;
  const storage: BackupStorage = {
    read: (k) => data.get(k) ?? null,
    write: (k, raw) => {
      if (k === fail) {
        fail = undefined;
        return { ok: false, error: 'full' };
      }
      data.set(k, raw);
      return { ok: true };
    },
    remove: (k) => void data.delete(k),
  };
  return { data, storage };
}

describe('applyBackup', () => {
  const backup = (accepted: Record<string, unknown>): ParsedBackup => ({ exportedAt: '', accepted, skipped: [], photos: [], photosSkipped: 0 });
  const original = { [STORAGE_KEYS.weightEntries]: '"old-weights"', [STORAGE_KEYS.journal]: '"old-journal"', [STORAGE_KEYS.birthPlan]: '"old-plan"' };

  it('writes backup keys and removes the registered keys it does not contain', async () => {
    const { data, storage } = fakeStorage(original);
    const r = await applyBackup(backup({ [STORAGE_KEYS.weightEntries]: ['new'] }), storage);
    expect(r).toEqual({ ok: true });
    expect([...data.entries()]).toEqual([[STORAGE_KEYS.weightEntries, '["new"]']]);
  });

  it('rolls back to the original values when a write fails midway', async () => {
    const accepted = Object.fromEntries(STORAGE_TABLE.map((e) => [e.key, 'new']));
    const { data, storage } = fakeStorage(original, STORAGE_KEYS.journal);
    const r = await applyBackup(backup(accepted), storage);
    expect(r.ok).toBe(false);
    expect(Object.fromEntries(data)).toEqual(original);
  });

  it('rolls back when the photo commit fails', async () => {
    const { data, storage } = fakeStorage(original);
    const r = await applyBackup(backup({ [STORAGE_KEYS.profile]: 'new' }), storage, () => Promise.reject(new Error('tx failed')));
    expect(r.ok).toBe(false);
    expect(Object.fromEntries(data)).toEqual(original);
  });
});
