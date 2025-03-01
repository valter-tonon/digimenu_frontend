'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    extras?: string[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative h-48 bg-gray-100">
          <Image
            src={imageError ? '/placeholder-food.jpg' : product.image}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            priority
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
          {product.extras && (
            <p className="text-sm text-gray-500 mb-2">{product.extras.join(', ')}</p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-green-600 font-medium">
              R$ {product.price.toFixed(2)}
            </span>
            <span className="text-sm text-orange-500 font-medium">Ver detalhes</span>
          </div>
        </div>
      </div>

      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 