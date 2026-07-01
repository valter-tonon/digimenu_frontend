'use client';

import { useState, useCallback } from 'react';
import i18n, { SUPPORTED_LOCALES } from '@/i18n/config';

const STORAGE_KEY = 'dm-locale';

function mapToSupported(raw: string, allowed: string[]): string | null {
  if (allowed.includes(raw)) return raw;
  const base = raw.split('-')[0];
  const match = allowed.find((l) => l === base || l.split('-')[0] === base);
  return match ?? null;
}

export function useLocale(allowed: string[] = [...SUPPORTED_LOCALES]) {
  const [locale, setLocaleState] = useState<string>(i18n.language);

  const setLocale = useCallback((l: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, l);
    }
    i18n.changeLanguage(l);
    setLocaleState(l);
  }, []);

  const resolveInitial = useCallback((allowedList: string[], primary: string): string => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && allowedList.includes(stored)) return stored;
    const fromNav = typeof navigator !== 'undefined' ? mapToSupported(navigator.language, allowedList) : null;
    return fromNav ?? primary;
  }, []);

  return { locale, setLocale, resolveInitial };
}
