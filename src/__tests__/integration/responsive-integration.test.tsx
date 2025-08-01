import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ResponsiveLayout, ResponsivePage, ResponsiveCard } from '@/components/layout/ResponsiveLayout';
import { MobileNavigation } from '@/components/ui/MobileNavigation';
import { TouchButton } from '@/components/ui/TouchFriendly';
import { LazyImage } from '@/components/ui/LazyImage';
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock Next.js Image
vi.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        {...props}
      />
    );
  };
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();
mockPerformanceObserver.mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));
window.PerformanceObserver = mockPerformanceObserver;

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowDimensions(1024, 768); // Default to desktop
  });

  describe('Complete Mobile Experience', () => {
    beforeEach(() => {
      mockWindowDimensions(375, 667); // iPhone SE
    });

    it('should render complete mobile layout with navigation', async () => {
      const handleCartClick = vi.fn();
      const handleSearchClick = vi.fn();

      render(
        <PerformanceProvider enabled={false}>
          <ResponsiveLayout
            showMobileNav={true}
            storeName="Test Restaurant"
            storeId="store-1"
            cartItemsCount={3}
            onCartClick={handleCartClick}
            onSearchClick={handleSearchClick}
          >
            <ResponsivePage
              title="Menu"
              subtitle="Choose your favorite dishes"
              containerSize="lg"
            >
              <ResponsiveCard title="Featured Products">
                <div className="grid grid-cols-1 gap-4">
                  <TouchButton onClick={vi.fn()}>
                    Add to Cart
                  </TouchButton>
                </div>
              </ResponsiveCard>
            </ResponsivePage>
          </ResponsiveLayout>
        </PerformanceProvider>
      );

      // Should show mobile navigation
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByLabelText('Carrinho')).toBeInTheDocument();

      // Should show page content
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Choose your favorite dishes')).toBeInTheDocument();
      expect(screen.getByText('Featured Products')).toBeInTheDocument();

      // Should have touch-friendly button
      const addButton = screen.getByText('Add to Cart');
      expect(addButton).toHaveClass('min-h-[44px]');

      // Test cart interaction
      const cartButton = screen.getByLabelText('Carrinho');
      fireEvent.click(cartButton);
      expect(handleCartClick).toHaveBeenCalled();
    });

    it('should handle mobile navigation menu', async () => {
      render(
        <MobileNavigation
          storeName="Test Restaurant"
          storeId="store-1"
          tableId="table-1"
          cartItemsCount={2}
          isAuthenticated={true}
        />
      );

      // Open menu
      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Início')).toBeInTheDocument();
        expect(screen.getByText('Buscar')).toBeInTheDocument();
        expect(screen.getByText('Perfil')).toBeInTheDocument();
      });

      // Should show table context
      expect(screen.getByText('Mesa 1')).toBeInTheDocument();
    });
  });

  describe('Tablet Experience', () => {
    beforeEach(() => {
      mockWindowDimensions(768, 1024); // iPad
    });

    it('should adapt layout for tablet screens', () => {
      render(
        <ResponsiveLayout showMobileNav={true}>
          <ResponsivePage containerSize="lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>Item 1</div>
              <div>Item 2</div>
              <div>Item 3</div>
            </div>
          </ResponsivePage>
        </ResponsiveLayout>
      );

      // Should still show mobile nav on tablet
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
    });
  });

  describe('Desktop Experience', () => {
    beforeEach(() => {
      mockWindowDimensions(1280, 720); // Desktop
    });

    it('should hide mobile navigation on desktop', () => {
      render(
        <ResponsiveLayout showMobileNav={true}>
          <ResponsivePage title="Desktop Page">
            <ResponsiveCard>
              <p>Desktop content</p>
            </ResponsiveCard>
          </ResponsivePage>
        </ResponsiveLayout>
      );

      // Mobile nav should not be visible on desktop
      expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
      expect(screen.getByText('Desktop Page')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should initialize performance monitoring', () => {
      render(
        <PerformanceProvider enabled={true}>
          <ResponsivePage title="Performance Test">
            <LazyImage
              src="/test-image.jpg"
              alt="Test image"
              width={300}
              height={200}
            />
          </ResponsivePage>
        </PerformanceProvider>
      );

      // Should initialize performance observers
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should handle lazy loading with skeleton states', async () => {
      const { rerender } = render(
        <div>
          <ProductGridSkeleton count={3} />
        </div>
      );

      // Should show skeleton initially
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Replace with actual content
      rerender(
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>Product 1</div>
            <div>Product 2</div>
            <div>Product 3</div>
          </div>
        </div>
      );

      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      mockWindowDimensions(375, 667); // Mobile
    });

    it('should handle touch events properly', () => {
      const handleClick = vi.fn();
      
      render(
        <TouchButton onClick={handleClick} ripple={true}>
          Touch Button
        </TouchButton>
      );

      const button = screen.getByRole('button');
      
      // Simulate touch sequence
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
      expect(button).toHaveClass('touch-manipulation');
    });

    it('should provide proper touch targets', () => {
      render(
        <ResponsiveLayout>
          <ResponsivePage>
            <TouchButton size="md">Button 1</TouchButton>
            <TouchButton size="lg">Button 2</TouchButton>
          </ResponsivePage>
        </ResponsiveLayout>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across responsive breakpoints', () => {
      const { rerender } = render(
        <ResponsiveLayout>
          <ResponsivePage title="Accessible Page">
            <TouchButton>Accessible Button</TouchButton>
          </ResponsivePage>
        </ResponsiveLayout>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');

      // Test on different screen sizes
      mockWindowDimensions(375, 667); // Mobile
      rerender(
        <ResponsiveLayout>
          <ResponsivePage title="Accessible Page">
            <TouchButton>Accessible Button</TouchButton>
          </ResponsivePage>
        </ResponsiveLayout>
      );

      // Accessibility should be maintained
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should provide proper ARIA labels', () => {
      render(
        <MobileNavigation
          storeName="Test Store"
          cartItemsCount={5}
        />
      );

      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Carrinho')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle image loading errors gracefully', async () => {
      render(
        <LazyImage
          src="/non-existent-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          fallbackSrc="/fallback.jpg"
        />
      );

      const img = screen.getByAltText('Test image');
      
      // Simulate image error
      fireEvent.error(img);

      // Should handle error gracefully
      expect(img).toBeInTheDocument();
    });

    it('should handle missing performance APIs', () => {
      // Remove PerformanceObserver
      delete (window as any).PerformanceObserver;

      expect(() => {
        render(
          <PerformanceProvider enabled={true}>
            <ResponsivePage title="Test">
              <p>Content</p>
            </ResponsivePage>
          </PerformanceProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Cross-Device Consistency', () => {
    const testContent = (
      <ResponsiveLayout>
        <ResponsivePage title="Consistency Test">
          <ResponsiveCard title="Test Card">
            <TouchButton>Test Button</TouchButton>
          </ResponsiveCard>
        </ResponsivePage>
      </ResponsiveLayout>
    );

    it('should maintain consistent functionality across devices', () => {
      // Test mobile
      mockWindowDimensions(375, 667);
      const { rerender } = render(testContent);
      expect(screen.getByText('Consistency Test')).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();

      // Test tablet
      mockWindowDimensions(768, 1024);
      rerender(testContent);
      expect(screen.getByText('Consistency Test')).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();

      // Test desktop
      mockWindowDimensions(1280, 720);
      rerender(testContent);
      expect(screen.getByText('Consistency Test')).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });
  });

  describe('Performance Regression', () => {
    it('should maintain performance with complex layouts', () => {
      const startTime = performance.now();

      render(
        <PerformanceProvider enabled={false}>
          <ResponsiveLayout>
            <ResponsivePage>
              {Array.from({ length: 50 }, (_, i) => (
                <ResponsiveCard key={i} title={`Card ${i + 1}`}>
                  <TouchButton>Button {i + 1}</TouchButton>
                  <LazyImage
                    src={`/image-${i}.jpg`}
                    alt={`Image ${i}`}
                    width={200}
                    height={150}
                  />
                </ResponsiveCard>
              ))}
            </ResponsivePage>
          </ResponsiveLayout>
        </PerformanceProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render complex layouts efficiently
      expect(renderTime).toBeLessThan(500);
    });
  });
});

describe('Real-World Scenarios', () => {
  it('should handle complete checkout flow on mobile', async () => {
    mockWindowDimensions(375, 667);

    const handleSubmit = vi.fn();
    
    render(
      <ResponsiveLayout showMobileNav={true}>
        <ResponsivePage
          title="Checkout"
          showBackButton={true}
          onBackClick={vi.fn()}
        >
          <ResponsiveCard title="Order Summary">
            <div className="space-y-4">
              <div>Product 1 - $10.00</div>
              <div>Product 2 - $15.00</div>
              <div className="font-bold">Total: $25.00</div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard title="Customer Information">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                className="w-full p-3 border rounded-lg min-h-[44px]"
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full p-3 border rounded-lg min-h-[44px]"
              />
              <TouchButton type="submit" fullWidth>
                Complete Order
              </TouchButton>
            </form>
          </ResponsiveCard>
        </ResponsivePage>
      </ResponsiveLayout>
    );

    // Should show mobile-optimized checkout
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Customer Information')).toBeInTheDocument();

    // Should have touch-friendly form elements
    const nameInput = screen.getByPlaceholderText('Name');
    const phoneInput = screen.getByPlaceholderText('Phone');
    const submitButton = screen.getByText('Complete Order');

    expect(nameInput).toHaveClass('min-h-[44px]');
    expect(phoneInput).toHaveClass('min-h-[44px]');
    expect(submitButton).toHaveClass('min-h-[44px]');

    // Test form submission
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '(11) 99999-9999' } });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
  });
});