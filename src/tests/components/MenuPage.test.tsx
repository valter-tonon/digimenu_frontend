import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuPageWrapper from '@/app/menu/page';
import { MenuProvider } from '@/infrastructure/context/MenuContext';

// Mock dos hooks e do contexto
vi.mock('@/infrastructure/hooks/useMenuParams', () => ({
  useMenuParams: () => ({
    tableId: '123',
    storeSlug: 'teste-restaurante',
    isDelivery: false,
    isValid: true,
    params: {
      table: '123',
      store: 'teste-restaurante',
      isDelivery: 'false'
    }
  })
}));

vi.mock('@/infrastructure/context/MenuContext', () => ({
  useMenu: () => ({
    tableId: '123',
    storeSlug: 'teste-restaurante',
    cartItems: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    updateCartItemQuantity: vi.fn()
  }),
  MenuProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock do useContainer
vi.mock('@/infrastructure/di', () => ({
  useContainer: () => ({
    menuRepository: {
      getMenu: vi.fn().mockResolvedValue({
        categories: [],
        products: [],
        tenant: {
          id: 1,
          uuid: 'abc123',
          name: 'Restaurante Teste',
          url: 'teste-restaurante',
          logo: 'logo.png',
          opening_hours: {
            opens_at: '10:00',
            closes_at: '22:00',
            is_open: true
          },
          min_order_value: 25.00
        }
      })
    }
  })
}));

// Mock do router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

// Mock dos componentes
vi.mock('@/components/menu', () => ({
  MenuHeader: ({ storeName, openingHours, minOrderValue }: any) => (
    <div data-testid="menu-header">
      <div>Nome: {storeName}</div>
      {openingHours && (
        <div>
          Horário: {openingHours.is_open ? 'Aberto' : 'Fechado'} (
          {openingHours.opens_at} - {openingHours.closes_at})
        </div>
      )}
      {minOrderValue && (
        <div>Pedido Mínimo: R$ {minOrderValue.toFixed(2)}</div>
      )}
    </div>
  ),
  CategoryList: () => <div data-testid="category-list"></div>,
  ProductList: () => <div data-testid="product-list"></div>
}));

vi.mock('@/components/menu/TableActions', () => ({
  TableActions: () => <div data-testid="table-actions"></div>
}));

vi.mock('@/components/menu/OrderSummary', () => ({
  OrderSummary: () => <div data-testid="order-summary"></div>
}));

vi.mock('@/components/ui/NotFound', () => ({
  NotFound: ({ message }: any) => <div data-testid="not-found">{message}</div>
}));

// Teste do componente MenuPage
describe('MenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o MenuHeader com as informações do tenant', async () => {
    // Usamos findByTestId porque o componente tem operações assíncronas
    const { findByTestId } = render(<MenuPageWrapper />);
    
    // Aguardar o carregamento
    const menuHeader = await findByTestId('menu-header');
    
    // Verificar se as informações estão sendo passadas corretamente
    expect(menuHeader).toHaveTextContent('Nome: Restaurante Teste');
    expect(menuHeader).toHaveTextContent('Horário: Aberto (10:00 - 22:00)');
    expect(menuHeader).toHaveTextContent('Pedido Mínimo: R$ 25.00');
  });
}); 