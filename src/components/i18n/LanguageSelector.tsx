'use client';

import { useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';

const LABELS: Record<string, string> = {
  'pt-BR': 'Português',
  es: 'Español',
  en: 'English',
};

export function LanguageSelector({ available, primary }: { available: string[]; primary: string }) {
  const { locale, setLocale, resolveInitial } = useLocale(available);

  useEffect(() => {
    setLocale(resolveInitial(available, primary));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available.join(','), primary]);

  if (!available || available.length <= 1) return null;

  return (
    <select
      aria-label="Idioma"
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      className="bg-transparent text-sm"
    >
      {available.map((l) => (
        <option key={l} value={l}>
          {LABELS[l] ?? l}
        </option>
      ))}
    </select>
  );
}
