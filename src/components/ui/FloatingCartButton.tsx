'use client';

import { ShoppingCart } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
  className?: string;
}

export function FloatingCartButton({ itemCount, onClick, className = '' }: FloatingCartButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 ${itemCount > 0 ? 'animate-pulse' : ''} ${className}`}
      aria-label="Abrir carrinho"
      data-testid="cart-btn"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-bounce">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </button>
  );
}