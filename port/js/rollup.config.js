import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const OUTPUT_NAME = `dist/messgen`;

export default {
    input: `src/messgen.js`,
    output: [
        {
            file: OUTPUT_NAME + ".js",
            format: 'umd',
            name: pkg.name,
            sourcemap: false
        }
    ],
    plugins: [
        terser()
    ]
};