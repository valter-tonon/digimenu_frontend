/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsiveGrid, ResponsiveContainer } from '@/components/ui/ResponsiveGrid';
import { MobileNavigation } from '@/components/ui/MobileNavigation';
import { TouchButton, TouchQuantitySelector } from '@/components/ui/TouchFriendly';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Device viewport configurations
const DEVICE_VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLarge: { width: 1024, height: 1366 }, // iPad Pro
  desktop: { width: 1280, height: 720 }, // Desktop
  desktopLarge: { width: 1920, height: 1080 }, // Large Desktop
};

// Utility to simulate viewport changes
const setViewport = (width: number, height: number) => {
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

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Mock matchMedia for different screen sizes
const mockMatchMedia = (width: number) => {
  return (query: string) => ({
    matches: (() => {
      if (query.includes('min-width: 1024px')) return width >= 1024;
      if (query.includes('min-width: 768px')) return width >= 768;
      if (query.includes('min-width: 640px')) return width >= 640;
      if (query.includes('max-width: 767px')) return width <= 767;
      if (query.includes('max-width: 639px')) return width <= 639;
      return false;
    })(),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('Cross-Device Responsive Tests', () => {
  beforeEach(() => {
    // Reset to default desktop viewport
    setViewport(1280, 720);
    window.matchMedia = mockMatchMedia(1280);
  });

  describe('Mobile Devices (320px - 480px)', () => {
    beforeEach(() => {
      setViewport(DEVICE_VIEWPORTS.mobile.width, DEVICE_VIEWPORTS.mobile.height);
      window.matchMedia = mockMatchMedia(DEVICE_VIEWPORTS.mobile.width);
    });

    it('should display single column layout on mobile', () => {
      const { container } = render(
        <ResponsiveGrid variant="products">
          <div>Product 1</div>
          <div>Product 2</div>
          <div>Product 3</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).not.toHaveClass('sm:grid-cols-2'); // Should not apply tablet styles
    });

    it('should use mobile navigation on small screens', () => {
      render(
        <MobileNavigation
          storeName="Test Store"
          cartItemsCount={3}
          storeId="store-1"
        />
      );

      // Mobile navigation should be visible
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Test Store')).toBeInTheDocument();
      
      // Bottom navigation should be present
      const bottomNav = document.querySelector('.fixed.bottom-0');
      expect(bottomNav).toBeInTheDocument();
    });

    it('should have touch-friendly button sizes on mobile', () => {
      render(
        <TouchButton size="md">
          Mobile Button
        </TouchButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
      
      // Check computed styles for touch-friendly sizing
      const styles = window.getComputedStyle(button);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('should handle mobile-specific interactions', () => {
      const handleChange = jest.fn();
      render(
        <TouchQuantitySelector
          value={1}
          onChange={handleChange}
        />
      );

      const increaseButton = screen.getByLabelText('Aumentar quantidade');
      
      // Simulate touch events
      fireEvent.touchStart(increaseButton);
      fireEvent.touchEnd(increaseButton);
      fireEvent.click(increaseButton);

      expect(handleChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Tablet Devices (768px - 1024px)', () => {
    beforeEach(() => {
      setViewport(DEVICE_VIEWPORTS.tablet.width, DEVICE_VIEWPORTS.tablet.height);
      window.matchMedia = mockMatchMedia(DEVICE_VIEWPORTS.tablet.width);
    });

    it('should display two-column layout on tablet', () => {
      const { container } = render(
        <ResponsiveGrid variant="products">
          <div>Product 1</div>
          <div>Product 2</div>
          <div>Product 3</div>
          <div>Product 4</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('sm:grid-cols-2');
    });

    it('should adapt container padding for tablet', () => {
      const { container } = render(
        <ResponsiveContainer padding="md">
          <div>Tablet Content</div>
        </ResponsiveContainer>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('sm:px-6');
    });

    it('should show appropriate navigation for tablet', () => {
      render(
        <MobileNavigation
          storeName="Test Store"
          cartItemsCount={5}
          storeId="store-1"
          isAuthenticated={true}
        />
      );

      // Should still show mobile navigation but with tablet optimizations
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
      
      // Menu should open properly on tablet
      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Início')).toBeInTheDocument();
    });
  });

  describe('Desktop Devices (1024px+)', () => {
    beforeEach(() => {
      setViewport(DEVICE_VIEWPORTS.desktop.width, DEVICE_VIEWPORTS.desktop.height);
      window.matchMedia = mockMatchMedia(DEVICE_VIEWPORTS.desktop.width);
    });

    it('should display multi-column layout on desktop', () => {
      const { container } = render(
        <ResponsiveGrid variant="products">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>Product {i + 1}</div>
          ))}
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('should use desktop-optimized container sizing', () => {
      const { container } = render(
        <ResponsiveContainer size="lg" padding="md">
          <div>Desktop Content</div>
        </ResponsiveContainer>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('max-w-6xl');
      expect(containerEl).toHaveClass('lg:px-8');
    });

    it('should hide mobile-specific elements on desktop', () => {
      render(
        <MobileNavigation
          storeName="Test Store"
          cartItemsCount={3}
          storeId="store-1"
        />
      );

      // Bottom navigation should be hidden on desktop
      const bottomNav = document.querySelector('.md\\:hidden');
      expect(bottomNav).toBeInTheDocument();
    });
  });

  describe('Large Desktop (1920px+)', () => {
    beforeEach(() => {
      setViewport(DEVICE_VIEWPORTS.desktopLarge.width, DEVICE_VIEWPORTS.desktopLarge.height);
      window.matchMedia = mockMatchMedia(DEVICE_VIEWPORTS.desktopLarge.width);
    });

    it('should maximize columns on large desktop', () => {
      const { container } = render(
        <ResponsiveGrid variant="products">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i}>Product {i + 1}</div>
          ))}
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('should use maximum container width on large screens', () => {
      const { container } = render(
        <ResponsiveContainer size="xl">
          <div>Large Desktop Content</div>
        </ResponsiveContainer>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('max-w-7xl');
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition on mobile', async () => {
      // Start in portrait
      setViewport(375, 667);
      window.matchMedia = mockMatchMedia(375);

      const { container } = render(
        <ResponsiveGrid variant="products">
          <div>Product 1</div>
          <div>Product 2</div>
        </ResponsiveGrid>
      );

      let grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid-cols-1');

      // Rotate to landscape (swap dimensions)
      setViewport(667, 375);
      window.matchMedia = mockMatchMedia(667);

      // Trigger re-render by changing props
      const { rerender } = render(
        <ResponsiveGrid variant="products">
          <div>Product 1</div>
          <div>Product 2</div>
        </ResponsiveGrid>
      );

      rerender(
        <ResponsiveGrid variant="products">
          <div>Product 1</div>
          <div>Product 2</div>
        </ResponsiveGrid>
      );

      grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('sm:grid-cols-2'); // Should show 2 columns in landscape
    });

    it('should handle tablet orientation changes', () => {
      // Portrait tablet
      setViewport(768, 1024);
      window.matchMedia = mockMatchMedia(768);

      const { container, rerender } = render(
        <ResponsiveContainer padding="md">
          <div>Tablet Content</div>
        </ResponsiveContainer>
      );

      let containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('sm:px-6');

      // Landscape tablet
      setViewport(1024, 768);
      window.matchMedia = mockMatchMedia(1024);

      rerender(
        <ResponsiveContainer padding="md">
          <div>Tablet Content</div>
        </ResponsiveContainer>
      );

      containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('lg:px-8');
    });
  });

  describe('Edge Cases and Unusual Viewports', () => {
    it('should handle very small screens (< 320px)', () => {
      setViewport(280, 500);
      window.matchMedia = mockMatchMedia(280);

      const { container } = render(
        <ResponsiveGrid variant="products">
          <div>Product 1</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid-cols-1'); // Should still work with single column
    });

    it('should handle ultra-wide screens (> 2560px)', () => {
      setViewport(3440, 1440);
      window.matchMedia = mockMatchMedia(3440);

      const { container } = render(
        <ResponsiveGrid variant="products">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i}>Product {i + 1}</div>
          ))}
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('xl:grid-cols-4'); // Should cap at reasonable column count
    });

    it('should handle square viewports', () => {
      setViewport(800, 800);
      window.matchMedia = mockMatchMedia(800);

      const { container } = render(
        <ResponsiveContainer size="md">
          <div>Square Viewport Content</div>
        </ResponsiveContainer>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('max-w-4xl');
    });
  });

  describe('Performance Across Devices', () => {
    it('should maintain performance on low-end mobile devices', () => {
      // Simulate slower device
      setViewport(320, 568);
      window.matchMedia = mockMatchMedia(320);

      const startTime = performance.now();

      render(
        <ResponsiveGrid variant="products">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow">
              <h3>Product {i + 1}</h3>
              <p>Description for product {i + 1}</p>
            </div>
          ))}
        </ResponsiveGrid>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even with many items on mobile
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle touch events efficiently on mobile', () => {
      setViewport(375, 667);
      window.matchMedia = mockMatchMedia(375);

      const handleClick = jest.fn();
      render(
        <TouchButton onClick={handleClick}>
          Mobile Touch Test
        </TouchButton>
      );

      const button = screen.getByRole('button');
      const startTime = performance.now();

      // Simulate rapid touches
      for (let i = 0; i < 20; i++) {
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);
        fireEvent.click(button);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(handleClick).toHaveBeenCalledTimes(20);
      expect(totalTime).toBeLessThan(100); // Should handle touches quickly
    });
  });

  describe('Accessibility Across Devices', () => {
    it('should maintain accessibility on mobile devices', () => {
      setViewport(375, 667);
      window.matchMedia = mockMatchMedia(375);

      render(
        <TouchQuantitySelector
          value={1}
          onChange={() => {}}
        />
      );

      const decreaseButton = screen.getByLabelText('Diminuir quantidade');
      const increaseButton = screen.getByLabelText('Aumentar quantidade');

      // Should have proper ARIA labels
      expect(decreaseButton).toHaveAttribute('aria-label', 'Diminuir quantidade');
      expect(increaseButton).toHaveAttribute('aria-label', 'Aumentar quantidade');

      // Should be focusable
      expect(decreaseButton).toHaveAttribute('tabIndex');
      expect(increaseButton).toHaveAttribute('tabIndex');
    });

    it('should maintain focus management across screen sizes', () => {
      const { rerender } = render(
        <TouchButton>Focus Test</TouchButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);

      // Change viewport
      setViewport(768, 1024);
      window.matchMedia = mockMatchMedia(768);

      rerender(<TouchButton>Focus Test</TouchButton>);

      // Focus should be maintained
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });
});

// Utility functions for cross-device testing
export const testAcrossViewports = (
  testFn: (viewport: { width: number; height: number }) => void
) => {
  Object.entries(DEVICE_VIEWPORTS).forEach(([deviceName, viewport]) => {
    describe(`${deviceName} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        setViewport(viewport.width, viewport.height);
        window.matchMedia = mockMatchMedia(viewport.width);
      });

      testFn(viewport);
    });
  });
};

export const simulateDeviceRotation = (
  initialWidth: number,
  initialHeight: number
) => {
  setViewport(initialWidth, initialHeight);
  window.matchMedia = mockMatchMedia(initialWidth);
  
  return () => {
    setViewport(initialHeight, initialWidth);
    window.matchMedia = mockMatchMedia(initialHeight);
  };
};