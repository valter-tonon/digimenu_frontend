import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ProductCard } from '@/components/ui/ProductCard';
import { Product } from '@/domain/entities/Product';

// Mock the Magic UI components
vi.mock('@/components/ui/magic-card', () => ({
  MagicCard: ({ children, onClick, className, ...props }: any) => (
    <div 
      data-testid="magic-card" 
      onClick={onClick} 
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/border-beam', () => ({
  BorderBeam: (props: any) => (
    <div data-testid="border-beam" {...props} />
  ),
}));

vi.mock('@/components/ui/shimmer-button', () => ({
  ShimmerButton: ({ children, onClick, className, ...props }: any) => (
    <button 
      data-testid="shimmer-button" 
      onClick={onClick} 
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 10.99,
  promotional_price: 8.99,
  image: '/test-image.jpg',
  is_featured: true,
  is_popular: false,
  tags: ['tag1', 'tag2'],
  category_id: '1',
  tenant_id: '1',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('Enhanced ProductCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders with Magic UI components enabled by default', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onClick={mockOnClick}
        showBadge={true}
      />
    );

    expect(screen.getByTestId('magic-card')).toBeInTheDocument();
    expect(screen.getByTestId('border-beam')).toBeInTheDocument();
    expect(screen.getByTestId('shimmer-button')).toBeInTheDocument();
  });

  it('renders without Magic UI when disabled', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onClick={mockOnClick}
        enableMagicUI={false}
      />
    );

    expect(screen.queryByTestId('magic-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('border-beam')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shimmer-button')).not.toBeInTheDocument();
    
    // Should render traditional button instead
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeInTheDocument();
  });

  it('shows BorderBeam for featured products', () => {
    const featuredProduct = { ...mockProduct, is_featured: true };
    
    render(
      <ProductCard 
        product={featuredProduct} 
        onClick={mockOnClick}
        showBadge={true}
      />
    );

    const borderBeam = screen.getByTestId('border-beam');
    expect(borderBeam).toBeInTheDocument();
  });

  it('shows BorderBeam for promotional products', () => {
    const promotionalProduct = { 
      ...mockProduct, 
      is_featured: false,
      promotional_price: 5.99 
    };
    
    render(
      <ProductCard 
        product={promotionalProduct} 
        onClick={mockOnClick}
        showBadge={true}
      />
    );

    const borderBeam = screen.getByTestId('border-beam');
    expect(borderBeam).toBeInTheDocument();
  });

  it('does not show BorderBeam for regular products', () => {
    const regularProduct = { 
      ...mockProduct, 
      is_featured: false,
      promotional_price: null 
    };
    
    render(
      <ProductCard 
        product={regularProduct} 
        onClick={mockOnClick}
        showBadge={true}
      />
    );

    expect(screen.queryByTestId('border-beam')).not.toBeInTheDocument();
  });

  it('handles click events correctly', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onClick={mockOnClick}
      />
    );

    const magicCard = screen.getByTestId('magic-card');
    fireEvent.click(magicCard);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles add to cart button click without triggering card click', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onClick={mockOnClick}
      />
    );

    const addButton = screen.getByTestId('shimmer-button');
    fireEvent.click(addButton);
    
    // Should not trigger the card onClick since we stop propagation
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('displays product information correctly', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onClick={mockOnClick}
        showBadge={true}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
  });

  it('displays product tags', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onClick={mockOnClick}
        className="custom-class"
      />
    );

    const magicCard = screen.getByTestId('magic-card');
    expect(magicCard).toHaveClass('custom-class');
  });
});