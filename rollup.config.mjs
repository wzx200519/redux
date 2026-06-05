import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import { transformAsync } from '@babel/core'
import { mangleErrorsPlugin } from './scripts/mangleErrors.mjs'
import { execSync } from 'node:child_process'
import { existsSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import dts from 'rollup-plugin-dts'

function mangleErrorsTransform() {
  return {
    name: 'mangle-errors-transform',
    async transform(code, id) {
      if (!id.endsWith('.ts')) return null
      try {
        const res = await transformAsync(code, {
          parserOpts: { plugins: ['typescript'] },
          plugins: [[mangleErrorsPlugin, { minify: false }]],
          filename: id
        })
        if (!res) return null
        return { code: res.code, map: res.map }
      } catch (err) {
        console.error('Babel mangleErrors error:', err)
        return null
      }
    }
  }
}

function generateDeclarations() {
  return {
    name: 'generate-declarations',
    closeBundle() {
      execSync('npx tsc -p tsconfig.build.json', {
        stdio: 'inherit',
        cwd: process.cwd()
      })
    }
  }
}

function cleanupDeclarations() {
  return {
    name: 'cleanup-declarations',
    closeBundle() {
      const distDir = join(process.cwd(), 'dist')
      if (existsSync(distDir)) {
        const files = readdirSync(distDir, { recursive: true })
        for (const file of files) {
          const fullPath = join(distDir, file)
          if (file.endsWith('.d.ts') && file !== 'redux.d.mts') {
            rmSync(fullPath)
          }
        }
      }
    }
  }
}

const jsConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/redux.mjs',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/cjs/redux.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/redux.umd.js',
      format: 'umd',
      name: 'Redux',
      sourcemap: true,
      exports: 'named'
    }
  ],
  plugins: [
    mangleErrorsTransform(),
    resolve(),
    typescript({
      tsconfig: 'tsconfig.build.json',
      declaration: false,
      compilerOptions: {
        emitDeclarationOnly: false
      }
    }),
    generateDeclarations()
  ]
}

const dtsConfig = {
  input: 'dist/index.d.ts',
  output: [{ file: 'dist/redux.d.mts', format: 'es' }],
  plugins: [dts(), cleanupDeclarations()]
}

export default [jsConfig, dtsConfig]