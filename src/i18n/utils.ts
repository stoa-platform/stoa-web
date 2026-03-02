import { ui, defaultLang, type Lang, languages } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    return ui[lang]?.[key] ?? ui[defaultLang]?.[key] ?? key;
  };
}

export function getAlternateUrl(url: URL, targetLang: Lang): string {
  const path = url.pathname;
  if (targetLang === defaultLang) {
    // Remove /fr/ prefix for EN
    return path.replace(/^\/fr(?=\/|$)/, '') || '/';
  }
  // Add /fr prefix for FR
  if (path.startsWith('/fr')) return path;
  return `/fr${path === '/' ? '/' : path}`;
}

export function getLocalizedHref(lang: Lang, path: string): string {
  if (lang === defaultLang) return path;
  return `/fr${path}`;
}

export { type Lang, languages, defaultLang };
