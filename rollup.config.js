const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const nodeResolve = require('@rollup/plugin-node-resolve')
const replace = require('@rollup/plugin-replace')
const typescript = require('@rollup/plugin-typescript')

const input = path.resolve(__dirname, 'src/index.ts')

function emitTypeDeclarations() {
  let hasRun = false

  return {
    name: 'emit-type-declarations',
    writeBundle() {
      if (hasRun) {
        return
      }

      hasRun = true

      execFileSync(
        process.execPath,
        [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.build.json'],
        {
          cwd: __dirname,
          stdio: 'inherit'
        }
      )

      const sourcePath = path.resolve(__dirname, 'dist/index.d.ts')
      const targetPath = path.resolve(__dirname, 'dist/redux.d.mts')

      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Type declaration was not generated: ${sourcePath}`)
      }

      fs.renameSync(sourcePath, targetPath)
    }
  }
}

function createPlugins({ replaceNodeEnv = false } = {}) {
  const plugins = [
    nodeResolve.nodeResolve({ extensions: ['.mjs', '.js', '.json', '.node', '.ts'] }),
    typescript({
      tsconfig: './tsconfig.base.json',
      declaration: false,
      declarationMap: false,
      sourceMap: true
    })
  ]

  if (replaceNodeEnv) {
    plugins.unshift(
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify('production')
        }
      })
    )
  }

  return plugins
}

module.exports = [
  {
    input,
    output: [
      {
        file: path.resolve(__dirname, 'dist/redux.mjs'),
        format: 'es',
        sourcemap: true
      },
      {
        file: path.resolve(__dirname, 'dist/cjs/redux.cjs'),
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: [...createPlugins(), emitTypeDeclarations()]
  },
  {
    input,
    output: {
      file: path.resolve(__dirname, 'dist/redux.umd.js'),
      format: 'umd',
      name: 'Redux',
      exports: 'named',
      sourcemap: true
    },
    plugins: createPlugins({ replaceNodeEnv: true })
  }
]
