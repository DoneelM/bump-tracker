/**
 * Wires the sync engine to the real pieces (Google Drive, IndexedDB, localStorage) and runs it:
 * one sync at a time, plus a debounced automatic sync after local changes while signed in.
 * UI reads `getSyncStatus()` through `useSyncStatus`.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { STORAGE_EVENT } from '../storage';
import { appLocal } from './appLocal';
import { sync, type Resolutions, type SyncDeps, type SyncResult } from './engine';
import { currentToken, dropToken, googleClientId, isSignedIn } from './googleAuth';
import { createDriveProvider } from './googleDrive';
import { idbSyncStateStore } from './keyStore';
import { SignInRequiredError } from './provider';

export const syncAvailable = googleClientId !== '';

export const syncDeps: SyncDeps = {
  provider: createDriveProvider({ getToken: currentToken, onUnauthorized: dropToken }),
  store: idbSyncStateStore,
  local: appLocal,
};

export interface SyncStatus {
  busy: boolean;
  /** Last outcome, kept so the Sync page can show a conflict or error found by an automatic sync. */
  result: SyncResult | null;
  error: string | null;
  needsSignIn: boolean;
}

let status: SyncStatus = { busy: false, result: null, error: null, needsSignIn: false };
const listeners = new Set<() => void>();
function set(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}
export const getSyncStatus = (): SyncStatus => status;
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSyncStatus,
    getSyncStatus,
  );
}

let running: Promise<SyncResult | null> | null = null;

/** Runs one sync (or joins the one in progress). Errors land in the status, not as rejections. */
export function runSync(resolutions?: Resolutions): Promise<SyncResult | null> {
  running ??= (async () => {
    set({ busy: true, error: null });
    try {
      const result = await sync(syncDeps, resolutions);
      set({ result, needsSignIn: false });
      return result;
    } catch (err) {
      if (err instanceof SignInRequiredError) set({ needsSignIn: true });
      else set({ error: err instanceof Error ? err.message : 'Sync failed. Try again.' });
      return null;
    } finally {
      set({ busy: false });
      running = null;
      refreshSyncEnabled();
    }
  })();
  return running;
}

/** Records an outcome from setup/unlock, which run the engine directly. */
export function reportSyncResult(result: SyncResult | null, error: string | null = null): void {
  set({ result, error, needsSignIn: false });
  refreshSyncEnabled();
}

/** Whether sync is on for this device (null until read from IndexedDB), and when it last synced. */
export interface SyncEnabled {
  on: boolean | null;
  lastSyncedAt: number | null;
}
let enabled: SyncEnabled = { on: null, lastSyncedAt: null };
const enabledListeners = new Set<() => void>();

/** Re-reads whether sync is on here; every useSyncEnabled() caller updates. */
export function refreshSyncEnabled(): void {
  const apply = (next: SyncEnabled) => {
    enabled = next;
    enabledListeners.forEach((l) => l());
  };
  syncDeps.store.load().then(
    (s) => apply({ on: s !== null, lastSyncedAt: s?.lastSyncedAt ?? null }),
    () => apply({ on: false, lastSyncedAt: null }),
  );
}

export function useSyncEnabled(): SyncEnabled & { refresh: () => void } {
  const snap = useSyncExternalStore(
    (l) => {
      enabledListeners.add(l);
      return () => enabledListeners.delete(l);
    },
    () => enabled,
    () => enabled,
  );
  // Re-read on mount: sync can be turned off elsewhere (e.g. "Delete all my data").
  useEffect(refreshSyncEnabled, []);
  return { ...snap, refresh: refreshSyncEnabled };
}

const AUTO_SYNC_DELAY_MS = 4000;

/**
 * After local changes, syncs once things go quiet. Only while signed in this session and sync is on;
 * changes written by a sync itself are ignored, so syncing never triggers itself.
 */
export function startAutoSync(): () => void {
  if (!syncAvailable) return () => {};
  let timer: number | undefined;
  const onChange = () => {
    if (running) return; // our own writes during a sync
    window.clearTimeout(timer);
    timer = window.setTimeout(async () => {
      if (!isSignedIn() || running || status.result?.status === 'conflict') return;
      if (!(await syncDeps.store.load())) return;
      void runSync();
    }, AUTO_SYNC_DELAY_MS);
  };
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}
