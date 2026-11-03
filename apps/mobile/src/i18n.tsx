import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { COPY, isLocale, type Copy, type Locale } from './copy';

const STORAGE_KEY = 'a12.locale';

function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return isLocale(code) ? code : 'en';
}

interface I18nValue {
  locale: Locale;
  t: Copy;
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nValue>({ locale: 'en', t: COPY.en, setLocale: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (isLocale(saved)) setLocaleState(saved);
      })
      .catch(() => {});
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  return <I18nContext.Provider value={{ locale, t: COPY[locale], setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
