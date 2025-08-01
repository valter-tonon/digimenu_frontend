import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ResponsiveGrid, ResponsiveContainer, ResponsiveStack, ResponsiveFlex } from '@/components/ui/ResponsiveGrid';
import { MobileNavigation, MobileSearchOverlay } from '@/components/ui/MobileNavigation';
import { TouchButton, TouchCard, TouchQuantitySelector, TouchTabs } from '@/components/ui/TouchFriendly';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Responsive Design Components', () => {
  describe('ResponsiveGrid', () => {
    it('should render with mobile-first grid classes', () => {
      const { container } = render(
        <ResponsiveGrid variant="products">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1'); // Mobile first
      expect(grid).toHaveClass('sm:grid-cols-2'); // Tablet
      expect(grid).toHaveClass('lg:grid-cols-3'); // Desktop
    });

    it('should apply different variants correctly', () => {
      const { container: productsContainer } = render(
        <ResponsiveGrid variant="products">
          <div>Product</div>
        </ResponsiveGrid>
      );

      const { container: categoriesContainer } = render(
        <ResponsiveGrid variant="categories">
          <div>Category</div>
        </ResponsiveGrid>
      );

      const productsGrid = productsContainer.firstChild as HTMLElement;
      const categoriesGrid = categoriesContainer.firstChild as HTMLElement;

      expect(productsGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
      expect(categoriesGrid).toHaveClass('grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4');
    });

    it('should apply gap sizes correctly', () => {
      const { container } = render(
        <ResponsiveGrid gap="lg">
          <div>Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('gap-6');
    });
  });

  describe('ResponsiveContainer', () => {
    it('should render with proper responsive padding', () => {
      const { container } = render(
        <ResponsiveContainer padding="md">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
      expect(containerEl).toHaveClass('mx-auto', 'w-full');
    });

    it('should apply size constraints correctly', () => {
      const { container } = render(
        <ResponsiveContainer size="lg">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('max-w-6xl');
    });
  });

  describe('TouchButton', () => {
    it('should render with touch-friendly minimum sizes', () => {
      render(
        <TouchButton size="md">
          Click me
        </TouchButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]'); // Touch-friendly size
      expect(button).toHaveClass('touch-manipulation');
    });

    it('should handle click events with ripple effect', async () => {
      const handleClick = vi.fn();
      render(
        <TouchButton onClick={handleClick} ripple={true}>
          Click me
        </TouchButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show loading state correctly', () => {
      render(
        <TouchButton loading={true}>
          Click me
        </TouchButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should apply different variants correctly', () => {
      const { rerender } = render(
        <TouchButton variant="primary">
          Primary
        </TouchButton>
      );

      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-amber-500', 'text-white');

      rerender(
        <TouchButton variant="outline">
          Outline
        </TouchButton>
      );

      button = screen.getByRole('button');
      expect(button).toHaveClass('border-2', 'border-amber-500', 'text-amber-500');
    });
  });

  describe('TouchQuantitySelector', () => {
    it('should render with proper touch targets', () => {
      const handleChange = vi.fn();
      render(
        <TouchQuantitySelector
          value={1}
          onChange={handleChange}
        />
      );

      const decreaseButton = screen.getByLabelText('Diminuir quantidade');
      const increaseButton = screen.getByLabelText('Aumentar quantidade');

      expect(decreaseButton).toHaveClass('w-10', 'h-10'); // Touch-friendly size
      expect(increaseButton).toHaveClass('w-10', 'h-10');
    });

    it('should handle quantity changes correctly', () => {
      const handleChange = vi.fn();
      render(
        <TouchQuantitySelector
          value={2}
          onChange={handleChange}
          min={1}
          max={5}
        />
      );

      const decreaseButton = screen.getByLabelText('Diminuir quantidade');
      const increaseButton = screen.getByLabelText('Aumentar quantidade');

      fireEvent.click(increaseButton);
      expect(handleChange).toHaveBeenCalledWith(3);

      fireEvent.click(decreaseButton);
      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('should disable buttons at min/max limits', () => {
      const handleChange = vi.fn();
      render(
        <TouchQuantitySelector
          value={1}
          onChange={handleChange}
          min={1}
          max={5}
        />
      );

      const decreaseButton = screen.getByLabelText('Diminuir quantidade');
      expect(decreaseButton).toBeDisabled();
    });
  });

  describe('MobileNavigation', () => {
    it('should render mobile navigation with proper structure', () => {
      render(
        <MobileNavigation
          cartItemsCount={3}
          storeName="Test Store"
          storeId="store-1"
          isAuthenticated={true}
        />
      );

      // Check for mobile navigation elements
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Test Store')).toBeInTheDocument();
      expect(screen.getByLabelText('Carrinho')).toBeInTheDocument();
    });

    it('should show cart badge with correct count', () => {
      render(
        <MobileNavigation
          cartItemsCount={5}
          storeName="Test Store"
        />
      );

      const cartBadges = screen.getAllByText('5');
      expect(cartBadges.length).toBeGreaterThan(0);
    });

    it('should handle menu toggle correctly', async () => {
      render(
        <MobileNavigation
          storeName="Test Store"
          storeId="store-1"
        />
      );

      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);

      // Menu should open
      await waitFor(() => {
        expect(screen.getByText('Início')).toBeInTheDocument();
        expect(screen.getByText('Buscar')).toBeInTheDocument();
      });
    });

    it('should close menu when clicking outside', async () => {
      render(
        <MobileNavigation
          storeName="Test Store"
          storeId="store-1"
        />
      );

      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);

      // Click outside the menu
      fireEvent.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Início')).not.toBeInTheDocument();
      });
    });
  });

  describe('MobileSearchOverlay', () => {
    it('should render search overlay when open', () => {
      const handleClose = vi.fn();
      const handleSearch = vi.fn();

      render(
        <MobileSearchOverlay
          isOpen={true}
          onClose={handleClose}
          onSearch={handleSearch}
          placeholder="Search products..."
        />
      );

      expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
      expect(screen.getByLabelText('Voltar')).toBeInTheDocument();
    });

    it('should handle search submission', () => {
      const handleClose = vi.fn();
      const handleSearch = vi.fn();

      render(
        <MobileSearchOverlay
          isOpen={true}
          onClose={handleClose}
          onSearch={handleSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar produtos...');
      fireEvent.change(searchInput, { target: { value: 'pizza' } });
      fireEvent.submit(searchInput.closest('form')!);

      expect(handleSearch).toHaveBeenCalledWith('pizza');
      expect(handleClose).toHaveBeenCalled();
    });

    it('should not render when closed', () => {
      const handleClose = vi.fn();
      const handleSearch = vi.fn();

      render(
        <MobileSearchOverlay
          isOpen={false}
          onClose={handleClose}
          onSearch={handleSearch}
        />
      );

      expect(screen.queryByPlaceholderText('Buscar produtos...')).not.toBeInTheDocument();
    });
  });

  describe('TouchTabs', () => {
    const mockTabs = [
      { id: 'tab1', label: 'Tab 1', count: 5 },
      { id: 'tab2', label: 'Tab 2', count: 3 },
      { id: 'tab3', label: 'Tab 3' },
    ];

    it('should render tabs with proper touch targets', () => {
      const handleChange = vi.fn();
      render(
        <TouchTabs
          tabs={mockTabs}
          activeTab="tab1"
          onChange={handleChange}
        />
      );

      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');

      expect(tab1.closest('button')).toHaveClass('min-h-[40px]');
      expect(tab2.closest('button')).toHaveClass('min-h-[40px]');
    });

    it('should show active tab correctly', () => {
      const handleChange = vi.fn();
      render(
        <TouchTabs
          tabs={mockTabs}
          activeTab="tab1"
          onChange={handleChange}
        />
      );

      const activeTab = screen.getByText('Tab 1').closest('button');
      expect(activeTab).toHaveClass('bg-white', 'text-amber-600');
    });

    it('should handle tab changes', () => {
      const handleChange = vi.fn();
      render(
        <TouchTabs
          tabs={mockTabs}
          activeTab="tab1"
          onChange={handleChange}
        />
      );

      const tab2 = screen.getByText('Tab 2');
      fireEvent.click(tab2);

      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('should display counts when provided', () => {
      const handleChange = vi.fn();
      render(
        <TouchTabs
          tabs={mockTabs}
          activeTab="tab1"
          onChange={handleChange}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});

describe('Responsive Behavior Tests', () => {
  beforeEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('should adapt to mobile viewport', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(
      <ResponsiveGrid variant="products">
        <div>Product 1</div>
        <div>Product 2</div>
      </ResponsiveGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass('grid-cols-1'); // Should show 1 column on mobile
  });

  it('should handle touch events properly', () => {
    const handleClick = vi.fn();
    render(
      <TouchButton onClick={handleClick}>
        Touch me
      </TouchButton>
    );

    const button = screen.getByRole('button');
    
    // Simulate touch events
    fireEvent.touchStart(button);
    fireEvent.touchEnd(button);
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalled();
  });

  it('should prevent body scroll when modal is open', () => {
    const originalOverflow = document.body.style.overflow;
    
    const { rerender } = render(
      <MobileNavigation storeName="Test Store" />
    );

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Body scroll should be prevented
    expect(document.body.style.overflow).toBe('hidden');

    // Close menu
    fireEvent.click(menuButton);

    // Body scroll should be restored
    expect(document.body.style.overflow).toBe('unset');

    // Cleanup
    document.body.style.overflow = originalOverflow;
  });
});

describe('Accessibility Tests', () => {
  it('should have proper ARIA labels for touch targets', () => {
    render(
      <TouchQuantitySelector
        value={1}
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Diminuir quantidade')).toBeInTheDocument();
    expect(screen.getByLabelText('Aumentar quantidade')).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    const handleClick = vi.fn();
    render(
      <TouchCard onClick={handleClick}>
        Card content
      </TouchCard>
    );

    const card = screen.getByRole('button');
    
    // Should be focusable
    expect(card).toHaveAttribute('tabIndex', '0');
    
    // Should handle keyboard events
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should have proper focus management', () => {
    render(
      <TouchButton>
        Focus me
      </TouchButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });
});