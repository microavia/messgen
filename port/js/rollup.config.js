import terser from '@rollup/plugin-terser'
import pkg from './package.json'

const OUTPUT_NAME = `dist/messgen`

/** @type {import('rollup').RollupOptions} */
const config = {
  input: `src/messgen.js`,
  output: [
    {
      file: OUTPUT_NAME + '.js',
      format: 'umd',
      name: pkg.name,
      sourcemap: false
    }
  ],
  plugins: [terser()]
}

export default config
