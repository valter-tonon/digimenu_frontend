'use client';

import { useState } from 'react';
import { useMenu } from '@/infrastructure/context/MenuContext';

interface OrderSummaryProps {
  onClose: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryName?: string;
  observation?: string;
  additionals?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export function OrderSummary({ onClose }: OrderSummaryProps) {
  const menu = useMenu();
  const { cartItems, formatPrice, removeFromCart } = menu;
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});

  // Calcular o total do pedido
  const total = cartItems.reduce((acc: number, item: CartItem) => {
    return acc + (item.price * item.quantity);
  }, 0);

  // Remover item do carrinho
  const handleRemoveItem = async (itemId: string) => {
    setIsRemoving(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Erro ao remover item:', error);
    } finally {
      setIsRemoving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Agrupar itens por categoria para melhor visualização
  const itemsByCategory = cartItems.reduce((acc: Record<string, CartItem[]>, item: CartItem) => {
    const categoryName = item.categoryName || 'Sem categoria';
    
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    
    acc[categoryName].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Resumo do Pedido</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-2">{category}</h3>
                  <div className="space-y-3">
                    {items.map((item: CartItem) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">{item.quantity}x</span>
                            <span className="ml-2">{item.name}</span>
                          </div>
                          {item.additionals && item.additionals.length > 0 && (
                            <ul className="mt-1 ml-6 text-sm text-gray-600">
                              {item.additionals.map((additional) => (
                                <li key={additional.id}>
                                  + {additional.name} ({formatPrice(additional.price)})
                                </li>
                              ))}
                            </ul>
                          )}
                          {item.observation && (
                            <p className="mt-1 ml-6 text-sm text-gray-600 italic">
                              Obs: {item.observation}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isRemoving[item.id]}
                            className="text-red-500 hover:text-red-700 text-sm mt-1 flex items-center"
                          >
                            {isRemoving[item.id] ? (
                              <div className="h-3 w-3 border-t-transparent border-2 border-red-500 rounded-full animate-spin mr-1"></div>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors mr-2"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 