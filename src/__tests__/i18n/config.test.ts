import { describe, it, expect } from 'vitest';
import i18n, { SUPPORTED_LOCALES } from '@/i18n/config';

describe('i18n config', () => {
  it('traduz a mesma chave em cada idioma', async () => {
    expect(SUPPORTED_LOCALES).toEqual(['pt-BR', 'es', 'en']);

    await i18n.changeLanguage('pt-BR');
    expect(i18n.t('common:language_name')).toBe('Português');
    await i18n.changeLanguage('es');
    expect(i18n.t('common:language_name')).toBe('Español');
    await i18n.changeLanguage('en');
    expect(i18n.t('common:language_name')).toBe('English');
  });
});
