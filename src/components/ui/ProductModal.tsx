'use client';

import { useState } from 'react';
import { X, Plus, Minus, Star, Tag, TrendingUp } from 'lucide-react';
import { Product, Additional } from '@/domain/entities/Product';
import { ProductBadge } from './ProductBadge';
import { PriceDisplay } from './PriceDisplay';
import Image from 'next/image';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, additionals: Additional[], quantity: number) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedAdditionals, setSelectedAdditionals] = useState<Additional[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product || !isOpen) return null;

  // Preparar imagens do produto (imagem principal + adicionais se houver)
  const productImages = [
    product.image,
    ...(product.additional?.map(add => add.image).filter(Boolean) || [])
  ].filter(Boolean);

  const toggleAdditional = (additional: Additional) => {
    setSelectedAdditionals(prev => {
      const isSelected = prev.some(item => item.id === additional.id);
      if (isSelected) {
        return prev.filter(item => item.id !== additional.id);
      } else {
        return [...prev, additional];
      }
    });
  };

  const handleAddToCart = () => {
    onAddToCart(product, selectedAdditionals, quantity);
    onClose();
    // Resetar estado
    setSelectedAdditionals([]);
    setQuantity(1);
    setSelectedImageIndex(0);
  };

  const calculateTotalPrice = () => {
    const originalPrice = Number(product.price) || 0;
    const promotionalPrice = Number(product.promotional_price) || 0;
    
    const basePrice = promotionalPrice > 0 && promotionalPrice < originalPrice
      ? promotionalPrice
      : originalPrice;
    
    const additionalsPrice = selectedAdditionals.reduce((sum, add) => sum + (Number(add.price) || 0), 0);
    return (basePrice + additionalsPrice) * quantity;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-hidden">
          {/* Galeria de Imagens */}
          <div className="lg:w-1/2 p-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {productImages.length > 0 ? (
                <>
                  <Image
                    src={productImages[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Indicadores de imagem */}
                  {productImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {productImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {productImages.length > 1 && (
              <div className="flex space-x-2 mt-4 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      index === selectedImageIndex ? 'border-amber-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="lg:w-1/2 p-4 overflow-y-auto">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.is_featured && <ProductBadge type="featured" />}
              {product.is_popular && <ProductBadge type="popular" />}
                             {(() => {
                 const originalPrice = Number(product.price) || 0;
                 const promotionalPrice = Number(product.promotional_price) || 0;
                 return promotionalPrice > 0 && promotionalPrice < originalPrice;
               })() && <ProductBadge type="promotion" />}
            </div>

            {/* Descrição */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preço */}
            <div className="mb-6">
              <PriceDisplay product={product} className="text-2xl" />
            </div>

            {/* Adicionais */}
            {product.additional && product.additional.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Adicionais</h3>
                <div className="space-y-2">
                  {product.additional.map((additional) => (
                    <label
                      key={additional.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedAdditionals.some(item => item.id === additional.id)}
                          onChange={() => toggleAdditional(additional)}
                          className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{additional.name}</p>
                          {additional.description && (
                            <p className="text-sm text-gray-600">{additional.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        R$ {(Number(additional.price) || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantidade</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold text-gray-900 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-amber-600">
                  R$ {calculateTotalPrice().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Botão Adicionar ao Carrinho */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar ao Carrinho</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 