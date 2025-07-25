# Plano de Implementação Frontend - Cardápio Digital Otimizado

## Visão Geral

Este documento detalha o plano de implementação para otimizar o cardápio digital existente, seguindo os requisitos adaptados do prompt original. O foco será em melhorar a experiência do usuário, aumentar a taxa de conversão e implementar funcionalidades avançadas.

## Estrutura Atual vs. Estrutura Proposta

### Estrutura Atual
```
frontend/src/
├── app/
│   ├── [storeId]/          # Página inicial do restaurante
│   ├── menu/               # Página do cardápio
│   └── checkout/           # Página de checkout
├── components/
│   ├── menu/               # Componentes do cardápio
│   └── ui/                 # Componentes de UI
├── services/
│   └── api.ts              # Serviços de API
└── store/
    └── cart-store.ts       # Gerenciamento do carrinho
```

### Estrutura Proposta
```
frontend/src/
├── app/
│   ├── [storeId]/          # Página inicial do restaurante
│   ├── menu/               # Página do cardápio otimizada
│   ├── checkout/           # Página de checkout melhorada
│   ├── auth/               # Autenticação WhatsApp
│   ├── profile/            # Perfil do usuário
│   ├── orders/             # Histórico de pedidos
│   └── table/              # Gerenciamento de mesa
├── components/
│   ├── menu/               # Componentes do cardápio
│   ├── checkout/           # Componentes de checkout
│   ├── auth/               # Componentes de autenticação
│   ├── profile/            # Componentes de perfil
│   ├── orders/             # Componentes de pedidos
│   └── ui/                 # Componentes de UI melhorados
├── hooks/
│   ├── useAuth.ts          # Hook de autenticação
│   ├── useCart.ts          # Hook do carrinho
│   ├── useOrders.ts        # Hook de pedidos
│   └── useProfile.ts       # Hook de perfil
├── services/
│   ├── api.ts              # Serviços de API
│   ├── auth.ts             # Serviços de autenticação
│   ├── orders.ts           # Serviços de pedidos
│   └── profile.ts          # Serviços de perfil
├── store/
│   ├── auth-store.ts       # Estado de autenticação
│   ├── cart-store.ts       # Estado do carrinho
│   ├── orders-store.ts     # Estado de pedidos
│   └── profile-store.ts    # Estado do perfil
└── types/
    ├── auth.ts             # Tipos de autenticação
    ├── orders.ts           # Tipos de pedidos
    ├── profile.ts          # Tipos de perfil
    └── api.ts              # Tipos de API
```

## Fases de Implementação

### Fase 1: Estrutura Base e Autenticação (Semana 1-2)

#### 1.1 Configuração do Projeto
- [ ] Atualizar dependências do Next.js para versão 14
- [ ] Configurar Tailwind CSS com tema personalizado
- [ ] Instalar e configurar shadcn/ui
- [ ] Configurar TypeScript com tipos estritos
- [ ] Configurar ESLint e Prettier

#### 1.2 Sistema de Autenticação WhatsApp
- [ ] Criar página de autenticação (`/auth`)
- [ ] Implementar componente de solicitação de código
- [ ] Implementar componente de verificação de código
- [ ] Criar hook `useAuth` para gerenciar estado de autenticação
- [ ] Implementar store de autenticação com Zustand
- [ ] Adicionar middleware de proteção de rotas

#### 1.3 Tipos e Interfaces
- [ ] Definir tipos para autenticação
- [ ] Definir tipos para usuário/cliente
- [ ] Definir tipos para endereços de entrega
- [ ] Atualizar tipos existentes conforme necessário

### Fase 2: Componentes Core Melhorados (Semana 2-3)

#### 2.1 Header do Restaurante
- [ ] Redesenhar componente `StoreHeader`
- [ ] Adicionar informações de horário de funcionamento
- [ ] Implementar indicador de status (aberto/fechado)
- [ ] Adicionar botão de perfil do usuário
- [ ] Implementar navegação responsiva

