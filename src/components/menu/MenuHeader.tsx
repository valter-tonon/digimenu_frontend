'use client';

import { useMenu } from '@/infrastructure/context/MenuContext';
import { useState, useEffect } from 'react';
import { apiClient } from '@/infrastructure/api/apiClient';

interface MenuHeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  storeName?: string;
  storeLogo?: string;
}

export function MenuHeader({ 
  cartItemsCount, 
  onCartClick, 
  storeName: propStoreName,
  storeLogo: propStoreLogo 
}: MenuHeaderProps) {
  const { tableId, storeSlug } = useMenu();
  const [storeName, setStoreName] = useState<string>(propStoreName || 'FoodMenu');
  const [storeLogo, setStoreLogo] = useState<string | null>(propStoreLogo || null);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  
  useEffect(() => {
    if (propStoreName) {
      setStoreName(propStoreName);
    }
    if (propStoreLogo) {
      setStoreLogo(propStoreLogo);
    }
  }, [propStoreName, propStoreLogo]);
  
  const handleCartClick = () => {
    onCartClick();
  };
  
  // Função para chamar o garçom
  const callWaiter = async () => {
    if (isCallingWaiter || waiterCalled || !tableId || !storeSlug) return;
    
    setIsCallingWaiter(true);
    try {
      console.log('Chamando garçom para:', { storeId: storeSlug, tableId });
      await apiClient.post<any>('/waiter-calls', {
        store_id: storeSlug,
        table_id: tableId,
      });
      
      setWaiterCalled(true);
      
      // Reset após 30 segundos
      setTimeout(() => {
        setWaiterCalled(false);
      }, 30000);
    } catch (error) {
      console.error('Erro ao chamar garçom:', error);
    } finally {
      setIsCallingWaiter(false);
    }
  };
  
  return (
    <header className="w-full bg-white shadow-sm py-4 px-4 sticky top-0 z-10">
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center">
          {storeLogo ? (
            <img 
              src={storeLogo} 
              alt={storeName || 'Logo'} 
              className="h-12 w-auto mr-3 rounded-full object-cover border-2 border-amber-500"
            />
          ) : (
            <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
              {storeName ? storeName.charAt(0).toUpperCase() : 'F'}
            </div>
          )}
          
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{storeName}</h1>
            <p className="text-xs text-gray-500">Cardápio Digital</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botão de chamar garçom */}
          {tableId && (
            <button
              onClick={callWaiter}
              disabled={isCallingWaiter || waiterCalled}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                waiterCalled 
                  ? 'bg-green-500 text-white' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isCallingWaiter ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
              <span>{waiterCalled ? 'Garçom chamado' : 'Chamar Garçom'}</span>
            </button>
          )}
          
          {/* Botão do carrinho */}
          <button 
            onClick={handleCartClick}
            className="relative p-2 text-gray-600 hover:text-amber-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Informações da mesa */}
      {tableId && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <div className="bg-gray-100 px-2 py-1 rounded-md">
            Mesa: {tableId}
          </div>
        </div>
      )}
    </header>
  );
} 