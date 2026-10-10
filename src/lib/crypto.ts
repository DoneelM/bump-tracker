/** Vault crypto (WebCrypto + native gzip only): DEK, padded AES-GCM vault blobs, recovery-code codec and key wrapping. */
import { MAX_IMPORT_BYTES, type BackupEnvelope } from './backup';

type Bytes = Uint8Array<ArrayBuffer>; // what WebCrypto's BufferSource accepts
const VERSION = 1;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const MIN_BUCKET = 16 * 1024;
const MAX_BUCKET = 1024 * 1024;
export const MAX_VAULT_BYTES = 1 + IV_BYTES + MAX_BUCKET + TAG_BYTES;

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();

/** What the sync UI shows when the vault is over the cap (this error, or the server's 413). MVP: no chunking. */
export const SYNC_PAUSED_TOO_LARGE = 'Sync paused: your data is too large to sync, it’s still safe on this device.';

export class VaultTooLargeError extends Error {
  constructor() {
    super(SYNC_PAUSED_TOO_LARGE);
    this.name = 'VaultTooLargeError';
  }
}

// ---------------------------------------------------------------------------
// DEK

/**
 * A new DEK wrapped under each KEK (recovery code first, then any PRF KEKs), plus the non-extractable copy to keep
 * on the device. The extractable key never leaves this function. At least one KEK, or the data could never be recovered.
 */
export async function createDek(keks: CryptoKey[]): Promise<{ dek: CryptoKey; wraps: Bytes[] }> {
  if (!keks.length) throw new Error('createDek needs at least one key-encryption key.');
  const extractable = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const wraps = await Promise.all(keks.map(async (kek) => new Uint8Array(await subtle.wrapKey('raw', extractable, kek, 'AES-KW'))));
  return { dek: await unwrapDek(wraps[0]!, keks[0]!), wraps };
}

/** The returned key is non-extractable: this is the copy kept in IndexedDB. */
export const unwrapDek = (wrapped: Bytes, kek: CryptoKey): Promise<CryptoKey> =>
  subtle.unwrapKey('raw', wrapped, kek, 'AES-KW', { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

// ---------------------------------------------------------------------------
// Vault

async function gzip(data: Bytes): Promise<Bytes> {
  return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
}

/** Gunzip with an output cap. 4 KiB input slices, because WebKit inflates a whole-buffer input before the counter sees a byte. */
async function gunzipCapped(gz: Bytes, max = MAX_IMPORT_BYTES): Promise<Bytes> {
  let off = 0;
  let n = 0;
  const src = new ReadableStream<Bytes>({
    pull(c) {
      if (off >= gz.length) return c.close();
      c.enqueue(gz.slice(off, off + 4096));
      off += 4096;
    },
  });
  const cap = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, c) {
      n += chunk.length;
      if (n > max) throw new Error('cap');
      c.enqueue(chunk);
    },
  });
  try {
    return new Uint8Array(await new Response(src.pipeThrough(new DecompressionStream('gzip')).pipeThrough(cap)).arrayBuffer());
  } catch (e) {
    // Engines report the abort with different errors, so check the counter.
    if (n > max) throw new Error('Vault data is too large.');
    throw e;
  }
}

/** ISO/IEC 7816-4 padding (0x80, then zeros) to a power-of-two bucket, 16 KiB to 1 MiB. */
export function pad(gz: Bytes): Bytes {
  if (gz.length + 1 > MAX_BUCKET) throw new VaultTooLargeError();
  let bucket = MIN_BUCKET;
  while (bucket < gz.length + 1) bucket *= 2;
  const padded = new Uint8Array(bucket);
  padded.set(gz);
  padded[gz.length] = 0x80;
  return padded;
}

/** The last non-zero byte must be the 0x80 marker. Data may itself end in zeros (every gzip trailer can). */
export function unpad(padded: Bytes): Bytes {
  let end = padded.length;
  while (end > 0 && padded[end - 1] === 0) end--;
  if (end === 0 || padded[end - 1] !== 0x80) throw new Error('Vault padding is invalid.');
  return padded.subarray(0, end - 1);
}

const aad = (userId: string) => enc.encode(`${userId}|vault|${VERSION}`);

