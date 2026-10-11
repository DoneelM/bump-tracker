/**
 * SyncProvider on the user's own Google Drive, in the hidden per-app folder (`appDataFolder`).
 * Two files: the keys file (sync id + data key wrapped by the recovery code) and the encrypted vault.
 * Drive v3 has no conditional (If-Match) write, so saveVault checks the file's `version` right before
 * uploading; two devices pushing within the same moment can still race (see DEPLOY-NOTES).
 */
import { isKeysFile, SignInRequiredError, type KeysFile, type RemoteVault, type SyncProvider } from './provider';

const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
export const KEYS_NAME = 'bump-tracker-keys.json';
export const VAULT_NAME = 'bump-tracker-vault.bin';

interface DriveFile {
  id: string;
  name: string;
  version: string;
  appProperties?: Record<string, string>;
}

export interface DriveDeps {
  getToken: () => string;
  /** Called when Google rejects the token, so the UI can ask the user to sign in again. */
  onUnauthorized?: () => void;
  fetch?: typeof fetch;
}

export function createDriveProvider({ getToken, onUnauthorized, fetch: fetchImpl = (...a) => fetch(...a) }: DriveDeps): SyncProvider {
  async function call(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${getToken()}`);
    let res: Response;
    try {
      res = await fetchImpl(url, { ...init, headers });
    } catch {
      throw new Error('Couldn’t reach Google Drive. Check your connection and try again.');
    }
    if (res.status === 401) {
      onUnauthorized?.();
      throw new SignInRequiredError();
    }
    if (!res.ok) throw new Error(`Google Drive returned an error (${res.status}). Try again later.`);
    return res;
  }

  async function list(): Promise<DriveFile[]> {
    const q = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id,name,version,appProperties)',
      orderBy: 'createdTime',
      pageSize: '100',
    });
    const body = (await (await call(`${API}?${q}`)).json()) as { files?: DriveFile[] };
    return body.files ?? [];
  }
  const find = async (name: string) => (await list()).find((f) => f.name === name) ?? null;

  async function upload(existing: DriveFile | null, name: string, media: BlobPart, type: string, appProperties?: Record<string, string>) {
    const boundary = `bt${crypto.getRandomValues(new Uint32Array(2)).join('')}`;
    const meta = existing ? { appProperties } : { name, parents: ['appDataFolder'], appProperties };
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
      `--${boundary}\r\nContent-Type: ${type}\r\n\r\n`,
      media,
      `\r\n--${boundary}--`,
    ]);
    const url = existing ? `${UPLOAD}/${encodeURIComponent(existing.id)}` : UPLOAD;
    await call(`${url}?uploadType=multipart&fields=id,version`, {
      method: existing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  const media = (f: DriveFile) => call(`${API}/${encodeURIComponent(f.id)}?alt=media`);

  return {
    async loadKeys(): Promise<KeysFile | null> {
      const f = await find(KEYS_NAME);
      if (!f) return null;
      const keys: unknown = await (await media(f)).json().catch(() => null);
      if (!isKeysFile(keys)) throw new Error('The synced data in Google Drive is damaged and can’t be used.');
      return keys;
    },
    async saveKeys(keys) {
      await upload(await find(KEYS_NAME), KEYS_NAME, JSON.stringify(keys), 'application/json');
    },
    async loadVault(): Promise<RemoteVault | null> {
      const f = await find(VAULT_NAME);
      if (!f) return null;
      const counter = Number(f.appProperties?.v);
      if (!Number.isSafeInteger(counter) || counter < 1) throw new Error('The synced data in Google Drive is damaged and can’t be used.');
      return { bytes: new Uint8Array(await (await media(f)).arrayBuffer()), counter, remoteVersion: f.version };
    },
    async saveVault(bytes, counter, expectedRemoteVersion) {
      const f = await find(VAULT_NAME);
      if ((f?.version ?? null) !== expectedRemoteVersion) return 'changed';
      await upload(f, VAULT_NAME, bytes, 'application/octet-stream', { v: String(counter) });
      return 'ok';
    },
    async deleteAll() {
      for (const f of await list()) {
        if (f.name === KEYS_NAME || f.name === VAULT_NAME) await call(`${API}/${encodeURIComponent(f.id)}`, { method: 'DELETE' });
      }
    },
  };
}
