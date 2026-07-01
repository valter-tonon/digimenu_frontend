import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR/common.json';
import es from './locales/es/common.json';
import en from './locales/en/common.json';

export const SUPPORTED_LOCALES = ['pt-BR', 'es', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      'pt-BR': { common: ptBR },
      es: { common: es },
      en: { common: en },
    },
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
  });
}

export default i18n;
