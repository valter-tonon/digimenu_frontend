'use client';

import { ShoppingCart, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CartModal } from '../ui/CartModal';
import { LoginModal } from '../ui/LoginModal';
import { useCartStore } from '@/store/cart';

export function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="bg-white shadow-sm fixed w-full top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">Restaurante</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link 
                href="/menu" 
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Cardápio
              </Link>
              <Link 
                href="/sobre" 
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Sobre
              </Link>
              <Link 
                href="/contato" 
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Contato
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <User className="w-6 h-6 text-gray-600 hover:text-primary transition-colors" />
              </button>
              
              <button 
                className="relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-primary transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </button>

              <button className="md:hidden">
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Espaçador para compensar o header fixo */}
      <div className="h-16" />

      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
} 