import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'lcov'],
      include: ['src/domain/**/*.ts', 'src/events/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.test.ts'],
      // Mission §QUALITY: 80% overall, 90%+ critical domain. `src/domain` IS the
      // critical domain (NSM, reputation, location privacy, entitlements).
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
