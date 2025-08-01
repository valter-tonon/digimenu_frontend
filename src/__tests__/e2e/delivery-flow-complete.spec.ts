/**
 * Complete Delivery Flow E2E Tests
 * Tests the entire delivery flow from menu to order confirmation
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test data
const testCustomer = {
  name: 'João Silva',
  email: 'joao.silva@example.com',
  phone: '11999999999',
  cpf: '12345678909'
};

const testAddress = {
  cep: '01234567',
  street: 'Rua das Flores',
  number: '123',
  complement: 'Apto 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  reference: 'Próximo ao mercado'
};

const testProducts = [
  { name: 'Pizza Margherita', price: 25.99 },
  { name: 'Pizza Pepperoni', price: 29.99 },
  { name: 'Refrigerante', price: 5.99 }
];

// Helper functions
async function addProductToCart(page: Page, productName: string) {
  await page.click(`[data-testid="product-${productName}"] button:has-text("Adicionar")`);
  await expect(page.locator('[data-testid="cart-count"]')).toContainText(/\d+/);
}

async function fillCustomerData(page: Page, customer = testCustomer) {
  await page.fill('[data-testid="customer-name"]', customer.name);
  await page.fill('[data-testid="customer-email"]', customer.email);
  await page.fill('[data-testid="customer-phone"]', customer.phone);
  if (customer.cpf) {
    await page.fill('[data-testid="customer-cpf"]', customer.cpf);
  }
}

async function fillAddressData(page: Page, address = testAddress) {
  await page.fill('[data-testid="address-cep"]', address.cep);
  
  // Wait for CEP lookup to complete
  await expect(page.locator('[data-testid="address-street"]')).toHaveValue(address.street);
  
  await page.fill('[data-testid="address-number"]', address.number);
  if (address.complement) {
    await page.fill('[data-testid="address-complement"]', address.complement);
  }
  if (address.reference) {
    await page.fill('[data-testid="address-reference"]', address.reference);
  }
}

async function selectPaymentMethod(page: Page, method: 'pix' | 'card' | 'cash') {
  await page.click(`[data-testid="payment-${method}"]`);
  
  if (method === 'card') {
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-name"]', 'JOAO SILVA');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
  } else if (method === 'cash') {
    await page.fill('[data-testid="cash-change"]', '50.00');
  }
}

test.describe('Complete Delivery Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/products', async route => {
      await route.fulfill({
        json: {
          products: testProducts.map((product, index) => ({
            id: index + 1,
            name: product.name,
            price: product.price,
            image: `/images/${product.name.toLowerCase().replace(' ', '-')}.jpg`,
            description: `Delicious ${product.name}`,
            available: true
          }))
        }
      });
    });

    await page.route('**/api/cep/**', async route => {
      await route.fulfill({
        json: {
          cep: '01234-567',
          logradouro: testAddress.street,
          bairro: testAddress.neighborhood,
          localidade: testAddress.city,
          uf: testAddress.state
        }
      });
    });

    await page.route('**/api/orders', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          json: {
            id: 12345,
            tracking_code: 'TRK123456789',
            estimated_delivery_time: '30-45 min',
            status: 'confirmed'
          }
        });
      }
    });

    // Navigate to the store
    await page.goto('/store/test-store/table/1');
  });

  test('should complete full delivery flow successfully', async ({ page }) => {
    // Step 1: Menu page - Add products to cart
    await expect(page.locator('h1')).toContainText('Menu');
    
    // Add multiple products
    await addProductToCart(page, 'Pizza Margherita');
    await addProductToCart(page, 'Refrigerante');
    
    // Verify cart count and total
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('R$ 31,98');

    // Step 2: Go to cart
    await page.click('[data-testid="cart-button"]');
    await expect(page.locator('h1')).toContainText('Seu Pedido');
    
    // Verify cart items
    await expect(page.locator('[data-testid="cart-item-Pizza Margherita"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item-Refrigerante"]')).toBeVisible();

    // Step 3: Proceed to checkout
    await page.click('[data-testid="proceed-checkout"]');
    await expect(page.locator('h1')).toContainText('Finalizar Pedido');

    // Step 4: Fill customer data
    await fillCustomerData(page);
    await page.click('[data-testid="continue-to-address"]');

    // Step 5: Fill address data
    await expect(page.locator('h2')).toContainText('Endereço de Entrega');
    await fillAddressData(page);
    await page.click('[data-testid="continue-to-payment"]');

    // Step 6: Select payment method
    await expect(page.locator('h2')).toContainText('Método de Pagamento');
    await selectPaymentMethod(page, 'pix');
    
    // Step 7: Review and confirm order
    await page.click('[data-testid="review-order"]');
    await expect(page.locator('h2')).toContainText('Revisar Pedido');
    
    // Verify order summary
    await expect(page.locator('[data-testid="order-customer-name"]')).toContainText(testCustomer.name);
    await expect(page.locator('[data-testid="order-address"]')).toContainText(testAddress.street);
    await expect(page.locator('[data-testid="order-payment-method"]')).toContainText('PIX');
    await expect(page.locator('[data-testid="order-total"]')).toContainText('R$ 31,98');

    // Step 8: Confirm order
    await page.click('[data-testid="confirm-order"]');

    // Step 9: Verify success page
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
    await expect(page.locator('[data-testid="order-number"]')).toContainText('#12345');
    await expect(page.locator('[data-testid="tracking-code"]')).toContainText('TRK123456789');
    await expect(page.locator('[data-testid="estimated-time"]')).toContainText('30-45 min');
    
    // Verify confetti animation
    await expect(page.locator('[data-testid="success-confetti"]')).toBeVisible();
    
    // Verify action buttons
    await expect(page.locator('[data-testid="track-order"]')).toBeVisible();
    await expect(page.locator('[data-testid="continue-shopping"]')).toBeVisible();
  });

  test('should handle guest checkout flow', async ({ page }) => {
    // Add product to cart
    await addProductToCart(page, 'Pizza Margherita');
    
    // Go to checkout
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Choose guest checkout
    await page.click('[data-testid="guest-checkout"]');
    
    // Fill guest data (without creating account)
    await fillCustomerData(page);
    await page.click('[data-testid="continue-as-guest"]');
    
    // Continue with address and payment
    await fillAddressData(page);
    await page.click('[data-testid="continue-to-payment"]');
    
    await selectPaymentMethod(page, 'cash');
    await page.click('[data-testid="confirm-order"]');
    
    // Should complete successfully
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
  });

  test('should handle logged-in user with saved addresses', async ({ page }) => {
    // Mock logged-in user
    await page.route('**/api/user/addresses', async route => {
      await route.fulfill({
        json: {
          addresses: [
            {
              id: 1,
              label: 'Casa',
              street: 'Rua das Flores',
              number: '123',
              neighborhood: 'Centro',
              city: 'São Paulo',
              state: 'SP',
              cep: '01234567',
              is_default: true
            },
            {
              id: 2,
              label: 'Trabalho',
              street: 'Av. Paulista',
              number: '1000',
              neighborhood: 'Bela Vista',
              city: 'São Paulo',
              state: 'SP',
              cep: '01310100',
              is_default: false
            }
          ]
        }
      });
    });

    // Set logged-in state
    await page.evaluate(() => {
      localStorage.setItem('user-token', 'mock-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com'
      }));
    });

    await page.reload();
    
    // Add product and go to checkout
    await addProductToCart(page, 'Pizza Margherita');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Should skip customer data step for logged-in users
    await expect(page.locator('h2')).toContainText('Endereço de Entrega');
    
    // Should show saved addresses
    await expect(page.locator('[data-testid="saved-address-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="saved-address-2"]')).toBeVisible();
    
    // Select saved address
    await page.click('[data-testid="select-address-1"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Continue with payment
    await selectPaymentMethod(page, 'pix');
    await page.click('[data-testid="confirm-order"]');
    
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
  });

  test('should handle different payment methods', async ({ page }) => {
    // Test PIX payment
    await addProductToCart(page, 'Pizza Margherita');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    await fillCustomerData(page);
    await page.click('[data-testid="continue-to-address"]');
    
    await fillAddressData(page);
    await page.click('[data-testid="continue-to-payment"]');
    
    // Test PIX
    await selectPaymentMethod(page, 'pix');
    await expect(page.locator('[data-testid="pix-qr-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="pix-code"]')).toBeVisible();
    
    await page.click('[data-testid="confirm-order"]');
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
  });

  test('should validate minimum order value', async ({ page }) => {
    // Mock store with minimum order requirement
    await page.route('**/api/store/status', async route => {
      await route.fulfill({
        json: {
          isOpen: true,
          minimumOrder: 30.00,
          deliveryFee: 5.00
        }
      });
    });

    // Add product below minimum
    await addProductToCart(page, 'Refrigerante'); // R$ 5.99
    
    await page.click('[data-testid="cart-button"]');
    
    // Should show minimum order warning
    await expect(page.locator('[data-testid="minimum-order-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="minimum-order-warning"]')).toContainText('Pedido mínimo: R$ 30,00');
    
    // Checkout button should be disabled
    await expect(page.locator('[data-testid="proceed-checkout"]')).toBeDisabled();
    
    // Add more products to reach minimum
    await page.click('[data-testid="back-to-menu"]');
    await addProductToCart(page, 'Pizza Margherita'); // R$ 25.99
    
    await page.click('[data-testid="cart-button"]');
    
    // Should now allow checkout
    await expect(page.locator('[data-testid="minimum-order-warning"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="proceed-checkout"]')).toBeEnabled();
  });

  test('should handle store closure during checkout', async ({ page }) => {
    // Start checkout process
    await addProductToCart(page, 'Pizza Margherita');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    await fillCustomerData(page);
    await page.click('[data-testid="continue-to-address"]');
    
    // Mock store closure
    await page.route('**/api/store/status', async route => {
      await route.fulfill({
        json: {
          isOpen: false,
          closureReason: 'Temporarily closed for maintenance'
        }
      });
    });
    
    await fillAddressData(page);
    await page.click('[data-testid="continue-to-payment"]');
    
    // Should show store closure notification
    await expect(page.locator('[data-testid="store-closed-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="closure-reason"]')).toContainText('Temporarily closed for maintenance');
    
    // Should disable order confirmation
    await expect(page.locator('[data-testid="confirm-order"]')).toBeDisabled();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await addProductToCart(page, 'Pizza Margherita');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    await fillCustomerData(page);
    await page.click('[data-testid="continue-to-address"]');
    
    await fillAddressData(page);
    await page.click('[data-testid="continue-to-payment"]');
    
    await selectPaymentMethod(page, 'pix');
    
    // Mock network error
    await page.route('**/api/orders', async route => {
      await route.abort('failed');
    });
    
    await page.click('[data-testid="confirm-order"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="order-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-error"]')).toContainText('Erro ao processar pedido');
    
    // Should offer retry option
    await expect(page.locator('[data-testid="retry-order"]')).toBeVisible();
    
    // Test retry functionality
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        json: {
          id: 12345,
          tracking_code: 'TRK123456789',
          status: 'confirmed'
        }
      });
    });
    
    await page.click('[data-testid="retry-order"]');
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
  });

  test('should maintain cart state across page refreshes', async ({ page }) => {
    // Add products to cart
    await addProductToCart(page, 'Pizza Margherita');
    await addProductToCart(page, 'Refrigerante');
    
    // Refresh page
    await page.reload();
    
    // Cart should be preserved
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('R$ 31,98');
    
    // Should be able to continue checkout
    await page.click('[data-testid="cart-button"]');
    await expect(page.locator('[data-testid="cart-item-Pizza Margherita"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item-Refrigerante"]')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await addProductToCart(page, 'Pizza Margherita');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    // Try to continue without filling required fields
    await page.click('[data-testid="continue-to-address"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Nome é obrigatório');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('E-mail é obrigatório');
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('Telefone é obrigatório');
    
    // Fill invalid email
    await page.fill('[data-testid="customer-email"]', 'invalid-email');
    await page.blur('[data-testid="customer-email"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('E-mail inválido');
    
    // Fix validation errors
    await fillCustomerData(page);
    
    // Should be able to continue
    await page.click('[data-testid="continue-to-address"]');
    await expect(page.locator('h2')).toContainText('Endereço de Entrega');
  });

  test('should track order after completion', async ({ page }) => {
    // Complete order
    await addProductToCart(page, 'Pizza Margherita');
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="proceed-checkout"]');
    
    await fillCustomerData(page);
    await page.click('[data-testid="continue-to-address"]');
    
    await fillAddressData(page);
    await page.click('[data-testid="continue-to-payment"]');
    
    await selectPaymentMethod(page, 'pix');
    await page.click('[data-testid="confirm-order"]');
    
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
    
    // Mock order tracking API
    await page.route('**/api/orders/12345/track', async route => {
      await route.fulfill({
        json: {
          id: 12345,
          status: 'preparing',
          estimated_delivery_time: '25-30 min',
          tracking_updates: [
            { status: 'confirmed', timestamp: '2023-01-01T10:00:00Z', message: 'Pedido confirmado' },
            { status: 'preparing', timestamp: '2023-01-01T10:05:00Z', message: 'Preparando seu pedido' }
          ]
        }
      });
    });
    
    // Click track order
    await page.click('[data-testid="track-order"]');
    
    // Should navigate to tracking page
    await expect(page.locator('h1')).toContainText('Acompanhar Pedido');
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Preparando');
    await expect(page.locator('[data-testid="tracking-timeline"]')).toBeVisible();
  });
});

