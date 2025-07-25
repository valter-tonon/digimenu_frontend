# Cardápio Digital Otimizado - Requisitos Adaptados

## 1. Problema e Contexto

### Cliente
- O usuário final é um cliente que utiliza o cardápio digital do restaurante para realizar pedidos para delivery ou mesa
- Características técnicas: acesso à internet, dispositivo móvel ou computadora com navegador web

### Problema
- O cardápio digital atual não tem um design intuitivo e atrativo, o que pode gerar confusão e frustração no usuário
- A navegação não é clara e fácil de usar, o que pode afetar a experiência do usuário e a taxa de conversão de pedidos

### Evidência do problema
- Dados de análise web que mostram uma alta taxa de abandono de pedidos e uma baixa taxa de conversão
- Comentários e queixas dos clientes sobre a dificuldade de usar o cardápio digital

### Proposta de valor única
- Um cardápio digital otimizado com design intuitivo e atrativo, que melhora a experiência do usuário e aumenta a taxa de conversão de pedidos

## 2. Objetivos e Métricas

### Objetivo principal
- Melhorar a experiência do usuário e aumentar a taxa de conversão de pedidos em 20% nos próximos 3 meses

### Métricas de entrada
- Tempo médio de navegação no cardápio digital reduzido em 30% nos próximos 2 meses
- Número de pedidos realizados através do cardápio digital aumentado em 15% nos próximos 2 meses
- Avaliação média de satisfação do usuário em uma escala de 1-5 aumentada em 1.5 nos próximos 2 meses

### Definição de "terminado"
- O desenvolvimento estará completo quando se tenha implementado um cardápio digital com design intuitivo e atrativo, que cumpra com os objetivos e métricas estabelecidos

## 3. Alcance Técnico

### Tipo de aplicação
- Aplicação web (Next.js)

### Arquitetura recomendada
- Arquitetura baseada em componentes React com gerenciamento de estado centralizado
- Separação clara entre apresentação, lógica de negócio e acesso a dados

### Limitaciones técnicas conhecidas
- A aplicação deve ser compatível com dispositivos móveis e computadoras com navegadores web

## 4. Stack Tecnológico Recomendado

- **Next.js 14** como framework de desenvolvimento web
- **TypeScript** como linguagem de programação
- **Zustand** como biblioteca de gerenciamento de estado
- **Tailwind CSS** como framework de CSS para estilizar a interface
- **shadcn/ui** como biblioteca de componentes de interface
- **React Query/TanStack Query** para gerenciamento de cache e estado do servidor

## 5. Modelos de Dados

### Entidades principais com atributos chave

#### Pedido (Order)
- ID
- Identificador único
- Data e hora de criação
- Tipo de pedido (delivery ou mesa)
- Estado do pedido (pending, preparing, ready, delivered, cancelled)
- Total do pedido
- Comentários
- Método de pagamento
- Troco
- Endereço de entrega (para delivery)
- Mesa (para pedidos de mesa)

#### Produto (Product)
- ID
- Nome
- Descrição
- Preço
- Preço promocional
- Imagem
- URL amigável
- Ativo/Inativo
- Destaque (is_featured)
- Popular (is_popular)
- Tags (array)
- Data início promoção
- Data fim promoção
- Método isOnPromotion() - verifica se está em promoção
- Método getCurrentPrice() - retorna preço atual (promocional ou normal)

#### Categoria (Category)
- ID
- Nome
- Descrição
- Imagem
- Ordem de exibição
- Ativo/Inativo

#### Cliente (Customer)
- ID
- Nome
- Email
- Telefone
- Endereços de entrega

#### Mesa (Table)
- ID
- Número da mesa
- Estado da mesa (available, occupied)
- QR Code

#### Tenant (Restaurante)
- ID
- UUID
- Nome
- URL
- Logo
- Horário de funcionamento
- Valor mínimo do pedido
- Taxa de entrega
- Tempo estimado de entrega

### Relações entre entidades
- Um pedido está relacionado com um cliente
- Um pedido está relacionado com uma mesa (se for pedido de mesa)
- Um produto está relacionado com categorias
- Um pedido tem múltiplos itens de pedido
- Um item de pedido está relacionado com um produto

### Regras de validação críticas
- Um pedido deve ter um cliente associado
- Um pedido deve ter um tipo (delivery ou mesa)
- Um pedido deve ter uma data e hora de criação
- Um pedido deve ter pelo menos um item

## 6. Requisitos Funcionais

### RF-01: Seleção de tipo de pedido
- O usuário pode selecionar o tipo de pedido (delivery ou mesa)
- O sistema mostra uma tela de seleção de tipo de pedido

### RF-02: Navegação por categorias
- O usuário pode navegar pelas categorias de produtos
- O sistema mostra uma lista de categorias com imagens e nomes
- O sistema exibe produtos em destaque no topo da página
- O sistema mostra produtos em promoção em seção especial

### RF-03: Visualização de produtos
- O usuário pode visualizar produtos de uma categoria
- O sistema mostra detalhes de cada produto (nome, descrição, preço, imagem)
- O sistema exibe etiquetas especiais (destaque, popular, promoção)
- O sistema mostra preços promocionais quando aplicável

