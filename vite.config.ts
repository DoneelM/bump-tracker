import { defineConfig, type Plugin } from 'vitest/config';
import pkg from './package.json';
import react from '@vitejs/plugin-react';

/**
 * Strict Content-Security-Policy, injected into the production build only
 * (the dev server needs inline styles/scripts for HMR).
 */
const CSP = [
  "default-src 'self'",
  // Google Identity Services, loaded only when the user turns on sync (see src/lib/sync/googleAuth.ts).
  "script-src 'self' https://accounts.google.com/gsi/client",
  "style-src 'self' https://accounts.google.com/gsi/style",
  "frame-src https://accounts.google.com/gsi/",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  // Sync: GIS, and the Drive API for the hidden app folder.
  "connect-src 'self' https://accounts.google.com/gsi/ https://www.googleapis.com",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'bump-tracker:csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig({
  // Relative base so the static build works from any sub-path (hash routing needs no server rewrites).
  base: './',
  // Shown in the app info a user can choose to include in feedback.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), cspPlugin()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.mjs', 'worker/**/*.test.ts'],
    environment: 'node',
    // Run tests in Auckland time so DST-related tests are meaningful.
    env: { TZ: 'Pacific/Auckland' },
  },
});
