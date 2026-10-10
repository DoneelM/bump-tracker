/** JSON backup envelope: build, and strictly parse untrusted import files. Pure (photos aside, which are passed in). */
import { BAG_SECTIONS, PLAN_SECTIONS } from '../data/checklists';
import { parseChecklist } from './checklists';
import { parseContractionState } from './contractions';
import { parseJournalEntries } from './journal';
import { parseKickSessions } from './kicks';
import { parsePhotoExport, type PhotoExportItem } from './photoStore';
import { parseProfile } from './profile';
import { parseScanEntries } from './scans';
import { STORAGE_KEYS } from './storage';
import { isRecord, type Validator } from './validate';
import { parsePrePregnancy, parseWeightEntries } from './weightGain';

export const BACKUP_APP = 'bump-tracker';
export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;

/** Every registered storage key and the validator its data must pass. Keep in step with STORAGE_KEYS. */
export const KEY_VALIDATORS: Record<(typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], Validator<unknown>> = {
  [STORAGE_KEYS.profile]: parseProfile,
  [STORAGE_KEYS.prePregnancy]: parsePrePregnancy,
  [STORAGE_KEYS.weightEntries]: parseWeightEntries,
  [STORAGE_KEYS.scanEntries]: parseScanEntries,
  [STORAGE_KEYS.contractions]: parseContractionState,
  [STORAGE_KEYS.kickSessions]: parseKickSessions,
  [STORAGE_KEYS.journal]: parseJournalEntries,
  [STORAGE_KEYS.bagChecklist]: parseChecklist(BAG_SECTIONS),
  [STORAGE_KEYS.birthPlan]: parseChecklist(PLAN_SECTIONS),
};

const isKnownKey = (k: string): k is keyof typeof KEY_VALIDATORS => Object.hasOwn(KEY_VALIDATORS, k);

export const BACKUP_KEY_LABELS: Record<string, string> = {
  [STORAGE_KEYS.profile]: 'Pregnancy details',
  [STORAGE_KEYS.prePregnancy]: 'Pre-pregnancy height and weight',
  [STORAGE_KEYS.weightEntries]: 'Weight entries',
  [STORAGE_KEYS.scanEntries]: 'Scans and appointments',
  [STORAGE_KEYS.contractions]: 'Contraction timer',
  [STORAGE_KEYS.kickSessions]: 'Baby movement sessions',
  [STORAGE_KEYS.journal]: 'Journal entries',
  [STORAGE_KEYS.bagChecklist]: 'Hospital bag checklist',
  [STORAGE_KEYS.birthPlan]: 'Birth plan',
};

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
  for (const k of Object.keys(data)) if (isKnownKey(k)) known[k] = data[k];
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
  photos: { week: number; mime: string; blob: Blob }[];
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
  const exportedAt = typeof json.exportedAt === 'string' && !Number.isNaN(Date.parse(json.exportedAt)) ? json.exportedAt : '';

  const accepted: Record<string, unknown> = {};
  const skipped: ParsedBackup['skipped'] = [];
  for (const key of Object.keys(json.data)) {
    if (!isKnownKey(key)) {
      skipped.push({ key, reason: 'unknown item' });
      continue;
    }
    const value = KEY_VALIDATORS[key](json.data[key]);
    if (value === null) skipped.push({ key, reason: 'invalid data' });
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