#### 2.2 Navegação por Categorias
- [ ] Redesenhar componente `CategoryList`
- [ ] Implementar scroll horizontal em mobile
- [ ] Adicionar indicador de categoria ativa
- [ ] Implementar animações de transição
- [ ] Adicionar contador de produtos por categoria
- [ ] Criar seção de produtos em destaque no topo
- [ ] Criar seção de produtos em promoção destacada

#### 2.3 Lista de Produtos
- [ ] Redesenhar componente `ProductList`
- [ ] Implementar grid responsivo
- [ ] Adicionar cards de produto com imagens otimizadas
- [ ] Implementar lazy loading de imagens
- [ ] Adicionar etiquetas visuais (Destaque, Popular, Promoção)
- [ ] Implementar exibição de preços promocionais com preço original riscado
- [ ] Adicionar indicadores de promoção
- [ ] Implementar busca e filtros

#### 2.4 Carrinho de Compras
- [ ] Redesenhar componente `OrderSummary`
- [ ] Implementar botão flutuante sempre visível
- [ ] Adicionar badge com quantidade de itens
- [ ] Implementar modal de resumo detalhado
- [ ] Adicionar opções de edição de quantidade
- [ ] Implementar cálculo de taxas e total

### Fase 3: Fluxos de Pedido Otimizados (Semana 3-4)

#### 3.1 Fluxo de Delivery
- [ ] Criar página de seleção de endereço
- [ ] Implementar componente de gerenciamento de endereços
- [ ] Adicionar validação de endereço
- [ ] Implementar cálculo de taxa de entrega
- [ ] Criar página de resumo do pedido
- [ ] Implementar seleção de forma de pagamento

#### 3.2 Fluxo de Mesa
- [ ] Melhorar página de mesa
- [ ] Implementar QR Code scanner
- [ ] Adicionar gerenciamento de conta da mesa
- [ ] Implementar chamada de garçom
- [ ] Adicionar histórico de pedidos da mesa

#### 3.3 Checkout Melhorado
- [ ] Redesenhar página de checkout
- [ ] Implementar validação em tempo real
- [ ] Adicionar confirmação antes de finalizar
- [ ] Implementar feedback visual de sucesso/erro
- [ ] Adicionar opções de pagamento

### Fase 4: Funcionalidades Avançadas (Semana 4-5)

#### 4.1 Perfil do Usuário
- [ ] Criar página de perfil (`/profile`)
- [ ] Implementar edição de dados pessoais
- [ ] Adicionar gerenciamento de endereços
- [ ] Implementar preferências de pedido
- [ ] Adicionar histórico de pedidos

#### 4.2 Histórico de Pedidos
- [ ] Criar página de histórico (`/orders`)
- [ ] Implementar lista de pedidos com paginação
- [ ] Adicionar detalhes de cada pedido
- [ ] Implementar repetir pedido
- [ ] Adicionar avaliação de pedidos

#### 4.3 Busca e Filtros
- [ ] Implementar barra de busca global
- [ ] Adicionar filtros por categoria, preço, popularidade
- [ ] Implementar busca por nome de produto
- [ ] Adicionar produtos em destaque
- [ ] Implementar produtos populares

#### 4.4 Notificações em Tempo Real
- [ ] Implementar WebSocket para atualizações
- [ ] Adicionar notificações de status do pedido
- [ ] Implementar notificações push
- [ ] Adicionar indicadores visuais de atualização

### Fase 5: Otimizações e Melhorias (Semana 5-6)

#### 5.1 Performance
- [ ] Implementar cache de dados com React Query
- [ ] Otimizar carregamento de imagens
- [ ] Implementar code splitting
- [ ] Adicionar service worker para cache offline
- [ ] Otimizar bundle size

#### 5.2 Acessibilidade
- [ ] Adicionar suporte a leitores de tela
- [ ] Implementar navegação por teclado
- [ ] Melhorar contraste de cores
- [ ] Adicionar textos alternativos
- [ ] Implementar foco visível

