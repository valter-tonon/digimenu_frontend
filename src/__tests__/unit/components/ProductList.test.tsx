import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockProductList, createMockProduct } from '../../factories/mockData';

// Mock do componente ProductList
const MockProductList = ({ 
  products, 
  onProductClick, 
  onAddToCart,
  searchTerm = '',
  selectedCategory = null,
  filters = {}
}: {
  products: any[];
  onProductClick?: (product: any) => void;
  onAddToCart?: (product: any) => void;
  searchTerm?: string;
  selectedCategory?: string | null;
  filters?: any;
}) => {
  const [filteredProducts, setFilteredProducts] = React.useState(products);

  React.useEffect(() => {
    let filtered = products;

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Aplicar filtro de categoria
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id.toString() === selectedCategory);
    }

    // Aplicar filtros avançados
    if (filters.onlyFeatured) {
      filtered = filtered.filter(product => product.is_featured);
    }

    if (filters.onlyPromotional) {
      filtered = filtered.filter(product => product.is_on_promotion);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, filters]);

  if (filteredProducts.length === 0) {
    return (
      <div data-testid="no-products">
        <p>Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div data-testid="product-list">
      {filteredProducts.map((product) => (
        <div key={product.id} data-testid={`product-card-${product.uuid}`} className="product-card">
          <div className="product-image">
            <img src={product.image} alt={product.name} />
          </div>
          
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            
            <div className="product-price">
              {product.promotional_price ? (
                <>
                  <span className="promotional-price">R$ {product.promotional_price.toFixed(2)}</span>
                  <span className="original-price line-through">R$ {product.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="price">R$ {product.price.toFixed(2)}</span>
              )}
            </div>
            
            <div className="product-tags">
              {product.tags.map((tag: string) => (
                <span key={tag} className="tag" data-testid={`tag-${tag}`}>
                  {tag}
                </span>
              ))}
            </div>
            
            {product.is_featured && (
              <span className="featured-badge" data-testid="featured-badge">
                Destaque
              </span>
            )}
            
            {product.is_popular && (
              <span className="popular-badge" data-testid="popular-badge">
                Popular
              </span>
            )}
            
            {product.is_on_promotion && (
              <span className="promotion-badge" data-testid="promotion-badge">
                Promoção
              </span>
            )}
          </div>
          
          <div className="product-actions">
            <button 
              data-testid={`view-details-${product.uuid}`}
              onClick={() => onProductClick?.(product)}
            >
              Ver detalhes
            </button>
            
            <button 
              data-testid={`add-to-cart-${product.uuid}`}
              onClick={() => onAddToCart?.(product)}
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

describe('ProductList Component', () => {
  const mockProducts = createMockProductList();
  const mockOnProductClick = vi.fn();
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product Rendering and Filtering', () => {
    it('should render all products correctly', () => {
      render(
        <MockProductList 
          products={mockProducts}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('product-list')).toBeInTheDocument();
      
      // Verificar se todos os produtos são renderizados
      mockProducts.forEach(product => {
        expect(screen.getByTestId(`product-card-${product.uuid}`)).toBeInTheDocument();
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.description)).toBeInTheDocument();
      });
    });

    it('should display product prices correctly', () => {
      render(
        <MockProductList 
          products={mockProducts}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Verificar produto com preço normal
      const normalPriceProduct = mockProducts.find(p => !p.promotional_price);
      if (normalPriceProduct) {
        expect(screen.getByText(`R$ ${normalPriceProduct.price.toFixed(2)}`)).toBeInTheDocument();
      }

      // Verificar produto com preço promocional
      const promotionalProduct = mockProducts.find(p => p.promotional_price);
      if (promotionalProduct) {
        expect(screen.getByText(`R$ ${promotionalProduct.promotional_price!.toFixed(2)}`)).toBeInTheDocument();
        expect(screen.getByText(`R$ ${promotionalProduct.price.toFixed(2)}`)).toBeInTheDocument();
      }
    });

    it('should filter products by search term', () => {
      render(
        <MockProductList 
          products={mockProducts}
          searchTerm="X-Bacon"
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Deve mostrar apenas produtos que correspondem à busca
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      expect(screen.queryByText('Coca-Cola')).not.toBeInTheDocument();
    });

    it('should filter products by category', () => {
      render(
        <MockProductList 
          products={mockProducts}
          selectedCategory="1"
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Deve mostrar apenas produtos da categoria 1 (Lanches)
      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      expect(screen.getByText('X-Salada')).toBeInTheDocument();
      expect(screen.queryByText('Coca-Cola')).not.toBeInTheDocument();
    });

    it('should apply advanced filters', () => {
      render(
        <MockProductList 
          products={mockProducts}
          filters={{ onlyFeatured: true }}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Deve mostrar apenas produtos em destaque
      const featuredProducts = mockProducts.filter(p => p.is_featured);
      featuredProducts.forEach(product => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
      });

      const nonFeaturedProducts = mockProducts.filter(p => !p.is_featured);
      nonFeaturedProducts.forEach(product => {
        expect(screen.queryByText(product.name)).not.toBeInTheDocument();
      });
    });

    it('should show no products message when no results', () => {
      render(
        <MockProductList 
          products={mockProducts}
          searchTerm="produto-inexistente"
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('no-products')).toBeInTheDocument();
      expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should search by product name', () => {
      render(
        <MockProductList 
          products={mockProducts}
          searchTerm="bacon"
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      expect(screen.queryByText('Pudim')).not.toBeInTheDocument();
    });

    it('should search by product description', () => {
      render(
        <MockProductList 
          products={mockProducts}
          searchTerm="hambúrguer"
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      expect(screen.getByText('X-Salada')).toBeInTheDocument();
    });

    it('should search by product tags', () => {
      render(
        <MockProductList 
          products={mockProducts}
          searchTerm="picante"
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
      expect(screen.queryByText('X-Salada')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(
        <MockProductList 
          products={mockProducts}
          searchTerm="BACON"
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('X-Bacon')).toBeInTheDocument();
    });
  });

  describe('Product Interaction Events', () => {
    it('should call onProductClick when view details is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MockProductList 
          products={mockProducts}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      const viewDetailsButton = screen.getByTestId(`view-details-${mockProducts[0].uuid}`);
      await user.click(viewDetailsButton);

      expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
      expect(mockOnProductClick).toHaveBeenCalledTimes(1);
    });

    it('should call onAddToCart when add to cart is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MockProductList 
          products={mockProducts}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      const addToCartButton = screen.getByTestId(`add-to-cart-${mockProducts[0].uuid}`);
      await user.click(addToCartButton);

      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProducts[0]);
      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple product interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <MockProductList 
          products={mockProducts}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Clicar em vários produtos
      const firstProduct = screen.getByTestId(`view-details-${mockProducts[0].uuid}`);
      const secondProduct = screen.getByTestId(`add-to-cart-${mockProducts[1].uuid}`);

      await user.click(firstProduct);
      await user.click(secondProduct);

      expect(mockOnProductClick).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Product Badges and Tags', () => {
    it('should display featured badge for featured products', () => {
      const featuredProduct = createMockProduct({ is_featured: true });
      
      render(
        <MockProductList 
          products={[featuredProduct]}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('featured-badge')).toBeInTheDocument();
      expect(screen.getByText('Destaque')).toBeInTheDocument();
    });

    it('should display popular badge for popular products', () => {
      const popularProduct = createMockProduct({ is_popular: true });
      
      render(
        <MockProductList 
          products={[popularProduct]}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('popular-badge')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('should display promotion badge for promotional products', () => {
      const promotionalProduct = createMockProduct({ 
        is_on_promotion: true,
        promotional_price: 20.00
      });
      
      render(
        <MockProductList 
          products={[promotionalProduct]}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('promotion-badge')).toBeInTheDocument();
      expect(screen.getByText('Promoção')).toBeInTheDocument();
    });

    it('should display product tags', () => {
      const productWithTags = createMockProduct({ 
        tags: ['picante', 'novo', 'especial']
      });
      
      render(
        <MockProductList 
          products={[productWithTags]}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('tag-picante')).toBeInTheDocument();
      expect(screen.getByTestId('tag-novo')).toBeInTheDocument();
      expect(screen.getByTestId('tag-especial')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty product list', () => {
      render(
        <MockProductList 
          products={[]}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('no-products')).toBeInTheDocument();
      expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument();
    });

    it('should handle products without images', () => {
      const productWithoutImage = createMockProduct({ image: '' });
      
      render(
        <MockProductList 
          products={[productWithoutImage]}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      const productCard = screen.getByTestId(`product-card-${productWithoutImage.uuid}`);
      expect(productCard).toBeInTheDocument();
    });

    it('should handle products without tags', () => {
      const productWithoutTags = createMockProduct({ tags: [] });
      
      render(
        <MockProductList 
          products={[productWithoutTags]}
          onProductClick={mockOnProductClick}
          onAddToCart={mockOnAddToCart}
        />
      );

      const productCard = screen.getByTestId(`product-card-${productWithoutTags.uuid}`);
      expect(productCard).toBeInTheDocument();
    });

    it('should handle missing callback functions', () => {
      render(
        <MockProductList 
          products={mockProducts}
        />
      );

      // Deve renderizar sem erros mesmo sem callbacks
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });
  });
});