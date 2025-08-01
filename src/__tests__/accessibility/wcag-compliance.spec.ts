/**
 * Accessibility Tests for WCAG 2.1 AA Compliance
 * Tests accessibility features and compliance
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

// Helper function to check color contrast
async function checkColorContrast(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // Simple contrast ratio calculation (simplified)
    const getRGB = (colorStr: string) => {
      const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
    };
    
    const getLuminance = (rgb: number[]) => {
      const [r, g, b] = rgb.map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const bgRGB = getRGB(backgroundColor);
    const textRGB = getRGB(color);
    
    const bgLuminance = getLuminance(bgRGB);
    const textLuminance = getLuminance(textRGB);
    
    const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                    (Math.min(bgLuminance, textLuminance) + 0.05);
    
    return {
      backgroundColor,
      color,
      contrast: Math.round(contrast * 100) / 100
    };
  }, selector);
}

// Helper function to check keyboard navigation
async function testKeyboardNavigation(page: Page, startSelector: string, expectedSelectors: string[]) {
  await page.focus(startSelector);
  
  const focusedElements = [];
  
  for (let i = 0; i < expectedSelectors.length; i++) {
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement;
      return focused ? {
        tagName: focused.tagName,
        id: focused.id,
        className: focused.className,
        testId: focused.getAttribute('data-testid')
      } : null;
    });
    focusedElements.push(focusedElement);
  }
  
  return focusedElements;
}

test.describe('WCAG 2.1 AA Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/products', async route => {
      await route.fulfill({
        json: {
          products: [
            { 
              id: 1, 
              name: 'Pizza Margherita', 
              price: 25.99, 
              image: '/images/pizza-margherita.jpg',
              description: 'Delicious pizza with tomato, mozzarella and basil',
              available: true 
            },
            { 
              id: 2, 
              name: 'Pizza Pepperoni', 
              price: 29.99, 
              image: '/images/pizza-pepperoni.jpg',
              description: 'Spicy pizza with pepperoni and cheese',
              available: true 
            }
          ]
        }
      });
    });

    await page.goto('/store/test-store/table/1');
    await injectAxe(page);
  });

  test('should pass axe accessibility audit on menu page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility audit
    const violations = await getViolations(page);
    
    if (violations.length > 0) {
      console.log('Accessibility violations found:', violations);
    }
    
    // Should have no accessibility violations
    expect(violations).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim(),
        id: h.id
      }));
    });
    
    console.log('Heading hierarchy:', headings);
    
    // Should have exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    
    // Should have logical heading hierarchy (no skipping levels)
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i].level;
      const previousLevel = headings[i - 1].level;
      
      // Should not skip heading levels
      if (currentLevel > previousLevel) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test color contrast for various elements
    const elementsToTest = [
      'h1', // Main heading
      'p', // Body text
      'button', // Buttons
      '[data-testid="product-name"]', // Product names
      '[data-testid="product-price"]', // Product prices
      '.text-gray-600', // Secondary text
      '.text-gray-800' // Primary text
    ];
    
    for (const selector of elementsToTest) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        const contrast = await checkColorContrast(page, selector);
        
        if (contrast) {
          console.log(`Contrast for ${selector}:`, contrast);
          
          // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
          expect(contrast.contrast).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation through interactive elements
    const interactiveElements = await page.locator('button, a, input, [tabindex]').all();
    
    // Should be able to focus on first interactive element
    if (interactiveElements.length > 0) {
      await interactiveElements[0].focus();
      expect(await interactiveElements[0].evaluate(el => el === document.activeElement)).toBe(true);
    }
    
    // Test Tab navigation
    const focusableElements = [];
    let currentElement = await page.evaluate(() => document.activeElement);
    
    for (let i = 0; i < Math.min(10, interactiveElements.length); i++) {
      await page.keyboard.press('Tab');
      currentElement = await page.evaluate(() => {
        const focused = document.activeElement;
        return focused ? {
          tagName: focused.tagName,
          testId: focused.getAttribute('data-testid'),
          text: focused.textContent?.trim().substring(0, 50)
        } : null;
      });
      focusableElements.push(currentElement);
    }
    
    console.log('Keyboard navigation path:', focusableElements);
    
    // Should be able to navigate through elements
    expect(focusableElements.length).toBeGreaterThan(0);
    expect(focusableElements.every(el => el !== null)).toBe(true);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for proper ARIA labels on interactive elements
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either text content or aria-label
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
    
    // Check for proper roles
    const landmarks = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role]');
      return Array.from(elements).map(el => ({
        role: el.getAttribute('role'),
        tagName: el.tagName,
        ariaLabel: el.getAttribute('aria-label')
      }));
    });
    
    console.log('ARIA landmarks:', landmarks);
    
    // Should have navigation landmarks
    const hasNavigation = landmarks.some(l => l.role === 'navigation' || l.tagName === 'NAV');
    expect(hasNavigation).toBe(true);
  });

  test('should have accessible form labels', async ({ page }) => {
    // Navigate to checkout to test forms
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    await page.waitForLoadState('networkidle');
    
    // Check form inputs have proper labels
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Input should have proper labeling
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
      }
    }
  });

  test('should provide error messages accessibly', async ({ page }) => {
    // Navigate to checkout form
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Try to submit form without filling required fields
    await page.click('[data-testid="continue-to-address"]');
    
    // Check that error messages are properly associated
    const errorMessages = await page.locator('[role="alert"], .error-message, [data-testid*="error"]').all();
    
    for (const error of errorMessages) {
      const text = await error.textContent();
      expect(text?.trim()).toBeTruthy();
      
      // Error should be announced to screen readers
      const role = await error.getAttribute('role');
      const ariaLive = await error.getAttribute('aria-live');
      
      expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBe(true);
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for proper semantic structure
    const semanticElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('main, nav, header, footer, section, article, aside');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label')
      }));
    });
    
    console.log('Semantic elements:', semanticElements);
    
    // Should have main content area
    const hasMain = semanticElements.some(el => el.tagName === 'MAIN' || el.role === 'main');
    expect(hasMain).toBe(true);
    
    // Check for skip links
    const skipLinks = await page.locator('a[href^="#"]').filter({ hasText: /skip|pular/i }).all();
    expect(skipLinks.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle focus management in modals', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Open a modal (e.g., product details)
    await page.click('[data-testid="product-1"]');
    
    // Check if modal is properly focused
    const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]').first();
    
    if (await modal.count() > 0) {
      // Modal should trap focus
      const focusableElements = await modal.locator('button, a, input, [tabindex]:not([tabindex="-1"])').all();
      
      if (focusableElements.length > 0) {
        // First focusable element should be focused
        await expect(focusableElements[0]).toBeFocused();
        
        // Tab should cycle through modal elements only
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement);
        
        // Focus should stay within modal
        const isWithinModal = await modal.evaluate((modal, focused) => {
          return modal.contains(focused);
        }, focusedElement);
        
        expect(isWithinModal).toBe(true);
      }
      
      // Escape should close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('should provide alternative text for images', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaLabel = await img.getAttribute('aria-label');
      
      // Decorative images should have empty alt or role="presentation"
      // Content images should have descriptive alt text
      if (role === 'presentation' || alt === '') {
        // Decorative image - this is acceptable
        continue;
      } else {
        // Content image should have alt text
        expect(alt || ariaLabel).toBeTruthy();
        expect(alt?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background-color: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `
    });
    
    await page.waitForLoadState('networkidle');
    
    // Check that content is still visible and usable
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
    
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      await expect(button).toBeVisible();
    }
  });

  test('should support zoom up to 200%', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Set zoom to 200%
    await page.setViewportSize({ width: 640, height: 480 }); // Simulate 200% zoom
    
    // Content should still be accessible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
    
    // Interactive elements should still be clickable
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
      await expect(button).toBeVisible();
      
      const boundingBox = await button.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }
    
    // Text should not be cut off
    const textElements = await page.locator('p, span, div').filter({ hasText: /.+/ }).all();
    for (const element of textElements.slice(0, 5)) { // Test first 5 text elements
      const isVisible = await element.isVisible();
      expect(isVisible).toBe(true);
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Add product to cart (dynamic content change)
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    
    // Check for live regions that announce changes
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
    
    let hasAnnouncement = false;
    for (const region of liveRegions) {
      const text = await region.textContent();
      if (text && text.trim().length > 0) {
        hasAnnouncement = true;
        break;
      }
    }
    
    // Should announce cart updates
    expect(hasAnnouncement).toBe(true);
  });

  test('should provide clear error recovery instructions', async ({ page }) => {
    // Navigate to form and trigger validation errors
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Submit invalid form
    await page.fill('[data-testid="customer-email"]', 'invalid-email');
    await page.click('[data-testid="continue-to-address"]');
    
    // Check error messages provide clear instructions
    const errorMessages = await page.locator('[data-testid*="error"]').all();
    
    for (const error of errorMessages) {
      const text = await error.textContent();
      
      // Error message should be descriptive and actionable
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(10); // Should be more than just "Error"
      
      // Should not just say "invalid" but explain what's expected
      expect(text).not.toMatch(/^(invalid|error)$/i);
    }
  });

  test('should maintain accessibility during loading states', async ({ page }) => {
    // Simulate slow loading
    await page.route('**/api/products', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.reload();
    
    // Loading states should be accessible
    const loadingElements = await page.locator('[role="status"], [aria-live], .loading').all();
    
    for (const loading of loadingElements) {
      const ariaLabel = await loading.getAttribute('aria-label');
      const text = await loading.textContent();
      
      // Loading state should be announced
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
    
    // Should eventually load content
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-1"]')).toBeVisible();
  });
});