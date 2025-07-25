'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Heart,
  Clock,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import { CompactStoreHeader } from './StoreHeader';
import { NotificationBadge } from '../notifications/NotificationBadge';
import Link from 'next/link';

interface MenuHeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  storeName?: string;
  storeLogo?: string;
  openingHours?: {
    opens_at: string;
    closes_at: string;
    is_open: boolean;
  };
  minOrderValue?: number;
  tableId?: string | null;
  storeId?: string | null;
}

export function MenuHeader({ 
  cartItemsCount, 
  onCartClick, 
  storeName: propStoreName,
  storeLogo: propStoreLogo,
  openingHours,
  minOrderValue,
  tableId,
  storeId
}: MenuHeaderProps) {
  const router = useRouter();
  const { data } = useAppContext();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar scroll para animar o header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartItemCount = 0; // TODO: Implementar carrinho
  const finalStoreName = propStoreName || data?.storeName || 'Restaurante';
  const finalStoreLogo = propStoreLogo;

  const handleLogout = () => {
    // TODO: Implementar logout
    console.log('Logout');
  };

  const getCurrentContext = () => {
    if (tableId) {
      return `Mesa ${tableId.slice(-4)}`;
    }
    return 'Delivery';
  };

  return (
    <header className={`w-full py-4 px-4 sticky top-0 z-header transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo da Loja - Agora clicável */}
          <Link
            href={tableId ? `/${storeId}/${tableId}` : `/${storeId}`}
            className="flex-1 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <CompactStoreHeader
              storeName={finalStoreName}
              storeLogo={finalStoreLogo}
              className="flex-1"
            />
          </Link>

          {/* Indicador de Contexto */}
          {tableId && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
              <MapPin className="w-4 h-4" />
              {getCurrentContext()}
            </div>
          )}

          {/* Ações do Header */}
          <div className="flex items-center gap-2">
            {/* Notificações */}
            <NotificationBadge storeId={storeId || undefined} tableId={tableId || undefined} />

            {/* Carrinho */}
            <button
              onClick={() => router.push(`/${storeId}/cart`)}
              className="relative p-2 text-gray-600 hover:text-amber-500 transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-6 w-6" />
              
              {/* Badge do carrinho */}
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full min-w-[20px] h-5">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            {/* Perfil do Usuário */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 text-gray-600 hover:text-amber-500 transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Menu do usuário"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-amber-600" />
                </div>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    profileOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown do Perfil */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  {/* Contexto atual */}
                  {tableId && (
                    <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            Mesa {tableId.slice(-4)}
                          </p>
                          <p className="text-xs text-amber-600">Contexto atual</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações do usuário */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Visitante
                        </p>
                        <p className="text-sm text-gray-500">
                          Não autenticado
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Links do menu */}
                  <div className="py-2">
                    <Link
                      href={`/${storeId}/profile`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Meu Perfil</span>
                    </Link>

                    <Link
                      href={`/${storeId}/orders`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Histórico de Pedidos</span>
                    </Link>

                    <Link
                      href={`/${storeId}/favorites`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Heart className="w-4 h-4" />
                      <span>Favoritos</span>
                    </Link>

                    <Link
                      href={`/${storeId}/settings`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </Link>
                  </div>

                  {/* Botão de logout */}
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-md"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para fechar o dropdown */}
      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          className="fixed inset-0 z-40"
        />
      )}
    </header>
  );
} 