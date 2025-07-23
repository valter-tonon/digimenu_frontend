// Script de teste para verificar se o problema do campo identify foi resolvido
const puppeteer = require('puppeteer');

async function testOrderFlow() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Iniciando teste do fluxo de pedido...');
    
    // Navegar para a página do menu
    await page.goto('http://localhost:3000/menu?store=12345678901234&table=1');
    console.log('✅ Página carregada');
    
    // Aguardar o carregamento dos produtos
    await page.waitForSelector('.product-list', { timeout: 10000 });
    console.log('✅ Lista de produtos carregada');
    
    // Clicar no primeiro produto para abrir a modal
    const firstProduct = await page.$('.product-list .product-item');
    if (firstProduct) {
      await firstProduct.click();
      console.log('✅ Modal do produto aberta');
      
      // Aguardar a modal aparecer
      await page.waitForSelector('.modal', { timeout: 5000 });
      
      // Clicar em "Adicionar ao carrinho"
      const addButton = await page.$('button:contains("Adicionar ao carrinho")');
      if (addButton) {
        await addButton.click();
        console.log('✅ Produto adicionado ao carrinho');
        
        // Aguardar o carrinho abrir
        await page.waitForSelector('.cart-modal', { timeout: 5000 });
        
        // Verificar se há itens no carrinho
        const cartItems = await page.$$('.cart-item');
        console.log(`✅ ${cartItems.length} item(s) no carrinho`);
        
        // Clicar em "Finalizar Pedido"
        const finishButton = await page.$('button:contains("Finalizar Pedido")');
        if (finishButton) {
          await finishButton.click();
          console.log('✅ Tentando finalizar pedido...');
          
          // Aguardar resposta da API
          await page.waitForTimeout(3000);
          
          // Verificar se há erro
          const errorText = await page.evaluate(() => {
            const errorElement = document.querySelector('.error-message, .alert-error');
            return errorElement ? errorElement.textContent : null;
          });
          
          if (errorText) {
            console.log('❌ Erro encontrado:', errorText);
            if (errorText.includes('identify')) {
              console.log('❌ PROBLEMA: Erro do campo identify ainda persiste!');
            }
          } else {
            console.log('✅ Pedido finalizado com sucesso!');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await browser.close();
  }
}

testOrderFlow(); 