### RF-04: Adicionar produtos ao carrinho
- O usuário pode adicionar produtos ao carrinho
- O sistema atualiza o carrinho com os produtos adicionados

### RF-05: Gerenciamento do carrinho
- O usuário pode visualizar, editar e remover itens do carrinho
- O sistema mostra o resumo do carrinho com total e quantidade de itens

### RF-06: Identificação do usuário
- O sistema identifica o usuário através do WhatsApp ou dados salvos
- O sistema mostra uma tela de identificação se necessário

### RF-07: Confirmação de dados do usuário
- O usuário pode confirmar seus dados (nome, email, telefone)
- O sistema atualiza os dados do usuário

### RF-08: Seleção de endereço de entrega (Delivery)
- O usuário pode selecionar um endereço de entrega
- O sistema mostra uma tela de seleção de endereço

### RF-09: Seleção de mesa (Mesa)
- O usuário pode selecionar uma mesa através do QR Code
- O sistema associa o pedido à mesa selecionada

### RF-10: Resumo do pedido
- O sistema mostra um resumo do pedido com produtos, total e informações de entrega
- O usuário pode editar o pedido antes de finalizar

### RF-11: Seleção de forma de pagamento
- O usuário pode selecionar uma forma de pagamento
- O sistema mostra opções disponíveis (dinheiro, cartão, PIX)

### RF-12: Finalização do pedido
- O usuário pode finalizar o pedido
- O sistema cria um novo pedido com todos os detalhes

### RF-13: Acompanhamento do pedido
- O usuário pode acompanhar o status do pedido
- O sistema mostra o status atual do pedido em tempo real

### RF-14: Histórico de pedidos
- O usuário pode ver um histórico de pedidos realizados
- O sistema mostra uma tela de histórico de pedidos

### RF-15: Conta atual (Mesa)
- O usuário pode ver a conta atual da mesa
- O sistema mostra todos os pedidos da mesa atual

### RF-16: Fechar conta (Mesa)
- O usuário pode fechar a conta da mesa
- O sistema finaliza todos os pedidos da mesa

### RF-17: Chamar garçom (Mesa)
- O usuário pode chamar o garçom
- O sistema envia notificação para o restaurante

## 7. Endpoints API / Interfaces

### Endpoints principais disponíveis

#### Restaurante/Tenant
- `GET /api/v1/tenant/{uuid}` - Obter dados do restaurante
- `GET /api/v1/tenants` - Listar restaurantes

#### Categorias
- `GET /api/v1/categories` - Listar categorias
- `GET /api/v1/categories/{uuid}` - Obter categoria específica

#### Produtos
- `GET /api/v1/products` - Listar produtos
- `GET /api/v1/products/{uuid}` - Obter produto específico

#### Menu completo
- `GET /api/v1/menu` - Obter menu completo com categorias e produtos

#### Mesas
- `GET /api/v1/tables` - Listar mesas
- `GET /api/v1/tables/{uuid}` - Obter mesa específica

#### Clientes
- `POST /api/v1/customers` - Criar/atualizar cliente

#### Pedidos
- `POST /api/v1/orders` - Criar novo pedido
- `GET /api/v1/orders/{identify}` - Obter pedido específico
- `GET /api/v1/orders/status` - Obter status dos pedidos
- `GET /api/v1/orders-kanban` - Obter pedidos do usuário (autenticado)
- `POST /api/v1/orders-kanban/{identify}/finish` - Finalizar pedido

#### Autenticação
- `POST /api/v1/sanctum/token` - Autenticar usuário
- `GET /api/v1/auth/me` - Obter dados do usuário autenticado
- `POST /api/v1/auth/logout` - Logout do usuário

#### Chamadas de garçom
- `POST /api/v1/waiter-calls` - Chamar garçom

#### Avaliações
- `POST /api/v1/orders-kanban/{orderId}/evaluations` - Avaliar pedido

### Estrutura de solicitação/resposta
- JSON

### Códigos de estado e tratamento de erros
- 200 OK: solicitação bem-sucedida
- 400 Bad Request: solicitação incorreta
- 401 Unauthorized: não autenticado
- 403 Forbidden: não autorizado
- 404 Not Found: recurso não encontrado
- 422 Unprocessable Entity: dados inválidos
- 500 Internal Server Error: erro interno do servidor

## 8. Fluxos de Usuário Principais

### Fluxo de delivery
1. Usuário acessa o cardápio via URL do restaurante
2. Sistema carrega dados do restaurante e menu
3. Usuário navega pelas categorias e produtos
4. Usuário adiciona produtos ao carrinho
5. Usuário visualiza e edita o carrinho
6. Sistema solicita identificação do usuário (WhatsApp)
7. Usuário confirma dados pessoais
8. Usuário seleciona endereço de entrega
9. Sistema mostra resumo do pedido
10. Usuário seleciona forma de pagamento
11. Usuário finaliza o pedido
12. Sistema confirma pedido e mostra código de acompanhamento

