import en from './en.json';
import fr from './fr.json';

export type Locale = 'en' | 'fr';

const translations: Record<Locale, typeof en> = { en, fr };

export const defaultLocale: Locale = 'en';
export const locales: Locale[] = ['en', 'fr'];

export function getLocaleFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (locales.includes(lang as Locale)) {
    return lang as Locale;
  }
  return defaultLocale;
}

export function t(locale: Locale): typeof en {
  return translations[locale] ?? translations[defaultLocale];
}

export function getLocalePath(path: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return path;
  }
  return `/${locale}${path}`;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'en' ? 'fr' : 'en';
}
