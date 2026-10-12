/**
 * Versioned, typed localStorage wrapper for small structured data.
 *
 * Keys are namespaced as `bt:v<SCHEMA_VERSION>:<name>` so we can migrate or wipe
 * our own data without touching anything else on the origin. Values are JSON.
 * Every read goes through a Validator, so corrupt or tampered data falls back to
 * a default instead of crashing the UI.
 */
import { BAG_SECTIONS, PLAN_SECTIONS } from '../data/checklists';
import { parseBabyNames } from './babyNames';
import { parseBabyLog } from './babyLog';
import { parseCareTeam } from './careTeam';
import { parseChecklist } from './checklists';
import { parseCheckIns } from './checkins';
import { parseContractionState } from './contractions';
import { parseImmunisationsDone } from './immunisations';
import { parseJournalEntries } from './journal';
import { parseKickSessions } from './kicks';
import { parseBpReadings, parseGlucoseReadings, parseTargets } from './monitoring';
import { parseProfile } from './profile';
import { parseQuestions } from './questions';
import { parseScanEntries } from './scans';
import { parseSupplements } from './supplements';
import type { Validator } from './validate';
import { parsePrePregnancy, parseWeightEntries } from './weightGain';

export const KEY_PREFIX = 'bt:';
// Bumping this needs a migration step first: keys and exportAll are per-version, so v1 data would be hidden.
export const SCHEMA_VERSION = 1;

/** The one registry of stored data: logical key, backup label and validator. Add new keys here only. */
const REGISTRY = {
  profile: { key: 'profile', label: 'Pregnancy details', validate: parseProfile },
  prePregnancy: { key: 'weight-pre-pregnancy', label: 'Pre-pregnancy height and weight', validate: parsePrePregnancy },
  weightEntries: { key: 'weight-entries', label: 'Weight entries', validate: parseWeightEntries },
  scanEntries: { key: 'scan-entries', label: 'Scans and appointments', validate: parseScanEntries },
  contractions: { key: 'contractions', label: 'Contraction timer', validate: parseContractionState },
  kickSessions: { key: 'kick-sessions', label: 'Baby movement sessions', validate: parseKickSessions },
  journal: { key: 'journal-entries', label: 'Journal entries', validate: parseJournalEntries },
  bagChecklist: { key: 'checklist-bag', label: 'Hospital bag checklist', validate: parseChecklist(BAG_SECTIONS) },
  birthPlan: { key: 'checklist-birth-plan', label: 'Birth plan', validate: parseChecklist(PLAN_SECTIONS) },
  careTeam: { key: 'care-team', label: 'Care team contacts', validate: parseCareTeam },
  questions: { key: 'midwife-questions', label: 'Questions for my midwife', validate: parseQuestions },
  bpReadings: { key: 'bp-readings', label: 'Blood pressure readings', validate: parseBpReadings },
  glucoseReadings: { key: 'glucose-readings', label: 'Glucose readings', validate: parseGlucoseReadings },
  monitoringTargets: { key: 'monitoring-targets', label: 'Home monitoring targets', validate: parseTargets },
  babyNames: { key: 'baby-names', label: 'Baby name shortlist', validate: parseBabyNames },
  supplements: { key: 'supplements', label: 'Supplements taken', validate: parseSupplements },
  babyLog: { key: 'baby-log', label: 'Baby log (feeds, nappies, sleep)', validate: parseBabyLog },
  immunisations: { key: 'immunisations', label: 'Immunisations done', validate: parseImmunisationsDone },
  checkIns: { key: 'parent-checkins', label: 'How are you going check-ins', validate: parseCheckIns },
} as const;

export interface StorageEntry {
  key: string;
  label: string;
  validate: Validator<unknown>;
}

export const STORAGE_TABLE: readonly StorageEntry[] = Object.values(REGISTRY);

export const STORAGE_KEYS = Object.fromEntries(Object.entries(REGISTRY).map(([name, e]) => [name, e.key])) as {
  [N in keyof typeof REGISTRY]: (typeof REGISTRY)[N]['key'];
};

/** Event fired on `window` when this tab writes a key, so hooks in the same tab re-read. */
export const STORAGE_EVENT = 'bt:storage';

export function fullKey(name: string): string {
  return `${KEY_PREFIX}v${SCHEMA_VERSION}:${name}`;
}

function getStorage(): Storage | null {
  try {
    const s = globalThis.localStorage;
    return s ?? null;
  } catch {
    // Accessing localStorage can throw (e.g. disabled cookies / privacy modes).
    return null;
  }
}

export function isStorageAvailable(): boolean {
  return getStorage() !== null;
}

/** Raw string for a key (useful as a cheap, stable snapshot for useSyncExternalStore). */
export function readRaw(name: string): string | null {
  try {
    return getStorage()?.getItem(fullKey(name)) ?? null;
  } catch {
    return null;
  }
}

/** Parses + validates a raw JSON string. */
export function parseStored<T>(raw: string | null, validate: Validator<T>): T | null {
  if (raw === null) return null;
  try {
    return validate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export type WriteResult = { ok: true } | { ok: false; error: string };

function notify(name: string): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key: fullKey(name) } }));
  }
}

export function writeRaw(name: string, raw: string): WriteResult {
  const storage = getStorage();
  if (!storage) return { ok: false, error: 'Browser storage is not available.' };
  try {
    storage.setItem(fullKey(name), raw);
  } catch {
    return { ok: false, error: 'Could not save. Your browser storage may be full.' };
  }
  notify(name);
  return { ok: true };
}

export const writeStored = (name: string, value: unknown): WriteResult => writeRaw(name, JSON.stringify(value));

export function removeStored(name: string): void {
  try {
    getStorage()?.removeItem(fullKey(name));
  } catch {
    // ignore
  }
  notify(name);
}

/** All of this app's keys currently in storage (any schema version). */
export function listAppKeys(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k !== null && k.startsWith(KEY_PREFIX)) keys.push(k);
  }
  return keys;
}

/** Snapshot of all current-version data, keyed by logical name (for backup/export). */
export function exportAll(): Record<string, unknown> {
  const storage = getStorage();
  const prefix = fullKey('');
  const out: Record<string, unknown> = {};
  if (!storage) return out;
  for (const k of listAppKeys()) {
    if (!k.startsWith(prefix)) continue;
    try {
      out[k.slice(prefix.length)] = JSON.parse(storage.getItem(k) ?? 'null');
    } catch {
      // skip corrupt entries
    }
  }
  return out;
}

/** Asks the browser not to evict our data. Best effort: browsers may decide silently, so also call it after user actions. Never throws. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    // unsupported or refused: nothing to do
  }
}

/** Removes every `bt:` key (all versions). Does not touch photos in IndexedDB. */
export function clearAllStored(): void {
  const storage = getStorage();
  if (!storage) return;
  for (const k of listAppKeys()) storage.removeItem(k);
  notify('*');
}
