import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/components/providers/I18nProvider';
import i18n from '@/i18n/config';
import { MenuHeader } from '@/components/menu/MenuHeader';

vi.mock('@/hooks/useAppContext', () => ({
  useAppContext: () => ({ data: {} }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false, customer: null, logoutUser: vi.fn() }),
}));

vi.mock('@/services/whatsappAuth', () => ({
  whatsappAuthService: {
    getCurrentJWT: () => null,
    getStoredAuth: () => null,
    clearAuth: vi.fn(),
  },
}));

vi.mock('@/components/menu/StoreHeader', () => ({
  CompactStoreHeader: () => <div>store</div>,
}));

vi.mock('@/components/menu/WaiterCallButton', () => ({
  WaiterCallButton: () => <button>waiter</button>,
}));

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

describe('MenuHeader i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  it('renderiza textos do header em espanhol', () => {
    render(
      <I18nProvider>
        <MenuHeader
          cartItemsCount={0}
          onCartClick={() => {}}
          openingHours={{ opens_at: '09:00', closes_at: '18:00', is_open: false }}
        />
      </I18nProvider>
    );

    // status "Fechado" traduzido
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
    // aria-label do carrinho traduzido
    expect(screen.getByLabelText('Carrito')).toBeInTheDocument();
  });
});