#### 5.3 Animações e Transições
- [ ] Adicionar animações de entrada
- [ ] Implementar transições suaves
- [ ] Adicionar micro-interações
- [ ] Implementar loading states
- [ ] Adicionar feedback visual

#### 5.4 Testes
- [ ] Implementar testes unitários
- [ ] Adicionar testes de integração
- [ ] Implementar testes E2E com Playwright
- [ ] Adicionar testes de acessibilidade
- [ ] Implementar testes de performance

## Componentes Principais a Serem Criados/Modificados

### Novos Componentes

#### Autenticação
```typescript
// components/auth/WhatsAppAuth.tsx
// components/auth/CodeVerification.tsx
// components/auth/AuthProvider.tsx
```

#### Perfil
```typescript
// components/profile/ProfileForm.tsx
// components/profile/AddressManager.tsx
// components/profile/OrderHistory.tsx
```

#### Pedidos
```typescript
// components/orders/OrderList.tsx
// components/orders/OrderDetails.tsx
// components/orders/OrderStatus.tsx
```

#### Checkout
```typescript
// components/checkout/DeliveryForm.tsx
// components/checkout/PaymentSelector.tsx
// components/checkout/OrderSummary.tsx
```

### Componentes Modificados

#### Menu
```typescript
// components/menu/StoreHeader.tsx - Redesenhado
// components/menu/CategoryList.tsx - Melhorado
// components/menu/ProductList.tsx - Otimizado
// components/menu/OrderSummary.tsx - Expandido
// components/menu/FeaturedProducts.tsx - Novo
// components/menu/PromotionalProducts.tsx - Novo
```

#### UI
```typescript
// components/ui/FloatingCartButton.tsx - Novo
// components/ui/SearchBar.tsx - Novo
// components/ui/ProductCard.tsx - Redesenhado
// components/ui/ProductBadge.tsx - Novo (etiquetas)
// components/ui/PriceDisplay.tsx - Novo (preços promocionais)
// components/ui/LoadingSpinner.tsx - Melhorado
```

## Hooks Personalizados

### Autenticação
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  // Gerenciar estado de autenticação
  // Solicitar código WhatsApp
  // Verificar código
  // Gerenciar token
  // Logout
};
```

### Carrinho
```typescript
// hooks/useCart.ts
export const useCart = () => {
  // Adicionar produto
  // Remover produto
  // Atualizar quantidade
  // Calcular total
  // Limpar carrinho
};
```

### Pedidos
```typescript
// hooks/useOrders.ts
export const useOrders = () => {
  // Criar pedido
  // Buscar pedidos
  // Atualizar status
  // Repetir pedido
};
```

### Perfil
```typescript
// hooks/useProfile.ts
export const useProfile = () => {
  // Buscar dados do usuário
  // Atualizar dados
  // Gerenciar endereços
  // Buscar histórico
};
```

## Stores (Zustand)

### Auth Store
```typescript
// store/auth-store.ts
interface AuthState {
  user: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (token: string, user: Customer) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}
```

### Profile Store
```typescript
// store/profile-store.ts
interface ProfileState {
  addresses: DeliveryAddress[];
  orders: Order[];
  preferences: UserPreferences;
  
