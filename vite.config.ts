import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the static build works from any sub-path (hash routing needs no server rewrites).
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.mjs'],
    environment: 'node',
    // Run tests in Auckland time so DST-related tests are meaningful.
    env: { TZ: 'Pacific/Auckland' },
  },
});
