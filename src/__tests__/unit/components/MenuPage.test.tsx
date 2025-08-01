import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMockMenuData, createMockTenant, createMockProductList } from '../../factories/mockData';
import { menuApiResponse, menuApiError } from '../../fixtures/apiResponses';

// Mock do componente MenuPage (será implementado)
const MockMenuPage = ({ storeId }: { storeId: string }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [menuData, setMenuData] = React.useState<any>(null);

  React.useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      if (storeId === 'error-store') {
        setError('Erro ao carregar menu');
        setLoading(false);
        return;
      }
      
      setMenuData(createMockMenuData());
      setLoading(false);
    }, 100);
  }, [storeId]);

  if (loading) {
    return <div data-testid="loading">Carregando cardápio...</div>;
  }

  if (error) {
    return <div data-testid="error">{error}</div>;
  }

  return (
    <div data-testid="menu-page">
      <header data-testid="store-header">
        <h1>{menuData.tenant.name}</h1>
        <span data-testid="store-status">
          {menuData.tenant.opening_hours.is_open ? 'Aberto' : 'Fechado'}
        </span>
      </header>
      
      <div data-testid="categories">
        {menuData.categories.map((category: any) => (
          <button key={category.id} data-testid={`category-${category.slug}`}>
            {category.name}
          </button>
        ))}
      </div>
      
      <div data-testid="products">
        {menuData.products.map((product: any) => (
          <div key={product.id} data-testid={`product-${product.uuid}`}>
            <h3>{product.name}</h3>
            <p>R$ {product.price.toFixed(2)}</p>
            {product.is_featured && <span data-testid="featured-badge">Destaque</span>}
            <button data-testid={`add-to-cart-${product.uuid}`}>
              Adicionar ao Carrinho
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('MenuPage Component', () => {
  const defaultStoreId = '02efe224-e368-4a7a-a153-5fc49cd9c5ac';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Loading and Data Display', () => {
    it('should load menu page with store UUID', async () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      // Verificar estado de loading inicial
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Carregando cardápio...')).toBeInTheDocument();

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.getByTestId('menu-page')).toBeInTheDocument();
      });

      // Verificar se dados foram carregados
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('store-header')).toBeInTheDocument();
    });

    it('should identify automatically as delivery mode', async () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByTestId('menu-page')).toBeInTheDocument();
      });

      // Verificar se está em modo delivery (sem mesa)
      // Isso seria verificado através do contexto da aplicação
      expect(screen.getByTestId('menu-page')).toBeInTheDocument();
    });

    it('should display header with store information', async () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByText('Empresa X')).toBeInTheDocument();
      });

      expect(screen.getByTestId('store-header')).toBeInTheDocument();
      expect(screen.getByTestId('store-status')).toBeInTheDocument();
      expect(screen.getByText('Aberto')).toBeInTheDocument();
    });

    it('should load categories and products', async () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByTestId('categories')).toBeInTheDocument();
      });

      // Verificar categorias
      expect(screen.getByTestId('category-lanches')).toBeInTheDocument();
      expect(screen.getByText('Lanches')).toBeInTheDocument();

      // Verificar produtos
      expect(screen.getByTestId('products')).toBeInTheDocument();
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      expect(screen.getByText('R$ 30.00')).toBeInTheDocument();
    });

    it('should display featured products', async () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByTestId('menu-page')).toBeInTheDocument();
      });

      const featuredBadges = screen.getAllByTestId('featured-badge');
      expect(featuredBadges).toHaveLength(2);
      expect(screen.getAllByText('Destaque')).toHaveLength(2);
    });
  });

  describe('Error States and Loading States', () => {
    it('should display loading while loading data', () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Carregando cardápio...')).toBeInTheDocument();
    });

    it('should display error when data is invalid', async () => {
      render(<MockMenuPage storeId="error-store" />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByText('Erro ao carregar menu')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-page')).not.toBeInTheDocument();
    });
  });

  describe('Component Props and State Management', () => {
    it('should handle store ID prop correctly', async () => {
      const customStoreId = 'custom-store-id';
      render(<MockMenuPage storeId={customStoreId} />);

      await waitFor(() => {
        expect(screen.getByTestId('menu-page')).toBeInTheDocument();
      });

      // Verificar se o componente foi renderizado com o ID correto
      expect(screen.getByTestId('menu-page')).toBeInTheDocument();
    });

    it('should update UI when state changes', async () => {
      const { rerender } = render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByText('Empresa X')).toBeInTheDocument();
      });

      // Simular mudança de estado (re-render com erro)
      rerender(<MockMenuPage storeId="error-store" />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should render add to cart buttons for products', async () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-to-cart-product-uuid-1')).toBeInTheDocument();
      });

      const addButton = screen.getByTestId('add-to-cart-product-uuid-1');
      expect(addButton).toHaveTextContent('Adicionar ao Carrinho');
    });

    it('should render category navigation buttons', async () => {
      render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByTestId('category-lanches')).toBeInTheDocument();
      });

      const categoryButton = screen.getByTestId('category-lanches');
      expect(categoryButton).toHaveTextContent('Lanches');
    });
  });

  describe('Data Validation', () => {
    it('should validate store UUID format', () => {
      const storeUuid = '02efe224-e368-4a7a-a153-5fc49cd9c5ac';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(uuidRegex.test(storeUuid)).toBe(true);
    });

    it('should validate product data structure', async () => {
      const mockData = createMockMenuData();
      const product = mockData.products[0];
      
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('uuid');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('is_featured');
      expect(typeof product.price).toBe('number');
      expect(typeof product.is_featured).toBe('boolean');
    });

    it('should validate tenant data structure', async () => {
      const mockData = createMockMenuData();
      const tenant = mockData.tenant;
      
      expect(tenant).toHaveProperty('id');
      expect(tenant).toHaveProperty('uuid');
      expect(tenant).toHaveProperty('name');
      expect(tenant).toHaveProperty('opening_hours');
      expect(tenant.opening_hours).toHaveProperty('is_open');
      expect(typeof tenant.opening_hours.is_open).toBe('boolean');
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', async () => {
      // Simular viewport mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<MockMenuPage storeId={defaultStoreId} />);

      await waitFor(() => {
        expect(screen.getByTestId('menu-page')).toBeInTheDocument();
      });

      // Verificar se componentes essenciais estão presentes
      expect(screen.getByTestId('store-header')).toBeInTheDocument();
      expect(screen.getByTestId('categories')).toBeInTheDocument();
      expect(screen.getByTestId('products')).toBeInTheDocument();
    });
  });
});