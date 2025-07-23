import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart-store';

/**
 * Hook personalizado para sincronizar o contador de itens do carrinho
 * com o conteúdo real do carrinho armazenado no Zustand store.
 * 
 * @returns {Object} Objeto contendo o contador de itens e funções para manipular o carrinho
 */
export function useCartSync() {
  const store = useCartStore();
  const [itemCount, setItemCount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  // Sincronizar o contador de itens com o conteúdo do carrinho
  useEffect(() => {
    // Função para atualizar o contador
    const updateCounters = () => {
      // Garantir que o carrinho seja sincronizado antes de contar
      store.syncCart();
      
      // Atualizar contador de itens
      const count = store.totalItems();
      setItemCount(count);
      
      // Atualizar preço total
      const price = store.totalPrice();
      setTotalPrice(price);
    };
    
    // Atualizar imediatamente
    updateCounters();
    
    // Configurar um intervalo para verificar periodicamente
    // Isso ajuda a garantir que o contador esteja sempre atualizado
    const intervalId = setInterval(updateCounters, 5000);
    
    // Adicionar listener para eventos de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateCounters();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpar intervalo e listener quando o componente for desmontado
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [store]);
  
  return {
    itemCount,
    totalPrice,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateItem: store.updateItem,
    clearCart: store.clearCart,
    items: store.items
  };
}