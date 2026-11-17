import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as config from '../config.js';
import { en } from './strings.en.js';

// Lightweight i18n: two flat string dictionaries for interface text, plus a Gujarati overlay for
// the couple's content in config.js. Anything missing in Gujarati falls back to English, so the
// page never shows an empty label.
export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English', locale: 'en-IN' },
  { code: 'gu', label: 'ગુજરાતી', name: 'ગુજરાતી', locale: 'gu-IN' },
];
export const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'wedding-lang';
const STRINGS = { en };

const isLang = (v) => LANGUAGES.some((l) => l.code === v);

// ?lang=gu on a shared link wins, then the guest's last choice, then the default.
export function initialLang() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isLang(fromUrl)) return fromUrl;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage can be unavailable (private mode); fall through to the default */
  }
  return DEFAULT_LANG;
}

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Overlays translated values onto the English content. Arrays merge item by item (by position),
// and empty strings or missing keys keep the English value.
export function overlay(base, over) {
  if (over === undefined || over === null || over === '') return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    return base.map((item, i) => overlay(item, over[i]));
  }
  if (isPlainObject(base)) {
    if (!isPlainObject(over)) return base;
    const out = { ...base };
    for (const key of Object.keys(over)) out[key] = key in base ? overlay(base[key], over[key]) : over[key];
    return out;
  }
  return typeof over === typeof base ? over : base;
}

const BASE_CONTENT = {
  couple: config.couple,
  invitation: config.invitation,
  dates: config.dates,
  venue: config.venue,
  story: config.story,
  events: config.events,
  days: config.days,
  photos: config.photos,
  travel: config.travel,
  rsvp: config.rsvp,
  gifts: config.gifts,
  blessings: config.blessings,
  share: config.share,
  credit: config.credit,
};
const CONTENT = { en: BASE_CONTENT };

// Non-English packs are separate chunks: English-only guests never download them.
const LOADERS = { gu: () => import('./gu.js') };
export async function loadLanguage(lang) {
  if (STRINGS[lang] || !LOADERS[lang]) return;
  const pack = await LOADERS[lang]();
  STRINGS[lang] = pack.strings;
  CONTENT[lang] = overlay(BASE_CONTENT, pack.content);
}

export function translate(lang, key, vars) {
  let s = STRINGS[lang]?.[key] ?? STRINGS.en[key];
  if (s === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing string: ${key}`);
    return key;
  }
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  return s;
}

function makeValue(lang, setLang) {
  const info = LANGUAGES.find((l) => l.code === lang);
  return {
    lang,
    setLang,
    locale: info.locale,
    t: (key, vars) => translate(lang, key, vars),
    errorText: (err) => {
      const key = `error.${err?.code}`;
      if (STRINGS.en[key]) return translate(lang, key);
      return lang === 'en' && err?.message ? err.message : translate(lang, 'error.generic');
    },
    content: CONTENT[lang] || CONTENT.en,
    // Text stored in the database: { name, description, translations: { gu: {...} } }
    pick: (item, field) => (lang !== 'en' && item?.translations?.[lang]?.[field]) || item?.[field] || '',
  };
}

// Components rendered outside the provider (e.g. in isolation) still get English.
const I18nContext = createContext(makeValue(DEFAULT_LANG, () => {}));

export function LanguageProvider({ children }) {
  // main.jsx preloads the saved language's pack before the first render, so there is no flash.
  const [lang, setLangState] = useState(() => {
    const l = initialLang();
    return STRINGS[l] ? l : DEFAULT_LANG;
  });

  const setLang = useCallback(async (next) => {
    if (!isLang(next)) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* preference simply won't persist */
    }
    try {
      await loadLanguage(next);
      setLangState(next);
    } catch {
      /* offline and the pack is not cached: stay in the current language */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const value = useMemo(() => makeValue(lang, setLang), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
