import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import { userActions } from '../helpers/user-actions';
import { mockProducts } from '../fixtures/products';
import { mockTenant } from '../fixtures/tenant';
import { mockApiResponses } from '../__mocks__/api-client';

// Mock do Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/menu',
}));

// Mock do fetch global
global.fetch = vi.fn();

// Mock do toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock dos repositórios
vi.mock('@/infrastructure/di', () => ({
  useContainer: () => ({
    menuRepository: {
      getMenu: vi.fn().mockResolvedValue({
        categories: mockApiResponses.menu.categories,
        products: mockProducts,
        tenant: mockTenant
      })
    },
    orderRepository: {
      createOrder: vi.fn().mockResolvedValue(mockApiResponses.orderSuccess)
    }
  })
}));

// Mock do contexto da aplicação
vi.mock('@/hooks/useAppContext', () => ({
  useAppContext: () => ({
    data: {
      storeId: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
      tableId: null,
      isDelivery: true,
      storeName: 'Empresa X',
      isValid: true
    },
    isLoading: false,
    error: null,
    isValid: true
  })
}));

describe('Delivery Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockClear();
  });

  it('should complete full delivery flow successfully', async () => {
    // Mock da resposta da API para criação de pedido
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponses.orderSuccess
    });

    // Renderizar a página do menu em modo delivery
    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />, {
      initialStoreSlug: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
      initialTableId: null
    });

    // Aguardar carregamento do menu
    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verificar se está em modo delivery
    expect(screen.getByText('Empresa X')).toBeInTheDocument();
    expect(screen.queryByText('Mesa')).not.toBeInTheDocument();

    // Adicionar produto ao carrinho
    await userActions.addProductToCart('X-Bacon');

    // Verificar se o carrinho foi atualizado
    await waitFor(() => {
      const cartButton = screen.getByRole('button', { name: /carrinho/i });
      expect(cartButton).toBeInTheDocument();
    });

    // Ir para checkout
    await userActions.goToCheckout();

    // Verificar se foi redirecionado para checkout
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/checkout');
    });
  });

  it('should handle store closed state correctly', async () => {
    const closedTenant = { ...mockTenant, opening_hours: { ...mockTenant.opening_hours, is_open: false } };
    
    // Mock do repositório com loja fechada
    vi.mocked(vi.importActual('@/infrastructure/di')).useContainer = () => ({
      menuRepository: {
        getMenu: vi.fn().mockResolvedValue({
          categories: mockApiResponses.menu.categories,
          products: mockProducts,
          tenant: closedTenant
        })
      }
    });

    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />, {
      isStoreOpen: false
    });

    // Verificar alerta de loja fechada
    await waitFor(() => {
      expect(screen.getByText(/loja fechada no momento/i)).toBeInTheDocument();
    });

    // Tentar adicionar produto ao carrinho deve mostrar erro
    await userActions.addProductToCart('X-Bacon');
    
    // Toast de erro deve ser chamado
    const toast = await import('react-hot-toast');
    expect(toast.toast.error).toHaveBeenCalledWith(
      expect.stringContaining('fechado')
    );
  });

  it('should handle minimum order value validation', async () => {
    const highMinOrderTenant = { ...mockTenant, min_order_value: 50.00 };
    
    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />);

    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
    });

    // Adicionar produto de baixo valor
    await userActions.addProductToCart('X-Salada Promoção'); // R$ 20,00

    // Ir para checkout
    await userActions.goToCheckout();

    // Deve mostrar aviso de valor mínimo
    await waitFor(() => {
      expect(screen.getByText(/valor mínimo/i)).toBeInTheDocument();
    });

    // Botão de finalizar deve estar desabilitado
    const finishButton = screen.getByRole('button', { name: /finalizar/i });
    expect(finishButton).toBeDisabled();
  });

  it('should preserve cart state during navigation', async () => {
    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />);

    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
    });

    // Adicionar produto ao carrinho
    await userActions.addProductToCart('X-Bacon');

    // Verificar se o contador do carrinho foi atualizado
    await waitFor(() => {
      const cartCount = screen.getByText('1'); // Assumindo que mostra a quantidade
      expect(cartCount).toBeInTheDocument();
    });

    // Simular navegação (re-render do componente)
    renderWithProviders(<MenuPage.default />);

    // Verificar se o estado do carrinho foi preservado
    await waitFor(() => {
      const cartCount = screen.getByText('1');
      expect(cartCount).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock de erro na API
    (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />);

    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
    });

    // Adicionar produto e tentar finalizar pedido
    await userActions.addProductToCart('X-Bacon');
    await userActions.goToCheckout();

    // Deve mostrar erro
    const toast = await import('react-hot-toast');
    expect(toast.toast.error).toHaveBeenCalled();
  });

  it('should handle search and filters correctly', async () => {
    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />);

    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
    });

    // Testar busca
    await userActions.searchProducts('bacon');

    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      expect(screen.queryByText('X-Salada Promoção')).not.toBeInTheDocument();
    });

    // Limpar busca
    await userActions.searchProducts('');

    // Testar filtros
    await userActions.applyFilters({ onlyFeatured: true });

    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument(); // É featured
      expect(screen.queryByText('X-Tudo')).not.toBeInTheDocument(); // Não é featured
    });
  });

  it('should display featured and promotional products sections', async () => {
    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />);

    await waitFor(() => {
      expect(screen.getByText('Produtos em Destaque')).toBeInTheDocument();
    });

    // Verificar se produtos em destaque aparecem na seção especial
    expect(screen.getByText('X-Bacon')).toBeInTheDocument();

    // Se houver produtos promocionais, deve mostrar a seção
    const promotionalProducts = mockProducts.filter(p => p.is_on_promotion);
    if (promotionalProducts.length > 0) {
      expect(screen.getByText(/promoção/i)).toBeInTheDocument();
    }
  });

  it('should handle product additionals correctly', async () => {
    const MenuPage = await import('@/app/menu/page');
    renderWithProviders(<MenuPage.default />);

    await waitFor(() => {
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
    });

    // Abrir detalhes do produto
    const detailsButton = screen.getByText('Ver detalhes');
    await userActions.addProductToCart('X-Bacon');

    // Verificar se adicionais são mostrados
    await waitFor(() => {
      expect(screen.getByText('Adicionais')).toBeInTheDocument();
      expect(screen.getByText('Bacon Extra')).toBeInTheDocument();
    });

    // Selecionar adicional e verificar se o preço é atualizado
    // (implementação específica dependeria do componente)
  });
});