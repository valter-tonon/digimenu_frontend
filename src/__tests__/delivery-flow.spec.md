# Especificação de Testes - Fluxo de Delivery

## Objetivo
Garantir que o fluxo completo de delivery funcione corretamente, desde a visualização do cardápio até a finalização do pedido.

## Cenários de Teste

### 1. Carregamento Inicial da Página
- [ ] Deve carregar a página do menu com o UUID da loja
- [ ] Deve identificar automaticamente como modo delivery
- [ ] Deve exibir o header com informações da loja
- [ ] Deve carregar categorias e produtos
- [ ] Deve exibir produtos em destaque
- [ ] Deve exibir produtos em promoção

### 2. Navegação e Busca
- [ ] Deve permitir buscar produtos por nome
- [ ] Deve permitir filtrar produtos por categoria
- [ ] Deve aplicar filtros avançados (destaque, promoção, popular)
- [ ] Deve exibir estatísticas dos resultados filtrados

### 3. Gerenciamento do Carrinho
- [ ] Deve adicionar produtos ao carrinho
- [ ] Deve permitir selecionar adicionais
- [ ] Deve calcular preços corretamente (incluindo promoções)
- [ ] Deve persistir carrinho no localStorage
- [ ] Deve exibir contador de itens no botão flutuante
- [ ] Deve abrir modal do carrinho ao clicar no botão

### 4. Fluxo de Checkout
- [ ] Deve redirecionar para /checkout quando finalizar pedido em modo delivery
- [ ] Deve exibir resumo do pedido
- [ ] Deve solicitar dados do cliente (nome, telefone, email)
- [ ] Deve solicitar endereço de entrega
- [ ] Deve permitir selecionar forma de pagamento
- [ ] Deve validar campos obrigatórios

### 5. Finalização do Pedido
- [ ] Deve enviar pedido para API com dados corretos
- [ ] Deve limpar carrinho após sucesso
- [ ] Deve exibir confirmação de pedido
- [ ] Deve redirecionar para página de acompanhamento

### 6. Tratamento de Erros
- [ ] Deve exibir erro se API estiver indisponível
- [ ] Deve validar campos obrigatórios
- [ ] Deve tratar erros de rede
- [ ] Deve manter dados do carrinho em caso de erro

### 7. Responsividade
- [ ] Deve funcionar corretamente em mobile
- [ ] Deve funcionar corretamente em tablet
- [ ] Deve funcionar corretamente em desktop

### 8. Performance
- [ ] Deve carregar em menos de 3 segundos
- [ ] Deve ter lazy loading de imagens
- [ ] Deve ter cache de dados do menu

## Dados de Teste

### Loja de Teste
- UUID: 02efe224-e368-4a7a-a153-5fc49cd9c5ac
- Nome: Empresa X
- Status: Aberto
- Horário: 00h00:00 - 23h59:00

### Produtos de Teste
- X-Bacon (ID: 1, Preço: R$ 30,00, Categoria: Lanches)
- Tags: picante, novo
- Status: Em destaque

### Cliente de Teste
- Nome: João Silva
- Telefone: (11) 99999-9999
- Email: joao@teste.com
- Endereço: Rua Teste, 123, Centro, São Paulo, SP

## Critérios de Aceitação

### Funcionalidade
- Todos os cenários de teste devem passar
- Não deve haver erros no console
- Todas as chamadas de API devem ser feitas corretamente

### Performance
- Tempo de carregamento inicial < 3s
- Tempo de resposta das ações < 1s
- Bundle size < 500KB

### Acessibilidade
- Deve ser navegável por teclado
- Deve ter textos alternativos em imagens
- Deve ter contraste adequado

### Compatibilidade
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers