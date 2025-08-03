'use client';

import { Product } from '@/domain/entities/Product';
import { ProductBadge } from './ProductBadge';
import { PriceDisplay } from './PriceDisplay';
import Image from 'next/image';

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
  // Verificar status do produto
  const isOnPromotion = product.promotional_price && 
    product.promotional_price > 0 && 
    product.promotional_price < product.price;
  const isFeatured = product.is_featured;
  const isPopular = product.is_popular;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg ${className}`}
      onClick={onClick}
      data-testid={`product-${product.id}`}
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