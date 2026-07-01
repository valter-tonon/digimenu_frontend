import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/components/providers/I18nProvider';
import i18n from '@/i18n/config';

const mockMenu = {
  cartItems: [] as Array<{ id: string; name: string; price: number; quantity: number }>,
  formatPrice: (v: number) => `R$ ${v.toFixed(2)}`,
  removeFromCart: vi.fn(),
};

vi.mock('@/infrastructure/context/MenuContext', () => ({
  useMenu: () => mockMenu,
}));

import { OrderSummary } from '@/components/menu/OrderSummary';

describe('OrderSummary em i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  it('mostra o estado de carrinho vazio em espanhol', () => {
    mockMenu.cartItems = [];
    render(
      <I18nProvider>
        <OrderSummary onClose={() => {}} />
      </I18nProvider>
    );

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('mostra o resumo e os botões traduzidos com itens no carrinho', () => {
    mockMenu.cartItems = [
      { id: '1', name: 'Pizza', price: 30, quantity: 2 },
    ];
    render(
      <I18nProvider>
        <OrderSummary onClose={() => {}} />
      </I18nProvider>
    );

    // step inicial (não delivery) = confirmation
    expect(screen.getByText('Confirmar pedido')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('Finalizar pedido')).toBeInTheDocument();
  });
});
