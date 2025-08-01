# Multi-Step Checkout Flow

Este diretório contém a implementação do fluxo de checkout em múltiplas etapas, seguindo os requisitos especificados no design document.

## Estrutura de Páginas

### 1. `/checkout/authentication` 
- **Propósito**: Decisão de autenticação do usuário
- **Opções**: Login, Registro, Continuar como visitante
- **Próxima etapa**: 
  - Se visitante → `/checkout/customer-data`
  - Se logado → `/checkout/address`

### 2. `/checkout/customer-data`
- **Propósito**: Coleta de dados pessoais para visitantes
- **Campos**: Nome, telefone, email (opcional)
- **Validação**: Tempo real com formatação automática
- **Próxima etapa**: `/checkout/address`

### 3. `/checkout/address`
- **Propósito**: Seleção/criação de endereço de entrega
- **Funcionalidades**: 
  - Integração com ViaCEP para autocompletar
  - Endereços salvos para usuários logados
  - Formulário para novos endereços
- **Próxima etapa**: `/checkout/payment`

### 4. `/checkout/payment`
- **Propósito**: Seleção de método de pagamento
- **Métodos**: PIX, Cartão de Crédito/Débito, Dinheiro, Vale Refeição
- **Validação**: Específica para cada método
- **Próxima etapa**: `/checkout/confirmation`

### 5. `/checkout/confirmation`
- **Propósito**: Revisão final e confirmação do pedido
- **Funcionalidades**: 
  - Resumo completo do pedido
  - Celebração com confetti ao confirmar
  - Redirecionamento para acompanhamento
- **Próxima etapa**: `/orders/[orderId]`

## Componentes Compartilhados

### CheckoutProgress
- Barra de progresso visual
- Indicadores de etapas completadas
- Responsivo (simplificado no mobile)

### CheckoutNavigation
- Navegação entre etapas
- Botões de voltar/avançar
- Estados de loading

### Layout
- Header consistente com navegação
- Botão para voltar ao menu sempre visível
- Footer com branding
- Cores seguindo padrão do menu (amber/gray)

## Características Técnicas

### Validação
- Validação em tempo real nos formulários
- Feedback visual para erros
- Prevenção de avanço com dados inválidos

### Persistência
- Dados salvos na sessão de checkout
- Recuperação automática ao voltar
- Limpeza ao finalizar pedido

### Responsividade
- Mobile-first design
- Touch targets adequados (44px mínimo)
- Layouts adaptáveis

### Acessibilidade
- ARIA labels apropriados
- Navegação por teclado
- Contraste adequado
- Foco visível

### Integração com Magic UI
- Confetti apenas na confirmação de sucesso
- Mantém estilo visual atual
- Melhorias funcionais sutis

## Fluxo de Dados

1. **Sessão de Checkout**: Gerenciada pelo `checkoutSessionService`
2. **Validação Progressiva**: Cada etapa valida antes de avançar
3. **Persistência**: Dados mantidos durante toda a sessão
4. **Integração**: APIs de CEP, pagamento e criação de pedido

## Tratamento de Erros

- Fallbacks para APIs indisponíveis
- Mensagens de erro amigáveis
- Opções de retry
- Redirecionamentos seguros

## Performance

- Lazy loading de componentes
- Otimização de imagens
- Bundle splitting por rota
- Core Web Vitals otimizados