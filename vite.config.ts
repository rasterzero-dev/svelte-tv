import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { svelteTvFonts } from './src/vite/index.js';

export default defineConfig({
  plugins: [
    svelteTvFonts({
      charsets: {
        '*': {
          charset:
            ' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ğĞüÜşŞıİöÖçÇ.,:;!?-_/()[]',
        },
      },
    }),
    svelte({
      preprocess: vitePreprocess({ script: true }),
    }),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
