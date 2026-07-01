import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/components/providers/I18nProvider';
import i18n from '@/i18n/config';
import { CategoryList } from '@/components/menu/CategoryList';

vi.mock('@/services/api', () => ({
  callWaiter: vi.fn(),
}));

import { WaiterCallButton } from '@/components/menu/WaiterCallButton';

describe('Navegação/ações de mesa em i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  it('CategoryList mostra "Todos" e o estado vazio em espanhol', () => {
    const { rerender } = render(
      <I18nProvider>
        <CategoryList categories={[]} onSelectCategory={() => {}} selectedCategoryId={null} />
      </I18nProvider>
    );

    expect(screen.getByText('No hay categorías disponibles.')).toBeInTheDocument();

    rerender(
      <I18nProvider>
        <CategoryList
          categories={[{ id: 1, name: 'Pizzas' } as never]}
          onSelectCategory={() => {}}
          selectedCategoryId={null}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Pizzas')).toBeInTheDocument();
  });

  it('WaiterCallButton (header) mostra o rótulo traduzido', () => {
    render(
      <I18nProvider>
        <WaiterCallButton storeId="s1" tableId="t1" variant="header" />
      </I18nProvider>
    );

    expect(screen.getByText('Llamar al camarero')).toBeInTheDocument();
  });
});
