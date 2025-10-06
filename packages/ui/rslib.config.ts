import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      output: {
        distPath: {
          root: './dist',
        },
      },
      dts: {
        bundle: false,
      },
    },
    {
      format: 'cjs',
      output: {
        distPath: {
          root: './dist',
        },
      },
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
      styles: './src/styles.css',
    },
  },
  output: {
    target: 'web',
    copy: [
      {
        from: './src/styles.css',
        to: './styles.css',
      },
    ],
  },
});
