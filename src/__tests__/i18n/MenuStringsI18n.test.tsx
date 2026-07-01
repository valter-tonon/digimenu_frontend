import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@/components/providers/I18nProvider';
import i18n from '@/i18n/config';
import { FilterBar } from '@/components/ui/FilterBar';
import { ResultsStats } from '@/components/ui/ResultsStats';
import { SearchBar } from '@/components/ui/SearchBar';

describe('Strings do menu em i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  it('FilterBar renderiza rótulos em espanhol', () => {
    render(
      <I18nProvider>
        <FilterBar onFilterChange={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByText('Filtros'));
    expect(screen.getByText('Solo destacados')).toBeInTheDocument();
    expect(screen.getByText('Rango de precio')).toBeInTheDocument();
  });

  it('ResultsStats mostra o resumo e o estado vazio em espanhol', () => {
    const { container } = render(
      <I18nProvider>
        <ResultsStats totalProducts={10} filteredProducts={0} searchTerm="pizza" />
      </I18nProvider>
    );

    // A linha "Mostrando X de Y productos" tem números em <span>, então validamos pelo textContent
    expect(container.textContent).toContain('Mostrando');
    expect(container.textContent).toContain('productos');
    expect(container.textContent).toContain('Búsqueda: "pizza"');
    expect(
      screen.getByText('No se encontraron productos con los filtros aplicados')
    ).toBeInTheDocument();
  });

  it('SearchBar usa o placeholder traduzido por padrão', () => {
    render(
      <I18nProvider>
        <SearchBar onSearch={() => {}} />
      </I18nProvider>
    );

    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
  });
});
