import { describe, expect, it } from 'vitest';
import { backupFilename, buildBackup, parseBackup, safetyBackupFilename } from './backup';
import { STORAGE_KEYS } from './storage';

const profile = { dating: { method: 'lmp', lmp: '2026-03-01' }, dueDate: '2000-01-01', nickname: 'Bean', updatedAt: '' };
const make = (data: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ app: 'bump-tracker', schemaVersion: 1, exportedAt: '2026-10-11T00:00:00.000Z', data, ...extra });

describe('buildBackup', () => {
  it('wraps only registered keys in a versioned envelope', () => {
    const b = buildBackup({ [STORAGE_KEYS.profile]: profile, stray: 1 }, new Date('2026-10-11T01:00:00Z'));
    expect(b).toMatchObject({ app: 'bump-tracker', schemaVersion: 1, exportedAt: '2026-10-11T01:00:00.000Z' });
    expect(Object.keys(b.data)).toEqual([STORAGE_KEYS.profile]);
    expect('photos' in b).toBe(false);
  });
  it('includes photos only when given', () => {
    expect(buildBackup({}, new Date(), []).photos).toEqual([]);
  });
  it('names the file by date', () => expect(backupFilename('2026-10-11')).toBe('bump-tracker-backup-2026-10-11.json'));
  it('names the safety backup differently', () => expect(safetyBackupFilename('2026-10-11')).toBe('bump-tracker-safety-backup-2026-10-11.json'));
});

describe('parseBackup', () => {
  it('imports valid keys, recomputing the due date', () => {
    const r = parseBackup(make({ [STORAGE_KEYS.profile]: profile }));
    expect(r.ok && (r.backup.accepted[STORAGE_KEYS.profile] as { dueDate: string }).dueDate).toBe('2026-12-06');
  });
  it('skips unknown keys and invalid values and reports them', () => {
    const text = make({ [STORAGE_KEYS.profile]: profile, [STORAGE_KEYS.weightEntries]: 'nope', evil: 1 }).replace(
      '"evil"',
      '"__proto__":{"x":1},"evil"',
    );
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.backup.accepted)).toEqual([STORAGE_KEYS.profile]);
      expect(r.backup.skipped.map((s) => s.key).sort()).toEqual(['__proto__', 'evil', STORAGE_KEYS.weightEntries].sort());
      expect(({} as Record<string, unknown>).x).toBeUndefined();
    }
  });
  it('rejects bad envelopes', () => {
    const bad = ['not json', '[]', make({}, { app: 'other' }), make({}, { schemaVersion: 2 }), '{"app":"bump-tracker","schemaVersion":1}'];
    for (const text of bad) expect(parseBackup(text).ok).toBe(false);
  });
  it('rejects a file with nothing importable', () => {
    expect(parseBackup(make({ evil: 1 })).ok).toBe(false);
  });
  it('drops malformed photos', () => {
    const photos = [{ week: 12, mime: 'image/png', dataUrl: 'data:text/html;base64,AAAA' }];
    const r = parseBackup(make({ [STORAGE_KEYS.profile]: profile }, { photos }));
    expect(r.ok && r.backup.photos.length).toBe(0);
    expect(r.ok && r.backup.photosSkipped).toBe(1);
  });
  it('reports the weeks of photos rejected by the signature check (N4)', () => {
    const photos = [
      { week: 8, mime: 'image/png', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' },
      { week: 20, mime: 'image/png', dataUrl: `data:image/png;base64,${btoa('<svg/>')}` },
    ];
    const r = parseBackup(make({ [STORAGE_KEYS.profile]: profile }, { photos }));
    expect(r.ok && r.backup.photos.map((p) => p.week)).toEqual([8]);
    expect(r.ok && r.backup.photoRejectedWeeks).toEqual([20]);
  });
  it('accepts a valid photo', () => {
    const photos = [{ week: 12, mime: 'image/png', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }];
    const r = parseBackup(make({ [STORAGE_KEYS.profile]: profile }, { photos }));
    expect(r.ok && r.backup.photos[0]?.week).toBe(12);
  });
});
