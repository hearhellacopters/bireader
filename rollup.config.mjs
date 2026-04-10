import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const isExternalNodeBuiltin = (id) => id.startsWith('node:') || /^(fs\/promises|fs|path|os|crypto|buffer|process|stream|util|events)/.test(id);


export default [
  // ── 1. CommonJS (Node require)
  {
    input: './src/index.ts',
    output: [
      {
        file: './dist/cjs/index.js',
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
    output: {
      file: 'dist/cjs/index.d.ts',
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
    ]
  }
];
