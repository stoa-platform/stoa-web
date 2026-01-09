// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://gostoa.dev',

  integrations: [
    tailwind(),
    sitemap(),
  ],

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      cssMinify: true,
    },
  },
});
