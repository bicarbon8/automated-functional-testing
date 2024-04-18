import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  ...configDefaults,
  test: {
    testTimeout: 10000,
    reporters: ['default', './dist/src/aft-vitest-reporter.js'],
    environment: 'node',
    coverage: {
        provider: 'istanbul'
    },
  }
});
