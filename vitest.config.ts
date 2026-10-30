import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // The CLI runs in a child process in test/cli.test.ts, which v8 coverage cannot see.
      exclude: ['src/cli.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: { statements: 100, branches: 95, functions: 100, lines: 100 },
    },
  },
});
