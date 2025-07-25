'use client';

import { Product } from '@/domain/entities/Product';

interface PriceDisplayProps {
  product: Product;
  className?: string;
}

export function PriceDisplay({ product, className = '' }: PriceDisplayProps) {
  // Garantir que os preços sejam números válidos
  const originalPrice = Number(product.price) || 0;
  const promotionalPrice = Number(product.promotional_price) || 0;
  
  // Verificar se o produto está em promoção
  const isOnPromotion = promotionalPrice > 0 && promotionalPrice < originalPrice;
  
  const currentPrice = isOnPromotion ? promotionalPrice : originalPrice;

  // Calcular percentual de desconto
  const discountPercentage = isOnPromotion && originalPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

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
      
      {isOnPromotion && discountPercentage > 0 && (
        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
          -{discountPercentage}%
        </span>
      )}
    </div>
  );
} 