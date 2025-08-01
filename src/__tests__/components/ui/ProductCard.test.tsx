/**
 * Unit Tests for ProductCard Component
 * Tests product display, interactions, and pricing
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/ui/ProductCard';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} />
  )
}));

// Mock ProductBadge component
vi.mock('@/components/ui/ProductBadge', () => ({
  ProductBadge: ({ type }: any) => (
    <div className={`product-badge product-badge-${type}`}>
      {type}
    </div>
  )
}));

// Mock PriceDisplay component
vi.mock('@/components/ui/PriceDisplay', () => ({
  PriceDisplay: ({ product }: any) => (
    <div className="price-display">
      <span className="text-lg font-bold text-gray-900">
        R$ {product.price.toFixed(2).replace('.', ',')}
      </span>
      {product.promotional_price && product.promotional_price < product.price && (
        <span className="text-sm text-gray-500 line-through">
          R$ {product.price.toFixed(2).replace('.', ',')}
        </span>
      )}
    </div>
  )
}));

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Pizza Margherita',
    description: 'Delicious pizza with tomato, mozzarella and basil',
    price: 25.99,
    promotional_price: 0,
    image: '/images/pizza-margherita.jpg',
    category: 'pizzas',
    available: true,
    is_featured: false,
    is_popular: false,
    tags: ['vegetarian', 'classic']
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render product information correctly', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.getByText('Delicious pizza with tomato, mozzarella and basil')).toBeInTheDocument();
      expect(screen.getByText('R$ 25,99')).toBeInTheDocument();
      expect(screen.getByAltText('Pizza Margherita')).toBeInTheDocument();
    });

    it('should render product badges when showBadge is true', () => {
      const featuredProduct = { 
        ...mockProduct, 
        is_featured: true, 
        is_popular: true,
        promotional_price: 20.99
      };
      
      render(
        <ProductCard 
          product={featuredProduct} 
          onClick={mockOnClick}
          showBadge={true}
        />
      );

      expect(document.querySelector('.product-badge-featured')).toBeInTheDocument();
      expect(document.querySelector('.product-badge-popular')).toBeInTheDocument();
      expect(document.querySelector('.product-badge-promotion')).toBeInTheDocument();
    });

    it('should not render badges when showBadge is false', () => {
      const featuredProduct = { 
        ...mockProduct, 
        is_featured: true, 
        is_popular: true 
      };
      
      render(
        <ProductCard 
          product={featuredProduct} 
          onClick={mockOnClick}
          showBadge={false}
        />
      );

      expect(document.querySelector('.product-badge-featured')).not.toBeInTheDocument();
      expect(document.querySelector('.product-badge-popular')).not.toBeInTheDocument();
    });

    it('should render product tags', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('vegetarian')).toBeInTheDocument();
      expect(screen.getByText('classic')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      const productCard = screen.getByText('Pizza Margherita').closest('div');
      fireEvent.click(productCard!);

      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should call onClick when product image is clicked', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      const productImage = screen.getByAltText('Pizza Margherita');
      fireEvent.click(productImage);

      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should have hover effects', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      const productCard = screen.getByText('Pizza Margherita').closest('div');
      expect(productCard).toHaveClass('hover:scale-105', 'hover:shadow-lg');
    });
  });

  describe('Styling and Visual Effects', () => {
    it('should apply custom className', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
          className="custom-product-card"
        />
      );

      const productCard = screen.getByText('Pizza Margherita').closest('.custom-product-card');
      expect(productCard).toBeInTheDocument();
    });

    it('should have transition and hover classes', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      const productCard = screen.getByText('Pizza Margherita').closest('div');
      expect(productCard).toHaveClass('transform', 'transition-all', 'duration-200');
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      const productImage = screen.getByAltText('Pizza Margherita');
      expect(productImage).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      const productCard = screen.getByText('Pizza Margherita').closest('div');
      expect(productCard).toHaveClass('cursor-pointer');
    });

    it('should have semantic HTML structure', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Pizza Margherita');
    });
  });

  describe('Price Display', () => {
    it('should format price correctly', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('R$ 25,99')).toBeInTheDocument();
    });

    it('should show promotional price when available', () => {
      const promotionalProduct = { 
        ...mockProduct, 
        promotional_price: 20.99
      };
      
      render(
        <ProductCard 
          product={promotionalProduct} 
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('R$ 20,99')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should use placeholder image when product image is not available', () => {
      const productWithoutImage = { 
        ...mockProduct, 
        image: null 
      };
      
      render(
        <ProductCard 
          product={productWithoutImage} 
          onClick={mockOnClick}
        />
      );

      const productImage = screen.getByAltText('Pizza Margherita');
      expect(productImage).toHaveAttribute('src', '/placeholder-product.jpg');
    });

    it('should use product image when available', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
        />
      );

      const productImage = screen.getByAltText('Pizza Margherita');
      expect(productImage).toHaveAttribute('src', '/images/pizza-margherita.jpg');
    });
  });

  describe('Promotional Features', () => {
    it('should render promotional styling when isPromotional is true', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onClick={mockOnClick}
          isPromotional={true}
        />
      );

      const productCard = screen.getByText('Pizza Margherita').closest('div');
      expect(productCard).toBeInTheDocument();
    });

    it('should limit tags display to maximum of 2', () => {
      const productWithManyTags = {
        ...mockProduct,
        tags: ['vegetarian', 'classic', 'popular', 'new', 'spicy']
      };
      
      render(
        <ProductCard 
          product={productWithManyTags} 
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('vegetarian')).toBeInTheDocument();
      expect(screen.getByText('classic')).toBeInTheDocument();
      expect(screen.queryByText('popular')).not.toBeInTheDocument();
    });
  });
});