import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { svelteTvFonts } from '../src/vite/index.js';

export default defineConfig({
  plugins: [
    svelteTvFonts({
      input: '../playground/src/fonts',
      charsets: {
        '*': {
          charset:
            ' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÄŸÄÃ¼ÃœÅŸÅÄ±Ä°Ã¶Ã–Ã§Ã‡.,:;!?-_/()[]',
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
