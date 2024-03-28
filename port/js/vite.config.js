import { defineConfig } from 'vite'
import pkg from './package.json'
import terser from '@rollup/plugin-terser'

const OUTPUT_NAME = `dist/messgen`

export default defineConfig({
  build: {
    lib: {
      entry: 'src/messgen.js',
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
    globals: true,
  },
  benchmark: {
    globals: true,
  },
  plugins: [

    terser()]
})
