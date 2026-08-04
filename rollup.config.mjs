import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const isExternalNodeBuiltin = (id) => id.startsWith('node:') || /^(fs\/promises|fs|path|os|crypto|buffer|process|stream|util|events|module)/.test(id);


export default [
  // ── 1. CommonJS (Node require)
  {
    input: './src/index.ts',
    output: [
      {
        file: './dist/cjs/index.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript(
        {
          "target": "ES2020",
          "module": "ESNext",
          "declaration": false,
          "outDir": "./dist",
          "rootDir": "./src",
          "moduleResolution": "node",
          "esModuleInterop": true,
          "skipLibCheck": true
        }
      )
    ],
    // Match both bare (`fs`) and prefixed (`node:fs`) builtins so rollup marks
    // them external instead of warning about unresolved dependencies.
    external: isExternalNodeBuiltin
  },

  // ── 2. ESM (Node import + modern bundlers)
  {
    input: './src/indexImport.ts',
    output: [
      {
        file: './dist/esm/indexImport.js',
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true, browser: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.esm.json',
        declaration: false
      })
    ],
    external: isExternalNodeBuiltin
  },

  // ── 3. Browser (ESM bundle – modern bundlers/Vite/Webpack pick this)
  {
    input: './src/indexBrowser.ts',
    output: [
      {
        file: './dist/esm/indexBrowser.js',
        format: 'es',
        sourcemap: true,
        inlineDynamicImports: true
      }
    ],
    plugins: [
      nodePolyfills(),
      typescript({
        tsconfig: './tsconfig.esm.json',
        declaration: false,

      })
    ]
  },

  // ── 4. Types build
  {
    input: 'src/index.ts',
    // Emit .d.cts (not .d.ts): in a "type": "module" package a plain .d.ts is treated as
    // ESM, so `require`-based consumers under moduleResolution NodeNext fail with TS1479.
    // A .d.cts is always CommonJS, matching the index.cjs it describes.
    output: {
      file: 'dist/cjs/index.d.cts',
      format: 'es'
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.d.ts.json'
      })
    ],
    external: isExternalNodeBuiltin
  },
  {
    input: 'src/indexImport.ts',
    output: {
      file: 'dist/esm/indexImport.d.ts',
      format: 'es'
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.d.ts.json'
      })
    ],
    external: isExternalNodeBuiltin
  },
  {
    input: 'src/indexBrowser.ts',
    output: {
      file: 'dist/esm/indexBrowser.d.ts',
      format: 'es'
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.d.ts.json'
      })
    ],
    // The flattened browser declarations still reference `typeof import('fs')`
    // from the engine types, so mark the builtins external here too.
    external: isExternalNodeBuiltin
  }
];
