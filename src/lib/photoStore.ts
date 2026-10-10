/**
 * Bump-photo storage in IndexedDB (raw API, no wrapper library).
 * Blobs stay on this device; nothing is uploaded anywhere.
 */
import { isLocalDate, type LocalDate } from './dates';
import { cleanString, isIntInRange, isRecord } from './validate';

const DB_NAME = 'bump-tracker';
const DB_VERSION = 1;
const STORE = 'photos';

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const MAX_CAPTION_LENGTH = 200;

export interface PhotoMeta {
  id: string;
  /** Calendar date the photo was taken (user-editable). */
  takenOn: LocalDate;
  /** Completed pregnancy week at `takenOn`, if known. */
  week: number | null;
  caption: string;
  type: string;
  size: number;
  createdAt: string; // ISO timestamp
}

export interface PhotoRecord extends PhotoMeta {
  blob: Blob;
}

export type PhotoValidation = { ok: true } | { ok: false; error: string };

export function validatePhotoFile(file: { type: string; size: number }): PhotoValidation {
  if (!(ALLOWED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: 'Please choose a JPEG, PNG or WebP image.' };
  }
  if (file.size <= 0) return { ok: false, error: 'This file is empty.' };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'This photo is larger than 15 MB.' };
  return { ok: true };
}

/** Validates a record read back from IndexedDB. */
export function parsePhotoRecord(value: unknown): PhotoRecord | null {
  if (!isRecord(value)) return null;
  const { id, takenOn, week, caption, type, size, createdAt, blob } = value;
  if (typeof id !== 'string' || id.length === 0 || id.length > 100) return null;
  if (!isLocalDate(takenOn)) return null;
  if (week !== null && !isIntInRange(week, 0, 45)) return null;
  const cleanCaption = cleanString(caption, MAX_CAPTION_LENGTH);
  if (cleanCaption === null) return null;
  if (typeof type !== 'string' || !(ALLOWED_PHOTO_TYPES as readonly string[]).includes(type)) return null;
  if (!isIntInRange(size, 1, MAX_PHOTO_BYTES)) return null;
  if (typeof createdAt !== 'string') return null;
  if (typeof Blob === 'undefined' || !(blob instanceof Blob)) return null;
  return { id, takenOn, week, caption: cleanCaption, type, size, createdAt, blob };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('takenOn', 'takenOn');
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // Let future versions upgrade the schema from another tab.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error ?? new Error('Could not open photo storage.'));
    req.onblocked = () => reject(new Error('Photo storage is blocked by another open tab.'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Photo storage request failed.'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(STORE, mode);
  const result = requestToPromise(fn(tx.objectStore(STORE)));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Photo storage transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Photo storage transaction aborted.'));
  });
  return result;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function addPhoto(
  blob: Blob,
  meta: { takenOn: LocalDate; week: number | null; caption: string },
): Promise<PhotoMeta> {
  const check = validatePhotoFile(blob);
  if (!check.ok) throw new Error(check.error);
  const record: PhotoRecord = {
    id: newId(),
    takenOn: meta.takenOn,
    week: meta.week,
    caption: meta.caption.trim().slice(0, MAX_CAPTION_LENGTH),
    type: blob.type,
    size: blob.size,
    createdAt: new Date().toISOString(),
    blob,
  };
  if (!parsePhotoRecord(record)) throw new Error('Invalid photo details.');
  await withStore('readwrite', (s) => s.put(record));
  const { blob: _blob, ...rest } = record;
  return rest;
}

export async function getPhoto(id: string): Promise<PhotoRecord | null> {
  const value = await withStore('readonly', (s) => s.get(id) as IDBRequest<unknown>);
  return parsePhotoRecord(value);
}

/** All valid photos, oldest first. */
export async function listPhotos(): Promise<PhotoRecord[]> {
  const values = await withStore('readonly', (s) => s.index('takenOn').getAll() as IDBRequest<unknown[]>);
  return values.map(parsePhotoRecord).filter((p): p is PhotoRecord => p !== null);
}

export async function updatePhotoMeta(
  id: string,
  changes: Partial<Pick<PhotoMeta, 'takenOn' | 'week' | 'caption'>>,
): Promise<void> {
  const existing = await getPhoto(id);
  if (!existing) throw new Error('Photo not found.');
  const updated = parsePhotoRecord({ ...existing, ...changes });
  if (!updated) throw new Error('Invalid photo details.');
  await withStore('readwrite', (s) => s.put(updated));
}

export async function deletePhoto(id: string): Promise<void> {
  await withStore('readwrite', (s) => s.delete(id));
}

export async function clearPhotos(): Promise<void> {
  await withStore('readwrite', (s) => s.clear());
}
