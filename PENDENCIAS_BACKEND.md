# Pendências do Backend - Cardápio Digital Otimizado

## Endpoints Necessários para Implementar os Novos Requisitos

### 1. Autenticação WhatsApp
**Status**: ❌ Não implementado

#### Endpoints necessários:
- `POST /api/v1/whatsapp/request-code`
  - **Payload**: `{ phone: string, tenant_id: string }`
  - **Response**: `{ success: boolean, message: string }`
  - **Descrição**: Solicita código de verificação via WhatsApp

- `POST /api/v1/whatsapp/verify-code`
  - **Payload**: `{ phone: string, code: string, tenant_id: string, device_name: string }`
  - **Response**: `{ success: boolean, token: string, user: Customer }`
  - **Descrição**: Verifica código recebido e retorna token de autenticação

### 2. Gerenciamento de Endereços
**Status**: ❌ Não implementado

#### Endpoints necessários:
- `GET /api/v1/customers/{id}/addresses`
  - **Response**: `{ addresses: DeliveryAddress[] }`
  - **Descrição**: Lista endereços de entrega do cliente

- `POST /api/v1/customers/{id}/addresses`
  - **Payload**: `{ street: string, number: string, complement?: string, neighborhood: string, city: string, state: string, zip_code: string, is_default?: boolean }`
  - **Response**: `{ success: boolean, address: DeliveryAddress }`
  - **Descrição**: Adiciona novo endereço de entrega

- `PUT /api/v1/customers/{id}/addresses/{addressId}`
  - **Payload**: `{ street: string, number: string, complement?: string, neighborhood: string, city: string, state: string, zip_code: string, is_default?: boolean }`
  - **Response**: `{ success: boolean, address: DeliveryAddress }`
  - **Descrição**: Atualiza endereço existente

- `DELETE /api/v1/customers/{id}/addresses/{addressId}`
  - **Response**: `{ success: boolean }`
  - **Descrição**: Remove endereço de entrega

### 3. Histórico de Pedidos
**Status**: ⚠️ Parcialmente implementado

#### Endpoints necessários:
- `GET /api/v1/customers/{id}/orders`
  - **Query params**: `{ page?: number, limit?: number, status?: string }`
  - **Response**: `{ orders: Order[], pagination: PaginationMeta }`
  - **Descrição**: Histórico completo de pedidos do cliente

- `GET /api/v1/tables/{id}/orders`
  - **Query params**: `{ status?: string, date?: string }`
  - **Response**: `{ orders: Order[], total: number }`
  - **Descrição**: Todos os pedidos de uma mesa específica

### 4. Configurações do Restaurante
**Status**: ❌ Não implementado

#### Endpoints necessários:
- `GET /api/v1/tenants/{id}/settings`
  - **Response**: `{ settings: TenantSettings }`
  - **Descrição**: Configurações específicas do restaurante

- `GET /api/v1/tenants/{id}/payment-methods`
  - **Response**: `{ payment_methods: PaymentMethod[] }`
  - **Descrição**: Métodos de pagamento aceitos pelo restaurante

- `GET /api/v1/tenants/{id}/delivery-zones`
  - **Response**: `{ delivery_zones: DeliveryZone[] }`
  - **Descrição**: Zonas de entrega e taxas

### 5. Busca e Filtros Avançados
**Status**: ⚠️ Parcialmente implementado (campos existem, endpoints específicos não)

#### Endpoints necessários:
- `GET /api/v1/products/search`
  - **Query params**: `{ q: string, category_id?: number, min_price?: number, max_price?: number, is_featured?: boolean, is_popular?: boolean }`
  - **Response**: `{ products: Product[], total: number }`
  - **Descrição**: Busca produtos com filtros avançados

- `GET /api/v1/products/popular`
  - **Query params**: `{ limit?: number }`
  - **Response**: `{ products: Product[] }`
  - **Descrição**: Produtos mais populares (filtrar por is_popular=true)

- `GET /api/v1/products/featured`
  - **Query params**: `{ limit?: number }`
  - **Response**: `{ products: Product[] }`
  - **Descrição**: Produtos em destaque (filtrar por is_featured=true)

