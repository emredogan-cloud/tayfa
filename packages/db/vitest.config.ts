import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // RLS tests hit a real Postgres; allow time for migration + connections.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
