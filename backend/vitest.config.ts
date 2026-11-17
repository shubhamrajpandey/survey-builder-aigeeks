import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@survey/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
