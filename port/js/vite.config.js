import { defineConfig } from 'vite'
import pkg from './package.json'
import terser from '@rollup/plugin-terser'


export default defineConfig({
  build: {
    lib: {
      entry: 'src/Codec.ts',
      name: pkg.name,
      fileName: `messgen`

    },
    rollupOptions: {
      output: {
        format: 'umd',
        name: pkg.name,
        sourcemap: true
      }
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      include: 'src/**',
      thresholds: {
        statements: 90,
        branches: 86,
        functions: 94,
        lines: 90
      }
    },
  },
  benchmark: {
    globals: true,
  },
  plugins: [
    terser()]
})
