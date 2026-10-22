import { ui, defaultLang, type Lang, languages } from './ui';

export function getLangFromUrl(url: URL): Lang {
  return /^\/fr(?:\/|$)/.test(url.pathname) ? 'fr' : defaultLang;
}

export function useTranslations(lang: Lang) {
  return (key: string): string => ui[lang][key] ?? ui[defaultLang][key] ?? key;
}

export function getAlternateUrl(url: URL, targetLang: Lang): string {
  let path = url.pathname.replace(/^\/fr(?=\/|$)/, '') || '/';
  if (/^\/(?:legal|mentions-legales)\/?$/.test(path)) path = targetLang === 'fr' ? '/mentions-legales/' : '/legal/';
  const normalized = path.endsWith('/') ? path : `${path}/`;
  return targetLang === defaultLang ? normalized : `/fr${normalized}`;
}

export function getLocalizedHref(lang: Lang, path: string): string {
  const normalized = path.endsWith('/') ? path : `${path}/`;
  return lang === defaultLang ? normalized : `/fr${normalized}`;
}

export { type Lang, languages, defaultLang };
