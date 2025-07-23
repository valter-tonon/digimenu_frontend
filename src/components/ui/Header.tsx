'use client';

import { Search, User, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { LoginModal } from './LoginModal';
import { useCartStore } from '@/store/cart-store';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function Header({ searchTerm, onSearchChange }: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { totalItems } = useCartStore();

  return (
    <>
      <header className="w-full bg-white shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Logo e Ícones */}
          <div className="py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">FoodMenu</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <User className="w-6 h-6 text-gray-700" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <span className="relative">
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  {totalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems()}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="py-4 border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full py-3 px-4 pl-12 rounded-lg border border-gray-200"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
} 