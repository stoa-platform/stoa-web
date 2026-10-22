import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const site = 'https://www.gostoa.dev';
const localizedPath = (path, lang) => {
  let slug = path.replace(/^\/fr(?=\/|$)/, '') || '/';
  if (/^\/(?:legal|mentions-legales)\/$/.test(slug)) {
    slug = lang === 'fr' ? '/mentions-legales/' : '/legal/';
  }
  return lang === 'fr' ? `/fr${slug}` : slug;
};

export default defineConfig({
  site,
  trailingSlash: 'always',
  redirects: {
    '/demo': '/contact/',
    '/fr/demo': '/fr/contact/',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !/\/(?:404(?:\.html)?|demo)\/?$/.test(new URL(page).pathname),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const en = `${site}${localizedPath(path, 'en')}`;
        const fr = `${site}${localizedPath(path, 'fr')}`;
        item.links = [
          { lang: 'en', url: en },
          { lang: 'fr', url: fr },
          { lang: 'x-default', url: en },
        ];
        return item;
      },
    }),
  ],
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: { build: { cssMinify: true } },
});
