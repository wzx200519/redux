import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import fs from 'fs';

// 插件：在构建结束后，将生成的 .d.ts 复制为 .d.mts 以满足 package.json 的 types 字段
function copyDtsPlugin() {
  return {
    name: 'copy-dts',
    closeBundle() {
      const dtsPath = './dist/index.d.ts';
      const dmtsPath = './dist/redux.d.mts';
      if (fs.existsSync(dtsPath)) {
        fs.copyFileSync(dtsPath, dmtsPath);
      }
    }
  };
}

export default [
  // ESM 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/redux.mjs',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.build.json',
        noEmit: false,
        emitDeclarationOnly: false,
        declaration: true,
        declarationDir: './dist',
        rootDir: './src'
      }),
      copyDtsPlugin()
    ]
  },
  // 兼容 Webpack 4 的 Legacy ESM 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/redux.legacy-esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.build.json',
        noEmit: false,
        emitDeclarationOnly: false,
        declaration: false
      })
    ]
  },
  // CJS 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/redux.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.build.json',
        noEmit: false,
        emitDeclarationOnly: false,
        declaration: false
      })
    ]
  },
  // UMD 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/redux.umd.js',
      format: 'umd',
      name: 'Redux',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.build.json',
        noEmit: false,
        emitDeclarationOnly: false,
        declaration: false
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true
      }),
      terser()
    ]
  }
];
