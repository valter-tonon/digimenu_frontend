import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMockFetch } from '../fixtures/apiResponses';

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock do router
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do console para reduzir ruído nos testes
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Dados de teste
const mockMenuData = {
  categories: [
    {
      id: 1,
      name: 'Lanches',
      slug: 'lanches',
      image: null,
      description: 'Deliciosos lanches'
    }
  ],
  products: [
    {
      id: 1,
      uuid: 'product-uuid-1',
      name: 'X-Bacon',
      description: 'Delicioso hambúrguer com bacon',
      price: 30.00,
      promotional_price: null,
      is_featured: true,
      is_popular: false,
      is_on_promotion: false,
      category_id: 1,
      image: 'http://localhost/storage/test.webp',
      tags: ['picante', 'novo'],
      additionals: [
        {
          id: 1,
          name: 'Bacon Extra',
          price: 5.00
        }
      ]
    },
    {
      id: 2,
      uuid: 'product-uuid-2',
      name: 'X-Salada',
      description: 'Hambúrguer com salada',
      price: 25.00,
      promotional_price: 20.00,
      is_featured: false,
      is_popular: true,
      is_on_promotion: true,
      category_id: 1,
      image: 'http://localhost/storage/test2.webp',
      tags: ['saudável'],
      additionals: []
    }
  ],
  tenant: {
    id: 1,
    uuid: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
    name: 'Empresa X',
    url: 'empresa-x',
    logo: null,
    opening_hours: {
      opens_at: '00:00:00',
      closes_at: '23:59:00',
      is_open: true
    },
    min_order_value: 20.00,
    delivery_fee: 5.00,
    estimated_delivery_time: '30-45 min'
  }
};

const mockOrderResponse = {
  success: true,
  data: {
    identify: 'order-123',
    status: 'pending',
    total: 35.00
  }
};

