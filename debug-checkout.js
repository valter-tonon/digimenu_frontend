const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log de todas as respostas de rede
  page.on('response', response => {
    if (response.url().includes('whatsapp') || response.url().includes('checkout')) {
      console.log(`[NETWORK] ${response.status()} ${response.url()}`);
    }
  });

  // Log de erros no console
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  console.log('\n=== Acessando página de autenticação ===\n');
  await page.goto('http://localhost:3000/checkout/authentication');

  // Espera a página carregar
  await page.waitForLoadState('networkidle');

  // Verifica storage inicial
  console.log('\n=== STORAGE INICIAL ===');
  const storageInitial = await page.evaluate(() => {
    return {
      auth_token: localStorage.getItem('auth_token'),
      whatsapp_auth_jwt: localStorage.getItem('whatsapp_auth_jwt'),
      all_keys: Object.keys(localStorage)
    };
  });
  console.log(JSON.stringify(storageInitial, null, 2));

  // Preenche número de telefone
  console.log('\n=== Preenchendo número de telefone ===');
  await page.fill('input[type="tel"]', '+5547988376773');

  // Clica em "Enviar Código"
  console.log('Clicando em "Enviar Código"...');
  await page.click('button:has-text("Enviar Código")');

  // Aguarda a resposta
  await page.waitForTimeout(3000);

  console.log('\n=== STORAGE APÓS ENVIAR CÓDIGO ===');
  const storageAfterCode = await page.evaluate(() => {
    return {
      auth_token: localStorage.getItem('auth_token'),
      whatsapp_auth_jwt: localStorage.getItem('whatsapp_auth_jwt'),
      all_keys: Object.keys(localStorage)
    };
  });
  console.log(JSON.stringify(storageAfterCode, null, 2));

  // Verifica se mudou para tela de código
  const stepCodeVisible = await page.isVisible('text=Digite o Código');
  console.log(`\n[UI] Tela de código visível: ${stepCodeVisible}`);

  // Se chegou aqui, precisamos do código real
  console.log('\n=== INSTRUÇÕES ===');
  console.log('Digite o código de 6 dígitos que você recebeu no WhatsApp');
  console.log('Pressione ENTER para continuar o debug...');

  // Aguarda input do usuário
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // Aguarda a navegação após validar código
  await page.waitForTimeout(3000);

  console.log('\n=== STORAGE APÓS VALIDAÇÃO ===');
  const storageAfterValidation = await page.evaluate(() => {
    return {
      auth_token: localStorage.getItem('auth_token'),
      whatsapp_auth_jwt: localStorage.getItem('whatsapp_auth_jwt'),
      all_keys: Object.keys(localStorage)
    };
  });
  console.log(JSON.stringify(storageAfterValidation, null, 2));

  // Verifica URL atual
  console.log(`\n[URL] Página atual: ${page.url()}`);

  // Verifica hook useAuth
  console.log('\n=== VERIFICANDO HOOK useAuth ===');
  const authState = await page.evaluate(() => {
    // Simula o que o hook vê
    const storedToken = localStorage.getItem('auth_token');
    return {
      token_exists: !!storedToken,
      token_value: storedToken ? storedToken.substring(0, 20) + '...' : null,
      whatsapp_jwt: localStorage.getItem('whatsapp_auth_jwt') ? 'EXISTS' : 'NOT FOUND'
    };
  });
  console.log(JSON.stringify(authState, null, 2));

  console.log('\n=== Debug completo ===');
  console.log('Mantenha o navegador aberto para inspeção manual');

  // Deixa o navegador aberto para inspeção
  await new Promise(() => {});
})();
