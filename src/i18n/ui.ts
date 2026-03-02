import en from './en.json';
import fr from './fr.json';

export const languages = {
  en: 'English',
  fr: 'Français',
} as const;

export const defaultLang = 'en' as const;

export type Lang = keyof typeof languages;

export const ui: Record<Lang, Record<string, string>> = { en, fr };
