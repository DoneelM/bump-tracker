/**
 * Bump-photo storage in IndexedDB (raw API, no wrapper library).
 * One photo per gestational week (record id is derived from the week). Blobs and their small metadata
 * (week, date added) live together so they can never get out of sync. Nothing is uploaded anywhere.
 */
import { isPlausibleDate, todayLocal, type LocalDate } from './dates';
import { isIntInRange, isRecord } from './validate';

const DB_NAME = 'bump-tracker';
const DB_VERSION = 1;
const STORE = 'photos';

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PHOTO_BYTES = 30 * 1024 * 1024; // fits 48-50 MP phone JPEGs; the 50 MP pixel cap is the memory guard
export const MIN_PHOTO_WEEK = 1;
export const MAX_PHOTO_WEEK = 45;
export const MAX_PHOTO_EDGE = 1280;
export const MAX_PHOTO_PIXELS = 50_000_000;
export const PHOTO_QUALITY = 0.82;

export interface PhotoMeta {
  id: string;
  /** Calendar date the photo was added. */
  takenOn: LocalDate;
  /** Completed pregnancy week the photo belongs to. */
  week: number | null;
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
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'This photo is larger than 30 MB.' };
  return { ok: true };
}

/** Validates a record read back from IndexedDB. */
export function parsePhotoRecord(value: unknown): PhotoRecord | null {
  if (!isRecord(value)) return null;
  const { id, takenOn, week, type, size, createdAt, blob } = value;
  if (typeof id !== 'string' || id.length === 0 || id.length > 100) return null;
  if (!isPlausibleDate(takenOn)) return null;
  if (week !== null && !isIntInRange(week, 0, 45)) return null;
  if (typeof type !== 'string' || !(ALLOWED_PHOTO_TYPES as readonly string[]).includes(type)) return null;
  if (!isIntInRange(size, 1, MAX_PHOTO_BYTES)) return null;
  if (typeof createdAt !== 'string') return null;
  if (typeof Blob === 'undefined' || !(blob instanceof Blob)) return null;
  return { id, takenOn, week, type, size, createdAt, blob };
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
      // Existing v1 databases keep their unused `takenOn` index; it is harmless, so no version bump.
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
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

const txDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Photo storage transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Photo storage transaction aborted.'));
  });

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(STORE, mode);
  const result = requestToPromise(fn(tx.objectStore(STORE)));
  await txDone(tx);
  return result;
}

const weekId = (week: number) => `week-${week}`;

/** Target size so the long edge is at most `maxEdge` (never upscales). */
export function fitWithin(width: number, height: number, maxEdge = MAX_PHOTO_EDGE): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** True when an image is too many pixels to decode safely (decompression-bomb guard). */
export const exceedsPixelLimit = (width: number, height: number): boolean => width * height > MAX_PHOTO_PIXELS;

