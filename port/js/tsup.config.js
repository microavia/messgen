import { defineConfig } from 'tsup';

// eslint-disable-next-line import/no-default-export
export default defineConfig([
  {
    entry: ['src/*.ts'],
    format: ['cjs', 'esm'],
    target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
    outDir: 'build/modern',
    dts: true,
    sourcemap: true,
    clean: true,
  },
]);
