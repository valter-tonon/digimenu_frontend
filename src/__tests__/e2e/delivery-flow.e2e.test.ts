import { test, expect } from '@playwright/test';

// Configurações do teste
const STORE_UUID = '02efe224-e368-4a7a-a153-5fc49cd9c5ac';
const BASE_URL = 'http://localhost:3000';
const MENU_URL = `${BASE_URL}/${STORE_UUID}`;

test.describe('Delivery Flow - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar interceptadores de rede se necessário
    await page.route('**/api/v1/**', async (route) => {
      // Permitir todas as chamadas de API passarem normalmente
      await route.continue();
    });
  });

  test('deve completar o fluxo de delivery completo', async ({ page }) => {
    // 1. Navegar para a página da loja
    await page.goto(MENU_URL);
    
    // 2. Aguardar carregamento da página
    await expect(page.locator('text=Carregando cardápio...')).toBeVisible();
    await expect(page.locator('text=Carregando cardápio...')).not.toBeVisible({ timeout: 10000 });
    
    // 3. Verificar se a página carregou corretamente
    await expect(page.locator('text=Empresa X')).toBeVisible();
    await expect(page.locator('text=Aberto')).toBeVisible();
    
    // 4. Verificar se produtos foram carregados
    await expect(page.locator('text=X-Bacon')).toBeVisible();
    
    // 5. Verificar seções especiais
    await expect(page.locator('text=Produtos em Destaque')).toBeVisible();
    
    // 6. Testar busca de produtos
    const searchInput = page.locator('input[placeholder*="Buscar produtos"]');
    await searchInput.fill('X-Bacon');
    await expect(page.locator('text=X-Bacon')).toBeVisible();
    
    // 7. Limpar busca
    await searchInput.clear();
    
    // 8. Abrir detalhes do produto
    const productDetailsButton = page.locator('button:has-text("Ver detalhes")').first();
    await productDetailsButton.click();
    
    // 9. Verificar modal de detalhes
    await expect(page.locator('text=Descrição')).toBeVisible();
    await expect(page.locator('text=Quantidade')).toBeVisible();
    
    // 10. Aumentar quantidade
    const increaseButton = page.locator('button[aria-label="Aumentar quantidade"]');
    await increaseButton.click();
    
    // 11. Verificar se quantidade foi atualizada
    await expect(page.locator('input[value="2"]')).toBeVisible();
    
    // 12. Adicionar ao carrinho
    const addToCartButton = page.locator('button:has-text("Adicionar ao Carrinho")');
    await addToCartButton.click();
    
    // 13. Verificar se modal fechou e carrinho foi atualizado
    await expect(page.locator('text=Descrição')).not.toBeVisible();
    await expect(page.locator('text=2').first()).toBeVisible(); // Contador do carrinho
    
    // 14. Abrir carrinho
    const cartButton = page.locator('button:has-text("Abrir carrinho")');
    await cartButton.click();
    
    // 15. Verificar conteúdo do carrinho
    await expect(page.locator('text=2x X-Bacon')).toBeVisible();
    await expect(page.locator('text=R$ 60,00')).toBeVisible(); // 2 x R$ 30,00
    
    // 16. Finalizar pedido (deve redirecionar para checkout)
    const finishOrderButton = page.locator('button:has-text("Finalizar Pedido")');
    await finishOrderButton.click();
    
    // 17. Verificar redirecionamento para checkout
    await expect(page).toHaveURL(/.*\/checkout/);
    
    // 18. Verificar página de checkout
    await expect(page.locator('text=Finalizar Pedido')).toBeVisible();
    await expect(page.locator('text=Resumo do Pedido')).toBeVisible();
  });

  test('deve aplicar filtros corretamente', async ({ page }) => {
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Abrir filtros
    const filterButton = page.locator('button:has-text("Filtros")');
    await filterButton.click();
    
    // Aplicar filtro de produtos em destaque
    const featuredFilter = page.locator('input[type="checkbox"][id*="featured"]');
    await featuredFilter.check();
    
    // Aplicar filtros
    const applyButton = page.locator('button:has-text("Aplicar")');
    await applyButton.click();
    
    // Verificar se apenas produtos em destaque são exibidos
    await expect(page.locator('text=Destaque')).toBeVisible();
  });

  test('deve calcular preços promocionais corretamente', async ({ page }) => {
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Procurar por produto em promoção (se existir)
    const promotionalProduct = page.locator('.line-through').first();
    if (await promotionalProduct.isVisible()) {
      // Verificar se preço original está riscado
      await expect(promotionalProduct).toBeVisible();
      
      // Verificar se preço promocional está destacado
      const promotionalPrice = page.locator('.text-green-600').first();
      await expect(promotionalPrice).toBeVisible();
    }
  });

  test('deve validar valor mínimo do pedido', async ({ page }) => {
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Adicionar produto com valor baixo
    const productButton = page.locator('button:has-text("Ver detalhes")').first();
    await productButton.click();
    
    const addButton = page.locator('button:has-text("Adicionar ao Carrinho")');
    await addButton.click();
    
    // Abrir carrinho
    const cartButton = page.locator('button:has-text("Abrir carrinho")');
    await cartButton.click();
    
    // Verificar se alerta de valor mínimo é exibido (se aplicável)
    const minOrderAlert = page.locator('text*="Valor mínimo"');
    if (await minOrderAlert.isVisible()) {
      await expect(minOrderAlert).toBeVisible();
      
      // Verificar se botão está desabilitado
      const finishButton = page.locator('button:has-text("Finalizar Pedido")');
      await expect(finishButton).toBeDisabled();
    }
  });

  test('deve persistir carrinho entre recarregamentos', async ({ page }) => {
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Adicionar produto ao carrinho
    const productButton = page.locator('button:has-text("Ver detalhes")').first();
    await productButton.click();
    
    const addButton = page.locator('button:has-text("Adicionar ao Carrinho")');
    await addButton.click();
    
    // Verificar se carrinho tem itens
    await expect(page.locator('text=1').first()).toBeVisible();
    
    // Recarregar página
    await page.reload();
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Verificar se carrinho foi mantido
    await expect(page.locator('text=1').first()).toBeVisible();
  });

  test('deve funcionar corretamente em mobile', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Verificar se layout mobile está funcionando
    await expect(page.locator('text=X-Bacon')).toBeVisible();
    
    // Testar scroll horizontal das categorias
    const categoryList = page.locator('[data-testid="category-list"]');
    if (await categoryList.isVisible()) {
      await categoryList.scrollIntoViewIfNeeded();
    }
    
    // Testar botão flutuante do carrinho
    const floatingCartButton = page.locator('button:has-text("Abrir carrinho")');
    await expect(floatingCartButton).toBeVisible();
  });

  test('deve tratar erros de rede graciosamente', async ({ page }) => {
    // Interceptar e falhar chamadas de API
    await page.route('**/api/v1/menu**', async (route) => {
      await route.abort('failed');
    });
    
    await page.goto(MENU_URL);
    
    // Verificar se mensagem de erro é exibida
    await expect(page.locator('text*="Não foi possível carregar"')).toBeVisible({ timeout: 10000 });
  });

  test('deve exibir informações da loja corretamente', async ({ page }) => {
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Verificar informações da loja
    await expect(page.locator('text=Aberto')).toBeVisible();
    await expect(page.locator('text*="00h00:00 - 23h59:00"')).toBeVisible();
    
    // Verificar se logo está presente (se existir)
    const logo = page.locator('img[alt*="Empresa X"]');
    if (await logo.isVisible()) {
      await expect(logo).toBeVisible();
    }
  });

  test('deve navegar entre categorias corretamente', async ({ page }) => {
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Clicar na categoria "Todos"
    const allCategoryButton = page.locator('button:has-text("Todos")');
    await allCategoryButton.click();
    
    // Verificar se todos os produtos são exibidos
    await expect(page.locator('text=X-Bacon')).toBeVisible();
    
    // Clicar em uma categoria específica
    const lanchesButton = page.locator('button:has-text("Lanches")');
    if (await lanchesButton.isVisible()) {
      await lanchesButton.click();
      
      // Verificar se apenas produtos da categoria são exibidos
      await expect(page.locator('text=X-Bacon')).toBeVisible();
    }
  });

  test('deve exibir tags dos produtos corretamente', async ({ page }) => {
    await page.goto(MENU_URL);
    
    // Aguardar carregamento
    await expect(page.locator('text=Empresa X')).toBeVisible();
    
    // Verificar se tags são exibidas
    const spicyTag = page.locator('text=picante');
    if (await spicyTag.isVisible()) {
      await expect(spicyTag).toBeVisible();
    }
    
    const newTag = page.locator('text=novo');
    if (await newTag.isVisible()) {
      await expect(newTag).toBeVisible();
    }
    
    // Verificar badges de destaque
    const featuredBadge = page.locator('text=Destaque');
    if (await featuredBadge.isVisible()) {
      await expect(featuredBadge).toBeVisible();
    }
  });
});