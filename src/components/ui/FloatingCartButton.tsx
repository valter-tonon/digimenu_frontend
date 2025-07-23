'use client';

import { ShoppingCart, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useRouter } from 'next/navigation';

interface FloatingCartButtonProps {
  storeId: string;
  tableId?: string;
  className?: string;
}

export function FloatingCartButton({ storeId, tableId, className = '' }: FloatingCartButtonProps) {
  const router = useRouter();
  const { totalItems, totalPrice, deliveryMode } = useCartStore();
  
  const itemCount = totalItems();
  const total = totalPrice();

  const handleClick = () => {
    if (itemCount === 0) return; // Não fazer nada se o carrinho estiver vazio
    
    if (tableId) {
      router.push(`/${storeId}/${tableId}/cart`);
    } else {
      // Para fluxo de delivery direto
      router.push(`/${storeId}/checkout`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Estilo inspirado no exemplo de referência
  return (
    <button
      onClick={handleClick}
      disabled={itemCount === 0}
      className={`fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-auto ${
        itemCount === 0 ? 'bg-amber-400/90' : 'bg-primary'
      } text-white rounded-full shadow-lg floating-element z-floating-cart ${className}`}
      aria-label={itemCount === 0 ? 'Carrinho Vazio' : `Ver carrinho com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
    >
      <div className="flex items-center justify-center md:justify-start px-6 py-3">
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>
        
        {itemCount === 0 ? (
          <span className="ml-3 font-medium">Carrinho Vazio</span>
        ) : (
          <>
            <div className="ml-3 text-left">
              <div className="text-sm font-medium">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </div>
              <div className="text-xs opacity-90">
                {formatPrice(total)}
              </div>
            </div>
            
            <div className="hidden md:block ml-3 pl-3 border-l border-white/20">
              <div className="text-xs font-medium">
                {deliveryMode ? 'Checkout' : 'Ver carrinho'}
              </div>
            </div>
          </>
        )}
      </div>
    </button>
  );
}

// Versão compacta do botão (apenas ícone)
export function CompactFloatingCartButton({ storeId, tableId, className = '' }: FloatingCartButtonProps) {
  const router = useRouter();
  const { totalItems } = useCartStore();
  
  const itemCount = totalItems();

  // Não mostrar o botão se não há itens no carrinho
  if (itemCount === 0) return null;

  const handleClick = () => {
    if (tableId) {
      router.push(`/${storeId}/${tableId}/cart`);
    } else {
      router.push(`/${storeId}/checkout`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 bg-primary text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-40 ${className}`}
      aria-label={`Ver carrinho com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </button>
  );
}