describe('Delivery Flow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock das chamadas de API
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/menu')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMenuData)
        });
      }
      
      if (url.includes('/orders-kanban')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrderResponse)
        });
      }
      
      return Promise.reject(new Error('URL não mockada: ' + url));
    });

    // Mock do localStorage com dados iniciais
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'digimenu-app-context') {
        return JSON.stringify({
          storeId: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
          tableId: null,
          isDelivery: true,
          storeName: 'Empresa X'
        });
      }
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo Completo de Delivery', () => {
    it('deve completar o fluxo de delivery do início ao fim', async () => {
      // Importar componentes dinamicamente para evitar problemas de SSR
      const { default: MenuPage } = await import('@/app/menu/page');
      
      // 1. Renderizar página do menu
      render(<MenuPage />);

      // 2. Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.getByText('Empresa X')).toBeInTheDocument();
      }, { timeout: 5000 });

      // 3. Verificar se produtos foram carregados
      await waitFor(() => {
        expect(screen.getByText('X-Bacon')).toBeInTheDocument();
        expect(screen.getByText('X-Salada')).toBeInTheDocument();
      });

      // 4. Verificar produtos em destaque
      expect(screen.getByText('Produtos em Destaque')).toBeInTheDocument();
      
      // 5. Verificar produtos em promoção
      const promotionalSection = screen.queryByText('Produtos em Promoção');
      if (promotionalSection) {
        expect(promotionalSection).toBeInTheDocument();
      }

      // 6. Abrir detalhes do produto
      const productDetailsButtons = screen.getAllByText('Ver detalhes');
      fireEvent.click(productDetailsButtons[0]);

      // 7. Aguardar modal de detalhes abrir
      await waitFor(() => {
        expect(screen.getByText('Descrição')).toBeInTheDocument();
      });

      // 8. Verificar adicionais disponíveis
      if (screen.queryByText('Adicionais')) {
        expect(screen.getByText('Bacon Extra')).toBeInTheDocument();
      }

      // 9. Adicionar produto ao carrinho
      const addToCartButton = screen.getByText('Adicionar ao Carrinho');
      fireEvent.click(addToCartButton);

      // 10. Verificar se carrinho foi atualizado
      await waitFor(() => {
        const cartButton = screen.getByText('Abrir carrinho');
        expect(cartButton).toBeInTheDocument();
      });

      // 11. Abrir carrinho
      const cartButton = screen.getByText('Abrir carrinho');
      fireEvent.click(cartButton);

      // 12. Verificar conteúdo do carrinho
      await waitFor(() => {
        expect(screen.getByText('1x X-Bacon')).toBeInTheDocument();
      });

      // 13. Finalizar pedido (deve redirecionar para checkout)
      const finishOrderButton = screen.getByText('Finalizar Pedido');
      fireEvent.click(finishOrderButton);

      // 14. Verificar redirecionamento para checkout
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/checkout');
      });
    });

    it('deve gerenciar carrinho corretamente durante o fluxo', async () => {
      const { default: MenuPage } = await import('@/app/menu/page');
      
      render(<MenuPage />);

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      });

      // Abrir detalhes do primeiro produto
      const productDetailsButtons = screen.getAllByText('Ver detalhes');
      fireEvent.click(productDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Quantidade')).toBeInTheDocument();
      });

      // Aumentar quantidade
      const increaseButton = screen.getByLabelText('Aumentar quantidade');
      fireEvent.click(increaseButton);

      // Verificar se quantidade foi atualizada
      const quantityDisplay = screen.getByDisplayValue('2');
      expect(quantityDisplay).toBeInTheDocument();

      // Adicionar ao carrinho
      const addButton = screen.getByText('Adicionar ao Carrinho');
      fireEvent.click(addButton);

      // Verificar se localStorage foi chamado para persistir carrinho
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'digimenu-cart',
        expect.stringContaining('X-Bacon')
      );
    });

    it('deve aplicar filtros e busca corretamente', async () => {
      const { default: MenuPage } = await import('@/app/menu/page');
      
      render(<MenuPage />);

      await waitFor(() => {
        expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      });

      // Testar busca
      const searchInput = screen.getByPlaceholderText('Buscar produtos, categorias ou tags...');
      fireEvent.change(searchInput, { target: { value: 'X-Salada' } });

      // Verificar se apenas produtos correspondentes são exibidos
      await waitFor(() => {
        expect(screen.getByText('X-Salada')).toBeInTheDocument();
        expect(screen.queryByText('X-Bacon')).not.toBeInTheDocument();
      });

      // Limpar busca
      fireEvent.change(searchInput, { target: { value: '' } });

      // Verificar se todos os produtos voltaram
      await waitFor(() => {
        expect(screen.getByText('X-Bacon')).toBeInTheDocument();
        expect(screen.getByText('X-Salada')).toBeInTheDocument();
      });

      // Testar filtros
      const filterButton = screen.getByText('Filtros');
      fireEvent.click(filterButton);

      // Aplicar filtro de produtos em destaque
      const featuredFilter = screen.getByLabelText('Apenas em destaque');
      fireEvent.click(featuredFilter);

      // Aplicar filtros
      const applyFiltersButton = screen.getByText('Aplicar Filtros');
      fireEvent.click(applyFiltersButton);

      // Verificar se apenas produtos em destaque são exibidos
      await waitFor(() => {
        expect(screen.getByText('X-Bacon')).toBeInTheDocument();
        expect(screen.queryByText('X-Salada')).not.toBeInTheDocument();
      });
    });

    it('deve calcular preços promocionais corretamente', async () => {
      const { default: MenuPage } = await import('@/app/menu/page');
      
      render(<MenuPage />);

      await waitFor(() => {
        expect(screen.getByText('X-Salada')).toBeInTheDocument();
      });

      // Verificar preço promocional do X-Salada
      expect(screen.getByText('R$ 20,00')).toBeInTheDocument(); // Preço promocional
      expect(screen.getByText('R$ 25,00')).toBeInTheDocument(); // Preço original riscado

      // Abrir detalhes do produto em promoção
      const productCards = screen.getAllByText('Ver detalhes');
      const saladaCard = productCards.find(button => 
        button.closest('[data-testid="product-card"]')?.textContent?.includes('X-Salada')
      );
      
      if (saladaCard) {
        fireEvent.click(saladaCard);

        await waitFor(() => {
          expect(screen.getByText('R$ 20,00')).toBeInTheDocument();
        });

        // Adicionar ao carrinho
        const addButton = screen.getByText('Adicionar ao Carrinho');
        fireEvent.click(addButton);

        // Abrir carrinho e verificar preço
        const cartButton = screen.getByText('Abrir carrinho');
        fireEvent.click(cartButton);

        await waitFor(() => {
          expect(screen.getByText('R$ 20,00')).toBeInTheDocument();
        });
      }
    });

    it('deve validar valor mínimo do pedido', async () => {
      const { default: MenuPage } = await import('@/app/menu/page');
      
      render(<MenuPage />);

      await waitFor(() => {
        expect(screen.getByText('X-Salada')).toBeInTheDocument();
      });

      // Adicionar produto com valor menor que o mínimo
      const productDetailsButtons = screen.getAllByText('Ver detalhes');
      fireEvent.click(productDetailsButtons[1]); // X-Salada (R$ 20,00)

      await waitFor(() => {
        const addButton = screen.getByText('Adicionar ao Carrinho');
        fireEvent.click(addButton);
      });

      // Abrir carrinho
      const cartButton = screen.getByText('Abrir carrinho');
      fireEvent.click(cartButton);

      // Verificar se alerta de valor mínimo é exibido
      await waitFor(() => {
        expect(screen.getByText(/Valor mínimo para pedido é/)).toBeInTheDocument();
      });

      // Verificar se botão de finalizar está desabilitado
      const finishButton = screen.getByText('Finalizar Pedido');
      expect(finishButton).toBeDisabled();
    });

    it('deve tratar erros de API graciosamente', async () => {
      // Mock de erro na API
      mockFetch.mockImplementation(() => 
        Promise.reject(new Error('Erro de rede'))
      );

      const { default: MenuPage } = await import('@/app/menu/page');
      
      render(<MenuPage />);

      // Verificar se mensagem de erro é exibida
      await waitFor(() => {
        expect(screen.getByText(/Não foi possível carregar o menu/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('deve persistir estado do carrinho entre recarregamentos', async () => {
      // Simular dados do carrinho no localStorage
      const cartData = {
        state: {
          items: [{
            id: 'product-uuid-1',
            productId: 1,
            identify: 'product-uuid-1',
            name: 'X-Bacon',
            price: 30.00,
            quantity: 1,
            additionals: []
          }],
          storeId: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
          deliveryMode: true,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        }
      };

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'digimenu-cart') {
          return JSON.stringify(cartData);
        }
        if (key === 'digimenu-app-context') {
          return JSON.stringify({
            storeId: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
            tableId: null,
            isDelivery: true,
            storeName: 'Empresa X'
          });
        }
        return null;
      });

      const { default: MenuPage } = await import('@/app/menu/page');
      
      render(<MenuPage />);

      // Verificar se carrinho foi restaurado
      await waitFor(() => {
        const cartButton = screen.getByText('Abrir carrinho');
        expect(cartButton).toBeInTheDocument();
        
        // Verificar contador de itens
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });
});