- `GET /api/v1/products/promotional`
  - **Query params**: `{ limit?: number }`
  - **Response**: `{ products: Product[] }`
  - **Descrição**: Produtos em promoção (filtrar por isOnPromotion()=true)

### 6. Avaliações e Feedback
**Status**: ⚠️ Parcialmente implementado (apenas para pedidos)

#### Endpoints necessários:
- `GET /api/v1/products/{id}/reviews`
  - **Query params**: `{ page?: number, limit?: number }`
  - **Response**: `{ reviews: ProductReview[], pagination: PaginationMeta }`
  - **Descrição**: Avaliações de um produto específico

- `POST /api/v1/products/{id}/reviews`
  - **Payload**: `{ rating: number, comment?: string }`
  - **Response**: `{ success: boolean, review: ProductReview }`
  - **Descrição**: Adiciona avaliação a um produto

- `GET /api/v1/orders/{id}/can-review`
  - **Response**: `{ can_review: boolean, reason?: string }`
  - **Descrição**: Verifica se o pedido pode ser avaliado

### 7. Notificações em Tempo Real
**Status**: ❌ Não implementado

#### Endpoints necessários:
- `GET /api/v1/orders/{id}/status`
  - **Response**: `{ status: string, updated_at: string, estimated_time?: string }`
  - **Descrição**: Status atualizado do pedido

- WebSocket endpoint para atualizações em tempo real
  - **Channel**: `orders.{orderId}`
  - **Events**: `status_updated`, `new_order`, `order_ready`

### 8. Melhorias nos Endpoints Existentes

#### Pedidos
- Adicionar campo `estimated_delivery_time` no response de pedidos
- Adicionar campo `delivery_address` no response de pedidos de delivery
- Adicionar campo `table_number` no response de pedidos de mesa

#### Produtos
- Adicionar campo `is_on_promotion` no response (já existe método isOnPromotion())
- Adicionar campo `current_price` no response (já existe método getCurrentPrice())
- Adicionar campo `average_rating` no response
- Garantir que campos `is_featured`, `is_popular`, `tags` estejam no response

#### Categorias
- Adicionar campo `product_count` no response
- Adicionar campo `order` para ordenação

## Modelos de Dados Necessários

### 1. DeliveryAddress
```php
class DeliveryAddress extends Model
{
    protected $fillable = [
        'customer_id',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'zip_code',
        'is_default',
        'label' // Casa, Trabalho, etc.
    ];
}
```

### 2. ProductReview
```php
class ProductReview extends Model
{
    protected $fillable = [
        'product_id',
        'customer_id',
        'order_id',
        'rating',
        'comment',
        'is_approved'
    ];
}
```

### 3. DeliveryZone
```php
class DeliveryZone extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'delivery_fee',
        'min_order_value',
        'estimated_time',
        'is_active'
    ];
}
```

### 4. PaymentMethod
```php
class PaymentMethod extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'type', // cash, card, pix, etc.
        'is_active',
        'requires_change',
        'icon'
    ];
}
```

## Prioridades de Implementação

### Alta Prioridade (Semana 1-2)
1. Autenticação WhatsApp
2. Gerenciamento de endereços
3. Histórico de pedidos por cliente
4. Melhorias nos endpoints existentes

### Média Prioridade (Semana 3-4)
1. Configurações do restaurante
2. Busca e filtros avançados
3. Avaliações de produtos
4. Notificações em tempo real

### Baixa Prioridade (Semana 5-6)
1. Métricas e analytics
2. Relatórios avançados
3. Integrações externas

## Considerações Técnicas

### Performance
- Implementar cache para dados do menu
- Otimizar queries com eager loading
- Implementar paginação em todas as listas

### Segurança
- Validar permissões de acesso aos dados
- Implementar rate limiting
- Sanitizar inputs de busca

### Escalabilidade
- Considerar uso de Redis para cache
- Implementar filas para processamento assíncrono
- Otimizar uploads de imagens 