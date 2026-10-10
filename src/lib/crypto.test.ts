import { describe, expect, it } from 'vitest';
import { BAG_SECTIONS, PLAN_SECTIONS } from '../data/checklists';
import { buildBackup, MAX_IMPORT_BYTES, parseBackup, type BackupEnvelope } from './backup';
import {
  decryptVault,
  deriveRecoveryKek,
  derivePrfKek,
  encryptVault,
  formatRecoveryCode,
  generateDek,
  generateRecoveryCode,
  MAX_VAULT_BYTES,
  SYNC_PAUSED_TOO_LARGE,
  parseRecoveryCode,
  recoveryAuthHash,
  unwrapDek,
  VaultTooLargeError,
  wrapDek,
} from './crypto';
import { MAX_ITEM_ANSWER, MAX_ITEM_TEXT, MAX_ITEMS } from './checklists';
import { MAX_EVENTS_PER_SESSION, MAX_STORED_SESSIONS } from './kicks';
import { MAX_SCAN_ENTRIES, MAX_SCAN_NOTES_LENGTH } from './scans';
import { MAX_WEIGHT_ENTRIES, MAX_WEIGHT_NOTE_LENGTH } from './weightGain';
import { MAX_STORED_CONTRACTIONS } from './contractions';
import { MAX_JOURNAL_ENTRIES, MAX_NOTES_LENGTH, SYMPTOMS } from './journal';
import { MAX_NICKNAME_LENGTH } from './profile';

const USER = 'user-1';
const NOW = new Date(Date.UTC(2026, 9, 11));
const smallEnvelope = () =>
  buildBackup({ 'weight-pre-pregnancy': { heightCm: 165, weightKg: 60 } }, NOW);
const flipped = (wire: Uint8Array, i: number) => Uint8Array.from(wire, (b, j) => (j === i ? b ^ 1 : b));

describe('vault', () => {
  it('round-trips the JSON text and parseBackup accepts it', async () => {
    const dek = await generateDek();
    const env = smallEnvelope();
    const text = await decryptVault(dek, USER, await encryptVault(dek, USER, env));
    expect(text).toBe(JSON.stringify(env));
    expect(parseBackup(text).ok).toBe(true);
  });

  it('uses a fresh IV each time', async () => {
    const dek = await generateDek();
    const a = await encryptVault(dek, USER, smallEnvelope());
    const b = await encryptVault(dek, USER, smallEnvelope());
    expect(a.subarray(1, 13)).not.toEqual(b.subarray(1, 13));
    expect(a).not.toEqual(b);
  });

  it('rejects wrong user, tampering, wrong version, wrong key and short input', async () => {
    const dek = await generateDek();
    const wire = await encryptVault(dek, USER, smallEnvelope());
    await expect(decryptVault(dek, 'user-2', wire)).rejects.toThrow();
    await expect(decryptVault(dek, USER, flipped(wire, 40))).rejects.toThrow();
    await expect(decryptVault(dek, USER, Uint8Array.from(wire, (b, j) => (j === 0 ? 2 : b)))).rejects.toThrow('version');
    await expect(decryptVault(await generateDek(), USER, wire)).rejects.toThrow();
    await expect(decryptVault(dek, USER, wire.subarray(0, 20))).rejects.toThrow('short');
  });

  it('pads small vaults to the 16 KiB bucket', async () => {
    const wire = await encryptVault(await generateDek(), USER, smallEnvelope());
    expect(wire.length).toBe(1 + 12 + 16384 + 16);
    expect(MAX_VAULT_BYTES).toBe(1_048_605);
  });

  it('pads to power-of-two buckets', async () => {
    const dek = await generateDek();
    const wire = await encryptVault(dek, USER, { ...smallEnvelope(), data: { x: randomText(60_000, B32) } });
    const bucket = wire.length - 1 - 12 - 16;
    expect(bucket & (bucket - 1)).toBe(0);
    expect(bucket).toBeGreaterThan(16384);
  });

  it('throws VaultTooLargeError over 1 MiB', async () => {
    const env = { ...smallEnvelope(), data: { x: randomText(2_000_000, B32) } };
    const err = await encryptVault(await generateDek(), USER, env).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VaultTooLargeError);
    expect(err).toMatchObject({ name: 'VaultTooLargeError', message: SYNC_PAUSED_TOO_LARGE });
  });
});

