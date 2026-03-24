import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#test': path.resolve(__dirname, './tests/helpers'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['tests/helpers/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/app/api/**', 'src/hooks/**'],
      exclude: [
        'src/components/ui/**',
        'src/lib/types/**',
        'src/lib/supabase/client.ts',
        'src/lib/supabase/server.ts',
        'src/lib/supabase/middleware.ts',
        'src/lib/stripe.ts',
        '**/*.d.ts',
      ],
      // TODO: テストカバレッジが拡大次第、段階的に 80% まで引き上げる
      thresholds: {
        lines: 5,
        branches: 3,
        functions: 5,
      },
    },
  },
})
