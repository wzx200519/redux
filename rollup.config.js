import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

const input = 'src/index.ts'

export default [
  {
    input,
    output: {
      file: 'dist/redux.mjs',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.build.json',
        declaration: false
      })
    ]
  },
  {
    input,
    output: {
      file: 'dist/redux.legacy-esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.build.json',
        target: 'ES2017',
        declaration: false
      })
    ]
  },
  {
    input,
    output: {
      file: 'dist/redux.browser.mjs',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.build.json',
        declaration: false,
        define: { 'process.env.NODE_ENV': '"production"' }
      }),
      terser()
    ]
  },
  {
    input,
    output: {
      file: 'dist/cjs/redux.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.build.json',
        declaration: false
      })
    ]
  },
  {
    input,
    output: {
      file: 'dist/redux.umd.js',
      format: 'umd',
      name: 'Redux',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.build.json',
        declaration: false
      }),
      terser()
    ]
  }
]
