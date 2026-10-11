/**
 * Where the encrypted sync data lives. Everything a provider stores is either ciphertext (the vault) or
 * useless without the recovery code (the wrapped key), so a provider never holds readable health data.
 * Google Drive is the first implementation; others (e.g. an Auth0-protected Worker) can follow.
 */

/** Small public file next to the vault: which sync this is, and the data key wrapped by the recovery code. */
export interface KeysFile {
  format: 1;
  syncId: string;
  /** base64 of the AES-KW wrap of the data key under the recovery-code key. */
  wrapRc: string;
}

export interface RemoteVault {
  bytes: Uint8Array<ArrayBuffer>;
  /** Our own push counter, bound into the vault's AAD. */
  counter: number;
  /** The provider's change marker for the stored file, used to detect a write from another device. */
  remoteVersion: string;
}

export interface SyncProvider {
  loadKeys(): Promise<KeysFile | null>;
  saveKeys(keys: KeysFile): Promise<void>;
  loadVault(): Promise<RemoteVault | null>;
  /** `changed`: the stored vault is no longer `expectedRemoteVersion` (another device wrote first). */
  saveVault(bytes: Uint8Array<ArrayBuffer>, counter: number, expectedRemoteVersion: string | null): Promise<'ok' | 'changed'>;
  deleteAll(): Promise<void>;
}

/** Thrown by a provider when it needs the user to sign in (again) before it can continue. */
export class SignInRequiredError extends Error {
  constructor() {
    super('Please sign in to sync.');
    this.name = 'SignInRequiredError';
  }
}

export function isKeysFile(v: unknown): v is KeysFile {
  if (typeof v !== 'object' || v === null) return false;
  const k = v as Record<string, unknown>;
  return (
    k.format === 1 &&
    typeof k.syncId === 'string' &&
    /^[A-Za-z0-9_-]{16,64}$/.test(k.syncId) &&
    typeof k.wrapRc === 'string' &&
    /^[A-Za-z0-9+/]{54}==$/.test(k.wrapRc) // 40-byte AES-KW wrap
  );
}
