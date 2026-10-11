import { useSyncExternalStore } from 'react';

/** The bits of ServiceWorkerContainer watchForUpdate needs (a fake in tests). */
export interface WorkerContainer {
  readonly controller: unknown;
  addEventListener(type: 'controllerchange', listener: () => void): void;
}

/**
 * Calls `onReady` when a new service worker takes over this page. sw.js activates new versions at once
 * (skipWaiting + clients.claim), so the page keeps running the old code until it reloads. On a first
 * install the page wasn't controlled at load: that first takeover isn't an update, so it's skipped.
 */
export function watchForUpdate(container: WorkerContainer, onReady: () => void): void {
  let hadWorker = container.controller !== null;
  container.addEventListener('controllerchange', () => {
    if (hadWorker) onReady();
    hadWorker = true;
  });
}

let updateReady = false;
const listeners = new Set<() => void>();

/** True once a newer version has taken over; the UI offers a reload. */
export function useUpdateReady(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => updateReady,
    () => false,
  );
}

const UPDATE_CHECK_MS = 30 * 60_000;

/** Registers public/sw.js. Production only, so the dev server is never cached. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    const sw = navigator.serviceWorker;
    watchForUpdate(sw, () => {
      updateReady = true;
      listeners.forEach((l) => l());
    });
    sw.register(`${import.meta.env.BASE_URL}sw.js`).then(
      (registration) => {
        // Browsers check for a new sw.js on navigation; an app left open for days also checks when shown again.
        let lastCheck = Date.now();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible' || Date.now() - lastCheck < UPDATE_CHECK_MS) return;
          lastCheck = Date.now();
          registration.update().catch(() => {});
        });
      },
      () => {
        // Offline support is a nice-to-have; the app works without it.
      },
    );
  });
}
