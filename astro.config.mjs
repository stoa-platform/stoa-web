// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://gostoa.dev',

  integrations: [
    tailwind(),
    sitemap({
      serialize(item) {
        if (item.url === 'https://gostoa.dev/') {
          item.changefreq = 'weekly';
          item.priority = 1.0;
        } else if (item.url === 'https://gostoa.dev/feedback/') {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.5;
        }
        return item;
      },
    }),
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
