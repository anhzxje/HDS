import viteConfig from './vite.config.js'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    clearMocks: true,
  },
}))
