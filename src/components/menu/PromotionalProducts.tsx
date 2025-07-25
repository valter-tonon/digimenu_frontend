'use client';

import { Product } from '@/domain/entities/Product';
import { ProductCard } from '@/components/ui/ProductCard';
import { Tag } from 'lucide-react';

interface PromotionalProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function PromotionalProducts({ products, onProductClick }: PromotionalProductsProps) {
  const promotionalProducts = products.filter(p => 
    p.promotional_price && 
    p.promotional_price > 0 && 
    p.promotional_price < p.price
  );
  
  if (promotionalProducts.length === 0) return null;
  
  return (
    <section className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 py-6">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Tag className="w-6 h-6 text-red-500 mr-2" />
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
                          className="cursor-pointer"
                        />
          ))}
        </div>
      </div>
    </section>
  );
} 