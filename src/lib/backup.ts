/** JSON backup envelope: build, and strictly parse untrusted import files. Pure (photos aside, which are passed in). */
import { parsePhotoExport, type ImportedPhoto, type PhotoExportItem } from './photoStore';
import { readRaw, removeStored, STORAGE_TABLE, writeRaw, type WriteResult } from './storage';
import { isEpochMs, isRecord } from './validate';

export const BACKUP_APP = 'bump-tracker';
export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

const entryFor = (key: string) => STORAGE_TABLE.find((e) => e.key === key);

/** Human label for a registered storage key, or undefined if unknown. */
export const keyLabel = (key: string): string | undefined => entryFor(key)?.label;

export interface BackupEnvelope {
  app: typeof BACKUP_APP;
  schemaVersion: number;
  exportedAt: string;
  data: Record<string, unknown>;
  photos?: PhotoExportItem[];
}

/** Only registered keys are exported, even if `data` holds more. */
export function buildBackup(data: Record<string, unknown>, exportedAt: Date, photos?: PhotoExportItem[]): BackupEnvelope {
  const known: Record<string, unknown> = {};
  for (const k of Object.keys(data)) if (entryFor(k)) known[k] = data[k];
  const envelope: BackupEnvelope = {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: known,
  };
  if (photos) envelope.photos = photos;
  return envelope;
}

export const backupFilename = (date: string): string => `bump-tracker-backup-${date}.json`;

export interface ParsedBackup {
  exportedAt: string;
  /** Validated (cleaned) values keyed by logical storage name. */
  accepted: Record<string, unknown>;
  skipped: { key: string; reason: string }[];
  photos: ImportedPhoto[];
  /** Photo entries in the file that were not valid images. */
  photosSkipped: number;
}

export type ParseBackupResult = { ok: true; backup: ParsedBackup } | { ok: false; error: string };

const fail = (error: string): ParseBackupResult => ({ ok: false, error });

export function parseBackup(text: string): ParseBackupResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail('This file is not valid JSON, so it can’t be a Bump Tracker backup.');
  }
  if (!isRecord(json) || json.app !== BACKUP_APP) return fail('This doesn’t look like a Bump Tracker backup file.');
  if (json.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return fail('This backup was made by a different version of the app and can’t be imported.');
  }
  if (!isRecord(json.data)) return fail('This backup has no data in it.');
  const exportedAt = typeof json.exportedAt === 'string' && isEpochMs(Date.parse(json.exportedAt)) ? json.exportedAt : '';

  const accepted: Record<string, unknown> = {};
  const skipped: ParsedBackup['skipped'] = [];
  for (const key of Object.keys(json.data)) {
    const entry = entryFor(key);
    if (!entry) {
      skipped.push({ key, reason: 'unknown item' });
      continue;
    }
    const raw = json.data[key];
    const value = entry.validate(raw);
    // A non-empty list whose entries were ALL dropped is invalid, not an empty list.
    const allDropped = Array.isArray(raw) && raw.length > 0 && Array.isArray(value) && value.length === 0;
    if (value === null || allDropped) skipped.push({ key, reason: 'invalid data' });
    else accepted[key] = value;
  }

  let photos: ParsedBackup['photos'] = [];
  let photosSkipped = 0;
  if (json.photos !== undefined) {
    if (Array.isArray(json.photos)) {
      photos = parsePhotoExport(json.photos);
      photosSkipped = json.photos.length - photos.length;
    } else photosSkipped = 1;
  }
  if (Object.keys(accepted).length === 0 && photos.length === 0) return fail('Nothing in this file could be imported.');
  return { ok: true, backup: { exportedAt, accepted, skipped, photos, photosSkipped } };
}

/** The bits of storage applyBackup needs; `appStorage` is the real thing, tests pass a fake. */
export interface BackupStorage {
  read(name: string): string | null;
  write(name: string, raw: string): WriteResult;
  remove(name: string): void;
}

export const appStorage: BackupStorage = { read: readRaw, write: writeRaw, remove: removeStored };

export type ApplyResult = { ok: true } | { ok: false; error: string };

/**
 * Replaces every registered key with the backup's value, then runs `commitPhotos` if given. Keys absent from the
 * backup are removed; keys present but invalid (in `skipped`) keep their current value. On any failure everything
 * is rolled back, and the error says so honestly if some of it could not be restored.
 */
export async function applyBackup(backup: ParsedBackup, storage: BackupStorage, commitPhotos?: () => Promise<void>): Promise<ApplyResult> {
  const snapshot = STORAGE_TABLE.map((e) => [e.key, storage.read(e.key)] as const);
  const keep = new Set(backup.skipped.map((s) => s.key));
  // Remove everything first so half-written new values can't block restoring the old ones (which fitted before).
  const failWith = (what: string): ApplyResult => {
    for (const { key } of STORAGE_TABLE) storage.remove(key);
    const lost = snapshot.filter(([k, raw]) => raw !== null && !storage.write(k, raw).ok).map(([k]) => keyLabel(k));
    return {
      ok: false,
      error: lost.length
        ? `The import failed and some of your existing data could not be restored: ${lost.join(', ')}. Download the safety backup now.`
        : `${what}, so nothing was changed.`,
    };
  };
  for (const { key, label } of STORAGE_TABLE) {
    if (!Object.hasOwn(backup.accepted, key)) {
      if (!keep.has(key)) storage.remove(key);
      continue;
    }
    if (!storage.write(key, JSON.stringify(backup.accepted[key])).ok) return failWith(`Could not save ${label}`);
  }
  try {
    await commitPhotos?.();
  } catch {
    return failWith('Could not save the bump photos');
  }
  return { ok: true };
}