test.describe('Mobile Delivery Flow E2E', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE dimensions
  });

  test('should complete delivery flow on mobile', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    
    // Mobile-specific interactions
    await addProductToCart(page, 'Pizza Margherita');
    
    // Mobile cart should be accessible via floating button
    await page.click('[data-testid="floating-cart-button"]');
    
    // Should show mobile-optimized cart
    await expect(page.locator('[data-testid="mobile-cart-modal"]')).toBeVisible();
    
    await page.click('[data-testid="proceed-checkout-mobile"]');
    
    // Continue with mobile checkout flow
    await fillCustomerData(page);
    await page.click('[data-testid="continue-to-address"]');
    
    await fillAddressData(page);
    await page.click('[data-testid="continue-to-payment"]');
    
    await selectPaymentMethod(page, 'pix');
    await page.click('[data-testid="confirm-order"]');
    
    await expect(page.locator('h1')).toContainText('Pedido Confirmado!');
  });

  test('should handle mobile-specific gestures', async ({ page }) => {
    await page.goto('/store/test-store/table/1');
    
    // Test swipe gestures on product carousel
    const productCarousel = page.locator('[data-testid="product-carousel"]');
    await productCarousel.hover();
    
    // Simulate swipe left
    await productCarousel.dragTo(productCarousel, {
      sourcePosition: { x: 300, y: 100 },
      targetPosition: { x: 100, y: 100 }
    });
    
    // Should show next products
    await expect(page.locator('[data-testid="carousel-page-2"]')).toBeVisible();
  });
});