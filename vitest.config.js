import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    restoreMocks: true,
  },
});
