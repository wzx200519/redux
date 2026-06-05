import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'

const extensions = ['.ts', '.tsx', '.js', '.jsx']

const createPlugins = (minifyErrors = false, replaceNodeEnv = null) => {
  const plugins = [
    resolve({ extensions }),
    commonjs(),
    babel({
      extensions,
      babelHelpers: 'bundled',
      presets: ['@babel/preset-typescript']
    })
  ]

  if (replaceNodeEnv) {
    plugins.push({
      name: 'define-node-env',
      transform(code) {
        return code.replace(/process\.env\.NODE_ENV/g, JSON.stringify(replaceNodeEnv))
      }
    })
  }

  if (minifyErrors) {
    plugins.push(terser())
  }

  return plugins
}

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/redux.mjs',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: createPlugins()
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/redux.legacy-esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: createPlugins()
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/redux.browser.mjs',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: createPlugins(true, 'production')
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/cjs/redux.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    plugins: createPlugins()
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/redux.umd.js',
        format: 'umd',
        name: 'Redux',
        sourcemap: true
      }
    ],
    plugins: createPlugins()
  }
]
