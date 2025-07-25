'use client';

import { Product } from '@/domain/entities/Product';
import { ProductCard } from '@/components/ui/ProductCard';
import { Star } from 'lucide-react';

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
          <Star className="w-6 h-6 text-amber-500 mr-2" />
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