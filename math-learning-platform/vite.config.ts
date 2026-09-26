import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the build portable (GitHub Pages, any static host).
// `--mode artifact` produces a single bundle (no lazy chunks) that
// scripts/build-artifact.mjs inlines into one self-contained HTML page.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  build:
    mode === 'artifact'
      ? { outDir: 'dist-artifact', cssCodeSplit: false, rolldownOptions: { output: { inlineDynamicImports: true } } }
      : undefined,
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