### Fluxo de mesa
1. Usuário escaneia QR Code da mesa
2. Sistema carrega dados do restaurante e menu
3. Usuário navega pelas categorias e produtos
4. Usuário adiciona produtos ao carrinho
5. Usuário visualiza e edita o carrinho
6. Usuário finaliza o pedido
7. Sistema associa pedido à mesa
8. Usuário pode acompanhar status do pedido
9. Usuário pode chamar garçom se necessário
10. Usuário pode ver conta atual da mesa
11. Usuário pode fechar conta quando desejar

## 9. Requisitos Não Funcionais

### Segurança
- Autenticação via WhatsApp
- Validação de dados de entrada
- Proteção contra CSRF

### Performance
- Tempo de resposta médio de 2 segundos
- Capacidade de lidar com 1000 solicitações por minuto
- Cache de dados do menu
- Lazy loading de imagens

### Escalabilidade
- A aplicação deve ser capaz de escalar horizontalmente
- Uso de CDN para imagens
- Otimização de bundle

### Manutenibilidade
- Código modular e bem documentado
- Componentes reutilizáveis
- Testes automatizados
- Padrões de código consistentes

### Acessibilidade
- Suporte a leitores de tela
- Navegação por teclado
- Contraste adequado
- Textos alternativos para imagens

## 10. Melhorias de UI/UX Propostas

### Design System
- Paleta de cores consistente
- Tipografia hierárquica
- Espaçamentos padronizados
- Componentes reutilizáveis

### Navegação
- Menu de categorias fixo no topo
- Seção de produtos em destaque no topo
- Seção de produtos em promoção destacada
- Breadcrumbs para navegação
- Botão de voltar sempre visível
- Indicadores de progresso

### Produtos
- Cards de produto com imagens grandes
- Informações claras (nome, preço, descrição)
- Etiquetas visuais (Destaque, Popular, Promoção)
- Exibição de preços promocionais com preço original riscado
- Botões de ação bem visíveis
- Estados de loading e erro

### Carrinho
- Botão flutuante sempre visível
- Badge com quantidade de itens
- Modal de resumo detalhado
- Opções de edição claras

### Checkout
- Formulários simplificados
- Validação em tempo real
- Confirmação antes de finalizar
- Feedback visual de sucesso/erro

### Responsividade
- Design mobile-first
- Adaptação para tablets
- Otimização para desktop
- Touch-friendly

## 11. Plan de Implementação

### Fase 1: Estrutura Base (1-2 semanas)
- Configuração do projeto Next.js
- Setup do Tailwind CSS e shadcn/ui
- Estrutura de pastas e componentes base
- Configuração do gerenciamento de estado

### Fase 2: Componentes Core (2-3 semanas)
- Header do restaurante
- Lista de categorias
- Lista de produtos
- Carrinho de compras
- Modal de resumo

### Fase 3: Fluxos de Pedido (2-3 semanas)
- Fluxo de delivery
- Fluxo de mesa
- Integração com APIs
- Validações e tratamento de erros

### Fase 4: Melhorias de UX (1-2 semanas)
- Animações e transições
- Estados de loading
- Feedback visual
- Otimizações de performance

### Fase 5: Testes e Refinamentos (1 semana)
- Testes de usabilidade
- Correções de bugs
- Otimizações finais
- Deploy e monitoramento

## 12. Endpoints Pendentes para Backend

### Autenticação WhatsApp
- `POST /api/v1/whatsapp/request-code` - Solicitar código via WhatsApp
- `POST /api/v1/whatsapp/verify-code` - Verificar código recebido

### Endereços de Entrega
- `GET /api/v1/customers/{id}/addresses` - Listar endereços do cliente
- `POST /api/v1/customers/{id}/addresses` - Adicionar endereço
- `PUT /api/v1/customers/{id}/addresses/{addressId}` - Atualizar endereço
- `DELETE /api/v1/customers/{id}/addresses/{addressId}` - Remover endereço

### Histórico de Pedidos
- `GET /api/v1/customers/{id}/orders` - Histórico de pedidos do cliente
- `GET /api/v1/tables/{id}/orders` - Pedidos de uma mesa específica

### Notificações em Tempo Real
- `GET /api/v1/orders/{id}/status` - Status atualizado do pedido
- WebSocket para atualizações em tempo real

### Configurações do Restaurante
- `GET /api/v1/tenants/{id}/settings` - Configurações específicas
- `GET /api/v1/tenants/{id}/payment-methods` - Métodos de pagamento aceitos
- `GET /api/v1/tenants/{id}/delivery-zones` - Zonas de entrega

### Avaliações e Feedback
- `GET /api/v1/products/{id}/reviews` - Avaliações de produtos
- `POST /api/v1/products/{id}/reviews` - Adicionar avaliação
- `GET /api/v1/orders/{id}/can-review` - Verificar se pode avaliar

### Busca e Filtros
- `GET /api/v1/products/search` - Buscar produtos
- `GET /api/v1/products/filters` - Filtros disponíveis
- `GET /api/v1/products/popular` - Produtos populares
- `GET /api/v1/products/featured` - Produtos em destaque 