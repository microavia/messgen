import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default {
    input: 'src/messgen.ts',
    output: [
        {
            file: pkg.exports.require,
            format: 'cjs',
            sourcemap: true,
        },
        {
            file: pkg.exports.script,
            format: 'umd',
            name: pkg.name,
            sourcemap: true,
        },
        {
            file: pkg.exports.import,
            format: 'esm',
            sourcemap: true,
        },
    ],
    plugins: [
        typescript({ tsconfig: './tsconfig.json' }),
        terser(),
    ],
};
