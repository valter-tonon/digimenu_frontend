/**
 * E2E Tests for Error Handling and Recovery Scenarios
 * Tests how the application handles various error conditions
 */

import { test, expect, Page } from '@playwright/test';

// Helper functions
async function simulateNetworkError(page: Page, url: string) {
  await page.route(url, async route => {
    await route.abort('failed');
  });
}

async function simulateSlowNetwork(page: Page, url: string, delay: number = 5000) {
  await page.route(url, async route => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });
}

async function simulateServerError(page: Page, url: string, status: number = 500) {
  await page.route(url, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Something went wrong on our end'
      })
    });
  });
}

test.describe('Error Handling E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic successful routes
    await page.route('**/api/products', async route => {
      await route.fulfill({
        json: {
          products: [
            { id: 1, name: 'Pizza Margherita', price: 25.99, available: true },
            { id: 2, name: 'Pizza Pepperoni', price: 29.99, available: true }
          ]
        }
      });
    });

    await page.goto('/store/test-store/table/1');
  });

  test('should handle product loading errors gracefully', async ({ page }) => {
    // Simulate product API failure
    await simulateNetworkError(page, '**/api/products');
    
    await page.reload();
    
    // Should show error state
    await expect(page.locator('[data-testid="products-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="products-error"]')).toContainText('Erro ao carregar produtos');
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-products"]')).toBeVisible();
    
    // Fix the network and retry
    await page.unroute('**/api/products');
    await page.route('**/api/products', async route => {
      await route.fulfill({
        json: {
          products: [
            { id: 1, name: 'Pizza Margherita', price: 25.99, available: true }
          ]
        }
      });
    });
    
    await page.click('[data-testid="retry-products"]');
    
    // Should load products successfully
    await expect(page.locator('[data-testid="product-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="products-error"]')).not.toBeVisible();
  });

  test('should handle slow network connections', async ({ page }) => {
    // Simulate slow product loading
    await simulateSlowNetwork(page, '**/api/products', 3000);
    
    await page.reload();
    
    // Should show loading state
    await expect(page.locator('[data-testid="products-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
    
    // Should eventually load products
    await expect(page.locator('[data-testid="product-1"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="products-loading"]')).not.toBeVisible();
  });

  test('should handle cart synchronization errors', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Simulate cart sync failure
    await simulateNetworkError(page, '**/api/cart/sync');
    
    // Try to add another product
    await page.click('[data-testid="product-2"] button:has-text("Adicionar")');
    
    // Should show sync error notification
    await expect(page.locator('[data-testid="cart-sync-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-sync-error"]')).toContainText('Erro ao sincronizar carrinho');
    
    // Cart should still work locally
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Should offer retry sync
    await expect(page.locator('[data-testid="retry-cart-sync"]')).toBeVisible();
  });

  test('should handle CEP lookup failures', async ({ page }) => {
    // Add product and go to checkout
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Fill customer data
    await page.fill('[data-testid="customer-name"]', 'João Silva');
    await page.fill('[data-testid="customer-email"]', 'joao@example.com');
    await page.fill('[data-testid="customer-phone"]', '11999999999');
    await page.click('[data-testid="continue-to-address"]');
    
    // Simulate CEP API failure
    await simulateNetworkError(page, '**/api/cep/**');
    
    // Enter CEP
    await page.fill('[data-testid="address-cep"]', '01234567');
    
    // Should show CEP error
    await expect(page.locator('[data-testid="cep-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="cep-error"]')).toContainText('Erro ao buscar CEP');
    
    // Should allow manual address entry
    await expect(page.locator('[data-testid="manual-address-toggle"]')).toBeVisible();
    await page.click('[data-testid="manual-address-toggle"]');
    
    // Should show manual address fields
    await expect(page.locator('[data-testid="address-street"]')).toBeEnabled();
    await expect(page.locator('[data-testid="address-neighborhood"]')).toBeEnabled();
    
    // Fill manual address
    await page.fill('[data-testid="address-street"]', 'Rua das Flores');
    await page.fill('[data-testid="address-number"]', '123');
    await page.fill('[data-testid="address-neighborhood"]', 'Centro');
    await page.fill('[data-testid="address-city"]', 'São Paulo');
    await page.fill('[data-testid="address-state"]', 'SP');
    
    // Should be able to continue
    await page.click('[data-testid="continue-to-payment"]');
    await expect(page.locator('h2')).toContainText('Método de Pagamento');
  });

  test('should handle payment processing errors', async ({ page }) => {
    // Complete checkout flow up to payment
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    await page.fill('[data-testid="customer-name"]', 'João Silva');
    await page.fill('[data-testid="customer-email"]', 'joao@example.com');
    await page.fill('[data-testid="customer-phone"]', '11999999999');
    await page.click('[data-testid="continue-to-address"]');
    
    // Mock successful CEP lookup
    await page.route('**/api/cep/**', async route => {
      await route.fulfill({
        json: {
          logradouro: 'Rua das Flores',
          bairro: 'Centro',
          localidade: 'São Paulo',
          uf: 'SP'
        }
      });
    });
    
    await page.fill('[data-testid="address-cep"]', '01234567');
    await page.fill('[data-testid="address-number"]', '123');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Select credit card payment
    await page.click('[data-testid="payment-card"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-name"]', 'JOAO SILVA');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    
    // Simulate payment processing error
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 402,
        json: {
          error: 'payment_failed',
          message: 'Cartão recusado pelo banco'
        }
      });
    });
    
    await page.click('[data-testid="confirm-order"]');
    
    // Should show payment error
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('Cartão recusado pelo banco');
    
    // Should offer alternative payment methods
    await expect(page.locator('[data-testid="try-different-payment"]')).toBeVisible();
    await page.click('[data-testid="try-different-payment"]');
    
    // Should go back to payment selection
    await expect(page.locator('h2')).toContainText('Método de Pagamento');
    
    // Try PIX payment
    await page.click('[data-testid="payment-pix"]');
    
    // Mock successful PIX payment
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        json: {
          id: 12345,
          tracking_code: 'TRK123456789',
          status: 'confirmed'
        }
      });
    });
    
    await page.click('[data-testid="confirm-order"]');
    
    // Should complete successfully
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
  });

  test('should handle session timeout during checkout', async ({ page }) => {
    // Start checkout process
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Fill customer data
    await page.fill('[data-testid="customer-name"]', 'João Silva');
    await page.fill('[data-testid="customer-email"]', 'joao@example.com');
    await page.fill('[data-testid="customer-phone"]', '11999999999');
    
    // Simulate session timeout
    await page.route('**/api/**', async route => {
      if (route.request().method() !== 'GET') {
        await route.fulfill({
          status: 401,
          json: {
            error: 'session_expired',
            message: 'Sua sessão expirou'
          }
        });
      } else {
        await route.continue();
      }
    });
    
    await page.click('[data-testid="continue-to-address"]');
    
    // Should show session expired modal
    await expect(page.locator('[data-testid="session-expired-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('Sua sessão expirou');
    
    // Should offer to continue as guest or login
    await expect(page.locator('[data-testid="continue-as-guest"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-again"]')).toBeVisible();
    
    // Continue as guest
    await page.click('[data-testid="continue-as-guest"]');
    
    // Should preserve form data and continue
    await expect(page.locator('[data-testid="customer-name"]')).toHaveValue('João Silva');
    await expect(page.locator('[data-testid="customer-email"]')).toHaveValue('joao@example.com');
  });

  test('should handle store closure during active session', async ({ page }) => {
    // Add products to cart
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="product-2"] button:has-text("Adicionar")');
    
    // Simulate store closure
    await page.route('**/api/store/status', async route => {
      await route.fulfill({
        json: {
          isOpen: false,
          closureReason: 'Fechado para manutenção',
          reopenTime: '2023-01-01T18:00:00Z'
        }
      });
    });
    
    // Try to proceed to checkout
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Should show store closure notification
    await expect(page.locator('[data-testid="store-closed-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="closure-reason"]')).toContainText('Fechado para manutenção');
    await expect(page.locator('[data-testid="reopen-time"]')).toContainText('18:00');
    
    // Should disable checkout but preserve cart
    await expect(page.locator('[data-testid="proceed-checkout"]')).toBeDisabled();
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Should offer notification signup
    await expect(page.locator('[data-testid="notify-when-open"]')).toBeVisible();
    
    await page.fill('[data-testid="notification-email"]', 'joao@example.com');
    await page.click('[data-testid="notify-when-open"]');
    
    await expect(page.locator('[data-testid="notification-success"]')).toContainText('Você será notificado quando reabrirmos');
  });

  test('should handle product unavailability during checkout', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    
    // Simulate product becoming unavailable
    await page.route('**/api/products/1/availability', async route => {
      await route.fulfill({
        json: {
          available: false,
          reason: 'Produto em falta'
        }
      });
    });
    
    await page.click('[data-testid="proceed-checkout"]');
    
    // Should show product unavailability warning
    await expect(page.locator('[data-testid="product-unavailable-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="unavailable-product-name"]')).toContainText('Pizza Margherita');
    await expect(page.locator('[data-testid="unavailability-reason"]')).toContainText('Produto em falta');
    
    // Should offer to remove or replace product
    await expect(page.locator('[data-testid="remove-unavailable-product"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggest-alternatives"]')).toBeVisible();
    
    // Remove unavailable product
    await page.click('[data-testid="remove-unavailable-product"]');
    
    // Should update cart
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('0');
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
  });

  test('should handle browser offline state', async ({ page, context }) => {
    // Add product to cart
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    
    // Simulate going offline
    await context.setOffline(true);
    
    // Try to add another product
    await page.click('[data-testid="product-2"] button:has-text("Adicionar")');
    
    // Should show offline notification
    await expect(page.locator('[data-testid="offline-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('Você está offline');
    
    // Should still allow local cart operations
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Try to proceed to checkout
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Should show offline checkout warning
    await expect(page.locator('[data-testid="offline-checkout-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-checkout-message"]')).toContainText('Conecte-se à internet para finalizar o pedido');
    
    // Go back online
    await context.setOffline(false);
    
    // Should hide offline notifications
    await expect(page.locator('[data-testid="offline-notification"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="offline-checkout-warning"]')).not.toBeVisible();
    
    // Should be able to proceed with checkout
    await expect(page.locator('[data-testid="proceed-checkout"]')).toBeEnabled();
  });

  test('should handle form validation errors with recovery', async ({ page }) => {
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Submit form with invalid data
    await page.fill('[data-testid="customer-name"]', ''); // Empty name
    await page.fill('[data-testid="customer-email"]', 'invalid-email'); // Invalid email
    await page.fill('[data-testid="customer-phone"]', '123'); // Invalid phone
    
    await page.click('[data-testid="continue-to-address"]');
    
    // Should show multiple validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Nome é obrigatório');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('E-mail inválido');
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('Telefone deve ter pelo menos 10 dígitos');
    
    // Should highlight invalid fields
    await expect(page.locator('[data-testid="customer-name"]')).toHaveClass(/border-red/);
    await expect(page.locator('[data-testid="customer-email"]')).toHaveClass(/border-red/);
    await expect(page.locator('[data-testid="customer-phone"]')).toHaveClass(/border-red/);
    
    // Fix validation errors one by one
    await page.fill('[data-testid="customer-name"]', 'João Silva');
    await expect(page.locator('[data-testid="name-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="customer-name"]')).not.toHaveClass(/border-red/);
    
    await page.fill('[data-testid="customer-email"]', 'joao@example.com');
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
    
    await page.fill('[data-testid="customer-phone"]', '11999999999');
    await expect(page.locator('[data-testid="phone-error"]')).not.toBeVisible();
    
    // Should now be able to continue
    await page.click('[data-testid="continue-to-address"]');
    await expect(page.locator('h2')).toContainText('Endereço de Entrega');
  });

  test('should handle concurrent error scenarios', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-1"] button:has-text("Adicionar")');
    
    // Simulate multiple simultaneous errors
    await simulateNetworkError(page, '**/api/cart/sync');
    await simulateServerError(page, '**/api/store/status', 503);
    await simulateNetworkError(page, '**/api/user/session');
    
    await page.click('[data-testid="cart-button"]');
    
    // Should handle multiple errors gracefully
    await expect(page.locator('[data-testid="error-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-count"]')).toContainText('3 problemas detectados');
    
    // Should prioritize critical errors
    await expect(page.locator('[data-testid="critical-error"]')).toContainText('Problemas de conectividade');
    
    // Should offer global retry
    await expect(page.locator('[data-testid="retry-all"]')).toBeVisible();
    
    // Fix errors and retry
    await page.unroute('**/api/cart/sync');
    await page.unroute('**/api/store/status');
    await page.unroute('**/api/user/session');
    
    await page.click('[data-testid="retry-all"]');
    
    // Should recover successfully
    await expect(page.locator('[data-testid="error-summary"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="proceed-checkout"]')).toBeEnabled();
  });
});