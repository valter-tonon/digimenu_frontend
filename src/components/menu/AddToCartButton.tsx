'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'react-hot-toast';
import { useStoreStatus } from '@/infrastructure/context/StoreStatusContext';

interface Product {
  id: number;
  uuid: string;
  name: string;
  price: number;
  original_price?: number;
  image?: string;
}

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  onAddedToCart?: () => void;
}

export function AddToCartButton({ product, className = '', onAddedToCart }: AddToCartButtonProps) {
  const { isStoreOpen } = useStoreStatus();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCartStore();

  // Determina o preço correto a ser usado
  const getEffectivePrice = () => {
    // Se o preço for zero e existir um preço original, use o preço original
    if (product.price === 0 && product.original_price && product.original_price > 0) {
      return product.original_price;
    }
    return product.price;
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (!isStoreOpen) {
      toast.error('Restaurante fechado. Não é possível adicionar itens ao carrinho no momento.');
      return;
    }

    setIsAdding(true);
    
    try {
      const effectivePrice = getEffectivePrice();
      
      addItem({
        productId: product.id,
        identify: product.uuid,
        name: product.name,
        price: effectivePrice,
        quantity,
        image: product.image
      });
      
      toast.success(`${product.name} adicionado ao carrinho`);
      
      if (onAddedToCart) {
        onAddedToCart();
      }
      
      // Reset quantity after adding
      setQuantity(1);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Não foi possível adicionar ao carrinho');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center mr-2">
        <button
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleQuantityChange(-1)}
          disabled={!isStoreOpen}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 h-8 flex items-center justify-center bg-gray-50">
          {quantity}
        </span>
        <button
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleQuantityChange(1)}
          disabled={!isStoreOpen}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <button
        className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center transition-colors ${
          isStoreOpen 
            ? 'bg-primary text-white hover:bg-primary-dark' 
            : 'bg-gray-400 text-white cursor-not-allowed'
        }`}
        onClick={handleAddToCart}
        disabled={isAdding || !isStoreOpen}
        data-testid="add-to-cart-btn"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        <span>{isStoreOpen ? 'Adicionar' : 'Restaurante Fechado'}</span>
      </button>
    </div>
  );
} 