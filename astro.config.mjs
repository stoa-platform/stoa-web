// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://gostoa.dev',

  integrations: [
    tailwind(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Customize which pages to include
      filter: (page) => !page.includes('/api/'),
      // Custom entries
      customPages: [
        'https://gostoa.dev/',
        'https://gostoa.dev/features',
        'https://gostoa.dev/pricing',
        'https://gostoa.dev/docs',
      ],
      // Serialize function for custom sitemap entries
      serialize: (item) => ({
        ...item,
        changefreq: item.url === 'https://gostoa.dev/' ? 'daily' : 'weekly',
        priority: item.url === 'https://gostoa.dev/' ? 1.0 : 0.7,
      }),
    }),
  ],

  adapter: vercel(),

  // Redirects
  redirects: {
    '/github': 'https://github.com/stoa-platform/stoa',
    '/discord': 'https://discord.gg/j8tHSSes',
    '/docs': 'https://docs.gostoa.dev',
  },

  // Build options
  build: {
    inlineStylesheets: 'auto',
  },

  // Vite options
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