  setAddresses: (addresses: DeliveryAddress[]) => void;
  addAddress: (address: DeliveryAddress) => void;
  updateAddress: (id: number, address: DeliveryAddress) => void;
  removeAddress: (id: number) => void;
}
```

### Orders Store
```typescript
// store/orders-store.ts
interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Order) => void;
  setCurrentOrder: (order: Order | null) => void;
}
```

## Serviços de API

### Auth Service
```typescript
// services/auth.ts
export const authService = {
  requestCode: (phone: string, tenantId: string) => Promise<ApiResponse>,
  verifyCode: (phone: string, code: string, tenantId: string) => Promise<AuthResponse>,
  getMe: () => Promise<Customer>,
  logout: () => Promise<void>,
};
```

### Profile Service
```typescript
// services/profile.ts
export const profileService = {
  getAddresses: (customerId: number) => Promise<DeliveryAddress[]>,
  addAddress: (customerId: number, address: CreateAddressRequest) => Promise<DeliveryAddress>,
  updateAddress: (customerId: number, addressId: number, address: UpdateAddressRequest) => Promise<DeliveryAddress>,
  removeAddress: (customerId: number, addressId: number) => Promise<void>,
  getOrders: (customerId: number, params?: GetOrdersParams) => Promise<PaginatedOrders>,
};
```

### Orders Service
```typescript
// services/orders.ts
export const ordersService = {
  createOrder: (orderData: CreateOrderRequest) => Promise<Order>,
  getOrder: (orderId: string) => Promise<Order>,
  getOrderStatus: (orderId: string) => Promise<OrderStatus>,
  getTableOrders: (tableId: string) => Promise<Order[]>,
  callWaiter: (tableId: string, message?: string) => Promise<void>,
};
```

## Considerações de Design

### Design System
- **Cores**: Paleta consistente baseada na identidade do restaurante
- **Tipografia**: Hierarquia clara com fontes legíveis
- **Espaçamentos**: Sistema de espaçamento consistente
- **Componentes**: Biblioteca de componentes reutilizáveis

### Responsividade
- **Mobile-first**: Design otimizado para dispositivos móveis
- **Tablet**: Adaptação para tablets
- **Desktop**: Otimização para telas maiores
- **Touch-friendly**: Elementos com tamanho adequado para toque

### Acessibilidade
- **Contraste**: Relação de contraste adequada
- **Navegação**: Suporte a navegação por teclado
- **Screen readers**: Textos alternativos e labels
- **Foco**: Indicadores visuais de foco

## Métricas de Sucesso

### Performance
- Tempo de carregamento inicial < 3 segundos
- Tempo de carregamento de imagens < 1 segundo
- Score Lighthouse > 90
- Bundle size < 500KB

### Usabilidade
- Taxa de conversão > 15%
- Tempo médio de navegação < 2 minutos
- Taxa de abandono < 30%
- Avaliação de satisfação > 4.0/5.0

### Técnicas
- Cobertura de testes > 80%
- Zero erros críticos em produção
- Uptime > 99.9%
- Tempo de resposta da API < 500ms

## Cronograma Detalhado

### Semana 1
- **Dias 1-2**: Configuração do projeto e dependências
- **Dias 3-4**: Sistema de autenticação WhatsApp
- **Dia 5**: Tipos e interfaces

### Semana 2
- **Dias 1-2**: Componentes core (Header, Categorias)
- **Dias 3-4**: Lista de produtos e carrinho
- **Dia 5**: Testes e refinamentos

### Semana 3
- **Dias 1-2**: Fluxo de delivery
- **Dias 3-4**: Fluxo de mesa
- **Dia 5**: Checkout melhorado

### Semana 4
- **Dias 1-2**: Perfil do usuário
- **Dias 3-4**: Histórico de pedidos
- **Dia 5**: Busca e filtros

### Semana 5
- **Dias 1-2**: Notificações em tempo real
- **Dias 3-4**: Otimizações de performance
- **Dia 5**: Acessibilidade

### Semana 6
- **Dias 1-2**: Animações e transições
- **Dias 3-4**: Testes completos
- **Dia 5**: Deploy e monitoramento

## Próximos Passos

1. **Revisar e aprovar** este plano de implementação
2. **Configurar ambiente** de desenvolvimento
3. **Iniciar Fase 1** com configuração do projeto
4. **Implementar autenticação** WhatsApp
5. **Desenvolver componentes** core melhorados
6. **Testar e iterar** continuamente
7. **Deploy incremental** por fases
8. **Monitorar métricas** de sucesso 