export async function encryptVault(dek: CryptoKey, userId: string, envelope: BackupEnvelope): Promise<Bytes> {
  const padded = pad(await gzip(enc.encode(JSON.stringify(envelope))));

  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: TAG_BYTES * 8, additionalData: aad(userId) }, dek, padded),
  );
  const wire = new Uint8Array(1 + IV_BYTES + ct.length);
  wire[0] = VERSION;
  wire.set(iv, 1);
  wire.set(ct, 1 + IV_BYTES);
  return wire;
}

/** Returns the envelope's JSON text; the caller feeds it to parseBackup. */
export async function decryptVault(dek: CryptoKey, userId: string, wire: Bytes): Promise<string> {
  if (wire.length < 1 + IV_BYTES + TAG_BYTES + 1) throw new Error('Vault data is too short.');
  if (wire[0] !== VERSION) throw new Error('Unsupported vault version.');
  const iv = wire.subarray(1, 1 + IV_BYTES);
  let padded: Bytes;
  try {
    padded = new Uint8Array(
      await subtle.decrypt({ name: 'AES-GCM', iv, tagLength: TAG_BYTES * 8, additionalData: aad(userId) }, dek, wire.subarray(1 + IV_BYTES)),
    );
  } catch {
    throw new Error('Could not decrypt the vault (wrong key, wrong account or damaged data).');
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(await gunzipCapped(unpad(padded)));
}

// ---------------------------------------------------------------------------
// Recovery code: 128 bits as 26 RFC 4648 base32 characters (the last 2 bits are zero padding)

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const CODE_BYTES = 16;
const CODE_CHARS = 26;

function toBase32(bytes: Bytes): string {
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(acc >> (bits - 5)) & 31];
      bits -= 5;
    }
    acc &= (1 << bits) - 1;
  }
  return bits ? out + B32[(acc << (5 - bits)) & 31] : out;
}

export function generateRecoveryCode(): { bytes: Bytes; code: string } {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(CODE_BYTES));
  return { bytes, code: toBase32(bytes) };
}

/** AAAAA-BBBBB-CCCCC-DDDDD-EEEEEE */
export const formatRecoveryCode = (code: string): string =>
  [0, 5, 10, 15, 20].map((i) => code.slice(i, i === 20 ? undefined : i + 5)).join('-');

/** Accepts any case and ignores spaces and '-'. Null on wrong length, bad characters or non-zero trailing bits. */
export function parseRecoveryCode(input: string): Bytes | null {
  const code = input.replace(/[\s-]/g, '').toUpperCase();
  if (code.length !== CODE_CHARS) return null;
  const bytes = new Uint8Array(CODE_BYTES);
  let acc = 0;
  let bits = 0;
  let n = 0;
  for (const ch of code) {
    const v = B32.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bytes[n++] = (acc >> (bits - 8)) & 255;
      bits -= 8;
    }
    acc &= (1 << bits) - 1;
  }
  return acc === 0 ? bytes : null; // the 2 leftover bits must be zero so each code has one encoding
}

// ---------------------------------------------------------------------------
// HKDF-SHA256 key derivation

// Empty salt is fine: the input keying material is uniformly random (128-bit code, or PRF output).
const hkdf = async (ikm: BufferSource, info: string) => ({
  ikm: await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey', 'deriveBits']),
  params: { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) },
});

async function deriveKek(ikm: BufferSource, info: string): Promise<CryptoKey> {
  const { ikm: key, params } = await hkdf(ikm, info);
  return subtle.deriveKey(params, key, { name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);
}

export const deriveRecoveryKek = (codeBytes: Bytes): Promise<CryptoKey> => deriveKek(codeBytes, 'bump-tracker kek_rc v1');

export const derivePrfKek = (prfOutput: BufferSource): Promise<CryptoKey> => deriveKek(prfOutput, 'bump-tracker kek_pk v1');

/** SHA-256(auth_rc): what the server stores as users.rc_auth_hash. */
export async function recoveryAuthHash(codeBytes: Bytes): Promise<Bytes> {
  const { ikm, params } = await hkdf(codeBytes, 'bump-tracker auth_rc v1');
  return new Uint8Array(await subtle.digest('SHA-256', await subtle.deriveBits(params, ikm, 256)));
}
