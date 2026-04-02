import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],

    coverage: {
      provider: 'v8',
      include: ['src/features/**/*.{ts,tsx}', 'src/lib/**/*.ts'],
      exclude: ['src/test/**'],
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
