'use client';

import { useMenu } from '@/infrastructure/context/MenuContext';
import { useState, useEffect } from 'react';

interface MenuHeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  storeName?: string;
}

export function MenuHeader({ cartItemsCount, onCartClick, storeName: propStoreName }: MenuHeaderProps) {
  const { tableId, storeSlug } = useMenu();
  const [storeName, setStoreName] = useState<string>(propStoreName || 'FoodMenu');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  
  useEffect(() => {
    if (propStoreName) {
      setStoreName(propStoreName);
    }
  }, [propStoreName]);
  
  const handleCartClick = () => {
    onCartClick();
  };
  
  return (
    <header className="w-full bg-white shadow-sm py-4 px-4 sticky top-0 z-10">
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center">
          {storeLogo ? (
            <img 
              src={storeLogo} 
              alt={storeName || 'Logo'} 
              className="h-10 w-auto mr-3"
            />
          ) : (
            <div className="text-2xl font-bold text-amber-500 mr-2">
              FoodMenu
            </div>
          )}
          
          {storeName && (
            <h1 className="text-xl font-semibold text-gray-800">{storeName}</h1>
          )}
        </div>
        
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
      
      {/* Informações da loja e mesa */}
      {(storeSlug || tableId) && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          {storeSlug && (
            <div className="bg-gray-100 px-2 py-1 rounded-md mr-2">
              Loja: {storeSlug}
            </div>
          )}
          {tableId && (
            <div className="bg-gray-100 px-2 py-1 rounded-md">
              Mesa: {tableId}
            </div>
          )}
        </div>
      )}
    </header>
  );
} 