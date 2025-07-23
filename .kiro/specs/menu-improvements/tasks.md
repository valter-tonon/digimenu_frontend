# Plano de Implementação

## 1. Persistência do Carrinho

- [x] 1.1 Refatorar o store Zustand para melhorar a persistência
  - ✅ TTL (Time To Live) já implementado com 24 horas padrão
  - ✅ Storage personalizado com verificação de expiração implementado
  - ✅ Carrinho mantido entre sessões
  - _Requisitos: 1.1, 1.3, 1.4_

- [x] 1.2 Corrigir inconsistências entre os dois stores de carrinho
  - ✅ Consolidado `cart-store.ts` e `cart.ts` em uma única implementação
  - ✅ Todos os componentes migrados para usar o mesmo store (`cart-store.ts`)
  - ✅ Removido arquivo `cart.ts` duplicado
  - ✅ Componentes atualizados: CartModal, Header, ProductModal
  - **Importante**: Para testes, usar `./vendor/bin/sail exec frontend npm run build`
  - _Requisitos: 1.2, 1.5_

- [x] 1.3 Implementar testes para persistência do carrinho
  - ✅ Criados testes unitários para verificar TTL e recuperação
  - ✅ Testados cenários de expiração e limpeza automática
  - ✅ Validado comportamento de persistência e sincronização
  - ✅ Testes para rastreamento de usuário e conformidade com LGPD
  - **Importante**: Executar comandos de teste usando `./vendor/bin/sail npm test` ou `./vendor/bin/sail npm run build`
  - _Requisitos: 1.2, 1.3_

## 2. Implementação da Tela de Checkout

- [x] 2.1 Criar componentes base para o checkout
  - ✅ Página de carrinho já implementada em `src/app/[storeId]/[tableId]/cart/page.tsx`
  - ✅ Exibição de itens do pedido com quantidades e preços implementada
  - ✅ Funcionalidade para modificar quantidades e remover itens implementada
  - _Requisitos: 2.1, 2.2, 2.3, 2.4_

- [x] 2.2 Implementar checkout dedicado para delivery
  - ✅ Criada rota `/checkout` para fluxo de delivery
  - ✅ Implementado formulário completo para dados de entrega (nome, telefone, endereço)
  - ✅ Implementada seleção de forma de pagamento com radio buttons
  - ✅ Adicionado campo para troco quando "Dinheiro" for selecionado
  - ✅ Integração com autenticação e preenchimento automático de dados
  - ✅ Validações de formulário e feedback de erro
  - **Importante**: Para testes, usar `./vendor/bin/sail exec frontend npm run build`
  - _Requisitos: 2.1, 2.2, 2.3, 2.4_

- [x] 2.3 Implementar confirmação e finalização do pedido
  - ✅ Lógica para processar pedido já implementada
  - ✅ Feedback visual de sucesso/erro implementado
  - ✅ Limpeza do carrinho após pedido enviado
  - ✅ Redirecionamento para página de detalhes do pedido
  - _Requisitos: 2.5, 2.6_

## 3. Diferenciação entre Fluxos de Mesa e Delivery

- [x] 3.1 Implementar detecção automática do tipo de acesso
  - ✅ Toggle entre Local e Delivery já implementado na página do carrinho
  - ✅ Comportamento diferenciado baseado no modo de delivery
  - ✅ Verificação de autenticação para delivery implementada
  - _Requisitos: 2.1, 3.3_

- [x] 3.2 Implementar fluxo específico para mesas
  - ✅ Fluxo de mesa já implementado (envio direto para cozinha)
  - ✅ Integração com sistema de pedidos local
  - ✅ Redirecionamento para página de detalhes do pedido
  - _Requisitos: 2.1, 2.5_

- [x] 3.3 Implementar fluxo específico para delivery
  - ✅ Página de checkout dedicada para delivery criada
  - ✅ Campos para endereço de entrega detalhado implementados
  - ✅ Seleção de forma de pagamento implementada
  - ✅ Processo de pagamento completo integrado
  - ✅ Redirecionamento automático do carrinho para checkout quando em modo delivery
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

## 4. Rastreamento de Usuário

- [x] 4.1 Implementar sistema de cookies para identificação de usuários
  - ✅ Serviço completo de rastreamento implementado em `src/services/userTracking.ts`
  - ✅ Geração de ID único usando UUID para novos usuários
  - ✅ Reconhecimento de usuários recorrentes via cookies
  - ✅ Hook personalizado `useUserTracking` para integração com componentes
  - _Requisitos: 3.1, 3.2_

- [x] 4.2 Implementar captura de fonte de referência
  - ✅ Detecção automática de fonte do WhatsApp via referrer e UTM
  - ✅ Suporte para múltiplas fontes (Facebook, Instagram, Google, direto)
  - ✅ Armazenamento da informação de origem no perfil do usuário
  - _Requisitos: 3.3_

- [x] 4.3 Associar histórico de pedidos ao perfil do usuário
  - ✅ Integração com sistema de pedidos (carrinho e checkout)
  - ✅ Armazenamento do histórico de pedidos no localStorage
  - ✅ Associação automática de pedidos ao ID do usuário
  - ✅ Dados de rastreamento enviados junto com pedidos para o backend
  - _Requisitos: 3.4_

- [x] 4.4 Implementar conformidade com regulamentos de privacidade
  - ✅ Banner de consentimento de cookies implementado (`CookieConsentBanner`)
  - ✅ Mecanismo completo de opt-out com limpeza de dados
  - ✅ Conformidade com LGPD/GDPR
  - ✅ Integração com layout principal da aplicação
  - ✅ Opção de visualizar detalhes sobre uso de dados
  - _Requisitos: 3.5, 3.6_

