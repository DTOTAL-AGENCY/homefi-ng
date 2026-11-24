import { defineConfig } from 'vitest/config';

// Unit tests only; the Tailwind PostCSS pipeline is not needed here.
export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: { include: ['src/**/*.test.ts'], passWithNoTests: true },
});
