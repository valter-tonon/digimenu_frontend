/**
 * Performance Tests for Core Web Vitals
 * Tests performance metrics and optimization
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds based on Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint - Good: < 2.5s
  FID: 100,  // First Input Delay - Good: < 100ms
  CLS: 0.1,  // Cumulative Layout Shift - Good: < 0.1
  FCP: 1800, // First Contentful Paint - Good: < 1.8s
  TTFB: 800, // Time to First Byte - Good: < 800ms
  TTI: 3800  // Time to Interactive - Good: < 3.8s
};

// Helper function to measure Core Web Vitals
async function measureCoreWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics: any = {};
      
      // Measure LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.LCP = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Measure FID (First Input Delay)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metrics.FID = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // Measure CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.CLS = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // Measure FCP (First Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.FCP = entry.startTime;
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // Get navigation timing metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.TTFB = navigation.responseStart - navigation.requestStart;
        metrics.TTI = navigation.loadEventEnd - navigation.navigationStart;
      }

      // Wait for all metrics to be collected
      setTimeout(() => {
        resolve(metrics);
      }, 3000);
    });
  });
}

// Helper function to measure resource loading times
async function measureResourceTiming(page: Page) {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType
    }));
  });
}

// Helper function to measure JavaScript execution time
async function measureJavaScriptTiming(page: Page) {
  return await page.evaluate(() => {
    const measures = performance.getEntriesByType('measure');
    const marks = performance.getEntriesByType('mark');
    
    return {
      measures: measures.map(m => ({ name: m.name, duration: m.duration })),
      marks: marks.map(m => ({ name: m.name, startTime: m.startTime }))
    };
  });
}

test.describe('Core Web Vitals Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/products', async route => {
      await route.fulfill({
        json: {
          products: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            price: 25.99 + i,
            image: `/images/product-${i + 1}.jpg`,
            description: `Description for product ${i + 1}`,
            available: true
          }))
        }
      });
    });

    await page.route('**/api/store/status', async route => {
      await route.fulfill({
        json: {
          isOpen: true,
          minimumOrder: 20.00,
          deliveryFee: 5.00,
          estimatedDeliveryTime: 30
        }
      });
    });
  });

  test('should meet Core Web Vitals thresholds on menu page', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/store/test-store/table/1');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureCoreWebVitals(page);
    const loadTime = Date.now() - startTime;
    
    console.log('Core Web Vitals:', metrics);
    console.log('Total load time:', loadTime, 'ms');
    
    // Assert Core Web Vitals thresholds
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    expect(metrics.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    expect(metrics.TTFB).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
    
    // Additional performance checks
    expect(loadTime).toBeLessThan(3000); // Total load time should be < 3s
  });

  test('should maintain performance with large product catalogs', async ({ page }) => {
    // Mock large product catalog
    await page.route('**/api/products', async route => {
      await route.fulfill({
        json: {
          products: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            price: 25.99 + i,
            image: `/images/product-${i + 1}.jpg`,
            description: `Long description for product ${i + 1} with lots of text to simulate real-world content`,
            available: true,
            category: `Category ${Math.floor(i / 10) + 1}`,
            tags: [`tag${i}`, `tag${i + 1}`, `tag${i + 2}`]
          }))
        }
      });
    });

    const startTime = Date.now();
    await page.goto('/store/test-store/table/1');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureCoreWebVitals(page);
    const loadTime = Date.now() - startTime;
    
    // Should still meet performance thresholds with large catalog
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP * 1.2); // Allow 20% tolerance
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    expect(loadTime).toBeLessThan(4000); // Allow slightly longer load time
    
    // Check that virtual scrolling or pagination is working
    const visibleProducts = await page.locator('[data-testid^="product-"]').count();
    expect(visibleProducts).toBeLessThan(50); // Should not render all 100 products at once
  });

  test('should optimize image loading performance', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    await page.waitForLoadState('networkidle');
    
    const resources = await measureResourceTiming(page);
    const images = resources.filter(r => r.type === 'img' || r.name.includes('.jpg') || r.name.includes('.png'));
    
    console.log('Image loading metrics:', images);
    
    // Check image optimization
    images.forEach(image => {
      // Images should load reasonably fast
      expect(image.duration).toBeLessThan(2000);
      
      // Images should be reasonably sized (< 500KB)
      if (image.size) {
        expect(image.size).toBeLessThan(500 * 1024);
      }
    });
    
    // Check lazy loading implementation
    const totalImages = await page.locator('img').count();
    const visibleImages = await page.locator('img[src]:visible').count();
    
    // Should not load all images immediately
    expect(visibleImages).toBeLessThan(totalImages);
  });

  test('should maintain performance during user interactions', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    await page.waitForLoadState('networkidle');
    
    // Measure performance during cart operations
    const startTime = performance.now();
    
    // Add multiple products to cart rapidly
    for (let i = 1; i <= 5; i++) {
      await page.click(`[data-testid="product-${i}"] button:has-text("Adicionar")`);
      await page.waitForTimeout(100); // Small delay to simulate real user behavior
    }
    
    const cartOperationTime = performance.now() - startTime;
    
    // Cart operations should be fast
    expect(cartOperationTime).toBeLessThan(2000);
    
    // Check for layout shifts during interactions
    const clsAfterInteraction = await page.evaluate(() => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      
      return new Promise(resolve => {
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });
    
    expect(clsAfterInteraction).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
  });

  test('should optimize JavaScript bundle size and execution', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    await page.waitForLoadState('networkidle');
    
    const resources = await measureResourceTiming(page);
    const jsResources = resources.filter(r => r.type === 'script' || r.name.includes('.js'));
    
    console.log('JavaScript resources:', jsResources);
    
    // Check JavaScript bundle sizes
    const totalJSSize = jsResources.reduce((sum, js) => sum + (js.size || 0), 0);
    expect(totalJSSize).toBeLessThan(1024 * 1024); // Total JS should be < 1MB
    
    // Check individual bundle sizes
    jsResources.forEach(js => {
      if (js.size) {
        expect(js.size).toBeLessThan(500 * 1024); // Individual bundles should be < 500KB
      }
    });
    
    // Measure JavaScript execution time
    const jsExecutionTime = await page.evaluate(() => {
      const navigationStart = performance.timing.navigationStart;
      const domContentLoaded = performance.timing.domContentLoadedEventEnd;
      return domContentLoaded - navigationStart;
    });
    
    expect(jsExecutionTime).toBeLessThan(2000); // JS execution should be < 2s
  });

  test('should handle slow network conditions gracefully', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/store/test-store/table/1');
    
    // Should show loading states
    await expect(page.locator('[data-testid="products-loading"]')).toBeVisible();
    
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should still be usable on slow networks
    expect(loadTime).toBeLessThan(8000); // Allow longer load time for slow network
    
    // Should show skeleton loading states
    const skeletonElements = await page.locator('[data-testid="skeleton-loader"]').count();
    expect(skeletonElements).toBeGreaterThan(0);
  });

  test('should optimize checkout flow performance', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    await page.waitForLoadState('networkidle');
    
    // Add product and start checkout
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    
    const checkoutStartTime = performance.now();
    await page.click('[data-testid="proceed-checkout"]');
    
    // Checkout page should load quickly
    await expect(page.locator('h1')).toContainText('Finalizar Pedido');
    const checkoutLoadTime = performance.now() - checkoutStartTime;
    
    expect(checkoutLoadTime).toBeLessThan(1000); // Checkout should load < 1s
    
    // Form interactions should be responsive
    const formStartTime = performance.now();
    await page.fill('[data-testid="customer-name"]', 'João Silva');
    await page.fill('[data-testid="customer-email"]', 'joao@example.com');
    await page.fill('[data-testid="customer-phone"]', '11999999999');
    
    const formInteractionTime = performance.now() - formStartTime;
    expect(formInteractionTime).toBeLessThan(500); // Form should be responsive
  });

  test('should maintain performance with animations', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    await page.waitForLoadState('networkidle');
    
    // Trigger animations by adding products
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    
    // Check for smooth animations (60fps = ~16.67ms per frame)
    const animationPerformance = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0;
        let startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          if (frameCount < 60) { // Count 60 frames (~1 second)
            requestAnimationFrame(countFrames);
          } else {
            const endTime = performance.now();
            const fps = frameCount / ((endTime - startTime) / 1000);
            resolve(fps);
          }
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    // Should maintain close to 60fps during animations
    expect(animationPerformance).toBeGreaterThan(50);
  });

  test('should optimize memory usage', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    await page.waitForLoadState('networkidle');
    
    // Measure initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory);
      
      // Perform memory-intensive operations
      for (let i = 1; i <= 10; i++) {
        await page.click(`[data-testid="product-${i}"] button:has-text("Adicionar")`);
        await page.click('[data-testid="cart-button"]');
        await page.click('[data-testid="back-to-menu"]');
      }
      
      // Measure memory after operations
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      });
      
      console.log('Final memory usage:', finalMemory);
      
      // Memory usage should not grow excessively
      const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Should not grow more than 50MB
    }
  });

  test('should handle concurrent requests efficiently', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    
    // Trigger multiple concurrent requests
    const startTime = performance.now();
    
    await Promise.all([
      page.click('[data-testid="product-1"] button:has-text("Adicionar")'),
      page.click('[data-testid="product-2"] button:has-text("Adicionar")'),
      page.click('[data-testid="product-3"] button:has-text("Adicionar")'),
      page.click('[data-testid="refresh-products"]'),
      page.click('[data-testid="check-store-status"]')
    ]);
    
    const concurrentRequestTime = performance.now() - startTime;
    
    // Concurrent requests should complete reasonably fast
    expect(concurrentRequestTime).toBeLessThan(3000);
    
    // Check that all operations completed successfully
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('3');
  });
});