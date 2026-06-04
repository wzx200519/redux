import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    {
      input: 'src/index',
      name: 'redux',
      format: ['esm', 'cjs']
    },
    {
      input: 'src/middleware',
      name: 'middleware',
      format: ['esm', 'cjs']
    }
  ],
  rollup: {
    emitCJS: true,
    cjsBridge: true
  },
  outDir: 'dist',
  sourcemap: true
})
