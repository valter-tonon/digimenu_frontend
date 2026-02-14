'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Heart,
  Clock,
  MapPin,
  ChevronDown,
  Circle
} from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/hooks/useAuth';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { CompactStoreHeader } from './StoreHeader';
import { NotificationBadge } from '../notifications/NotificationBadge';
import { WaiterCallButton } from './WaiterCallButton';
import Link from 'next/link';

interface MenuHeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  storeName?: string;
  storeLogo?: string | null;
  openingHours?: {
    opens_at: string;
    closes_at: string;
    is_open: boolean;
  };
  minOrderValue?: number;
  tableId?: string | null;
  storeId?: string | null;
}

/** Dados unificados do cliente (auth tradicional + WhatsApp) */
interface UnifiedCustomer {
  name: string;
  phone?: string;
  email?: string;
  source: 'traditional' | 'whatsapp';
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
  const { data } = useAppContext();
  const { isAuthenticated: isTraditionalAuth, customer: traditionalCustomer, logoutUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Estado unificado de autenticação (auth tradicional + WhatsApp)
  const [whatsappUser, setWhatsappUser] = useState<UnifiedCustomer | null>(null);

  // Verificar autenticação WhatsApp ao montar e quando o perfil abre
  useEffect(() => {
    const checkWhatsAppAuth = () => {
      try {
        const jwt = whatsappAuthService.getCurrentJWT();
        if (jwt) {
          const storedAuth = whatsappAuthService.getStoredAuth();
          if (storedAuth?.user) {
            setWhatsappUser({
              name: storedAuth.user.name,
              phone: storedAuth.user.phone,
              email: storedAuth.user.email,
              source: 'whatsapp',
            });
            return;
          }
        }
        setWhatsappUser(null);
      } catch {
        setWhatsappUser(null);
      }
    };

    checkWhatsAppAuth();

    // Re-verificar a cada 30s para capturar login feito em outra aba/checkout
    const interval = setInterval(checkWhatsAppAuth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Estado unificado: autenticado se qualquer sistema tiver sessão
  const isUserAuthenticated = isTraditionalAuth || !!whatsappUser;
  const unifiedCustomer: UnifiedCustomer | null = traditionalCustomer
    ? {
        name: traditionalCustomer.name,
        phone: traditionalCustomer.phone || traditionalCustomer.mobile_phone,
        email: traditionalCustomer.email,
        source: 'traditional',
      }
    : whatsappUser;

  // Detectar scroll para animar o header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const finalStoreName = propStoreName || data?.storeName || 'Restaurante';
  const finalStoreLogo = propStoreLogo;

  const handleLogout = useCallback(async () => {
    try {
      // Limpar auth tradicional
      await logoutUser();
      // Limpar auth WhatsApp
      whatsappAuthService.clearAuth();
      setWhatsappUser(null);
      // Limpar dados do cliente salvos localmente
      localStorage.removeItem('customer_phone');
      setProfileOpen(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [logoutUser]);

  const getCurrentContext = () => {
    if (tableId) {
      // Usar o displayName da mesa se disponível no contexto (já formatado)
      if (data?.tableData?.displayName) {
        return data.tableData.displayName;
      }
      
      // Usar o identifier da mesa se disponível no contexto
      if (data?.tableData?.identifier) {
        // Se o identifier é algo como "mesa-1", converter para "Mesa 1"
        if (data.tableData.identifier.startsWith('mesa-')) {
          const mesaNumber = data.tableData.identifier.replace('mesa-', '');
          return `Mesa ${mesaNumber}`;
        }
        return data.tableData.identifier;
      }
      
      // Usar description da mesa se disponível
      if (data?.tableData?.description) {
        // Extrair apenas o nome da mesa da descrição (ex: "Mesa 1 - Mesa para 4 pessoas" -> "Mesa 1")
        const match = data.tableData.description.match(/^(Mesa \d+)/);
        if (match) {
          return match[1];
        }
        return data.tableData.description;
      }
      
      // Fallback: usar o tableId diretamente se for um identifier válido
      if (tableId.startsWith('mesa-')) {
        const mesaNumber = tableId.replace('mesa-', '');
        return `Mesa ${mesaNumber}`;
      }
      
      // Último fallback: tentar extrair um número mais legível do UUID
      if (tableId.length > 10) {
        // Se é um UUID longo, tentar buscar na API ou usar fallback
        return `Mesa ${tableId.slice(-4)}`;
      }
      
      return `Mesa ${tableId}`;
    }
    return 'Delivery';
  };

  const formatTime = (time: string) => {
    return time.replace(':', 'h');
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

          {/* Status de Abertura e Horário */}
          {openingHours && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              <Circle 
                className={`w-2 h-2 ${
                  openingHours.is_open ? 'text-green-500 fill-current' : 'text-red-500 fill-current'
                }`} 
              />
              <span className={openingHours.is_open ? 'text-green-700' : 'text-red-700'}>
                {openingHours.is_open ? 'Aberto' : 'Fechado'}
              </span>
              <span className="text-gray-500">
                {formatTime(openingHours.opens_at)} - {formatTime(openingHours.closes_at)}
              </span>
            </div>
          )}

          {/* Indicador de Contexto */}
          {tableId && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
              <MapPin className="w-4 h-4" />
              {getCurrentContext()}
            </div>
          )}

          {/* Ações do Header */}
          <div className="flex items-center gap-2">
            {/* Notificações - Habilitado apenas para usuários autenticados */}
            {isUserAuthenticated && (
              <NotificationBadge storeId={storeId || undefined} tableId={tableId || undefined} />
            )}

            {/* Botão de chamar garçom - apenas para mesas quando a loja está aberta */}
            {tableId && storeId && openingHours?.is_open && (
              <div className="hidden sm:block">
                <WaiterCallButton
                  storeId={storeId}
                  tableId={tableId}
                  variant="header"
                />
              </div>
            )}

            {/* Carrinho */}
            <button
              onClick={onCartClick}
              className="relative p-2 text-gray-600 hover:text-amber-500 transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-6 w-6" />
              
              {/* Badge do carrinho */}
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full min-w-[20px] h-5">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </button>

            {/* Perfil do Usuário - Visível para qualquer usuário autenticado (tradicional ou WhatsApp) */}
            {isUserAuthenticated && unifiedCustomer && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 text-gray-600 hover:text-amber-500 transition-colors rounded-lg hover:bg-gray-50"
                  aria-label="Menu do usuário"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                  {/* Nome abreviado em telas maiores */}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {unifiedCustomer.name.split(' ')[0]}
                  </span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      profileOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Dropdown do Perfil */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Contexto atual */}
                    {tableId && (
                      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">
                              {getCurrentContext()}
                            </p>
                            <p className="text-xs text-amber-600">Contexto atual</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status da Loja */}
                    {openingHours && (
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Circle 
                            className={`w-3 h-3 ${
                              openingHours.is_open ? 'text-green-500 fill-current' : 'text-red-500 fill-current'
                            }`} 
                          />
                          <div>
                            <p className={`text-sm font-medium ${
                              openingHours.is_open ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {openingHours.is_open ? 'Loja Aberta' : 'Loja Fechada'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatTime(openingHours.opens_at)} - {formatTime(openingHours.closes_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pedido Mínimo */}
                    {minOrderValue && (
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-700">
                              Pedido Mínimo
                            </p>
                            <p className="text-xs text-blue-600">
                              R$ {minOrderValue.toFixed(2).replace('.', ',')}
                            </p>
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
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {unifiedCustomer.name}
                          </p>
                          {unifiedCustomer.phone && (
                            <p className="text-sm text-gray-500">
                              {unifiedCustomer.phone}
                            </p>
                          )}
                          {unifiedCustomer.email && (
                            <p className="text-xs text-gray-400 truncate">
                              {unifiedCustomer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Links do menu */}
                    <div className="py-2">
                      <Link
                        href={`/${storeId}/orders`}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Clock className="w-4 h-4" />
                        <div>
                          <span className="block">Meus Pedidos</span>
                          <span className="block text-xs text-gray-400">Acompanhe e veja o histórico</span>
                        </div>
                      </Link>

                      <Link
                        href={`/${storeId}/profile?tab=addresses`}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <MapPin className="w-4 h-4" />
                        <div>
                          <span className="block">Meus Endereços</span>
                          <span className="block text-xs text-gray-400">Editar ou escolher o principal</span>
                        </div>
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
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-md"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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