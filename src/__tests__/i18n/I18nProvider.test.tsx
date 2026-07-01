import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { I18nProvider } from '@/components/providers/I18nProvider';

function Probe() {
  const { t } = useTranslation();
  return <span>{t('common:language_name')}</span>;
}

describe('I18nProvider', () => {
  it('disponibiliza traduções para os filhos', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByText('Português')).toBeInTheDocument();
  });
});
