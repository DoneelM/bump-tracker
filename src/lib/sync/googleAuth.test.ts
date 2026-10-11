import { afterEach, describe, expect, it, vi } from 'vitest';

type Cfg = { callback: (r: Record<string, unknown>) => void; error_callback?: (e: { type?: string }) => void };

/** Fake GIS on a fake window; records when requestAccessToken is called. */
function fakeGis() {
  const calls: string[] = [];
  let cfg: Cfg | null = null;
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(c: Cfg) {
            cfg = c;
            calls.push('init');
            return { requestAccessToken: () => calls.push('request') };
          },
          revoke: () => calls.push('revoke'),
        },
      },
    },
  };
  return { calls, cfg: () => cfg! };
}

async function load() {
  vi.resetModules();
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client');
  return import('./googleAuth');
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('Google sign-in', () => {
  it('opens the popup within the tap once preloaded', async () => {
    const gis = fakeGis();
    const auth = await load();
    expect(auth.isSignInReady()).toBe(false);
    await auth.preloadGoogleSignIn();
    expect(auth.isSignInReady()).toBe(true);

    const done = auth.signIn();
    expect(gis.calls).toEqual(['init', 'request']); // same tick as the click: no await before the popup
    gis.cfg().callback({ access_token: 'tok', expires_in: 3600 });
    await done;
    expect(auth.isSignedIn()).toBe(true);
    expect(auth.currentToken()).toBe('tok');

    auth.signOut();
    expect(auth.isSignedIn()).toBe(false);
    expect(gis.calls.at(-1)).toBe('revoke');
  });

  it('still signs in without a preload, and reports a denied or closed popup', async () => {
    const gis = fakeGis();
    const auth = await load();
    const denied = auth.signIn();
    await vi.waitFor(() => expect(gis.calls).toContain('request'));
    gis.cfg().callback({ error: 'access_denied' });
    await expect(denied).rejects.toThrow('wasn’t allowed');

    const closed = auth.signIn();
    gis.cfg().error_callback?.({ type: 'popup_closed' });
    await expect(closed).rejects.toThrow('closed before it finished');
    expect(auth.isSignedIn()).toBe(false);
  });

  it('refuses when the build has no client ID', async () => {
    fakeGis();
    vi.resetModules();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const auth = await import('./googleAuth');
    await expect(auth.signIn()).rejects.toThrow('isn’t set up');
  });
});
