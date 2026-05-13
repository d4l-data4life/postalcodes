import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/node.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  target: 'es2022',
  splitting: false,
  treeshake: true,
});
// Note: the `./bundled` entry is emitted by scripts/build-bundled.ts after
// tsup runs (see the `build` script). We can't route it through tsup because
// tsup's CJS/ESM interop replaces `require(literal)` with `__require(literal)`,
// which Metro's static dependency extractor does not follow into the bundle.
