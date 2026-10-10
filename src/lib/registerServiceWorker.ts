// lib.dom has no Trusted Types typings yet; this is the one call used.
type TrustedTypes = { createPolicy(name: string, rules: { createScriptURL(url: string): string }): { createScriptURL(url: string): string } };

/** Registers public/sw.js. Production only, so the dev server is never cached. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const url = `${import.meta.env.BASE_URL}sw.js`;
  // The CSP's require-trusted-types-for 'script' makes register() take only a TrustedScriptURL; this policy allows just sw.js.
  const tt = (window as { trustedTypes?: TrustedTypes }).trustedTypes;
  const scriptUrl = tt
    ? tt.createPolicy('sw', { createScriptURL: (u) => { if (u !== url) throw new TypeError(`Blocked script URL ${u}`); return u; } }).createScriptURL(url)
    : url;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(scriptUrl).catch(() => {
      // Offline support is a nice-to-have; the app works without it.
    });
  });
}
