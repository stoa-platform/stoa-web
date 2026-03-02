// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://gostoa.dev',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          fr: 'fr',
        },
      },
      serialize(item) {
        if (item.url === 'https://gostoa.dev/' || item.url === 'https://gostoa.dev/fr/') {
          item.changefreq = 'weekly';
          item.priority = 1.0;
        } else if (item.url.includes('/feedback')) {
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