/** Reads width/height from the first bytes of a PNG, JPEG or WebP without decoding; null if not found. */
export function readImageSize(b: Uint8Array): { width: number; height: number } | null {
  const be16 = (i: number) => (b[i]! << 8) | b[i + 1]!;
  const be32 = (i: number) => be16(i) * 65536 + be16(i + 2);
  const le16 = (i: number) => b[i]! | (b[i + 1]! << 8);
  const le24 = (i: number) => le16(i) | (b[i + 2]! << 16);
  const tag = (i: number, s: string) => [...s].every((c, k) => b[i + k] === c.charCodeAt(0));
  if (b.length >= 24 && b[0] === 0x89 && tag(1, 'PNG')) return { width: be32(16), height: be32(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1]!;
      if (m === 0xff) i++; // fill byte
      else if (m === 0x01 || (m >= 0xd0 && m <= 0xd9)) i += 2; // no length field
      else if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: be16(i + 7), height: be16(i + 5) };
      else i += 2 + be16(i + 2);
    }
    return null;
  }
  if (b.length >= 30 && tag(0, 'RIFF') && tag(8, 'WEBP')) {
    if (tag(12, 'VP8X')) return { width: le24(24) + 1, height: le24(27) + 1 };
    if (tag(12, 'VP8L') && b[20] === 0x2f) {
      const bits = (le16(21) | (le16(23) << 16)) >>> 0;
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (tag(12, 'VP8 ') && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return { width: le16(26) & 0x3fff, height: le16(28) & 0x3fff };
  }
  return null;
}

/**
 * Validates, downscales (max 1280 px) and re-encodes as JPEG. Re-encoding through a canvas drops all
 * metadata, including location EXIF.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  const check = validatePhotoFile(file);
  if (!check.ok) throw new Error(check.error);
  // The whole file (max 30 MB) is scanned so header padding can't hide the size; an unreadable header fails closed.
  const size = readImageSize(new Uint8Array(await file.arrayBuffer()));
  if (!size) throw new Error('This image couldn’t be read.');
  if (exceedsPixelLimit(size.width, size.height)) throw new Error('This image is too large (over 50 megapixels).');
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
function makeRecord(blob: Blob, week: number, takenOn: LocalDate): PhotoRecord {
  const record = parsePhotoRecord({
    id: weekId(week),
    takenOn,
    week,
    type: blob.type,
    size: blob.size,
    createdAt: new Date().toISOString(),
    blob,
  });
  if (!record || !isIntInRange(week, MIN_PHOTO_WEEK, MAX_PHOTO_WEEK)) throw new Error('Invalid photo details.');
  return record;
}

export async function putWeekPhoto(blob: Blob, week: number, takenOn: LocalDate): Promise<void> {
  const record = makeRecord(blob, week, takenOn);
  await withStore('readwrite', (s) => s.put(record));
}

/** Replaces every photo in ONE transaction: on any failure the old photos stay as they were. */
export async function replaceAllPhotos(list: readonly { blob: Blob; week: number; takenOn: LocalDate }[]): Promise<void> {
  const records = list.map((p) => makeRecord(p.blob, p.week, p.takenOn));
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  store.clear();
  for (const r of records) store.put(r);
  await txDone(tx);
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
  /** Date the photo was added (optional in older backups). */
  takenOn?: LocalDate;
}

export interface ImportedPhoto {
  week: number;
  mime: string;
  blob: Blob;
  takenOn: LocalDate;
}

/** Image type from the first bytes (JPEG, PNG or WebP), or null. */
export function sniffImageType(b: Uint8Array): (typeof ALLOWED_PHOTO_TYPES)[number] | null {
  const at = (i: number, s: string) => [...s].every((c, k) => b[i + k] === c.charCodeAt(0));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && at(1, 'PNG')) return 'image/png';
  if (at(0, 'RIFF') && at(8, 'WEBP')) return 'image/webp';
  return null;
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
  return Promise.all(photos.map(async (p) => ({ week: p.week!, mime: p.type, dataUrl: await blobToDataUrl(p.blob), takenOn: p.takenOn })));
}

/**
 * Validates an untrusted export list; invalid items are dropped, later duplicates of a week win.
 * Weeks whose only items were invalid are added to `rejectedWeeks`, so the device keeps its photo for them.
 */
export function parsePhotoExport(list: unknown, rejectedWeeks?: Set<number>): ImportedPhoto[] {
  if (!Array.isArray(list)) return [];
  const today = todayLocal();
  const byWeek = new Map<number, ImportedPhoto>();
  const rejected: number[] = [];
  for (const item of list) {
    if (!isRecord(item) || !isIntInRange(item.week, MIN_PHOTO_WEEK, MAX_PHOTO_WEEK)) continue;
    rejected.push(item.week); // ignored below if this week ends up with a valid photo
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
    if (sniffImageType(bytes) !== m[1]) continue;
    const takenOn = isPlausibleDate(item.takenOn) ? item.takenOn : today;
    byWeek.set(item.week, { week: item.week, mime: m[1]!, blob: new Blob([bytes], { type: m[1]! }), takenOn });
  }
  for (const w of rejected) if (!byWeek.has(w)) rejectedWeeks?.add(w);
  return [...byWeek.values()];
}

/** What a restore does to device photos: nothing if no backup photo decoded, else backup photos plus kept weeks. */
export function planPhotoRestore(existingWeeks: readonly number[], decodedWeeks: readonly number[], skippedWeeks: readonly number[]) {
  if (decodedWeeks.length === 0) return { replace: false, keptWeeks: [] as number[], finalCount: existingWeeks.length };
  const keptWeeks = existingWeeks.filter((w) => skippedWeeks.includes(w));
  return { replace: true, keptWeeks, finalCount: decodedWeeks.length + keptWeeks.length };
}

/**
 * Runs imported photos through the same pipeline as uploads (decode, downscale, re-encode, which strips
 * EXIF/GPS and rejects non-images). Photos that fail are dropped and their weeks reported. Nothing is stored here.
 */
export async function importPhotos(items: readonly ImportedPhoto[]) {
  const ready: { blob: Blob; week: number; takenOn: LocalDate }[] = [];
  const skippedWeeks: number[] = [];
  for (const p of items) {
    try {
      ready.push({ blob: await preparePhoto(new File([p.blob], 'import', { type: p.mime })), week: p.week, takenOn: p.takenOn });
    } catch {
      skippedWeeks.push(p.week); // not a decodable image
    }
  }
  return { ready, skippedWeeks };
}