## 5. Suporte a Múltiplos Layouts

- [x] 5.1 Criar sistema de temas/layouts configuráveis
  - ✅ Implementado `LayoutContext` para gerenciar layouts
  - ✅ Definidas interfaces completas para configuração de layouts
  - ✅ Sistema de variáveis CSS dinâmicas para temas
  - ✅ Persistência de preferências no localStorage
  - _Requisitos: 4.1, 4.2_

- [x] 5.2 Implementar layouts alternativos
  - ✅ Criado `DefaultLayout` (layout atual)
  - ✅ Criado `CompactLayout` para menus menores
  - ✅ Criado `ModernLayout` com design moderno
  - ✅ Criado `MinimalLayout` com design limpo
  - ✅ Criado `ClassicLayout` com elementos tradicionais
  - _Requisitos: 4.1, 4.2, 4.3_

- [x] 5.3 Implementar sistema de seleção de layout
  - ✅ Criada interface para escolher layout (`LayoutSelector`)
  - ✅ Implementada versão compacta para uso no menu
  - ✅ Implementada versão administrativa com mais opções
  - ✅ Integração com sistema de temas e persistência
  - ✅ Visualização prévia de cores e estilos
  - _Requisitos: 4.2, 4.4_

- [x] 5.4 Implementar pontos de extensão para personalização
  - ✅ Criado sistema de override para componentes específicos
  - ✅ Implementado `ThemeOverrideContext` para personalização por loja
  - ✅ Adicionado suporte para salvar configurações específicas por loja
  - ✅ Criado hook `withThemeOverride` para componentes personalizáveis
  - ✅ Integração com sistema de temas e layouts
  - _Requisitos: 4.5_

## 6. Melhorias de UI

- [x] 6.1 Redesenhar botão "Fazer Pedido"
  - ✅ Criado componente `FloatingCartButton` mais discreto e moderno
  - ✅ Implementada versão flutuante no canto inferior direito
  - ✅ Botão mostra contagem de itens e valor total
  - ✅ Integrado na página principal do menu
  - ✅ Responsivo e com animações suaves
  - _Requisitos: 5.1_

- [x] 6.2 Melhorar exibição de logos
  - ✅ Criados componentes `StoreHeader` e `CompactStoreHeader` otimizados
  - ✅ Implementado carregamento otimizado com Next.js Image
  - ✅ Fallback elegante para quando não há logo (gradiente com inicial)
  - ✅ Melhor qualidade com lazy loading e otimização automática
  - ✅ Posicionamento responsivo e consistente
  - ✅ Estados de loading e error handling
  - _Requisitos: 5.2_

- [x] 6.3 Melhorar navegação do cardápio
  - ✅ Adicionados botões de scroll horizontal para categorias
  - ✅ Implementada detecção automática de necessidade de scroll
  - ✅ Melhorada responsividade da navegação de categorias
  - ✅ Adicionadas animações suaves de scroll
  - ✅ Melhor acessibilidade com labels apropriados
  - _Requisitos: 5.3_

- [x] 6.4 Otimizar posicionamento de elementos
  - ✅ Criado sistema de z-index consistente (`src/styles/z-index.css`)
  - ✅ Aplicadas classes de posicionamento padronizadas
  - ✅ Melhoradas animações e transições de elementos flutuantes
  - ✅ Otimizado posicionamento de modais, botões e headers
  - ✅ Implementado backdrop-filter para melhor visual
  - _Requisitos: 5.4_

- [x] 6.5 Implementar melhorias baseadas no exemplo de referência
  - ✅ Analisado o cardápio de exemplo fornecido
  - ✅ Melhorado o botão de carrinho para mostrar "Carrinho Vazio" quando não há itens
  - ✅ Aprimorado o estilo das categorias com cores de fundo personalizadas
  - ✅ Adicionado efeito de seleção com anel colorido para categoria ativa
  - ✅ Implementado design responsivo para mobile e desktop
  - ✅ Mantida a identidade da marca com cores e estilos consistentes
  - _Requisitos: 5.5_

## 7. Testes e Validação

- [x] 7.1 Implementar testes unitários para novas funcionalidades
  - ✅ Testes completos para persistência do carrinho (TTL, recuperação, sincronização)
  - ✅ Testes para fluxos de checkout (validações, formas de pagamento, finalização)
  - ✅ Testes para rastreamento de usuário (identificação, fontes, opt-out, LGPD)
  - ✅ Testes para tratamento de erros e casos extremos
  - ✅ Cobertura de testes para componentes críticos
  - _Requisitos: 1.1, 2.1, 3.1_

- [x] 7.2 Implementar testes de integração
  - ✅ Testes completos para fluxo de mesa (pedido local)
  - ✅ Testes para fluxo de delivery com checkout
  - ✅ Testes para adaptação de layouts e temas
  - ✅ Testes para interações entre componentes
  - ✅ Testes para navegação entre páginas
  - _Requisitos: 2.1, 3.1, 4.1_

- [x] 7.3 Realizar testes de compatibilidade
  - ✅ Testes em diferentes navegadores
  - ✅ Testes em diferentes dispositivos
  - ✅ Testes de responsividade e layout
  - ✅ Testes com diferentes configurações de navegador
  - ✅ Documentação de procedimentos para testes contínuos
  - _Requisitos: 4.3, 5.4_