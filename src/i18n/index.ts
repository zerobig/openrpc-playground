import { en, type DictKey } from './en';
import { ru } from './ru';

export type { DictKey };

export type Locale = 'en' | 'ru';

export const LOCALES: ReadonlyArray<{ code: Locale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
];

const STORAGE_KEY = 'openrpc-playground.lang';
const dicts: Record<Locale, Record<DictKey, string>> = { en, ru };

let current: Locale = detectLocale();
const listeners = new Set<(l: Locale) => void>();

function isLocale(v: unknown): v is Locale {
  return v === 'en' || v === 'ru';
}

function detectLocale(): Locale {
  const q = new URLSearchParams(location.search).get('lang');
  if (isLocale(q)) return q;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  const nav = navigator.language?.toLowerCase() ?? '';
  if (nav.startsWith('ru')) return 'ru';
  return 'en';
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  if (current === locale) return;
  current = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  applyStaticTranslations();
  for (const fn of listeners) fn(locale);
}

export function onLocaleChange(fn: (l: Locale) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function t(key: DictKey, vars?: Record<string, string | number>): string {
  let s = dicts[current][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function applyStaticTranslations(): void {
  document.documentElement.lang = current;
  document.title = t('app.title');

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as DictKey | undefined;
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder as DictKey | undefined;
    if (key) el.placeholder = t(key);
  });

  const langSwitcher = document.getElementById('langSwitcher');
  if (langSwitcher) langSwitcher.setAttribute('aria-label', t('app.lang'));
}