describe('recovery code', () => {
  it('round-trips bytes through format and parse', () => {
    for (let i = 0; i < 200; i++) {
      const { bytes, code } = generateRecoveryCode();
      expect(code).toMatch(/^[A-Z2-7]{26}$/);
      const shown = formatRecoveryCode(code);
      expect(shown.split('-').map((g) => g.length)).toEqual([5, 5, 5, 5, 6]);
      expect(parseRecoveryCode(shown)).toEqual(bytes);
    }
  });

  it('accepts lowercase and spaces', () => {
    const { bytes, code } = generateRecoveryCode();
    expect(parseRecoveryCode(` ${formatRecoveryCode(code).toLowerCase().replaceAll('-', ' ')} `)).toEqual(bytes);
  });

  it('rejects wrong length, invalid characters and non-zero trailing bits', () => {
    const { code } = generateRecoveryCode();
    expect(parseRecoveryCode(code.slice(1))).toBeNull();
    expect(parseRecoveryCode(code + 'A')).toBeNull();
    for (const bad of ['1', '0', '8']) expect(parseRecoveryCode(code.slice(0, 25) + bad)).toBeNull();
    expect(parseRecoveryCode('A'.repeat(26))).not.toBeNull();
    expect(parseRecoveryCode('A'.repeat(25) + 'B')).toBeNull(); // last char has non-zero low bits
  });
});

