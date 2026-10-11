/**
 * Google sign-in for sync, via Google Identity Services (GIS) token client. The GIS script is loaded only
 * when the user asks to sign in, so people who never use sync never load Google code. The access token
 * stays in memory (never stored) and only grants `drive.appdata`: the app's own hidden folder in the user's
 * Drive, not their files.
 */
import { SignInRequiredError } from './provider';

export const GIS_SRC = 'https://accounts.google.com/gsi/client';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

/** Public OAuth client ID, set at build time. Empty means this build has sync turned off. */
export const googleClientId: string = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '').trim();

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
}
interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}
interface GisOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type?: string }) => void;
  }): TokenClient;
  revoke(token: string, done?: () => void): void;
}
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GisOAuth2 } };
  }
}

let gis: Promise<GisOAuth2> | null = null;
let token: { value: string; expiresAt: number } | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Re-render hook for UI: called when the user signs in or out, or the token is dropped. */
export function onAuthChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function loadGis(): Promise<GisOAuth2> {
  gis ??= new Promise<GisOAuth2>((resolve, reject) => {
    const ready = () => (window.google?.accounts?.oauth2 ? resolve(window.google.accounts.oauth2) : reject(new Error('Google sign-in didn’t load.')));
    if (window.google?.accounts?.oauth2) return ready();
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.onload = ready;
    s.onerror = () => reject(new Error('Couldn’t reach Google sign-in. Check your connection and try again.'));
    document.head.appendChild(s);
  }).catch((err: unknown) => {
    gis = null; // allow a retry after a failed load
    throw err;
  });
  return gis;
}

// One token client, made ahead of time by preloadGoogleSignIn() so a tap can open the popup synchronously.
let client: TokenClient | null = null;
let pending: { resolve: () => void; reject: (e: Error) => void } | null = null;

function settle(outcome: Error | null) {
  const p = pending;
  pending = null;
  if (outcome) p?.reject(outcome);
  else p?.resolve();
}

function makeClient(oauth2: GisOAuth2): TokenClient {
  return oauth2.initTokenClient({
    client_id: googleClientId,
    scope: DRIVE_SCOPE,
    callback: (r) => {
      const seconds = Number(r.expires_in);
      if (!r.access_token || r.error || !Number.isFinite(seconds)) {
        settle(new Error(r.error === 'access_denied' ? 'Google access wasn’t allowed, so sync can’t start.' : 'Google sign-in didn’t complete.'));
        return;
      }
      token = { value: r.access_token, expiresAt: Date.now() + seconds * 1000 };
      notify();
      settle(null);
    },
    error_callback: (e) =>
      settle(new Error(e.type === 'popup_failed_to_open' ? 'The Google sign-in window was blocked. Allow pop-ups and try again.' : 'Google sign-in was closed before it finished.')),
  });
}

/**
 * Loads Google sign-in and prepares the token client, so a later tap opens the popup straight away.
 * Call it when a sync screen opens; it's the only place Google code is loaded.
 */
export async function preloadGoogleSignIn(): Promise<void> {
  if (!googleClientId || client) return;
  client = makeClient(await loadGis());
  notify();
}

/** True once preloadGoogleSignIn() has finished, so a tap can open the popup with no delay. */
export const isSignInReady = (): boolean => client !== null;

function request(c: TokenClient): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    settle(new Error('Google sign-in was restarted.'));
    pending = { resolve, reject };
    c.requestAccessToken(); // runs synchronously inside the caller's click, so the popup isn't blocked
  });
}

/**
 * Opens Google's popup. Call it straight from a click handler. If the client is preloaded, the popup opens
 * within the click; otherwise Google sign-in is loaded first (some browsers may then block the popup).
 */
export function signIn(): Promise<void> {
  if (!googleClientId) return Promise.reject(new Error('Sync isn’t set up on this version of the app.'));
  if (client) return request(client);
  return preloadGoogleSignIn().then(() => request(client!));
}

export const isSignedIn = (): boolean => token !== null && token.expiresAt - 60_000 > Date.now();

/** For providers: the current token, or SignInRequiredError when there isn't a usable one. */
export function currentToken(): string {
  if (!token || !isSignedIn()) throw new SignInRequiredError();
  return token.value;
}

/** Forgets the token (e.g. after a 401). */
export function dropToken(): void {
  if (!token) return;
  token = null;
  notify();
}

/** Revokes this app's Google access and forgets the token. */
export function signOut(): void {
  const t = token?.value;
  dropToken();
  if (t) window.google?.accounts?.oauth2?.revoke(t);
}
