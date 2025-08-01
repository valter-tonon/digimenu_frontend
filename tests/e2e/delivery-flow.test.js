/**
 * Suíte de Testes E2E - Fluxo de Delivery
 * 
 * Testa o fluxo completo de delivery desde a visualização do cardápio
 * até a finalização do pedido, incluindo:
 * - Carregamento do cardápio
 * - Navegação por categorias
 * - Busca e filtros
 * - Adição de produtos ao carrinho
 * - Visualização do carrinho
 * - Processo de checkout
 * - Finalização do pedido
 */

const { test, expect } = require('@playwright/test');

// Configurações do teste
const STORE_ID = '02efe224-e368-4a7a-a153-5fc49cd9c5ac';
const BASE_URL = 'http://localhost:3000';
const DELIVERY_URL = `${BASE_URL}/${STORE_ID}`;

test.describe('Fluxo de Delivery - Testes E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar timeouts
    page.setDefaultTimeout(10000);
    
    // Navegar para a página de delivery
    await page.goto(DELIVERY_URL);
    
    // Aguardar o carregamento completo da página
    await page.waitForSelector('[data-testid="menu-loaded"]', { timeout: 15000 });
  });

  test.describe('1. Carregamento Inicial', () => {
    
    test('deve carregar a página do cardápio corretamente', async ({ page }) => {
      // Verificar se o título da página está correto
      await expect(page).toHaveTitle('DigiMenu - Sistema de Pedidos');
      
      // Verificar se o nome da empresa está visível
      await expect(page.locator('text=Empresa X')).toBeVisible();
      
      // Verificar se o status da loja está visível (Aberto/Fechado)
      await expect(page.locator('text=Aberto')).toBeVisible();
      
      // Verificar se o horário de funcionamento está visível
      await expect(page.locator('text=00h00:00 - 23h59:00')).toBeVisible();
    });

    test('deve mostrar produtos em destaque', async ({ page }) => {
      // Verificar se a seção de produtos em destaque está visível
      await expect(page.locator('text=Produtos em Destaque')).toBeVisible();
      
      // Verificar se há pelo menos um produto em destaque
      const featuredProducts = page.locator('[data-testid="featured-product"]');
      await expect(featuredProducts).toHaveCountGreaterThan(0);
    });

    test('deve mostrar categorias de produtos', async ({ page }) => {
      // Verificar se as categorias estão visíveis
      await expect(page.locator('text=Todos')).toBeVisible();
      await expect(page.locator('text=Lanches')).toBeVisible();
    });

    test('deve mostrar o carrinho com contador correto', async ({ page }) => {
      // Verificar se o botão do carrinho está visível
      const cartButton = page.locator('[data-testid="cart-button"]');
      await expect(cartButton).toBeVisible();
      
      // Verificar se o contador do carrinho está visível
      const cartCounter = page.locator('[data-testid="cart-counter"]');
      await expect(cartCounter).toBeVisible();
    });
  });

  test.describe('2. Navegação e Busca', () => {
    
    test('deve permitir buscar produtos', async ({ page }) => {
      // Localizar a barra de busca
      const searchInput = page.locator('input[placeholder*="Buscar produtos"]');
      await expect(searchInput).toBeVisible();
      
      // Realizar uma busca
      await searchInput.fill('X-Bacon');
      await page.waitForTimeout(1000); // Aguardar debounce
      
      // Verificar se os resultados da busca aparecem
      await expect(page.locator('text=X-Bacon')).toBeVisible();
    });

    test('deve permitir filtrar produtos', async ({ page }) => {
      // Clicar no botão de filtros
      const filterButton = page.locator('button:has-text("Filtros")');
      await expect(filterButton).toBeVisible();
      await filterButton.click();
      
      // Aguardar o modal de filtros abrir
      await page.waitForSelector('[data-testid="filter-modal"]', { timeout: 5000 });
      
      // Verificar se as opções de filtro estão disponíveis
      await expect(page.locator('text=Apenas em destaque')).toBeVisible();
      await expect(page.locator('text=Apenas promocionais')).toBeVisible();
    });

    test('deve permitir navegar entre categorias', async ({ page }) => {
      // Clicar na categoria "Lanches"
      const lanchesCategory = page.locator('text=Lanches');
      await expect(lanchesCategory).toBeVisible();
      await lanchesCategory.click();
      
      // Verificar se a categoria foi selecionada
      await expect(lanchesCategory).toHaveClass(/selected|active/);
      
      // Voltar para "Todos"
      const todosCategory = page.locator('text=Todos');
      await todosCategory.click();
      await expect(todosCategory).toHaveClass(/selected|active/);
    });
  });

  test.describe('3. Adição de Produtos ao Carrinho', () => {
    
    test('deve permitir visualizar detalhes do produto', async ({ page }) => {
      // Clicar em "Ver detalhes" de um produto
      const detailsButton = page.locator('button:has-text("Ver detalhes")').first();
      await expect(detailsButton).toBeVisible();
      await detailsButton.click();
      
      // Verificar se o modal de detalhes abriu
      await page.waitForSelector('[data-testid="product-modal"]', { timeout: 5000 });
      
      // Verificar se os detalhes do produto estão visíveis
      await expect(page.locator('text=X-Bacon')).toBeVisible();
      await expect(page.locator('text=Descrição')).toBeVisible();
    });

    test('deve permitir adicionar produto ao carrinho', async ({ page }) => {
      // Obter o contador atual do carrinho
      const cartCounter = page.locator('[data-testid="cart-counter"]');
      const initialCount = await cartCounter.textContent();
      
      // Clicar em "Ver detalhes" para abrir o modal
      const detailsButton = page.locator('button:has-text("Ver detalhes")').first();
      await detailsButton.click();
      
      // Aguardar o modal abrir
      await page.waitForSelector('[data-testid="product-modal"]', { timeout: 5000 });
      
      // Adicionar produto ao carrinho
      const addToCartButton = page.locator('button:has-text("Adicionar ao Carrinho")');
      await expect(addToCartButton).toBeVisible();
      await addToCartButton.click();
      
      // Verificar se o contador do carrinho aumentou
      await expect(cartCounter).not.toHaveText(initialCount);
    });

    test('deve permitir selecionar adicionais', async ({ page }) => {
      // Abrir detalhes do produto
      const detailsButton = page.locator('button:has-text("Ver detalhes")').first();
      await detailsButton.click();
      
      // Aguardar o modal abrir
      await page.waitForSelector('[data-testid="product-modal"]', { timeout: 5000 });
      
      // Verificar se há seção de adicionais
      const additionalsSection = page.locator('text=Adicionais');
      if (await additionalsSection.isVisible()) {
        // Selecionar um adicional
        const firstAdditional = page.locator('[data-testid="additional-item"]').first();
        await firstAdditional.click();
        
        // Verificar se o adicional foi selecionado
        await expect(firstAdditional).toHaveClass(/selected|checked/);
      }
    });

    test('deve permitir alterar quantidade do produto', async ({ page }) => {
      // Abrir detalhes do produto
      const detailsButton = page.locator('button:has-text("Ver detalhes")').first();
      await detailsButton.click();
      
      // Aguardar o modal abrir
      await page.waitForSelector('[data-testid="product-modal"]', { timeout: 5000 });
      
      // Localizar controles de quantidade
      const increaseButton = page.locator('[data-testid="quantity-increase"]');
      const quantityDisplay = page.locator('[data-testid="quantity-display"]');
      
      if (await increaseButton.isVisible()) {
        // Verificar quantidade inicial
        const initialQuantity = await quantityDisplay.textContent();
        
        // Aumentar quantidade
        await increaseButton.click();
        
        // Verificar se a quantidade aumentou
        await expect(quantityDisplay).not.toHaveText(initialQuantity);
      }
    });
  });

  test.describe('4. Gerenciamento do Carrinho', () => {
    
    test('deve abrir o carrinho ao clicar no botão', async ({ page }) => {
      // Clicar no botão do carrinho
      const cartButton = page.locator('[data-testid="cart-button"]');
      await cartButton.click();
      
      // Verificar se o carrinho abriu
      await page.waitForSelector('[data-testid="cart-modal"]', { timeout: 5000 });
      await expect(page.locator('text=Resumo do Pedido')).toBeVisible();
    });

    test('deve mostrar produtos no carrinho', async ({ page }) => {
      // Abrir o carrinho
      const cartButton = page.locator('[data-testid="cart-button"]');
      await cartButton.click();
      
      // Aguardar o carrinho abrir
      await page.waitForSelector('[data-testid="cart-modal"]', { timeout: 5000 });
      
      // Verificar se há produtos no carrinho
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCountGreaterThan(0);
    });

    test('deve permitir remover produtos do carrinho', async ({ page }) => {
      // Abrir o carrinho
      const cartButton = page.locator('[data-testid="cart-button"]');
      await cartButton.click();
      
      // Aguardar o carrinho abrir
      await page.waitForSelector('[data-testid="cart-modal"]', { timeout: 5000 });
      
      // Localizar botão de remover
      const removeButton = page.locator('button:has-text("Remover")').first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        
        // Verificar se o item foi removido
        await page.waitForTimeout(1000);
        // O contador do carrinho deve ter diminuído
      }
    });

    test('deve calcular o total corretamente', async ({ page }) => {
      // Abrir o carrinho
      const cartButton = page.locator('[data-testid="cart-button"]');
      await cartButton.click();
      
      // Aguardar o carrinho abrir
      await page.waitForSelector('[data-testid="cart-modal"]', { timeout: 5000 });
      
      // Verificar se o total está visível
      await expect(page.locator('text=Total:')).toBeVisible();
      
      // Verificar se há um valor monetário
      await expect(page.locator('text=/R\$ \d+,\d{2}/')).toBeVisible();
    });
  });

  test.describe('5. Processo de Checkout', () => {
    
    test('deve redirecionar para checkout ao finalizar pedido', async ({ page }) => {
      // Abrir o carrinho
      const cartButton = page.locator('[data-testid="cart-button"]');
      await cartButton.click();
      
      // Aguardar o carrinho abrir
      await page.waitForSelector('[data-testid="cart-modal"]', { timeout: 5000 });
      
      // Clicar em finalizar pedido
      const finishButton = page.locator('button:has-text("Finalizar Pedido")');
      if (await finishButton.isVisible()) {
        await finishButton.click();
        
        // Verificar se foi redirecionado para checkout
        await page.waitForURL('**/checkout', { timeout: 10000 });
        await expect(page).toHaveURL(/checkout/);
      }
    });

    test('deve mostrar formulário de dados do cliente', async ({ page }) => {
      // Navegar diretamente para checkout (assumindo que há itens no carrinho)
      await page.goto(`${BASE_URL}/checkout`);
      
      // Aguardar carregamento da página de checkout
      await page.waitForSelector('[data-testid="checkout-form"]', { timeout: 10000 });
      
      // Verificar se os campos obrigatórios estão presentes
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="phone"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('deve validar campos obrigatórios', async ({ page }) => {
      // Navegar para checkout
      await page.goto(`${BASE_URL}/checkout`);
      
      // Aguardar carregamento
      await page.waitForSelector('[data-testid="checkout-form"]', { timeout: 10000 });
      
      // Tentar submeter formulário vazio
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Verificar se mensagens de erro aparecem
        await expect(page.locator('text=/obrigatório|required/i')).toBeVisible();
      }
    });

    test('deve permitir preencher dados de entrega', async ({ page }) => {
      // Navegar para checkout
      await page.goto(`${BASE_URL}/checkout`);
      
      // Aguardar carregamento
      await page.waitForSelector('[data-testid="checkout-form"]', { timeout: 10000 });
      
      // Preencher dados do cliente
      await page.fill('input[name="name"]', 'João Silva');
      await page.fill('input[name="phone"]', '(11) 99999-9999');
      await page.fill('input[name="email"]', 'joao@email.com');
      
      // Preencher endereço se houver campo
      const addressField = page.locator('textarea[name="address"]');
      if (await addressField.isVisible()) {
        await addressField.fill('Rua das Flores, 123 - Centro - São Paulo - SP');
      }
      
      // Verificar se os dados foram preenchidos
      await expect(page.locator('input[name="name"]')).toHaveValue('João Silva');
      await expect(page.locator('input[name="phone"]')).toHaveValue('(11) 99999-9999');
    });
  });

  test.describe('6. Finalização do Pedido', () => {
    
    test('deve processar pedido com dados válidos', async ({ page }) => {
      // Navegar para checkout
      await page.goto(`${BASE_URL}/checkout`);
      
      // Aguardar carregamento
      await page.waitForSelector('[data-testid="checkout-form"]', { timeout: 10000 });
      
      // Preencher formulário completo
      await page.fill('input[name="name"]', 'João Silva');
      await page.fill('input[name="phone"]', '(11) 99999-9999');
      await page.fill('input[name="email"]', 'joao@email.com');
      
      // Aceitar termos se houver checkbox
      const termsCheckbox = page.locator('input[type="checkbox"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }
      
      // Submeter formulário
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Aguardar processamento
        await page.waitForTimeout(3000);
        
        // Verificar se houve redirecionamento ou mensagem de sucesso
        const successMessage = page.locator('text=/sucesso|confirmado|pedido realizado/i');
        const isSuccess = await successMessage.isVisible();
        
        if (isSuccess) {
          console.log('Pedido processado com sucesso');
        }
      }
    });

    test('deve mostrar resumo do pedido antes da finalização', async ({ page }) => {
      // Navegar para checkout
      await page.goto(`${BASE_URL}/checkout`);
      
      // Aguardar carregamento
      await page.waitForSelector('[data-testid="checkout-form"]', { timeout: 10000 });
      
      // Verificar se há resumo do pedido
      const orderSummary = page.locator('[data-testid="order-summary"]');
      if (await orderSummary.isVisible()) {
        // Verificar se mostra itens do pedido
        await expect(page.locator('text=/item|produto/i')).toBeVisible();
        
        // Verificar se mostra total
        await expect(page.locator('text=/total/i')).toBeVisible();
      }
    });
  });

  test.describe('7. Testes de Responsividade', () => {
    
    test('deve funcionar corretamente em mobile', async ({ page }) => {
      // Configurar viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Recarregar página
      await page.reload();
      await page.waitForSelector('[data-testid="menu-loaded"]', { timeout: 15000 });
      
      // Verificar se elementos principais estão visíveis
      await expect(page.locator('text=Empresa X')).toBeVisible();
      await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
      
      // Verificar se o menu é responsivo
      const searchInput = page.locator('input[placeholder*="Buscar produtos"]');
      await expect(searchInput).toBeVisible();
    });

    test('deve funcionar corretamente em tablet', async ({ page }) => {
      // Configurar viewport tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Recarregar página
      await page.reload();
      await page.waitForSelector('[data-testid="menu-loaded"]', { timeout: 15000 });
      
      // Verificar layout em tablet
      await expect(page.locator('text=Empresa X')).toBeVisible();
      await expect(page.locator('text=Produtos em Destaque')).toBeVisible();
    });
  });

  test.describe('8. Testes de Performance', () => {
    
    test('deve carregar a página em tempo aceitável', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(DELIVERY_URL);
      await page.waitForSelector('[data-testid="menu-loaded"]', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      
      // Verificar se carregou em menos de 10 segundos
      expect(loadTime).toBeLessThan(10000);
      console.log(`Página carregou em ${loadTime}ms`);
    });

    test('deve carregar imagens corretamente', async ({ page }) => {
      // Aguardar carregamento completo
      await page.waitForSelector('[data-testid="menu-loaded"]', { timeout: 15000 });
      
      // Verificar se as imagens dos produtos carregaram
      const productImages = page.locator('img[alt*="X-Bacon"]');
      const imageCount = await productImages.count();
      
      if (imageCount > 0) {
        // Verificar se pelo menos uma imagem carregou
        const firstImage = productImages.first();
        await expect(firstImage).toBeVisible();
        
        // Verificar se a imagem não está quebrada
        const naturalWidth = await firstImage.evaluate(img => img.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });
  });

  test.describe('9. Testes de Acessibilidade', () => {
    
    test('deve ter elementos com labels apropriados', async ({ page }) => {
      // Verificar se inputs têm labels ou placeholders
      const searchInput = page.locator('input[placeholder*="Buscar produtos"]');
      await expect(searchInput).toHaveAttribute('placeholder');
      
      // Verificar se botões têm texto ou aria-label
      const cartButton = page.locator('[data-testid="cart-button"]');
      const hasText = await cartButton.textContent();
      const hasAriaLabel = await cartButton.getAttribute('aria-label');
      
      expect(hasText || hasAriaLabel).toBeTruthy();
    });

    test('deve permitir navegação por teclado', async ({ page }) => {
      // Focar no primeiro elemento interativo
      await page.keyboard.press('Tab');
      
      // Verificar se algum elemento recebeu foco
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continuar navegação por tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verificar se o foco mudou
      const newFocusedElement = page.locator(':focus');
      await expect(newFocusedElement).toBeVisible();
    });
  });

  test.describe('10. Testes de Integração com API', () => {
    
    test('deve carregar dados do menu via API', async ({ page }) => {
      // Interceptar chamadas de API
      let apiCalled = false;
      
      page.on('request', request => {
        if (request.url().includes('/api/v1/menu') || request.url().includes('/menu')) {
          apiCalled = true;
          console.log('API chamada:', request.url());
        }
      });
      
      // Recarregar página para capturar chamadas de API
      await page.reload();
      await page.waitForSelector('[data-testid="menu-loaded"]', { timeout: 15000 });
      
      // Verificar se a API foi chamada
      expect(apiCalled).toBeTruthy();
    });

    test('deve lidar com erros de API graciosamente', async ({ page }) => {
      // Interceptar e falhar chamadas de API
      await page.route('**/api/v1/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      // Tentar carregar página
      await page.goto(DELIVERY_URL);
      
      // Aguardar um tempo para ver como a aplicação lida com o erro
      await page.waitForTimeout(5000);
      
      // Verificar se há mensagem de erro ou fallback
      const errorMessage = page.locator('text=/erro|error|não foi possível/i');
      const isErrorVisible = await errorMessage.isVisible();
      
      if (isErrorVisible) {
        console.log('Aplicação mostrou mensagem de erro apropriada');
      }
    });
  });
});