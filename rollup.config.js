import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // JS build (CJS + ESM)
  {
    input: './src/indexBrowser.ts',
    output: [
      {
        file: './dist/index.browser.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  {
    input: './src/indexImport.ts',
    output: [
      {
        file: './dist/index.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: './dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ],
    external: ['fs', 'buffer'] // Node built-ins
  },
  // Types build
  {
    input: './dist/indexImport.d.ts',
    output: {
      file: './dist/index.esm.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  },
  {
    input: './dist/indexImport.d.ts',
    output: {
      file: './dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  },
  {
    input: './dist/indexBrowser.d.ts',
    output: {
      file: './dist/index.browser.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  },
  {
    input: './dist/indexImport.d.ts',
    output: {
      file: './dist/index.cjs.d.ts',
      format: 'cjs'
    },
    plugins: [dts()]
  }
];
