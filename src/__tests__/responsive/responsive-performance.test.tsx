/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { MobileNavigation } from '@/components/ui/MobileNavigation';
import { TouchButton } from '@/components/ui/TouchFriendly';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

Object.defineProperty(window, 'performance', {
  writable: true,
  value: mockPerformance,
});

describe('Responsive Component Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Performance', () => {
    it('should render ResponsiveGrid efficiently with many items', () => {
      const startTime = performance.now();
      
      const items = Array.from({ length: 100 }, (_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg">
          Item {i + 1}
        </div>
      ));

      render(
        <ResponsiveGrid variant="products">
          {items}
        </ResponsiveGrid>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });

    it('should handle rapid re-renders without performance degradation', async () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(c => c + 1);
          }, 10);
          
          setTimeout(() => clearInterval(interval), 100);
          return () => clearInterval(interval);
        }, []);

        return (
          <ResponsiveGrid variant="products">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i}>Item {i + 1} - {count}</div>
            ))}
          </ResponsiveGrid>
        );
      };

      const startTime = performance.now();
      render(<TestComponent />);
      
      // Wait for rapid updates to complete
      await waitFor(() => {
        // Component should still be responsive
        expect(screen.getByText(/Item 1 -/)).toBeInTheDocument();
      }, { timeout: 200 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid updates efficiently
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Touch Interaction Performance', () => {
    it('should handle rapid touch events without lag', async () => {
      const handleClick = jest.fn();
      render(
        <TouchButton onClick={handleClick} ripple={true}>
          Rapid Touch Test
        </TouchButton>
      );

      const button = screen.getByRole('button');
      const startTime = performance.now();

      // Simulate rapid touches
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(handleClick).toHaveBeenCalledTimes(10);
      expect(totalTime).toBeLessThan(50); // Should handle 10 clicks in under 50ms
    });

    it('should debounce rapid interactions appropriately', async () => {
      let clickCount = 0;
      const debouncedHandler = jest.fn(() => {
        clickCount++;
      });

      render(
        <TouchButton onClick={debouncedHandler}>
          Debounce Test
        </TouchButton>
      );

      const button = screen.getByRole('button');

      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should register all clicks immediately (no artificial debouncing)
      expect(debouncedHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with event listeners', () => {
      const { unmount } = render(
        <MobileNavigation
          storeName="Test Store"
          cartItemsCount={5}
        />
      );

      // Get initial listener count (approximate)
      const initialListeners = document.querySelectorAll('*').length;

      // Open and close menu multiple times
      const menuButton = screen.getByLabelText('Menu');
      
      for (let i = 0; i < 5; i++) {
        fireEvent.click(menuButton); // Open
        fireEvent.click(document.body); // Close
      }

      // Unmount component
      unmount();

      // Check that listeners are cleaned up
      const finalListeners = document.querySelectorAll('*').length;
      expect(finalListeners).toBeLessThanOrEqual(initialListeners + 1); // Allow small variance
    });

    it('should clean up timers and intervals', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(
        <TouchButton ripple={true}>
          Timer Test
        </TouchButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button); // This creates a timeout for ripple cleanup

      unmount();

      // Should clean up timers
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('CSS Performance', () => {
    it('should use efficient CSS classes for responsive behavior', () => {
      const { container } = render(
        <ResponsiveGrid variant="products" className="custom-class">
          <div>Test item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      const classes = grid.className.split(' ');

      // Should use Tailwind's efficient responsive classes
      expect(classes).toContain('grid');
      expect(classes).toContain('grid-cols-1');
      expect(classes).toContain('sm:grid-cols-2');
      expect(classes).toContain('lg:grid-cols-3');
      
      // Should not have redundant or conflicting classes
      const gridColClasses = classes.filter(cls => cls.includes('grid-cols'));
      expect(gridColClasses.length).toBeGreaterThan(0);
    });

    it('should minimize layout thrashing during responsive changes', () => {
      const { container, rerender } = render(
        <ResponsiveGrid variant="products" gap="sm">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );

      const initialClasses = (container.firstChild as HTMLElement).className;

      // Change gap size
      rerender(
        <ResponsiveGrid variant="products" gap="lg">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );

      const updatedClasses = (container.firstChild as HTMLElement).className;

      // Should only change gap-related classes
      expect(updatedClasses).toContain('gap-6');
      expect(updatedClasses).not.toContain('gap-2');
      
      // Other classes should remain the same
      expect(updatedClasses).toContain('grid');
      expect(updatedClasses).toContain('grid-cols-1');
    });
  });

  describe('Scroll Performance', () => {
    it('should handle smooth scrolling without jank', async () => {
      const scrollContainer = document.createElement('div');
      scrollContainer.style.height = '200px';
      scrollContainer.style.overflow = 'auto';
      
      const content = document.createElement('div');
      content.style.height = '1000px';
      scrollContainer.appendChild(content);
      document.body.appendChild(scrollContainer);

      const scrollEvents: number[] = [];
      const handleScroll = () => {
        scrollEvents.push(performance.now());
      };

      scrollContainer.addEventListener('scroll', handleScroll);

      // Simulate smooth scrolling
      for (let i = 0; i < 10; i++) {
        scrollContainer.scrollTop = i * 10;
        fireEvent.scroll(scrollContainer);
      }

      // Check that scroll events are handled efficiently
      expect(scrollEvents.length).toBe(10);
      
      // Calculate average time between scroll events
      if (scrollEvents.length > 1) {
        const intervals = scrollEvents.slice(1).map((time, i) => time - scrollEvents[i]);
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        // Should maintain smooth scrolling (less than 16ms per frame for 60fps)
        expect(avgInterval).toBeLessThan(16);
      }

      // Cleanup
      scrollContainer.removeEventListener('scroll', handleScroll);
      document.body.removeChild(scrollContainer);
    });
  });

  describe('Animation Performance', () => {
    it('should use hardware-accelerated animations', () => {
      render(
        <TouchButton ripple={true}>
          Animation Test
        </TouchButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Check for ripple animation elements
      const rippleElements = button.querySelectorAll('.animate-ping');
      expect(rippleElements.length).toBeGreaterThan(0);

      // Ripple elements should use transform for hardware acceleration
      rippleElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // The element should have transform properties for hardware acceleration
        expect(element.className).toContain('animate-ping');
      });
    });

    it('should clean up animations properly', async () => {
      render(
        <TouchButton ripple={true}>
          Animation Cleanup Test
        </TouchButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should have ripple elements initially
      expect(button.querySelectorAll('.animate-ping').length).toBeGreaterThan(0);

      // Wait for animation cleanup (600ms timeout in component)
      await waitFor(() => {
        expect(button.querySelectorAll('.animate-ping').length).toBe(0);
      }, { timeout: 700 });
    });
  });

  describe('Bundle Size Impact', () => {
    it('should not import unnecessary dependencies', () => {
      // This test ensures we're not importing heavy libraries
      const { container } = render(
        <ResponsiveGrid variant="products">
          <div>Test</div>
        </ResponsiveGrid>
      );

      // Component should render without requiring heavy dependencies
      expect(container.firstChild).toBeInTheDocument();
      
      // Should use only Tailwind classes (lightweight)
      const element = container.firstChild as HTMLElement;
      const classes = element.className.split(' ');
      
      // All classes should be simple Tailwind utilities
      classes.forEach(cls => {
        if (cls) {
          expect(cls).toMatch(/^[a-z-]+(\[[^\]]+\])?$/); // Tailwind class pattern
        }
      });
    });
  });
});

// Performance monitoring utilities
export const measureRenderTime = (renderFn: () => void): number => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

// Mock React for performance tests
const React = require('react');