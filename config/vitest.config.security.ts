import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '#test': path.resolve(__dirname, '../tests/helpers'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/security/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    reporters: ['default', 'json'],
    outputFile: {
      json: 'security-reports/results.json',
    },
  },
})
