# Melhorias Visuais - Cardápio Digital

## Visão Geral

Este documento detalha as melhorias visuais específicas para o cardápio digital, focando em **apresentação e fluxo**, mantendo toda a funcionalidade existente. As melhorias incluem blocos de produtos em destaque/promoção e etiquetas visuais.

## Funcionalidades Backend Já Implementadas

### Produtos em Destaque
- Campo `is_featured` (boolean)
- Campo `is_popular` (boolean)
- Campo `tags` (array)

### Produtos em Promoção
- Campo `promotional_price` (decimal)
- Campo `promotion_starts_at` (datetime)
- Campo `promotion_ends_at` (datetime)
- Método `isOnPromotion()` - verifica se está em promoção atualmente
- Método `getCurrentPrice()` - retorna preço atual (promocional ou normal)

## Componentes a Serem Criados

### 1. FeaturedProducts.tsx
```typescript
// components/menu/FeaturedProducts.tsx
interface FeaturedProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function FeaturedProducts({ products, onProductClick }: FeaturedProductsProps) {
  const featuredProducts = products.filter(p => p.is_featured);
  
  if (featuredProducts.length === 0) return null;
  
  return (
    <section className="mb-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <StarIcon className="w-6 h-6 text-amber-500 mr-2" />
          Produtos em Destaque
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProducts.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={() => onProductClick(product)}
              showBadge={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 2. PromotionalProducts.tsx
```typescript
// components/menu/PromotionalProducts.tsx
interface PromotionalProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function PromotionalProducts({ products, onProductClick }: PromotionalProductsProps) {
  const promotionalProducts = products.filter(p => p.isOnPromotion());
  
  if (promotionalProducts.length === 0) return null;
  
  return (
    <section className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 py-6">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <TagIcon className="w-6 h-6 text-red-500 mr-2" />
          Promoções Especiais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotionalProducts.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={() => onProductClick(product)}
              showBadge={true}
              isPromotional={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 3. ProductBadge.tsx
```typescript
// components/ui/ProductBadge.tsx
interface ProductBadgeProps {
  type: 'featured' | 'popular' | 'promotion';
  className?: string;
}

export function ProductBadge({ type, className = '' }: ProductBadgeProps) {
  const badgeConfig = {
    featured: {
      text: 'Destaque',
      icon: StarIcon,
      colors: 'bg-amber-500 text-white'
    },
    popular: {
      text: 'Popular',
      icon: TrendingUpIcon,
      colors: 'bg-blue-500 text-white'
    },
    promotion: {
      text: 'Promoção',
      icon: TagIcon,
      colors: 'bg-red-500 text-white'
    }
  };

  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`absolute top-2 left-2 z-10 flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.colors} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </div>
  );
}
```

### 4. PriceDisplay.tsx
```typescript
// components/ui/PriceDisplay.tsx
interface PriceDisplayProps {
  product: Product;
  className?: string;
}

export function PriceDisplay({ product, className = '' }: PriceDisplayProps) {
  const isOnPromotion = product.isOnPromotion();
  const currentPrice = product.getCurrentPrice();
  const originalPrice = product.price;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg font-bold text-gray-900">
        R$ {currentPrice.toFixed(2).replace('.', ',')}
      </span>
      
      {isOnPromotion && originalPrice > currentPrice && (
        <span className="text-sm text-gray-500 line-through">
          R$ {originalPrice.toFixed(2).replace('.', ',')}
        </span>
      )}
      
      {isOnPromotion && (
        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
          -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
        </span>
      )}
    </div>
  );
}
```

### 5. ProductCard.tsx (Redesenhado)
```typescript
// components/ui/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  onClick: () => void;
  showBadge?: boolean;
  isPromotional?: boolean;
  className?: string;
}