describe('key derivation and wrapping', () => {
  it('unwraps the DEK with the re-parsed code and decrypts the vault', async () => {
    const { bytes, code } = generateRecoveryCode();
    const dek = await generateDek();
    const wire = await encryptVault(dek, USER, smallEnvelope());
    const wrapped = await wrapDek(dek, await deriveRecoveryKek(bytes));
    expect(wrapped.length).toBe(40);
    const back = await unwrapDek(wrapped, await deriveRecoveryKek(parseRecoveryCode(formatRecoveryCode(code))!));
    expect(back.extractable).toBe(false);
    expect(parseBackup(await decryptVault(back, USER, wire)).ok).toBe(true);
  });

  it('fails to unwrap with a different code', async () => {
    const dek = await generateDek();
    const wrapped = await wrapDek(dek, await deriveRecoveryKek(generateRecoveryCode().bytes));
    await expect(unwrapDek(wrapped, await deriveRecoveryKek(generateRecoveryCode().bytes))).rejects.toThrow();
  });

  it('hashes auth_rc deterministically', async () => {
    const a = generateRecoveryCode().bytes;
    const h = await recoveryAuthHash(a);
    expect(h.length).toBe(32);
    expect(await recoveryAuthHash(a)).toEqual(h);
    expect(await recoveryAuthHash(generateRecoveryCode().bytes)).not.toEqual(h);
  });

  it('wraps with a PRF-derived KEK', async () => {
    const prf = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const dek = await generateDek();
    const wrapped = await wrapDek(dek, await derivePrfKek(prf));
    const back = await unwrapDek(wrapped, await derivePrfKek(prf));
    expect(back.extractable).toBe(false);
    const wire = await encryptVault(dek, USER, smallEnvelope());
    expect(parseBackup(await decryptVault(back, USER, wire)).ok).toBe(true);
    await expect(unwrapDek(wrapped, await derivePrfKek(globalThis.crypto.getRandomValues(new Uint8Array(32))))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Max-cap fixture (§4 "Blob sizing")

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function randomText(n: number, alphabet: string): string {
  let out = '';
  const buf = new Uint8Array(65536); // getRandomValues limit
  while (out.length < n) {
    globalThis.crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && out.length < n; i++) out += alphabet[buf[i]! % alphabet.length];
  }
  return out;
}

const WORDS = (
  'the a and to of in is it that was for on are with as I at be this have from or one had by word but not what all ' +
  'were we when your can said there use an each which she do how their if will up other about out many then them ' +
  'these so some her would make like him into time has look two more write go see number no way could people my ' +
  'than first water been call who oil its now find long down day did get come made may part baby bump felt tired ' +
  'today morning night slept kicked moved midwife appointment scan nausea back pain headache walked ate dinner ' +
  'lunch breakfast doctor hospital bag birth plan partner mum feeling little much very good bad really quite ' +
  'sore swollen heartburn cramps rest sleep tea toast walk week trimester heartbeat strong healthy measured ' +
  'growing waiting excited nervous happy worried calm busy quiet cold warm hot rain sun home work shop car ' +
  'bed chair couch kitchen garden park friend sister mother father husband wife nurse ultrasound blood test result'
).split(' ');

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Exactly `n` characters (the validators trim, so no trailing space). */
const fit = (s: string, n: number) => (s.slice(0, n).endsWith(' ') ? s.slice(0, n - 1) + 'e' : s.slice(0, n));

function buildMaxEnvelope(worst: boolean): BackupEnvelope {
  const rnd = mulberry32(42);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)]!;
  const text = (n: number) => {
    if (worst) return randomText(n, B32);
    let s = '';
    while (s.length < n) s += pick(WORDS) + ' ';
    return fit(s, n);
  };
  const id = () => (worst ? randomText(32, B32) : Math.floor(rnd() * 2 ** 52).toString(16).padStart(13, '0') + '-' + Math.floor(rnd() * 1e9));
  const date = (i: number) => `2026-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`;
  const T0 = Date.UTC(2026, 0, 1);
  const checklist = (sections: string[], answers: boolean) =>
    Array.from({ length: MAX_ITEMS }, (_, i) => ({
      id: id(),
      section: sections[i % sections.length]!,
      text: text(MAX_ITEM_TEXT),
      done: i % 2 === 0,
      ...(answers ? { answer: text(MAX_ITEM_ANSWER) } : {}),
    }));

  return buildBackup(
    {
      profile: { dating: { method: 'lmp', lmp: '2026-03-01' }, dueDate: '2026-12-06', nickname: text(MAX_NICKNAME_LENGTH), updatedAt: NOW.toISOString() },
      'weight-pre-pregnancy': { heightCm: 165, weightKg: 60 },
      'weight-entries': Array.from({ length: MAX_WEIGHT_ENTRIES }, (_, i) => ({
        id: id(), date: date(i), weightKg: Math.round((60 + rnd() * 20) * 10) / 10, note: text(MAX_WEIGHT_NOTE_LENGTH),
      })),
      'scan-entries': Array.from({ length: MAX_SCAN_ENTRIES }, (_, i) => ({
        id: id(), date: date(i), type: 'growth', notes: text(MAX_SCAN_NOTES_LENGTH),
        efwG: Math.round(10 + rnd() * 5990), bpdMm: Math.round(10 + rnd() * 110), hcMm: Math.round(30 + rnd() * 370),
        acMm: Math.round(30 + rnd() * 390), flMm: Math.round(5 + rnd() * 85),
      })),
      contractions: {
        contractions: Array.from({ length: MAX_STORED_CONTRACTIONS }, (_, i) => {
          const start = worst ? T0 + Math.floor(rnd() * 3e10) : T0 + i * 300_000 + Math.floor(rnd() * 20_000);
          return { start, end: start + 40_000 + Math.floor(rnd() * 50_000) };
        }),
        activeStart: null,
      },
      'kick-sessions': Array.from({ length: MAX_STORED_SESSIONS }, (_, s) => {
        const start = T0 + s * 86_400_000;
        const events = Array.from({ length: MAX_EVENTS_PER_SESSION }, (_, e) =>
          worst ? T0 + Math.floor(rnd() * 3e10) : start + e * 20_000 + Math.floor(rnd() * 15_000),
        );
        return { id: id(), start, end: start + 3_600_000, count: events.length, events };
      }),
      'journal-entries': Array.from({ length: MAX_JOURNAL_ENTRIES }, (_, i) => ({
        id: id(), date: date(i), mood: 1 + (i % 5), flagged: i % 7 === 0,
        symptoms: SYMPTOMS.filter(() => rnd() < 0.4), notes: text(MAX_NOTES_LENGTH),
      })),
      'checklist-bag': checklist(BAG_SECTIONS, false),
      'checklist-birth-plan': checklist(PLAN_SECTIONS, true),
    },
    NOW,
  );
}

async function gzipLength(json: string): Promise<number> {
  const out = new Blob([new TextEncoder().encode(json)]).stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(out).arrayBuffer()).byteLength;
}

describe('max-cap vault sizing', () => {
  const caps: Record<string, number> = {
    'journal-entries': MAX_JOURNAL_ENTRIES,
    'scan-entries': MAX_SCAN_ENTRIES,
    'weight-entries': MAX_WEIGHT_ENTRIES,
    'kick-sessions': MAX_STORED_SESSIONS,
    'checklist-bag': MAX_ITEMS,
    'checklist-birth-plan': MAX_ITEMS,
  };

  for (const worst of [false, true]) {
    it(`${worst ? 'worst-case random text' : 'realistic text'}: measures and respects the cap`, async () => {
      const env = buildMaxEnvelope(worst);
      const json = JSON.stringify(env);
      const parsed = parseBackup(json);
      if (!parsed.ok) throw new Error(parsed.error);
      expect(parsed.backup.skipped).toEqual([]);
      for (const [k, n] of Object.entries(caps)) expect((parsed.backup.accepted[k] as unknown[]).length).toBe(n);
      expect((parsed.backup.accepted['contractions'] as { contractions: unknown[] }).contractions.length).toBe(MAX_STORED_CONTRACTIONS);
      expect(Object.keys(parsed.backup.accepted).length).toBe(9);

      const raw = new TextEncoder().encode(json).length;
      const gz = await gzipLength(json);
      const dek = await generateDek();
      let outcome: string;
      try {
        const wire = await encryptVault(dek, USER, env);
        expect(wire.length).toBeLessThanOrEqual(MAX_VAULT_BYTES);
        expect(await decryptVault(dek, USER, wire)).toBe(json);
        outcome = `bucket=${wire.length - 29} wire=${wire.length}`;
      } catch (e) {
        expect(e).toBeInstanceOf(VaultTooLargeError);
        outcome = 'VaultTooLargeError';
      }
      console.log(`vault sizing ${worst ? 'worst' : 'realistic'}: raw=${raw} gzip=${gz} ${outcome}`);
    }, 60_000);
  }
});

describe('gunzip cap', () => {
  it('rejects a small gzip bomb that inflates past MAX_IMPORT_BYTES, quickly', async () => {
    const dek = await generateDek();
    const zeros = new Uint8Array(MAX_IMPORT_BYTES + 4 * 1024 * 1024); // ~30 MB of zeros, ~30 KB of gzip
    const gz = new Uint8Array(await new Response(new Blob([zeros]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    expect(gz.length).toBeLessThan(64 * 1024);
    const padded = new Uint8Array(65536);
    padded.set(gz);
    padded[gz.length] = 0x80;
    const iv = new Uint8Array(12);
    const ct = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(`${USER}|vault|1`) }, dek, padded),
    );
    const wire = new Uint8Array([1, ...iv, ...ct]);
    const t0 = performance.now();
    await expect(decryptVault(dek, USER, wire)).rejects.toThrow('too large');
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});
