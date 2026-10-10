/**
 * Bump-photo storage in IndexedDB (raw API, no wrapper library).
 * One photo per gestational week (record id is derived from the week). Blobs and their small metadata
 * (week, date added) live together so they can never get out of sync. Nothing is uploaded anywhere.
 */
import { isLocalDate, type LocalDate } from './dates';
import { cleanString, isIntInRange, isRecord } from './validate';

const DB_NAME = 'bump-tracker';
const DB_VERSION = 1;
const STORE = 'photos';

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const MAX_CAPTION_LENGTH = 200;
export const MIN_PHOTO_WEEK = 1;
export const MAX_PHOTO_WEEK = 45;
export const MAX_PHOTO_EDGE = 1280;
export const PHOTO_QUALITY = 0.82;

export interface PhotoMeta {
  id: string;
  /** Calendar date the photo was added. */
  takenOn: LocalDate;
  /** Completed pregnancy week the photo belongs to. */
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
    return { ok: false, error: 'Please choose a JPEG, PNG or WebP image. (HEIC photos: set your camera to “Most compatible”.)' };
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

const weekId = (week: number) => `week-${week}`;

/** Target size so the long edge is at most `maxEdge` (never upscales). */
export function fitWithin(width: number, height: number, maxEdge = MAX_PHOTO_EDGE): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Validates, downscales (max 1280 px) and re-encodes as JPEG. Re-encoding through a canvas drops all
 * metadata, including location EXIF.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  const check = validatePhotoFile(file);
  if (!check.ok) throw new Error(check.error);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be read. Please try a JPEG, PNG or WebP photo.');
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process this image.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY));
  if (!out) throw new Error('Could not process this image.');
  return out;
}

/** Stores (or replaces) the single photo for a gestational week. `takenOn` is the date added. */
export async function putWeekPhoto(blob: Blob, week: number, takenOn: LocalDate): Promise<void> {
  const record = parsePhotoRecord({
    id: weekId(week),
    takenOn,
    week,
    caption: '',
    type: blob.type,
    size: blob.size,
    createdAt: new Date().toISOString(),
    blob,
  });
  if (!record || !isIntInRange(week, MIN_PHOTO_WEEK, MAX_PHOTO_WEEK)) throw new Error('Invalid photo details.');
  await withStore('readwrite', (s) => s.put(record));
}

/** All valid week photos, sorted by week. */
export async function listPhotos(): Promise<PhotoRecord[]> {
  const values = await withStore('readonly', (s) => s.getAll() as IDBRequest<unknown[]>);
  return values
    .map(parsePhotoRecord)
    .filter((p): p is PhotoRecord => p !== null && p.week !== null)
    .sort((a, b) => a.week! - b.week!);
}

export async function deletePhoto(id: string): Promise<void> {
  await withStore('readwrite', (s) => s.delete(id));
}

export const deleteWeekPhoto = (week: number) => deletePhoto(weekId(week));

export async function clearPhotos(): Promise<void> {
  await withStore('readwrite', (s) => s.clear());
}

export interface PhotoExportItem {
  week: number;
  mime: string;
  dataUrl: string;
}

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error('Could not read photo.'));
    r.readAsDataURL(blob);
  });
}

/** Photos as base64 data URLs. Only call this when the user ticked "include photos". */
export async function exportPhotos(): Promise<PhotoExportItem[]> {
  const photos = await listPhotos();
  return Promise.all(photos.map(async (p) => ({ week: p.week!, mime: p.type, dataUrl: await blobToDataUrl(p.blob) })));
}

/** Validates an untrusted export list; invalid items are dropped, later duplicates of a week win. */
export function parsePhotoExport(list: unknown): { week: number; mime: string; blob: Blob }[] {
  if (!Array.isArray(list)) return [];
  const byWeek = new Map<number, { week: number; mime: string; blob: Blob }>();
  for (const item of list) {
    if (!isRecord(item) || !isIntInRange(item.week, MIN_PHOTO_WEEK, MAX_PHOTO_WEEK)) continue;
    if (typeof item.dataUrl !== 'string' || item.dataUrl.length > MAX_PHOTO_BYTES * 1.4) continue;
    const m = DATA_URL_RE.exec(item.dataUrl);
    if (!m || item.mime !== m[1]) continue;
    let bin: string;
    try {
      bin = atob(m[2]!);
    } catch {
      continue;
    }
    if (bin.length === 0 || bin.length > MAX_PHOTO_BYTES) continue;
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    byWeek.set(item.week, { week: item.week, mime: m[1]!, blob: new Blob([bytes], { type: m[1]! }) });
  }
  return [...byWeek.values()];
}

/** Imports validated photos (replacing any for the same week). Returns how many were stored. */
export async function importPhotos(list: unknown, takenOn: LocalDate): Promise<number> {
  const items = parsePhotoExport(list);
  for (const p of items) await putWeekPhoto(p.blob, p.week, takenOn);
  return items.length;
}