export function ProductCard({ 
  product, 
  onClick, 
  showBadge = false, 
  isPromotional = false,
  className = '' 
}: ProductCardProps) {
  const isOnPromotion = product.isOnPromotion();
  const isFeatured = product.is_featured;
  const isPopular = product.is_popular;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg ${className}`}
      onClick={onClick}
    >
      <div className="relative">
        {/* Imagem do produto */}
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={product.image || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Etiquetas */}
        {showBadge && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isFeatured && <ProductBadge type="featured" />}
            {isPopular && <ProductBadge type="popular" />}
            {isOnPromotion && <ProductBadge type="promotion" />}
          </div>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Informações do produto */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <PriceDisplay product={product} />
      </div>
    </div>
  );
}
```

## Melhorias na Página Principal do Menu

### Estrutura Proposta para menu/page.tsx
```typescript
// app/menu/page.tsx (estrutura melhorada)
export default function MenuPage() {
  // ... estados e hooks existentes ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do restaurante */}
      <StoreHeader tenantData={tenantData} />
      
      {/* Produtos em Destaque */}
      <FeaturedProducts 
        products={products} 
        onProductClick={openProductDetails} 
      />
      
      {/* Produtos em Promoção */}
      <PromotionalProducts 
        products={products} 
        onProductClick={openProductDetails} 
      />
      
      {/* Navegação por categorias */}
      <CategoryList 
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />
      
      {/* Lista de produtos da categoria selecionada */}
      <ProductList 
        products={filteredProducts}
        selectedCategoryId={selectedCategoryId}
        onCartItemsChange={handleCartItemsChange}
        searchTerm={searchTerm}
      />
      
      {/* Carrinho flutuante */}
      <FloatingCartButton 
        itemCount={cartItemsCount}
        onClick={openOrderSummary}
      />
      
      {/* Modal de resumo do pedido */}
      {showOrderSummary && (
        <OrderSummary 
          onClose={closeOrderSummary}
          onFinishOrder={finishOrder}
        />
      )}
    </div>
  );
}
```

## Melhorias Visuais Específicas

### 1. Cores e Temas
```css
/* globals.css - Adicionar variáveis de cor */
:root {
  --color-primary: #f59e0b; /* Amber */
  --color-secondary: #3b82f6; /* Blue */
  --color-accent: #ef4444; /* Red */
  --color-success: #10b981; /* Green */
  --color-warning: #f97316; /* Orange */
  
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-accent: #fef3c7;
}
```

### 2. Animações e Transições
```css
/* Animações para cards de produto */
.product-card {
  transition: all 0.2s ease-in-out;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Animação para badges */
.product-badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

### 3. Responsividade
```typescript
// Breakpoints para diferentes tamanhos de tela
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Grid responsivo para produtos
const gridConfig = {
  mobile: 'grid-cols-1',
  tablet: 'md:grid-cols-2',
  desktop: 'lg:grid-cols-3',
  wide: 'xl:grid-cols-4',
};
```

## Implementação Gradual

### Fase 1: Componentes Base (Semana 1)
- [ ] Criar `ProductBadge.tsx`
- [ ] Criar `PriceDisplay.tsx`
- [ ] Redesenhar `ProductCard.tsx`
- [ ] Testar componentes isoladamente

### Fase 2: Seções Especiais (Semana 2)
- [ ] Criar `FeaturedProducts.tsx`
- [ ] Criar `PromotionalProducts.tsx`
- [ ] Integrar na página principal
- [ ] Ajustar responsividade

### Fase 3: Refinamentos (Semana 3)
- [ ] Adicionar animações
- [ ] Otimizar performance
- [ ] Testar em diferentes dispositivos
- [ ] Ajustar acessibilidade

## Considerações Técnicas

### Performance
- Lazy loading de imagens
- Otimização de imagens com Next.js Image
- Virtualização para listas grandes
- Cache de dados de produtos

### Acessibilidade
- Textos alternativos para imagens
- Contraste adequado para etiquetas
- Navegação por teclado
- Screen reader friendly

### SEO
- Meta tags dinâmicas
- Structured data para produtos
- URLs amigáveis
- Sitemap atualizado

## Métricas de Sucesso Visual

### Engajamento
- Tempo de permanência na página
- Taxa de cliques em produtos em destaque
- Conversão de produtos promocionais
- Scroll depth

### Performance Visual
- Tempo de carregamento de imagens
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

### Usabilidade
- Taxa de conversão geral
- Abandono de carrinho
- Navegação entre categorias
- Satisfação do usuário 