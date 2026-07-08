import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['benchmarks/core-memory.ts'],
  },
});
